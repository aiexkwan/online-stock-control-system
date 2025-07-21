# NewPennine WMS 部署指南

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: DevOps Team  
**狀態**: 生產就緒

## 概述

本指南提供 NewPennine 倉庫管理系統嘅完整部署指南，包括傳統部署、藍綠部署、監控設置同故障恢復程序。系統基於 Next.js 14、Supabase 同 TypeScript 架構，已完成 v2.0.7 階段嘅完整優化。

## 系統要求

### 硬件要求

#### 最低要求
- **CPU**: 2 cores
- **記憶體**: 4GB RAM
- **存儲**: 20GB 可用空間
- **網絡**: 100Mbps 頻寬

#### 建議要求
- **CPU**: 4 cores
- **記憶體**: 8GB RAM
- **存儲**: 50GB SSD
- **網絡**: 1Gbps 頻寬

### 軟件要求

#### 必需軟件
- **Node.js**: 18.x 或以上
- **npm**: 9.x 或以上
- **Git**: 2.x 或以上
- **PostgreSQL**: 15.x 或以上（如果使用本地數據庫）

#### 可選軟件
- **Nginx**: 1.20 或以上
- **Redis**: 7.x 或以上（用於緩存）

## 環境配置

### 1. 環境變數設置

創建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 認證配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# 數據庫配置
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Redis 配置（可選）
REDIS_URL=redis://localhost:6379

# 監控配置
MONITORING_ENABLED=true
LOG_LEVEL=info

# 通知配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack 通知（可選）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# 生產環境配置
NODE_ENV=production
```

### 2. 環境檢查腳本

使用內建健康檢查確認環境配置：

```bash
# 檢查基礎環境
npm run health:check

# 檢查進階配置
curl http://localhost:3000/api/v2/health

# 檢查性能指標
curl http://localhost:3000/api/v1/metrics
```

## 傳統部署流程

### 1. 系統準備

```bash
# 1. 克隆代碼
git clone https://github.com/your-org/newpennine-wms.git
cd newpennine-wms

# 2. 安裝依賴
npm install

# 3. 環境變數設置
cp .env.example .env.local
# 編輯 .env.local 文件

# 4. 數據庫設置
npm run db:setup

# 5. 構建應用
npm run build

# 6. 運行測試
npm run test
npm run test:e2e
```

### 2. 部署步驟

```bash
# 1. 停止現有服務
sudo systemctl stop newpennine-wms

# 2. 備份現有版本
sudo cp -r /var/www/newpennine-wms /var/www/newpennine-wms.backup

