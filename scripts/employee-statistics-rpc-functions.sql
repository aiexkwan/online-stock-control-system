-- RPC functions for employee statistics using work_level table

-- Get employee daily performance
CREATE OR REPLACE FUNCTION get_employee_daily_performance(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'employee_id', wl.id,
      'employee_name', di.name,
      'qc_count', wl.qc,
      'move_count', wl.move,
      'grn_count', wl.grn,
      'total_operations', wl.qc + wl.move + wl.grn,
      'last_update', wl.latest_update,
      'productivity_score',
        CASE
          WHEN (wl.qc + wl.move + wl.grn) >= 100 THEN 'High'
          WHEN (wl.qc + wl.move + wl.grn) >= 50 THEN 'Medium'
          ELSE 'Low'
        END
    ) ORDER BY (wl.qc + wl.move + wl.grn) DESC
  ) INTO result
  FROM work_level wl
  LEFT JOIN data_id di ON wl.id = di.id
  WHERE DATE(wl.latest_update) = p_date;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Get employee performance summary for date range
CREATE OR REPLACE FUNCTION get_employee_performance_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_employee_id INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  IF p_employee_id IS NULL THEN
    -- Get all employees' summary
    WITH daily_work AS (
      SELECT
        id,
        DATE(latest_update) as work_date,
        qc,
        move,
        grn
      FROM work_level
      WHERE DATE(latest_update) BETWEEN p_start_date AND p_end_date
    ),
    employee_summary AS (
      SELECT
        dw.id,
        di.name,
        COUNT(DISTINCT work_date) as days_worked,
        SUM(qc) as total_qc,
        SUM(move) as total_moves,
        SUM(grn) as total_grn,
        SUM(qc + move + grn) as total_operations,
        AVG(qc + move + grn) as avg_daily_operations
      FROM daily_work dw
      LEFT JOIN data_id di ON dw.id = di.id
      GROUP BY dw.id, di.name
    )
    SELECT json_agg(
      json_build_object(
        'employee_id', id,
        'employee_name', name,
        'days_worked', days_worked,
        'total_qc', total_qc,
        'total_moves', total_moves,
        'total_grn', total_grn,
        'total_operations', total_operations,
        'avg_daily_operations', ROUND(avg_daily_operations, 2)
      ) ORDER BY total_operations DESC
    ) INTO result
    FROM employee_summary;
  ELSE
    -- Get specific employee's daily breakdown
    SELECT json_agg(
      json_build_object(
        'date', DATE(wl.latest_update),
        'qc_count', wl.qc,
        'move_count', wl.move,
        'grn_count', wl.grn,
        'total_operations', wl.qc + wl.move + wl.grn
      ) ORDER BY DATE(wl.latest_update) DESC
    ) INTO result
    FROM work_level wl
    WHERE wl.id = p_employee_id
    AND DATE(wl.latest_update) BETWEEN p_start_date AND p_end_date;
  END IF;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Get department/team performance (assuming employees can be grouped)
CREATE OR REPLACE FUNCTION get_team_performance_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH current_stats AS (
    SELECT
      COUNT(DISTINCT id) as active_employees,
      SUM(qc) as total_qc,
      SUM(move) as total_moves,
      SUM(grn) as total_grn,
      AVG(qc + move + grn) as avg_operations_per_employee,
      MAX(qc + move + grn) as max_operations,
      MIN(qc + move + grn) as min_operations
    FROM work_level
    WHERE DATE(latest_update) = CURRENT_DATE
  )
  SELECT json_build_object(
    'date', CURRENT_DATE,
    'active_employees', COALESCE(active_employees, 0),
    'total_qc', COALESCE(total_qc, 0),
    'total_moves', COALESCE(total_moves, 0),
    'total_grn', COALESCE(total_grn, 0),
    'avg_operations_per_employee', ROUND(COALESCE(avg_operations_per_employee, 0), 2),
    'max_operations', COALESCE(max_operations, 0),
    'min_operations', COALESCE(min_operations, 0),
    'efficiency_score',
      CASE
        WHEN COALESCE(avg_operations_per_employee, 0) >= 80 THEN 'Excellent'
        WHEN COALESCE(avg_operations_per_employee, 0) >= 60 THEN 'Good'
        WHEN COALESCE(avg_operations_per_employee, 0) >= 40 THEN 'Average'
        ELSE 'Needs Improvement'
      END
  ) INTO result
  FROM current_stats;

  RETURN result;
END;
$$;

-- Get operation type breakdown for analytics
CREATE OR REPLACE FUNCTION get_operation_type_analytics(
  p_days_back INT DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH operation_stats AS (
    SELECT
      DATE(latest_update) as operation_date,
      SUM(qc) as daily_qc,
      SUM(move) as daily_moves,
      SUM(grn) as daily_grn,
      SUM(qc + move + grn) as daily_total
    FROM work_level
    WHERE DATE(latest_update) >= CURRENT_DATE - (p_days_back || ' days')::INTERVAL
    GROUP BY DATE(latest_update)
    ORDER BY DATE(latest_update)
  )
  SELECT json_agg(
    json_build_object(
      'date', operation_date,
      'qc', daily_qc,
      'moves', daily_moves,
      'grn', daily_grn,
      'total', daily_total,
      'qc_percentage', CASE WHEN daily_total > 0 THEN ROUND((daily_qc::DECIMAL / daily_total) * 100, 2) ELSE 0 END,
      'move_percentage', CASE WHEN daily_total > 0 THEN ROUND((daily_moves::DECIMAL / daily_total) * 100, 2) ELSE 0 END,
      'grn_percentage', CASE WHEN daily_total > 0 THEN ROUND((daily_grn::DECIMAL / daily_total) * 100, 2) ELSE 0 END
    )
  ) INTO result
  FROM operation_stats;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_employee_daily_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_performance_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_operation_type_analytics TO authenticated;

-- Create indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_work_level_date ON work_level(DATE(latest_update));
CREATE INDEX IF NOT EXISTS idx_work_level_id_date ON work_level(id, DATE(latest_update));
