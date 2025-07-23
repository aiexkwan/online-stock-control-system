# Pennine 線上庫存控制系統 - 資料庫結構完整版

> 📅 最後更新：2025-07-23  
> 📊 總表格數量：76個  
> 🔍 覆蓋 Schema：public, auth, storage, realtime, vault, supabase_migrations

## 1. 核心業務表格 (Public Schema)

### 1.1 產品資料表格

#### `data_code` - 產品詳細資料庫
- **主要用途**：儲存所有產品的基本資訊
- **主鍵**：`code` (產品編號)
- **核心欄位**：
  - `code`: 產品SKU編號 (主鍵)
  - `description`: 產品描述
  - `colour`: 產品顏色 (預設: Black)
  - `standard_qty`: 每棧板標準數量 (預設: 1)
  - `type`: 產品類型 (預設: '-')
  - `remark`: 產品規格說明
- **關聯表格**：被多個表格外鍵參照 (record_grn, record_palletinfo, stock_level, record_aco, record_slate, record_inventory)

#### `data_slateinfo` - 磚板詳細資料庫
- **主要用途**：儲存磚板產品的詳細規格
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品SKU
  - `description`: 產品描述
  - `tool_num`: 工具編號
  - `weight`: 重量
  - `thickness_top`/`thickness_bottom`: 頂部/底部厚度
  - `length`/`width`: 長度/寬度
  - `hole_to_bottom`: 底部孔距
  - `colour`/`shapes`: 顏色/形狀

#### `data_supplier` - 材料供應商資料庫
- **主要用途**：管理供應商資訊
- **主鍵**：`supplier_code`
- **核心欄位**：
  - `supplier_code`: 供應商編號 (主鍵)
  - `supplier_name`: 供應商名稱

### 1.2 用戶管理表格

#### `data_id` - 用戶ID資料庫
- **主要用途**：員工帳戶管理
- **主鍵**：`id` (員工編號)
- **核心欄位**：
  - `id`: 員工編號 (主鍵)
  - `name`: 員工姓名
  - `email`: 電子郵件 (預設: '')
  - `department`: 部門
  - `position`: 職位 (預設: User)
  - `uuid`: 唯一識別碼
  - `icon_url`: 頭像URL

### 1.3 棧板管理表格

#### `record_palletinfo` - 棧板參考資料庫
- **主要用途**：棧板資訊管理
- **主鍵**：`plt_num` (棧板編號)
- **核心欄位**：
  - `plt_num`: 棧板編號 (主鍵，唯一)
  - `product_code`: 產品編號 (外鍵: data_code.code)
  - `generate_time`: 建立時間 (預設: now())
  - `series`: 棧板系列
  - `product_qty`: 棧板數量 (預設: 0)
  - `plt_remark`: 棧板備註 (預設: '')
  - `pdf_url`: PDF文件URL

#### `pallet_number_buffer` - 棧板編號緩衝區
- **主要用途**：棧板編號預分配管理
- **主鍵**：`id`
- **核心欄位**：
  - `pallet_number`: 棧板編號 (唯一)
  - `series`: 棧板系列 (唯一)
  - `date_str`: 日期字串
  - `used`: 使用狀態 (False/Holded/True)
  - `updated_at`: 更新時間

#### `pallet_number_buffer_backup` - 棧板編號緩衝區備份
- **主要用途**：棧板編號分配歷史備份
- **核心欄位**：
  - `pallet_number`: 棧板編號
  - `date_str`: 日期字串
  - `allocated_at`: 分配時間
  - `used`: 是否已使用
  - `used_at`: 使用時間
  - `session_id`: 會話ID

### 1.4 庫存管理表格

#### `record_inventory` - 庫存分類帳
- **主要用途**：追蹤庫存位置和數量
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號 (外鍵: data_code.code)
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - **庫存位置欄位** (預設: 0)：
    - `injection`: 注塑區庫存
    - `pipeline`: 管道區庫存
    - `prebook`: 預訂區庫存
    - `await`: 等待區庫存
    - `fold`: 摺疊區庫存
    - `bulk`: 散裝區庫存
    - `backcarpark`: 後院區庫存
    - `damage`: 損壞區庫存
    - `await_grn`: 等待GRN區庫存
  - `latest_update`: 最後更新時間 (預設: now())

#### `stock_level` - 庫存分類帳
- **主要用途**：產品總庫存統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `stock`: 產品編號 (外鍵: data_code.code)
  - `description`: 產品描述
  - `stock_level`: 總庫存量
  - `update_time`: 更新時間 (預設: now())

### 1.5 物料接收表格

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
  - `pallet_count`: 棧板數量 (預設: 0.0)
  - `package_count`: 包裝數量 (預設: 0.0)
  - `creat_time`: 建立時間 (預設: now())

#### `grn_level` - GRN接收資料庫
- **主要用途**：GRN統計資料
- **主鍵**：`uuid`
- **核心欄位**：
  - `grn_ref`: GRN參考編號
  - `total_gross`: 總毛重 (預設: 0)
  - `total_net`: 總淨重 (預設: 0)
  - `total_unit`: 總單位數 (預設: 0)
  - `latest_update`: 最後更新時間 (預設: now())

