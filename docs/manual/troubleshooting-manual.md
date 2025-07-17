# NewPennine WMS 故障排除手冊

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: DevOps & Backend Team  
**狀態**: 生產就緒

## 概述

本手冊提供 NewPennine 倉庫管理系統嘅全面故障排除指南，包括常見問題診斷、系統恢復程序、緊急應對措施同預防性維護建議。

## 🚨 緊急聯絡資訊

**緊急技術支援**: +852-1234-5678  
**DevOps 團隊**: ops-team@newpennine.com  
**Backend 團隊**: backend-team@newpennine.com  
**Slack 頻道**: #newpennine-ops  

## 系統診斷框架

### 1. 診斷層級

```
Level 1: 基本健康檢查
Level 2: 服務狀態檢查
Level 3: 深度系統診斷
Level 4: 數據庫診斷
Level 5: 網絡和外部依賴診斷
```

### 2. 診斷工具

```bash
# 系統診斷腳本
#!/bin/bash

# 基本診斷工具包
HEALTH_CHECK_URL="http://localhost:3000/api/v1/health"
METRICS_URL="http://localhost:3000/api/v1/metrics"
CACHE_METRICS_URL="http://localhost:3000/api/v1/cache/metrics"

# 快速診斷
quick_diagnosis() {
    echo "=== NewPennine WMS 快速診斷 ==="
    echo "時間: $(date)"
    echo
    
    # 1. 服務狀態
    echo "1. 服務狀態檢查:"
    systemctl is-active newpennine-wms
    
    # 2. 健康檢查
    echo "2. 健康檢查:"
    curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" $HEALTH_CHECK_URL
    
    # 3. 系統資源
    echo "3. 系統資源:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')"
    echo "記憶體: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "磁碟: $(df -h / | awk 'NR==2{print $5}')"
    
    # 4. 端口檢查
    echo "4. 端口檢查:"
    netstat -tlnp | grep :3000
}

# 執行快速診斷
quick_diagnosis
```

## 常見問題診斷

### 1. 服務無法啟動

#### 症狀
- 服務啟動失敗
- 無法連接到應用程式
- 端口無法綁定

#### 診斷步驟

```bash
# 1. 檢查服務狀態
sudo systemctl status newpennine-wms

# 2. 查看詳細日誌
sudo journalctl -u newpennine-wms -f

# 3. 檢查端口佔用
sudo netstat -tulpn | grep :3000
sudo lsof -i :3000

# 4. 檢查進程
ps aux | grep node

# 5. 檢查環境變數
sudo -u www-data env | grep -E "(NODE_ENV|DATABASE_URL|NEXT_PUBLIC_)"
```

#### 解決方案

```bash
# 方案 1: 重新啟動服務
sudo systemctl restart newpennine-wms

# 方案 2: 殺死佔用端口的進程
sudo kill -9 $(lsof -ti :3000)
sudo systemctl start newpennine-wms

# 方案 3: 檢查配置文件
sudo nano /etc/systemd/system/newpennine-wms.service
sudo systemctl daemon-reload
sudo systemctl start newpennine-wms

# 方案 4: 檢查文件權限
sudo chown -R www-data:www-data /var/www/newpennine-wms
sudo chmod -R 755 /var/www/newpennine-wms
```

### 2. 數據庫連接問題

#### 症狀
- 數據庫連接超時
- 查詢執行緩慢
- 連接池耗盡

#### 診斷步驟

```bash
# 1. 測試數據庫連接
psql $DATABASE_URL -c "SELECT version(), current_timestamp;"

# 2. 檢查連接池狀態
curl -s $METRICS_URL | grep database

# 3. 查看數據庫日誌
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# 4. 檢查連接數
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# 5. 查看慢查詢
psql $DATABASE_URL -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

#### 解決方案

```bash
# 方案 1: 重啟數據庫連接
sudo systemctl restart postgresql

# 方案 2: 清理空閒連接
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes';"

# 方案 3: 增加連接池大小
# 編輯 .env.local
DATABASE_MAX_CONNECTIONS=50

# 方案 4: 優化查詢
psql $DATABASE_URL -c "REINDEX DATABASE newpennine_wms;"
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### 3. 記憶體使用過高

#### 症狀
- 系統響應緩慢
- 頻繁垃圾收集
- OOM (Out of Memory) 錯誤

#### 診斷步驟

