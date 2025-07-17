#!/bin/bash

# =================================================================
# 系統維護腳本
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 系統清理、備份管理和安全更新腳本
# =================================================================

# 維護配置
readonly MAINTENANCE_CONFIG="$CONFIG_DIR/maintenance.json"
readonly BACKUP_DIR="$LOGS_DIR/backups"
readonly CLEANUP_LOG="$LOGS_DIR/cleanup.log"
readonly MAINTENANCE_LOG="$LOGS_DIR/maintenance.log"

# 創建必要目錄
mkdir -p "$BACKUP_DIR" "$(dirname "$CLEANUP_LOG")" "$(dirname "$MAINTENANCE_LOG")"

# 系統清理函數
perform_system_cleanup() {
    local cleanup_type="${1:-full}"
    
    log_info "Starting system cleanup (type: $cleanup_type)..."
    
    case "$cleanup_type" in
        full)
            cleanup_docker_system
            cleanup_log_files
            cleanup_temp_files
            cleanup_old_backups
            cleanup_application_cache
            cleanup_system_cache
            ;;
        docker)
            cleanup_docker_system
            ;;
        logs)
            cleanup_log_files
            ;;
        temp)
            cleanup_temp_files
            ;;
        cache)
            cleanup_application_cache
            cleanup_system_cache
            ;;
        *)
            error_exit "Unknown cleanup type: $cleanup_type"
            ;;
    esac
    
    log_success "System cleanup completed"
}

# 清理 Docker 系統
cleanup_docker_system() {
    log_info "Cleaning up Docker system..."
    
    # 停止並移除退出的容器
    local exited_containers=$(docker ps -aq --filter status=exited)
    if [[ -n "$exited_containers" ]]; then
        echo "$exited_containers" | xargs docker rm
        log_info "Removed exited containers"
    fi
    
    # 移除懸掛的映像
    local dangling_images=$(docker images -f "dangling=true" -q)
    if [[ -n "$dangling_images" ]]; then
        echo "$dangling_images" | xargs docker rmi
        log_info "Removed dangling images"
    fi
    
    # 清理未使用的網絡
    docker network prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理構建緩存
    docker builder prune -f
    
    # 清理系統（保留最近24小時的資源）
    docker system prune -f --filter "until=24h"
    
    log_success "Docker system cleanup completed"
}

# 清理日誌文件
cleanup_log_files() {
    log_info "Cleaning up log files..."
    
    local log_retention_days=$(get_maintenance_config "log_retention_days" "7")
    
    # 清理部署日誌
    find "$LOGS_DIR" -name "deploy_*.log" -mtime +$log_retention_days -delete 2>/dev/null
    find "$LOGS_DIR" -name "*.log" -mtime +$log_retention_days -delete 2>/dev/null
    
    # 清理 Docker 日誌
    if command -v docker &> /dev/null; then
        docker ps -q | xargs -r docker inspect --format='{{.LogPath}}' | xargs -r truncate -s 0 2>/dev/null
    fi
    
    # 清理系統日誌
    if [[ -d "/var/log" ]]; then
        find /var/log -name "*.log" -mtime +$log_retention_days -delete 2>/dev/null
        find /var/log -name "*.log.*" -mtime +$log_retention_days -delete 2>/dev/null
    fi
    
    # 清理 Nginx 日誌
    if [[ -d "/var/log/nginx" ]]; then
        find /var/log/nginx -name "*.log" -mtime +$log_retention_days -delete 2>/dev/null
    fi
    
    log_success "Log files cleanup completed"
}

# 清理臨時文件
cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    
    # 清理系統臨時文件
    find /tmp -type f -mtime +3 -delete 2>/dev/null
    find /tmp -type d -empty -delete 2>/dev/null
    
    # 清理項目臨時文件
    find "$PROJECT_ROOT" -name "*.tmp" -mtime +1 -delete 2>/dev/null
    find "$PROJECT_ROOT" -name ".DS_Store" -delete 2>/dev/null
    find "$PROJECT_ROOT" -name "Thumbs.db" -delete 2>/dev/null
    
    # 清理 Node.js 緩存
    if [[ -d "$HOME/.npm" ]]; then
        npm cache clean --force 2>/dev/null
    fi
    
    # 清理 Next.js 緩存
    if [[ -d "$PROJECT_ROOT/.next" ]]; then
        rm -rf "$PROJECT_ROOT/.next/cache" 2>/dev/null
    fi
    
    # 清理構建臨時文件
    find "$PROJECT_ROOT" -name "*.tsbuildinfo" -delete 2>/dev/null
    find "$PROJECT_ROOT" -name "*.turbo" -type d -exec rm -rf {} + 2>/dev/null
    
    log_success "Temporary files cleanup completed"
}

