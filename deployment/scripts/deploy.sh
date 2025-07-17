#!/bin/bash

# =================================================================
# NewPennine WMS 自動化部署腳本
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 完整的藍綠部署自動化腳本
# =================================================================

set -euo pipefail

# 全局配置
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly CONFIG_DIR="$SCRIPT_DIR/config"
readonly LOGS_DIR="$SCRIPT_DIR/logs"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly LOG_FILE="$LOGS_DIR/deploy_${TIMESTAMP}.log"

# 顏色定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# 創建日誌目錄
mkdir -p "$LOGS_DIR"

# 日誌函數
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# 錯誤處理
error_exit() {
    log_error "$1"
    exit 1
}

# 信號處理
cleanup() {
    log_info "Cleaning up deployment process..."
    # 這裡可以添加清理邏輯
    exit 130
}

trap cleanup INT TERM

# 載入配置
load_config() {
    local env_file="$CONFIG_DIR/environments/${ENVIRONMENT}.env"
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment config: $env_file"
        source "$env_file"
    else
        error_exit "Environment config file not found: $env_file"
    fi
}

# 載入工具函數
source "$SCRIPT_DIR/utils/common.sh"
source "$SCRIPT_DIR/utils/docker.sh"
source "$SCRIPT_DIR/utils/database.sh"
source "$SCRIPT_DIR/utils/health-check.sh"
source "$SCRIPT_DIR/utils/notifications.sh"

# 使用說明
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    部署環境 (staging, production)
    -v, --version VERSION    部署版本號
    -c, --color COLOR        目標顏色 (blue, green, auto)
    -t, --type TYPE          部署類型 (full, quick, rollback)
    -s, --skip-tests         跳過測試
    -b, --skip-backup        跳過備份
    -n, --dry-run            乾運行模式
    -h, --help               顯示幫助

Examples:
    $0 -e production -v 1.0.0 -c auto
    $0 -e staging -v 1.0.1 -c blue -t quick
    $0 -e production -v 1.0.0 -t rollback

EOF
}

# 參數解析
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -c|--color)
                TARGET_COLOR="$2"
                shift 2
                ;;
            -t|--type)
                DEPLOY_TYPE="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -b|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
}

# 預部署檢查
pre_deploy_checks() {
    log_info "Starting pre-deployment checks..."
    
    # 檢查必要工具
    check_dependencies
    
    # 檢查環境配置
    validate_environment
    
    # 檢查 Docker 狀態
    check_docker_status
    
    # 檢查資料庫連接
    check_database_connection
    
    # 檢查磁碟空間
    check_disk_space
    
    # 檢查現有服務狀態
    check_current_services
    
    log_success "Pre-deployment checks completed successfully"
}

# 確定目標顏色
determine_target_color() {
    if [[ "$TARGET_COLOR" == "auto" ]]; then
        local current_color=$(get_active_color)
        if [[ "$current_color" == "blue" ]]; then
            TARGET_COLOR="green"
        else
            TARGET_COLOR="blue"
        fi
    fi
    
    log_info "Target deployment color: $TARGET_COLOR"
}

# 準備部署環境
prepare_deployment_environment() {
    log_info "Preparing deployment environment..."
    
    # 停止目標環境
    stop_environment "$TARGET_COLOR"
    
    # 清理舊容器和映像
    cleanup_old_containers "$TARGET_COLOR"
    
    # 準備配置文件
    prepare_config_files
    
    # 設置環境變量
    set_environment_variables
    
    log_success "Deployment environment prepared"
}

# 構建應用程式
build_application() {
    log_info "Building application..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would build application with version $VERSION"
        return 0
    fi
    
    # 構建 Docker 映像
    build_docker_image "$TARGET_COLOR" "$VERSION"
    
    # 標記映像
    tag_docker_image "$TARGET_COLOR" "$VERSION"
    
    log_success "Application built successfully"
}

# 運行測試
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warn "Skipping tests as requested"
        return 0
    fi
    
    log_info "Running tests..."
    
    # 運行單元測試
    run_unit_tests
    
    # 運行集成測試
    run_integration_tests
    
    # 運行端到端測試
    run_e2e_tests
    
    log_success "All tests passed"
}

