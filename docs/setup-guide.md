# Pennine Stock Control System 設置指南

## 前置需求

1. Node.js (v18 或更高版本)
2. Git
3. npm 或 yarn
4. 瀏覽器（推薦 Chrome 或 Edge）

## 環境設置

1. **克隆專案**
   ```bash
   git clone https://github.com/aiexkwan/online-stock-control-system.git
   cd online-stock-control-system
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **環境變數設置**
   - 創建 `.env.local` 文件在專案根目錄
   - 添加以下內容：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://bbmkuiplnzvpudszrend.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJiYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q
   SUPABASE_SERVICE_ROLE_KEY=<從管理員獲取>
   ```

## 啟動開發服務器

1. **運行開發服務器**
   ```bash
   npm run dev
   ```

2. **訪問應用**
   - 打開瀏覽器訪問 http://localhost:3000

## 登入系統

### 預設帳號

| 帳號 ID | 密碼 | 角色 |
|---------|------|------|
| admin | admin123 | 系統管理員 |
| user1 | user1 | 倉庫人員 |
| user2 | user2 | 物流人員 |

### 首次登入
- 使用 ID 作為密碼
- 系統會要求更改密碼（除管理員帳號外）

## 常見問題解決

### 1. 無法登入
- 確認網絡連接
- 檢查環境變數是否正確設置
- 清除瀏覽器緩存和 localStorage

### 2. 資料庫連接錯誤
- 確認 Supabase URL 和 API key 是否正確
- 檢查網絡連接
- 聯繫系統管理員確認資料庫狀態

### 3. 頁面載入錯誤
- 確保 Node.js 版本正確
- 刪除 .next 文件夾並重新運行 npm run dev
- 檢查控制台錯誤信息

## 注意事項

1. **不要提交 .env.local 文件**
   - 此文件包含敏感信息
   - 已在 .gitignore 中排除

2. **不要修改資料庫結構**
   - 所有資料庫更改需要通過管理員執行
   - 使用提供的 API 進行數據操作

3. **權限管理**
   - 不同用戶有不同的權限級別
   - 請勿嘗試訪問未授權的功能

## 技術支持

如遇到問題，請聯繫：
- 系統管理員
- IT 支持團隊

## 更新代碼

定期更新代碼以獲取最新功能和修復：
```bash
git pull origin main
npm install
``` 