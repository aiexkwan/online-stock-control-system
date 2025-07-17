# NewPennine WMS 監控和維護指南

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: DevOps & Performance Team  
**狀態**: 生產就緒

## 概述

本指南提供 NewPennine 倉庫管理系統嘅完整監控和維護方案，包括監控系統使用、告警配置管理、系統健康檢查同日常維護程序。基於 v2.0.7 已完成嘅監控告警系統架構。

## 監控系統架構

### 1. 監控層次結構

```
┌─────────────────────────────────────────────────────────────┐
│                    用戶界面監控層                            │
├─────────────────────────────────────────────────────────────┤
│  告警儀表板 │ 性能監控 │ 用戶活動 │ 系統狀態 │ 錯誤追蹤    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    應用監控層                                │
├─────────────────────────────────────────────────────────────┤
│  響應時間 │ 錯誤率 │ 吞吐量 │ 資源使用 │ 業務指標         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    基礎設施監控層                            │
├─────────────────────────────────────────────────────────────┤
│  系統資源 │ 數據庫 │ 網絡 │ 存儲 │ 容器 │ 服務狀態         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    數據收集層                                │
├─────────────────────────────────────────────────────────────┤
│  Health APIs │ Metrics APIs │ Logs │ Traces │ Events        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 監控組件

#### 核心監控 API 端點
- **基本健康檢查**: `GET /api/v1/health`
- **進階健康檢查**: `GET /api/v2/health`
- **性能指標**: `GET /api/v1/metrics`
- **緩存指標**: `GET /api/v1/cache/metrics`
- **系統指標**: `GET /api/v1/system/metrics`

#### 告警系統組件
- **告警規則引擎**: `lib/alerts/core/AlertRuleEngine.ts`
- **通知服務**: `lib/alerts/notifications/NotificationService.ts`
- **狀態管理**: `lib/alerts/core/AlertStateManager.ts`
- **監控服務**: `lib/alerts/services/AlertMonitoringService.ts`

## 健康檢查系統

### 1. 基本健康檢查 (v1)

```bash
# 檢查應用程式基本狀態
curl -s http://localhost:3000/api/v1/health | jq '.'

# 預期響應
{
  "status": "healthy",
  "timestamp": "2025-07-17T10:00:00Z",
  "uptime": "2d 4h 32m",
  "version": "v2.0.7",
  "environment": "production"
}
```

### 2. 進階健康檢查 (v2)

```bash
# 檢查詳細系統狀態
curl -s http://localhost:3000/api/v2/health | jq '.'

# 預期響應
{
  "status": "healthy",
  "timestamp": "2025-07-17T10:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "15ms",
      "connections": 12
    },
    "cache": {
      "status": "healthy",
      "hitRate": "95.2%",
      "memory": "128MB"
    },
    "storage": {
      "status": "healthy",
      "freeSpace": "75%",
      "iops": "normal"
    }
  },
  "performance": {
    "cpuUsage": "45%",
    "memoryUsage": "62%",
    "diskUsage": "38%"
  }
}
```

### 3. 性能指標監控

```bash
# 獲取詳細性能指標
curl -s http://localhost:3000/api/v1/metrics | jq '.'

# 關鍵指標
{
  "api_response_time": {
    "avg": "120ms",
    "p95": "250ms",
    "p99": "500ms"
  },
  "database_query_time": {
    "avg": "45ms",
    "slow_queries": 3
  },
  "error_rate": "0.02%",
  "active_users": 15,
  "memory_usage": "512MB",
  "cpu_usage": "45%"
}
```

## 告警系統配置

### 1. 預設告警規則

系統包含 7 個預設告警規則：

#### 高 API 響應時間 (Warning)
```json
{
  "name": "High API Response Time",
  "level": "warning",
  "metric": "api_response_time",
  "condition": "greater_than",
  "threshold": 2000,
  "timeWindow": 30,
  "evaluationInterval": 30
}
```

#### 關鍵 API 響應時間 (Critical)
```json
{
  "name": "Critical API Response Time",
  "level": "critical",
  "metric": "api_response_time",
  "condition": "greater_than",
  "threshold": 5000,
  "timeWindow": 30,
  "evaluationInterval": 30
}
```

#### 高錯誤率 (Error)
```json
{
  "name": "High Error Rate",
  "level": "error",
  "metric": "error_rate",
  "condition": "greater_than",
  "threshold": 5,
  "timeWindow": 60,
  "evaluationInterval": 60
}
```

### 2. 告警配置管理

#### 創建自定義告警規則
```bash
# 創建新告警規則
curl -X POST http://localhost:3000/api/v1/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Memory Usage",
    "description": "Alert when memory usage exceeds 85%",
    "level": "warning",
    "metric": "memory_usage",
    "condition": "greater_than",
    "threshold": 85,
    "timeWindow": 300,
    "evaluationInterval": 60,
    "notifications": [
      {
        "channel": "email",
        "config": {
          "recipients": ["ops@newpennine.com"]
        }
      }
    ]
  }'
