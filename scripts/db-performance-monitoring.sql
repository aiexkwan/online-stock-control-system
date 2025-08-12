-- 數據庫性能監控 SQL 腳本
-- 用於 doc_upload 表的性能分析和監控

-- 1. 檢查表統計信息
-- 用於監控表的大小、活行數和死行數
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    ROUND(
        100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2
    ) AS dead_tuple_percent
FROM pg_stat_user_tables 
WHERE tablename = 'doc_upload';

-- 2. 檢查索引使用情況
-- 監控索引的使用頻率和效率
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    ROUND(
        100.0 * idx_tup_fetch / NULLIF(idx_tup_read, 0), 2
    ) AS hit_ratio_percent
FROM pg_stat_user_indexes 
WHERE tablename = 'doc_upload'
ORDER BY idx_scan DESC;

-- 3. 分析最慢的查詢（需要啟用 pg_stat_statements 擴展）
-- 查找涉及 doc_upload 表的慢查詢
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS hit_percent
FROM pg_stat_statements 
WHERE query ILIKE '%doc_upload%'
ORDER BY mean_time DESC
LIMIT 10;

-- 4. 檢查表膨脹情況
-- 監控表的膨脹程度，決定是否需要 VACUUM
SELECT 
    schemaname, 
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(100 * n_dead_tup / GREATEST(n_live_tup + n_dead_tup, 1), 1) AS dead_pct,
    CASE 
        WHEN n_dead_tup > 1000 AND (n_dead_tup * 100 / GREATEST(n_live_tup + n_dead_tup, 1)) > 20 THEN 'VACUUM RECOMMENDED'
        WHEN n_dead_tup > 100 AND (n_dead_tup * 100 / GREATEST(n_live_tup + n_dead_tup, 1)) > 10 THEN 'MONITOR'
        ELSE 'OK'
    END AS recommendation
FROM pg_stat_user_tables 
WHERE tablename = 'doc_upload';

-- 5. 監控最近的插入性能
-- 檢查最近 24 小時內的插入操作
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as insert_count,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))) as avg_age_seconds,
    MIN(created_at) as first_insert,
    MAX(created_at) as last_insert
FROM doc_upload 
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 6. 檢查鎖定情況
-- 監控表級鎖定，可能影響插入性能
SELECT 
    pg_class.relname,
    pg_locks.locktype,
    pg_locks.mode,
    pg_locks.granted,
    pg_stat_activity.query,
    pg_stat_activity.query_start,
    pg_stat_activity.state
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
LEFT JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_class.relname = 'doc_upload'
AND NOT pg_locks.granted;

-- 7. 存儲空間分析
-- 監控表和索引的磁盤使用情況
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    ROUND(
        100.0 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) 
        / pg_total_relation_size(schemaname||'.'||tablename), 2
    ) as index_ratio_percent
FROM pg_tables 
WHERE tablename = 'doc_upload';

-- 8. 建議的維護操作
-- 基於統計信息生成維護建議
WITH table_stats AS (
    SELECT 
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_analyze
    FROM pg_stat_user_tables 
    WHERE tablename = 'doc_upload'
)
SELECT 
    CASE 
        WHEN n_dead_tup > 1000 THEN 'VACUUM doc_upload;'
        WHEN n_dead_tup > 100 THEN 'Consider VACUUM doc_upload;'
        ELSE 'No VACUUM needed'
    END as vacuum_recommendation,
    CASE 
        WHEN last_analyze < CURRENT_TIMESTAMP - INTERVAL '7 days' OR last_analyze IS NULL THEN 'ANALYZE doc_upload;'
        WHEN last_analyze < CURRENT_TIMESTAMP - INTERVAL '3 days' THEN 'Consider ANALYZE doc_upload;'
        ELSE 'Statistics are current'
    END as analyze_recommendation
FROM table_stats;

-- 9. 插入性能基準測試
-- 執行這個腳本來測試插入性能
-- EXPLAIN (ANALYZE, BUFFERS) 
-- INSERT INTO doc_upload (doc_name, upload_by, doc_type, doc_url, file_size, folder, json_txt) 
-- VALUES ('benchmark-test.pdf', 1, 'order', 'https://test.example.com/benchmark.pdf', 12345, 'orderpdf', 'benchmark test');

-- 10. 清理測試數據
-- DELETE FROM doc_upload WHERE doc_name = 'benchmark-test.pdf';