### 1.6 庫存轉移表格

#### `record_transfer` - 庫存轉移分類帳
- **主要用途**：記錄庫存位置變更
- **主鍵**：`uuid`
- **核心欄位**：
  - `tran_date`: 轉移時間 (預設: now())
  - `f_loc`: 起始位置
  - `t_loc`: 目標位置
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `operator_id`: 操作員ID (外鍵: data_id.id)

### 1.7 操作歷史表格

#### `record_history` - 操作歷史記錄
- **主要用途**：追蹤所有系統操作
- **主鍵**：`uuid`
- **核心欄位**：
  - `time`: 操作時間 (預設: now())
  - `id`: 操作員ID (外鍵: data_id.id, 可空)
  - `action`: 操作類型
  - `plt_num`: 相關棧板 (外鍵: record_palletinfo.plt_num, 可空)
  - `loc`: 操作位置 (可空)
  - `remark`: 操作備註

### 1.8 訂單管理表格

#### `record_aco` - ACO訂單資料庫
- **主要用途**：管理ACO訂單
- **主鍵**：`uuid`
- **核心欄位**：
  - `order_ref`: 訂單參考編號
  - `code`: 產品編號 (外鍵: data_code.code)
  - `required_qty`: 需求數量
  - `finished_qty`: 完成數量 (預設: 0，通過 QC 列印產生的數量)
  - `latest_update`: 最後更新時間 (預設: now())

#### `record_aco_detail` - ACO訂單詳細資料
- **主要用途**：ACO訂單的詳細產品規格
- **主鍵**：`plt_num`
- **核心欄位**：
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `weight`: 重量
  - `length`/`width`/`height`: 長寬高尺寸
  - `created_at`: 建立時間 (預設: now())

#### `data_order` - 訂單資料庫
- **主要用途**：客戶訂單管理
- **主鍵**：`uuid`
- **核心欄位**：
  - `account_num`: 客戶帳號 (預設: '-')
  - `order_ref`: 訂單參考編號 (預設: '-')
  - `invoice_to`: 發票地址 (預設: '-')
  - `delivery_add`: 交付地址 (預設: '-')
  - `product_code`: 產品編號
  - `product_desc`: 產品描述
  - `product_qty`: 訂單數量
  - `unit_price`: 單價 (預設: '-')
  - `uploaded_by`: 上傳者
  - `loaded_qty`: 已裝載數量 (預設: '0')
  - `token`: 使用的token (預設: 0)
  - `weight`: 重量
  - `customer_ref`: 客戶參考編號
  - `created_at`: 建立時間 (預設: now())

#### `order_loading_history` - 訂單裝載歷史
- **主要用途**：記錄訂單裝載操作歷史
- **主鍵**：`uuid`
- **核心欄位**：
  - `order_ref`: 訂單參考編號
  - `pallet_num`: 棧板編號
  - `product_code`: 產品編號
  - `quantity`: 數量
  - `action_type`: 操作類型
  - `action_by`: 操作員
  - `action_time`: 操作時間 (預設: now())
  - `remark`: 備註

### 1.9 庫存盤點表格

#### `record_stocktake` - 庫存盤點記錄
- **主要用途**：庫存盤點作業
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num, 可空)
  - `product_desc`: 產品描述
  - `remain_qty`: 剩餘數量
  - `counted_qty`: 盤點數量 (預設: 0)
  - `counted_id`: 盤點員ID (外鍵: data_id.id, 可空)
  - `counted_name`: 盤點員姓名 (可空)
  - `created_at`: 建立時間 (預設: now())

#### `stocktake_batch_scan` - 庫存盤點批量掃描
- **主要用途**：批量盤點掃描記錄
- **主鍵**：`uuid`
- **核心欄位**：
  - `batch_id`: 批次ID
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num, 可空)
  - `product_code`: 產品編號
  - `product_desc`: 產品描述 (可空)
  - `counted_qty`: 盤點數量 (預設: 0)
  - `scan_timestamp`: 掃描時間戳 (預設: now())
  - `status`: 狀態 (success/error/pending, 可空)
  - `error_message`: 錯誤訊息 (可空)
  - `user_id`: 用戶ID (外鍵: data_id.id, 可空)
  - `user_name`: 用戶名稱 (可空)
  - `created_at`: 建立時間 (預設: now())

#### `stocktake_session` - 庫存盤點會話
- **主要用途**：管理盤點會話
- **主鍵**：`uuid`
- **核心欄位**：
  - `session_date`: 會話日期 (預設: CURRENT_DATE)
  - `start_time`: 開始時間 (預設: now())
  - `end_time`: 結束時間 (可空)
  - `user_id`: 用戶ID (外鍵: data_id.id, 可空)
  - `user_name`: 用戶名稱 (可空)
  - `total_scans`: 總掃描數 (預設: 0)
  - `success_scans`: 成功掃描數 (預設: 0)
  - `error_scans`: 錯誤掃描數 (預設: 0)
  - `session_status`: 會話狀態 (active/completed/cancelled, 預設: active)
  - `created_at`: 建立時間 (預設: now())

