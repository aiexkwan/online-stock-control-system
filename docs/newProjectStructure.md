# 專案架構重組 - 開放訪問模式

## 目標

重組現有專案架構，實現以下目標：
- 提供一個與現有 Dashboard 功能相似的介面
- 側邊欄功能精簡為：Print Label, Print GRN Label, Stock Transfer 和 Admin Login
- 允許用戶在不登入 (Supabase Auth) 的情況下使用基本功能
- 僅對 Admin 功能維持 Supabase Auth 驗證需求

## 實現方案

### 1. 新增開放訪問 Dashboard

創建一個新的開放訪問儀表板頁面 (`/dashboard/open-access`)，包含與現有 Dashboard 相似的數據展示：
- 今日匯總（圓環圖）
- 活動訂單
- 最近 GRN 

### 2. 精簡側邊欄

為開放訪問模式創建專門的側邊欄導航，僅顯示以下功能：
- Print Label
- Print GRN Label
- Stock Transfer
- Admin Login (需要認證)

### 3. 中間件修改

修改 Supabase Auth 中間件，允許未認證用戶訪問指定路由：
- /print-label
- /print-grnlabel
- /stock-transfer
- /dashboard/open-access

### 4. 根路由重定向

將網站根路由 (`/`) 重定向至開放訪問頁面 (`/dashboard/open-access`)

## 文件變更

### 新建文件

1. **app/dashboard/open-access/page.tsx**
   - 開放訪問的主儀表板頁面
   - 包含與原 Dashboard 相似的數據展示組件
   - 使用模擬數據代替 Supabase 查詢

2. **app/dashboard/open-access/layout.tsx**
   - 開放訪問模式的專用佈局
   - 引用開放訪問專用的導航欄

3. **app/components/open-access-nav.tsx**
   - 精簡功能的側邊欄導航組件
   - 僅包含 4 個指定功能
   - 響應式設計，支持移動設備

4. **app/page.tsx**
   - 根路由重定向到開放訪問頁面

### 修改文件

1. **middleware.ts**
   - 擴展公開路由列表，包含：
     - /print-label
     - /print-grnlabel
     - /stock-transfer
     - /dashboard/open-access
   - 保持對其他路由的認證需求不變

## 使用流程

1. 用戶訪問網站時，自動重定向到開放訪問儀表板
2. 用戶可以直接使用以下功能，無需登入：
   - 查看儀表板數據（圓環圖、活動訂單、最近 GRN）
   - 打印標籤 (Print Label)
   - 打印 GRN 標籤 (Print GRN Label)
   - 庫存轉移 (Stock Transfer)
3. 若需要使用管理功能，用戶需要點擊 Admin Login 並使用 Supabase Auth 認證

## 注意事項

- 此架構允許未認證用戶訪問基本功能，適用於內部網路或受控環境
- 儘管無需登入即可訪問功能頁面，但數據操作可能仍需用戶身份確認
- 若需進一步加強安全性，可考慮在敏感操作時添加額外的驗證步驟