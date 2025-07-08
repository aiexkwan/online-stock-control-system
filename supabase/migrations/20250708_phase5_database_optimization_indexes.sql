-- Migration: Phase 5 Database Optimization - Add Performance Indexes
-- Created: 2025-07-08
-- Purpose: Add necessary indexes to improve Ask Database query performance based on usage patterns

-- ========================================
-- 1. record_palletinfo 索引優化
-- ========================================

-- 棧板號碼索引（常用於查詢）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_plt_num 
ON record_palletinfo (plt_num);

-- 產品代碼索引（用於 JOIN 和篩選）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_product_code 
ON record_palletinfo (product_code);

-- 生成時間索引（用於日期範圍查詢）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_generate_time 
ON record_palletinfo (generate_time DESC);

-- 位置索引（常用於庫存查詢）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_loc 
ON record_palletinfo (loc);

-- 狀態索引（用於狀態篩選）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_plt_status 
ON record_palletinfo (plt_status);

-- 複合索引：產品代碼 + 生成時間（常見查詢模式）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_product_time 
ON record_palletinfo (product_code, generate_time DESC);

-- 複合索引：位置 + 狀態（庫存分析）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_loc_status 
ON record_palletinfo (loc, plt_status) 
WHERE plt_status NOT IN ('Loaded', 'Voided');

-- 文本搜索索引（用於備註搜索）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_plt_remark_gin 
ON record_palletinfo USING gin(to_tsvector('simple', COALESCE(plt_remark, '')));

-- ========================================
-- 2. record_history 索引優化
-- ========================================

-- 時間索引（最常用的過濾條件）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_time 
ON record_history (time DESC);

-- 操作類型索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_function 
ON record_history ("function");

-- 操作員索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_operator 
ON record_history (operator);

-- 棧板號碼索引（用於追蹤歷史）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_plt_num 
ON record_history (plt_num);

-- 複合索引：時間 + 功能（常見查詢模式）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_time_function 
ON record_history (time DESC, "function");

-- 部分索引：最近 30 天的記錄（大部分查詢集中在近期數據）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_recent_30days 
ON record_history (time DESC, "function", operator) 
WHERE time >= CURRENT_DATE - INTERVAL '30 days';

-- ========================================
-- 3. record_transfer 索引優化
-- ========================================

-- 轉移日期索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_tran_date 
ON record_transfer (tran_date DESC);

-- 來源位置索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_f_loc 
ON record_transfer (f_loc);

-- 目標位置索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_t_loc 
ON record_transfer (t_loc);

-- 棧板號碼索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_plt_num 
ON record_transfer (plt_num);

-- 複合索引：日期 + 位置（常見查詢模式）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_date_locations 
ON record_transfer (tran_date DESC, f_loc, t_loc);

-- ========================================
-- 4. data_order 索引優化
-- ========================================

-- 訂單號索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_order_ref 
ON data_order (order_ref);

-- 創建時間索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_created_at 
ON data_order (created_at DESC);

-- 狀態索引（如果有狀態欄位）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_status 
-- ON data_order (status) WHERE status IS NOT NULL;

-- ========================================
-- 5. record_aco 索引優化
-- ========================================

-- ACO 編號索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aco_aco_num 
ON record_aco (aco_num);

-- 創建時間索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aco_created_at 
ON record_aco (created_at DESC);

-- ========================================
-- 6. record_grn 索引優化
-- ========================================

-- GRN 參考索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grn_grn_ref 
ON record_grn (grn_ref);

-- 創建時間索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grn_created_at 
ON record_grn (created_at DESC);

-- ========================================
-- 7. query_record 額外索引（Ask Database 專用）
-- ========================================

-- 用戶查詢模式索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_record_user_complexity 
ON query_record ("user", complexity, created_at DESC) 
WHERE "user" IS NOT NULL;

-- 查詢類型索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_record_complexity 
ON query_record (complexity, created_at DESC);

-- ========================================
-- 8. 統計信息更新
-- ========================================

-- 更新主要表的統計信息
ANALYZE record_palletinfo;
ANALYZE record_history;
ANALYZE record_transfer;
ANALYZE data_code;
ANALYZE data_id;
ANALYZE data_order;
ANALYZE record_aco;
ANALYZE record_grn;
ANALYZE query_record;

-- ========================================
-- 9. 創建索引使用情況監控視圖
-- ========================================

CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'Unused'
        WHEN idx_scan < 100 THEN 'Low usage'
        WHEN idx_scan < 1000 THEN 'Medium usage'
        ELSE 'High usage'
    END AS usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 添加註釋
COMMENT ON VIEW v_index_usage_stats IS 'Monitor index usage statistics for optimization';

-- ========================================
-- 10. 創建查詢性能監控函數
-- ========================================

CREATE OR REPLACE FUNCTION analyze_query_performance(
    p_sql TEXT
) RETURNS TABLE (
    plan_line TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || p_sql;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 'Error analyzing query: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加註釋
COMMENT ON FUNCTION analyze_query_performance IS 'Analyze query performance with execution plan';