```

#### 管理告警規則
```bash
# 列出所有規則
curl -s http://localhost:3000/api/v1/alerts/rules | jq '.'

# 獲取特定規則
curl -s http://localhost:3000/api/v1/alerts/rules/rule-id | jq '.'

# 更新規則
curl -X PUT http://localhost:3000/api/v1/alerts/rules/rule-id \
  -H "Content-Type: application/json" \
  -d '{"threshold": 90}'

# 刪除規則
curl -X DELETE http://localhost:3000/api/v1/alerts/rules/rule-id
```

### 3. 通知配置

#### Email 通知設置
```json
{
  "notifications": [
    {
      "channel": "email",
      "config": {
        "recipients": ["admin@newpennine.com", "ops@newpennine.com"],
        "subject": "NewPennine WMS Alert: {{alert.name}}",
        "template": "alert_email_template"
      }
    }
  ]
}
```

#### Slack 通知設置
```json
{
  "notifications": [
    {
      "channel": "slack",
      "config": {
        "webhook_url": "https://hooks.slack.com/services/...",
        "channel": "#newpennine-alerts",
        "username": "NewPennine WMS",
        "icon_emoji": ":warning:"
      }
    }
  ]
}
```

#### Webhook 通知設置
```json
{
  "notifications": [
    {
      "channel": "webhook",
      "config": {
        "url": "https://your-webhook-endpoint.com/alerts",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer your-token"
        }
      }
    }
  ]
}
```

## 系統監控指標

### 1. 應用程式指標

#### 性能指標
```bash
# 監控腳本
#!/bin/bash

