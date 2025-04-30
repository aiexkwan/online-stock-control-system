# Pennine 庫存管理系統

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

如果您在登入時遇到問題，請參考 [登入指南](docs/login-guide.md)。

## 部署

系統已配置好自動部署流程：

1. 代碼推送到 GitHub 存儲庫
2. Vercel 自動部署應用程序

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
```

## 故障排除

常見問題：

1. **登入失敗** - 檢查 Supabase 連接和用戶表設置
2. **無法訪問功能** - 檢查用戶權限設置
3. **數據不顯示** - 查看開發者控制台是否有 API 錯誤 