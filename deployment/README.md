# NewPennine WMS 自動化部署系統

這是一個完整的自動化部署腳本系統，支援藍綠部署、災難恢復、監控和維護功能。

## 系統架構

```
deployment/
├── scripts/
│   ├── deploy.sh                 # 主要部署腳本
│   ├── utils/
│   │   ├── common.sh             # 通用工具函數
│   │   ├── docker.sh             # Docker 管理工具
│   │   ├── database.sh           # 資料庫管理工具
│   │   ├── health-check.sh       # 健康檢查工具
│   │   └── notifications.sh      # 通知系統工具
│   ├── services/
│   │   └── nginx-manager.sh      # Nginx 負載均衡管理
│   ├── monitoring/
│   │   └── performance-monitor.sh # 性能監控腳本
│   ├── maintenance/
│   │   └── system-maintenance.sh # 系統維護腳本
│   ├── disaster-recovery/
│   │   └── rollback.sh           # 災難恢復和回滾腳本
│   └── config/
│       └── environments/         # 環境配置文件
├── nginx/                        # Nginx 配置
├── redis/                        # Redis 配置
└── monitoring/                   # 監控配置
```

## 快速開始

### 1. 環境準備

確保系統已安裝以下工具：
- Docker 和 Docker Compose
- Git
- Node.js 和 npm
- PostgreSQL 客戶端 (psql)
- curl 和 jq

### 2. 配置環境變量

編輯環境配置文件：
```bash
# 生產環境
vi deployment/scripts/config/environments/production.env

# 測試環境
vi deployment/scripts/config/environments/staging.env
```

### 3. 設置權限

```bash
# 設置腳本執行權限
chmod +x deployment/scripts/*.sh
chmod +x deployment/scripts/utils/*.sh
chmod +x deployment/scripts/services/*.sh
chmod +x deployment/scripts/monitoring/*.sh
chmod +x deployment/scripts/maintenance/*.sh
chmod +x deployment/scripts/disaster-recovery/*.sh
```

### 4. 創建必要目錄

```bash
mkdir -p deployment/scripts/logs
mkdir -p deployment/scripts/logs/backups
mkdir -p deployment/scripts/logs/metrics
mkdir -p deployment/scripts/logs/alerts
```

## 部署指南

### 完整部署

```bash
# 生產環境完整部署
./deployment/scripts/deploy.sh -e production -v 1.0.0 -c auto

# 測試環境快速部署
./deployment/scripts/deploy.sh -e staging -v 1.0.1 -c blue -t quick
```

### 部署選項

- `-e, --environment ENV`: 部署環境 (staging, production)
- `-v, --version VERSION`: 部署版本號
- `-c, --color COLOR`: 目標顏色 (blue, green, auto)
- `-t, --type TYPE`: 部署類型 (full, quick, rollback)
- `-s, --skip-tests`: 跳過測試
- `-b, --skip-backup`: 跳過備份
- `-n, --dry-run`: 乾運行模式
- `-h, --help`: 顯示幫助

### 部署類型

1. **完整部署 (full)**
   - 預部署檢查
   - 構建應用程式
   - 運行測試
   - 資料庫遷移
   - 部署新版本
   - 健康檢查
   - 流量切換
   - 驗證部署

2. **快速部署 (quick)**
   - 跳過測試和遷移
   - 適用於小型更新

3. **回滾部署 (rollback)**
   - 自動回滾到上一版本
   - 包含完整驗證

## 監控和告警

### 啟動性能監控

```bash
# 啟動持續監控
./deployment/scripts/monitoring/performance-monitor.sh

# 生成性能報告
./deployment/scripts/monitoring/performance-monitor.sh report 3600
```

### 配置告警

編輯通知配置：
```bash
vi deployment/scripts/config/notifications.json
```

測試通知配置：
```bash
./deployment/scripts/utils/notifications.sh test
```

## 維護操作

### 系統清理

```bash
# 完整系統清理
./deployment/scripts/maintenance/system-maintenance.sh cleanup full

# 僅清理 Docker
./deployment/scripts/maintenance/system-maintenance.sh cleanup docker

# 僅清理日誌
./deployment/scripts/maintenance/system-maintenance.sh cleanup logs
```

### 備份管理

```bash
# 創建完整備份
./deployment/scripts/maintenance/system-maintenance.sh backup create

# 列出所有備份
./deployment/scripts/maintenance/system-maintenance.sh backup list

# 驗證備份
./deployment/scripts/maintenance/system-maintenance.sh backup verify

# 恢復備份
./deployment/scripts/maintenance/system-maintenance.sh backup restore /path/to/backup.tar.gz
```

### 安全更新

```bash
# 執行安全更新
./deployment/scripts/maintenance/system-maintenance.sh security
```

## 災難恢復

### 自動回滾

```bash
# 自動回滾到上一個穩定版本
./deployment/scripts/disaster-recovery/rollback.sh rollback auto

# 手動回滾到特定版本
./deployment/scripts/disaster-recovery/rollback.sh rollback manual 1.0.0
```

