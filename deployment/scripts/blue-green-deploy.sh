#!/bin/bash

# Blue-Green Deployment Script for NewPennine WMS
# This script performs zero-downtime deployment using blue-green strategy

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NGINX_CONF_DIR="$PROJECT_ROOT/deployment/nginx/conf.d"
HEALTH_CHECK_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10
DEPLOYMENT_LOG="/var/log/newpennine-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to get current active environment
get_active_environment() {
    local nginx_conf="$NGINX_CONF_DIR/newpennine.conf"
    if grep -q "server newpennine-blue:3000 weight=100" "$nginx_conf"; then
        echo "blue"
    elif grep -q "server newpennine-green:3000 weight=100" "$nginx_conf"; then
        echo "green"
    else
        echo "unknown"
    fi
}

# Function to get inactive environment
get_inactive_environment() {
    local active=$(get_active_environment)
    if [ "$active" = "blue" ]; then
        echo "green"
    elif [ "$active" = "green" ]; then
        echo "blue"
    else
        echo "unknown"
    fi
}

# Function to check if container is healthy
check_container_health() {
    local container_name=$1
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempts=0
    
    log "Checking health of $container_name..."
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec "$container_name" curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
            log "$container_name is healthy"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log "Health check attempt $attempts/$max_attempts for $container_name"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "$container_name failed health check after $max_attempts attempts"
    return 1
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    local environment=$1
    local container_name="newpennine-$environment"
    
    log "Performing comprehensive health check for $environment environment..."
    
    # Check container status
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        error "$container_name is not running"
        return 1
    fi
    
    # Check basic health endpoint
    if ! check_container_health "$container_name"; then
        return 1
    fi
    
    # Check critical endpoints
    local endpoints=("/api/v1/health" "/api/v1/metrics" "/api/admin/dashboard")
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        if ! docker exec "$container_name" curl -f "http://localhost:3000$endpoint" > /dev/null 2>&1; then
            error "Endpoint $endpoint is not responding in $environment environment"
            return 1
        fi
    done
    
    # Check database connectivity
    log "Testing database connectivity..."
    if ! docker exec "$container_name" node -e "
        const { createClient } = require('@supabase/supabase-js');
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        client.from('data_code').select('count').limit(1).then(r => {
            if (r.error) throw r.error;
            console.log('Database connection successful');
            process.exit(0);
        }).catch(e => {
            console.error('Database connection failed:', e.message);
            process.exit(1);
        });
    " > /dev/null 2>&1; then
        error "Database connectivity test failed for $environment environment"
        return 1
    fi
    
    log "Comprehensive health check passed for $environment environment"
    return 0
}

# Function to build and deploy to inactive environment
deploy_to_inactive() {
    local inactive_env=$(get_inactive_environment)
    local container_name="newpennine-$inactive_env"
    
    log "Deploying to inactive environment: $inactive_env"
    
    # Set deployment metadata
    export DEPLOYMENT_VERSION="${DEPLOYMENT_VERSION:-$(git rev-parse HEAD)}"
    export DEPLOYMENT_TIMESTAMP=$(date +%s)
    
    # Stop the inactive container
    log "Stopping $container_name..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" stop "$container_name" || true
    
    # Remove the inactive container
    log "Removing $container_name..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" rm -f "$container_name" || true
    
    # Build and start the new container
    log "Building and starting $container_name..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d "$container_name"
    
    # Wait for container to be ready
    log "Waiting for $container_name to be ready..."
    sleep 30
    
    # Perform health check
    if ! comprehensive_health_check "$inactive_env"; then
        error "Health check failed for $inactive_env environment"
        return 1
    fi
    
    log "Successfully deployed to $inactive_env environment"
    return 0
}

# Function to switch traffic to new environment
switch_traffic() {
    local new_active_env=$(get_inactive_environment)
    local old_active_env=$(get_active_environment)
    
    log "Switching traffic from $old_active_env to $new_active_env..."
    
    # Create backup of current nginx configuration
    cp "$NGINX_CONF_DIR/newpennine.conf" "$NGINX_CONF_DIR/newpennine.conf.backup.$(date +%s)"
    
    # Update nginx configuration
    local nginx_conf="$NGINX_CONF_DIR/newpennine.conf"
    
    if [ "$new_active_env" = "blue" ]; then
        # Switch to blue
        sed -i 's/server newpennine-blue:3000 weight=0 max_fails=3 fail_timeout=30s backup;/server newpennine-blue:3000 weight=100 max_fails=3 fail_timeout=30s;/' "$nginx_conf"
        sed -i 's/server newpennine-green:3000 weight=100 max_fails=3 fail_timeout=30s;/server newpennine-green:3000 weight=0 max_fails=3 fail_timeout=30s backup;/' "$nginx_conf"
    else
        # Switch to green
        sed -i 's/server newpennine-green:3000 weight=0 max_fails=3 fail_timeout=30s backup;/server newpennine-green:3000 weight=100 max_fails=3 fail_timeout=30s;/' "$nginx_conf"
        sed -i 's/server newpennine-blue:3000 weight=100 max_fails=3 fail_timeout=30s;/server newpennine-blue:3000 weight=0 max_fails=3 fail_timeout=30s backup;/' "$nginx_conf"
    fi
    
    # Reload nginx configuration
    log "Reloading nginx configuration..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec nginx nginx -t
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec nginx nginx -s reload
    
    # Verify the switch was successful
    sleep 5
    local current_active=$(get_active_environment)
    if [ "$current_active" = "$new_active_env" ]; then
        log "Traffic successfully switched to $new_active_env environment"
        return 0
    else
        error "Failed to switch traffic to $new_active_env environment"
        return 1
    fi
}

