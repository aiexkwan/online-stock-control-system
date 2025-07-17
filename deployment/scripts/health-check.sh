#!/bin/bash

# Health Check Script for NewPennine WMS Blue-Green Deployment
# This script performs comprehensive health checks on the application

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HEALTH_LOG="/var/log/newpennine-health.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$HEALTH_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$HEALTH_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$HEALTH_LOG"
}

# Function to check container health
check_container_health() {
    local container_name=$1
    local port=${2:-3000}
    
    log "Checking health of $container_name on port $port..."
    
    # Check if container is running
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        error "$container_name is not running"
        return 1
    fi
    
    # Check health endpoint
    if ! docker exec "$container_name" curl -f "http://localhost:$port/api/v1/health" > /dev/null 2>&1; then
        error "Health endpoint is not responding for $container_name"
        return 1
    fi
    
    # Check memory usage
    local memory_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" "$container_name" | tail -1 | sed 's/%//')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        warning "High memory usage for $container_name: ${memory_usage}%"
    fi
    
    # Check CPU usage
    local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" "$container_name" | tail -1 | sed 's/%//')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        warning "High CPU usage for $container_name: ${cpu_usage}%"
    fi
    
    log "$container_name health check passed"
    return 0
}

# Function to check application endpoints
check_application_endpoints() {
    local base_url=$1
    
    log "Checking application endpoints for $base_url..."
    
    # Critical endpoints to check
    local endpoints=(
        "/api/v1/health"
        "/api/v1/metrics"
        "/api/admin/dashboard"
        "/main-login"
        "/admin"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint")
        
        if [ "$response_code" -eq 200 ]; then
            log "✓ $endpoint: $response_code"
        elif [ "$response_code" -eq 302 ] || [ "$response_code" -eq 301 ]; then
            log "✓ $endpoint: $response_code (redirect)"
        else
            error "✗ $endpoint: $response_code"
            return 1
        fi
    done
    
    log "All application endpoints are healthy"
    return 0
}

# Function to check database connectivity
check_database_connectivity() {
    local container_name=$1
    
    log "Checking database connectivity for $container_name..."
    
    # Test database connection
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
        error "Database connectivity test failed for $container_name"
        return 1
    fi
    
    log "Database connectivity check passed for $container_name"
    return 0
}

# Function to check Redis connectivity
check_redis_connectivity() {
    log "Checking Redis connectivity..."
    
    if ! docker exec newpennine-redis redis-cli ping > /dev/null 2>&1; then
        error "Redis is not responding"
        return 1
    fi
    
    # Check Redis memory usage
    local redis_memory=$(docker exec newpennine-redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    log "Redis memory usage: $redis_memory"
    
    log "Redis connectivity check passed"
    return 0
}

# Function to check Nginx configuration
check_nginx_configuration() {
    log "Checking Nginx configuration..."
    
    # Test nginx configuration
    if ! docker exec newpennine-nginx nginx -t > /dev/null 2>&1; then
        error "Nginx configuration test failed"
        return 1
    fi
    
    # Check if nginx is serving requests
    if ! curl -f http://localhost/health > /dev/null 2>&1; then
        error "Nginx is not serving requests"
        return 1
    fi
    
    log "Nginx configuration check passed"
    return 0
}

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        warning "High disk usage: ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        warning "High system memory usage: ${memory_usage}%"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    if (( $(echo "$load_avg > $cpu_count" | bc -l) )); then
        warning "High load average: $load_avg (CPU count: $cpu_count)"
    fi
    
    log "System resources check completed"
    return 0
}

# Function to perform performance test
perform_performance_test() {
    local base_url=$1
    local requests=${2:-100}
    local concurrency=${3:-10}
    
    log "Performing performance test with $requests requests and $concurrency concurrent connections..."
    
    # Run Apache Bench test
    local ab_output=$(ab -n "$requests" -c "$concurrency" "$base_url/api/v1/health" 2>&1)
    
    # Extract key metrics
    local requests_per_second=$(echo "$ab_output" | grep "Requests per second" | awk '{print $4}')
    local time_per_request=$(echo "$ab_output" | grep "Time per request" | head -1 | awk '{print $4}')
    local failed_requests=$(echo "$ab_output" | grep "Failed requests" | awk '{print $3}')
    
    log "Performance test results:"
    log "  Requests per second: $requests_per_second"
    log "  Time per request: $time_per_request ms"
    log "  Failed requests: $failed_requests"
    
    # Check if performance is acceptable
    if (( $(echo "$requests_per_second < 10" | bc -l) )); then
        warning "Low requests per second: $requests_per_second"
    fi
    
    if [ "$failed_requests" -gt 0 ]; then
        warning "Failed requests detected: $failed_requests"
    fi
    
    log "Performance test completed"
    return 0
}

# Function to generate health report
generate_health_report() {
    local environment=$1
    local output_file="${2:-/tmp/health-report-$environment-$(date +%Y%m%d-%H%M%S).json}"
    
    log "Generating health report for $environment environment..."
    
    # Collect health data
    local container_name="newpennine-$environment"
    local health_status="healthy"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Check if container is healthy
    if ! check_container_health "$container_name"; then
        health_status="unhealthy"
    fi
    
    # Get container stats
    local stats=$(docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemPerc}},{{.MemUsage}}" "$container_name")
    IFS=',' read -r container cpu_perc mem_perc mem_usage <<< "$stats"
    
    # Generate JSON report
    cat > "$output_file" <<EOF
{
  "timestamp": "$timestamp",
  "environment": "$environment",
  "health_status": "$health_status",
  "container": {
    "name": "$container_name",
    "cpu_usage": "$cpu_perc",
    "memory_usage": "$mem_perc",
    "memory_details": "$mem_usage"
  },
  "endpoints": {
    "health": "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$([[ "$environment" == "blue" ]] && echo "3001" || echo "3002")/api/v1/health")",
    "metrics": "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$([[ "$environment" == "blue" ]] && echo "3001" || echo "3002")/api/v1/metrics")",
    "dashboard": "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$([[ "$environment" == "blue" ]] && echo "3001" || echo "3002")/api/admin/dashboard")"
  }
}
EOF
    
    log "Health report generated: $output_file"
    return 0
}