```bash
# 1. 檢查記憶體使用
free -h
top -p $(pgrep node)

# 2. Node.js 記憶體診斷
node --inspect=9229 /var/www/newpennine-wms/server.js &
curl http://localhost:9229/json/list

# 3. 檢查記憶體洩漏
npm install -g clinic
clinic doctor -- node server.js

# 4. 查看應用記憶體指標
curl -s $METRICS_URL | grep memory
```

#### 解決方案

```bash
# 方案 1: 調整 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 方案 2: 重啟服務釋放記憶體
sudo systemctl restart newpennine-wms

# 方案 3: 啟用 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 方案 4: 監控記憶體使用
watch -n 1 'free -h && echo "=== Node.js 進程 ===" && ps aux | grep node'
```

### 4. API 響應時間過慢

#### 症狀
- API 響應時間 > 5 秒
- 用戶界面加載緩慢
- 超時錯誤

#### 診斷步驟

```bash
# 1. 檢查 API 響應時間
curl -w "@curl-format.txt" -o /dev/null -s $HEALTH_CHECK_URL

# 創建 curl-format.txt
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}s\n
        time_connect:  %{time_connect}s\n
     time_appconnect:  %{time_appconnect}s\n
    time_pretransfer:  %{time_pretransfer}s\n
       time_redirect:  %{time_redirect}s\n
  time_starttransfer:  %{time_starttransfer}s\n
                     ----------\n
          time_total:  %{time_total}s\n
EOF

# 2. 檢查系統負載
uptime
iostat -x 1 3

# 3. 分析慢查詢
curl -s $METRICS_URL | grep -E "(response_time|database_query_time)"

# 4. 檢查緩存命中率
curl -s $CACHE_METRICS_URL
```

#### 解決方案

```bash
# 方案 1: 啟用 Redis 緩存
sudo systemctl start redis-server
# 更新 .env.local
REDIS_URL=redis://localhost:6379

# 方案 2: 數據庫優化
psql $DATABASE_URL -c "VACUUM ANALYZE;"
psql $DATABASE_URL -c "REINDEX DATABASE newpennine_wms;"

# 方案 3: 啟用 PM2 集群模式
pm2 start ecosystem.config.js
pm2 scale newpennine-wms 4

# 方案 4: 配置 Nginx 緩存
# 編輯 /etc/nginx/sites-available/newpennine-wms
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 5. 文件上傳失敗

#### 症狀
- 文件上傳中斷
- 上傳進度卡住
- 413 錯誤（文件太大）

#### 診斷步驟

```bash
# 1. 檢查上傳目錄權限
ls -la /var/www/newpennine-wms/uploads/

# 2. 檢查磁碟空間
df -h

# 3. 檢查 Nginx 配置
sudo nginx -t
grep client_max_body_size /etc/nginx/nginx.conf

# 4. 檢查 Node.js 限制
grep -r "maxFileSize\|limit" /var/www/newpennine-wms/
```

#### 解決方案

```bash
# 方案 1: 調整文件大小限制
# 編輯 /etc/nginx/nginx.conf
client_max_body_size 100M;

# 方案 2: 確保目錄權限
sudo chown -R www-data:www-data /var/www/newpennine-wms/uploads/
sudo chmod -R 755 /var/www/newpennine-wms/uploads/

# 方案 3: 清理臨時文件
sudo find /tmp -name "upload_*" -mtime +1 -delete

# 方案 4: 重啟相關服務
sudo systemctl reload nginx
sudo systemctl restart newpennine-wms
```

## 系統恢復程序

### 1. 服務恢復程序

```bash
#!/bin/bash

# 服務恢復腳本
service_recovery() {
    echo "開始服務恢復程序..."
    
    # 1. 停止服務
    sudo systemctl stop newpennine-wms
    
    # 2. 清理進程
    sudo pkill -f "node.*newpennine"
    
    # 3. 檢查端口
    if sudo lsof -i :3000; then
        echo "端口仍被佔用，強制釋放..."
        sudo kill -9 $(sudo lsof -ti :3000)
    fi
    
    # 4. 檢查文件系統
    sudo fsck /dev/sda1
    
    # 5. 重新啟動服務
    sudo systemctl start newpennine-wms
    
    # 6. 驗證恢復
    sleep 30
    if curl -s $HEALTH_CHECK_URL | grep -q "healthy"; then
        echo "服務恢復成功！"
        return 0
    else
        echo "服務恢復失敗，需要手動干預"
        return 1
    fi
}

# 執行恢復程序
service_recovery
```

### 2. 數據庫恢復程序

```bash
#!/bin/bash

