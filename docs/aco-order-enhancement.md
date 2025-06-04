# ACO Order Enhancement Documentation

## 概述 (Overview)

本文檔說明了對PRINT QC LABEL下ACO事件的增強功能。在處理ACO訂單時，除了原有的功能外，還會自動執行兩個新的動作。

This document describes the enhancements to ACO events under PRINT QC LABEL functionality. When processing ACO orders, in addition to the original functionality, two new actions are automatically executed.

## 新增功能 (New Features)

### 動作一：更新 latest_update 欄位 (Action 1: Update latest_update Field)

**目標：** 更新 `record_aco` 表時，同時更新 `latest_update` 欄位

**邏輯：**
- 當更新 ACO 訂單的 `remain_qty` 時
- 自動將 `latest_update` 欄位設置為當前時間
- 確保訂單的最後更新時間準確記錄

**Target:** Update the `latest_update` field when updating the `record_aco` table

**Logic:**
- When updating the `remain_qty` of an ACO order
- Automatically set the `latest_update` field to the current time
- Ensure accurate recording of the order's last update time

### 動作二：檢查訂單完成並發送郵件 (Action 2: Check Order Completion and Send Email)

**目標：** 檢查整張訂單是否完成，如果完成則發送郵件通知

**邏輯：**
1. 更新 `record_aco` 表後
2. 以 `order_ref` 搜尋該訂單的所有記錄
3. 檢查所有 `remain_qty` 是否全數等於 0
4. 如果是，表示整張訂單已完成
5. 利用 Supabase Edge Function 發送郵件通知

**郵件詳情：**
- From: `orders@pennine.cc`
- To: `alyon@pennineindustries.com`
- CC: `akwan@pennineindustries.com`, `gtatlock@pennineindustries.com`, `grobinson@pennineindustries.com`
- Subject: `ACO Order Completed`
- 內容: `ACO order has been completed. Reference Number: [order_ref]`

**Target:** Check if the entire order is completed, and send email notification if so

**Logic:**
1. After updating the `record_aco` table
2. Search for all records of the order using `order_ref`
3. Check if all `remain_qty` values equal 0
4. If yes, the entire order is completed
5. Use Supabase Edge Function to send email notification

**Email Details:**
- From: `orders@pennine.cc`
- To: `alyon@pennineindustries.com`
- CC: `akwan@pennineindustries.com`, `gtatlock@pennineindustries.com`, `grobinson@pennineindustries.com`
- Subject: `ACO Order Completed`
- Content: `ACO order has been completed. Reference Number: [order_ref]`

## 技術實現 (Technical Implementation)

### 數據庫函數 (Database Functions)

創建了三個新的 PostgreSQL RPC 函數：

1. **`update_aco_order_with_completion_check(p_order_ref, p_product_code, p_quantity_used)`**
   - 更新 ACO 訂單的 `remain_qty` 和 `latest_update`
   - 檢查整張訂單是否完成
   - 返回詳細的更新結果和完成狀態

2. **`check_aco_order_completion(p_order_ref)`**
   - 獨立檢查指定訂單的完成狀態
   - 返回訂單詳情和完成狀態

3. **`get_completed_aco_orders()`**
   - 獲取所有已完成的 ACO 訂單列表
   - 包含完成日期和產品數量信息

### Supabase Edge Function

**路徑：** `supabase/functions/send-aco-completion-email/index.ts`

**功能：**
- 接收訂單完成通知請求
- 使用 Resend API 發送格式化的 HTML 郵件
- 包含訂單參考號和完成時間
- 支持自定義發件人和收件人地址

**請求格式：**
```json
{
  "orderRef": 12345,
  "from": "orders@pennine.cc",
  "to": "akwan@pennineindustries.com"
}
```

### API 端點 (API Endpoints)

**路徑：** `/api/aco-order-updates`

**POST 方法：** 更新 ACO 訂單並檢查完成狀態
```json
{
  "orderRef": 12345,
  "productCode": "PRODUCT001",
  "quantityUsed": 50
}
```