#### `stocktake_variance_analysis` - 庫存差異分析
- **主要用途**：分析盤點差異
- **主鍵**：`uuid`
- **核心欄位**：
  - `analysis_date`: 分析日期 (預設: CURRENT_DATE)
  - `product_code`: 產品編號
  - `product_desc`: 產品描述 (可空)
  - `system_qty`: 系統數量
  - `counted_qty`: 盤點數量
  - `variance_qty`: 差異數量
  - `variance_percentage`: 差異百分比
  - `variance_value`: 差異價值
  - `variance_reason`: 差異原因 (可空)
  - `approved_by`: 審核員 (外鍵: data_id.id, 可空)
  - `approved_at`: 審核時間 (可空)
  - `created_at`: 建立時間 (預設: now())

#### `stocktake_validation_rules` - 庫存盤點驗證規則
- **主要用途**：設定盤點驗證規則
- **主鍵**：`uuid`
- **核心欄位**：
  - `rule_name`: 規則名稱 (唯一)
  - `rule_type`: 規則類型 (quantity/percentage/value, 可空)
  - `min_value`/`max_value`: 最小/最大值
  - `warning_threshold`: 警告閾值
  - `error_threshold`: 錯誤閾值
  - `require_approval`: 需要審核 (預設: false)
  - `is_active`: 是否啟用 (預設: true)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

#### `stocktake_report_cache` - 庫存盤點報告快取
- **主要用途**：快取盤點報告數據
- **主鍵**：`uuid`
- **核心欄位**：
  - `report_date`: 報告日期
  - `report_type`: 報告類型 (daily/weekly/monthly, 可空)
  - `cache_data`: 快取數據 (JSONB)
  - `generated_at`: 生成時間 (預設: now())
  - `expires_at`: 過期時間 (可空)

#### `stocktake_daily_summary` - 庫存盤點日摘要
- **主要用途**：每日盤點摘要統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `count_date`: 盤點日期
  - `product_code`: 產品編號
  - `product_desc`: 產品描述 (可空)
  - `pallet_count`: 棧板數量
  - `total_counted`: 總盤點數量
  - `final_remain_qty`: 最終剩餘數量
  - `last_count_time`: 最後盤點時間 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

#### `stocktake_batch_summary` - 庫存盤點批次摘要
- **主要用途**：批次盤點摘要統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `batch_time`: 批次時間
  - `counted_id`: 盤點員ID (可空)
  - `counted_name`: 盤點員名稱 (可空)
  - `scan_count`: 掃描次數
  - `product_count`: 產品數量
  - `total_counted`: 總盤點數量
  - `start_time`/`end_time`: 開始/結束時間 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

#### `stocktake_variance_report` - 庫存差異報告
- **主要用途**：庫存差異報告統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `product_code`: 產品編號
  - `product_desc`: 產品描述 (可空)
  - `count_date`: 盤點日期
  - `system_stock`: 系統庫存
  - `counted_stock`: 盤點庫存
  - `variance`: 差異數量
  - `variance_percentage`: 差異百分比
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

### 1.10 工作量統計表格

#### `work_level` - 工作量分類帳
- **主要用途**：員工工作量統計
- **主鍵**：`uuid`
- **核心欄位**：
  - `id`: 員工ID (外鍵: data_id.id)
  - `qc`: 今日QC完成數量 (預設: 0)
  - `move`: 今日庫存轉移數量 (預設: 0)
  - `grn`: 今日GRN完成數量
  - `loading`: 今日裝載數量 (預設: 0)
  - `latest_update`: 最後更新時間 (預設: now())

### 1.11 磚板生產表格

#### `record_slate` - 磚板生產記錄
- **主要用途**：記錄磚板生產過程
- **主鍵**：`uuid`
- **核心欄位**：
  - `code`: 產品編號 (外鍵: data_code.code)
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `setter`: 設定員
  - `mach_num`: 機器編號
  - `material`: 材料
  - `batch_num`: 批次編號
  - `weight`: 重量
  - `t_thick`/`b_thick`: 頂部/底部厚度
  - `length`/`width`: 長度/寬度
  - `centre_hole`: 中心孔位
  - `colour`/`shape`: 顏色/形狀
  - `flame_test`: 燃燒測試結果
  - `remark`: 備註 (可空)
  - `first_off`: 首檢日期 (可空)

### 1.12 系統管理表格

#### `API` - API設定資料
- **主要用途**：儲存API配置資訊
- **主鍵**：`uuid`
- **核心欄位**：
  - `name`: API名稱
  - `value`: API值
  - `description`: 描述 (可空)

#### `feature_flags` - 功能標誌管理
- **主要用途**：功能開關管理
- **主鍵**：`id`
- **核心欄位**：
  - `key`: 功能鍵值 (唯一)
  - `name`: 功能名稱
  - `description`: 描述 (可空)
  - `type`: 類型 (boolean/percentage/variant/release, 預設: boolean)
  - `status`: 狀態 (enabled/disabled/partial, 預設: disabled)
  - `default_value`: 預設值 (預設: false)
  - `rules`: 規則配置 (預設: [])
  - `variants`: 變體配置 (預設: [])
  - `rollout_percentage`: 推出百分比 (0-100, 可空)
  - `start_date`/`end_date`: 開始/結束日期 (可空)
  - `tags`: 標籤 (預設: {})
  - `metadata`: 元數據 (預設: {})
  - `created_by`/`updated_by`: 建立者/更新者 (外鍵: auth.users.id, 可空)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

