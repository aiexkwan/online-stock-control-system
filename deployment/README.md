# NewPennine WMS 部署配置

這是 NewPennine WMS 的部署配置系統，提供環境配置和基本部署工具。

## 系統架構

```
deployment/
├── config/
│   ├── deployment.conf          # 主要部署配置
│   └── environments/            # 環境配置文件
└── scripts/
    ├── utils/
    │   ├── database.sh          # 資料庫管理工具
    │   └── notifications.sh     # 通知系統工具
    └── config/
        └── environments/        # 環境設定
```

## 配置文件

### 主要配置 (deployment.conf)

包含應用程式的主要部署設定：
- 環境變數
- 備份設定
- 監控配置
- 通知設定
- 安全配置
- 資源限制
- 資料庫設定
- 效能設定

### 環境配置

環境特定的配置文件位於 `deployment/scripts/config/environments/`：
- `production.env` - 生產環境配置
- `staging.env` - 測試環境配置

## 工具腳本

### 資料庫管理 (database.sh)

提供資料庫管理工具：
```bash
./deployment/scripts/utils/database.sh check    # 檢查資料庫連接
./deployment/scripts/utils/database.sh backup   # 創建資料庫備份
./deployment/scripts/utils/database.sh health   # 資料庫健康檢查
```

### 通知系統 (notifications.sh)

提供通知功能：
```bash
./deployment/scripts/utils/notifications.sh test           # 測試通知配置
./deployment/scripts/utils/notifications.sh create_config  # 創建通知配置
```

## 支援的通知渠道

- Slack
- Microsoft Teams
- Email
- Discord
- 自定義 Webhook

## 配置範例

### 編輯環境配置

```bash
# 生產環境
vi deployment/scripts/config/environments/production.env

# 測試環境
vi deployment/scripts/config/environments/staging.env
```

### 設置腳本權限

```bash
chmod +x deployment/scripts/utils/*.sh
```

## 最佳實踐

### 安全考量

1. 定期更新依賴
2. 使用強密碼和密鑰
3. 限制訪問權限
4. 定期備份重要數據
5. 定期檢查配置文件

### 配置管理

1. 使用環境變數管理敏感資訊
2. 定期檢查配置文件
3. 建立配置變更追蹤
4. 測試配置變更

## 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查連接字串
   - 確認網路連通性
   - 驗證認證資訊

2. **通知發送失敗**
   - 檢查 Webhook URL
   - 驗證通知配置
   - 測試網路連接

### 日誌查看

日誌文件位於 `deployment/scripts/logs/` 目錄中。

## 許可證

本部署系統遵循 MIT 許可證。
