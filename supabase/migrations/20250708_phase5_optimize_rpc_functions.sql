-- Migration: Phase 5 Database Optimization - Optimize RPC Functions
-- Created: 2025-07-08
-- Purpose: Optimize existing RPC functions and add new performance-focused functions

-- ========================================
-- 1. 優化 execute_sql_query 函數
-- ========================================

-- 增強版本：添加查詢計劃緩存和更智能的優化
CREATE OR REPLACE FUNCTION execute_sql_query(query_text TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  row_count INTEGER;
  execution_plan JSON;
  query_hash TEXT;
  cached_plan JSON;
  estimated_cost NUMERIC;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time_ms INTEGER;
BEGIN
  -- 記錄開始時間
  start_time := clock_timestamp();
  
  -- 生成查詢哈希
  query_hash := encode(digest(query_text, 'sha256'), 'hex');
  
  -- 檢查查詢計劃緩存（新功能）
  SELECT plan_data INTO cached_plan 
  FROM query_plan_cache 
  WHERE hash = query_hash 
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF cached_plan IS NOT NULL THEN
    execution_plan := cached_plan;
  ELSE
    -- 獲取查詢計劃
    EXECUTE 'EXPLAIN (FORMAT JSON, BUFFERS true) ' || query_text INTO execution_plan;
    
    -- 緩存查詢計劃
    INSERT INTO query_plan_cache (hash, plan_data, created_at)
    VALUES (query_hash, execution_plan, NOW())
    ON CONFLICT (hash) DO UPDATE 
    SET plan_data = EXCLUDED.plan_data, created_at = EXCLUDED.created_at;
  END IF;
  
  -- 提取預估成本
  estimated_cost := (execution_plan->0->>'Total Cost')::numeric;
  
  -- 成本檢查（增強版）
  IF estimated_cost > 100000 THEN
    RAISE EXCEPTION 'Query too expensive (cost: %), please add filters or limits', estimated_cost
      USING HINT = 'Consider adding WHERE conditions or LIMIT clause';
  ELSIF estimated_cost > 50000 THEN
    -- 嘗試自動優化
    query_text := optimize_expensive_query_advanced(query_text);
  END IF;
  
  -- 設置語句超時（基於成本動態調整）
  IF estimated_cost > 10000 THEN
    SET LOCAL statement_timeout = '60s';
  ELSIF estimated_cost > 5000 THEN
    SET LOCAL statement_timeout = '30s';
  ELSE
    SET LOCAL statement_timeout = '15s';
  END IF;
  
  -- 執行查詢
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  
  -- 獲取行數
  GET DIAGNOSTICS row_count = ROW_COUNT;
  
  -- 記錄結束時間
  end_time := clock_timestamp();
  execution_time_ms := EXTRACT(MILLISECOND FROM (end_time - start_time))::INTEGER;
  
  -- 記錄查詢性能（新功能）
  INSERT INTO query_performance_log (
    query_hash, 
    estimated_cost, 
    actual_rows, 
    execution_time_ms, 
    created_at
  ) VALUES (
    query_hash,
    estimated_cost,
    row_count,
    execution_time_ms,
    NOW()
  );
  
  RETURN json_build_object(
    'data', COALESCE(result, '[]'::json),
    'row_count', row_count,
    'execution_time_ms', execution_time_ms,
    'estimated_cost', estimated_cost
  );
EXCEPTION
  WHEN statement_timeout THEN
    RAISE EXCEPTION 'Query timeout after % seconds', 
      CASE 
        WHEN estimated_cost > 10000 THEN 60
        WHEN estimated_cost > 5000 THEN 30
        ELSE 15
      END
      USING HINT = 'Try adding more specific filters or date ranges';
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. 增強查詢優化函數
-- ========================================

CREATE OR REPLACE FUNCTION optimize_expensive_query_advanced(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
  optimized_query TEXT := query_text;
  table_name TEXT;
  has_where BOOLEAN;
  has_limit BOOLEAN;
BEGIN
  -- 檢查基本條件
  has_where := query_text ILIKE '%WHERE%';
  has_limit := query_text ILIKE '%LIMIT%';
  
  -- 提取主表名
  IF query_text ~* 'FROM\s+(\w+)' THEN
    table_name := substring(query_text from 'FROM\s+(\w+)');
  END IF;
  
  -- 基於表名的智能優化
  CASE table_name
    WHEN 'record_history' THEN
      IF NOT has_where THEN
        optimized_query := regexp_replace(
          optimized_query, 
          'FROM\s+record_history',
          'FROM record_history WHERE time >= CURRENT_DATE - INTERVAL ''7 days''',
          'i'
        );
      END IF;
      IF NOT has_limit THEN
        optimized_query := optimized_query || ' LIMIT 1000';
      END IF;
      
    WHEN 'record_palletinfo' THEN
      IF NOT has_limit THEN
        optimized_query := optimized_query || ' LIMIT 500';
      END IF;
      
    WHEN 'record_transfer' THEN
      IF NOT has_where THEN
        optimized_query := regexp_replace(
          optimized_query,
          'FROM\s+record_transfer',
          'FROM record_transfer WHERE tran_date >= CURRENT_DATE - INTERVAL ''30 days''',
          'i'
        );
      END IF;
      
    ELSE
      -- 通用優化
      IF NOT has_limit THEN
        optimized_query := optimized_query || ' LIMIT 1000';
      END IF;
  END CASE;
  
  RETURN optimized_query;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. 創建查詢計劃緩存表
-- ========================================

CREATE TABLE IF NOT EXISTS query_plan_cache (
  hash TEXT PRIMARY KEY,
  plan_data JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 創建清理舊緩存的索引
CREATE INDEX IF NOT EXISTS idx_query_plan_cache_created 
ON query_plan_cache (created_at);

-- ========================================
-- 4. 創建查詢性能日誌表
-- ========================================

CREATE TABLE IF NOT EXISTS query_performance_log (
  id BIGSERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL,
  estimated_cost NUMERIC NOT NULL,
  actual_rows INTEGER NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 創建性能分析索引
CREATE INDEX IF NOT EXISTS idx_query_performance_log_hash 
ON query_performance_log (query_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_log_created 
ON query_performance_log (created_at DESC);

-- ========================================
-- 5. 創建智能查詢建議函數
-- ========================================

CREATE OR REPLACE FUNCTION get_query_optimization_suggestions(
  p_query_text TEXT
) RETURNS TABLE (
  suggestion_type TEXT,
  suggestion TEXT,
  priority INTEGER
) AS $$
DECLARE
  has_where BOOLEAN;
  has_limit BOOLEAN;
  has_order_by BOOLEAN;
  join_count INTEGER;
  subquery_count INTEGER;
  suggestions_array TEXT[][];
BEGIN
  -- 分析查詢結構
  has_where := p_query_text ILIKE '%WHERE%';
  has_limit := p_query_text ILIKE '%LIMIT%';
  has_order_by := p_query_text ILIKE '%ORDER BY%';
  join_count := array_length(string_to_array(p_query_text, 'JOIN'), 1) - 1;
  subquery_count := array_length(string_to_array(p_query_text, '(SELECT'), 1) - 1;
  
  -- 收集建議
  suggestions_array := ARRAY[]::TEXT[][];
  
  -- 缺少 WHERE 條件
  IF NOT has_where AND p_query_text ILIKE '%record_history%' THEN
    suggestions_array := array_append(suggestions_array, 
      ARRAY['missing_filter', 'Add date filter: WHERE time >= CURRENT_DATE - INTERVAL ''7 days''', '1']
    );
  END IF;
  
  -- 缺少 LIMIT
  IF NOT has_limit THEN
    suggestions_array := array_append(suggestions_array,
      ARRAY['missing_limit', 'Add LIMIT clause to prevent large result sets', '2']
    );
  END IF;
  
  -- 過多 JOIN
  IF join_count > 3 THEN
    suggestions_array := array_append(suggestions_array,
      ARRAY['too_many_joins', 'Consider breaking query into multiple smaller queries', '1']
    );
  END IF;
  
  -- 子查詢優化
  IF subquery_count > 0 THEN
    suggestions_array := array_append(suggestions_array,
      ARRAY['subquery_optimization', 'Consider using JOIN instead of subqueries for better performance', '2']
    );
  END IF;
  
  -- ORDER BY 沒有 LIMIT
  IF has_order_by AND NOT has_limit THEN
    suggestions_array := array_append(suggestions_array,
      ARRAY['order_without_limit', 'ORDER BY without LIMIT can be expensive, add LIMIT', '1']
    );
  END IF;
  
  -- 返回建議
  RETURN QUERY
  SELECT 
    s[1]::TEXT as suggestion_type,
    s[2]::TEXT as suggestion,
    s[3]::INTEGER as priority
  FROM unnest(suggestions_array) as s
  ORDER BY s[3]::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. 創建查詢模式分析函數（增強版）
-- ========================================

CREATE OR REPLACE FUNCTION analyze_query_patterns_advanced(
  p_days_back INTEGER DEFAULT 7
) RETURNS TABLE (
  pattern_type TEXT,
  pattern_detail TEXT,
  frequency BIGINT,
  avg_execution_time_ms NUMERIC,
  avg_row_count NUMERIC,
  optimization_potential TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH query_analysis AS (
    SELECT 
      qr.complexity,
      qr.sql,
      COUNT(*) as query_count,
      AVG(pl.execution_time_ms) as avg_time,
      AVG(pl.actual_rows) as avg_rows
    FROM query_record qr
    LEFT JOIN query_performance_log pl ON encode(digest(qr.sql, 'sha256'), 'hex') = pl.query_hash
    WHERE qr.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    GROUP BY qr.complexity, qr.sql
  )
  SELECT 
    'Complexity: ' || COALESCE(complexity, 'unknown') as pattern_type,
    CASE 
      WHEN sql ILIKE '%record_history%' THEN 'History queries'
      WHEN sql ILIKE '%record_palletinfo%' THEN 'Pallet queries'
      WHEN sql ILIKE '%JOIN%' THEN 'Join queries'
      WHEN sql ILIKE '%GROUP BY%' THEN 'Aggregation queries'
      ELSE 'Simple queries'
    END as pattern_detail,
    SUM(query_count) as frequency,
    AVG(avg_time)::NUMERIC(10,2) as avg_execution_time_ms,
    AVG(avg_rows)::NUMERIC(10,2) as avg_row_count,
    CASE 
      WHEN AVG(avg_time) > 1000 THEN 'High - Consider optimization'
      WHEN AVG(avg_time) > 500 THEN 'Medium - Monitor performance'
      ELSE 'Low - Performance acceptable'
    END as optimization_potential
  FROM query_analysis
  GROUP BY complexity, pattern_detail
  ORDER BY frequency DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. 創建自動清理函數
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_query_data()
RETURNS void AS $$
BEGIN
  -- 清理舊的查詢計劃緩存（超過 24 小時）
  DELETE FROM query_plan_cache 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- 清理舊的性能日誌（超過 30 天）
  DELETE FROM query_performance_log 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- 清理舊的查詢記錄（可選，超過 90 天）
  -- DELETE FROM query_record 
  -- WHERE created_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. 設置定期清理（使用 pg_cron 或手動調用）
-- ========================================

-- 如果啟用了 pg_cron，可以設置定期清理
-- SELECT cron.schedule('cleanup-query-data', '0 2 * * *', 'SELECT cleanup_old_query_data();');

-- ========================================
-- 9. 授權
-- ========================================

GRANT EXECUTE ON FUNCTION execute_sql_query TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_optimization_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_query_patterns_advanced TO authenticated;
GRANT SELECT ON query_performance_log TO authenticated;

-- ========================================
-- 10. 添加註釋
-- ========================================

COMMENT ON FUNCTION execute_sql_query IS 'Enhanced SQL execution with performance monitoring and optimization';
COMMENT ON FUNCTION get_query_optimization_suggestions IS 'Provide optimization suggestions for SQL queries';
COMMENT ON FUNCTION analyze_query_patterns_advanced IS 'Advanced analysis of query patterns and performance';
COMMENT ON TABLE query_plan_cache IS 'Cache for query execution plans';
COMMENT ON TABLE query_performance_log IS 'Log of query performance metrics';