#### `feature_flags_audit` - 功能標誌審計日誌
- **主要用途**：功能標誌操作審計
- **主鍵**：`id`
- **核心欄位**：
  - `flag_id`: 標誌ID (外鍵: feature_flags.id, 可空)
  - `flag_key`: 標誌鍵值
  - `action`: 操作類型 (created/updated/deleted/evaluated)
  - `old_value`/`new_value`: 舊值/新值 (JSONB, 可空)
  - `context`: 操作上下文 (JSONB, 可空)
  - `user_id`: 用戶ID (外鍵: auth.users.id, 可空)
  - `created_at`: 建立時間 (預設: now())

#### `feature_flags_stats` - 功能標誌統計
- **主要用途**：功能標誌使用統計
- **主鍵**：`id`
- **核心欄位**：
  - `flag_key`: 標誌鍵值
  - `date`: 統計日期
  - `hour`: 統計小時 (0-23)
  - `evaluations`: 評估次數 (預設: 0)
  - `enabled_count`/`disabled_count`: 啟用/禁用次數 (預設: 0)
  - `variant_distribution`: 變體分佈 (預設: {})
  - `unique_users`: 唯一用戶數 (預設: 0)
  - `created_at`: 建立時間 (預設: now())

#### `mv_refresh_tracking` - 物化視圖刷新追蹤
- **主要用途**：追蹤物化視圖刷新狀態
- **主鍵**：`mv_name`
- **核心欄位**：
  - `mv_name`: 物化視圖名稱 (主鍵)
  - `needs_refresh`: 需要刷新 (預設: false)
  - `last_refresh`: 最後刷新時間 (預設: CURRENT_TIMESTAMP)

### 1.13 記錄與日誌表格

#### `query_record` - 聊天記錄資料庫
- **主要用途**：儲存AI聊天記錄
- **主鍵**：`uuid`
- **核心欄位**：
  - `created_at`: 建立時間 (預設: now())
  - `query`: 用戶問題
  - `answer`: GPT回答
  - `user`: 用戶名稱
  - `token`: 使用的token數
  - `sql_query`: SQL查詢語句 (預設: '-')
  - `result_json`: 結果JSON (可空)
  - `query_hash`: 查詢雜湊 (可空)
  - `execution_time`: 執行時間 (可空)
  - `row_count`: 結果行數 (可空)
  - `complexity`: 複雜度 (可空)
  - `session_id`: 會話ID (可空)
  - `fuzzy_hash`: 模糊雜湊 (可空)
  - `expired_at`: 過期時間 (可空)
  - `expired_reason`: 過期原因 (可空)

#### `transaction_log` - 事務日誌
- **主要用途**：記錄所有模組的事務操作，支援回滾和審計追蹤
- **主鍵**：`id` (自增)
- **核心欄位**：
  - `transaction_id`: 事務唯一標識符
  - `source_module`: 事務來源模組 (grn_label, qc_label, inventory_transfer等)
  - `source_page`: 來源頁面
  - `source_action`: 來源操作
  - `operation_type`: 操作類型
  - `step_name`: 步驟名稱 (可空)
  - `step_sequence`: 步驟順序 (可空)
  - `user_id`: 用戶ID
  - `user_clock_number`: 用戶時鐘編號 (可空)
  - `session_id`: 會話ID (可空)
  - `status`: 事務狀態 (pending/in_progress/completed/failed/rolled_back, 預設: pending)
  - `pre_state`/`post_state`: 前/後狀態 (JSONB, 可空)
  - `affected_records`: 受影響記錄 (JSONB, 可空)
  - `error_code`/`error_message`: 錯誤代碼/訊息 (可空)
  - `error_details`: 錯誤詳情 (JSONB, 可空)
  - `error_stack`: 錯誤堆疊 (可空)
  - `rollback_attempted`: 嘗試回滾 (預設: false)
  - `rollback_successful`: 回滾成功 (可空)
  - `rollback_timestamp`: 回滾時間戳 (可空)
  - `rollback_by`: 回滾執行者 (可空)
  - `rollback_reason`: 回滾原因 (可空)
  - `compensation_required`: 需要補償 (預設: false)
  - `compensation_actions`: 補償操作 (JSONB, 可空)
  - `parent_transaction_id`: 父事務ID (可空)
  - `related_transactions`: 相關事務 (UUID數組, 可空)
  - `report_log_id`: 關聯到report_log表的UUID (外鍵: report_log.uuid, 可空)
  - `metadata`: 元數據 (JSONB, 可空)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())
  - `completed_at`: 完成時間 (可空)

