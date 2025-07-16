# Pennine 線上庫存控制系統 - 資料庫結構簡化版

## 核心業務表格

### 1. 產品資料表格
#### `data_code` - 產品詳細資料庫
- **主要用途**：儲存所有產品的基本資訊
- **主鍵**：`code` (產品編號)
- **核心欄位**：
  - `code`: 產品SKU編號
  - `description`: 產品描述
  - `colour`: 產品顏色 (預設: Black)
  - `standard_qty`: 每棧板標準數量
  - `type`: 產品類型
  - `remark`: 產品規格說明

#### `data_supplier` - 材料供應商資料庫
- **主要用途**：管理供應商資訊
- **主鍵**：`supplier_code`
- **核心欄位**：
  - `supplier_code`: 供應商編號
  - `supplier_name`: 供應商名稱

### 2. 用戶管理表格
#### `data_id` - 用戶ID資料庫
- **主要用途**：員工帳戶管理
- **主鍵**：`id` (員工編號)
- **核心欄位**：
  - `id`: 員工編號
  - `name`: 員工姓名
  - `email`: 電子郵件
  - `department`: 部門
  - `position`: 職位 (預設: User)
  - `uuid`: 唯一識別碼

### 3. 棧板管理表格
#### `record_palletinfo` - 棧板參考資料庫
- **主要用途**：棧板資訊管理
- **主鍵**：`plt_num` (棧板編號)
- **核心欄位**：
  - `plt_num`: 棧板編號
  - `product_code`: 產品編號 (外鍵: data_code.code)
  - `generate_time`: 建立時間
  - `series`: 棧板系列
  - `product_qty`: 棧板數量
  - `plt_remark`: 棧板備註

### 4. 庫存管理表格
#### `record_inventory` - 庫存分類帳
- **主要用途**：追蹤庫存位置和數量
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號 (外鍵: data_code.code)
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `injection`: 注塑區庫存
  - `pipeline`: 管道區庫存
  - `prebook`: 預訂區庫存
  - `await`: 等待區庫存
  - `fold`: 摺疊區庫存
  - `bulk`: 散裝區庫存
  - `backcarpark`: 後院區庫存
  - `damage`: 損壞區庫存
  - `latest_update`: 最後更新時間

#### `stock_level` - 庫存分類帳
- **主要用途**：產品總庫存統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `stock`: 產品編號 (外鍵: data_code.code)
  - `description`: 產品描述
  - `stock_level`: 總庫存量
  - `update_time`: 更新時間

### 5. 物料接收表格
#### `record_grn` - 材料接收詳細資料
- **主要用途**：記錄物料入庫資訊
- **主鍵**：`uuid`
- **核心欄位**：
  - `grn_ref`: GRN參考編號
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `sup_code`: 供應商編號 (外鍵: data_supplier.supplier_code)
  - `material_code`: 產品編號 (外鍵: data_code.code)
  - `gross_weight`: 毛重
  - `net_weight`: 淨重
  - `pallet`: 棧板類型
  - `package`: 包裝類型
  - `pallet_count`: 棧板數量
  - `package_count`: 包裝數量
  - `creat_time`: 建立時間

#### `grn_level` - GRN接收資料庫
- **主要用途**：GRN統計資料
- **主鍵**：`uuid`
- **核心欄位**：
  - `grn_ref`: GRN參考編號
  - `total_gross`: 總毛重
  - `total_net`: 總淨重
  - `total_unit`: 總單位數
  - `latest_update`: 最後更新時間

### 6. 庫存轉移表格
#### `record_transfer` - 庫存轉移分類帳
- **主要用途**：記錄庫存位置變更
- **主鍵**：`uuid`
- **核心欄位**：
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `f_loc`: 起始位置
  - `t_loc`: 目標位置
  - `operator_id`: 操作員ID (外鍵: data_id.id)
  - `tran_date`: 轉移時間

### 7. 操作歷史表格
#### `record_history` - 操作歷史記錄
- **主要用途**：追蹤所有系統操作
- **主鍵**：`uuid`
- **核心欄位**：
  - `time`: 操作時間
  - `id`: 操作員ID (外鍵: data_id.id)
  - `action`: 操作類型
  - `plt_num`: 相關棧板 (外鍵: record_palletinfo.plt_num)
  - `loc`: 操作位置
  - `remark`: 操作備註

### 8. 訂單管理表格
#### `record_aco` - ACO訂單資料庫
- **主要用途**：管理ACO訂單
- **主鍵**：`uuid`
- **核心欄位**：
  - `order_ref`: 訂單參考編號
  - `code`: 產品編號 (外鍵: data_code.code)
  - `required_qty`: 需求數量
  - `finished_qty`: 完成數量
  - `latest_update`: 最後更新時間

#### `data_order` - 訂單資料庫
- **主要用途**：客戶訂單管理
- **主鍵**：`uuid`
- **核心欄位**：
  - `account_num`: 客戶帳號
  - `order_ref`: 訂單參考編號
  - `product_code`: 產品編號
  - `product_qty`: 訂單數量
  - `loaded_qty`: 已裝載數量
  - `delivery_add`: 交付地址

### 9. 庫存盤點表格
#### `record_stocktake` - 庫存盤點記錄
- **主要用途**：庫存盤點作業
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `remain_qty`: 剩餘數量
  - `counted_qty`: 盤點數量
  - `counted_id`: 盤點員ID (外鍵: data_id.id)
  - `counted_name`: 盤點員姓名

#### `stocktake_variance_analysis` - 庫存差異分析
- **主要用途**：分析盤點差異
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號
  - `system_qty`: 系統數量
  - `counted_qty`: 盤點數量
  - `variance_qty`: 差異數量
  - `variance_percentage`: 差異百分比
  - `approved_by`: 審核員 (外鍵: data_id.id)

### 10. 工作量統計表格
#### `work_level` - 工作量分類帳
- **主要用途**：員工工作量統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `id`: 員工ID (外鍵: data_id.id)
  - `qc`: 今日QC完成數量
  - `move`: 今日庫存轉移數量
  - `grn`: 今日GRN完成數量
  - `loading`: 今日裝載數量
  - `latest_update`: 最後更新時間

## 輔助功能表格

### 系統管理
- **`API`**: API設定資料
- **`feature_flags`**: 功能標誌管理
- **`mv_refresh_tracking`**: 物化視圖刷新追蹤

### 記錄與日誌
- **`query_record`**: 聊天記錄資料庫
- **`transaction_log`**: 事務日誌
- **`print_history`**: 列印歷史記錄
- **`report_log`**: 錯誤報告日誌
- **`debug_log`**: 除錯日誌

### 使用者行為分析
- **`user_navigation_history`**: 用戶導航歷史
- **`user_navigation_stats`**: 導航統計
- **`user_navigation_patterns`**: 導航模式分析

### 其他業務表格
- **`report_void`**: 損壞分類帳
- **`doc_upload`**: 文檔上傳記錄
- **`order_loading_history`**: 訂單裝載歷史
- **`pallet_number_buffer`**: 棧板編號緩衝區

## 主要外鍵關係

1. **產品關聯**：多個表格透過 `product_code` 關聯到 `data_code.code`
2. **棧板關聯**：多個表格透過 `plt_num` 關聯到 `record_palletinfo.plt_num`
3. **用戶關聯**：多個表格透過操作員ID關聯到 `data_id.id`
4. **供應商關聯**：GRN表格透過 `sup_code` 關聯到 `data_supplier.supplier_code`

此簡化版文檔聚焦於核心業務邏輯和重要資料關係，省略了詳細的技術規格，便於快速理解系統架構。