# Main function
main() {
    local command="${1:-check}"
    local environment="${2:-all}"
    
    case "$command" in
        "check")
            log "Starting health check for $environment environment(s)..."
            
            if [ "$environment" = "all" ] || [ "$environment" = "blue" ]; then
                if ! check_container_health "newpennine-blue"; then
                    error "Blue environment health check failed"
                fi
            fi
            
            if [ "$environment" = "all" ] || [ "$environment" = "green" ]; then
                if ! check_container_health "newpennine-green"; then
                    error "Green environment health check failed"
                fi
            fi
            
            # Check shared services
            if [ "$environment" = "all" ]; then
                check_nginx_configuration
                check_redis_connectivity
                check_system_resources
            fi
            
            log "Health check completed"
            ;;
            
        "endpoints")
            local base_url="${2:-http://localhost}"
            check_application_endpoints "$base_url"
            ;;
            
        "database")
            local container_name="${2:-newpennine-blue}"
            check_database_connectivity "$container_name"
            ;;
            
        "performance")
            local base_url="${2:-http://localhost}"
            local requests="${3:-100}"
            local concurrency="${4:-10}"
            perform_performance_test "$base_url" "$requests" "$concurrency"
            ;;
            
        "report")
            generate_health_report "$environment"
            ;;
            
        "monitor")
            log "Starting continuous health monitoring..."
            while true; do
                if ! check_container_health "newpennine-blue" && ! check_container_health "newpennine-green"; then
                    error "Both environments are unhealthy!"
                    # Send alert (implement notification system)
                fi
                sleep 60
            done
            ;;
            
        *)
            echo "Usage: $0 {check|endpoints|database|performance|report|monitor} [environment|options]"
            echo ""
            echo "Commands:"
            echo "  check [environment]     - Perform health check (all, blue, green)"
            echo "  endpoints [base_url]    - Check application endpoints"
            echo "  database [container]    - Check database connectivity"
            echo "  performance [url] [req] [concurrency] - Run performance test"
            echo "  report [environment]    - Generate health report"
            echo "  monitor                 - Start continuous monitoring"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"