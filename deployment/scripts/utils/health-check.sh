#!/bin/bash

# =================================================================
# 健康檢查工具函數
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 服務健康檢查和監控工具函數
# =================================================================

# 檢查服務健康狀態
check_service_health() {
    local color="$1"
    local timeout="${2:-60}"
    
    log_info "Checking health of $color service..."
    
    local port
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) error_exit "Invalid color: $color" ;;
    esac
    
    local health_url="http://localhost:$port/api/v1/health"
    
    # 檢查基本可用性
    if ! retry_command 3 5 "curl -f -s '$health_url' > /dev/null"; then
        error_exit "$color service health check failed - service unreachable"
    fi
    
    # 檢查詳細健康狀態
    local health_response=$(curl -s "$health_url" || echo '{"status":"error"}')
    local health_status=$(echo "$health_response" | jq -r '.status // "unknown"')
    
    if [[ "$health_status" == "healthy" ]]; then
        log_success "$color service health check passed"
        return 0
    else
        log_error "$color service health check failed - status: $health_status"
        log_error "Health response: $health_response"
        return 1
    fi
}

# 運行煙霧測試
run_smoke_tests() {
    local color="$1"
    
    log_info "Running smoke tests for $color service..."
    
    local port
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) error_exit "Invalid color: $color" ;;
    esac
    
    local base_url="http://localhost:$port"
    
    # 測試案例配置
    local test_cases=(
        "GET|/api/v1/health|200"
        "GET|/api/v1/metrics|200"
        "GET|/api/v2/health|200"
        "GET|/main-login|200"
        "GET|/api/admin/dashboard|401"  # 應該需要認證
    )
    
    local passed=0
    local failed=0
    
    for test_case in "${test_cases[@]}"; do
        IFS='|' read -r method endpoint expected_status <<< "$test_case"
        
        log_info "Testing: $method $endpoint"
        
        local actual_status
        case "$method" in
            GET)
                actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint" || echo "000")
                ;;
            POST)
                actual_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$base_url$endpoint" || echo "000")
                ;;
            *)
                log_error "Unsupported HTTP method: $method"
                continue
                ;;
        esac
        
        if [[ "$actual_status" == "$expected_status" ]]; then
            log_success "✓ $method $endpoint: $actual_status"
            ((passed++))
        else
            log_error "✗ $method $endpoint: expected $expected_status, got $actual_status"
            ((failed++))
        fi
    done
    
    log_info "Smoke tests completed: $passed passed, $failed failed"
    
    if [[ $failed -gt 0 ]]; then
        error_exit "Smoke tests failed for $color service"
    else
        log_success "All smoke tests passed for $color service"
    fi
}

# 運行性能測試
run_performance_tests() {
    local color="$1"
    
    log_info "Running performance tests for $color service..."
    
    local port
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) error_exit "Invalid color: $color" ;;
    esac
    
    local base_url="http://localhost:$port"
    
    # 性能測試配置
    local performance_tests=(
        "/api/v1/health|10|1000"     # 端點|併發|總請求
        "/api/v1/metrics|5|500"
        "/main-login|3|300"
    )
    
    local all_passed=true
    
    for test_config in "${performance_tests[@]}"; do
        IFS='|' read -r endpoint concurrency total_requests <<< "$test_config"
        
        log_info "Performance testing: $endpoint (concurrency: $concurrency, requests: $total_requests)"
        
        # 使用 curl 進行簡單性能測試
        local start_time=$(date +%s.%N)
        local success_count=0
        local error_count=0
        
        for ((i=1; i<=total_requests; i++)); do
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$base_url$endpoint" || echo "000")
            
            if [[ "$response_code" =~ ^[23] ]]; then
                ((success_count++))
            else
                ((error_count++))
            fi
            
            # 簡單的併發控制
            if [[ $((i % concurrency)) -eq 0 ]]; then
                sleep 0.1
            fi
        done
        
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc)
        local success_rate=$(echo "scale=2; $success_count * 100 / $total_requests" | bc)
        local rps=$(echo "scale=2; $total_requests / $duration" | bc)
        
        log_info "Performance results for $endpoint:"
        log_info "  Duration: ${duration}s"
        log_info "  Success rate: ${success_rate}%"
        log_info "  Requests per second: ${rps}"
        log_info "  Successful requests: $success_count"
        log_info "  Failed requests: $error_count"
        
        # 性能閾值檢查
        if (( $(echo "$success_rate < 95" | bc -l) )); then
            log_error "Performance test failed: success rate too low ($success_rate%)"
            all_passed=false
        fi
        
        if (( $(echo "$rps < 10" | bc -l) )); then
            log_error "Performance test failed: requests per second too low ($rps)"
            all_passed=false
        fi
    done
    
    if [[ "$all_passed" == true ]]; then
        log_success "All performance tests passed for $color service"
    else
        error_exit "Performance tests failed for $color service"
    fi
}

