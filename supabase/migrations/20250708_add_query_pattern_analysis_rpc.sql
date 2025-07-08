-- Migration: Add query pattern analysis RPC function
-- Created: 2025-07-08
-- Purpose: Support cache performance analysis

-- Create function to get top query patterns
CREATE OR REPLACE FUNCTION get_top_query_patterns(
  days_back INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  pattern TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fuzzy_hash, SUBSTRING(query_hash, 1, 16)) as pattern,
    COUNT(*)::BIGINT as count
  FROM query_record
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    AND (fuzzy_hash IS NOT NULL OR query_hash IS NOT NULL)
  GROUP BY COALESCE(fuzzy_hash, SUBSTRING(query_hash, 1, 16))
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top_query_patterns TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_top_query_patterns IS 'Get top query patterns for cache analysis';