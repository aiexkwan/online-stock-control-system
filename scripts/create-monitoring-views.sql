-- =====================================================
-- 創建監控視圖（修正版）
-- =====================================================
-- 避免使用可能導致 IMMUTABLE 錯誤的函數
-- =====================================================

-- 刪除舊視圖（如果存在）
DROP VIEW IF EXISTS v_index_usage;
DROP VIEW IF EXISTS v_missing_indexes;

-- 創建索引使用監控視圖
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 創建缺失索引識別視圖（簡化版）
CREATE OR REPLACE VIEW v_missing_indexes AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    CASE 
        WHEN (idx_scan + seq_scan) = 0 THEN 0
        ELSE ROUND((seq_scan * 100.0) / (idx_scan + seq_scan), 2)
    END as seq_scan_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan > 100
    AND n_live_tup > 1000
ORDER BY seq_scan DESC;

-- 創建表大小監控視圖
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
    n_live_tup as row_count
FROM pg_tables
JOIN pg_stat_user_tables USING (schemaname, tablename)
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 驗證視圖創建
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_index_usage', 'v_missing_indexes', 'v_table_sizes');