#### `report_log` - 錯誤報告日誌
- **主要用途**：記錄系統錯誤報告
- **主鍵**：`uuid`
- **核心欄位**：
  - `error`: 錯誤類型
  - `error_info`: 錯誤資訊
  - `state`: 處理狀態 (預設: false)
  - `user_id`: 用戶ID (外鍵: data_id.id)
  - `time`: 發生時間 (預設: now())

#### `debug_log` - 除錯日誌
- **主要用途**：系統除錯記錄
- **主鍵**：`UUID`
- **核心欄位**：
  - `ts`: 時間戳 (預設: now())
  - `msg`: 除錯訊息

#### `print_history` - 列印歷史記錄
- **主要用途**：儲存所有列印工作的歷史，用於審計和重新列印
- **主鍵**：`id`
- **核心欄位**：
  - `job_id`: 列印工作唯一標識符
  - `type`: 列印文檔類型
  - `data`: 列印數據 (JSONB, 可空)
  - `options`: 列印選項 (JSONB, 可空)
  - `metadata`: 附加元數據 (JSONB, 可空)
  - `result`: 列印工作結果 (JSONB, 可空)
  - `created_at`: 建立時間 (預設: CURRENT_TIMESTAMP)

### 1.14 其他業務表格

#### `report_void` - 損壞分類帳
- **主要用途**：記錄損壞物品
- **主鍵**：`uuid`
- **核心欄位**：
  - `time`: 記錄時間 (預設: now())
  - `plt_num`: 棧板編號 (外鍵: record_palletinfo.plt_num)
  - `reason`: 損壞原因
  - `damage_qty`: 損壞數量

#### `doc_upload` - 文檔上傳記錄
- **主要用途**：記錄文檔上傳資訊
- **主鍵**：`uuid`
- **核心欄位**：
  - `doc_name`: 文檔名稱
  - `upload_by`: 上傳者ID
  - `doc_type`: 文檔類型 (可空)
  - `doc_url`: 文檔URL (可空)
  - `file_size`: 檔案大小 (可空)
  - `folder`: 資料夾 (可空)
  - `json_txt`: JSON文字內容 (可空)
  - `created_at`: 建立時間 (預設: CURRENT_TIMESTAMP)

#### `user_navigation_history` - 用戶導航歷史
- **主要用途**：追蹤用戶導航行為
- **主鍵**：`id`
- **核心欄位**：
  - `user_id`: 用戶ID
  - `path`: 訪問路徑
  - `visited_at`: 訪問時間 (預設: now())
  - `session_id`: 會話ID (可空)
  - `device_type`: 設備類型 (可空)
  - `created_at`: 建立時間 (預設: now())

#### `user_navigation_stats` - 用戶導航統計
- **主要用途**：用戶導航統計分析
- **複合主鍵**：`user_id`, `path`
- **核心欄位**：
  - `user_id`: 用戶ID (主鍵)
  - `path`: 路徑 (主鍵)
  - `visit_count`: 訪問次數 (預設: 1)
  - `last_visited`: 最後訪問時間 (預設: now())
  - `first_visited`: 首次訪問時間 (預設: now())
  - `avg_time_spent`: 平均停留時間 (預設: 0)

#### `user_navigation_patterns` - 用戶導航模式
- **主要用途**：分析用戶導航轉換模式
- **複合主鍵**：`user_id`, `from_path`, `to_path`
- **核心欄位**：
  - `user_id`: 用戶ID (主鍵)
  - `from_path`: 來源路徑 (主鍵)
  - `to_path`: 目標路徑 (主鍵)
  - `transition_count`: 轉換次數 (預設: 1)
  - `last_transition`: 最後轉換時間 (預設: now())

#### `monitoring_tech_debt` - 技術債務監控數據表
- **主要用途**：監控技術債務相關指標
- **主鍵**：`id` (自增)
- **核心欄位**：
  - `timestamp`: 數據收集時間
  - `source`: 數據來源 (manual/ci/scheduled)
  - `metrics`: JSON格式的監控指標數據 (JSONB)
  - `created_at`: 建立時間 (預設: now())

## 2. 認證系統表格 (Auth Schema)

### 2.1 用戶管理