# 數據庫恢復腳本
database_recovery() {
    echo "開始數據庫恢復程序..."
    
    # 1. 停止應用服務
    sudo systemctl stop newpennine-wms
    
    # 2. 創建數據庫備份
    pg_dump $DATABASE_URL > /tmp/recovery_backup_$(date +%Y%m%d_%H%M%S).sql
    
    # 3. 檢查數據庫完整性
    psql $DATABASE_URL -c "SELECT pg_check_integrity();"
    
    # 4. 修復數據庫
    psql $DATABASE_URL -c "REINDEX DATABASE newpennine_wms;"
    psql $DATABASE_URL -c "VACUUM FULL;"
    
    # 5. 重新啟動數據庫
    sudo systemctl restart postgresql
    
    # 6. 驗證連接
    if psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
        echo "數據庫恢復成功！"
        sudo systemctl start newpennine-wms
        return 0
    else
        echo "數據庫恢復失敗"
        return 1
    fi
}

# 執行數據庫恢復
database_recovery
```

### 3. 完整系統恢復

```bash
#!/bin/bash

# 完整系統恢復腳本
full_system_recovery() {
    echo "開始完整系統恢復程序..."
    
    # 1. 創建恢復日誌
    RECOVERY_LOG="/var/log/newpennine-wms/recovery_$(date +%Y%m%d_%H%M%S).log"
    exec > >(tee -a $RECOVERY_LOG)
    exec 2>&1
    
    # 2. 停止所有服務
    sudo systemctl stop newpennine-wms
    sudo systemctl stop nginx
    sudo systemctl stop redis-server
    
    # 3. 檢查系統資源
    df -h
    free -h
    
    # 4. 清理臨時文件
    sudo find /tmp -name "*newpennine*" -delete
    sudo find /var/log/newpennine-wms -name "*.log" -mtime +7 -delete
    
    # 5. 恢復備份
    LATEST_BACKUP=$(ls -t /var/backups/newpennine-wms | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        sudo cp -r "/var/backups/newpennine-wms/$LATEST_BACKUP" /var/www/newpennine-wms-restore
        sudo rm -rf /var/www/newpennine-wms
        sudo mv /var/www/newpennine-wms-restore /var/www/newpennine-wms
    fi
    
    # 6. 重新啟動服務
    sudo systemctl start redis-server
    sudo systemctl start nginx
    sudo systemctl start newpennine-wms
    
    # 7. 驗證恢復
    sleep 60
    if curl -s $HEALTH_CHECK_URL | grep -q "healthy"; then
        echo "完整系統恢復成功！"
        return 0
    else
        echo "系統恢復失敗，需要手動干預"
        return 1
    fi
}

# 執行完整系統恢復
full_system_recovery
```

## 緊急應對程序

### 1. 系統完全停機

```bash
# 緊急停機應對
emergency_response() {
    echo "🚨 緊急停機應對程序啟動"
    
    # 1. 立即通知
    send_emergency_alert "系統完全停機，正在執行緊急恢復程序"
    
    # 2. 啟動備用系統
    if [ -d "/var/www/newpennine-wms-backup" ]; then
        sudo systemctl stop newpennine-wms
        sudo mv /var/www/newpennine-wms /var/www/newpennine-wms-failed
        sudo mv /var/www/newpennine-wms-backup /var/www/newpennine-wms
        sudo systemctl start newpennine-wms
    fi
    
    # 3. 數據完整性檢查
    psql $DATABASE_URL -c "SELECT count(*) FROM record_palletinfo;"
    
    # 4. 通知恢復狀態
    if curl -s $HEALTH_CHECK_URL | grep -q "healthy"; then
        send_emergency_alert "緊急恢復完成，系統已恢復正常運行"
    else
        send_emergency_alert "緊急恢復失敗，需要立即手動干預"
    fi
}

# 發送緊急通知
send_emergency_alert() {
    local message="$1"
    
    # Slack 通知
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 NewPennine WMS 緊急通知: $message\"}" \
        $SLACK_WEBHOOK_URL
    
    # 電郵通知
    echo "$message" | mail -s "NewPennine WMS 緊急通知" ops-team@newpennine.com
}
```

### 2. 安全事件應對

```bash
# 安全事件應對
security_incident_response() {
    echo "🔒 安全事件應對程序啟動"
    
    # 1. 立即隔離
    sudo iptables -A INPUT -p tcp --dport 3000 -j DROP
    sudo systemctl stop newpennine-wms
    
    # 2. 收集證據
    sudo cp /var/log/newpennine-wms/access.log /var/security/incident_$(date +%Y%m%d_%H%M%S).log
    sudo netstat -tulnp > /var/security/network_$(date +%Y%m%d_%H%M%S).log
    
    # 3. 通知安全團隊
    send_security_alert "檢測到安全事件，系統已被隔離"
    
    # 4. 等待進一步指示
    echo "系統已隔離，等待安全團隊進一步指示"
}

# 發送安全通知
send_security_alert() {
    local message="$1"
    
    # 立即通知
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔒 NewPennine WMS 安全通知: $message\"}" \
        $SECURITY_WEBHOOK_URL
}
```

## 監控和告警

### 1. 自動監控腳本

```bash
#!/bin/bash

# 自動監控腳本
monitoring_daemon() {
    while true; do
        # 健康檢查
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
        
        if [ "$HEALTH_STATUS" -ne 200 ]; then
            echo "$(date): 健康檢查失敗 - 狀態碼: $HEALTH_STATUS"
            
            # 嘗試自動恢復
            if service_recovery; then
                echo "$(date): 自動恢復成功"
            else
                echo "$(date): 自動恢復失敗，發送告警"
                send_alert "系統健康檢查失敗，自動恢復失敗"
            fi
        fi
        
        # 檢查資源使用
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
        
        if [ "$MEMORY_USAGE" -gt 90 ]; then
            send_alert "記憶體使用率過高: ${MEMORY_USAGE}%"
        fi
        
        if [ "$DISK_USAGE" -gt 85 ]; then
            send_alert "磁碟使用率過高: ${DISK_USAGE}%"
        fi
        
        sleep 30
    done
}

# 啟動監控守護程序
monitoring_daemon
```

### 2. 性能監控

```bash
#!/bin/bash

# 性能監控腳本
performance_monitoring() {
    echo "=== 性能監控報告 $(date) ==="
    
    # 1. API 響應時間
    API_RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s $HEALTH_CHECK_URL)
    echo "API 響應時間: ${API_RESPONSE_TIME}s"
    
    # 2. 數據庫連接
    DB_CONNECTIONS=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_stat_activity;")
    echo "數據庫連接數: $DB_CONNECTIONS"
    
    # 3. 記憶體使用
    NODE_MEMORY=$(ps -o pid,ppid,cmd,%mem --sort=-%mem | grep node | head -1 | awk '{print $4}')
    echo "Node.js 記憶體使用: ${NODE_MEMORY}%"
    
    # 4. 錯誤率
    ERROR_COUNT=$(tail -n 1000 /var/log/newpennine-wms/error.log | grep "$(date +'%Y-%m-%d')" | wc -l)
    echo "今日錯誤數: $ERROR_COUNT"
    
    # 5. 用戶活動
    ACTIVE_USERS=$(curl -s $METRICS_URL | grep active_users | awk '{print $2}')
    echo "活躍用戶數: $ACTIVE_USERS"
}

