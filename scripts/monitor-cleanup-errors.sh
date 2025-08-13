#!/bin/bash

# Alert System Cleanup Error Monitoring Script
# 即時監控清理過程中的錯誤模式
# 作者: Error Detective Agent
# 版本: 1.0.0

set -euo pipefail

# 配置變數
LOG_DIR="/tmp/alert-cleanup-monitoring"
ALERT_THRESHOLD_DB_ERRORS=10
ALERT_THRESHOLD_API_ERRORS=5
ALERT_THRESHOLD_MEMORY=90
CHECK_INTERVAL=30

# 顏色定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 初始化監控目錄
mkdir -p "$LOG_DIR"
MONITORING_LOG="$LOG_DIR/cleanup-monitoring-$(date +%Y%m%d_%H%M%S).log"

# 日誌函數
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$MONITORING_LOG"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "${YELLOW}$1${NC}"; }
log_error() { log "ERROR" "${RED}$1${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$1${NC}"; }

# 檢查資料庫連接錯誤
check_database_errors() {
    local error_count=0
    
    # 檢查常見的資料庫錯誤模式
    if command -v journalctl &> /dev/null; then
        error_count=$(journalctl -u nextjs --since="5 minutes ago" | grep -c "relation.*does not exist" || echo "0")
    fi
    
    # 檢查應用日誌
    if [ -f "/var/log/app.log" ]; then
        error_count=$((error_count + $(tail -n 1000 /var/log/app.log | grep -c "relation.*does not exist" || echo "0")))
    fi
    
    log_info "Database errors in last 5 minutes: $error_count"
    
    if [ "$error_count" -gt "$ALERT_THRESHOLD_DB_ERRORS" ]; then
        log_error "CRITICAL: Database errors exceeded threshold ($error_count > $ALERT_THRESHOLD_DB_ERRORS)"
        echo "DATABASE_ERROR_CRITICAL" > "$LOG_DIR/rollback_trigger"
        return 1
    fi
    
    return 0
}

# 檢查 API 錯誤率
check_api_errors() {
    local api_error_count=0
    
    # 檢查 Next.js API 錯誤
    if command -v curl &> /dev/null; then
        # 測試關鍵 API 端點
        for endpoint in "/api/health" "/api/qc/dashboard" "/api/inventory/summary"; do
            if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" | grep -q "200"; then
                api_error_count=$((api_error_count + 1))
            fi
        done
    fi
    
    log_info "API errors detected: $api_error_count"
    
    if [ "$api_error_count" -gt "$ALERT_THRESHOLD_API_ERRORS" ]; then
        log_error "CRITICAL: API errors exceeded threshold ($api_error_count > $ALERT_THRESHOLD_API_ERRORS)"
        echo "API_ERROR_CRITICAL" > "$LOG_DIR/rollback_trigger"
        return 1
    fi
    
    return 0
}

