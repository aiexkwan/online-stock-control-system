# RPC 函數庫 - NewPennine 倉庫管理系統

## 📋 文檔概覽

本文檔庫記錄了 NewPennine 倉庫管理系統中所有的 RPC (Remote Procedure Call) 函數，包含函數簽名、參數說明、返回值格式和使用範例。

### 📊 函數統計
- **RPC 函數總數**: 158 個
- **自定義函數**: 91 個
- **系統函數**: 67 個
- **最後更新**: 2025-01-15

---

## 📁 函數分類

### 🏭 **生產管理 RPC**
- `process_grn_label_unified` - 統一處理 GRN 標籤生成
- `process_qc_label_unified` - QC 標籤處理
- `handle_print_label_updates` - 處理打印標籤後更新
- `check_aco_order_completion` - 檢查 ACO 訂單完成狀態
- `get_aco_order_details` - 獲取 ACO 訂單詳情

### 📦 **庫存管理 RPC**
- `execute_stock_transfer` - 執行庫存轉移
- `search_pallet_optimized` - 優化版棧板搜索
- `batch_search_pallets` - 批量搜索棧板
- `rpc_search_inventory_with_chart` - 帶圖表的庫存搜索
- `get_optimized_inventory_data` - 獲取優化庫存數據

### 🎫 **標籤系統 RPC**
- `generate_atomic_pallet_numbers_v6` - 生成原子性棧板編號
- `confirm_pallet_usage` - 確認棧板使用
- `release_pallet_reservation` - 釋放棧板預留

### 📊 **數據分析 RPC**
- `get_dashboard_stats` - 獲取儀表板統計
- `get_warehouse_summary` - 獲取倉庫摘要
- `rpc_get_warehouse_work_level` - 獲取倉庫工作水平
- `rpc_get_production_stats` - 獲取生產統計

### 🔍 **搜索查詢 RPC**
- `search_product_code` - 搜索產品代碼
- `search_supplier_code` - 搜索供應商代碼
- `execute_sql_query` - 執行安全 SQL 查詢
- `rpc_get_history_tree` - 獲取歷史記錄樹

### 📋 **訂單處理 RPC**
- `rpc_load_pallet_to_order` - 將棧板加載到訂單
- `rpc_undo_load_pallet` - 撤銷棧板加載
- `rpc_get_order_state_list` - 獲取訂單狀態列表

### 🔧 **系統管理 RPC**
- `api_cleanup_pallet_buffer` - 清理棧板緩衝區
- `refresh_pallet_location_mv` - 刷新棧板位置物化視圖
- `update_stock_level` - 更新庫存水平
- `update_work_level_move` - 更新工作水平移動
- `rpc_performance_benchmark` - 性能基準測試

### 🎯 **報表生成 RPC**
- `rpc_get_grn_report_data` - 獲取 GRN 報表數據
- `rpc_get_aco_order_report` - 獲取 ACO 訂單報表
- `rpc_get_inventory_ordered_analysis` - 庫存訂單分析

---

## 🔧 核心函數詳解

### 1. 棧板管理核心函數

#### `generate_atomic_pallet_numbers_v6`
```sql
SELECT * FROM generate_atomic_pallet_numbers_v6(5, 'session-123');
```
**功能**: 生成唯一的托盤編號和系列
**參數**: 
- `p_count`: 生成數量
- `p_session_id`: 會話 ID（可選）

#### `search_pallet_optimized`
```sql
SELECT * FROM search_pallet_optimized('pallet', 'ABC123');
```
**功能**: 優化版棧板搜索
**參數**:
- `p_search_type`: 搜索類型
- `p_search_value`: 搜索值

### 2. 庫存轉移核心函數

#### `execute_stock_transfer`
```sql
SELECT execute_stock_transfer(
    'ABC123',        -- 棧板號
    'X01A1234',      -- 產品代碼
    100,             -- 產品數量
    'Await',         -- 起始位置
    'Pipeline',      -- 目標位置
    123              -- 操作員 ID
);
```

### 3. 標籤處理核心函數

#### `process_qc_label_unified`
```sql
SELECT process_qc_label_unified(
    2,              -- 棧板數量
    'X01A1234',     -- 產品代碼
    50,             -- 產品數量
    '123',          -- 時鐘號
    'QC Label',     -- 棧板備註
    'session-456'   -- 會話 ID
);
```

---

## 📈 性能優化函數

### 數據聚合優化
- `get_optimized_inventory_data` - 提供虛擬滾動支援
- `rpc_search_inventory_with_chart` - 89% 查詢減少 (9→1)
- `get_dashboard_stats` - 95% 性能提升