# 資料庫遷移
run_database_migration() {
    log_info "Running database migration..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would run database migration"
        return 0
    fi
    
    # 創建資料庫備份
    if [[ "$SKIP_BACKUP" != true ]]; then
        create_database_backup
    fi
    
    # 運行遷移
    run_migration_scripts
    
    log_success "Database migration completed"
}

# 部署新版本
deploy_new_version() {
    log_info "Deploying new version to $TARGET_COLOR environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would deploy version $VERSION to $TARGET_COLOR"
        return 0
    fi
    
    # 啟動新環境
    start_environment "$TARGET_COLOR"
    
    # 等待服務啟動
    wait_for_service_startup "$TARGET_COLOR"
    
    log_success "New version deployed to $TARGET_COLOR environment"
}

# 健康檢查
perform_health_checks() {
    log_info "Performing health checks..."
    
    # 基本健康檢查
    check_service_health "$TARGET_COLOR"
    
    # 詳細功能測試
    run_smoke_tests "$TARGET_COLOR"
    
    # 性能測試
    run_performance_tests "$TARGET_COLOR"
    
    log_success "Health checks completed successfully"
}

# 流量切換
switch_traffic() {
    log_info "Switching traffic to $TARGET_COLOR environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would switch traffic to $TARGET_COLOR"
        return 0
    fi
    
    # 更新 Nginx 配置
    update_nginx_config "$TARGET_COLOR"
    
    # 重載 Nginx
    reload_nginx
    
    # 驗證流量切換
    verify_traffic_switch "$TARGET_COLOR"
    
    log_success "Traffic switched to $TARGET_COLOR environment"
}

# 部署驗證
validate_deployment() {
    log_info "Validating deployment..."
    
    # 驗證服務可用性
    validate_service_availability
    
    # 驗證關鍵功能
    validate_critical_functions
    
    # 驗證性能指標
    validate_performance_metrics
    
    log_success "Deployment validated successfully"
}

# 清理工作
cleanup_deployment() {
    log_info "Cleaning up deployment..."
    
    # 停止舊環境
    local old_color=$(get_inactive_color)
    stop_environment "$old_color"
    
    # 清理舊資源
    cleanup_old_resources
    
    # 清理臨時文件
    cleanup_temp_files
    
    log_success "Deployment cleanup completed"
}

# 發送通知
send_notifications() {
    local status="$1"
    local message="$2"
    
    if [[ "$status" == "success" ]]; then
        send_success_notification "$message"
    else
        send_failure_notification "$message"
    fi
}

# 主部署流程
main_deployment_flow() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Target Color: $TARGET_COLOR"
    log_info "Deploy Type: $DEPLOY_TYPE"
    
    case "$DEPLOY_TYPE" in
        full)
            pre_deploy_checks
            prepare_deployment_environment
            build_application
            run_tests
            run_database_migration
            deploy_new_version
            perform_health_checks
            switch_traffic
            validate_deployment
            cleanup_deployment
            ;;
        quick)
            pre_deploy_checks
            prepare_deployment_environment
            build_application
            deploy_new_version
            perform_health_checks
            switch_traffic
            validate_deployment
            cleanup_deployment
            ;;
        rollback)
            log_info "Performing rollback..."
            perform_rollback
            ;;
        *)
            error_exit "Unknown deployment type: $DEPLOY_TYPE"
            ;;
    esac
}

# 主函數
main() {
    # 設置默認值
    ENVIRONMENT=""
    VERSION=""
    TARGET_COLOR="auto"
    DEPLOY_TYPE="full"
    SKIP_TESTS=false
    SKIP_BACKUP=false
    DRY_RUN=false
    
    # 解析參數
    parse_arguments "$@"
    
    # 驗證必要參數
    [[ -z "$ENVIRONMENT" ]] && error_exit "Environment is required"
    [[ -z "$VERSION" ]] && error_exit "Version is required"
    
    # 載入配置
    load_config
    
    # 確定目標顏色
    determine_target_color
    
    # 執行部署
    if main_deployment_flow; then
        log_success "Deployment completed successfully!"
        send_notifications "success" "Deployment $VERSION to $ENVIRONMENT completed successfully"
        exit 0
    else
        log_error "Deployment failed!"
        send_notifications "failure" "Deployment $VERSION to $ENVIRONMENT failed"
        exit 1
    fi
}

# 執行主函數
main "$@"