# Function to perform post-deployment verification
post_deployment_verification() {
    local active_env=$(get_active_environment)
    
    log "Performing post-deployment verification..."
    
    # Test external access through nginx
    log "Testing external access..."
    if ! curl -f http://localhost/api/v1/health > /dev/null 2>&1; then
        error "External health check failed"
        return 1
    fi
    
    # Test key user flows
    log "Testing key user flows..."
    
    # Test login page
    if ! curl -f http://localhost/main-login > /dev/null 2>&1; then
        error "Login page access failed"
        return 1
    fi
    
    # Test admin dashboard
    if ! curl -f http://localhost/admin > /dev/null 2>&1; then
        error "Admin dashboard access failed"
        return 1
    fi
    
    # Performance check
    log "Running performance check..."
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost/api/v1/health)
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        warning "Response time is high: ${response_time}s"
    else
        log "Response time is acceptable: ${response_time}s"
    fi
    
    log "Post-deployment verification completed successfully"
    return 0
}

# Function to cleanup old environment
cleanup_old_environment() {
    local old_env=$(get_inactive_environment)
    local container_name="newpennine-$old_env"
    
    log "Cleaning up old environment: $old_env"
    
    # Give some time for connections to drain
    sleep 30
    
    # Stop the old container
    log "Stopping $container_name..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" stop "$container_name"
    
    # Remove old images (keep last 3 versions)
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Clean up old nginx configuration backups (keep last 10)
    find "$NGINX_CONF_DIR" -name "newpennine.conf.backup.*" -type f | sort | head -n -10 | xargs rm -f
    
    log "Cleanup completed for $old_env environment"
}

# Function to rollback deployment
rollback_deployment() {
    local current_active=$(get_active_environment)
    local rollback_to=$(get_inactive_environment)
    
    error "Rolling back deployment from $current_active to $rollback_to..."
    
    # Restore nginx configuration from backup
    local latest_backup=$(find "$NGINX_CONF_DIR" -name "newpennine.conf.backup.*" -type f | sort | tail -1)
    if [ -n "$latest_backup" ]; then
        log "Restoring nginx configuration from $latest_backup"
        cp "$latest_backup" "$NGINX_CONF_DIR/newpennine.conf"
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec nginx nginx -s reload
    fi
    
    # Restart the rollback environment if needed
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "newpennine-$rollback_to.*Up"; then
        log "Starting rollback environment: $rollback_to"
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d "newpennine-$rollback_to"
        sleep 30
    fi
    
    # Verify rollback environment is healthy
    if comprehensive_health_check "$rollback_to"; then
        log "Rollback completed successfully"
        return 0
    else
        error "Rollback failed - manual intervention required"
        return 1
    fi
}

# Main deployment function
main() {
    local command="${1:-deploy}"
    
    case "$command" in
        "deploy")
            log "Starting blue-green deployment..."
            
            # Pre-deployment checks
            log "Performing pre-deployment checks..."
            if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps > /dev/null 2>&1; then
                error "Docker Compose is not available or configuration is invalid"
                exit 1
            fi
            
            # Deploy to inactive environment
            if ! deploy_to_inactive; then
                error "Deployment to inactive environment failed"
                exit 1
            fi
            
            # Switch traffic
            if ! switch_traffic; then
                error "Traffic switching failed - attempting rollback"
                rollback_deployment
                exit 1
            fi
            
            # Post-deployment verification
            if ! post_deployment_verification; then
                error "Post-deployment verification failed - attempting rollback"
                rollback_deployment
                exit 1
            fi
            
            # Cleanup old environment
            cleanup_old_environment
            
            log "Blue-green deployment completed successfully!"
            ;;
            
        "rollback")
            log "Starting rollback..."
            rollback_deployment
            ;;
            
        "status")
            local active_env=$(get_active_environment)
            local inactive_env=$(get_inactive_environment)
            
            echo "Current active environment: $active_env"
            echo "Current inactive environment: $inactive_env"
            
            echo ""
            echo "Container Status:"
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
            
            echo ""
            echo "Health Status:"
            echo "Active ($active_env): $(docker exec "newpennine-$active_env" curl -f http://localhost:3000/api/v1/health 2>/dev/null && echo "Healthy" || echo "Unhealthy")"
            echo "Inactive ($inactive_env): $(docker exec "newpennine-$inactive_env" curl -f http://localhost:3000/api/v1/health 2>/dev/null && echo "Healthy" || echo "Unhealthy")"
            ;;
            
        "health")
            local env="${2:-$(get_active_environment)}"
            comprehensive_health_check "$env"
            ;;
            
        *)
            echo "Usage: $0 {deploy|rollback|status|health [environment]}"
            echo ""
            echo "Commands:"
            echo "  deploy    - Perform blue-green deployment"
            echo "  rollback  - Rollback to previous environment"
            echo "  status    - Show current deployment status"
            echo "  health    - Perform health check on environment"
            exit 1
            ;;
    esac
}

# Trap signals for cleanup
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Execute main function
main "$@"