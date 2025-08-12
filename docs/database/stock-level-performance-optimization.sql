-- ========================================
-- StockLevelListAndChartCard Performance Optimization
-- Database Administrator's Optimization Plan
-- ========================================

-- 1. CRITICAL INDEXES FOR PERFORMANCE
-- =====================================

-- A. Composite index for product-based history queries
CREATE INDEX CONCURRENTLY idx_history_product_time_optimized
ON record_history (plt_num, "time" DESC)
WHERE plt_num IS NOT NULL;

-- B. Optimized JOIN index for history-palletinfo lookup
CREATE INDEX CONCURRENTLY idx_palletinfo_join_optimized
ON record_palletinfo (plt_num, product_code, generate_time DESC);

-- C. Product type filtering index
CREATE INDEX CONCURRENTLY idx_palletinfo_product_type_active
ON record_palletinfo (product_code)
WHERE product_code IS NOT NULL AND product_code != '';

-- D. Time-partitioned index for trending data
CREATE INDEX CONCURRENTLY idx_history_daily_trends
ON record_history (DATE_TRUNC('day', "time"), plt_num)
WHERE "time" >= NOW() - INTERVAL '30 days';

-- 2. QUERY OPTIMIZATION VIEWS
-- ============================

-- Materialized view for product statistics (refreshed hourly)
CREATE MATERIALIZED VIEW mv_product_stock_stats AS
SELECT 
    rpi.product_code,
    COUNT(DISTINCT rh.plt_num) as unique_pallets,
    COUNT(*) as total_records,
    COUNT(DISTINCT rh.loc) as active_locations,
    MAX(rh."time") as last_activity,
    COUNT(*) FILTER (WHERE rh."time" >= NOW() - INTERVAL '24 hours') as recent_activity
FROM record_history rh
JOIN record_palletinfo rpi ON rh.plt_num = rpi.plt_num
WHERE rh."time" >= NOW() - INTERVAL '30 days'
GROUP BY rpi.product_code;

-- Index on materialized view
CREATE INDEX idx_mv_product_stats_lookup
ON mv_product_stock_stats (product_code, last_activity DESC);

-- Daily trends aggregation view
CREATE MATERIALIZED VIEW mv_stock_daily_trends AS
SELECT 
    rpi.product_code,
    DATE_TRUNC('day', rh."time") as trend_date,
    COUNT(*) as daily_activity,
    COUNT(DISTINCT rh.plt_num) as daily_pallets,
    COUNT(DISTINCT rh.loc) as daily_locations
FROM record_history rh
JOIN record_palletinfo rpi ON rh.plt_num = rpi.plt_num
WHERE rh."time" >= NOW() - INTERVAL '30 days'
GROUP BY rpi.product_code, DATE_TRUNC('day', rh."time");

CREATE INDEX idx_mv_daily_trends_lookup
ON mv_stock_daily_trends (product_code, trend_date DESC);

-- 3. AUTOMATED MAINTENANCE PROCEDURES
-- ===================================

-- Refresh materialized views (run hourly via cron)
CREATE OR REPLACE FUNCTION refresh_stock_analytics_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stock_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_daily_trends;
    
    -- Update statistics for better query planning
    ANALYZE record_history;
    ANALYZE record_palletinfo;
    
    -- Log refresh activity
    INSERT INTO maintenance_log (operation, table_name, executed_at, status)
    VALUES ('REFRESH_ANALYTICS_VIEWS', 'mv_product_stock_stats,mv_stock_daily_trends', NOW(), 'SUCCESS');
END;
$$;

-- 4. MONITORING QUERIES
-- =====================

-- Check query performance
CREATE OR REPLACE VIEW v_stock_query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%record_history%' 
   OR query LIKE '%record_palletinfo%'
   OR query LIKE '%stockHistoryStats%'
ORDER BY mean_time DESC;

-- Monitor index usage
CREATE OR REPLACE VIEW v_stock_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('record_history', 'record_palletinfo', 'stock_level')
ORDER BY idx_scan DESC;

-- 5. ALERTING THRESHOLDS
-- ======================