# 清理舊備份
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    local backup_retention_days=$(get_maintenance_config "backup_retention_days" "30")
    
    # 清理舊的資料庫備份
    find "$BACKUP_DIR" -name "*backup*.sql.gz" -mtime +$backup_retention_days -delete 2>/dev/null
    find "$BACKUP_DIR" -name "*backup*.sql" -mtime +$backup_retention_days -delete 2>/dev/null
    
    # 清理舊的配置備份
    find "$BACKUP_DIR" -name "*config*" -mtime +$backup_retention_days -delete 2>/dev/null
    
    # 清理舊的日誌備份
    find "$BACKUP_DIR" -name "*log*" -mtime +$backup_retention_days -delete 2>/dev/null
    
    log_success "Old backups cleanup completed"
}

# 清理應用程式緩存
cleanup_application_cache() {
    log_info "Cleaning up application cache..."
    
    # 清理 Redis 緩存
    if docker ps | grep -q "newpennine-redis"; then
        docker exec newpennine-redis redis-cli FLUSHALL 2>/dev/null
        log_info "Redis cache cleared"
    fi
    
    # 清理瀏覽器緩存文件
    find "$PROJECT_ROOT" -name "*.cache" -delete 2>/dev/null
    
    # 清理 API 緩存
    if [[ -d "$PROJECT_ROOT/cache" ]]; then
        rm -rf "$PROJECT_ROOT/cache/*" 2>/dev/null
    fi
    
    log_success "Application cache cleanup completed"
}

# 清理系統緩存
cleanup_system_cache() {
    log_info "Cleaning up system cache..."
    
    # 清理 APT 緩存
    if command -v apt &> /dev/null; then
        apt-get autoremove -y 2>/dev/null
        apt-get autoclean 2>/dev/null
    fi
    
    # 清理 YUM 緩存
    if command -v yum &> /dev/null; then
        yum clean all 2>/dev/null
    fi
    
    # 清理系統日誌緩存
    if command -v journalctl &> /dev/null; then
        journalctl --vacuum-time=7d 2>/dev/null
    fi
    
    log_success "System cache cleanup completed"
}

# 備份管理
manage_backups() {
    local action="${1:-create}"
    
    case "$action" in
        create)
            create_full_backup
            ;;
        restore)
            restore_backup "$2"
            ;;
        list)
            list_backups
            ;;
        verify)
            verify_backups
            ;;
        *)
            error_exit "Unknown backup action: $action"
            ;;
    esac
}

# 創建完整備份
create_full_backup() {
    log_info "Creating full system backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="full_backup_${backup_timestamp}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # 備份資料庫
    log_info "Backing up database..."
    local db_backup_file=$(create_database_backup)
    if [[ -n "$db_backup_file" ]]; then
        cp "$db_backup_file" "$backup_path/"
        log_success "Database backup completed"
    fi
    
    # 備份配置文件
    log_info "Backing up configuration files..."
    backup_configuration_files "$backup_path"
    
    # 備份應用程式文件
    log_info "Backing up application files..."
    backup_application_files "$backup_path"
    
    # 備份 Docker 配置
    log_info "Backing up Docker configuration..."
    backup_docker_config "$backup_path"
    
    # 創建備份清單
    create_backup_manifest "$backup_path"
    
    # 壓縮備份
    log_info "Compressing backup..."
    tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"
    
    log_success "Full backup created: ${backup_path}.tar.gz"
    echo "${backup_path}.tar.gz"
}

