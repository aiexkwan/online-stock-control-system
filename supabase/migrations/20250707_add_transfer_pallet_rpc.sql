-- Create RPC function for atomic pallet transfer
CREATE OR REPLACE FUNCTION rpc_transfer_pallet(
  p_pallet_num TEXT,
  p_to_location TEXT,
  p_user_id INTEGER,
  p_user_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_code TEXT;
  v_product_qty INTEGER;
  v_from_location TEXT;
  v_transfer_id UUID;
  v_current_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set current timestamp
  v_current_time := NOW();
  v_transfer_id := gen_random_uuid();

  -- Get pallet information with lock
  SELECT product_code, product_qty, current_plt_loc
  INTO v_product_code, v_product_qty, v_from_location
  FROM data_product
  WHERE plt_num = p_pallet_num
  FOR UPDATE;

  -- Check if pallet exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pallet not found',
      'error', 'PALLET_NOT_FOUND'
    );
  END IF;

  -- Check if already at destination
  IF v_from_location = p_to_location THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pallet is already at location ' || p_to_location,
      'error', 'ALREADY_AT_LOCATION'
    );
  END IF;

  -- Update pallet location
  UPDATE data_product
  SET
    current_plt_loc = p_to_location,
    plt_remark = 'Transferred to ' || p_to_location || ' by ' || p_user_name || ' at ' || v_current_time::TEXT
  WHERE plt_num = p_pallet_num;

  -- Insert transfer history
  INSERT INTO record_history (
    time,
    id,
    action,
    plt_num,
    loc,
    remark
  ) VALUES (
    v_current_time,
    p_user_id,
    'Transfer',
    p_pallet_num,
    p_to_location,
    'Transfer from ' || COALESCE(v_from_location, 'Unknown') || ' to ' || p_to_location || ' by ' || p_user_name
  );

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Transfer completed successfully',
    'product_code', v_product_code,
    'product_qty', v_product_qty,
    'from_location', v_from_location,
    'transfer_id', v_transfer_id::TEXT
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Transfer failed for pallet %: %', p_pallet_num, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Transfer failed due to system error',
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rpc_transfer_pallet TO authenticated;

-- Add comment
COMMENT ON FUNCTION rpc_transfer_pallet IS 'Atomically transfer a pallet to a new location with full transaction support';
