+  # Supabase SQL Functions 文檔
         2 +  
         3 +  ## 概述
         4 +  本文檔記錄 NewPennine 系統中未在 RPC 文檔中列出的其他 SQL 函數，包括觸發器函數、輔助函數和系統維護函數。
         5 +  
         6 +  ## 未使用或低使用率的函數
         7 +  
         8 +  ### 1. 系統維護函數
         9 +  
        10 +  #### cleanup_old_navigation_history
        11 +  - **用途**: 清理過期的導航歷史記錄
        12 +  - **語言**: PL/pgSQL
        13 +  - **安全定義**: 否
        14 +  - **應用度**: 低 - 維護任務
        15 +  - **建議**: 可設置為定期執行的 cron job
        16 +  
        17 +  #### cleanup_expired_holds
        18 +  - **用途**: 清理過期的保留記錄
        19 +  - **返回**: 清理的記錄數
        20 +  - **應用度**: 低 - 維護任務
        21 +  - **建議**: 整合到定期維護流程
        22 +  
        23 +  #### cleanup_old_pallet_sequences
        24 +  - **用途**: 清理舊的棧板序列記錄
        25 +  - **安全定義**: 是
        26 +  - **應用度**: 低 - 維護任務
        27 +  - **建議**: 評估是否仍需要此功能
        28 +  
        29 +  #### reset_daily_pallet_buffer
        30 +  - **用途**: 重置每日棧板緩衝區
        31 +  - **應用度**: 低 - 可能已被新版本取代
        32 +  - **建議**: 確認是否已被 v6 版本取代
        33 +  
        34 +  ### 2. 盤點相關函數
        35 +  
        36 +  #### update_stocktake_summaries (多個變體)
        37 +  - update_all_stocktake_summaries
        38 +  - update_stocktake_batch_summary
        39 +  - update_stocktake_daily_summary
        40 +  - update_stocktake_variance_report
        41 +  - **用途**: 更新各種盤點匯總報表
        42 +  - **安全定義**: 是
        43 +  - **應用度**: 低 - 盤點功能似乎未完全實施
        44 +  - **建議**: 評估盤點功能的實施狀態
        45 +  
        46 +  ### 3. 觸發器函數
        47 +  
        48 +  #### trigger_update_stocktake_summaries
        49 +  - **用途**: 盤點匯總更新觸發器
        50 +  - **類型**: TRIGGER
        51 +  - **應用度**: 低 - 依賴於盤點功能
        52 +  
        53 +  #### update_updated_at_column
        54 +  - **用途**: 自動更新 updated_at 時間戳
        55 +  - **類型**: TRIGGER
        56 +  - **應用度**: 中 - 標準時間戳更新
        57 +  - **建議**: 保留作為標準功能
        58 +  
        59 +  #### mark_mv_needs_refresh
        60 +  - **用途**: 標記物化視圖需要刷新
        61 +  - **類型**: TRIGGER
        62 +  - **應用度**: 中 - 物化視圖管理
        63 +  
        64 +  ### 4. GRN 相關函數
        65 +  
        66 +  #### increment_grn_pallet_counter
        67 +  - **用途**: 遞增 GRN 棧板計數器
        68 +  - **參數**: p_prefix (text)
        69 +  - **安全定義**: 是
        70 +  - **應用度**: 低 - 可能被新的生成機制取代
        71 +  - **建議**: 確認是否仍在使用
        72 +  
        73 +  #### update_grn_level
        74 +  - **用途**: 更新或新增 grn_level 表記錄
        75 +  - **描述**: GRN Label 優化：支援重量和數量模式
        76 +  - **應用度**: 中 - GRN 處理的一部分
        77 +  - **建議**: 可能被 update_grn_workflow 整合
        78 +  
        79 +  #### update_work_level_grn
        80 +  - **用途**: 更新 GRN 工作量記錄
        81 +  - **描述**: GRN Label 優化
        82 +  - **應用度**: 中 - 工作量統計
        83 +  
        84 +  #### update_stock_level_grn
        85 +  - **用途**: 更新 GRN 相關的庫存水平
        86 +  - **描述**: GRN Label 優化
        87 +  - **應用度**: 中 - 庫存管理
        88 +  
        89 +  ### 5. 庫存管理函數
        90 +  
        91 +  #### update_stock_level
        92 +  - **用途**: 基礎庫存更新函數
        93 +  - **描述**: 如果產品不存在或 update_time 不是當天，則新建記錄
        94 +  - **應用度**: 中 - 可能被特定版本取代
        95 +  
        96 +  #### update_inventory_on_grn_receipt
        97 +  - **用途**: GRN 收貨時更新庫存
        98 +  - **應用度**: 低 - 可能已整合到其他流程
        99 +  
       100 +  #### update_inventory_stock_transfer (多個重載版本)
       101 +  - **用途**: 庫存轉移時更新記錄
       102 +  - **應用度**: 低 - 可能被前端直接操作取代
       103 +  
       104 +  #### process_void_pallet_inventory
       105 +  - **用途**: 組合函數處理作廢棧板
       106 +  - **描述**: Void Pallet 優化：同時處理多個表更新
       107 +  - **應用度**: 低 - 可能被分解為多個操作
       108 +  
       109 +  #### void_pallet_transaction
       110 +  - **用途**: 作廢棧板事務處理
       111 +  - **應用度**: 低 - 被新的作廢流程取代
       112 +  
       113 +  ### 6. 工作量統計函數
       114 +  
       115 +  #### update_work_level_qc
       116 +  - **用途**: 更新 QC 工作量
       117 +  - **參數**: p_user_id, p_pallet_count
       118 +  - **應用度**: 低 - QC 功能使用情況不明
       119 +  - **建議**: 評估 QC 功能的實施狀態
       120 +  
       121 +  ### 7. 用戶管理函數
       122 +  
       123 +  #### update_user_password
       124 +  - **用途**: 更新用戶密碼
       125 +  - **參數**: user_id, new_password_hash
       126 +  - **安全定義**: 是
       127 +  - **應用度**: 低 - 可能使用其他認證方式
       128 +  - **建議**: 確認認證機制
       129 +  
       130 +  ### 8. 輔助函數
       131 +  
       132 +  #### generate_random_alphanumeric
       133 +  - **用途**: 生成隨機字母數字字符串
       134 +  - **參數**: length (integer)
       135 +  - **應用度**: 低 - 輔助功能
       136 +  - **建議**: 可能用於測試或特殊場景
       137 +  
       138 +  #### get_product_stats
       139 +  - **用途**: 獲取產品統計信息
       140 +  - **參數**: product_code_param
       141 +  - **返回**: 棧板數量和總數量
       142 +  - **應用度**: 低 - 可能被其他查詢取代
       143 +  
       144 +  #### get_today_latest_pallets / get_today_product_latest_pallets
       145 +  - **用途**: 獲取當天最新的棧板信息
       146 +  - **應用度**: 低 - 可能被其他查詢取代
       147 +  
       148 +  ### 9. 特殊功能函數
       149 +  
       150 +  #### process_batch_scan
       151 +  - **用途**: 批量掃描處理
       152 +  - **參數**: p_batch_id, p_scans (jsonb)
       153 +  - **安全定義**: 是
       154 +  - **應用度**: 低 - 批量掃描功能未見使用
       155 +  
       156 +  #### process_damaged_pallet_void
       157 +  - **用途**: 處理損壞棧板作廢
       158 +  - **返回**: jsonb
       159 +  - **應用度**: 低 - 特殊損壞處理流程
       160 +  
       161 +  ### 10. 物化視圖管理
       162 +  
       163 +  #### periodic_mv_refresh
       164 +  - **用途**: 定期刷新物化視圖
       165 +  - **應用度**: 低 - 可能被其他刷新機制取代
       166 +  
       167 +  #### monitor_pallet_generation_v4
       168 +  - **用途**: 監控 v4 版本的棧板生成
       169 +  - **應用度**: 低 - 舊版本監控
       170 +  
       171 +  ### 11. pgBouncer 相關
       172 +  
       173 +  #### pgbouncer.get_auth
       174 +  - **用途**: pgBouncer 認證函數
       175 +  - **架構**: pgbouncer
       176 +  - **安全定義**: 是
       177 +  - **應用度**: 中 - 連接池認證
       178 +  
       179 +  ## 優化建議
       180 +  
       181 +  ### 1. 函數清理
       182 +  - 移除未使用的函數，特別是舊版本函數
       183 +  - 整合功能相似的函數
       184 +  - 清理測試和監控函數
       185 +  
       186 +  ### 2. 性能優化
       187 +  - 為頻繁調用的函數添加適當的索引
       188 +  - 考慮將複雜函數拆分為更小的單元
       189 +  - 優化觸發器執行效率
       190 +  
       191 +  ### 3. 安全加固
       192 +  - 審查所有 SECURITY DEFINER 函數
       193 +  - 確保適當的權限控制
       194 +  - 添加輸入驗證
       195 +  
       196 +  ### 4. 文檔改進
       197 +  - 為所有函數添加 COMMENT
       198 +  - 建立函數依賴關係圖
       199 +  - 記錄棄用和遷移計劃
       200 +  
       201 +  ### 5. 監控建議
       202 +  - 添加函數執行統計
       203 +  - 記錄錯誤和異常
       204 +  - 建立性能基準
       205 +  
       206 +  ## 總結
       207 +  
       208 +  系統中存在大量未使用或低使用率的函數，主要集中在：
       209 +  1. 舊版本功能（如盤點系統）
       210 +  2. 被整合或替代的功能
       211 +  3. 測試和監控函數
       212 +  4. 特殊場景處理函數
       213 +  
       214 +  
     建議進行全面的函數審計，識別並移除真正未使用的函數，整合相似功能，並為保留的函數完善文檔和監控。這將有助於減少系統複雜度，提高維護效率。
       215   \ No newline at end of file