**GET 方法：** 檢查訂單完成狀態
```
GET /api/aco-order-updates?orderRef=12345
```

### 前端集成 (Frontend Integration)

在 `useQcLabelBusiness.tsx` 中，在成功處理 PDF 後：

1. 首先執行原有的 stock_level 和 work_level 更新
2. 然後執行 ACO 訂單增強處理
3. 如果訂單完成，顯示特殊的成功通知
4. 如果郵件發送失敗，顯示警告但不影響主流程

## 工作流程 (Workflow)

### ACO 訂單處理流程：

```
用戶完成 QC Label 打印
    ↓
執行原有的數據庫操作
    ↓
更新 stock_level 和 work_level
    ↓
調用 ACO 訂單增強 API
    ↓
更新 record_aco (remain_qty + latest_update)
    ↓
檢查訂單是否完成 (所有 remain_qty = 0)
    ↓
如果完成 → 調用 Edge Function 發送郵件
    ↓
返回結果並顯示適當的用戶通知
```

## 用戶體驗 (User Experience)

### 通知類型：

1. **訂單更新但未完成：**
   ```
   "ACO Order 12345 updated. Remaining quantity: 150"
   ```

2. **訂單完成（郵件成功）：**
   ```
   "🎉 ACO Order 12345 has been completed! Email notification sent."
   ```

3. **訂單完成（郵件失敗）：**
   ```
   "🎉 ACO Order 12345 has been completed!"
   "Order completed but email notification failed."
   ```

4. **處理失敗：**
   ```
   "Print successful, but ACO order update failed: [error message]"
   ```

## 錯誤處理 (Error Handling)

### 數據庫層：
- 驗證訂單和產品存在性
- 事務性操作確保數據一致性
- 詳細的錯誤訊息返回

### API 層：
- 參數驗證和類型檢查
- 統一的錯誤響應格式
- 郵件服務錯誤處理

### 前端層：
- 不影響原有打印功能
- 分層錯誤處理和用戶通知
- 詳細的控制台日誌

## 測試 (Testing)

### 數據庫測試：
```sql
-- 執行 ACO 增強功能測試
\i scripts/test-aco-enhancement.sql
```

### 功能測試場景：
1. 更新 ACO 訂單但未完成
2. 完成 ACO 訂單並發送郵件
3. 郵件服務失敗處理
4. 無效訂單處理
5. 數據完整性驗證

## 部署步驟 (Deployment Steps)

1. **創建數據庫函數：**
   ```sql
   \i scripts/aco-order-enhancement-rpc.sql
   ```

2. **部署 Edge Function：**
   ```bash
   supabase functions deploy send-aco-completion-email
   ```

3. **設置環境變數：**
   - `RESEND_API_KEY`: Resend 郵件服務 API 密鑰

4. **測試功能：**
   ```sql
   \i scripts/test-aco-enhancement.sql
   ```

5. **部署前端代碼更新**

## 配置要求 (Configuration Requirements)

### Supabase 設置：
- Edge Functions 已啟用
- 適當的 RLS 政策
- 函數執行權限

### 郵件服務：
- Resend API 帳戶和 API 密鑰
- 發件人域名驗證 (`pennine.cc`)
- 收件人郵箱有效性

### 環境變數：
```env
RESEND_API_KEY=your_resend_api_key_here
```

## 監控和日誌 (Monitoring and Logging)

### 關鍵指標：
- ACO 訂單完成率
- 郵件發送成功率
- API 響應時間
- 錯誤發生頻率

### 日誌位置：
- 前端：瀏覽器控制台
- API：Next.js 服務器日誌
- Edge Function：Supabase 函數日誌
- 數據庫：PostgreSQL 日誌

## 注意事項 (Important Notes)

1. **向後兼容：** 所有新功能都不會影響現有的 ACO 處理流程
2. **容錯設計：** 如果增強功能失敗，原有功能仍正常運作
3. **郵件依賴：** 郵件功能依賴外部服務，需要適當的錯誤處理
4. **性能考慮：** 增強功能在後台執行，不影響用戶體驗
5. **數據完整性：** 使用事務確保數據一致性 