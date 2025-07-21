-- Order Loading System Performance Indexes
-- 執行這些 SQL 語句來提升查詢性能
-- Note: This script has been verified against the actual database schema

-- 1. data_order 表索引
-- 用於快速查找訂單和產品組合
CREATE INDEX IF NOT EXISTS idx_data_order_ref_product
ON data_order(order_ref, product_code);

-- 用於快速過濾未完成訂單
CREATE INDEX IF NOT EXISTS idx_data_order_status
ON data_order(order_ref)
WHERE CAST(loaded_qty AS INTEGER) < CAST(product_qty AS INTEGER);

-- 2. record_history 表索引
-- 用於快速查找卡板歷史記錄
CREATE INDEX IF NOT EXISTS idx_record_history_plt_num_action
ON record_history(plt_num, action, time DESC);

-- 用於檢查重複加載
CREATE INDEX IF NOT EXISTS idx_record_history_order_load
ON record_history(plt_num)
WHERE action = 'Order Load';

-- 用於快速查找特定訂單的加載記錄
CREATE INDEX IF NOT EXISTS idx_record_history_remark_pattern
ON record_history(action, time DESC)
WHERE action IN ('Order Load', 'Order Unload');

-- 3. record_palletinfo 表索引
-- 用於系列號搜索
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_series
ON record_palletinfo(series);

-- 用於產品代碼搜索
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_product
ON record_palletinfo(product_code);

-- 4. stock_level 表索引
-- 用於快速更新庫存
CREATE INDEX IF NOT EXISTS idx_stock_level_stock
ON stock_level(stock);

-- 5. record_inventory 表索引
-- 用於快速查找產品庫存記錄
CREATE INDEX IF NOT EXISTS idx_record_inventory_product_time
ON record_inventory(product_code, latest_update DESC);

-- 用於卡板庫存追蹤
CREATE INDEX IF NOT EXISTS idx_record_inventory_plt_num
ON record_inventory(plt_num, latest_update DESC);

-- 6. data_id 表索引
-- 用於用戶查找
CREATE INDEX IF NOT EXISTS idx_data_id_email
ON data_id(email);

-- 分析查詢性能（可選）
-- 執行以下命令查看索引使用情況
/*
-- 查看表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('data_order', 'record_history', 'record_palletinfo', 'stock_level', 'record_inventory')
ORDER BY tablename, indexname;

-- 查看表的大小和行數
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_tup_ins AS total_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename IN ('data_order', 'record_history', 'record_palletinfo', 'stock_level', 'record_inventory')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看慢查詢（需要開啟 pg_stat_statements）
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%data_order%'
   OR query LIKE '%record_history%'
   OR query LIKE '%record_palletinfo%'
ORDER BY mean_time DESC
LIMIT 20;
*/