#### `auth.users` - 用戶資料表
- **主要用途**：儲存用戶登入資料，安全 schema
- **主鍵**：`id`
- **核心欄位**：
  - `instance_id`: 實例ID (可空)
  - `id`: 用戶UUID (主鍵)
  - `aud`: 受眾 (可空)
  - `role`: 角色 (可空)
  - `email`: 電子郵件 (可空)
  - `encrypted_password`: 加密密碼 (可空)
  - `email_confirmed_at`: 郵件確認時間 (可空)
  - `invited_at`: 邀請時間 (可空)
  - `confirmation_token`: 確認令牌 (可空)
  - `confirmation_sent_at`: 確認發送時間 (可空)
  - `recovery_token`: 恢復令牌 (可空)
  - `recovery_sent_at`: 恢復發送時間 (可空)
  - `email_change_token_new`: 新郵件變更令牌 (可空)
  - `email_change`: 郵件變更 (可空)
  - `email_change_sent_at`: 郵件變更發送時間 (可空)
  - `last_sign_in_at`: 最後登入時間 (可空)
  - `raw_app_meta_data`: 應用元數據 (JSONB, 可空)
  - `raw_user_meta_data`: 用戶元數據 (JSONB, 可空)
  - `is_super_admin`: 是否超級管理員 (可空)
  - `phone`: 電話號碼 (可空, 唯一)
  - `phone_confirmed_at`: 電話確認時間 (可空)
  - `phone_change`: 電話變更 (可空)
  - `phone_change_token`: 電話變更令牌 (可空)
  - `phone_change_sent_at`: 電話變更發送時間 (可空)
  - `confirmed_at`: 確認時間 (生成欄位)
  - `email_change_token_current`: 當前郵件變更令牌 (可空)
  - `email_change_confirm_status`: 郵件變更確認狀態 (0-2)
  - `banned_until`: 禁用至 (可空)
  - `reauthentication_token`: 重新認證令牌 (可空)
  - `reauthentication_sent_at`: 重新認證發送時間 (可空)
  - `is_sso_user`: 是否SSO用戶 (預設: false)
  - `deleted_at`: 刪除時間 (可空)
  - `is_anonymous`: 是否匿名用戶 (預設: false)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

### 2.2 會話管理

#### `auth.sessions` - 會話資料表
- **主要用途**：儲存與用戶相關的會話資料
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 會話UUID (主鍵)
  - `user_id`: 用戶ID (外鍵: auth.users.id)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)
  - `factor_id`: 因子ID (可空)
  - `aal`: 認證保證等級 (aal1/aal2/aal3, 可空)
  - `not_after`: 失效時間 (可空)
  - `refreshed_at`: 刷新時間 (可空)
  - `user_agent`: 用戶代理 (可空)
  - `ip`: IP地址 (可空)
  - `tag`: 標籤 (可空)

#### `auth.refresh_tokens` - 刷新令牌表
- **主要用途**：儲存用於刷新JWT令牌的令牌
- **主鍵**：`id` (自增)
- **核心欄位**：
  - `instance_id`: 實例ID (可空)
  - `id`: 令牌ID (主鍵)
  - `token`: 令牌 (可空, 唯一)
  - `user_id`: 用戶ID (可空)
  - `revoked`: 是否撤銷 (可空)
  - `parent`: 父令牌 (可空)
  - `session_id`: 會話ID (外鍵: auth.sessions.id, 可空)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

### 2.3 身份管理

#### `auth.identities` - 身份資料表
- **主要用途**：儲存與用戶相關的身份
- **主鍵**：`id`
- **核心欄位**：
  - `provider_id`: 提供者ID (主鍵)
  - `user_id`: 用戶ID (外鍵: auth.users.id, 主鍵)
  - `identity_data`: 身份資料 (JSONB)
  - `provider`: 提供者 (主鍵)
  - `last_sign_in_at`: 最後登入時間 (可空)
  - `email`: 電子郵件 (生成欄位)
  - `id`: 身份UUID
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

### 2.4 多因素認證

#### `auth.mfa_factors` - MFA因子表
- **主要用途**：儲存多因素認證因子的元數據
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 因子UUID (主鍵)
  - `user_id`: 用戶ID (外鍵: auth.users.id)
  - `friendly_name`: 友好名稱 (可空)
  - `factor_type`: 因子類型 (totp/webauthn/phone)
  - `status`: 狀態 (unverified/verified)
  - `secret`: 密鑰 (可空)
  - `phone`: 電話號碼 (可空)
  - `last_challenged_at`: 最後挑戰時間 (可空, 唯一)
  - `web_authn_credential`: WebAuthn憑證 (JSONB, 可空)
  - `web_authn_aaguid`: WebAuthn AAGUID (可空)
  - `created_at`/`updated_at`: 建立/更新時間

#### `auth.mfa_challenges` - MFA挑戰表
- **主要用途**：儲存挑戰請求的元數據
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 挑戰UUID (主鍵)
  - `factor_id`: 因子ID (外鍵: auth.mfa_factors.id)
  - `created_at`: 建立時間
  - `verified_at`: 驗證時間 (可空)
  - `ip_address`: IP地址
  - `otp_code`: OTP代碼 (可空)
  - `web_authn_session_data`: WebAuthn會話數據 (JSONB, 可空)

#### `auth.mfa_amr_claims` - MFA AMR聲明表
- **主要用途**：儲存多因素認證的認證方法參考聲明
- **主鍵**：`id`
- **核心欄位**：
  - `session_id`: 會話ID (外鍵: auth.sessions.id)
  - `authentication_method`: 認證方法
  - `id`: 聲明UUID (主鍵)
  - `created_at`/`updated_at`: 建立/更新時間

### 2.5 SSO管理

#### `auth.sso_providers` - SSO提供者表
- **主要用途**：管理SSO身份提供者資訊
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 提供者UUID (主鍵)
  - `resource_id`: 資源ID (可空, 區分大小寫)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

#### `auth.sso_domains` - SSO域名表
- **主要用途**：管理SSO電子郵件域名到身份提供者的映射
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 域名UUID (主鍵)
  - `sso_provider_id`: SSO提供者ID (外鍵: auth.sso_providers.id)
  - `domain`: 域名
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