# 3. 部署新版本
sudo cp -r dist/* /var/www/newpennine-wms/

# 4. 更新配置
sudo cp .env.local /var/www/newpennine-wms/

# 5. 重啟服務
sudo systemctl start newpennine-wms
sudo systemctl enable newpennine-wms

# 6. 驗證部署
curl http://localhost:3000/api/v1/health
```

### 3. 服務配置

創建 systemd 服務文件 `/etc/systemd/system/newpennine-wms.service`：

```ini
[Unit]
Description=NewPennine WMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/newpennine-wms
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 藍綠部署流程

### 1. 藍綠部署架構

```
                    Load Balancer
                         |
                    +----+----+
                    |         |
                   Blue     Green
                 (Current)  (New)
```

### 2. 部署腳本

創建 `scripts/blue-green-deploy.sh`：

```bash
#!/bin/bash

# 藍綠部署腳本
BLUE_PORT=3000
GREEN_PORT=3001
HEALTH_CHECK_URL="/api/v1/health"

echo "Starting Blue-Green Deployment..."

# 1. 部署到 Green 環境
echo "Deploying to Green environment..."
cd /var/www/newpennine-wms-green
git pull origin main
npm install
npm run build
PORT=$GREEN_PORT npm start &
GREEN_PID=$!

# 2. 健康檢查
echo "Performing health checks..."
sleep 30
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$GREEN_PORT$HEALTH_CHECK_URL)

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "Health check passed. Switching traffic..."

    # 3. 切換流量
    sudo nginx -s reload

    # 4. 停止藍色環境
    echo "Stopping Blue environment..."
    sudo systemctl stop newpennine-wms-blue

    echo "Deployment completed successfully!"
else
    echo "Health check failed. Rolling back..."
    kill $GREEN_PID
    exit 1
fi
```

### 3. Nginx 配置

```nginx
upstream newpennine_backend {
    server 127.0.0.1:3000;  # Blue
    server 127.0.0.1:3001 backup;  # Green
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://newpennine_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/v1/health {
        proxy_pass http://newpennine_backend;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
    }
}
```

## 監控和健康檢查

### 1. 健康檢查端點

系統提供多個健康檢查端點：

```bash
# 基本健康檢查
curl http://localhost:3000/api/v1/health

# 進階健康檢查
curl http://localhost:3000/api/v2/health

# 性能指標
curl http://localhost:3000/api/v1/metrics

# 緩存指標
curl http://localhost:3000/api/v1/cache/metrics
```

### 2. 監控腳本

創建 `scripts/monitor.sh`：

```bash
#!/bin/bash

# 監控腳本
LOG_FILE="/var/log/newpennine-wms/monitor.log"
ALERT_URL="https://hooks.slack.com/services/..."

check_health() {
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

    if [ "$HEALTH_STATUS" -ne 200 ]; then
        echo "$(date): Health check failed - Status: $HEALTH_STATUS" >> $LOG_FILE
        send_alert "Health check failed"
        return 1
    fi

    return 0
}

send_alert() {
    local message="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 NewPennine WMS Alert: $message\"}" \
        $ALERT_URL
}

# 主監控循環
while true; do
    if ! check_health; then
        echo "$(date): Attempting to restart service..." >> $LOG_FILE
        sudo systemctl restart newpennine-wms
        sleep 60
    fi

    sleep 30
done
```

### 3. 自動化部署腳本

創建 `scripts/auto-deploy.sh`：

```bash
#!/bin/bash

# 自動化部署腳本
set -e

DEPLOY_DIR="/var/www/newpennine-wms"
BACKUP_DIR="/var/backups/newpennine-wms"
LOG_FILE="/var/log/newpennine-wms/deploy.log"

echo "$(date): Starting automated deployment..." >> $LOG_FILE

# 1. 創建備份
echo "Creating backup..." >> $LOG_FILE
sudo cp -r $DEPLOY_DIR "${BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)"

# 2. 更新代碼
echo "Updating code..." >> $LOG_FILE
cd $DEPLOY_DIR
git pull origin main

# 3. 安裝依賴
echo "Installing dependencies..." >> $LOG_FILE
npm install

# 4. 運行測試
echo "Running tests..." >> $LOG_FILE
npm test

# 5. 構建應用
echo "Building application..." >> $LOG_FILE
npm run build

# 6. 重啟服務
echo "Restarting service..." >> $LOG_FILE
sudo systemctl restart newpennine-wms

# 7. 健康檢查
echo "Performing health check..." >> $LOG_FILE
sleep 30
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "$(date): Deployment completed successfully!" >> $LOG_FILE
else
    echo "$(date): Deployment failed! Rolling back..." >> $LOG_FILE
    # 回滾程序
    sudo systemctl stop newpennine-wms
    sudo rm -rf $DEPLOY_DIR
    sudo cp -r "${BACKUP_DIR}/$(ls -t ${BACKUP_DIR} | head -1)" $DEPLOY_DIR
    sudo systemctl start newpennine-wms
    exit 1
fi
```

## 故障恢復

### 1. 自動回滾

```bash
#!/bin/bash

# 自動回滾腳本
rollback() {
    echo "Starting rollback process..."

    # 停止當前服務
    sudo systemctl stop newpennine-wms

    # 恢復備份
    LATEST_BACKUP=$(ls -t /var/backups/newpennine-wms | head -1)
    sudo rm -rf /var/www/newpennine-wms
    sudo cp -r "/var/backups/newpennine-wms/$LATEST_BACKUP" /var/www/newpennine-wms

    # 重啟服務
    sudo systemctl start newpennine-wms

    # 驗證回滾
    sleep 30
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

    if [ "$HEALTH_STATUS" -eq 200 ]; then
        echo "Rollback completed successfully!"
    else
        echo "Rollback failed! Manual intervention required."
        exit 1
    fi
}

# 觸發回滾
rollback
```

### 2. 數據庫回滾

```sql
-- 數據庫回滾腳本
BEGIN;

-- 1. 創建回滾點
SAVEPOINT rollback_point;

-- 2. 執行回滾邏輯
-- 根據具體情況執行相應的回滾操作

-- 3. 確認回滾
SELECT version(), current_timestamp;

-- 4. 提交或回滾
-- COMMIT; -- 如果確認回滾成功
-- ROLLBACK TO rollback_point; -- 如果需要撤銷回滾
```

## 性能優化

### 1. 生產環境優化

```bash
# 設置生產環境變數
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 啟用 PM2 進程管理
npm install -g pm2
pm2 start npm --name "newpennine-wms" -- start
pm2 save
pm2 startup
```

### 2. 緩存配置

```javascript
// next.config.js
module.exports = {
  output: 'standalone',

  // 生產環境優化
  swcMinify: true,
  compress: true,

  // 緩存配置
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=600'
        }
      ]
    }
  ]
};
```

## 安全配置

### 1. 防火牆設置

```bash
# UFW 防火牆配置
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # 只允許內部訪問
sudo ufw enable
```

### 2. SSL/TLS 配置

```bash
# 使用 Let's Encrypt 獲取證書
sudo certbot --nginx -d your-domain.com
```

## 維護指南

### 1. 日常維護

```bash
# 每日檢查腳本
#!/bin/bash

# 檢查磁碟空間
df -h

# 檢查服務狀態
sudo systemctl status newpennine-wms

# 檢查日誌
tail -f /var/log/newpennine-wms/application.log

# 檢查健康狀態
curl http://localhost:3000/api/v1/health
```

### 2. 定期維護

```bash
# 每週維護腳本
#!/bin/bash

# 清理舊日誌
find /var/log/newpennine-wms -type f -mtime +7 -delete

# 清理舊備份
find /var/backups/newpennine-wms -type d -mtime +30 -exec rm -rf {} \;

# 更新系統
sudo apt update && sudo apt upgrade -y

# 重啟服務
sudo systemctl restart newpennine-wms
```

## 常見問題

### 1. 服務啟動失敗

```bash
# 檢查日誌
sudo journalctl -u newpennine-wms -f

# 檢查端口佔用
sudo netstat -tulpn | grep :3000

# 檢查環境變數
env | grep -E "(NODE_ENV|DATABASE_URL|NEXT_PUBLIC_)"
```

### 2. 數據庫連接問題

```bash
# 測試數據庫連接
psql $DATABASE_URL -c "SELECT 1;"

# 檢查連接池
curl http://localhost:3000/api/v1/metrics | grep database
```

### 3. 性能問題

```bash
# 檢查系統資源
top
htop
iostat -x 1

# 檢查應用指標
curl http://localhost:3000/api/v1/metrics
```

## 聯絡資訊

**技術支援**: dev-team@newpennine.com  
**運維支援**: ops-team@newpennine.com  
**緊急聯絡**: +852-1234-5678  

---

**版本**: v2.0.7  
**最後更新**: 2025-07-17  
**維護者**: NewPennine DevOps Team
