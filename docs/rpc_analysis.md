# Supabase RPC Functions 文檔

## 概述
本文檔詳細記錄 NewPennine 倉庫管理系統中所有 Supabase RPC functions 的用途、參數和使用情況。

## 函數分類

### 1. 棧板管理 (Pallet Management)

#### generate_atomic_pallet_numbers_v6
- **用途**: 原子性生成唯一的棧板號碼和系列號
- **參數**:
  - `p_count` (integer): 需要生成的數量
  - `p_session_id` (text, optional): 會話標識符
- **返回**: `TABLE(pallet_number text, series text)`
- **使用位置**: 
  - `/app/utils/optimizedPalletGenerationV6.ts:40`
  - `/app/actions/grnActions.ts:299`
- **應用度**: 高 - 核心功能，每次生成棧板都使用

#### search_pallet_optimized / search_pallet_optimized_v2
- **用途**: 優化的棧板搜索，支持物化視圖回退
- **參數**:
  - `p_search_type` (text): 'series' 或 'pallet_num'
  - `p_search_value` (text): 搜索值
- **返回**: 棧板詳細信息包括位置、數量等
- **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:25,50`
- **應用度**: 高 - 主要的庫存查詢功能

#### batch_search_pallets
- **用途**: 批量搜索多個棧板
- **參數**:
  - `p_patterns` (text[]): 搜索模式數組
- **返回**: 多個棧板的詳細信息
- **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:91`
- **應用度**: 中 - 用於預加載和批量操作

#### get_pallet_buffer_status
- **用途**: 獲取棧板號碼緩衝區狀態
- **返回**: 總數、可用數、保留數等統計信息
- **使用位置**: `/app/utils/optimizedPalletGenerationV6.ts:186`
- **應用度**: 中 - 系統監控用途

#### confirm_pallet_usage / release_pallet_reservation
- **用途**: 確認使用或釋放預留的棧板號碼
- **參數**: `p_pallet_numbers` (text[]): 棧板號碼數組
- **使用位置**: `/app/utils/optimizedPalletGenerationV6.ts:114,151`
- **應用度**: 中 - 緩衝區管理

### 2. 庫存管理 (Inventory Management)

#### update_stock_level_void
- **用途**: 更新庫存水平（作廢操作）
- **參數**:
  - `p_product_code` (text): 產品代碼
  - `p_quantity` (bigint): 數量
  - `p_operation` (text): 'void' 或 'damage'
- **使用位置**: 
  - `/app/void-pallet/actions.ts:592,845`
  - `/app/void-pallet/services/inventoryService.ts:102`
- **應用度**: 高 - 庫存調整核心功能

#### update_work_level_move
- **用途**: 記錄移動操作的工作量
- **參數**:
  - `p_user_id` (integer): 操作員ID
  - `p_move_count` (integer): 移動次數
- **使用位置**: 
  - `/app/hooks/useStockMovement.tsx:366`
  - `/app/hooks/useStockTransfer.tsx:176`
- **應用度**: 中 - 工作量統計

#### validate_stocktake_count
- **用途**: 驗證盤點數量
- **參數**:
  - `p_product_code` (text): 產品代碼
  - `p_counted_qty` (bigint): 盤點數量
- **返回**: 驗證結果和差異
- **使用位置**: `/app/api/stock-count/validate/route.ts:22`
- **應用度**: 中 - 盤點功能

### 3. 訂單處理 (Order Processing)

#### rpc_load_pallet_to_order
- **用途**: 加載棧板到訂單
- **參數**:
  - `p_order_ref` (text): 訂單參考號
  - `p_pallet_input` (text): 棧板輸入
  - `p_user_id` (integer): 操作員ID
  - `p_user_name` (text): 操作員名稱
- **使用位置**: `/app/actions/orderLoadingActions.ts:136`
- **應用度**: 高 - 訂單裝載核心功能

#### rpc_undo_load_pallet
- **用途**: 撤銷棧板加載
- **參數**: 訂單參考、棧板號、產品代碼、數量等
- **使用位置**: `/app/actions/orderLoadingActions.ts:62`
- **應用度**: 中 - 錯誤修正功能

#### update_aco_order_with_completion_check
- **用途**: 更新ACO訂單並檢查完成狀態
- **參數**:
  - `p_order_ref` (integer): 訂單參考
  - `p_product_code` (text): 產品代碼
  - `p_quantity_used` (integer): 使用數量
- **使用位置**: `/app/api/aco-order-updates/route.ts:41`
- **應用度**: 高 - ACO訂單管理

### 4. GRN處理 (Goods Receipt Note)

#### update_grn_workflow
- **用途**: 更新GRN工作流程
- **參數**: GRN參考、標籤模式、產品信息、重量/數量等
- **使用位置**: `/app/actions/grnActions.ts:300-310`
- **應用度**: 高 - 收貨核心功能

#### handle_print_label_updates
- **用途**: 處理打印標籤更新
- **參數**: 產品代碼、數量、用戶ID、棧板數等
- **使用位置**: `/app/api/print-label-updates/route.ts:44`
- **應用度**: 中 - 標籤打印功能

### 5. 系統管理 (System Management)

#### execute_sql_query
- **用途**: 執行自定義SQL查詢（用於Ask Database功能）
- **參數**: `query_text` (text): SQL查詢語句
- **使用位置**: 
  - `/app/api/ask-database/route.ts:691`
  - `/app/api/anomaly-detection/route.ts:99,168,224`