#### `auth.saml_providers` - SAML提供者表
- **主要用途**：管理SAML身份提供者連接
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 提供者UUID (主鍵)
  - `sso_provider_id`: SSO提供者ID (外鍵: auth.sso_providers.id)
  - `entity_id`: 實體ID (唯一)
  - `metadata_xml`: 元數據XML
  - `metadata_url`: 元數據URL (可空)
  - `attribute_mapping`: 屬性映射 (JSONB, 可空)
  - `name_id_format`: 名稱ID格式 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

#### `auth.saml_relay_states` - SAML中繼狀態表
- **主要用途**：包含每個服務提供者發起登入的SAML中繼狀態資訊
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 狀態UUID (主鍵)
  - `sso_provider_id`: SSO提供者ID (外鍵: auth.sso_providers.id)
  - `request_id`: 請求ID
  - `for_email`: 目標電子郵件 (可空)
  - `redirect_to`: 重定向URL (可空)
  - `flow_state_id`: 流程狀態ID (外鍵: auth.flow_state.id, 可空)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

### 2.6 其他認證表格

#### `auth.flow_state` - 流程狀態表
- **主要用途**：儲存PKCE登入的元數據
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 流程UUID (主鍵)
  - `user_id`: 用戶ID (可空)
  - `auth_code`: 認證代碼
  - `code_challenge_method`: 代碼挑戰方法 (s256/plain)
  - `code_challenge`: 代碼挑戰
  - `provider_type`: 提供者類型
  - `provider_access_token`: 提供者訪問令牌 (可空)
  - `provider_refresh_token`: 提供者刷新令牌 (可空)
  - `authentication_method`: 認證方法
  - `auth_code_issued_at`: 認證代碼發布時間 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

#### `auth.one_time_tokens` - 一次性令牌表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 令牌UUID (主鍵)
  - `user_id`: 用戶ID (外鍵: auth.users.id)
  - `token_type`: 令牌類型 (confirmation_token/reauthentication_token/recovery_token/email_change_token_new/email_change_token_current/phone_change_token)
  - `token_hash`: 令牌雜湊
  - `relates_to`: 關聯到
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

#### `auth.instances` - 實例表
- **主要用途**：跨多個網站管理用戶
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 實例UUID (主鍵)
  - `uuid`: UUID (可空)
  - `raw_base_config`: 原始基礎配置 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (可空)

#### `auth.audit_log_entries` - 審計日誌條目表
- **主要用途**：用戶操作的審計軌跡
- **主鍵**：`id`
- **核心欄位**：
  - `instance_id`: 實例ID (可空)
  - `id`: 條目UUID (主鍵)
  - `payload`: 載荷 (JSON, 可空)
  - `ip_address`: IP地址
  - `created_at`: 建立時間 (可空)

#### `auth.schema_migrations` - Schema遷移表
- **主要用途**：管理認證系統的更新
- **主鍵**：`version`
- **核心欄位**：
  - `version`: 版本號 (主鍵)

## 3. 儲存系統表格 (Storage Schema)

### 3.1 儲存桶管理

#### `storage.buckets` - 儲存桶表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 桶ID (主鍵)
  - `name`: 桶名稱
  - `owner`: 擁有者 (已棄用，使用owner_id) (可空)
  - `owner_id`: 擁有者ID (可空)
  - `public`: 是否公開 (預設: false)
  - `avif_autodetection`: AVIF自動檢測 (預設: false)
  - `file_size_limit`: 檔案大小限制 (可空)
  - `allowed_mime_types`: 允許的MIME類型 (可空)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())

### 3.2 物件管理

#### `storage.objects` - 物件表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 物件UUID (主鍵, 預設: gen_random_uuid())
  - `bucket_id`: 桶ID (外鍵: storage.buckets.id, 可空)
  - `name`: 物件名稱 (可空)
  - `owner`: 擁有者 (已棄用，使用owner_id) (可空)
  - `owner_id`: 擁有者ID (可空)
  - `version`: 版本 (可空)
  - `metadata`: 元數據 (JSONB, 可空)
  - `user_metadata`: 用戶元數據 (JSONB, 可空)
  - `path_tokens`: 路徑令牌 (生成欄位)
  - `created_at`/`updated_at`: 建立/更新時間 (預設: now())
  - `last_accessed_at`: 最後訪問時間 (預設: now())

### 3.3 多部分上傳

#### `storage.s3_multipart_uploads` - S3多部分上傳表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 上傳ID (主鍵)
  - `in_progress_size`: 進行中大小 (預設: 0)
  - `upload_signature`: 上傳簽名
  - `bucket_id`: 桶ID (外鍵: storage.buckets.id)
  - `key`: 鍵值
  - `version`: 版本
  - `owner_id`: 擁有者ID (可空)
  - `user_metadata`: 用戶元數據 (JSONB, 可空)
  - `created_at`: 建立時間 (預設: now())

