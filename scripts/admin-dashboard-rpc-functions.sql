-- RPC function to get all dashboard statistics in one query
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  today_start TIMESTAMP := CURRENT_DATE;
  today_end TIMESTAMP := CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second';
  yesterday_start TIMESTAMP := CURRENT_DATE - INTERVAL '1 day';
  yesterday_end TIMESTAMP := CURRENT_DATE - INTERVAL '1 second';
  past_3_days_start TIMESTAMP := CURRENT_DATE - INTERVAL '3 days';
  past_7_days_start TIMESTAMP := CURRENT_DATE - INTERVAL '7 days';
  
  result JSON;
BEGIN
  WITH pallet_stats AS (
    SELECT
      -- Today's pallets
      COUNT(CASE 
        WHEN generate_time >= today_start AND generate_time <= today_end 
        AND plt_remark NOT ILIKE '%Material GRN-%'
        THEN 1 
      END) AS today_generated,
      
      -- Yesterday's pallets
      COUNT(CASE 
        WHEN generate_time >= yesterday_start AND generate_time < today_start 
        AND plt_remark NOT ILIKE '%Material GRN-%'
        THEN 1 
      END) AS yesterday_generated,
      
      -- Past 3 days pallets
      COUNT(CASE 
        WHEN generate_time >= past_3_days_start 
        AND plt_remark NOT ILIKE '%Material GRN-%'
        THEN 1 
      END) AS past_3_days_generated,
      
      -- Past 7 days pallets
      COUNT(CASE 
        WHEN generate_time >= past_7_days_start 
        AND plt_remark NOT ILIKE '%Material GRN-%'
        THEN 1 
      END) AS past_7_days_generated
    FROM record_palletinfo
  ),
  transfer_stats AS (
    SELECT
      -- Today's transfers
      COUNT(DISTINCT CASE 
        WHEN rt.time >= today_start AND rt.time <= today_end 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
        THEN rt.plt_num 
      END) AS today_transferred,
      
      -- Yesterday's transfers
      COUNT(DISTINCT CASE 
        WHEN rt.time >= yesterday_start AND rt.time < today_start 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
        THEN rt.plt_num 
      END) AS yesterday_transferred,
      
      -- Past 3 days transfers
      COUNT(DISTINCT CASE 
        WHEN rt.time >= past_3_days_start 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
        THEN rt.plt_num 
      END) AS past_3_days_transferred,
      
      -- Past 7 days transfers
      COUNT(DISTINCT CASE 
        WHEN rt.time >= past_7_days_start 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
        THEN rt.plt_num 
      END) AS past_7_days_transferred
    FROM record_transfer rt
    INNER JOIN record_palletinfo rp ON rt.plt_num = rp.plt_num
  )
  SELECT json_build_object(
    'dailyDonePallets', ps.today_generated,
    'dailyTransferredPallets', ts.today_transferred,
    'yesterdayDonePallets', ps.yesterday_generated,
    'yesterdayTransferredPallets', ts.yesterday_transferred,
    'past3DaysGenerated', ps.past_3_days_generated,
    'past3DaysTransferredPallets', ts.past_3_days_transferred,
    'past7DaysGenerated', ps.past_7_days_generated,
    'past7DaysTransferredPallets', ts.past_7_days_transferred
  ) INTO result
  FROM pallet_stats ps, transfer_stats ts;
  
  RETURN result;
END;
$$;

