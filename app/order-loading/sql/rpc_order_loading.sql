-- RPC Functions for Order Loading System
-- These functions ensure atomic transactions for all order loading operations

-- Function 1: Atomic Pallet Loading
CREATE OR REPLACE FUNCTION rpc_load_pallet_to_order(
  p_order_ref TEXT,
  p_pallet_input TEXT,
  p_user_id INT DEFAULT 0,
  p_user_name TEXT DEFAULT 'System'
) RETURNS JSON AS $$
DECLARE
  v_pallet_num TEXT;
  v_product_code TEXT;
  v_quantity INT;
  v_current_loaded INT;
  v_order_qty INT;
  v_stock_level BIGINT;
  v_location TEXT;
  v_is_series BOOLEAN;
  v_existing_load RECORD;
BEGIN
  -- Determine if input is pallet number or series
  v_is_series := p_pallet_input LIKE '%-%';
  
  -- Get pallet information
  IF v_is_series THEN
    -- For series, get the first available pallet
    SELECT plt_num, product_code, product_qty::INT 
    INTO v_pallet_num, v_product_code, v_quantity
    FROM record_palletinfo 
    WHERE series = p_pallet_input
    ORDER BY plt_num
    LIMIT 1;
  ELSE
    -- Direct pallet number
    SELECT plt_num, product_code, product_qty::INT 
    INTO v_pallet_num, v_product_code, v_quantity
    FROM record_palletinfo 
    WHERE plt_num = p_pallet_input;
  END IF;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NOT_FOUND',
      'message', format('Pallet or series not found: %s', p_pallet_input)
    );
  END IF;
  
  -- Check if pallet already loaded
  SELECT * INTO v_existing_load
  FROM record_history
  WHERE plt_num = v_pallet_num 
  AND action = 'Order Load'
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_LOADED',
      'message', format('This pallet has already been loaded! Pallet: %s', v_pallet_num)
    );
  END IF;
  
  -- Check if product exists in order
  SELECT loaded_qty::INT, product_qty::INT
  INTO v_current_loaded, v_order_qty
  FROM data_order
  WHERE order_ref = p_order_ref 
  AND product_code = v_product_code
  FOR UPDATE; -- Lock the row
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PRODUCT_NOT_IN_ORDER',
      'message', format('Product %s is not in order %s', v_product_code, p_order_ref)
    );
  END IF;
  
  -- Check if exceeding order quantity
  IF v_current_loaded + v_quantity > v_order_qty THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EXCEED_ORDER_QTY',
      'message', format('Exceeds order quantity! Requested: %s, Already loaded: %s, This pallet: %s', 
                       v_order_qty, v_current_loaded, v_quantity)
    );
  END IF;
  
  -- Get pallet location from history
  SELECT COALESCE(loc, 'injection') INTO v_location
  FROM record_history
  WHERE plt_num = v_pallet_num
  AND loc IS NOT NULL
  AND loc != 'null'
  ORDER BY time DESC
  LIMIT 1;
  
  -- Default location if not found
  v_location := COALESCE(v_location, 'injection');
  
  -- Start atomic updates
  
  -- 1. Update order loaded quantity
  UPDATE data_order 
  SET loaded_qty = (v_current_loaded + v_quantity)::TEXT
  WHERE order_ref = p_order_ref 
  AND product_code = v_product_code;
  
  -- 2. Record in history
  INSERT INTO record_history (
    time, id, action, plt_num, loc, remark
  ) VALUES (
    NOW(), 
    p_user_id,
    'Order Load', 
    v_pallet_num,
    NULL,
    format('Order: %s, Product: %s, Qty: %s, Action: Load by %s', 
           p_order_ref, v_product_code, v_quantity, p_user_name)
  );
  
  -- 3. Update pallet remark
  UPDATE record_palletinfo
  SET plt_remark = COALESCE(plt_remark, '') || 
                   CASE WHEN plt_remark IS NOT NULL AND plt_remark != '' 
                        THEN '; ' 
                        ELSE '' 
                   END || 
                   format('loaded to %s', p_order_ref)
  WHERE plt_num = v_pallet_num;
  
  -- 4. Update stock level
  SELECT stock_level INTO v_stock_level
  FROM stock_level
  WHERE stock = v_product_code
  FOR UPDATE;
  
  IF FOUND THEN
    UPDATE stock_level 
    SET stock_level = v_stock_level - v_quantity,
        update_time = NOW()
    WHERE stock = v_product_code;
  END IF;
  
  -- 5. Create inventory record (deduction)
  INSERT INTO record_inventory (
    product_code, plt_num, latest_update,
    injection, pipeline, prebook, await, fold, bulk, backcarpark
  ) VALUES (
    v_product_code, v_pallet_num, NOW(),
    CASE WHEN v_location = 'injection' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'pipeline' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'prebook' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'await' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'fold' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'bulk' THEN -v_quantity ELSE 0 END,
    CASE WHEN v_location = 'backcarpark' THEN -v_quantity ELSE 0 END
  );
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', format('Successfully loaded pallet %s', v_pallet_num),
    'data', json_build_object(
      'palletNumber', v_pallet_num,
      'productCode', v_product_code,
      'productQty', v_quantity,
      'updatedLoadedQty', v_current_loaded + v_quantity
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback all changes
    RETURN json_build_object(
      'success', false,
      'error', 'SYSTEM_ERROR',
      'message', format('System error: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql;

-- Function 2: Atomic Pallet Unloading (Undo)
CREATE OR REPLACE FUNCTION rpc_undo_load_pallet(
  p_order_ref TEXT,
  p_pallet_num TEXT,
  p_product_code TEXT,
  p_quantity INT,
  p_user_id INT DEFAULT 0,
  p_user_name TEXT DEFAULT 'System'
) RETURNS JSON AS $$
DECLARE
  v_current_loaded INT;
  v_stock_level BIGINT;
  v_location TEXT;
  v_load_record RECORD;
BEGIN
  -- Get current loaded quantity
  SELECT loaded_qty::INT INTO v_current_loaded
  FROM data_order
  WHERE order_ref = p_order_ref 
  AND product_code = p_product_code
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Order item not found'
    );
  END IF;
  
  -- Calculate new loaded quantity
  v_current_loaded := GREATEST(0, v_current_loaded - p_quantity);
  
  -- Get original location from history
  SELECT COALESCE(loc, 'injection') INTO v_location
  FROM record_history
  WHERE plt_num = p_pallet_num
  AND action != 'Order Load'
  AND action != 'Order Unload'
  AND loc IS NOT NULL
  AND loc != 'null'
  ORDER BY time DESC
  LIMIT 1;
  
  v_location := COALESCE(v_location, 'injection');
  
  -- Start atomic updates
  
  -- 1. Update order loaded quantity
  UPDATE data_order 
  SET loaded_qty = v_current_loaded::TEXT
  WHERE order_ref = p_order_ref 
  AND product_code = p_product_code;
  
  -- 2. Record unload in history
  INSERT INTO record_history (
    time, id, action, plt_num, loc, remark
  ) VALUES (
    NOW(), 
    p_user_id,
    'Order Unload', 
    p_pallet_num,
    NULL,
    format('Order: %s, Product: %s, Qty: %s, Action: Unload (Undo by %s)', 
           p_order_ref, p_product_code, p_quantity, p_user_name)
  );
  
  -- 3. Update pallet remark (remove loading info)
  UPDATE record_palletinfo
  SET plt_remark = REGEXP_REPLACE(
    plt_remark, 
    format('; loaded to %s|loaded to %s', p_order_ref, p_order_ref), 
    '', 
    'g'
  )
  WHERE plt_num = p_pallet_num;
  
  -- 4. Restore stock level
  SELECT stock_level INTO v_stock_level
  FROM stock_level
  WHERE stock = p_product_code
  FOR UPDATE;
  
  IF FOUND THEN
    UPDATE stock_level 
    SET stock_level = v_stock_level + p_quantity,
        update_time = NOW()
    WHERE stock = p_product_code;
  END IF;
  
  -- 5. Create inventory record (restoration)
  INSERT INTO record_inventory (
    product_code, plt_num, latest_update,
    injection, pipeline, prebook, await, fold, bulk, backcarpark
  ) VALUES (
    p_product_code, p_pallet_num, NOW(),
    CASE WHEN v_location = 'injection' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'pipeline' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'prebook' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'await' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'fold' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'bulk' THEN p_quantity ELSE 0 END,
    CASE WHEN v_location = 'backcarpark' THEN p_quantity ELSE 0 END
  );
  
  -- 6. Delete the Order Load record to reset pallet status
  DELETE FROM record_history
  WHERE plt_num = p_pallet_num
  AND action = 'Order Load'
  AND remark LIKE format('%%Order: %s%%', p_order_ref)
  AND uuid = (
    SELECT uuid FROM record_history
    WHERE plt_num = p_pallet_num
    AND action = 'Order Load'
    AND remark LIKE format('%%Order: %s%%', p_order_ref)
    ORDER BY time DESC
    LIMIT 1
  );
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', format('Successfully undone loading of %s', p_pallet_num),
    'data', json_build_object(
      'orderRef', p_order_ref,
      'palletNum', p_pallet_num,
      'productCode', p_product_code,
      'quantity', p_quantity,
      'newLoadedQty', v_current_loaded
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback all changes
    RETURN json_build_object(
      'success', false,
      'message', format('System error during undo: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION rpc_load_pallet_to_order TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_undo_load_pallet TO authenticated;