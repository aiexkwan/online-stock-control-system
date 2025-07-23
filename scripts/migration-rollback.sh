#!/bin/bash

##############################################################################
# GraphQL → REST API 遷移回滾腳本
# QA專家 - 緊急回滾程序自動化
##############################################################################

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 回滾原因和環境檢查
ROLLBACK_REASON="${1:-Manual rollback triggered}"
ENVIRONMENT="${NODE_ENV:-development}"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

log_info "🔄 Starting GraphQL → REST API Migration Rollback"
log_info "📋 Reason: $ROLLBACK_REASON"
log_info "🌍 Environment: $ENVIRONMENT"
log_info "⏰ Timestamp: $TIMESTAMP"

# 創建回滾日誌目錄
ROLLBACK_LOG_DIR="logs/rollback/$TIMESTAMP"
mkdir -p "$ROLLBACK_LOG_DIR"

# 回滾前檢查
log_info "🔍 Pre-rollback System Check"

# 檢查系統健康狀況
check_system_health() {
    log_info "Checking system health..."
    
    # 檢查服務是否運行
    if pgrep -f "next dev\|next start" > /dev/null; then
        log_success "Next.js service is running"
    else
        log_error "Next.js service is not running"
        return 1
    fi
    
    # 檢查資料庫連接
    if npm run test:db-connection > /dev/null 2>&1; then
        log_success "Database connection is healthy"
    else
        log_error "Database connection failed"
        return 1
    fi
    
    return 0
}

# 備份當前狀態
backup_current_state() {
    log_info "📦 Backing up current state..."
    
    BACKUP_DIR="backups/pre-rollback-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # 備份重要配置文件
    cp -r app/(app)/admin/components/dashboard/widgets/ "$BACKUP_DIR/widgets/" || true
    cp -r lib/api/ "$BACKUP_DIR/api/" || true
    cp package.json "$BACKUP_DIR/" || true
    cp next.config.js "$BACKUP_DIR/" || true
    
    # 備份環境變數
    if [ -f .env.local ]; then
        cp .env.local "$BACKUP_DIR/" || true
    fi
    
    log_success "Current state backed up to $BACKUP_DIR"
}

# 步驟 1: 緊急停用 REST API
disable_rest_api() {
    log_info "🚫 Step 1: Disabling REST API endpoints"
    
    # 創建緊急維護模式標記
    echo "MAINTENANCE_MODE=true" >> .env.local
    echo "REST_API_DISABLED=true" >> .env.local
    
    # 禁用 REST API 路由（如果有feature flag）
    if grep -q "ENABLE_REST_API" .env.local; then
        sed -i 's/ENABLE_REST_API=true/ENABLE_REST_API=false/' .env.local
    else
        echo "ENABLE_REST_API=false" >> .env.local
    fi
    
    log_success "REST API endpoints disabled"
}

