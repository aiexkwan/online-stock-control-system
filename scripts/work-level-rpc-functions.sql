-- RPC functions for work level statistics

-- Get operator performance statistics
CREATE OR REPLACE FUNCTION get_operator_performance(p_operator_id INT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  IF p_operator_id IS NULL THEN
    -- Get all operators' performance
    SELECT json_agg(
      json_build_object(
        'operator_id', wl.id,
        'operator_name', di.name,
        'qc_count', wl.qc,
        'move_count', wl.move,
        'grn_count', wl.grn,
        'total_operations', wl.qc + wl.move + wl.grn,
        'last_update', wl.latest_update
      ) ORDER BY (wl.qc + wl.move + wl.grn) DESC
    ) INTO result
    FROM work_level wl
    LEFT JOIN data_id di ON wl.id = di.id
    WHERE DATE(wl.latest_update) = CURRENT_DATE;
  ELSE
    -- Get specific operator's performance
    SELECT json_build_object(
      'operator_id', wl.id,
      'operator_name', di.name,
      'qc_count', wl.qc,
      'move_count', wl.move,
      'grn_count', wl.grn,
      'total_operations', wl.qc + wl.move + wl.grn,
      'last_update', wl.latest_update
    ) INTO result
    FROM work_level wl
    LEFT JOIN data_id di ON wl.id = di.id
    WHERE wl.id = p_operator_id
    AND DATE(wl.latest_update) = CURRENT_DATE;
  END IF;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Get top performers for a specific operation type
CREATE OR REPLACE FUNCTION get_top_performers(
  p_operation_type TEXT, -- 'qc', 'move', 'grn', or 'total'
  p_limit INT DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  CASE p_operation_type
    WHEN 'qc' THEN
      SELECT json_agg(
        json_build_object(
          'operator_id', wl.id,
          'operator_name', di.name,
          'count', wl.qc,
          'rank', ROW_NUMBER() OVER (ORDER BY wl.qc DESC)
        )
      ) INTO result
      FROM (
        SELECT * FROM work_level
        WHERE DATE(latest_update) = CURRENT_DATE
        ORDER BY qc DESC
        LIMIT p_limit
      ) wl
      LEFT JOIN data_id di ON wl.id = di.id;
      
    WHEN 'move' THEN
      SELECT json_agg(
        json_build_object(
          'operator_id', wl.id,
          'operator_name', di.name,
          'count', wl.move,
          'rank', ROW_NUMBER() OVER (ORDER BY wl.move DESC)
        )
      ) INTO result
      FROM (
        SELECT * FROM work_level
        WHERE DATE(latest_update) = CURRENT_DATE
        ORDER BY move DESC
        LIMIT p_limit
      ) wl
      LEFT JOIN data_id di ON wl.id = di.id;
      
    WHEN 'grn' THEN
      SELECT json_agg(
        json_build_object(
          'operator_id', wl.id,
          'operator_name', di.name,
          'count', wl.grn,
          'rank', ROW_NUMBER() OVER (ORDER BY wl.grn DESC)
        )
      ) INTO result
      FROM (
        SELECT * FROM work_level
        WHERE DATE(latest_update) = CURRENT_DATE
        ORDER BY grn DESC
        LIMIT p_limit
      ) wl
      LEFT JOIN data_id di ON wl.id = di.id;
      
    WHEN 'total' THEN
      SELECT json_agg(
        json_build_object(
          'operator_id', wl.id,
          'operator_name', di.name,
          'count', wl.qc + wl.move + wl.grn,
          'rank', ROW_NUMBER() OVER (ORDER BY (wl.qc + wl.move + wl.grn) DESC)
        )
      ) INTO result
      FROM (
        SELECT * FROM work_level
        WHERE DATE(latest_update) = CURRENT_DATE
        ORDER BY (qc + move + grn) DESC
        LIMIT p_limit
      ) wl
      LEFT JOIN data_id di ON wl.id = di.id;
      
    ELSE
      RAISE EXCEPTION 'Invalid operation type: %', p_operation_type;
  END CASE;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Get work level summary statistics
CREATE OR REPLACE FUNCTION get_work_level_summary()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH daily_stats AS (
    SELECT
      COUNT(DISTINCT id) as active_operators,
      SUM(qc) as total_qc,
      SUM(move) as total_moves,
      SUM(grn) as total_grn,
      SUM(qc + move + grn) as total_operations,
      AVG(qc) as avg_qc_per_operator,
      AVG(move) as avg_moves_per_operator,
      AVG(grn) as avg_grn_per_operator
    FROM work_level
    WHERE DATE(latest_update) = CURRENT_DATE
  )
  SELECT json_build_object(
    'date', CURRENT_DATE,
    'active_operators', COALESCE(active_operators, 0),
    'total_qc', COALESCE(total_qc, 0),
    'total_moves', COALESCE(total_moves, 0),
    'total_grn', COALESCE(total_grn, 0),
    'total_operations', COALESCE(total_operations, 0),
    'avg_qc_per_operator', ROUND(COALESCE(avg_qc_per_operator, 0)),
    'avg_moves_per_operator', ROUND(COALESCE(avg_moves_per_operator, 0)),
    'avg_grn_per_operator', ROUND(COALESCE(avg_grn_per_operator, 0))
  ) INTO result
  FROM daily_stats;
  
  RETURN result;
END;
$$;

-- Get GRN summary from grn_level table
CREATE OR REPLACE FUNCTION get_grn_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'grn_ref', grn_ref,
      'total_gross', total_gross,
      'total_net', total_net,
      'total_units', total_unit,
      'last_update', latest_update
    ) ORDER BY grn_ref DESC
  ) INTO result
  FROM grn_level
  WHERE DATE(latest_update) >= p_start_date
  AND DATE(latest_update) <= p_end_date;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Get stock levels with low inventory alert
CREATE OR REPLACE FUNCTION get_stock_levels_with_alerts(
  p_threshold BIGINT DEFAULT 100
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'product_code', stock,
      'description', description,
      'stock_level', stock_level,
      'is_low', stock_level < p_threshold,
      'last_update', update_time
    ) ORDER BY 
      CASE WHEN stock_level < p_threshold THEN 0 ELSE 1 END,
      stock_level ASC
  ) INTO result
  FROM stock_level
  WHERE stock_level IS NOT NULL;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_operator_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performers TO authenticated;
GRANT EXECUTE ON FUNCTION get_work_level_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_grn_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_levels_with_alerts TO authenticated;