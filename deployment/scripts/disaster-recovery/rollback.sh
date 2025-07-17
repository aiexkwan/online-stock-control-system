#!/bin/bash

# =================================================================
# 災難恢復和回滾腳本
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 自動回滾、故障轉移和數據恢復腳本
# =================================================================

# 回滾配置
readonly ROLLBACK_CONFIG="$CONFIG_DIR/rollback.json"
readonly ROLLBACK_LOG="$LOGS_DIR/rollback.log"
readonly RECOVERY_DIR="$LOGS_DIR/recovery"
readonly CHECKPOINT_DIR="$RECOVERY_DIR/checkpoints"

# 創建必要目錄
mkdir -p "$RECOVERY_DIR" "$CHECKPOINT_DIR"

# 執行回滾
perform_rollback() {
    local rollback_type="${1:-auto}"
    local target_version="${2:-}"
    
    log_info "Starting rollback process (type: $rollback_type)..."
    
    # 設置回滾開始時間
    export ROLLBACK_START_TIME=$(date +%s)
    
    # 記錄回滾開始
    record_rollback_start "$rollback_type" "$target_version"
    
    case "$rollback_type" in
        auto)
            perform_automatic_rollback
            ;;
        manual)
            perform_manual_rollback "$target_version"
            ;;
        database)
            perform_database_rollback "$target_version"
            ;;
        configuration)
            perform_configuration_rollback "$target_version"
            ;;
        full)
            perform_full_rollback "$target_version"
            ;;
        *)
            error_exit "Unknown rollback type: $rollback_type"
            ;;
    esac
    
    # 記錄回滾完成
    record_rollback_completion
    
    log_success "Rollback completed successfully"
}

# 自動回滾
perform_automatic_rollback() {
    log_info "Performing automatic rollback..."
    
    # 獲取當前活動顏色
    local current_color=$(get_active_color)
    local target_color=$(get_inactive_color)
    
    if [[ "$current_color" == "unknown" ]]; then
        error_exit "Cannot determine current active color"
    fi
    
    log_info "Current active color: $current_color"
    log_info "Rolling back to: $target_color"
    
    # 檢查目標環境健康狀態
    if ! check_environment_health "$target_color"; then
        error_exit "Target environment ($target_color) is not healthy for rollback"
    fi
    
    # 執行流量切換
    log_info "Switching traffic to $target_color environment..."
    update_nginx_config "$target_color"
    reload_nginx
    
    # 驗證回滾
    if verify_rollback "$target_color"; then
        log_success "Automatic rollback completed successfully"
        
        # 停止有問題的環境
        stop_environment "$current_color"
        
        # 發送回滾通知
        send_rollback_notification "success" "Automatic rollback to $target_color completed successfully"
    else
        error_exit "Automatic rollback verification failed"
    fi
}

# 手動回滾
perform_manual_rollback() {
    local target_version="$1"
    
    if [[ -z "$target_version" ]]; then
        error_exit "Target version is required for manual rollback"
    fi
    
    log_info "Performing manual rollback to version: $target_version"
    
    # 檢查目標版本是否存在
    if ! check_version_exists "$target_version"; then
        error_exit "Target version $target_version does not exist"
    fi
    
    # 創建回滾檢查點
    create_rollback_checkpoint
    
    # 停止當前服務
    local current_color=$(get_active_color)
    stop_environment "$current_color"
    
    # 部署目標版本
    deploy_specific_version "$target_version" "$current_color"
    
    # 驗證回滾
    if verify_rollback "$current_color"; then
        log_success "Manual rollback to version $target_version completed successfully"
        send_rollback_notification "success" "Manual rollback to version $target_version completed successfully"
    else
        error_exit "Manual rollback verification failed"
    fi
}