# 驗證服務可用性
validate_service_availability() {
    log_info "Validating service availability..."
    
    local active_color=$(get_active_color)
    local active_port
    
    case "$active_color" in
        blue) active_port=3001 ;;
        green) active_port=3002 ;;
        *) error_exit "Unknown active color: $active_color" ;;
    esac
    
    # 檢查主要端點
    local endpoints=(
        "/api/v1/health"
        "/api/v1/metrics"
        "/api/v2/health"
        "/main-login"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="http://localhost:$active_port$endpoint"
        
        if curl -f -s "$url" > /dev/null; then
            log_success "✓ $endpoint is available"
        else
            error_exit "✗ $endpoint is not available"
        fi
    done
    
    log_success "Service availability validation passed"
}

# 驗證關鍵功能
validate_critical_functions() {
    log_info "Validating critical functions..."
    
    local active_color=$(get_active_color)
    local active_port
    
    case "$active_color" in
        blue) active_port=3001 ;;
        green) active_port=3002 ;;
        *) error_exit "Unknown active color: $active_color" ;;
    esac
    
    local base_url="http://localhost:$active_port"
    
    # 測試關鍵功能
    local functions=(
        "login_page|/main-login|200"
        "health_check|/api/v1/health|200"
        "metrics|/api/v1/metrics|200"
        "api_v2_health|/api/v2/health|200"
        "cache_metrics|/api/v1/cache/metrics|200"
    )
    
    local passed=0
    local failed=0
    
    for function_test in "${functions[@]}"; do
        IFS='|' read -r function_name endpoint expected_status <<< "$function_test"
        
        log_info "Testing critical function: $function_name"
        
        local actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint" || echo "000")
        
        if [[ "$actual_status" == "$expected_status" ]]; then
            log_success "✓ $function_name: OK"
            ((passed++))
        else
            log_error "✗ $function_name: expected $expected_status, got $actual_status"
            ((failed++))
        fi
    done
    
    log_info "Critical functions validation: $passed passed, $failed failed"
    
    if [[ $failed -gt 0 ]]; then
        error_exit "Critical functions validation failed"
    else
        log_success "All critical functions validated successfully"
    fi
}

# 驗證性能指標
validate_performance_metrics() {
    log_info "Validating performance metrics..."
    
    local active_color=$(get_active_color)
    local active_port
    
    case "$active_color" in
        blue) active_port=3001 ;;
        green) active_port=3002 ;;
        *) error_exit "Unknown active color: $active_color" ;;
    esac
    
    local metrics_url="http://localhost:$active_port/api/v1/metrics"
    
    # 獲取性能指標
    local metrics_response=$(curl -s "$metrics_url" || echo '{}')
    
    # 解析關鍵指標
    local response_time=$(echo "$metrics_response" | jq -r '.response_time // 0')
    local cpu_usage=$(echo "$metrics_response" | jq -r '.cpu_usage // 0')
    local memory_usage=$(echo "$metrics_response" | jq -r '.memory_usage // 0')
    local uptime=$(echo "$metrics_response" | jq -r '.uptime // 0')
    
    log_info "Performance metrics:"
    log_info "  Response time: ${response_time}ms"
    log_info "  CPU usage: ${cpu_usage}%"
    log_info "  Memory usage: ${memory_usage}%"
    log_info "  Uptime: ${uptime}s"
    
    # 性能閾值檢查
    local validation_passed=true
    
    if (( $(echo "$response_time > 2000" | bc -l) )); then
        log_error "Performance validation failed: response time too high (${response_time}ms)"
        validation_passed=false
    fi
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_error "Performance validation failed: CPU usage too high (${cpu_usage}%)"
        validation_passed=false
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        log_error "Performance validation failed: Memory usage too high (${memory_usage}%)"
        validation_passed=false
    fi
    
    if [[ "$validation_passed" == true ]]; then
        log_success "Performance metrics validation passed"
    else
        error_exit "Performance metrics validation failed"
    fi
}

