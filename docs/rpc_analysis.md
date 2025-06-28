+  # Supabase RPC Functions 文檔
         2 +  
         3 +  ## 概述
         4 +  本文檔詳細記錄 NewPennine 倉庫管理系統中所有 Supabase RPC functions 的用途、參數和使用情況。
         5 +  
         6 +  ## 函數分類
         7 +  
         8 +  ### 1. 棧板管理 (Pallet Management)
         9 +  
        10 +  #### generate_atomic_pallet_numbers_v6
        11 +  - **用途**: 原子性生成唯一的棧板號碼和系列號
        12 +  - **參數**:
        13 +    - `p_count` (integer): 需要生成的數量
        14 +    - `p_session_id` (text, optional): 會話標識符
        15 +  - **返回**: `TABLE(pallet_number text, series text)`
        16 +  - **使用位置**: 
        17 +    - `/app/utils/optimizedPalletGenerationV6.ts:40`
        18 +    - `/app/actions/grnActions.ts:299`
        19 +  - **應用度**: 高 - 核心功能，每次生成棧板都使用
        20 +  
        21 +  #### search_pallet_optimized / search_pallet_optimized_v2
        22 +  - **用途**: 優化的棧板搜索，支持物化視圖回退
        23 +  - **參數**:
        24 +    - `p_search_type` (text): 'series' 或 'pallet_num'
        25 +    - `p_search_value` (text): 搜索值
        26 +  - **返回**: 棧板詳細信息包括位置、數量等
        27 +  - **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:25,50`
        28 +  - **應用度**: 高 - 主要的庫存查詢功能
        29 +  
        30 +  #### batch_search_pallets
        31 +  - **用途**: 批量搜索多個棧板
        32 +  - **參數**:
        33 +    - `p_patterns` (text[]): 搜索模式數組
        34 +  - **返回**: 多個棧板的詳細信息
        35 +  - **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:91`
        36 +  - **應用度**: 中 - 用於預加載和批量操作
        37 +  
        38 +  #### get_pallet_buffer_status
        39 +  - **用途**: 獲取棧板號碼緩衝區狀態
        40 +  - **返回**: 總數、可用數、保留數等統計信息
        41 +  - **使用位置**: `/app/utils/optimizedPalletGenerationV6.ts:186`
        42 +  - **應用度**: 中 - 系統監控用途
        43 +  
        44 +  #### confirm_pallet_usage / release_pallet_reservation
        45 +  - **用途**: 確認使用或釋放預留的棧板號碼
        46 +  - **參數**: `p_pallet_numbers` (text[]): 棧板號碼數組
        47 +  - **使用位置**: `/app/utils/optimizedPalletGenerationV6.ts:114,151`
        48 +  - **應用度**: 中 - 緩衝區管理
        49 +  
        50 +  ### 2. 庫存管理 (Inventory Management)
        51 +  
        52 +  #### update_stock_level_void
        53 +  - **用途**: 更新庫存水平（作廢操作）
        54 +  - **參數**:
        55 +    - `p_product_code` (text): 產品代碼
        56 +    - `p_quantity` (bigint): 數量
        57 +    - `p_operation` (text): 'void' 或 'damage'
        58 +  - **使用位置**: 
        59 +    - `/app/void-pallet/actions.ts:592,845`
        60 +    - `/app/void-pallet/services/inventoryService.ts:102`
        61 +  - **應用度**: 高 - 庫存調整核心功能
        62 +  
        63 +  #### update_work_level_move
        64 +  - **用途**: 記錄移動操作的工作量
        65 +  - **參數**:
        66 +    - `p_user_id` (integer): 操作員ID
        67 +    - `p_move_count` (integer): 移動次數
        68 +  - **使用位置**: 
        69 +    - `/app/hooks/useStockMovement.tsx:366`
        70 +    - `/app/hooks/useStockTransfer.tsx:176`
        71 +  - **應用度**: 中 - 工作量統計
        72 +  
        73 +  #### validate_stocktake_count
        74 +  - **用途**: 驗證盤點數量
        75 +  - **參數**:
        76 +    - `p_product_code` (text): 產品代碼
        77 +    - `p_counted_qty` (bigint): 盤點數量
        78 +  - **返回**: 驗證結果和差異
        79 +  - **使用位置**: `/app/api/stock-count/validate/route.ts:22`
        80 +  - **應用度**: 中 - 盤點功能
        81 +  
        82 +  ### 3. 訂單處理 (Order Processing)
        83 +  
        84 +  #### rpc_load_pallet_to_order
        85 +  - **用途**: 加載棧板到訂單
        86 +  - **參數**:
        87 +    - `p_order_ref` (text): 訂單參考號
        88 +    - `p_pallet_input` (text): 棧板輸入
        89 +    - `p_user_id` (integer): 操作員ID
        90 +    - `p_user_name` (text): 操作員名稱
        91 +  - **使用位置**: `/app/actions/orderLoadingActions.ts:136`
        92 +  - **應用度**: 高 - 訂單裝載核心功能
        93 +  
        94 +  #### rpc_undo_load_pallet
        95 +  - **用途**: 撤銷棧板加載
        96 +  - **參數**: 訂單參考、棧板號、產品代碼、數量等
        97 +  - **使用位置**: `/app/actions/orderLoadingActions.ts:62`
        98 +  - **應用度**: 中 - 錯誤修正功能
        99 +  
       100 +  #### update_aco_order_with_completion_check
       101 +  - **用途**: 更新ACO訂單並檢查完成狀態
       102 +  - **參數**:
       103 +    - `p_order_ref` (integer): 訂單參考
       104 +    - `p_product_code` (text): 產品代碼
       105 +    - `p_quantity_used` (integer): 使用數量
       106 +  - **使用位置**: `/app/api/aco-order-updates/route.ts:41`
       107 +  - **應用度**: 高 - ACO訂單管理
       108 +  
       109 +  ### 4. GRN處理 (Goods Receipt Note)
       110 +  
       111 +  #### update_grn_workflow
       112 +  - **用途**: 更新GRN工作流程
       113 +  - **參數**: GRN參考、標籤模式、產品信息、重量/數量等
       114 +  - **使用位置**: `/app/actions/grnActions.ts:300-310`
       115 +  - **應用度**: 高 - 收貨核心功能
       116 +  
       117 +  #### handle_print_label_updates
       118 +  - **用途**: 處理打印標籤更新
       119 +  - **參數**: 產品代碼、數量、用戶ID、棧板數等
       120 +  - **使用位置**: `/app/api/print-label-updates/route.ts:44`
       121 +  - **應用度**: 中 - 標籤打印功能
       122 +  
       123 +  ### 5. 系統管理 (System Management)
       124 +  
       125 +  #### execute_sql_query
       126 +  - **用途**: 執行自定義SQL查詢（用於Ask Database功能）
       127 +  - **參數**: `query_text` (text): SQL查詢語句
       128 +  - **使用位置**: 
       129 +    - `/app/api/ask-database/route.ts:691`
       130 +    - `/app/api/anomaly-detection/route.ts:99,168,224`
       131 +  - **應用度**: 高 - 數據分析功能
       132 +  
       133 +  #### refresh_pallet_location_mv / smart_refresh_mv / force_sync_pallet_mv
       134 +  - **用途**: 刷新物化視圖以提高查詢性能
       135 +  - **使用位置**: `/app/hooks/useOptimizedStockQuery.tsx:131,149,167`
       136 +  - **應用度**: 中 - 性能優化
       137 +  
       138 +  #### api_cleanup_pallet_buffer
       139 +  - **用途**: 清理過期的棧板號碼緩衝區
       140 +  - **使用位置**: 
       141 +    - `/app/api/cleanup-pallet-buffer/route.ts:27`
       142 +    - `/supabase/functions/cleanup-pallet-buffer/index.ts:25`
       143 +  - **應用度**: 低 - 定期維護任務
       144 +  
       145 +  ### 6. 導航追蹤 (Navigation Tracking)
       146 +  
       147 +  #### increment_navigation_stats / track_navigation_transition
       148 +  - **用途**: 記錄用戶導航行為和路徑轉換
       149 +  - **參數**: 用戶ID、路徑、停留時間等
       150 +  - **使用位置**: `/lib/navigation/behavior-tracker.ts:72,80`
       151 +  - **應用度**: 中 - 用戶行為分析
       152 +  
       153 +  #### get_predicted_next_paths
       154 +  - **用途**: 基於歷史數據預測用戶下一步操作
       155 +  - **參數**: 用戶ID、當前路徑、限制數量
       156 +  - **使用位置**: `/lib/navigation/behavior-tracker.ts:140`
       157 +  - **應用度**: 中 - 智能導航建議
       158 +  
       159 +  ### 7. 報表和統計 (Reporting & Statistics)
       160 +  
       161 +  #### get_admin_dashboard_stats / get_time_range_stats
       162 +  - **用途**: 獲取管理儀表板統計數據
       163 +  - **使用位置**: `/app/admin/services/AdminDataService.ts:50,76`
       164 +  - **應用度**: 高 - 管理面板核心
       165 +  
       166 +  #### get_void_statistics
       167 +  - **用途**: 獲取作廢操作統計
       168 +  - **使用位置**: `/app/admin/services/AdminDataService.ts:169`
       169 +  - **應用度**: 中 - 統計分析
       170 +  
       171 +  #### get_current_await_pallet_count
       172 +  - **用途**: 獲取當前等待位置的棧板數量
       173 +  - **使用位置**: `/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget.tsx:38`
       174 +  - **應用度**: 中 - 實時監控
       175 +  
       176 +  ## 優化建議
       177 +  
       178 +  ### 1. 版本管理
       179 +  - **問題**: 存在多個版本的棧板生成函數(v3-v6)
       180 +  - **建議**: 統一使用v6版本，移除舊版本減少維護成本
       181 +  
       182 +  ### 2. 緩存策略
       183 +  - **問題**: 高頻查詢函數缺乏緩存機制
       184 +  - **建議**: 為`search_pallet_optimized`等函數實施Redis緩存
       185 +  
       186 +  ### 3. 批量操作
       187 +  - **問題**: 某些操作仍然是單個執行
       188 +  - **建議**: 擴展批量功能，如批量void、批量更新庫存
       189 +  
       190 +  ### 4. 錯誤處理
       191 +  - **問題**: 錯誤返回格式不統一
       192 +  - **建議**: 建立統一的錯誤響應格式和錯誤代碼體系
       193 +  
       194 +  ### 5. 性能監控
       195 +  - **問題**: 缺乏函數執行時間監控
       196 +  - **建議**: 為關鍵函數添加執行時間記錄和告警機制
       197 +  
       198 +  ### 6. 安全性
       199 +  - **問題**: `execute_sql_query`存在SQL注入風險
       200 +  - **建議**: 實施更嚴格的查詢驗證和權限控制
       201 +  
       202 +  ### 7. 文檔完善
       203 +  - **問題**: 部分函數缺少描述和註釋
       204 +  - **建議**: 使用COMMENT ON FUNCTION為數據庫函數添加說明
       205 +  
       206 +  ## 廢棄函數清單
       207 +  以下函數建議在確認無使用後移除：
       208 +  - generate_atomic_pallet_numbers_v3
       209 +  - generate_atomic_pallet_numbers_v4
       210 +  - generate_atomic_pallet_numbers_v5
       211 +  - test_atomic_pallet_generation
       212 +  - monitor_pallet_generation_performance
       213 +  - process_atomic_stock_transfer (未找到使用)
       214 +  - enable_rls_and_policy_all (一次性設置)
       215 +  
       216 +  ## 總結
       217 +  系統中共有67個RPC函數，其中約30%為高頻使用的核心功能，40%為中等使用頻率的支援功能，30%為低頻或廢棄功能。建議重點優化高頻函數的性能，
     整合相似功能，並清理廢棄代碼。
       218   \ No newline at end of file