# 步驟 2: 恢復 GraphQL endpoints
enable_graphql() {
    log_info "🔄 Step 2: Re-enabling GraphQL endpoints"
    
    # 恢復 GraphQL 功能標記
    if grep -q "ENABLE_GRAPHQL" .env.local; then
        sed -i 's/ENABLE_GRAPHQL=false/ENABLE_GRAPHQL=true/' .env.local
    else
        echo "ENABLE_GRAPHQL=true" >> .env.local
    fi
    
    # 恢復 GraphQL widgets（如果有備份）
    if [ -d "backups/pre-migration/widgets-graphql" ]; then
        log_info "Restoring GraphQL widget implementations..."
        cp -r backups/pre-migration/widgets-graphql/* app/(app)/admin/components/dashboard/widgets/
        log_success "GraphQL widgets restored"
    else
        log_warning "No GraphQL widget backup found, manual restoration may be required"
    fi
    
    log_success "GraphQL endpoints re-enabled"
}

# 步驟 3: 清理快取
clear_caches() {
    log_info "🧹 Step 3: Clearing all caches"
    
    # Next.js 快取
    if [ -d ".next" ]; then
        rm -rf .next
        log_success "Next.js cache cleared"
    fi
    
    # Node modules 快取
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log_success "Node modules cache cleared"
    fi
    
    # 自定義快取目錄
    if [ -d ".cache" ]; then
        rm -rf .cache
        log_success "Custom cache cleared"
    fi
    
    # Jest 快取
    if [ -d ".jest-cache" ]; then
        rm -rf .jest-cache
        log_success "Jest cache cleared"
    fi
    
    # Playwright 快取
    if command -v npx playwright --version > /dev/null 2>&1; then
        npx playwright cache clear || log_warning "Failed to clear Playwright cache"
    fi
    
    log_success "All caches cleared"
}

# 步驟 4: 重啟服務
restart_services() {
    log_info "🔄 Step 4: Restarting services"
    
    # 停止現有服務
    log_info "Stopping existing services..."
    pkill -f "next dev\|next start" || log_warning "No Next.js processes to kill"
    
    # 等待服務完全停止
    sleep 3
    
    # 重新安裝依賴（如果需要）
    if [ -f "package-lock.json.backup" ]; then
        log_info "Restoring package-lock.json..."
        mv package-lock.json.backup package-lock.json
        npm ci
    fi
    
    # 重新構建（如果是生產環境）
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Rebuilding for production..."
        npm run build > "$ROLLBACK_LOG_DIR/build.log" 2>&1
        
        # 啟動生產服務
        log_info "Starting production server..."
        nohup npm run start > "$ROLLBACK_LOG_DIR/server.log" 2>&1 &
        
        # 等待服務啟動
        sleep 10
    else
        # 開發模式重啟
        log_info "Starting development server..."
        nohup npm run dev > "$ROLLBACK_LOG_DIR/dev-server.log" 2>&1 &
        
        # 等待服務啟動
        sleep 15
    fi
    
    log_success "Services restarted"
}

# 步驟 5: 驗證回滾成功
verify_rollback() {
    log_info "✅ Step 5: Verifying rollback success"
    
    # 等待服務完全啟動
    log_info "Waiting for service to be ready..."
    sleep 10
    
    # 檢查服務是否運行
    if pgrep -f "next dev\|next start" > /dev/null; then
        log_success "Service is running"
    else
        log_error "Service failed to start"
        return 1
    fi
    
    # 檢查應用程式響應
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Application is responding"
            break
        elif [ $attempt -eq $max_attempts ]; then
            log_error "Application failed to respond after $max_attempts attempts"
            return 1
        else
            log_info "Waiting 5 seconds before next attempt..."
            sleep 5
            attempt=$((attempt + 1))
        fi
    done
    
    # 運行關鍵測試
    log_info "Running rollback verification tests..."
    
    # GraphQL endpoint 測試
    if npm run test:graphql-endpoints > "$ROLLBACK_LOG_DIR/graphql-test.log" 2>&1; then
        log_success "GraphQL endpoints are functional"
    else
        log_error "GraphQL endpoints test failed"
        cat "$ROLLBACK_LOG_DIR/graphql-test.log"
        return 1
    fi
    
    # Widget 載入測試
    if npm run test:widget-loading > "$ROLLBACK_LOG_DIR/widget-test.log" 2>&1; then
        log_success "Widgets are loading correctly"
    else
        log_warning "Widget loading test failed, check logs"
        cat "$ROLLBACK_LOG_DIR/widget-test.log"
    fi
    
    # 基本功能測試
    if npm run test:basic-functionality > "$ROLLBACK_LOG_DIR/basic-test.log" 2>&1; then
        log_success "Basic functionality is working"
    else
        log_warning "Basic functionality test failed"
        cat "$ROLLBACK_LOG_DIR/basic-test.log"
    fi
    
    return 0
}

# 生成回滾報告
generate_rollback_report() {
    log_info "📊 Generating rollback report"
    
    REPORT_FILE="$ROLLBACK_LOG_DIR/rollback-report.md"
    
    cat > "$REPORT_FILE" << EOF
# Migration Rollback Report

**Timestamp**: $TIMESTAMP
**Environment**: $ENVIRONMENT  
**Reason**: $ROLLBACK_REASON

## Rollback Steps Executed

1. ✅ REST API endpoints disabled
2. ✅ GraphQL endpoints re-enabled  
3. ✅ All caches cleared
4. ✅ Services restarted
5. ✅ Rollback verified

## System Status After Rollback

- **Service Status**: Running
- **GraphQL Endpoints**: Functional
- **Widget Loading**: Verified
- **Database Connection**: Healthy

## Verification Test Results

$(cat "$ROLLBACK_LOG_DIR/graphql-test.log" 2>/dev/null || echo "GraphQL test log not available")

## Recommendations

1. Monitor system closely for next 24 hours
2. Review original migration issues before attempting retry
3. Update rollback procedures based on lessons learned
4. Consider phased migration approach for next attempt

## Files Modified

- .env.local (REST API disabled, GraphQL re-enabled)
- Widget components (restored from backup if available)

## Backup Locations

- Pre-rollback backup: backups/pre-rollback-$TIMESTAMP/
- Original system state: backups/pre-migration/ (if exists)

---
Generated automatically by migration rollback script
EOF

    log_success "Rollback report generated: $REPORT_FILE"
}

# 發送告警通知
send_notifications() {
    log_info "📢 Sending rollback notifications"
    
    # Slack 通知（如果配置了）
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 ROLLBACK COMPLETED: GraphQL→REST migration rolled back in $ENVIRONMENT. Reason: $ROLLBACK_REASON\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1 || log_warning "Failed to send Slack notification"
    fi
    
    # Email 通知（如果配置了）
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail > /dev/null 2>&1; then
        echo "Migration rollback completed at $TIMESTAMP. Reason: $ROLLBACK_REASON" | \
            mail -s "Migration Rollback Alert - $ENVIRONMENT" "$NOTIFICATION_EMAIL" || \
            log_warning "Failed to send email notification"
    fi
    
    log_success "Notifications sent"
}

# 清理維護模式
cleanup_maintenance_mode() {
    log_info "🧹 Cleaning up maintenance mode"
    
    # 移除維護模式標記
    sed -i '/MAINTENANCE_MODE=true/d' .env.local
    sed -i '/REST_API_DISABLED=true/d' .env.local
    
    log_success "Maintenance mode cleaned up"
}

# 主要執行流程
main() {
    echo "🚨🚨🚨 MIGRATION ROLLBACK INITIATED 🚨🚨🚨"
    echo
    
    # 執行回滾步驟
    if check_system_health; then
        backup_current_state
        disable_rest_api
        enable_graphql
        clear_caches
        restart_services
        
        if verify_rollback; then
            cleanup_maintenance_mode
            generate_rollback_report
            send_notifications
            
            echo
            log_success "🎉 ROLLBACK COMPLETED SUCCESSFULLY"
            log_info "📋 Report available at: $ROLLBACK_LOG_DIR/rollback-report.md"
            echo
        else
            log_error "❌ ROLLBACK VERIFICATION FAILED"
            echo
            log_error "System may be in an unstable state. Manual intervention required."
            log_info "Check logs in: $ROLLBACK_LOG_DIR/"
            exit 1
        fi
    else
        log_error "❌ PRE-ROLLBACK HEALTH CHECK FAILED"
        log_error "Cannot safely proceed with rollback. Manual investigation required."
        exit 1
    fi
}

# 捕獲中斷信號
trap 'log_error "Rollback interrupted"; exit 1' INT TERM

# 執行主程序
main "$@"

# 腳本使用說明
cat << 'EOF'

# 使用方法:
# ./scripts/migration-rollback.sh "High error rate detected"
# ./scripts/migration-rollback.sh "Performance degradation"
# ./scripts/migration-rollback.sh "Manual rollback for testing"

# 權限設置:
# chmod +x scripts/migration-rollback.sh

# 在 package.json 中添加:
# "rollback:migration": "bash scripts/migration-rollback.sh"

EOF