# 檢查容器資源使用
check_container_resources() {
    local container_name="$1"
    
    log_info "Checking resource usage for container: $container_name"
    
    if ! docker ps | grep -q "$container_name"; then
        error_exit "Container $container_name is not running"
    fi
    
    # 獲取資源使用統計
    local stats=$(docker stats "$container_name" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}")
    
    log_info "Resource usage for $container_name:"
    log_info "$stats"
    
    # 解析統計數據
    local cpu_percent=$(echo "$stats" | tail -1 | awk '{print $1}' | sed 's/%//')
    local memory_percent=$(echo "$stats" | tail -1 | awk '{print $3}' | sed 's/%//')
    
    # 資源使用閾值檢查
    if (( $(echo "$cpu_percent > 80" | bc -l) )); then
        log_warn "High CPU usage detected: ${cpu_percent}%"
    fi
    
    if (( $(echo "$memory_percent > 80" | bc -l) )); then
        log_warn "High memory usage detected: ${memory_percent}%"
    fi
    
    log_success "Container resource check completed"
}

# 檢查網絡連接
check_network_connectivity() {
    log_info "Checking network connectivity..."
    
    local test_urls=(
        "https://google.com"
        "https://github.com"
        "$NEXT_PUBLIC_SUPABASE_URL"
    )
    
    local connectivity_passed=true
    
    for url in "${test_urls[@]}"; do
        if curl -f -s --max-time 10 "$url" > /dev/null; then
            log_success "✓ Network connectivity to $url: OK"
        else
            log_error "✗ Network connectivity to $url: FAILED"
            connectivity_passed=false
        fi
    done
    
    if [[ "$connectivity_passed" == true ]]; then
        log_success "Network connectivity check passed"
    else
        error_exit "Network connectivity check failed"
    fi
}

# 驗證 SSL 證書
validate_ssl_certificates() {
    log_info "Validating SSL certificates..."
    
    local domain="${DOMAIN:-localhost}"
    
    if [[ "$domain" == "localhost" ]]; then
        log_info "Skipping SSL validation for localhost"
        return 0
    fi
    
    # 檢查 SSL 證書
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates)
    
    if [[ -n "$cert_info" ]]; then
        log_info "SSL certificate information:"
        log_info "$cert_info"
        
        # 檢查證書過期時間
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -lt 30 ]]; then
            log_warn "SSL certificate expires in $days_until_expiry days"
        else
            log_success "SSL certificate is valid for $days_until_expiry days"
        fi
    else
        log_error "Could not retrieve SSL certificate information"
    fi
}

# 檢查依賴服務
check_dependency_services() {
    log_info "Checking dependency services..."
    
    local dependencies=(
        "newpennine-redis|6379"
        "newpennine-nginx|80"
    )
    
    local all_healthy=true
    
    for dependency in "${dependencies[@]}"; do
        IFS='|' read -r service_name port <<< "$dependency"
        
        log_info "Checking dependency: $service_name on port $port"
        
        if check_container_health "$service_name"; then
            log_success "✓ $service_name is healthy"
        else
            log_error "✗ $service_name is unhealthy"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == true ]]; then
        log_success "All dependency services are healthy"
    else
        error_exit "Some dependency services are unhealthy"
    fi
}

# 運行單元測試
run_unit_tests() {
    log_info "Running unit tests..."
    
    cd "$PROJECT_ROOT" || error_exit "Failed to change to project directory"
    
    # 運行 Jest 測試
    if npm test -- --ci --coverage --watchAll=false --passWithNoTests; then
        log_success "Unit tests passed"
    else
        error_exit "Unit tests failed"
    fi
}

# 運行集成測試
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$PROJECT_ROOT" || error_exit "Failed to change to project directory"
    
    # 運行集成測試
    if npm run test:integration; then
        log_success "Integration tests passed"
    else
        error_exit "Integration tests failed"
    fi
}

# 運行端到端測試
run_e2e_tests() {
    log_info "Running end-to-end tests..."
    
    cd "$PROJECT_ROOT" || error_exit "Failed to change to project directory"
    
    # 運行 Playwright 測試
    if npm run test:e2e; then
        log_success "End-to-end tests passed"
    else
        error_exit "End-to-end tests failed"
    fi
}

# 生成健康報告
generate_health_report() {
    local color="$1"
    local report_file="$LOGS_DIR/health_report_${color}_${TIMESTAMP}.json"
    
    log_info "Generating health report for $color service..."
    
    local port
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) error_exit "Invalid color: $color" ;;
    esac
    
    # 收集健康數據
    local health_data=$(curl -s "http://localhost:$port/api/v1/health" || echo '{}')
    local metrics_data=$(curl -s "http://localhost:$port/api/v1/metrics" || echo '{}')
    
    # 創建健康報告
    jq -n \
        --argjson health "$health_data" \
        --argjson metrics "$metrics_data" \
        --arg color "$color" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg port "$port" \
        '{
            color: $color,
            port: $port,
            timestamp: $timestamp,
            health: $health,
            metrics: $metrics,
            container_status: "running"
        }' > "$report_file"
    
    log_success "Health report generated: $report_file"
    echo "$report_file"
}