# 獲取應用性能指標
get_app_metrics() {
    echo "=== 應用性能指標 $(date) ==="
    
    # API 響應時間
    API_RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:3000/api/v1/health)
    echo "API 響應時間: ${API_RESPONSE_TIME}s"
    
    # 活躍用戶數
    ACTIVE_USERS=$(curl -s http://localhost:3000/api/v1/metrics | jq -r '.active_users')
    echo "活躍用戶數: $ACTIVE_USERS"
    
    # 錯誤率
    ERROR_RATE=$(curl -s http://localhost:3000/api/v1/metrics | jq -r '.error_rate')
    echo "錯誤率: $ERROR_RATE"
    
    # 記憶體使用
    MEMORY_USAGE=$(curl -s http://localhost:3000/api/v1/metrics | jq -r '.memory_usage')
    echo "記憶體使用: $MEMORY_USAGE"
}

# 執行監控
get_app_metrics
```

#### 業務指標
```bash
# 業務指標監控
get_business_metrics() {
    echo "=== 業務指標 $(date) ==="
    
    # 今日棧板創建數
    TODAY_PALLETS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM record_palletinfo WHERE DATE(created_at) = CURRENT_DATE;")
    echo "今日新增棧板: $TODAY_PALLETS"
    
    # 庫存轉移次數
    STOCK_TRANSFERS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM record_transfer WHERE DATE(transfer_time) = CURRENT_DATE;")
    echo "今日庫存轉移: $STOCK_TRANSFERS"
    
    # 訂單處理數
    ORDER_PROCESSED=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM record_aco WHERE DATE(created_date) = CURRENT_DATE;")
    echo "今日訂單處理: $ORDER_PROCESSED"
}

# 執行業務指標監控
get_business_metrics
```

### 2. 系統資源監控

#### 系統資源腳本
```bash
#!/bin/bash

# 系統資源監控
system_resource_monitor() {
    echo "=== 系統資源監控 $(date) ==="
    
    # CPU 使用率
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    echo "CPU 使用率: $CPU_USAGE"
    
    # 記憶體使用率
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
    echo "記憶體使用率: $MEMORY_USAGE"
    
    # 磁碟使用率
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
    echo "磁碟使用率: $DISK_USAGE"
    
    # 網絡連接數
    NETWORK_CONNECTIONS=$(netstat -an | grep :3000 | wc -l)
    echo "網絡連接數: $NETWORK_CONNECTIONS"
    
    # 負載平均
    LOAD_AVERAGE=$(uptime | awk -F'load average:' '{print $2}')
    echo "負載平均: $LOAD_AVERAGE"
}

# 執行系統資源監控
system_resource_monitor
```

#### 數據庫監控
```bash
# 數據庫監控腳本
database_monitor() {
    echo "=== 數據庫監控 $(date) ==="
    
    # 連接數
    DB_CONNECTIONS=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_stat_activity;")
    echo "數據庫連接數: $DB_CONNECTIONS"
    
    # 數據庫大小
    DB_SIZE=$(psql $DATABASE_URL -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));")
    echo "數據庫大小: $DB_SIZE"
    
    # 最慢查詢
    SLOW_QUERIES=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 1000;")
    echo "慢查詢數量: $SLOW_QUERIES"
    
    # 鎖等待
    LOCK_WAITS=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_locks WHERE NOT granted;")
    echo "鎖等待數量: $LOCK_WAITS"
}

# 執行數據庫監控
database_monitor
```

## 日常維護程序

### 1. 每日維護檢查單

#### 自動化每日檢查
```bash
#!/bin/bash

# 每日維護檢查腳本
daily_maintenance() {
    echo "=== 每日維護檢查 $(date) ==="
    
    # 1. 檢查服務狀態
    echo "1. 檢查服務狀態:"
    systemctl is-active newpennine-wms
    
    # 2. 健康檢查
    echo "2. 健康檢查:"
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)
    if [ "$HEALTH_STATUS" -eq 200 ]; then
        echo "✅ 健康檢查通過"
    else
        echo "❌ 健康檢查失敗: $HEALTH_STATUS"
    fi
    
    # 3. 磁碟空間檢查
    echo "3. 磁碟空間檢查:"
    df -h | grep -E "(Filesystem|/$|/var|/tmp)"
    
    # 4. 記憶體使用檢查
    echo "4. 記憶體使用檢查:"
    free -h
    
    # 5. 日誌檢查
    echo "5. 日誌檢查:"
    ERROR_COUNT=$(grep -c "ERROR" /var/log/newpennine-wms/error.log 2>/dev/null || echo "0")
    echo "今日錯誤數: $ERROR_COUNT"
    
    # 6. 備份檢查
    echo "6. 備份檢查:"
    BACKUP_DATE=$(date +%Y-%m-%d)
    if [ -f "/var/backups/newpennine-wms/${BACKUP_DATE}_backup.sql" ]; then
        echo "✅ 今日備份存在"
    else
        echo "❌ 今日備份不存在"
    fi
    
    # 7. 告警檢查
    echo "7. 告警檢查:"
    ACTIVE_ALERTS=$(curl -s http://localhost:3000/api/v1/alerts/active | jq length)
    echo "活躍告警數: $ACTIVE_ALERTS"
}

# 執行每日維護
daily_maintenance > /var/log/newpennine-wms/daily_maintenance_$(date +%Y%m%d).log 2>&1
```

### 2. 週期性維護任務

#### 每週維護
```bash
#!/bin/bash

# 每週維護腳本
weekly_maintenance() {
    echo "=== 每週維護 $(date) ==="
    
    # 1. 數據庫優化
    echo "1. 數據庫優化:"
    psql $DATABASE_URL -c "VACUUM ANALYZE;"
    psql $DATABASE_URL -c "REINDEX DATABASE newpennine_wms;"
    
    # 2. 清理舊日誌
    echo "2. 清理舊日誌:"
    find /var/log/newpennine-wms -name "*.log" -mtime +7 -delete
    
    # 3. 清理舊備份
    echo "3. 清理舊備份:"
    find /var/backups/newpennine-wms -name "*.sql" -mtime +30 -delete
    
    # 4. 檢查證書
    echo "4. 檢查 SSL 證書:"
    if command -v certbot &> /dev/null; then
        certbot certificates
    fi
    
    # 5. 系統更新檢查
    echo "5. 系統更新檢查:"
    apt list --upgradable
    
    # 6. 性能分析
    echo "6. 性能分析:"
    curl -s http://localhost:3000/api/v1/metrics > /tmp/weekly_metrics_$(date +%Y%m%d).json
    
    # 7. 告警歷史分析
    echo "7. 告警歷史分析:"
    curl -s http://localhost:3000/api/v1/alerts/history?days=7 | jq '.summary'
}

# 執行每週維護
weekly_maintenance > /var/log/newpennine-wms/weekly_maintenance_$(date +%Y%m%d).log 2>&1
```

#### 每月維護
```bash
#!/bin/bash

# 每月維護腳本
monthly_maintenance() {
    echo "=== 每月維護 $(date) ==="
    
    # 1. 完整系統備份
    echo "1. 完整系統備份:"
    tar -czf "/var/backups/newpennine-wms/monthly_backup_$(date +%Y%m).tar.gz" /var/www/newpennine-wms
    
    # 2. 數據庫完整備份
    echo "2. 數據庫完整備份:"
    pg_dump $DATABASE_URL > "/var/backups/newpennine-wms/monthly_db_backup_$(date +%Y%m).sql"
    
    # 3. 性能報告生成
    echo "3. 性能報告生成:"
    npm run test:perf:report
    
    # 4. 安全審計
    echo "4. 安全審計:"
    npm audit
    
    # 5. 依賴更新檢查
    echo "5. 依賴更新檢查:"
    npm outdated
    
    # 6. 系統健康報告
    echo "6. 系統健康報告:"
    curl -s http://localhost:3000/api/v2/health > "/var/reports/health_report_$(date +%Y%m).json"
}

# 執行每月維護
monthly_maintenance > /var/log/newpennine-wms/monthly_maintenance_$(date +%Y%m).log 2>&1
```

## 監控儀表板

### 1. 訪問告警儀表板

```bash
# 訪問告警管理界面
open http://localhost:3000/admin/alerts

# 主要功能:
# - 告警規則管理
# - 告警歷史查看
# - 通知設定
# - 系統狀態監控
```

### 2. 性能監控儀表板

```bash
# 性能監控腳本
performance_dashboard() {
    echo "=== 性能監控儀表板 $(date) ==="
    
    # 獲取所有指標
    METRICS=$(curl -s http://localhost:3000/api/v1/metrics)
    
    # 顯示關鍵指標
    echo "API 響應時間: $(echo $METRICS | jq -r '.api_response_time.avg')"
    echo "錯誤率: $(echo $METRICS | jq -r '.error_rate')"
    echo "活躍用戶: $(echo $METRICS | jq -r '.active_users')"
    echo "記憶體使用: $(echo $METRICS | jq -r '.memory_usage')"
    echo "CPU 使用: $(echo $METRICS | jq -r '.cpu_usage')"
    
    # 生成簡單圖表
    echo "=== 過去 24 小時趨勢 ==="
    # 此處可以添加圖表生成邏輯
}

# 執行性能監控
performance_dashboard
```

## 自動化監控腳本

### 1. 持續監控守護程序

```bash
#!/bin/bash

# 持續監控守護程序
monitoring_daemon() {
    echo "啟動監控守護程序 $(date)"
    
    while true; do
        # 健康檢查
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)
        
        if [ "$HEALTH_STATUS" -ne 200 ]; then
            echo "$(date): 健康檢查失敗 - 狀態碼: $HEALTH_STATUS"
            
            # 發送告警
            send_alert "健康檢查失敗" "HTTP 狀態碼: $HEALTH_STATUS"
            
            # 嘗試重啟服務
            if [ "$HEALTH_STATUS" -eq 000 ]; then
                echo "$(date): 嘗試重啟服務"
                systemctl restart newpennine-wms
            fi
        fi
        
        # 檢查資源使用
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
        
        if [ "$MEMORY_USAGE" -gt 90 ]; then
            send_alert "記憶體使用率過高" "當前使用率: ${MEMORY_USAGE}%"
        fi
        
        if [ "$DISK_USAGE" -gt 85 ]; then
            send_alert "磁碟使用率過高" "當前使用率: ${DISK_USAGE}%"
        fi
        
        sleep 30
    done
}

# 發送告警函數
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Slack 通知
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 NewPennine WMS 告警: $subject - $message\"}" \
        $SLACK_WEBHOOK_URL
    
    # 電郵通知
    echo "$message" | mail -s "NewPennine WMS 告警: $subject" ops@newpennine.com
}