# 資料庫回滾
perform_database_rollback() {
    local target_backup="$1"
    
    log_info "Performing database rollback..."
    
    if [[ -z "$target_backup" ]]; then
        # 尋找最近的備份
        target_backup=$(find_latest_database_backup)
        if [[ -z "$target_backup" ]]; then
            error_exit "No database backup found for rollback"
        fi
    fi
    
    log_info "Rolling back database to: $target_backup"
    
    # 創建當前資料庫備份
    log_info "Creating safety backup of current database..."
    local safety_backup=$(create_database_backup)
    
    # 驗證目標備份
    if ! verify_database_backup "$target_backup"; then
        error_exit "Target database backup is invalid: $target_backup"
    fi
    
    # 停止應用服務
    log_info "Stopping application services..."
    stop_environment "blue"
    stop_environment "green"
    
    # 執行資料庫恢復
    log_info "Restoring database from backup..."
    restore_database_backup "$target_backup"
    
    # 重啟服務
    log_info "Restarting services..."
    local active_color=$(get_active_color)
    start_environment "$active_color"
    
    # 驗證資料庫恢復
    if verify_database_recovery; then
        log_success "Database rollback completed successfully"
        send_rollback_notification "success" "Database rollback completed successfully"
    else
        error_exit "Database rollback verification failed"
    fi
}

# 配置回滾
perform_configuration_rollback() {
    local target_config="$1"
    
    log_info "Performing configuration rollback..."
    
    if [[ -z "$target_config" ]]; then
        # 尋找最近的配置備份
        target_config=$(find_latest_config_backup)
        if [[ -z "$target_config" ]]; then
            error_exit "No configuration backup found for rollback"
        fi
    fi
    
    log_info "Rolling back configuration to: $target_config"
    
    # 備份當前配置
    backup_current_configuration
    
    # 恢復配置
    restore_configuration "$target_config"
    
    # 重載服務
    reload_services
    
    # 驗證配置恢復
    if verify_configuration_recovery; then
        log_success "Configuration rollback completed successfully"
        send_rollback_notification "success" "Configuration rollback completed successfully"
    else
        error_exit "Configuration rollback verification failed"
    fi
}

# 完整回滾
perform_full_rollback() {
    local target_version="$1"
    
    log_info "Performing full system rollback..."
    
    # 創建完整系統檢查點
    create_full_system_checkpoint
    
    # 執行資料庫回滾
    perform_database_rollback
    
    # 執行配置回滾
    perform_configuration_rollback
    
    # 執行應用回滾
    if [[ -n "$target_version" ]]; then
        perform_manual_rollback "$target_version"
    else
        perform_automatic_rollback
    fi
    
    log_success "Full system rollback completed successfully"
}

# 檢查環境健康狀態
check_environment_health() {
    local color="$1"
    
    log_info "Checking health of $color environment..."
    
    # 檢查容器狀態
    if ! check_container_health "newpennine-$color"; then
        log_error "$color environment container is not healthy"
        return 1
    fi
    
    # 檢查服務響應
    if ! check_service_health "$color"; then
        log_error "$color environment service is not responding"
        return 1
    fi
    
    # 檢查資料庫連接
    if ! check_database_connection; then
        log_error "Database connection failed"
        return 1
    fi
    
    log_success "$color environment is healthy"
    return 0
}

# 檢查版本是否存在
check_version_exists() {
    local version="$1"
    
    # 檢查 Docker 映像
    if docker images | grep -q "newpennine-wms:$version"; then
        return 0
    fi
    
    # 檢查 Git 標籤
    if git tag | grep -q "^$version$"; then
        return 0
    fi
    
    return 1
}

# 創建回滾檢查點
create_rollback_checkpoint() {
    local checkpoint_id="rollback_$(date +%Y%m%d_%H%M%S)"
    local checkpoint_path="$CHECKPOINT_DIR/$checkpoint_id"
    
    log_info "Creating rollback checkpoint: $checkpoint_id"
    
    mkdir -p "$checkpoint_path"
    
    # 保存當前狀態
    save_current_state "$checkpoint_path"
    
    # 保存配置
    save_current_configuration "$checkpoint_path"
    
    # 保存服務狀態
    save_service_state "$checkpoint_path"
    
    log_success "Rollback checkpoint created: $checkpoint_path"
    echo "$checkpoint_path"
}

