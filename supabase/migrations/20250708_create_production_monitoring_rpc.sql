-- Migration: Create Production Monitoring RPC Functions
-- Created: 2025-07-08
-- Purpose: Support migration from GraphQL widgets to Server Actions

-- 1. Production Statistics RPC
CREATE OR REPLACE FUNCTION rpc_get_production_stats(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '1 day',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_metric TEXT DEFAULT 'pallet_count'
) RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  -- Input validation
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be later than end date';
  END IF;

  IF p_metric NOT IN ('pallet_count', 'quantity_sum') THEN
    RAISE EXCEPTION 'Invalid metric. Use pallet_count or quantity_sum';
  END IF;

  -- Calculate statistics based on metric type
  IF p_metric = 'pallet_count' THEN
    SELECT COUNT(*)
    INTO result
    FROM record_palletinfo
    WHERE plt_remark ILIKE '%finished in production%'
    AND generate_time >= p_start_date
    AND generate_time <= p_end_date;
  ELSE
    SELECT COALESCE(SUM(CAST(product_qty AS BIGINT)), 0)
    INTO result
    FROM record_palletinfo
    WHERE plt_remark ILIKE '%finished in production%'
    AND generate_time >= p_start_date
    AND generate_time <= p_end_date;
  END IF;

  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return 0 for graceful degradation
    RAISE LOG 'Error in rpc_get_production_stats: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Product Distribution RPC
CREATE OR REPLACE FUNCTION rpc_get_product_distribution(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '1 day',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  name TEXT,
  value BIGINT
) AS $$
BEGIN
  -- Input validation
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be later than end date';
  END IF;

  IF p_limit <= 0 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 100';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(product_code, 'Unknown')::TEXT as name,
    COALESCE(SUM(CAST(product_qty AS BIGINT)), 0) as value
  FROM record_palletinfo
  WHERE plt_remark ILIKE '%finished in production%'
  AND generate_time >= p_start_date
  AND generate_time <= p_end_date
  AND product_code IS NOT NULL
  GROUP BY product_code
  HAVING SUM(CAST(product_qty AS BIGINT)) > 0
  ORDER BY SUM(CAST(product_qty AS BIGINT)) DESC
  LIMIT p_limit;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty result set
    RAISE LOG 'Error in rpc_get_product_distribution: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Top Products RPC (alias of product distribution)
CREATE OR REPLACE FUNCTION rpc_get_top_products(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '1 day',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  name TEXT,
  value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM rpc_get_product_distribution(p_start_date, p_end_date, p_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Production Details RPC
CREATE OR REPLACE FUNCTION rpc_get_production_details(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '1 day',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE(
  plt_num TEXT,
  product_code TEXT,
  product_qty INTEGER,
  qc_by TEXT,
  generate_time TIMESTAMP
) AS $$
BEGIN
  -- Input validation
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be later than end date';
  END IF;

  IF p_limit <= 0 OR p_limit > 500 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 500';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(p.plt_num, 'N/A')::TEXT,
    COALESCE(p.product_code, 'N/A')::TEXT,
    COALESCE(CAST(p.product_qty AS INTEGER), 0),
    COALESCE(d.name, 'N/A')::TEXT as qc_by,
    p.generate_time
  FROM record_palletinfo p
  LEFT JOIN (
    -- Get the most recent QC record for each pallet
    SELECT DISTINCT ON (plt_num)
      plt_num,
      id,
      time
    FROM record_history
    WHERE action = 'Finished QC'
    AND time >= p_start_date
    AND time <= p_end_date
    ORDER BY plt_num, time DESC
  ) h ON p.plt_num = h.plt_num
  LEFT JOIN data_id d ON h.id = d.id
  WHERE p.plt_remark ILIKE '%finished in production%'
  AND p.generate_time >= p_start_date
  AND p.generate_time <= p_end_date
  ORDER BY p.generate_time DESC
  LIMIT p_limit;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty result set
    RAISE LOG 'Error in rpc_get_production_details: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Staff Workload RPC
CREATE OR REPLACE FUNCTION rpc_get_staff_workload(
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_department TEXT DEFAULT 'Injection'
) RETURNS TABLE(
  work_date DATE,
  staff_name TEXT,
  action_count BIGINT
) AS $$
BEGIN
  -- Input validation
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be later than end date';
  END IF;

  IF p_department IS NULL OR LENGTH(TRIM(p_department)) = 0 THEN
    RAISE EXCEPTION 'Department cannot be empty';
  END IF;

  RETURN QUERY
  SELECT
    h.time::DATE as work_date,
    COALESCE(d.name, 'Unknown')::TEXT as staff_name,
    COUNT(*)::BIGINT as action_count
  FROM record_history h
  JOIN data_id d ON h.id = d.id
  WHERE d.department = p_department
  AND h.time >= p_start_date
  AND h.time <= p_end_date
  AND d.name IS NOT NULL
  GROUP BY h.time::DATE, d.name, d.id
  HAVING COUNT(*) > 0
  ORDER BY h.time::DATE DESC, d.name;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty result set
    RAISE LOG 'Error in rpc_get_staff_workload: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_production_stats
ON record_palletinfo (generate_time, plt_remark)
WHERE plt_remark ILIKE '%finished in production%';

CREATE INDEX IF NOT EXISTS idx_record_history_workload
ON record_history (time, id, action);

CREATE INDEX IF NOT EXISTS idx_data_id_department
ON data_id (department, name) WHERE department IS NOT NULL;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION rpc_get_production_stats TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_product_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_top_products TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_production_details TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_staff_workload TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION rpc_get_production_stats IS 'Get production statistics (pallet count or quantity sum) for a given time period';
COMMENT ON FUNCTION rpc_get_product_distribution IS 'Get product distribution statistics showing top products by quantity';
COMMENT ON FUNCTION rpc_get_top_products IS 'Alias for product distribution - get top products by quantity';
COMMENT ON FUNCTION rpc_get_production_details IS 'Get detailed production records with QC operator information';
COMMENT ON FUNCTION rpc_get_staff_workload IS 'Get staff workload statistics by department for a given time period';
