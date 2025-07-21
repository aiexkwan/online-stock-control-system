-- Migration: Optimize execute_sql_query RPC function with cost estimation
-- Created: 2025-07-08
-- Purpose: Add query cost estimation and optimization to RPC function

-- Drop the existing function if needed
DROP FUNCTION IF EXISTS execute_sql_query(query_text TEXT);

-- Create improved execute_sql_query function with cost control
CREATE OR REPLACE FUNCTION execute_sql_query(query_text TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  row_count INTEGER;
  execution_plan JSON;
  estimated_cost NUMERIC;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time_ms INTEGER;
BEGIN
  -- Record start time
  start_time := clock_timestamp();

  -- Security check: Only allow SELECT queries
  IF NOT (query_text ~* '^\s*(WITH|SELECT)') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Additional security check for dangerous keywords
  IF query_text ~* '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' THEN
    RAISE EXCEPTION 'Dangerous SQL keywords detected';
  END IF;

  -- Get query execution plan
  BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON, BUFFERS true) ' || query_text INTO execution_plan;

    -- Extract estimated cost
    estimated_cost := (execution_plan->0->>'Total Cost')::numeric;

    -- Block extremely expensive queries (cost > 100000)
    IF estimated_cost > 100000 THEN
      RAISE EXCEPTION 'Query too expensive (cost: %), please add filters or limits', estimated_cost;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If EXPLAIN fails, continue but log warning
      RAISE NOTICE 'Could not analyze query cost: %', SQLERRM;
      estimated_cost := 0;
  END;

  -- Set statement timeout for this query (30 seconds)
  SET LOCAL statement_timeout = '30s';

  -- Execute the query with row limit check
  BEGIN
    -- First check if query would return too many rows
    EXECUTE 'SELECT COUNT(*) FROM (' || query_text || ' LIMIT 10001) t' INTO row_count;

    IF row_count > 10000 THEN
      RAISE EXCEPTION 'Query would return too many rows (>10000), please add LIMIT clause';
    END IF;

    -- Execute the actual query
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;

    -- Get actual row count
    IF result IS NULL THEN
      row_count := 0;
    ELSE
      row_count := json_array_length(result);
    END IF;

  EXCEPTION
    WHEN statement_timeout THEN
      RAISE EXCEPTION 'Query timeout after 30 seconds';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
  END;

  -- Record end time
  end_time := clock_timestamp();
  execution_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  -- Return result with metadata
  RETURN json_build_object(
    'data', COALESCE(result, '[]'::json),
    'row_count', row_count,
    'execution_time', execution_time_ms,
    'estimated_cost', estimated_cost,
    'execution_plan', execution_plan
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'error', true,
      'message', SQLERRM,
      'data', '[]'::json,
      'row_count', 0,
      'execution_time', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql_query TO authenticated;

-- Add helpful indexes for common query patterns

-- Index for date-based queries on record_history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_record_history_time_desc
ON record_history (time DESC);

-- Index for product code lookups with inventory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_product_code_inventory
ON record_palletinfo (product_code)
WHERE plt_num IN (SELECT plt_num FROM record_inventory WHERE injection + pipeline + await + fold + bulk + backcarpark > 0);

-- Index for recent transfers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_tran_date_desc
ON record_transfer (tran_date DESC);

-- Index for order lookups by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_status_created
ON data_order (created_at DESC)
WHERE COALESCE(loaded_qty::integer, 0) < product_qty::integer;

-- Composite index for frequent JOIN pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_plt_num_product
ON record_palletinfo (plt_num, product_code);

-- Add comment
COMMENT ON FUNCTION execute_sql_query IS 'Execute SQL query with safety checks, cost control, and performance optimization';
