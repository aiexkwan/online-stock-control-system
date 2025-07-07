-- ================================
-- RPC Function: rpc_get_orders_list
-- Purpose: Optimized query for Orders List Widget with joined user names
-- Author: Phase 3.1 Migration
-- Date: 2025-07-07
-- ================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.rpc_get_orders_list;

-- Create optimized RPC function for orders list
CREATE OR REPLACE FUNCTION public.rpc_get_orders_list(
  p_limit INT DEFAULT 15,
  p_offset INT DEFAULT 0
) 
RETURNS TABLE (
  uuid UUID,
  "time" TIMESTAMPTZ,
  id INT,
  action TEXT,
  plt_num TEXT,
  loc TEXT,
  remark TEXT,
  uploader_name TEXT,
  doc_url TEXT,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH order_records AS (
    SELECT 
      rh.uuid,
      rh."time",
      rh.id,
      rh.action,
      rh.plt_num,
      rh.loc,
      rh.remark,
      COALESCE(di.name, 
        CASE 
          WHEN rh.id IS NOT NULL THEN 'User ' || rh.id::TEXT 
          ELSE 'Unknown' 
        END
      ) as uploader_name,
      -- Pre-fetch related PDF URL (optimized subquery)
      (
        SELECT du.doc_url 
        FROM doc_upload du 
        WHERE du.doc_name ILIKE '%' || rh.remark || '%' 
          AND du.doc_type = 'order'
        ORDER BY du.created_at DESC
        LIMIT 1
      ) as doc_url,
      COUNT(*) OVER() as total_count
    FROM record_history rh
    LEFT JOIN data_id di ON rh.id = di.id
    WHERE rh.action = 'Order Upload'
    ORDER BY rh."time" DESC
  )
  SELECT * FROM order_records
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes to optimize the function
CREATE INDEX IF NOT EXISTS idx_record_history_action_time 
  ON record_history(action, "time" DESC) 
  WHERE action = 'Order Upload';

-- Use btree index with text pattern ops instead of gin for better compatibility
CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_name_pattern 
  ON doc_upload(doc_name text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_type_time 
  ON doc_upload(doc_type, created_at DESC);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_get_orders_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_orders_list TO service_role;

-- Add function comment
COMMENT ON FUNCTION public.rpc_get_orders_list IS 
'Optimized function to fetch order upload history with user names and PDF URLs. 
Returns paginated results with total count for efficient real-time updates.
Used by OrdersListWidget for Phase 3.1 migration.';

-- Test query
-- SELECT * FROM rpc_get_orders_list(15, 0);