- **應用度**: 高 - 數據分析功能

#### refresh_pallet_location_mv / smart_refresh_mv / force_sync_pallet_mv
- **用途**: 刷新物化視圖以提高查詢性能
- **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:131,149,167`
- **應用度**: 中 - 性能優化

#### api_cleanup_pallet_buffer
- **用途**: 清理過期的棧板號碼緩衝區
- **使用位置**: 
  - `/app/api/cleanup-pallet-buffer/route.ts:27`
  - `/supabase/functions/cleanup-pallet-buffer/index.ts:25`
- **應用度**: 低 - 定期維護任務

### 6. 導航追蹤 (Navigation Tracking)

#### increment_navigation_stats / track_navigation_transition
- **用途**: 記錄用戶導航行為和路徑轉換
- **參數**: 用戶ID、路徑、停留時間等
- **使用位置**: `/lib/navigation/behavior-tracker.ts:72,80`
- **應用度**: 中 - 用戶行為分析

#### get_predicted_next_paths
- **用途**: 基於歷史數據預測用戶下一步操作
- **參數**: 用戶ID、當前路徑、限制數量
- **使用位置**: `/lib/navigation/behavior-tracker.ts:140`
- **應用度**: 中 - 智能導航建議

### 7. 報表和統計 (Reporting & Statistics)

#### get_admin_dashboard_stats / get_time_range_stats
- **用途**: 獲取管理儀表板統計數據
- **使用位置**: `/app/admin/services/AdminDataService.ts:50,76`
- **應用度**: 高 - 管理面板核心

#### get_void_statistics
- **用途**: 獲取作廢操作統計
- **使用位置**: `/app/admin/services/AdminDataService.ts:169`
- **應用度**: 中 - 統計分析

#### get_current_await_pallet_count
- **用途**: 獲取當前等待位置的棧板數量
- **使用位置**: `/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget.tsx:38`
- **應用度**: 中 - 實時監控

## 優化建議

### 1. 版本管理
- **問題**: 存在多個版本的棧板生成函數(v3-v6)
- **建議**: 統一使用v6版本，移除舊版本減少維護成本

### 2. 緩存策略
- **問題**: 高頻查詢函數缺乏緩存機制
- **建議**: 為`search_pallet_optimized`等函數實施Redis緩存

### 3. 批量操作
- **問題**: 某些操作仍然是單個執行
- **建議**: 擴展批量功能，如批量void、批量更新庫存

### 4. 錯誤處理
- **問題**: 錯誤返回格式不統一
- **建議**: 建立統一的錯誤響應格式和錯誤代碼體系

### 5. 性能監控
- **問題**: 缺乏函數執行時間監控
- **建議**: 為關鍵函數添加執行時間記錄和告警機制

### 6. 安全性
- **問題**: `execute_sql_query`存在SQL注入風險
- **建議**: 實施更嚴格的查詢驗證和權限控制

### 7. 文檔完善
- **問題**: 部分函數缺少描述和註釋
- **建議**: 使用COMMENT ON FUNCTION為數據庫函數添加說明

## 廢棄函數清單
以下函數建議在確認無使用後移除：
- ~~generate_atomic_pallet_numbers_v3~~ ✅ (2025-01-01 已刪除)
- ~~generate_atomic_pallet_numbers_v4~~ ✅ (2025-01-01 已刪除)
- ~~generate_atomic_pallet_numbers_v5~~ ✅ (2025-01-01 已刪除)
- ~~test_atomic_pallet_generation~~ ✅ (2025-01-01 已刪除)
- ~~monitor_pallet_generation_performance~~ ✅ (2025-01-01 已刪除)
- ~~process_atomic_stock_transfer~~ ✅ (2025-01-01 已刪除 - 未找到使用)
- ~~enable_rls_and_policy_all~~ ✅ (2025-01-01 已刪除 - 安全風險)
- ~~cleanup_pallet_buffer~~ ✅ (2025-01-01 已刪除 - 保留其他兩個版本)

## 升級進度 (2025-01-01)

### 已完成的 V3 到 V6 升級：
1. **qcActions.ts** - 從 V3 升級到 V6，移除兼容層
2. **debug-pallet-generation/route.ts** - 更新測試代碼使用 V6
3. **check-pallet-numbers.js** - 更新腳本使用 V6
4. **atomicPalletUtils.ts** - 已刪除（未使用）
5. **useDatabaseOperationsV2.tsx** - 修復函數名稱衝突

### 數據庫遷移完成：
- ✅ 執行遷移 SQL：`/docs/database-migrations/remove-old-pallet-functions.sql`
- ✅ 執行額外清理：`/docs/database-migrations/remove-unused-functions.sql`
- ✅ 刪除所有廢棄函數
- ✅ 為重要函數添加 COMMENT 文檔

### GraphQL Schema：
- ✅ 已運行 `npm run codegen` 更新類型定義
- ✅ 修復重複 operation names 問題（GetAcoOrders, GetTransferStats）
- 刪除舊函數後 types 文件已自動更新
- ⚠️ 注意：GraphQL queries 有獨立的 validation 錯誤需要另外處理

## 總結
系統中共有67個RPC函數，其中約30%為高頻使用的核心功能，40%為中等使用頻率的支援功能，30%為低頻或廢棄功能。建議重點優化高頻函數的性能，整合相似功能，並清理廢棄代碼。

**更新 (2025-01-01)**：已成功將所有棧板生成功能從 V3 升級到 V6，實現系統統一化。