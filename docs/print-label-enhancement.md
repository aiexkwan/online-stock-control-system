# Print Label Enhancement Documentation

## 概述 (Overview)

本文檔說明了對print-label頁面的功能增強，在按下"Print Label"按鈕後，除了執行原有的打印標籤動作外，還會自動執行兩個新的數據庫更新動作。

This document describes the enhancements to the print-label page functionality. After pressing the "Print Label" button, in addition to the original label printing actions, two new database update actions are automatically executed.

## 新增功能 (New Features)

### 動作一：Stock Level 更新 (Action 1: Stock Level Update)

**目標表：** `stock_level`

**邏輯：**
1. 驗證產品代碼是否存在於`data_code`表中
2. 在`stock`欄位中搜尋是否有現有記錄（根據產品代碼）
3. 如果有現有記錄：
   - 在`stock_level`欄位加上數量 (qty)
   - 更新`update_time`欄位為當前時間
4. 如果沒有現有記錄：
   - 新建一條記錄，包含產品代碼、描述、數量和時間

**Logic:**
1. Validate that the product code exists in the `data_code` table
2. Search for existing records in the `stock` field (by product code)
3. If existing record found:
   - Add quantity to the `stock_level` field
   - Update `update_time` field to current time
4. If no existing record:
   - Create a new record with product code, description, quantity, and timestamp

### 動作二：Work Level 更新 (Action 2: Work Level Update)

**目標表：** `work_level`

**邏輯：**
1. 驗證用戶ID是否存在於`data_id`表中
2. 在`latest_update`欄位中搜尋是否有當天日期的記錄（只比較日期，不比較時間）
3. 如果有當天記錄：
   - 在`QC`欄位加上托盤數量（代表當天QC工作量增加）
   - 更新`latest_update`欄位為當前時間
4. 如果沒有當天記錄：
   - 新建一條記錄，設置QC為托盤數量，Move為0

**Logic:**
1. Validate that the user ID exists in the `data_id` table
2. Search for records with today's date in the `latest_update` field (date comparison only, not time)
3. If today's record found:
   - Add pallet count to the `QC` field (representing increased QC workload for today)
   - Update `latest_update` field to current time
4. If no today's record:
   - Create a new record with QC set to pallet count and Move set to 0

## 技術實現 (Technical Implementation)

### 數據庫函數 (Database Functions)

創建了三個PostgreSQL RPC函數：

1. **`update_stock_level(p_product_code, p_quantity, p_description)`**
   - 處理stock_level表的更新或新增
   - 包含產品代碼存在性驗證

2. **`update_work_level_qc(p_user_id, p_pallet_count)`**
   - 處理work_level表的QC工作量更新
   - 包含用戶ID存在性驗證

3. **`handle_print_label_updates(p_product_code, p_quantity, p_user_id, p_pallet_count, p_description)`**
   - 組合函數，同時處理兩個更新動作
   - 返回JSON格式的結果

### 數據完整性約束 (Data Integrity Constraints)

**重要：** 系統包含以下外鍵約束：
- `stock_level.stock` → `data_code.code`
- `work_level.id` → `data_id.id`

這意味著：
- 只能為已存在於`data_code`表中的產品更新庫存
- 只能為已存在於`data_id`表中的用戶更新工作記錄

**Important:** The system includes the following foreign key constraints:
- `stock_level.stock` → `data_code.code`
- `work_level.id` → `data_id.id`

This means:
- Stock can only be updated for products that exist in the `data_code` table
- Work records can only be updated for users that exist in the `data_id` table

### API端點 (API Endpoint)

**路徑：** `/api/print-label-updates`
**方法：** POST

**請求參數：**
```json
{
  "productCode": "string",
  "quantity": "number",
  "userId": "number",
  "palletCount": "number",
  "description": "string (optional)"
}
```

**響應格式：**
```json
{
  "success": boolean,
  "message": "string",
  "stockUpdated": boolean,
  "workUpdated": boolean
}
```

### 前端集成 (Frontend Integration)

在`useQcLabelBusiness.tsx`的`handleClockNumberConfirm`函數中，在成功生成和打印PDF後，會自動調用新的API端點來更新數據庫記錄。

## 錯誤處理 (Error Handling)

### 數據庫層錯誤 (Database Level Errors)

1. **產品代碼不存在：**
   - 錯誤訊息：`Product code [CODE] does not exist in data_code table`
   - 解決方案：確保產品已在系統中註冊

2. **用戶ID不存在：**
   - 錯誤訊息：`User ID [ID] does not exist in data_id table`
   - 解決方案：確保用戶已在系統中註冊

3. **外鍵約束違反：**
   - 這種情況已通過預先驗證避免

### 應用層錯誤處理 (Application Level Error Handling)

- 如果stock_level或work_level更新失敗，不會影響原有的打印功能
- 會顯示相應的警告訊息，告知用戶打印成功但記錄更新失敗
- 所有錯誤都會記錄在控制台中以便調試

## 測試 (Testing)

### 完整測試腳本
使用`scripts/test-print-label-enhancement.sql`腳本來測試RPC函數的功能：

```sql
-- 執行完整測試腳本
\i scripts/test-print-label-enhancement.sql
```

### 快速測試腳本
使用`scripts/quick-test-print-enhancement.sql`進行快速驗證：

```sql
-- 執行快速測試
\i scripts/quick-test-print-enhancement.sql
```

## 部署步驟 (Deployment Steps)

1. 執行RPC函數創建腳本：
   ```sql
   \i scripts/print-label-enhancement-rpc.sql
   ```

2. 測試RPC函數：
   ```sql
   \i scripts/quick-test-print-enhancement.sql
   ```

3. 部署前端代碼更新

4. 驗證功能正常運作

## 故障排除 (Troubleshooting)

### 常見問題 (Common Issues)

1. **外鍵約束錯誤：**
   ```
   ERROR: insert or update on table "stock_level" violates foreign key constraint "stock_level_stock_fkey"
   ```
   **解決方案：** 確保產品代碼存在於`data_code`表中

2. **用戶不存在錯誤：**
   ```
   ERROR: User ID [ID] does not exist in data_id table
   ```
   **解決方案：** 確保用戶ID存在於`data_id`表中

3. **權限錯誤：**
   ```
   ERROR: permission denied for function [function_name]
   ```
   **解決方案：** 重新執行權限授予語句

## 注意事項 (Notes)

- 新功能不會影響現有的print label流程
- 如果數據庫更新失敗，打印功能仍會正常執行
- 用戶ID必須是有效的整數（來自clock number）
- 所有數量計算都基於總托盤數量（quantity × count）
- 系統會自動驗證數據完整性，防止無效的外鍵引用 