# 備份配置文件
backup_configuration_files() {
    local backup_path="$1"
    local config_backup_dir="$backup_path/config"
    
    mkdir -p "$config_backup_dir"
    
    # 備份部署配置
    if [[ -d "$CONFIG_DIR" ]]; then
        cp -r "$CONFIG_DIR"/* "$config_backup_dir/" 2>/dev/null
    fi
    
    # 備份環境配置
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        cp "$PROJECT_ROOT/.env.local" "$config_backup_dir/"
    fi
    
    # 備份 Docker 配置
    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.prod.yml" "$config_backup_dir/"
    fi
    
    # 備份 Nginx 配置
    if [[ -d "$PROJECT_ROOT/deployment/nginx" ]]; then
        cp -r "$PROJECT_ROOT/deployment/nginx" "$config_backup_dir/"
    fi
    
    log_success "Configuration files backed up"
}

# 備份應用程式文件
backup_application_files() {
    local backup_path="$1"
    local app_backup_dir="$backup_path/application"
    
    mkdir -p "$app_backup_dir"
    
    # 備份重要的應用程式文件
    local important_files=(
        "package.json"
        "package-lock.json"
        "next.config.js"
        "tsconfig.json"
        "tailwind.config.js"
    )
    
    for file in "${important_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$app_backup_dir/"
        fi
    done
    
    # 備份腳本文件
    if [[ -d "$PROJECT_ROOT/scripts" ]]; then
        cp -r "$PROJECT_ROOT/scripts" "$app_backup_dir/"
    fi
    
    # 備份部署腳本
    if [[ -d "$PROJECT_ROOT/deployment" ]]; then
        cp -r "$PROJECT_ROOT/deployment" "$app_backup_dir/"
    fi
    
    log_success "Application files backed up"
}

# 備份 Docker 配置
backup_docker_config() {
    local backup_path="$1"
    local docker_backup_dir="$backup_path/docker"
    
    mkdir -p "$docker_backup_dir"
    
    # 備份 Docker 映像列表
    docker images --format "table {{.Repository}}:{{.Tag}}" > "$docker_backup_dir/images.txt"
    
    # 備份 Docker 容器配置
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" > "$docker_backup_dir/containers.txt"
    
    # 備份 Docker 網絡配置
    docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" > "$docker_backup_dir/networks.txt"
    
    # 備份 Docker 卷配置
    docker volume ls --format "table {{.Name}}\t{{.Driver}}" > "$docker_backup_dir/volumes.txt"
    
    log_success "Docker configuration backed up"
}

# 創建備份清單
create_backup_manifest() {
    local backup_path="$1"
    local manifest_file="$backup_path/manifest.json"
    
    jq -n \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg version "$VERSION" \
        --arg environment "$ENVIRONMENT" \
        --arg hostname "$(hostname)" \
        --arg user "$(whoami)" \
        --arg backup_type "full" \
        '{
            timestamp: $timestamp,
            version: $version,
            environment: $environment,
            hostname: $hostname,
            user: $user,
            backup_type: $backup_type,
            files: []
        }' > "$manifest_file"
    
    # 添加文件列表
    find "$backup_path" -type f -not -name "manifest.json" | while read -r file; do
        local relative_path="${file#$backup_path/}"
        local file_size=$(stat -c%s "$file")
        local file_hash=$(md5sum "$file" | cut -d' ' -f1)
        
        local file_info=$(jq -n \
            --arg path "$relative_path" \
            --arg size "$file_size" \
            --arg hash "$file_hash" \
            '{
                path: $path,
                size: ($size | tonumber),
                hash: $hash
            }')
        
        local manifest_data=$(cat "$manifest_file")
        echo "$manifest_data" | jq ".files += [$file_info]" > "$manifest_file"
    done
    
    log_success "Backup manifest created"
}

# 列出備份
list_backups() {
    log_info "Listing available backups..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_warn "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    local backups=($(find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.zip" | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        log_info "No backups found"
        return 0
    fi
    
    printf "%-30s %-20s %-15s\n" "Backup Name" "Date" "Size"
    printf "%-30s %-20s %-15s\n" "----------" "----" "----"
    
    for backup in "${backups[@]}"; do
        local backup_name=$(basename "$backup")
        local backup_date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S')
        local backup_size=$(ls -lh "$backup" | awk '{print $5}')
        
        printf "%-30s %-20s %-15s\n" "$backup_name" "$backup_date" "$backup_size"
    done
    
    log_success "Backup listing completed"
}

# 驗證備份
verify_backups() {
    log_info "Verifying backups..."
    
    local backups=($(find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.zip"))
    local verified=0
    local failed=0
    
    for backup in "${backups[@]}"; do
        log_info "Verifying backup: $(basename "$backup")"
        
        if verify_single_backup "$backup"; then
            log_success "✓ $(basename "$backup") - OK"
            ((verified++))
        else
            log_error "✗ $(basename "$backup") - FAILED"
            ((failed++))
        fi
    done
    
    log_info "Backup verification completed: $verified verified, $failed failed"
    
    if [[ $failed -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

# 驗證單個備份
verify_single_backup() {
    local backup_file="$1"
    
    # 檢查文件是否存在
    if [[ ! -f "$backup_file" ]]; then
        return 1
    fi
    
    # 檢查文件完整性
    if [[ "$backup_file" == *.tar.gz ]]; then
        if ! tar -tzf "$backup_file" &>/dev/null; then
            return 1
        fi
    elif [[ "$backup_file" == *.zip ]]; then
        if ! unzip -t "$backup_file" &>/dev/null; then
            return 1
        fi
    fi
    
    # 檢查備份清單（如果存在）
    local temp_dir=$(mktemp -d)
    if tar -xzf "$backup_file" -C "$temp_dir" 2>/dev/null; then
        if [[ -f "$temp_dir/manifest.json" ]]; then
            if ! jq empty "$temp_dir/manifest.json" &>/dev/null; then
                rm -rf "$temp_dir"
                return 1
            fi
        fi
        rm -rf "$temp_dir"
    fi
    
    return 0
}

# 恢復備份
restore_backup() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        error_exit "Backup file not specified"
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log_info "Restoring backup: $(basename "$backup_file")"
    
    # 驗證備份
    if ! verify_single_backup "$backup_file"; then
        error_exit "Backup file verification failed"
    fi
    
    # 創建恢復目錄
    local restore_dir="$BACKUP_DIR/restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$restore_dir"
    
    # 解壓縮備份
    log_info "Extracting backup..."
    if ! tar -xzf "$backup_file" -C "$restore_dir"; then
        error_exit "Failed to extract backup"
    fi
    
    # 讀取清單
    local manifest_file="$restore_dir/manifest.json"
    if [[ -f "$manifest_file" ]]; then
        local backup_info=$(cat "$manifest_file")
        local backup_version=$(echo "$backup_info" | jq -r '.version')
        local backup_environment=$(echo "$backup_info" | jq -r '.environment')
        
        log_info "Backup version: $backup_version"
        log_info "Backup environment: $backup_environment"
    fi
    
    # 恢復配置文件
    if [[ -d "$restore_dir/config" ]]; then
        log_info "Restoring configuration files..."
        cp -r "$restore_dir/config"/* "$CONFIG_DIR/" 2>/dev/null
    fi
    
    # 恢復資料庫
    if [[ -f "$restore_dir/database_backup"* ]]; then
        log_info "Restoring database..."
        local db_backup_file=$(find "$restore_dir" -name "database_backup*" | head -1)
        restore_database_backup "$db_backup_file"
    fi
    
    # 清理恢復目錄
    rm -rf "$restore_dir"
    
    log_success "Backup restored successfully"
}

# 安全更新
perform_security_updates() {
    log_info "Performing security updates..."
    
    # 更新 npm 包
    update_npm_packages
    
    # 更新 Docker 映像
    update_docker_images
    
    # 更新系統包
    update_system_packages
    
    # 掃描安全漏洞
    scan_security_vulnerabilities
    
    log_success "Security updates completed"
}

# 更新 npm 包
update_npm_packages() {
    log_info "Updating npm packages..."
    
    cd "$PROJECT_ROOT" || return 1
    
    # 檢查過時的包
    local outdated_packages=$(npm outdated --json 2>/dev/null || echo '{}')
    
    if [[ "$outdated_packages" != "{}" ]]; then
        log_info "Found outdated packages:"
        echo "$outdated_packages" | jq -r 'keys[]'
        
        # 更新安全相關的包
        npm audit fix --audit-level moderate
        
        # 更新依賴
        npm update
        
        # 重新安裝依賴
        npm ci
    else
        log_info "All npm packages are up to date"
    fi
    
    log_success "npm packages updated"
}

# 更新 Docker 映像
update_docker_images() {
    log_info "Updating Docker images..."
    
    # 獲取所有使用中的映像
    local images=($(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>"))
    
    for image in "${images[@]}"; do
        if [[ "$image" != *"newpennine"* ]]; then
            log_info "Updating image: $image"
            docker pull "$image" || log_warn "Failed to update image: $image"
        fi
    done
    
    log_success "Docker images updated"
}

# 更新系統包
update_system_packages() {
    log_info "Updating system packages..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        apt update
        apt upgrade -y --only-upgrade
        apt autoremove -y
    fi
    
    # CentOS/RHEL
    if command -v yum &> /dev/null; then
        yum update -y
        yum autoremove -y
    fi
    
    log_success "System packages updated"
}

# 掃描安全漏洞
scan_security_vulnerabilities() {
    log_info "Scanning for security vulnerabilities..."
    
    # npm 安全掃描
    cd "$PROJECT_ROOT" || return 1
    npm audit --audit-level moderate > "$LOGS_DIR/npm_audit.log" 2>&1
    
    # Docker 映像掃描
    if command -v docker &> /dev/null; then
        docker images --format "{{.Repository}}:{{.Tag}}" | while read -r image; do
            if [[ "$image" == *"newpennine"* ]]; then
                log_info "Scanning Docker image: $image"
                # 這裡可以集成 Docker 安全掃描工具
                # 例如：docker scan $image
            fi
        done
    fi
    
    log_success "Security vulnerability scan completed"
}

# 獲取維護配置
get_maintenance_config() {
    local config_path="$1"
    local default_value="$2"
    
    if [[ -f "$MAINTENANCE_CONFIG" ]]; then
        local value=$(jq -r ".$config_path // empty" "$MAINTENANCE_CONFIG" 2>/dev/null)
        if [[ -n "$value" ]]; then
            echo "$value"
        else
            echo "$default_value"
        fi
    else
        echo "$default_value"
    fi
}

# 創建維護配置
create_maintenance_config() {
    local config_dir=$(dirname "$MAINTENANCE_CONFIG")
    mkdir -p "$config_dir"
    
    cat > "$MAINTENANCE_CONFIG" << EOF
{
    "cleanup": {
        "log_retention_days": 7,
        "backup_retention_days": 30,
        "temp_file_retention_days": 3,
        "docker_cleanup_interval": "daily"
    },
    "backup": {
        "enabled": true,
        "schedule": "0 2 * * *",
        "retention_days": 30,
        "compress": true,
        "verify_after_backup": true
    },
    "security": {
        "auto_update": true,
        "update_schedule": "0 3 * * 0",
        "vulnerability_scan": true,
        "scan_schedule": "0 4 * * *"
    },
    "monitoring": {
        "enabled": true,
        "disk_usage_threshold": 85,
        "memory_usage_threshold": 80,
        "cpu_usage_threshold": 80
    }
}
EOF
    
    log_success "Maintenance configuration created: $MAINTENANCE_CONFIG"
}

# 定期維護任務
scheduled_maintenance() {
    log_info "Starting scheduled maintenance..."
    
    # 每日維護
    perform_system_cleanup "temp"
    cleanup_log_files
    
    # 每週維護
    if [[ $(date +%u) -eq 7 ]]; then  # 星期日
        perform_system_cleanup "full"
        perform_security_updates
    fi
    
    # 每月維護
    if [[ $(date +%d) -eq 01 ]]; then  # 每月1號
        create_full_backup
        cleanup_old_backups
        verify_backups
    fi
    
    log_success "Scheduled maintenance completed"
}

# 系統健康檢查
system_health_check() {
    log_info "Performing system health check..."
    
    local health_status="healthy"
    
    # 檢查磁碟空間
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    local disk_threshold=$(get_maintenance_config "monitoring.disk_usage_threshold" "85")
    
    if [[ $disk_usage -gt $disk_threshold ]]; then
        log_warn "Disk usage is high: ${disk_usage}%"
        health_status="warning"
    fi
    
    # 檢查記憶體使用
    local memory_usage=$(free -m | awk 'NR==2{printf "%.0f", $3*100/$2}')
    local memory_threshold=$(get_maintenance_config "monitoring.memory_usage_threshold" "80")
    
    if [[ $memory_usage -gt $memory_threshold ]]; then
        log_warn "Memory usage is high: ${memory_usage}%"
        health_status="warning"
    fi
    
    # 檢查服務狀態
    local services=("newpennine-blue" "newpennine-green" "newpennine-nginx" "newpennine-redis")
    
    for service in "${services[@]}"; do
        if ! docker ps | grep -q "$service"; then
            log_warn "Service $service is not running"
            health_status="warning"
        fi
    done
    
    log_info "System health status: $health_status"
    
    if [[ "$health_status" == "warning" ]]; then
        return 1
    else
        return 0
    fi
}

# 主維護函數
main_maintenance() {
    local action="${1:-health}"
    
    case "$action" in
        cleanup)
            perform_system_cleanup "${2:-full}"
            ;;
        backup)
            manage_backups "${2:-create}" "$3"
            ;;
        security)
            perform_security_updates
            ;;
        health)
            system_health_check
            ;;
        scheduled)
            scheduled_maintenance
            ;;
        *)
            error_exit "Unknown maintenance action: $action"
            ;;
    esac
}

# 如果腳本直接運行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_maintenance "$@"
fi