# 啟動守護程序
monitoring_daemon &
```

### 2. 自動恢復腳本

```bash
#!/bin/bash

# 自動恢復腳本
auto_recovery() {
    echo "啟動自動恢復系統 $(date)"
    
    # 檢查服務狀態
    if ! systemctl is-active --quiet newpennine-wms; then
        echo "$(date): 服務未運行，嘗試啟動"
        systemctl start newpennine-wms
        
        # 等待服務啟動
        sleep 30
        
        # 驗證啟動
        if curl -s http://localhost:3000/api/v1/health | grep -q "healthy"; then
            echo "$(date): 服務恢復成功"
            send_alert "服務恢復" "服務已成功重啟"
        else
            echo "$(date): 服務恢復失敗"
            send_alert "服務恢復失敗" "需要手動干預"
        fi
    fi
    
    # 檢查數據庫連接
    if ! psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
        echo "$(date): 數據庫連接失敗，嘗試重連"
        systemctl restart postgresql
        sleep 30
        
        if psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
            echo "$(date): 數據庫連接恢復"
            send_alert "數據庫恢復" "數據庫連接已恢復"
        else
            echo "$(date): 數據庫連接恢復失敗"
            send_alert "數據庫恢復失敗" "需要手動干預"
        fi
    fi
}

