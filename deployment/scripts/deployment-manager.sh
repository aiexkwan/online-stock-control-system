#!/bin/bash

# Deployment Manager Script for NewPennine WMS
# This script provides a unified interface for managing blue-green deployments

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="$PROJECT_ROOT/deployment/config/deployment.conf"
LOG_FILE="/var/log/newpennine-deployment-manager.log"

# Load configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
fi

# Default configuration
ENVIRONMENTS=${ENVIRONMENTS:-"production staging development"}
DEFAULT_ENVIRONMENT=${DEFAULT_ENVIRONMENT:-"production"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
MONITORING_ENABLED=${MONITORING_ENABLED:-true}
NOTIFICATION_ENABLED=${NOTIFICATION_ENABLED:-true}

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to validate environment
validate_environment() {
    local env=$1
    if [[ ! "$ENVIRONMENTS" =~ $env ]]; then
        error "Invalid environment: $env. Valid environments: $ENVIRONMENTS"
        return 1
    fi
    return 0
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        return 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        return 1
    fi
    
    # Check deployment scripts
    if [[ ! -f "$SCRIPT_DIR/blue-green-deploy.sh" ]]; then
        error "Blue-green deployment script not found"
        return 1
    fi
    
    # Check configuration files
    if [[ ! -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        error "Production docker-compose file not found"
        return 1
    fi
    
    # Check if required directories exist
    local required_dirs=(
        "$PROJECT_ROOT/deployment/nginx/conf.d"
        "$PROJECT_ROOT/deployment/monitoring"
        "$PROJECT_ROOT/deployment/scripts"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            error "Required directory not found: $dir"
            return 1
        fi
    done
    
    log "Prerequisites check passed"
    return 0
}

# Function to create backup
create_backup() {
    local environment=$1
    local backup_name="backup-$environment-$(date +%Y%m%d-%H%M%S)"
    local backup_dir="/opt/newpennine/backups"
    
    log "Creating backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Backup configuration
    tar -czf "$backup_dir/$backup_name-config.tar.gz" \
        "$PROJECT_ROOT/deployment" \
        "$PROJECT_ROOT/docker-compose.prod.yml" \
        "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    # Backup database (if applicable)
    if [[ -n "${DATABASE_BACKUP_ENABLED:-}" ]]; then
        log "Creating database backup..."
        # Add database backup logic here
        # pg_dump or mysqldump commands
    fi
    
    # Backup application data
    if docker ps --format "table {{.Names}}" | grep -q "newpennine-"; then
        log "Creating application data backup..."
        docker run --rm \
            --volumes-from newpennine-redis \
            -v "$backup_dir:/backup" \
            alpine tar czf "/backup/$backup_name-redis.tar.gz" /data
    fi
    
    log "Backup created: $backup_name"
    
    # Cleanup old backups
    find "$backup_dir" -name "backup-*" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    echo "$backup_name"
}

# Function to restore backup
restore_backup() {
    local backup_name=$1
    local backup_dir="/opt/newpennine/backups"
    
    log "Restoring backup: $backup_name"
    
    # Restore configuration
    if [[ -f "$backup_dir/$backup_name-config.tar.gz" ]]; then
        tar -xzf "$backup_dir/$backup_name-config.tar.gz" -C "$PROJECT_ROOT"
        log "Configuration restored"
    fi
    
    # Restore Redis data
    if [[ -f "$backup_dir/$backup_name-redis.tar.gz" ]]; then
        docker run --rm \
            --volumes-from newpennine-redis \
            -v "$backup_dir:/backup" \
            alpine tar xzf "/backup/$backup_name-redis.tar.gz" -C /
        log "Redis data restored"
    fi
    
    log "Backup restored successfully"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ "$NOTIFICATION_ENABLED" == "true" ]]; then
        # Slack notification
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"$status: $message\"}" \
                "$SLACK_WEBHOOK_URL" || true
        fi
        
        # Email notification
        if [[ -n "${EMAIL_NOTIFICATION:-}" ]]; then
            echo "$message" | mail -s "NewPennine Deployment $status" "$EMAIL_NOTIFICATION" || true
        fi
    fi
}

# Function to perform deployment
perform_deployment() {
    local environment=$1
    local version=${2:-"latest"}
    
    log "Starting deployment to $environment environment with version $version"
    
    # Validate environment
    if ! validate_environment "$environment"; then
        return 1
    fi
    
    # Check prerequisites
    if ! check_prerequisites; then
        return 1
    fi
    
    # Create backup
    local backup_name
    backup_name=$(create_backup "$environment")
    
    # Set environment variables
    export DEPLOYMENT_ENVIRONMENT="$environment"
    export DEPLOYMENT_VERSION="$version"
    export DEPLOYMENT_TIMESTAMP=$(date +%s)
    export DEPLOYMENT_BACKUP="$backup_name"
    
    # Run deployment
    if "$SCRIPT_DIR/blue-green-deploy.sh" deploy; then
        log "Deployment successful"
        send_notification "SUCCESS" "Deployment to $environment completed successfully"
        return 0
    else
        error "Deployment failed"
        send_notification "FAILED" "Deployment to $environment failed"
        
        # Attempt rollback
        log "Attempting automatic rollback..."
        if "$SCRIPT_DIR/blue-green-deploy.sh" rollback; then
            log "Rollback successful"
            send_notification "ROLLBACK" "Deployment failed but rollback successful"
        else
            error "Rollback failed - manual intervention required"
            send_notification "CRITICAL" "Deployment and rollback failed - manual intervention required"
        fi
        
        return 1
    fi
}

# Function to scale deployment
scale_deployment() {
    local environment=$1
    local service=$2
    local replicas=$3
    
    log "Scaling $service in $environment to $replicas replicas"
    
    # Update docker-compose file
    case "$service" in
        "app")
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d --scale newpennine-blue="$replicas" --scale newpennine-green="$replicas"
            ;;
        "redis")
            log "Redis scaling not supported in current configuration"
            ;;
        *)
            error "Unknown service: $service"
            return 1
            ;;
    esac
    
    log "Scaling completed"
}

