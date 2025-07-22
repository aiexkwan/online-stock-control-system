-- RPC function for calculating still-in-await percentage
-- Optimized server-side calculation to replace client-side aggregation

CREATE OR REPLACE FUNCTION rpc_get_await_percentage_stats(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pallets INTEGER := 0;
  v_still_await INTEGER := 0;
  v_percentage NUMERIC := 0;
  v_result JSON;
BEGIN
  -- Get total pallets generated in the time range
  SELECT COUNT(*)
  INTO v_total_pallets
  FROM record_palletinfo
  WHERE generate_time >= p_start_date
    AND generate_time <= p_end_date;

  -- If no pallets, return zero stats
  IF v_total_pallets = 0 THEN
    SELECT json_build_object(
      'total_pallets', 0,
      'still_await', 0,
      'percentage', 0,
      'calculation_time', NOW(),
      'date_range', json_build_object(
        'start', p_start_date,
        'end', p_end_date
      )
    ) INTO v_result;

    RETURN v_result;
  END IF;

  -- Calculate pallets still in await using optimized query
  WITH pallet_latest_locations AS (
    SELECT DISTINCT ON (rh.plt_num)
      rh.plt_num,
      rh.loc as latest_location
    FROM record_history rh
    INNER JOIN record_palletinfo rpi ON rh.plt_num = rpi.plt_num
    WHERE rpi.generate_time >= p_start_date
      AND rpi.generate_time <= p_end_date
    ORDER BY rh.plt_num, rh.time DESC
  )
  SELECT COUNT(*)
  INTO v_still_await
  FROM pallet_latest_locations
  WHERE latest_location IN ('Await', 'Awaiting');

  -- Calculate percentage
  v_percentage := CASE
    WHEN v_total_pallets > 0 THEN
      ROUND((v_still_await::NUMERIC / v_total_pallets::NUMERIC) * 100, 2)
    ELSE 0
  END;

  -- Build result JSON
  SELECT json_build_object(
    'total_pallets', v_total_pallets,
    'still_await', v_still_await,
    'percentage', v_percentage,
    'calculation_time', NOW(),
    'date_range', json_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'performance', json_build_object(
      'optimized', true,
      'single_query', true,
      'server_calculated', true
    )
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error information
  SELECT json_build_object(
    'error', true,
    'message', SQLERRM,
    'total_pallets', 0,
    'still_await', 0,
    'percentage', 0
  ) INTO v_result;

  RETURN v_result;
END;
$$;
