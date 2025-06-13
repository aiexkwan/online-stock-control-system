-- =====================================================
-- 報告索引解決方案（已修正欄位名稱）
-- =====================================================
-- 根據 docs/databaseStructure.md 使用正確的時間欄位名稱
-- =====================================================

-- 刪除之前嘗試創建的索引
DROP INDEX IF EXISTS idx_history_report_daily;
DROP INDEX IF EXISTS idx_palletinfo_report_monthly;
DROP INDEX IF EXISTS idx_order_loading_created_at_desc;
DROP INDEX IF EXISTS idx_order_loading_action_time_desc;

-- =====================================================
-- 創建時間索引（使用正確的欄位名稱）
-- =====================================================

-- 1. record_history 表 - 時間欄位：time
CREATE INDEX IF NOT EXISTS idx_history_time_desc 
ON record_history(time DESC);

CREATE INDEX IF NOT EXISTS idx_history_time_action 
ON record_history(time DESC, action);

-- 2. record_palletinfo 表 - 時間欄位：generate_time
CREATE INDEX IF NOT EXISTS idx_palletinfo_generate_time_desc 
ON record_palletinfo(generate_time DESC);

CREATE INDEX IF NOT EXISTS idx_palletinfo_generate_time_product 
ON record_palletinfo(generate_time DESC, product_code);

-- 3. record_stocktake 表 - 時間欄位：created_at
CREATE INDEX IF NOT EXISTS idx_stocktake_created_at_desc 
ON record_stocktake(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stocktake_created_at_product 
ON record_stocktake(created_at DESC, product_code);

-- 4. order_loading_history 表 - 時間欄位：action_time
CREATE INDEX IF NOT EXISTS idx_order_loading_action_time_desc 
ON order_loading_history(action_time DESC);

CREATE INDEX IF NOT EXISTS idx_order_loading_action_time_order 
ON order_loading_history(action_time DESC, order_ref);

-- 5. data_order 表 - 時間欄位：created_at
CREATE INDEX IF NOT EXISTS idx_data_order_created_at_desc 
ON data_order(created_at DESC);

-- 6. record_grn 表 - 時間欄位：creat_time
CREATE INDEX IF NOT EXISTS idx_grn_creat_time_desc 
ON record_grn(creat_time DESC);

-- 7. stock_level 表 - 時間欄位：update_time
CREATE INDEX IF NOT EXISTS idx_stock_level_update_time_desc 
ON stock_level(update_time DESC);

-- 8. record_inventory 表 - 時間欄位：latest_update
CREATE INDEX IF NOT EXISTS idx_inventory_latest_update_desc 
ON record_inventory(latest_update DESC);

-- 9. work_level 表 - 時間欄位：latest_update
CREATE INDEX IF NOT EXISTS idx_work_level_latest_update_desc 
ON work_level(latest_update DESC);

-- 10. grn_level 表 - 時間欄位：latest_update
CREATE INDEX IF NOT EXISTS idx_grn_level_latest_update_desc 
ON grn_level(latest_update DESC);

-- =====================================================
-- BRIN 索引（適合大表的時間序列數據）
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_history_time_brin 
ON record_history USING BRIN (time);

CREATE INDEX IF NOT EXISTS idx_palletinfo_generate_time_brin 
ON record_palletinfo USING BRIN (generate_time);

CREATE INDEX IF NOT EXISTS idx_stocktake_created_at_brin 
ON record_stocktake USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_order_loading_action_time_brin 
ON order_loading_history USING BRIN (action_time);

-- =====================================================
-- 驗證索引創建
-- =====================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE '%time%' 
    OR indexname LIKE '%created_at%' 
    OR indexname LIKE '%latest_update%'
    OR indexname LIKE '%brin%'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 優化查詢範例（使用正確的欄位名稱）
-- =====================================================

-- 今日訂單加載報告
/*
SELECT 
    action_time::date as report_date,
    order_ref,
    COUNT(*) as load_count
FROM order_loading_history
WHERE action_time >= CURRENT_DATE
AND action_time < CURRENT_DATE + INTERVAL '1 day'
GROUP BY action_time::date, order_ref
ORDER BY report_date, order_ref;
*/

-- 本月盤點摘要
/*
SELECT 
    DATE_TRUNC('month', created_at) as month,
    product_code,
    COUNT(DISTINCT plt_num) as pallets_counted,
    SUM(counted_qty) as total_counted
FROM record_stocktake
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY DATE_TRUNC('month', created_at), product_code
ORDER BY product_code;
*/

-- 庫存更新歷史
/*
SELECT 
    latest_update::date as update_date,
    COUNT(*) as updates
FROM record_inventory
WHERE latest_update >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY latest_update::date
ORDER BY update_date DESC;
*/

-- =====================================================
-- 維護建議
-- =====================================================

-- 更新統計信息
ANALYZE record_history;
ANALYZE record_palletinfo;
ANALYZE record_stocktake;
ANALYZE order_loading_history;
ANALYZE data_order;
ANALYZE record_grn;
ANALYZE stock_level;
ANALYZE record_inventory;
ANALYZE work_level;
ANALYZE grn_level;

-- =====================================================
-- 注意事項
-- =====================================================
-- 1. 所有時間欄位名稱已根據 databaseStructure.md 修正
-- 2. 使用時間範圍查詢代替日期函數以利用索引
-- 3. BRIN 索引適合大表，佔用空間少
-- 4. 定期運行 ANALYZE 保持統計信息準確
-- =====================================================