-- Slow query detection (> 1 second)
CREATE OR REPLACE FUNCTION check_slow_stock_queries()
RETURNS TABLE(query_text text, avg_time numeric, call_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.query::text,
        ps.mean_time,
        ps.calls
    FROM pg_stat_statements ps
    WHERE (ps.query LIKE '%stockHistoryStats%' OR ps.query LIKE '%record_history%')
      AND ps.mean_time > 1000  -- 1 second
    ORDER BY ps.mean_time DESC;
END;
$$;

-- 6. BACKUP AND RECOVERY CONSIDERATIONS
-- =====================================

-- Point-in-time recovery setup for critical tables
-- (Configure at database level)

-- Backup strategy for large tables
CREATE OR REPLACE FUNCTION backup_stock_analytics_data(backup_days integer DEFAULT 90)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create backup table for record_history
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS backup_record_history_%s AS 
        SELECT * FROM record_history 
        WHERE "time" >= NOW() - INTERVAL ''%s days''',
        to_char(NOW(), 'YYYY_MM_DD'),
        backup_days
    );
    
    -- Create backup table for record_palletinfo
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS backup_record_palletinfo_%s AS 
        SELECT * FROM record_palletinfo 
        WHERE generate_time >= NOW() - INTERVAL ''%s days''',
        to_char(NOW(), 'YYYY_MM_DD'),
        backup_days
    );
END;
$$;

-- 7. CONNECTION POOLING CONFIGURATION
-- ===================================

-- Recommended PgBouncer settings for this workload:
-- default_pool_size = 20
-- max_client_conn = 100
-- pool_mode = session
-- server_reset_query = DISCARD ALL

-- Database connection limits
ALTER DATABASE wms_production SET max_connections = 200;
ALTER DATABASE wms_production SET shared_buffers = '1GB';
ALTER DATABASE wms_production SET effective_cache_size = '3GB';
ALTER DATABASE wms_production SET work_mem = '64MB';

-- 8. DISASTER RECOVERY PROCEDURES
-- ===============================

-- Automated failover setup
CREATE OR REPLACE FUNCTION setup_stock_data_replication()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Configure streaming replication for critical tables
    -- (Requires master-slave setup)
    
    -- Create publication for stock-related tables
    CREATE PUBLICATION stock_data_pub FOR TABLE 
        record_history, 
        record_palletinfo, 
        stock_level,
        mv_product_stock_stats,
        mv_stock_daily_trends;
        
    -- Log setup completion
    INSERT INTO maintenance_log (operation, table_name, executed_at, status)
    VALUES ('SETUP_REPLICATION', 'stock_tables', NOW(), 'SUCCESS');
END;
$$;

-- 9. AUTOMATED CLEANUP PROCEDURES
-- ===============================

-- Archive old data (run monthly)
CREATE OR REPLACE FUNCTION archive_old_stock_data(archive_months integer DEFAULT 12)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_date timestamp;
    archived_rows integer;
BEGIN
    cutoff_date := NOW() - (archive_months || ' months')::interval;
    
    -- Move old data to archive tables
    WITH archived AS (
        DELETE FROM record_history 
        WHERE "time" < cutoff_date 
        RETURNING *
    )
    INSERT INTO record_history_archive SELECT * FROM archived;
    
    GET DIAGNOSTICS archived_rows = ROW_COUNT;
    
    -- Log archival activity
    INSERT INTO maintenance_log (operation, table_name, executed_at, status, details)
    VALUES ('ARCHIVE_DATA', 'record_history', NOW(), 'SUCCESS', 
           format('Archived %s rows older than %s', archived_rows, cutoff_date));
END;
$$;

-- 10. PERFORMANCE MONITORING DASHBOARD
-- ====================================

-- Real-time performance metrics view
CREATE OR REPLACE VIEW v_stock_performance_dashboard AS
SELECT 
    'Query Performance' as metric_category,
    count(*) as slow_queries,
    avg(mean_time) as avg_query_time,
    max(mean_time) as max_query_time
FROM pg_stat_statements
WHERE query LIKE '%stockHistoryStats%'
  AND mean_time > 500  -- 0.5 second threshold

UNION ALL

SELECT 
    'Index Efficiency' as metric_category,
    count(*) as total_indexes,
    sum(idx_scan) as total_index_scans,
    avg(idx_scan) as avg_index_usage
FROM pg_stat_user_indexes
WHERE tablename IN ('record_history', 'record_palletinfo')

UNION ALL

SELECT 
    'Data Volume' as metric_category,
    sum(n_live_tup) as total_live_rows,
    sum(n_dead_tup) as total_dead_rows,
    round(sum(n_dead_tup)::numeric / sum(n_live_tup)::numeric * 100, 2) as dead_tuple_ratio
FROM pg_stat_user_tables
WHERE relname IN ('record_history', 'record_palletinfo', 'stock_level');