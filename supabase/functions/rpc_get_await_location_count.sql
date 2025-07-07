-- RPC function for getting current await location pallet count
-- Optimized to replace the fallback client-side processing

CREATE OR REPLACE FUNCTION rpc_get_await_location_count()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_await_count INTEGER := 0;
  v_result JSON;
BEGIN
  -- Get count of pallets currently in Await locations
  -- Uses optimized query with DISTINCT ON to get latest location per pallet
  WITH pallet_latest_locations AS (
    SELECT DISTINCT ON (plt_num) 
      plt_num,
      loc as latest_location
    FROM record_history
    WHERE plt_num IS NOT NULL
    ORDER BY plt_num, time DESC
  )
  SELECT COUNT(*) 
  INTO v_await_count
  FROM pallet_latest_locations 
  WHERE latest_location IN ('Await', 'Awaiting');
  
  -- Build result JSON with metadata
  SELECT json_build_object(
    'await_count', v_await_count,
    'calculation_time', NOW(),
    'method', 'optimized_rpc',
    'performance', json_build_object(
      'single_query', true,
      'server_calculated', true,
      'optimized', true
    )
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  SELECT json_build_object(
    'error', true,
    'message', SQLERRM,
    'await_count', 0
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;