# 檢查記憶體使用量
check_memory_usage() {
    local memory_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    log_info "Memory usage: ${memory_usage}%"
    
    if [ "$memory_usage" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
        log_warn "WARNING: High memory usage detected (${memory_usage}% > ${ALERT_THRESHOLD_MEMORY}%)"
        return 1
    fi
    
    return 0
}

# 檢查 Redis 連接
check_redis_health() {
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping | grep -q "PONG"; then
            log_success "Redis connection healthy"
            return 0
        else
            log_error "Redis connection failed"
            return 1
        fi
    else
        log_warn "Redis CLI not available for health check"
        return 0
    fi
}

# 檢查特定的 Alert System 錯誤模式
check_alert_system_patterns() {
    local patterns=(
        "from('alerts')"
        "from('alert_rules')" 
        "from('alert_suppressions')"
        "SUPABASE_SERVICE_ROLE_KEY"
        "AlertStateManager"
        "AlertRuleEngine"
    )
    
    log_info "Checking for remaining Alert System patterns..."
    
    for pattern in "${patterns[@]}"; do
        local count=$(find /Users/chun/Documents/PennineWMS/online-stock-control-system -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs grep -l "$pattern" 2>/dev/null | wc -l || echo "0")
        log_info "Pattern '$pattern' found in $count files"
        
        # 如果在 Phase 3 之後還發現這些模式，可能表示清理不完整
        if [ -f "$LOG_DIR/phase3_completed" ] && [ "$count" -gt 0 ]; then
            log_warn "WARNING: Alert System patterns still exist after cleanup ($pattern: $count files)"
        fi
    done
}

# 檢查 TypeScript 編譯錯誤
check_typescript_errors() {
    log_info "Checking TypeScript compilation..."
    
    if command -v npx &> /dev/null; then
        local ts_errors=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
        log_info "TypeScript compilation errors: $ts_errors"
        
        if [ "$ts_errors" -gt 0 ]; then
            log_warn "TypeScript compilation errors detected"
            npx tsc --noEmit 2>&1 | head -n 20 | tee -a "$MONITORING_LOG"
            return 1
        fi
    else
        log_warn "TypeScript compiler not available"
    fi
    
    return 0
}

# 生成監控報告
generate_monitoring_report() {
    local report_file="$LOG_DIR/monitoring-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "monitoring_duration": "$(date -d @$SECONDS -u +%H:%M:%S)",
    "checks_performed": {
        "database_errors": true,
        "api_errors": true, 
        "memory_usage": true,
        "redis_health": true,
        "alert_patterns": true,
        "typescript_compilation": true
    },
    "status": "$([ -f "$LOG_DIR/rollback_trigger" ] && echo "CRITICAL" || echo "NORMAL")",
    "log_file": "$MONITORING_LOG",
    "next_check": "$(date -d "+$CHECK_INTERVAL seconds" '+%Y-%m-%d %H:%M:%S')"
}
EOF
    
    log_info "Monitoring report generated: $report_file"
}

# 主監控迴圈
main_monitoring_loop() {
    log_success "Alert System Cleanup Error Monitoring Started"
    log_info "Monitoring interval: ${CHECK_INTERVAL}s"
    log_info "Log directory: $LOG_DIR"
    
    # 清理之前的觸發檔案
    rm -f "$LOG_DIR/rollback_trigger"
    
    while true; do
        log_info "=== Starting monitoring cycle ==="
        
        # 執行所有檢查
        local checks_failed=0
        
        check_database_errors || checks_failed=$((checks_failed + 1))
        check_api_errors || checks_failed=$((checks_failed + 1))
        check_memory_usage || checks_failed=$((checks_failed + 1))
        check_redis_health || checks_failed=$((checks_failed + 1))
        check_alert_system_patterns || checks_failed=$((checks_failed + 1))
        check_typescript_errors || checks_failed=$((checks_failed + 1))
        
        # 檢查是否需要觸發回滾
        if [ -f "$LOG_DIR/rollback_trigger" ]; then
            local trigger_reason=$(cat "$LOG_DIR/rollback_trigger")
            log_error "ROLLBACK TRIGGER ACTIVATED: $trigger_reason"
            log_error "Immediate action required!"
            
            # 發送警告信號 (如果可用)
            if command -v notify-send &> /dev/null; then
                notify-send -u critical "Alert Cleanup Monitoring" "Rollback trigger activated: $trigger_reason"
            fi
            
            break
        fi
        
        if [ "$checks_failed" -eq 0 ]; then
            log_success "All checks passed ✓"
        else
            log_warn "$checks_failed checks failed"
        fi
        
        generate_monitoring_report
        
        log_info "=== Monitoring cycle complete, sleeping for ${CHECK_INTERVAL}s ===\\n"
        sleep "$CHECK_INTERVAL"
    done
}

# 命令行參數處理
case "${1:-start}" in
    "start")
        main_monitoring_loop
        ;;
    "report")
        generate_monitoring_report
        ;;
    "check")
        log_info "Performing single check cycle..."
        check_database_errors && check_api_errors && check_memory_usage && check_redis_health
        ;;
    "stop")
        echo "MONITORING_STOP" > "$LOG_DIR/rollback_trigger"
        log_info "Monitoring stop requested"
        ;;
    *)
        echo "Usage: $0 {start|report|check|stop}"
        echo "  start  - Begin continuous monitoring"
        echo "  report - Generate current monitoring report"
        echo "  check  - Perform single check cycle"
        echo "  stop   - Stop monitoring"
        exit 1
        ;;
esac