# 執行自動恢復
auto_recovery
```

## 告警升級程序

### 1. 告警級別定義

```
Info (資訊)      → 記錄事件，無需立即行動
Warning (警告)   → 需要關注，可能影響性能
Error (錯誤)     → 需要立即行動，影響功能
Critical (關鍵)  → 緊急情況，可能導致服務中斷
```

### 2. 升級流程

```bash
# 告警升級腳本
alert_escalation() {
    local alert_level="$1"
    local alert_message="$2"
    
    case $alert_level in
        "info")
            # 記錄到日誌
            echo "$(date): INFO - $alert_message" >> /var/log/newpennine-wms/alerts.log
            ;;
        "warning")
            # 發送到監控頻道
            send_slack_alert "#newpennine-monitoring" "⚠️ WARNING: $alert_message"
            ;;
        "error")
            # 發送到運維頻道
            send_slack_alert "#newpennine-ops" "❌ ERROR: $alert_message"
            send_email_alert "ops@newpennine.com" "NewPennine WMS Error" "$alert_message"
            ;;
        "critical")
            # 發送到緊急頻道
            send_slack_alert "#newpennine-emergency" "🚨 CRITICAL: $alert_message"
            send_email_alert "emergency@newpennine.com" "NewPennine WMS CRITICAL" "$alert_message"
            send_sms_alert "+852-1234-5678" "NewPennine WMS CRITICAL: $alert_message"
            ;;
    esac
}
```

## 維護計劃模板

### 1. 月度維護計劃

```markdown
# NewPennine WMS 月度維護計劃

## 第一週
- [ ] 系統性能報告審查
- [ ] 數據庫優化和清理
- [ ] 安全補丁安裝
- [ ] 備份驗證

## 第二週
- [ ] 監控告警規則審查
- [ ] 日誌分析和清理
- [ ] 依賴更新檢查
- [ ] 性能測試執行

## 第三週
- [ ] 災難恢復測試
- [ ] 文檔更新
- [ ] 培訓材料更新
- [ ] 容量規劃審查

## 第四週
- [ ] 月度報告準備
- [ ] 系統健康評估
- [ ] 下月計劃制定
- [ ] 團隊回顧會議
```

### 2. 年度維護計劃

```markdown
# NewPennine WMS 年度維護計劃

## Q1 (1-3月)
- [ ] 系統架構審查
- [ ] 性能基準測試
- [ ] 安全審計
- [ ] 備份策略評估

## Q2 (4-6月)
- [ ] 技術債務清理
- [ ] 監控系統升級
- [ ] 培訓計劃更新
- [ ] 災難恢復演練

## Q3 (7-9月)
- [ ] 系統擴展評估
- [ ] 新功能規劃
- [ ] 工具鏈升級
- [ ] 流程優化

## Q4 (10-12月)
- [ ] 年度總結報告
- [ ] 預算計劃制定
- [ ] 技術路線圖更新
- [ ] 節假日值班安排
```

## 聯絡和支援

### 監控支援聯絡
- **監控團隊**: monitoring@newpennine.com
- **告警管理**: alerts@newpennine.com
- **性能優化**: performance@newpennine.com
- **緊急支援**: +852-1234-5678

### 維護支援聯絡
- **日常維護**: maintenance@newpennine.com
- **計劃維護**: planned-maintenance@newpennine.com
- **緊急維護**: emergency@newpennine.com

---

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次審查**: 2025-10-17  

**維護者**: NewPennine DevOps & Performance Team  
**文檔路徑**: `/docs/manual/monitoring-maintenance-guide.md`