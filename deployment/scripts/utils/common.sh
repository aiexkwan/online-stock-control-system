#!/bin/bash

# =================================================================
# 通用工具函數
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 部署腳本的通用工具函數
# =================================================================

# 檢查必要工具
check_dependencies() {
    log_info "Checking required dependencies..."
    
    local required_tools=(
        "docker"
        "docker-compose"
        "curl"
        "jq"
        "git"
        "npm"
        "node"
        "psql"
    )
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done
    
    log_success "All required dependencies are available"
}

# 驗證環境配置
validate_environment() {
    log_info "Validating environment configuration..."
    
    # 檢查必要的環境變量
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_SITE_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error_exit "Required environment variable '$var' is not set"
        fi
    done
    
    # 檢查配置文件
    local config_files=(
        "$CONFIG_DIR/environments/${ENVIRONMENT}.env"
        "$PROJECT_ROOT/docker-compose.prod.yml"
        "$PROJECT_ROOT/Dockerfile.prod"
    )
    
    for file in "${config_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error_exit "Required configuration file not found: $file"
        fi
    done
    
    log_success "Environment configuration validated"
}

# 檢查磁碟空間
check_disk_space() {
    log_info "Checking disk space..."
    
    local required_space_gb=5
    local available_space_gb=$(df -BG "$PROJECT_ROOT" | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ "$available_space_gb" -lt "$required_space_gb" ]]; then
        error_exit "Insufficient disk space. Required: ${required_space_gb}GB, Available: ${available_space_gb}GB"
    fi
    
    log_success "Disk space check passed (${available_space_gb}GB available)"
}

# 檢查現有服務狀態
check_current_services() {
    log_info "Checking current services status..."
    
    # 檢查 Docker 容器狀態
    local containers=("newpennine-blue" "newpennine-green" "newpennine-nginx" "newpennine-redis")
    
    for container in "${containers[@]}"; do
        if docker ps -a --format "table {{.Names}}" | grep -q "$container"; then
            local status=$(docker inspect "$container" --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
            log_info "Container $container: $status"
        else
            log_info "Container $container: not found"
        fi
    done
    
    log_success "Current services status checked"
}

# 獲取當前活動顏色
get_active_color() {
    # 檢查 Nginx 配置以確定當前活動的顏色
    local nginx_config="/etc/nginx/conf.d/default.conf"
    
    if [[ -f "$nginx_config" ]]; then
        if grep -q "newpennine-blue:3000" "$nginx_config"; then
            echo "blue"
        elif grep -q "newpennine-green:3000" "$nginx_config"; then
            echo "green"
        else
            echo "unknown"
        fi
    else
        # 如果 Nginx 配置不存在，檢查容器狀態
        if docker ps | grep -q "newpennine-blue"; then
            echo "blue"
        elif docker ps | grep -q "newpennine-green"; then
            echo "green"
        else
            echo "unknown"
        fi
    fi
}

# 獲取非活動顏色
get_inactive_color() {
    local active_color=$(get_active_color)
    
    if [[ "$active_color" == "blue" ]]; then
        echo "green"
    elif [[ "$active_color" == "green" ]]; then
        echo "blue"
    else
        echo "blue"  # 默認
    fi
}

# 等待服務啟動
wait_for_service_startup() {
    local color="$1"
    local timeout="${2:-300}"  # 5分鐘超時
    local port
    
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) error_exit "Invalid color: $color" ;;
    esac
    
    log_info "Waiting for $color service to start on port $port..."
    
    local count=0
    while [[ $count -lt $timeout ]]; do
        if curl -s -f "http://localhost:$port/api/v1/health" > /dev/null; then
            log_success "$color service is ready"
            return 0
        fi
        
        sleep 1
        ((count++))
        
        if [[ $((count % 30)) -eq 0 ]]; then
            log_info "Still waiting for $color service... ($count/$timeout)"
        fi
    done
    
    error_exit "$color service failed to start within $timeout seconds"
}

# 準備配置文件
prepare_config_files() {
    log_info "Preparing configuration files..."
    
    # 創建臨時配置目錄
    local temp_config_dir="/tmp/newpennine-config-$$"
    mkdir -p "$temp_config_dir"
    
    # 複製並處理配置文件
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$temp_config_dir/"
    
    # 替換配置文件中的變量
    sed -i "s/\${DEPLOYMENT_VERSION}/$VERSION/g" "$temp_config_dir/docker-compose.prod.yml"
    sed -i "s/\${DEPLOYMENT_TIMESTAMP}/$(date +%s)/g" "$temp_config_dir/docker-compose.prod.yml"
    
    # 移動配置文件到正確位置
    cp "$temp_config_dir/docker-compose.prod.yml" "$PROJECT_ROOT/"
    
    # 清理臨時文件
    rm -rf "$temp_config_dir"
    
    log_success "Configuration files prepared"
}