# 每小時執行性能監控
performance_monitoring
```

## 預防性維護

### 1. 日常維護清單

```bash
# 日常維護腳本
daily_maintenance() {
    echo "=== 日常維護 $(date) ==="
    
    # 1. 檢查服務狀態
    sudo systemctl status newpennine-wms
    
    # 2. 清理日誌
    sudo find /var/log/newpennine-wms -name "*.log" -mtime +7 -delete
    
    # 3. 檢查磁碟空間
    df -h
    
    # 4. 更新系統
    sudo apt update && sudo apt list --upgradable
    
    # 5. 備份驗證
    if [ -f "/var/backups/newpennine-wms/$(date +%Y%m%d)_backup.tar.gz" ]; then
        echo "✅ 今日備份存在"
    else
        echo "❌ 今日備份不存在"
    fi
    
    # 6. 性能檢查
    curl -s $METRICS_URL | grep -E "(response_time|memory_usage|error_rate)"
}
```

### 2. 週期性維護

```bash
# 週期性維護腳本
weekly_maintenance() {
    echo "=== 週期性維護 $(date) ==="
    
    # 1. 數據庫優化
    psql $DATABASE_URL -c "VACUUM ANALYZE;"
    psql $DATABASE_URL -c "REINDEX DATABASE newpennine_wms;"
    
    # 2. 清理舊備份
    find /var/backups/newpennine-wms -type f -mtime +30 -delete
    
    # 3. 更新依賴
    cd /var/www/newpennine-wms
    npm audit
    
    # 4. 檢查證書
    if command -v certbot &> /dev/null; then
        sudo certbot certificates
    fi
    
    # 5. 系統更新
    sudo apt update && sudo apt upgrade -y
    
    # 6. 重啟服務
    sudo systemctl restart newpennine-wms
}
```

## 日誌分析

### 1. 錯誤日誌分析

```bash
# 錯誤日誌分析腳本
analyze_error_logs() {
    echo "=== 錯誤日誌分析 $(date) ==="
    
    # 1. 最近的錯誤
    echo "最近 24 小時的錯誤:"
    grep "$(date -d '1 day ago' +'%Y-%m-%d')" /var/log/newpennine-wms/error.log | tail -10
    
    # 2. 錯誤統計
    echo "錯誤統計:"
    grep "ERROR" /var/log/newpennine-wms/error.log | awk '{print $4}' | sort | uniq -c | sort -nr
    
    # 3. 數據庫錯誤
    echo "數據庫錯誤:"
    grep -i "database\|connection" /var/log/newpennine-wms/error.log | tail -5
    
    # 4. 認證錯誤
    echo "認證錯誤:"
    grep -i "auth\|login\|unauthorized" /var/log/newpennine-wms/error.log | tail -5
}
```

### 2. 訪問日誌分析

```bash
# 訪問日誌分析腳本
analyze_access_logs() {
    echo "=== 訪問日誌分析 $(date) ==="
    
    # 1. 最活躍的 IP
    echo "最活躍的 IP:"
    awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
    
    # 2. 最常請求的頁面
    echo "最常請求的頁面:"
    awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
    
    # 3. 響應狀態統計
    echo "響應狀態統計:"
    awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
    
    # 4. 平均響應時間
    echo "平均響應時間:"
    awk '{print $10}' /var/log/nginx/access.log | awk '{sum+=$1; n++} END {print "Average:", sum/n, "ms"}'
}
```

## 測試和驗證

### 1. 系統測試腳本

```bash
# 系統測試腳本
system_test() {
    echo "=== 系統測試 $(date) ==="
    
    # 1. 健康檢查測試
    echo "健康檢查測試:"
    curl -s $HEALTH_CHECK_URL | jq '.'
    
    # 2. API 功能測試
    echo "API 功能測試:"
    curl -s -X GET "$HEALTH_CHECK_URL" -H "accept: application/json"
    
    # 3. 數據庫連接測試
    echo "數據庫連接測試:"
    psql $DATABASE_URL -c "SELECT 'Database connection successful';"
    
    # 4. 緩存測試
    echo "緩存測試:"
    curl -s $CACHE_METRICS_URL | jq '.'
    
    # 5. 文件系統測試
    echo "文件系統測試:"
    touch /tmp/test_file_$(date +%s) && echo "文件系統寫入正常" || echo "文件系統寫入失敗"
}
```

### 2. 負載測試

```bash
# 負載測試腳本
load_test() {
    echo "=== 負載測試 $(date) ==="
    
    # 使用 Apache Bench 進行負載測試
    ab -n 100 -c 10 $HEALTH_CHECK_URL
    
    # 使用 curl 進行並發測試
    for i in {1..10}; do
        curl -s $HEALTH_CHECK_URL &
    done
    wait
    
    echo "負載測試完成"
}
```

## 聯絡和支援

### 1. 支援層級

```
Level 1: 基本技術支援 (dev-team@newpennine.com)
Level 2: 進階技術支援 (senior-dev@newpennine.com)
Level 3: 系統架構支援 (architect@newpennine.com)
Level 4: 緊急事件支援 (+852-1234-5678)
```

### 2. 報告問題模板

```
問題標題: [緊急程度] 問題簡述
發生時間: YYYY-MM-DD HH:MM:SS
影響範圍: [用戶數量/功能模組]
錯誤症狀: 具體描述
重現步驟: 1. 2. 3.
系統環境: 
診斷結果: 
已嘗試解決方案: 
聯絡資訊: 
```

## 文檔版本控制

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次檢查**: 2025-08-17  

### 更新歷史
- v2.0.7 (2025-07-17): 初始版本，包含完整故障排除程序
- 未來版本將根據實際運維經驗持續更新

---

**維護者**: NewPennine DevOps & Backend Team  
**緊急聯絡**: ops-team@newpennine.com  
**文檔路徑**: `/docs/manual/troubleshooting-manual.md`