-- RPC function to get stats for specific time range
CREATE OR REPLACE FUNCTION get_time_range_stats(time_range TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  result JSON;
BEGIN
  -- Set time range
  CASE time_range
    WHEN 'today' THEN
      start_time := CURRENT_DATE;
      end_time := CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second';
    WHEN 'yesterday' THEN
      start_time := CURRENT_DATE - INTERVAL '1 day';
      end_time := CURRENT_DATE - INTERVAL '1 second';
    WHEN 'past3days' THEN
      start_time := CURRENT_DATE - INTERVAL '3 days';
      end_time := CURRENT_TIMESTAMP;
    WHEN 'past7days' THEN
      start_time := CURRENT_DATE - INTERVAL '7 days';
      end_time := CURRENT_TIMESTAMP;
    ELSE
      RAISE EXCEPTION 'Invalid time range: %', time_range;
  END CASE;

  WITH stats AS (
    SELECT
      COUNT(DISTINCT rp.plt_num) FILTER (
        WHERE rp.generate_time >= start_time 
        AND rp.generate_time <= end_time 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
      ) AS generated,
      COUNT(DISTINCT rt.plt_num) FILTER (
        WHERE rt.time >= start_time 
        AND rt.time <= end_time 
        AND rp.plt_remark NOT ILIKE '%Material GRN-%'
      ) AS transferred
    FROM record_palletinfo rp
    LEFT JOIN record_transfer rt ON rp.plt_num = rt.plt_num
  )
  SELECT json_build_object(
    'generated', COALESCE(generated, 0),
    'transferred', COALESCE(transferred, 0)
  ) INTO result
  FROM stats;
  
  RETURN result;
END;
$$;

-- RPC function to search inventory by product code
-- Updated to use stock_level table for total and record_inventory for location breakdown
CREATE OR REPLACE FUNCTION search_inventory_by_product(p_product_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  v_total BIGINT;
  v_description TEXT;
BEGIN
  -- First check if product exists in stock_level
  SELECT stock_level, description 
  INTO v_total, v_description
  FROM stock_level
  WHERE stock = p_product_code;
  
  IF NOT FOUND THEN
    -- Product not found, return zeros
    RETURN json_build_object(
      'product_code', p_product_code,
      'description', NULL,
      'injection', 0,
      'pipeline', 0,
      'await', 0,
      'await_grn', 0,
      'fold', 0,
      'bulk', 0,
      'backcarpark', 0,
      'damage', 0,
      'total', 0,
      'last_updated', NULL
    );
  END IF;
  
  -- Get location breakdown from record_inventory
  SELECT json_build_object(
    'product_code', p_product_code,
    'description', v_description,
    'injection', COALESCE(SUM(injection), 0),
    'pipeline', COALESCE(SUM(pipeline), 0),
    'await', COALESCE(SUM(await), 0),
    'await_grn', COALESCE(SUM(await_grn), 0),
    'fold', COALESCE(SUM(fold), 0),
    'bulk', COALESCE(SUM(bulk), 0),
    'backcarpark', COALESCE(SUM(backcarpark), 0),
    'damage', COALESCE(SUM(damage), 0),
    'total', v_total,  -- Use pre-calculated total from stock_level
    'last_updated', (SELECT MAX(latest_update) FROM record_inventory WHERE product_code = p_product_code)
  ) INTO result
  FROM record_inventory
  WHERE product_code = p_product_code;
  
  RETURN result;
END;
$$;

-- RPC function to get void statistics
CREATE OR REPLACE FUNCTION get_void_statistics(time_range TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  start_time TIMESTAMP;
  result JSON;
BEGIN
  -- Set time range
  CASE time_range
    WHEN 'today' THEN
      start_time := CURRENT_DATE;
    WHEN 'week' THEN
      start_time := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'month' THEN
      start_time := CURRENT_DATE - INTERVAL '30 days';
    ELSE
      start_time := CURRENT_DATE;
  END CASE;

  WITH void_stats AS (
    SELECT
      COUNT(*) AS count,
      json_agg(
        json_build_object(
          'plt_num', plt_num,
          'time', time,
          'remark', remark
        ) ORDER BY time DESC
      ) AS pallets
    FROM record_history
    WHERE action = 'Void'
    AND time >= start_time
  )
  SELECT json_build_object(
    'count', COALESCE(count, 0),
    'pallets', COALESCE(pallets, '[]'::json)
  ) INTO result
  FROM void_stats;
  
  RETURN result;
END;
$$;

-- Create materialized view for faster stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_pallet_stats AS
SELECT 
  DATE(generate_time) as date,
  COUNT(*) FILTER (WHERE plt_remark NOT ILIKE '%Material GRN-%') as pallets_generated,
  COUNT(DISTINCT plt_num) FILTER (WHERE plt_remark NOT ILIKE '%Material GRN-%') as unique_pallets
FROM record_palletinfo
GROUP BY DATE(generate_time)
WITH DATA;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mv_daily_pallet_stats_date 
ON mv_daily_pallet_stats(date DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_pallet_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_time_range_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_inventory_by_product TO authenticated;
GRANT EXECUTE ON FUNCTION get_void_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_daily_stats TO authenticated;