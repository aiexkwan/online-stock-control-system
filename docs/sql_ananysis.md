# Supabase SQL Functions 文檔

## 概述
本文檔記錄 NewPennine 系統中的 SQL 函數狀態，包括觸發器函數、輔助函數和系統維護函數。

**最後更新：2025-07-01**
- 已完成全面的函數清理和優化
- 移除了 33 個未使用函數（48.5%）
- 整合了 GRN 相關函數
- 優化了性能和加強了安全性

## 清理執行總結

### 已移除的函數（共 33 個）

#### 1. 舊版本函數（7個）
- `generate_atomic_pallet_numbers_v3`
- `generate_atomic_pallet_numbers_v4` 
- `generate_atomic_pallet_numbers_v5`
- `monitor_pallet_generation_v4`
- `test_atomic_pallet_generation`
- `get_today_latest_pallets`
- `get_today_product_latest_pallets`

#### 2. 盤點模組函數（6個）
- `trigger_update_stocktake_summaries`
- `update_all_stocktake_summaries`
- `update_stocktake_batch_summary`
- `update_stocktake_daily_summary`
- `update_stocktake_variance_report`
- `validate_stocktake_count` (已恢復，因 API 使用)

#### 3. 維護函數（2個）
- `cleanup_expired_holds` (功能已整合到 api_cleanup_pallet_buffer)
- `reset_daily_pallet_buffer` (功能已整合到 api_cleanup_pallet_buffer)

#### 4. 其他未使用函數（18個）
- `cleanup_old_navigation_history`
- `cleanup_old_pallet_sequences`
- `increment_grn_pallet_counter`
- `update_inventory_on_grn_receipt`
- `update_inventory_stock_transfer` (2個重載版本)
- `void_pallet_transaction`
- `process_damaged_pallet_void`
- `process_batch_scan`
- `generate_random_alphanumeric`
- `get_product_stats`
- `periodic_mv_refresh`
- `update_user_password`
- `update_grn_level` (已整合到 update_grn_workflow)
- `update_work_level_grn` (已整合到 update_grn_workflow)
- `update_stock_level_grn` (已整合到 update_grn_workflow)
- `update_work_level_qc`
- `process_void_pallet_inventory`

## 保留的核心函數

### 1. 觸發器函數
- **`update_updated_at_column`**
  - 用途：自動更新 updated_at 時間戳
  - 使用：objects, stocktake_validation_rules 表

- **`mark_mv_needs_refresh`**
  - 用途：標記物化視圖需要刷新
  - 使用：record_history, record_palletinfo 表

### 2. 核心業務函數

#### 棧板管理
- **`generate_atomic_pallet_numbers_v6`** - 棧板號碼生成（最新版本）
- **`api_cleanup_pallet_buffer`** - 棧板緩衝區清理（優化版）
- **`search_pallet_optimized`** - 棧板搜索
- **`search_pallet_optimized_v2`** - 棧板搜索（改進版）
- **`batch_search_pallets`** - 批量棧板搜索
- **`confirm_pallet_usage`** - 確認棧板使用
- **`release_pallet_reservation`** - 釋放棧板保留

#### 庫存管理
- **`update_stock_level`** - 基礎庫存更新
- **`update_stock_level_void`** - 作廢棧板庫存更新

#### 訂單處理
- **`update_aco_order_with_completion_check`** - ACO 訂單更新
- **`check_aco_order_completion`** - 檢查訂單完成
- **`rpc_load_pallet_to_order`** - 加載棧板到訂單
- **`rpc_undo_load_pallet`** - 撤銷棧板加載

#### GRN 處理
- **`update_grn_workflow`** - GRN 工作流程（整合版）

#### 數據查詢
- **`execute_sql_query`** - 安全 SQL 查詢執行（Ask Database 功能）
- **`get_product_details_by_code`** - 獲取產品詳情

#### 物化視圖管理
- **`refresh_pallet_location_mv`** - 刷新棧板位置視圖
- **`smart_refresh_mv`** - 智能刷新物化視圖
- **`force_sync_pallet_mv`** - 強制同步物化視圖

#### 其他
- **`update_work_level_move`** - 更新移動工作量
- **`handle_print_label_updates`** - 處理打印標籤更新
- **`pgbouncer.get_auth`** - 連接池認證

## 優化改進

### 1. 性能優化
- 添加了 3 個新索引：
  - `idx_pallet_buffer_composite` - 優化棧板緩衝區查詢
  - `idx_palletinfo_search_opt` - 優化棧板搜索
  - `idx_stock_level_active` - 優化庫存查詢
- 優化了 `api_cleanup_pallet_buffer` 使用批量刪除
- 為 `execute_sql_query` 設置 30 秒超時限制

### 2. 安全加固
- 加強了 `execute_sql_query` 的安全檢查：
  - 限制查詢長度（最多 10000 字符）
  - 禁止訪問系統表
  - 禁止所有數據修改操作
  - 不返回內部錯誤信息
- 為所有 SECURITY DEFINER 函數設置明確的 search_path

### 3. 文檔完善
- 為所有保留函數添加了詳細的 COMMENT
- 包括用途、參數、返回值和注意事項

## 建議

### 1. 持續監控
- 建立函數執行統計機制
- 監控函數性能和錯誤率
- 定期審查新增函數

### 2. 版本管理
- 使用版本號管理函數更新（如 v6, v7）
- 保持向後兼容性
- 記錄棄用計劃

### 3. 安全審計
- 定期審查 SECURITY DEFINER 函數
- 檢查動態 SQL 使用
- 確保適當的權限控制

## 總結

通過這次清理和優化：
1. **系統更簡潔** - 減少了近一半的函數，降低複雜度
2. **性能更好** - 優化了索引和函數邏輯
3. **更安全** - 加強了安全檢查和權限控制
4. **更易維護** - 完善了文檔和統一了接口

所有改動都經過謹慎評估，確保不影響現有系統運作。