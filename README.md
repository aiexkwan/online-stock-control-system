# 庫存管理系統

在線倉庫庫存控制系統，使用 Next.js 作為前端和 Supabase 作為後端。

## 功能概述

- 用戶認證與權限管理
- 產品庫存管理
- 入庫、出庫和庫存轉移操作
- 庫存報表與數據分析
- 用戶管理
- 多角色支持（管理員、倉庫員、物流等）

## 系統要求

- Node.js 18+ 
- 互聯網連接（用於 Supabase）
- 支持現代瀏覽器（Chrome, Firefox, Safari, Edge）

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置環境變數

創建 `.env.local` 文件並添加以下內容：

```
NEXT_PUBLIC_SUPABASE_URL=https://bbmkuiplnzvpudszrend.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 初始化數據庫

在 Supabase 控制台的 SQL 編輯器中運行 `scripts/supabase-schema.sql` 中的 SQL 腳本。

### 4. 啟動開發服務器

```bash
npm run dev
```

訪問 http://localhost:3000 查看應用程序。

## 登入系統

### 預設帳號

| 帳號 ID | 密碼 | 角色 |
|---------|------|------|
| admin | admin123 | 系統管理員 |
| user1 | user1 | 倉庫人員 |
| user2 | user2 | 物流人員 |

首次登入時，系統會要求您更改密碼（除管理員帳號外）。

### 登入問題排查

如果您在登入時遇到問題，請參考：

1. **用戶不存在錯誤**：請參閱 [Supabase 疑難排解指南](docs/supabase-troubleshooting.md)
2. **可用的測試用戶**：
   - 用戶 ID: `5997`, 密碼: `5997`
   - 用戶 ID: `testuser`, 密碼: `testuser`
   - 用戶 ID: `admin`, 密碼: `admin123`

## 部署

系統已配置好自動部署流程：

1. 代碼推送到 GitHub 存儲庫
2. Vercel 自動部署應用程序

### 自動代碼推送功能

系統配置了自動代碼推送功能，可以監控檔案變更並自動提交至 GitHub：

#### 開啟自動推送（Windows）：

```powershell
# 使用 PowerShell 腳本啟動
.\scripts\start-auto-push.ps1
```

#### 開啟自動推送（Linux/MacOS）：

```bash
# 給予執行權限
chmod +x scripts/start-auto-push.sh

# 啟動自動推送
./scripts/start-auto-push.sh
```

自動推送功能會：
- 監控所有檔案變更（新增、修改、刪除）
- 每 5 分鐘檢查是否有變更，如有則自動提交並推送到 GitHub
- 忽略 .git、node_modules 等目錄的變更
- 提交訊息格式為「自動提交: YYYY-MM-DD HH:MM:SS」

如需手動推送，可使用：

```bash
./push.sh "您的提交訊息"
```

## 技術堆棧

- **前端框架**：Next.js 13 (App Router)
- **UI 框架**：Tailwind CSS
- **後端服務**：Supabase
- **認證**：Custom JWT with Supabase
- **托管**：Vercel

## 文件結構

```
/app                  - Next.js 應用代碼
  /components         - 共享組件
  /login              - 登入頁面
  /products           - 產品管理
  /inventory          - 庫存操作
  /reports            - 報表頁面
  /users              - 用戶管理 
/lib                  - 通用庫和工具
  /supabase.ts        - Supabase 客戶端初始化
/scripts              - 數據庫初始化腳本
/docs                 - 系統文檔
  /databaseStructure.md - 資料庫結構文檔
```

## 📊 資料庫文檔

系統提供完整的資料庫結構文檔，包含所有表格的詳細信息：

- **查看文檔**: [資料庫結構文檔](docs/databaseStructure.md)
- **自動更新**: `node scripts/update-database-docs.js`
- **手動檢查**: `node check_actual_tables.js`

### 資料庫概覽
- 總表格數: 14個
- 總記錄數: 8,545筆
- 主要表格: `data_code`, `data_id`, `record_inventory`, `record_history`

### MCP工具支援
系統已配置MCP (Model Context Protocol) 工具，可直接與Supabase資料庫互動：
- 查詢表格結構
- 執行SQL操作
- 數據分析和報告

### ACO訂單管理功能
系統提供完整的ACO (Advanced Customer Order) 訂單管理功能：
- **智能訂單選擇**: 支援從現有訂單選擇或手動輸入新訂單
- **庫存檢查**: 自動檢查剩餘數量，防止超量操作
- **狀態管理**: 自動識別已完成訂單並禁用相關操作
- **輸入驗證**: 數字欄位自動過濾，確保數據完整性
- **用戶友好**: 清晰的警告信息和狀態指示

## 故障排除

常見問題：

1. **登入失敗** - 檢查 Supabase 連接和用戶表設置
2. **無法訪問功能** - 檢查用戶權限設置
3. **數據不顯示** - 查看開發者控制台是否有 API 錯誤 
