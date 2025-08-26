# 📚 RPC 函數庫索引

> 最後更新：2025-08-05

## 目錄

- [棧板管理](#棧板管理)
- [庫存管理](#庫存管理)
- [訂單處理](#訂單處理)
- [報表生成](#報表生成)
- [系統維護](#系統維護)

---

## 棧板管理

### 🔧 generate_atomic_pallet_numbers_v6

生成唯一的托盤編號和系列，使用預生成的緩衝池。

- **參數**：
  - `p_count` (integer) - 生成數量
  - `p_session_id` (text) - 會話ID（可選）
- **返回**：包含 pallet_number 和 series 的表格
- **格式**：
  - 托盤編號：DDMMYY/1-300
  - 系列：DDMMYY-XXXXXX

### 🔍 search_pallet_info

搜索棧板信息（支援棧板號或系列號）

- **參數**：
  - `p_search_type` (text) - 搜索類型
  - `p_search_value` (text) - 搜索值
- **返回**：匹配的棧板記錄及當前位置

### 🔍 search_pallet_optimized_v2

優化版棧板搜索功能（推薦使用）

- **參數**：
  - `p_search_type` (text) - 搜索類型（pallet/product/location）
  - `p_search_value` (text) - 搜索值
- **返回**：匹配的棧板記錄，支援更多搜索選項

### 📦 batch_search_pallets

批量搜索多個棧板

- **參數**：
  - `p_patterns` (text[]) - 棧板號碼數組
- **返回**：所有匹配的棧板記錄

### 🚛 rpc_transfer_pallet

原子性轉移棧板到新位置

- **參數**：
  - `p_pallet_num` (text) - 棧板號
  - `p_to_location` (text) - 目標位置
  - `p_user_id` (integer) - 用戶ID
  - `p_user_name` (text) - 用戶名
- **返回**：操作結果

### 🖨️ rpc_get_pallet_reprint_info

獲取棧板重印信息

- **參數**：
  - `p_pallet_num` (text) - 棧板號
- **返回**：棧板詳情及產品描述

---

## 庫存管理

### ❌ update_stock_level_void (V2)

作廢棧板時更新庫存水平

- **參數**：
  - `p_product_code` (text) - 產品代碼
  - `p_quantity` (bigint) - 作廢數量（必須為正數）
  - `p_operation` (text) - 操作類型（預設：'void'）
- **支援的操作類型**：
  - `void` - 一般作廢
  - `Print Extra` - 打印多餘標籤
  - `Wrong Label` - 錯誤標籤
  - `Wrong Quantity` - 錯誤數量
  - `Used Material` - 已使用材料
  - `Damaged` - 損壞
- **功能**：
  - 減少指定產品的庫存記錄
  - 插入新記錄而非更新（保持歷史）
  - 確保庫存不會變成負數
- **更新**：2025-08-02 - 支援新的 Void Reasons

### 🔄 refresh_pallet_location_mv

刷新棧板位置物化視圖

- **參數**：無
- **功能**：更新 pallet_location_mv 以反映最新的棧板位置信息
- **使用場景**：批量操作後或定期維護

---

## 訂單處理

### 📥 rpc_load_pallet_to_order

將棧板加載到訂單

- **參數**：
  - `p_order_ref` (text) - 訂單號
  - `p_pallet_input` (text) - 棧板輸入
  - `p_user_id` (integer) - 用戶ID（預設：0）
  - `p_user_name` (text) - 用戶名（預設：'System'）
- **返回**：操作結果和更新的訂單信息

### ↩️ rpc_undo_load_pallet

撤銷棧板加載

- **參數**：
  - `p_order_ref` (text) - 訂單號
  - `p_pallet_num` (text) - 棧板號
  - `p_product_code` (text) - 產品代碼
  - `p_quantity` (integer) - 數量
  - `p_user_id` (integer) - 用戶ID（預設：0）
  - `p_user_name` (text) - 用戶名（預設：'System'）

---

## 報表生成

### 📊 rpc_get_void_pallet_report_aggregation

生成作廢棧板報表

- **參數**：
  - `p_start_date` (text) - 開始日期
  - `p_end_date` (text) - 結束日期
  - `p_product_filter` (text) - 產品過濾（可選）
  - `p_reason_filter` (text) - 原因過濾（可選）
  - `p_limit` (integer) - 限制數量（預設：1000）
  - `p_offset` (integer) - 偏移量（預設：0）
- **返回**：匯總的作廢記錄

---

## 系統維護

### 🧹 api_cleanup_pallet_buffer

優化版棧板緩衝區清理（由 cron job 每 5 分鐘自動執行）

- **參數**：無
- **功能**：
  - 刪除非今日的所有記錄
  - 刪除已使用（`used = 'True'`）超過 4 小時的記錄
  - 刪除被鎖定（`used = 'Holded'`）超過 5 分鐘的記錄
  - **保留**所有未使用（`used = 'False'`）的當日記錄
- **Cron Job**：`cleanup-pallet-buffer` - 每 5 分鐘執行

### 🔄 reset_daily_pallet_buffer

重置每日棧板緩衝區（由 cron job 每日 UTC 00:00 自動執行）

- **參數**：無
- **功能**：
  - 清空 pallet_number_buffer 表
  - 重新生成 300 個棧板號碼
  - 格式：DDMMYY/1-300 (pallet_number), DDMMYY-XXXXXX (series)
- **Cron Job**：`reset-pallet-buffer-daily` - 每日 UTC 00:00 執行（英國冬令時午夜）

### 📊 get_pallet_buffer_status

獲取棧板緩衝區狀態

- **參數**：無
- **返回**：緩衝區當前狀態信息

### ✅ check_pallet_buffer_health

檢查棧板緩衝區健康狀態

- **參數**：無
- **返回**：健康狀態報告
  - `unused_count` - 可用數量
  - `used_count` - 已使用數量
  - `holded_count` - 被鎖定數量
  - `health_status` - healthy (≥100), warning (≥50), critical (<50)

### 🔄 auto_check_pallet_buffer_health

自動檢查並補充棧板號碼（由 cron job 每小時自動執行）

- **參數**：無
- **功能**：
  - 檢查當日可用的棧板號碼數量
  - 如果少於 50 個，自動**新增**號碼至 100 個
  - **不會重置**，只會延續現有序號繼續添加
  - 確保不會有重複的棧板號碼
- **Cron Job**：`check-pallet-buffer-health-hourly` - 每小時執行

---

## 使用示例

### 作廢棧板

```sql
-- 使用新的 Void Reason
SELECT update_stock_level_void('PROD001', 100, 'Wrong Label');

-- 損壞作廢
SELECT update_stock_level_void('PROD002', 50, 'Damaged');
```

### 搜索棧板

```sql
-- 按棧板號搜索
SELECT * FROM search_pallet_optimized_v2('pallet', 'P240102/001');

-- 按產品代碼搜索
SELECT * FROM search_pallet_optimized_v2('product', 'PROD001');
```

### 轉移棧板

```sql
SELECT rpc_transfer_pallet('P240102/001', 'Warehouse A', 123, 'John Doe');
```

---

## 自動化 Cron Jobs

### 棧板緩衝區管理

系統已配置以下自動化任務，確保棧板號碼供應穩定：

1. **`cleanup-pallet-buffer`** - 每 5 分鐘
   - 執行 `api_cleanup_pallet_buffer()`
   - 清理過期和已使用的棧板號碼

2. **`reset-pallet-buffer-daily`** - 每日 UTC 00:00
   - 執行 `reset_daily_pallet_buffer()`
   - 重置並生成當日 300 個新棧板號碼

3. **`check-pallet-buffer-health-hourly`** - 每小時
   - 執行 `auto_check_pallet_buffer_health()`
   - 檢查並補充棧板號碼至 100 個

---

## 注意事項

1. 所有 RPC 函數都使用 `SECURITY DEFINER`，確保適當的權限控制
2. 大部分函數包含錯誤處理，會返回錯誤信息而非拋出異常
3. 涉及多表操作的函數通常使用事務確保數據一致性
4. 棧板緩衝區管理已完全自動化，無需手動維護