#### `storage.s3_multipart_uploads_parts` - S3多部分上傳部分表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 部分UUID (主鍵, 預設: gen_random_uuid())
  - `upload_id`: 上傳ID (外鍵: storage.s3_multipart_uploads.id)
  - `size`: 大小 (預設: 0)
  - `part_number`: 部分編號
  - `bucket_id`: 桶ID (外鍵: storage.buckets.id)
  - `key`: 鍵值
  - `etag`: ETag
  - `owner_id`: 擁有者ID (可空)
  - `version`: 版本
  - `created_at`: 建立時間 (預設: now())

### 3.4 遷移管理

#### `storage.migrations` - 遷移表
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 遷移ID (主鍵)
  - `name`: 遷移名稱 (唯一)
  - `hash`: 雜湊值
  - `executed_at`: 執行時間 (預設: CURRENT_TIMESTAMP)

## 4. 即時系統表格 (Realtime Schema)

### 4.1 訂閱管理

#### `realtime.subscription` - 訂閱表
- **主鍵**：`id` (自增)
- **核心欄位**：
  - `id`: 訂閱ID (主鍵)
  - `subscription_id`: 訂閱UUID
  - `entity`: 實體 (regclass)
  - `filters`: 過濾器 (預設: {})
  - `claims`: 聲明 (JSONB)
  - `claims_role`: 聲明角色 (生成欄位)
  - `created_at`: 建立時間 (預設: timezone('utc', now()))

### 4.2 訊息管理

#### `realtime.messages` - 訊息表
- **複合主鍵**：`inserted_at`, `id`
- **核心欄位**：
  - `topic`: 主題
  - `extension`: 擴展
  - `payload`: 載荷 (JSONB, 可空)
  - `event`: 事件 (可空)
  - `private`: 是否私有 (預設: false)
  - `id`: 訊息UUID (預設: gen_random_uuid())
  - `inserted_at`/`updated_at`: 插入/更新時間 (預設: now())

#### 日期分區訊息表
- `realtime.messages_2025_07_06` 至 `realtime.messages_2025_07_12`
- **結構**：與主 `messages` 表相同
- **用途**：按日期分區儲存歷史訊息

### 4.3 遷移管理

#### `realtime.schema_migrations` - Schema遷移表
- **主鍵**：`version`
- **核心欄位**：
  - `version`: 版本號 (主鍵)
  - `inserted_at`: 插入時間 (可空)

## 5. 保險庫系統表格 (Vault Schema)

#### `vault.secrets` - 機密表
- **主要用途**：在磁碟上儲存敏感資訊的加密 `secret` 欄位表格
- **主鍵**：`id`
- **核心欄位**：
  - `id`: 機密UUID (主鍵, 預設: gen_random_uuid())
  - `name`: 機密名稱 (可空)
  - `description`: 描述 (預設: '')
  - `secret`: 機密內容
  - `key_id`: 金鑰ID (可空)
  - `nonce`: 隨機數 (預設: vault._crypto_aead_det_noncegen())
  - `created_at`/`updated_at`: 建立/更新時間 (預設: CURRENT_TIMESTAMP)

## 6. 遷移管理表格 (Supabase_Migrations Schema)

#### `supabase_migrations.schema_migrations` - Schema遷移表
- **主鍵**：`version`
- **核心欄位**：
  - `version`: 版本號 (主鍵)
  - `statements`: SQL語句 (可空)
  - `name`: 遷移名稱 (可空)
  - `created_by`: 建立者 (可空)
  - `idempotency_key`: 冪等鍵 (可空, 唯一)

#### `supabase_migrations.seed_files` - 種子檔案表
- **主鍵**：`path`
- **核心欄位**：
  - `path`: 檔案路徑 (主鍵)
  - `hash`: 檔案雜湊

## 主要外鍵關係圖

### 核心業務關係
```
data_code (產品) ←→ record_palletinfo (棧板)
                 ↓
              record_inventory (庫存)
                 ↓
              record_transfer (轉移)
                 ↓
              record_history (歷史)

data_id (用戶) ←→ work_level (工作量)
              ↓
           record_history (歷史)
              ↓
           record_transfer (轉移)

data_supplier (供應商) ←→ record_grn (接收)
```

### 認證系統關係
```
auth.users ←→ auth.sessions
          ↓
       auth.identities
          ↓
    auth.mfa_factors
          ↓
   auth.mfa_challenges
```

### 儲存系統關係
```
storage.buckets ←→ storage.objects
               ↓
        storage.s3_multipart_uploads
               ↓
     storage.s3_multipart_uploads_parts
```

## 數據統計摘要

- **總表格數量**：76個
- **主要業務表格**：47個 (Public Schema)
- **認證系統表格**：13個 (Auth Schema)
- **儲存系統表格**：5個 (Storage Schema)
- **即時系統表格**：9個 (Realtime Schema)
- **保險庫系統表格**：1個 (Vault Schema)
- **遷移管理表格**：2個 (Supabase_Migrations Schema)

> 本文檔反映了 Pennine 線上庫存控制系統的完整資料庫結構，包括所有核心業務邏輯和 Supabase 系統表格。所有表格結構、欄位類型、預設值和外鍵關係均基於實際 Supabase 資料庫狀態。