# 設置環境變量
set_environment_variables() {
    log_info "Setting environment variables..."
    
    export DEPLOYMENT_VERSION="$VERSION"
    export DEPLOYMENT_TIMESTAMP=$(date +%s)
    export DEPLOYMENT_COLOR="$TARGET_COLOR"
    export NODE_ENV="production"
    
    log_success "Environment variables set"
}

# 清理臨時文件
cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    
    # 清理部署過程中創建的臨時文件
    find /tmp -name "newpennine-*" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
    
    # 清理 Docker 系統
    docker system prune -f --volumes || true
    
    log_success "Temporary files cleaned up"
}

# 生成部署報告
generate_deployment_report() {
    local status="$1"
    local report_file="$LOGS_DIR/deployment_report_${TIMESTAMP}.json"
    
    log_info "Generating deployment report..."
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deployment_id": "${TIMESTAMP}",
    "environment": "${ENVIRONMENT}",
    "version": "${VERSION}",
    "target_color": "${TARGET_COLOR}",
    "deploy_type": "${DEPLOY_TYPE}",
    "status": "${status}",
    "duration": "$(calculate_duration)",
    "services": {
        "blue": "$(docker inspect newpennine-blue --format='{{.State.Status}}' 2>/dev/null || echo 'not_found')",
        "green": "$(docker inspect newpennine-green --format='{{.State.Status}}' 2>/dev/null || echo 'not_found')",
        "nginx": "$(docker inspect newpennine-nginx --format='{{.State.Status}}' 2>/dev/null || echo 'not_found')",
        "redis": "$(docker inspect newpennine-redis --format='{{.State.Status}}' 2>/dev/null || echo 'not_found')"
    },
    "log_file": "${LOG_FILE}",
    "report_file": "${report_file}"
}
EOF
    
    log_success "Deployment report generated: $report_file"
}

# 計算部署持續時間
calculate_duration() {
    local start_time="${DEPLOYMENT_START_TIME:-$(date +%s)}"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "${duration}s"
}

# 驗證 JSON 格式
validate_json() {
    local json_file="$1"
    
    if ! jq empty "$json_file" 2>/dev/null; then
        error_exit "Invalid JSON file: $json_file"
    fi
}

# 重試機制
retry_command() {
    local max_attempts="$1"
    local delay="$2"
    shift 2
    local command="$@"
    
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if eval "$command"; then
            return 0
        fi
        
        log_warn "Command failed (attempt $attempt/$max_attempts): $command"
        
        if [[ $attempt -lt $max_attempts ]]; then
            log_info "Retrying in $delay seconds..."
            sleep "$delay"
        fi
        
        ((attempt++))
    done
    
    error_exit "Command failed after $max_attempts attempts: $command"
}

# 獲取 Git 資訊
get_git_info() {
    local git_info="{}"
    
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        git_info=$(jq -n \
            --arg branch "$(git rev-parse --abbrev-ref HEAD)" \
            --arg commit "$(git rev-parse HEAD)" \
            --arg short_commit "$(git rev-parse --short HEAD)" \
            --arg author "$(git log -1 --format=%an)" \
            --arg message "$(git log -1 --format=%s)" \
            --arg timestamp "$(git log -1 --format=%ci)" \
            '{
                branch: $branch,
                commit: $commit,
                short_commit: $short_commit,
                author: $author,
                message: $message,
                timestamp: $timestamp
            }')
    fi
    
    echo "$git_info"
}

# 計算文件 MD5
calculate_md5() {
    local file="$1"
    
    if [[ -f "$file" ]]; then
        md5sum "$file" | cut -d' ' -f1
    else
        echo "file_not_found"
    fi
}

# 驗證服務響應
verify_service_response() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-30}"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" || echo "000")
    
    if [[ "$response_code" == "$expected_status" ]]; then
        return 0
    else
        log_error "Service response check failed. Expected: $expected_status, Got: $response_code"
        return 1
    fi
}

# 創建備份目錄
create_backup_directory() {
    local backup_dir="$LOGS_DIR/backups/$TIMESTAMP"
    mkdir -p "$backup_dir"
    echo "$backup_dir"
}

# 壓縮日誌文件
compress_logs() {
    local logs_to_compress=(
        "$LOG_FILE"
        "$LOGS_DIR/deployment_report_${TIMESTAMP}.json"
    )
    
    local compressed_file="$LOGS_DIR/deployment_${TIMESTAMP}.tar.gz"
    
    if tar -czf "$compressed_file" "${logs_to_compress[@]}" 2>/dev/null; then
        log_success "Logs compressed to: $compressed_file"
        
        # 清理原始日誌文件（可選）
        # rm -f "${logs_to_compress[@]}"
    else
        log_warn "Failed to compress logs"
    fi
}

# 設置部署開始時間
set_deployment_start_time() {
    export DEPLOYMENT_START_TIME=$(date +%s)
}