# Function to manage environment
manage_environment() {
    local action=$1
    local environment=$2
    
    case "$action" in
        "start")
            log "Starting $environment environment"
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d
            ;;
        "stop")
            log "Stopping $environment environment"
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down
            ;;
        "restart")
            log "Restarting $environment environment"
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" restart
            ;;
        "logs")
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" logs -f
            ;;
        *)
            error "Unknown action: $action"
            return 1
            ;;
    esac
}

# Function to show deployment status
show_status() {
    local environment=${1:-"all"}
    
    log "Deployment status for $environment"
    
    echo "=== Container Status ==="
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
    
    echo ""
    echo "=== Health Status ==="
    "$SCRIPT_DIR/health-check.sh" check "$environment"
    
    echo ""
    echo "=== Resource Usage ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "=== Deployment History ==="
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -10
}

# Function to show help
show_help() {
    cat << EOF
NewPennine WMS Deployment Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  deploy [environment] [version]  - Deploy to specified environment
  rollback [environment]          - Rollback deployment
  status [environment]            - Show deployment status
  scale [environment] [service] [replicas] - Scale service
  backup [environment]            - Create manual backup
  restore [backup_name]           - Restore from backup
  start [environment]             - Start environment
  stop [environment]              - Stop environment
  restart [environment]           - Restart environment
  logs [environment]              - View logs
  health [environment]            - Check health
  cleanup                         - Cleanup old resources
  
Options:
  -h, --help                      - Show this help message
  -v, --verbose                   - Enable verbose logging
  -f, --force                     - Force operation
  
Environment variables:
  DEPLOYMENT_ENVIRONMENT          - Target environment
  DEPLOYMENT_VERSION              - Application version
  SLACK_WEBHOOK_URL               - Slack notification webhook
  EMAIL_NOTIFICATION              - Email for notifications
  
Examples:
  $0 deploy production latest
  $0 rollback production
  $0 status
  $0 scale production app 3
  $0 backup production
  $0 health production
  
Configuration:
  Edit $CONFIG_FILE to customize deployment settings
  
Logs:
  Deployment logs are stored in $LOG_FILE
EOF
}

# Main function
main() {
    local command=${1:-"help"}
    
    case "$command" in
        "deploy")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            local version=${3:-"latest"}
            perform_deployment "$environment" "$version"
            ;;
        "rollback")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            "$SCRIPT_DIR/blue-green-deploy.sh" rollback
            ;;
        "status")
            local environment=${2:-"all"}
            show_status "$environment"
            ;;
        "scale")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            local service=$3
            local replicas=$4
            scale_deployment "$environment" "$service" "$replicas"
            ;;
        "backup")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            create_backup "$environment"
            ;;
        "restore")
            local backup_name=$2
            restore_backup "$backup_name"
            ;;
        "start"|"stop"|"restart"|"logs")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            manage_environment "$command" "$environment"
            ;;
        "health")
            local environment=${2:-$DEFAULT_ENVIRONMENT}
            "$SCRIPT_DIR/health-check.sh" check "$environment"
            ;;
        "cleanup")
            log "Cleaning up old resources..."
            docker system prune -f
            docker volume prune -f
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"