### 批量處理優化
- `batch_search_pallets` - 批量棧板搜索
- `cleanup_grn_records` - 批量清理 GRN 記錄

---

## 🛡️ 安全函數

### SQL 執行安全
```sql
SELECT execute_sql_query('SELECT * FROM record_inventory LIMIT 10');
```
**安全措施**:
- 只允許 SELECT 查詢
- 禁止訪問系統表
- 30 秒超時限制
- 字符長度限制

---

## 🔄 事務管理函數

### 事務生命週期
1. `start_transaction` - 開始事務
2. `record_transaction_step` - 記錄事務步驟
3. `complete_transaction` - 完成事務
4. `rollback_transaction` - 回滾事務

### 錯誤處理
- `record_transaction_error` - 記錄事務錯誤
- `get_rollback_status` - 獲取回滾狀態

---

## 📊 分析和報表函數

### 生產分析
- `rpc_get_production_stats` - 生產統計
- `rpc_get_product_distribution` - 產品分佈
- `rpc_get_staff_workload` - 員工工作負載

### 庫存分析
- `rpc_get_inventory_ordered_analysis` - 庫存訂單分析
- `rpc_get_stock_distribution` - 庫存分佈
- `rpc_get_stock_level_history` - 庫存水平歷史

### 時間分析
- `rpc_get_transfer_time_distribution` - 轉移時間分佈
- `rpc_get_await_location_count_by_timeframe` - 按時間框架統計等待位置

---

## 🎯 Widget 專用函數

### 儀表板 Widget
- `rpc_get_await_location_count` - Await 位置計數
- `rpc_get_aco_incomplete_orders_dashboard` - 未完成 ACO 訂單
- `rpc_get_warehouse_transfer_list` - 倉庫轉移列表

### 管理 Widget
- `rpc_get_orders_list` - 訂單列表
- `rpc_get_other_files_list` - 其他文件列表
- `rpc_get_pallet_reprint_info` - 棧板重印信息

---

## 🔧 維護和性能函數

### 緩衝區管理
- `api_cleanup_pallet_buffer` - 清理棧板緩衝區
- `check_pallet_buffer_health` - 檢查緩衝區健康
- `reset_daily_pallet_buffer` - 重置每日緩衝區

### 物化視圖維護
- `refresh_pallet_location_mv` - 刷新棧板位置視圖
- `force_sync_pallet_mv` - 強制同步視圖
- `smart_refresh_mv` - 智能刷新視圖

### 性能基準測試
- `rpc_performance_benchmark` - 完整性能測試
- `quick_performance_test` - 快速性能測試
- `comprehensive_performance_test` - 綜合性能測試

---

## 📝 最佳實踐

### 1. 函數調用模式
```sql
-- ✅ 正確：使用事務包裝
BEGIN;
SELECT start_transaction(...);
SELECT process_qc_label_unified(...);
SELECT complete_transaction(...);
COMMIT;

-- ❌ 錯誤：直接調用危險函數
SELECT execute_sql_query('DROP TABLE important_data');
```

### 2. 錯誤處理
```sql
-- ✅ 正確：檢查返回值
SELECT CASE 
    WHEN (result->>'success')::boolean THEN 'OK'
    ELSE 'ERROR: ' || (result->>'error')
END
FROM (SELECT process_grn_label_unified(...) as result) t;
```

### 3. 性能優化
```sql
-- ✅ 正確：使用優化函數
SELECT get_optimized_inventory_data(limit := 50);

-- ❌ 錯誤：直接查詢大表
SELECT * FROM record_inventory; -- 可能很慢
```

---

## 🚀 新功能和更新

### v6 版本更新 (2025-01-15)
- 新增 `generate_atomic_pallet_numbers_v6` 原子性棧板生成
- 優化 `process_grn_label_unified` 統一 GRN 處理
- 改進 `search_pallet_optimized_v2` 搜索性能

### 即將推出
- RFID 整合函數
- ML 預測分析函數
- 實時協作函數

---

## 📞 技術支援

### 常見問題
1. **函數執行超時**: 檢查查詢複雜度，使用分頁
2. **權限錯誤**: 確認用戶具有相應的執行權限
3. **數據不一致**: 使用事務包裝相關操作

### 最佳實踐建議
- 總是檢查函數返回值中的 `success` 字段
- 使用事務確保數據一致性
- 定期執行性能基準測試
- 遵循安全調用模式

---

**最後更新**: 2025-01-15  
**版本**: v6.0  
**維護團隊**: NewPennine 開發團隊

> 💡 **提示**: 所有 RPC 函數都經過性能優化和安全驗證。建議在生產環境使用前進行充分測試。 