# 保存當前狀態
save_current_state() {
    local checkpoint_path="$1"
    
    # 保存部署狀態
    jq -n \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg active_color "$(get_active_color)" \
        --arg version "$VERSION" \
        --arg environment "$ENVIRONMENT" \
        '{
            timestamp: $timestamp,
            active_color: $active_color,
            version: $version,
            environment: $environment,
            git_commit: "'$(git rev-parse HEAD)'",
            git_branch: "'$(git rev-parse --abbrev-ref HEAD)'"
        }' > "$checkpoint_path/deployment_state.json"
    
    # 保存容器狀態
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" > "$checkpoint_path/containers.txt"
    
    # 保存網絡狀態
    docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" > "$checkpoint_path/networks.txt"
}

# 保存當前配置
save_current_configuration() {
    local checkpoint_path="$1"
    local config_path="$checkpoint_path/config"
    
    mkdir -p "$config_path"
    
    # 保存部署配置
    if [[ -d "$CONFIG_DIR" ]]; then
        cp -r "$CONFIG_DIR"/* "$config_path/"
    fi
    
    # 保存 Nginx 配置
    if [[ -f "$PROJECT_ROOT/deployment/nginx/conf.d/default.conf" ]]; then
        cp "$PROJECT_ROOT/deployment/nginx/conf.d/default.conf" "$config_path/"
    fi
    
    # 保存 Docker Compose 配置
    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.prod.yml" "$config_path/"
    fi
}

# 保存服務狀態
save_service_state() {
    local checkpoint_path="$1"
    
    # 保存服務健康狀態
    generate_health_report "blue" > "$checkpoint_path/blue_health.json"
    generate_health_report "green" > "$checkpoint_path/green_health.json"
    
    # 保存 Nginx 狀態
    if curl -s http://localhost/nginx_status > "$checkpoint_path/nginx_status.txt"; then
        log_info "Nginx status saved"
    fi
    
    # 保存資料庫狀態
    if check_database_connection; then
        check_database_health > "$checkpoint_path/database_health.json"
    fi
}

# 部署特定版本
deploy_specific_version() {
    local version="$1"
    local color="$2"
    
    log_info "Deploying version $version to $color environment..."
    
    # 檢查映像是否存在
    if ! docker images | grep -q "newpennine-wms:$version"; then
        log_info "Building image for version $version..."
        
        # 檢出特定版本
        git checkout "$version"
        
        # 構建映像
        build_docker_image "$color" "$version"
        
        # 標記映像
        tag_docker_image "$color" "$version"
    fi
    
    # 啟動環境
    start_environment "$color"
    
    # 等待服務啟動
    wait_for_service_startup "$color"
    
    log_success "Version $version deployed to $color environment"
}

# 驗證回滾
verify_rollback() {
    local color="$1"
    
    log_info "Verifying rollback for $color environment..."
    
    # 檢查服務健康狀態
    if ! check_service_health "$color"; then
        log_error "Service health check failed for $color"
        return 1
    fi
    
    # 檢查基本功能
    if ! run_smoke_tests "$color"; then
        log_error "Smoke tests failed for $color"
        return 1
    fi
    
    # 檢查資料庫連接
    if ! check_database_connection; then
        log_error "Database connection check failed"
        return 1
    fi
    
    # 檢查關鍵端點
    local endpoints=(
        "/api/v1/health"
        "/api/v1/metrics"
        "/main-login"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! verify_endpoint_response "$color" "$endpoint"; then
            log_error "Endpoint verification failed: $endpoint"
            return 1
        fi
    done
    
    log_success "Rollback verification passed for $color environment"
    return 0
}

# 驗證端點響應
verify_endpoint_response() {
    local color="$1"
    local endpoint="$2"
    
    local port
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) return 1 ;;
    esac
    
    local url="http://localhost:$port$endpoint"
    
    if curl -f -s "$url" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# 故障轉移
perform_failover() {
    local reason="${1:-manual}"
    
    log_info "Performing failover (reason: $reason)..."
    
    # 獲取當前狀態
    local current_color=$(get_active_color)
    local target_color=$(get_inactive_color)
    
    log_info "Failing over from $current_color to $target_color"
    
    # 檢查目標環境
    if ! check_environment_health "$target_color"; then
        error_exit "Target environment ($target_color) is not healthy for failover"
    fi
    
    # 執行流量切換
    log_info "Switching traffic to $target_color..."
    update_nginx_config "$target_color"
    reload_nginx
    
    # 驗證故障轉移
    if verify_failover "$target_color"; then
        log_success "Failover completed successfully"
        
        # 發送故障轉移通知
        send_failover_notification "success" "Failover to $target_color completed successfully"
        
        # 嘗試診斷原環境問題
        diagnose_environment_issues "$current_color"
    else
        error_exit "Failover verification failed"
    fi
}

# 驗證故障轉移
verify_failover() {
    local color="$1"
    
    log_info "Verifying failover to $color environment..."
    
    # 檢查流量切換
    if ! verify_traffic_switch "$color"; then
        log_error "Traffic switch verification failed"
        return 1
    fi
    
    # 檢查服務可用性
    if ! validate_service_availability; then
        log_error "Service availability check failed"
        return 1
    fi
    
    # 檢查關鍵功能
    if ! validate_critical_functions; then
        log_error "Critical functions validation failed"
        return 1
    fi
    
    log_success "Failover verification passed"
    return 0
}

# 診斷環境問題
diagnose_environment_issues() {
    local color="$1"
    
    log_info "Diagnosing issues in $color environment..."
    
    local diagnosis_file="$RECOVERY_DIR/diagnosis_${color}_$(date +%Y%m%d_%H%M%S).log"
    
    {
        echo "=== Environment Diagnosis Report ==="
        echo "Environment: $color"
        echo "Timestamp: $(date)"
        echo ""
        
        echo "=== Container Status ==="
        docker ps -a | grep "newpennine-$color"
        echo ""
        
        echo "=== Container Logs ==="
        docker logs --tail 50 "newpennine-$color" 2>&1
        echo ""
        
        echo "=== Resource Usage ==="
        docker stats "newpennine-$color" --no-stream
        echo ""
        
        echo "=== Health Check ==="
        local port
        case "$color" in
            blue) port=3001 ;;
            green) port=3002 ;;
        esac
        
        curl -s "http://localhost:$port/api/v1/health" || echo "Health check failed"
        echo ""
        
        echo "=== Network Status ==="
        docker network ls
        echo ""
        
        echo "=== Volume Status ==="
        docker volume ls
        echo ""
        
    } > "$diagnosis_file"
    
    log_success "Diagnosis report created: $diagnosis_file"
}

# 數據恢復
perform_data_recovery() {
    local recovery_type="${1:-full}"
    local target_backup="${2:-}"
    
    log_info "Performing data recovery (type: $recovery_type)..."
    
    case "$recovery_type" in
        database)
            recover_database "$target_backup"
            ;;
        configuration)
            recover_configuration "$target_backup"
            ;;
        full)
            recover_full_system "$target_backup"
            ;;
        *)
            error_exit "Unknown recovery type: $recovery_type"
            ;;
    esac
    
    log_success "Data recovery completed"
}

# 恢復資料庫
recover_database() {
    local target_backup="$1"
    
    log_info "Recovering database..."
    
    if [[ -z "$target_backup" ]]; then
        target_backup=$(find_latest_database_backup)
        if [[ -z "$target_backup" ]]; then
            error_exit "No database backup found for recovery"
        fi
    fi
    
    log_info "Restoring database from: $target_backup"
    
    # 停止應用服務
    stop_all_services
    
    # 恢復資料庫
    restore_database_backup "$target_backup"
    
    # 重啟服務
    start_all_services
    
    # 驗證恢復
    if verify_database_recovery; then
        log_success "Database recovery completed successfully"
    else
        error_exit "Database recovery verification failed"
    fi
}

# 恢復配置
recover_configuration() {
    local target_backup="$1"
    
    log_info "Recovering configuration..."
    
    if [[ -z "$target_backup" ]]; then
        target_backup=$(find_latest_config_backup)
        if [[ -z "$target_backup" ]]; then
            error_exit "No configuration backup found for recovery"
        fi
    fi
    
    log_info "Restoring configuration from: $target_backup"
    
    # 恢復配置
    restore_configuration "$target_backup"
    
    # 重載服務
    reload_services
    
    # 驗證恢復
    if verify_configuration_recovery; then
        log_success "Configuration recovery completed successfully"
    else
        error_exit "Configuration recovery verification failed"
    fi
}

# 恢復完整系統
recover_full_system() {
    local target_backup="$1"
    
    log_info "Recovering full system..."
    
    # 創建恢復檢查點
    create_recovery_checkpoint
    
    # 恢復資料庫
    recover_database
    
    # 恢復配置
    recover_configuration
    
    # 恢復應用
    if [[ -n "$target_backup" ]]; then
        restore_application_backup "$target_backup"
    fi
    
    # 全面驗證
    if verify_full_system_recovery; then
        log_success "Full system recovery completed successfully"
    else
        error_exit "Full system recovery verification failed"
    fi
}

# 尋找最新的資料庫備份
find_latest_database_backup() {
    find "$BACKUP_DIR" -name "*database_backup*.sql.gz" -o -name "*database_backup*.sql" | sort -r | head -1
}

# 尋找最新的配置備份
find_latest_config_backup() {
    find "$BACKUP_DIR" -name "*config*" -type f | sort -r | head -1
}

# 驗證資料庫恢復
verify_database_recovery() {
    log_info "Verifying database recovery..."
    
    # 檢查資料庫連接
    if ! check_database_connection; then
        return 1
    fi
    
    # 檢查資料庫健康狀態
    if ! check_database_health; then
        return 1
    fi
    
    # 檢查關鍵表格
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    local table_count=$(psql "$connection_string" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [[ $table_count -lt 10 ]]; then
        log_error "Database recovery verification failed: insufficient tables ($table_count)"
        return 1
    fi
    
    log_success "Database recovery verification passed"
    return 0
}

# 驗證配置恢復
verify_configuration_recovery() {
    log_info "Verifying configuration recovery..."
    
    # 檢查配置文件
    if [[ ! -f "$CONFIG_DIR/environments/${ENVIRONMENT}.env" ]]; then
        log_error "Environment configuration file missing"
        return 1
    fi
    
    # 檢查 Nginx 配置
    if ! validate_nginx_config; then
        log_error "Nginx configuration validation failed"
        return 1
    fi
    
    # 檢查 Docker Compose 配置
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" config > /dev/null 2>&1; then
        log_error "Docker Compose configuration validation failed"
        return 1
    fi
    
    log_success "Configuration recovery verification passed"
    return 0
}

# 驗證完整系統恢復
verify_full_system_recovery() {
    log_info "Verifying full system recovery..."
    
    # 驗證資料庫恢復
    if ! verify_database_recovery; then
        return 1
    fi
    
    # 驗證配置恢復
    if ! verify_configuration_recovery; then
        return 1
    fi
    
    # 驗證服務可用性
    if ! validate_service_availability; then
        return 1
    fi
    
    # 驗證關鍵功能
    if ! validate_critical_functions; then
        return 1
    fi
    
    log_success "Full system recovery verification passed"
    return 0
}

# 停止所有服務
stop_all_services() {
    log_info "Stopping all services..."
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down
    
    log_success "All services stopped"
}

# 啟動所有服務
start_all_services() {
    log_info "Starting all services..."
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d
    
    # 等待服務啟動
    sleep 30
    
    log_success "All services started"
}

# 重載服務
reload_services() {
    log_info "Reloading services..."
    
    # 重載 Nginx
    reload_nginx
    
    # 重啟應用服務
    restart_compose_service "newpennine-blue"
    restart_compose_service "newpennine-green"
    
    log_success "Services reloaded"
}

# 記錄回滾開始
record_rollback_start() {
    local rollback_type="$1"
    local target_version="$2"
    
    jq -n \
        --arg id "rollback_$(date +%Y%m%d_%H%M%S)" \
        --arg type "$rollback_type" \
        --arg target_version "$target_version" \
        --arg start_time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg environment "$ENVIRONMENT" \
        --arg user "$(whoami)" \
        --arg hostname "$(hostname)" \
        '{
            id: $id,
            type: $type,
            target_version: $target_version,
            start_time: $start_time,
            environment: $environment,
            user: $user,
            hostname: $hostname,
            status: "started"
        }' > "$RECOVERY_DIR/rollback_$(date +%Y%m%d_%H%M%S).json"
}

# 記錄回滾完成
record_rollback_completion() {
    local rollback_files=($(find "$RECOVERY_DIR" -name "rollback_*.json" -exec ls -t {} + | head -1))
    
    if [[ ${#rollback_files[@]} -gt 0 ]]; then
        local rollback_file="${rollback_files[0]}"
        local rollback_data=$(cat "$rollback_file")
        
        echo "$rollback_data" | jq \
            --arg end_time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --arg duration "$(calculate_duration)" \
            --arg status "completed" \
            '. + {
                end_time: $end_time,
                duration: $duration,
                status: $status
            }' > "$rollback_file"
    fi
}

# 發送回滾通知
send_rollback_notification() {
    local status="$1"
    local message="$2"
    
    if [[ "$status" == "success" ]]; then
        send_success_notification "$message"
    else
        send_failure_notification "$message"
    fi
}

# 發送故障轉移通知
send_failover_notification() {
    local status="$1"
    local message="$2"
    
    if [[ "$status" == "success" ]]; then
        send_success_notification "$message"
    else
        send_failure_notification "$message"
    fi
}

# 創建恢復檢查點
create_recovery_checkpoint() {
    local checkpoint_id="recovery_$(date +%Y%m%d_%H%M%S)"
    local checkpoint_path="$CHECKPOINT_DIR/$checkpoint_id"
    
    log_info "Creating recovery checkpoint: $checkpoint_id"
    
    mkdir -p "$checkpoint_path"
    
    # 保存當前狀態
    save_current_state "$checkpoint_path"
    save_current_configuration "$checkpoint_path"
    save_service_state "$checkpoint_path"
    
    log_success "Recovery checkpoint created: $checkpoint_path"
    echo "$checkpoint_path"
}

# 主災難恢復函數
main_disaster_recovery() {
    local action="${1:-rollback}"
    
    case "$action" in
        rollback)
            perform_rollback "${2:-auto}" "$3"
            ;;
        failover)
            perform_failover "${2:-manual}"
            ;;
        recovery)
            perform_data_recovery "${2:-full}" "$3"
            ;;
        checkpoint)
            create_rollback_checkpoint
            ;;
        diagnose)
            diagnose_environment_issues "${2:-blue}"
            ;;
        *)
            error_exit "Unknown disaster recovery action: $action"
            ;;
    esac
}

# 如果腳本直接運行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_disaster_recovery "$@"
fi