### 故障轉移

```bash
# 執行故障轉移
./deployment/scripts/disaster-recovery/rollback.sh failover manual
```

### 數據恢復

```bash
# 恢復資料庫
./deployment/scripts/disaster-recovery/rollback.sh recovery database

# 恢復配置
./deployment/scripts/disaster-recovery/rollback.sh recovery configuration

# 完整系統恢復
./deployment/scripts/disaster-recovery/rollback.sh recovery full
```

## 服務管理

### Nginx 管理

```bash
# 更新 Nginx 配置
./deployment/scripts/services/nginx-manager.sh update blue

# 重載 Nginx
./deployment/scripts/services/nginx-manager.sh reload

# 檢查 Nginx 健康狀態
./deployment/scripts/services/nginx-manager.sh health
```

### Docker 管理

```bash
# 啟動環境
./deployment/scripts/utils/docker.sh start blue

# 停止環境
./deployment/scripts/utils/docker.sh stop green

# 清理舊容器
./deployment/scripts/utils/docker.sh cleanup blue
```

## 健康檢查

### 服務健康檢查

```bash
# 檢查藍色環境健康狀態
./deployment/scripts/utils/health-check.sh check blue

# 運行煙霧測試
./deployment/scripts/utils/health-check.sh smoke green

# 運行性能測試
./deployment/scripts/utils/health-check.sh performance blue
```

### 資料庫健康檢查

```bash
# 檢查資料庫連接
./deployment/scripts/utils/database.sh check

# 資料庫健康檢查
./deployment/scripts/utils/database.sh health

# 創建資料庫備份
./deployment/scripts/utils/database.sh backup
```

## 配置管理

### 環境配置

所有環境配置都在 `deployment/scripts/config/environments/` 目錄中。

主要配置項：
- **基本設定**: 環境類型、端口、主機名
- **資料庫配置**: Supabase 連接資訊
- **安全配置**: JWT 密鑰、認證設定
- **監控配置**: 性能閾值、告警設定
- **部署配置**: 策略、超時設定

### 通知配置

創建通知配置文件：
```bash
./deployment/scripts/utils/notifications.sh create_config
```

支援的通知渠道：
- Slack
- Microsoft Teams
- Email
- 自定義 Webhook

## 監控集成

### Prometheus 集成

配置 Prometheus 監控：
```bash
vi deployment/scripts/config/monitoring.json
```

### 自定義監控

添加自定義監控端點：
```bash
# 編輯監控配置
vi deployment/scripts/monitoring/performance-monitor.sh
```

## 故障排除

### 常見問題

1. **部署失敗**
   - 檢查環境配置
   - 確認資料庫連接
   - 查看部署日誌

2. **健康檢查失敗**
   - 檢查服務狀態
   - 確認端口可用性
   - 查看應用程式日誌

3. **回滾失敗**
   - 檢查備份完整性
   - 確認目標版本存在
   - 查看回滾日誌

### 日誌查看

```bash
# 查看部署日誌
tail -f deployment/scripts/logs/deploy_*.log

# 查看監控日誌
tail -f deployment/scripts/logs/monitoring.log

# 查看回滾日誌
tail -f deployment/scripts/logs/rollback.log
```

## 最佳實踐

### 部署流程

1. 始終在測試環境先測試
2. 使用版本標籤管理發布
3. 執行完整的健康檢查
4. 創建部署前備份
5. 監控部署後指標

### 監控設定

1. 設置適當的告警閾值
2. 配置多渠道通知
3. 定期檢查監控數據
4. 建立告警響應流程

### 安全考量

1. 定期更新依賴
2. 掃描安全漏洞
3. 使用強密碼和密鑰
4. 限制訪問權限
5. 定期備份重要數據

## 進階配置

### 自動化排程

使用 cron 設置自動化任務：
```bash
# 每日凌晨2點創建備份
0 2 * * * /path/to/deployment/scripts/maintenance/system-maintenance.sh backup create

# 每週日凌晨3點執行安全更新
0 3 * * 0 /path/to/deployment/scripts/maintenance/system-maintenance.sh security

# 每小時清理臨時文件
0 * * * * /path/to/deployment/scripts/maintenance/system-maintenance.sh cleanup temp
```

### 自定義腳本

可以根據需要添加自定義功能：
1. 在 `deployment/scripts/custom/` 目錄創建腳本
2. 遵循現有的錯誤處理模式
3. 使用通用工具函數
4. 添加適當的日誌記錄

## 支援和維護

### 版本更新

定期更新部署腳本：
```bash
git pull origin main
chmod +x deployment/scripts/**/*.sh
```

### 聯絡支援

如有問題，請提供以下信息：
- 部署日誌
- 環境配置
- 錯誤信息
- 系統資訊

## 許可證

本部署系統遵循 MIT 許可證。詳見 LICENSE 文件。