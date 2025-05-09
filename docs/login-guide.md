# Pennine 庫存系統登入指南

## 登入問題排查

如果您在登入系統時遇到問題，請參考以下步驟排查：

### 1. 初始設置

首次使用系統前，資料庫需要被初始化。請聯繫系統管理員執行以下操作：

1. 在 Supabase 控制台的 SQL 編輯器中執行 `scripts/supabase-schema.sql` 中的 SQL 腳本
2. 這將創建必要的表格並添加管理員帳戶和示範數據

### 2. 預設帳號

系統有以下預設帳號可供使用：

| 帳號 ID | 密碼 | 角色 |
|---------|------|------|
| admin | admin123 | 系統管理員 |
| user1 | user1 | 倉庫人員 |
| user2 | user2 | 物流人員 |

首次登入時，系統會要求您更改密碼（除管理員帳號外）。

### 3. 常見登入錯誤

如果您遇到以下錯誤，請嘗試對應的解決方案：

- **"查詢用戶錯誤"** - 可能是資料庫連接問題，請確認：
  - 環境變數設置正確
  - Supabase 項目已啟動
  - 所需數據表已創建

- **"用戶不存在"** - 請確認：
  - 輸入的用戶 ID 正確
  - 資料庫中已創建該用戶

- **"密碼錯誤"** - 請確認：
  - 如果是首次登入，密碼應與用戶 ID 相同
  - 如果已更改密碼，請使用新密碼

### 4. 臨時解決方案

如果您仍然無法登入，可以嘗試：

1. 使用管理員帳號 (admin/admin123)
2. 清除瀏覽器數據並重新登入
3. 檢查瀏覽器控制台是否有錯誤消息

### 5. 聯繫支持

如有其他問題，請聯繫系統管理員或 IT 部門獲取幫助。

## 系統使用流程

1. 登入系統
2. 首次登入需要更改密碼
3. 登入後可以訪問主頁並使用各種功能
4. 根據您的權限，某些功能可能不可用 