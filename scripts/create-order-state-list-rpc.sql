-- RPC function for OrderStateListWidget
-- 獲取未完成訂單列表並計算進度

-- Drop existing function if exists
DROP FUNCTION IF EXISTS rpc_get_order_state_list(INTEGER, INTEGER);

-- Create the function
CREATE OR REPLACE FUNCTION rpc_get_order_state_list(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_orders JSONB;
    v_total_count BIGINT;
    v_pending_count BIGINT;
    v_performance_start TIMESTAMP;
    v_performance_end TIMESTAMP;
BEGIN
    v_performance_start := clock_timestamp();
    
    -- Get total and pending counts
    SELECT 
        COUNT(*) FILTER (WHERE TRUE) as total_count,
        COUNT(*) FILTER (WHERE COALESCE(loaded_qty, 0) < product_qty AND product_qty > 0) as pending_count
    INTO v_total_count, v_pending_count
    FROM data_order;
    
    -- Fetch pending orders with progress calculation
    SELECT jsonb_agg(order_data ORDER BY created_at DESC)
    INTO v_orders
    FROM (
        SELECT jsonb_build_object(
            'uuid', uuid,
            'order_ref', order_ref,
            'account_num', account_num,
            'product_code', product_code,
            'product_desc', product_desc,
            'product_qty', product_qty,
            'loaded_qty', COALESCE(loaded_qty, 0),
            'created_at', created_at,
            'progress', CASE 
                WHEN product_qty > 0 THEN 
                    LEAST(100, GREATEST(0, (COALESCE(loaded_qty, 0)::FLOAT / product_qty::FLOAT) * 100))
                ELSE 0 
            END,
            'progress_text', COALESCE(loaded_qty, 0) || ' / ' || product_qty,
            'status', CASE 
                WHEN product_qty > 0 AND COALESCE(loaded_qty, 0) >= product_qty THEN 'completed'
                WHEN COALESCE(loaded_qty, 0) > 0 THEN 'in_progress'
                ELSE 'pending'
            END,
            'status_color', CASE
                WHEN product_qty = 0 OR COALESCE(loaded_qty, 0) = 0 THEN 'red'
                WHEN (COALESCE(loaded_qty, 0)::FLOAT / product_qty::FLOAT) * 100 < 50 THEN 'yellow'
                WHEN (COALESCE(loaded_qty, 0)::FLOAT / product_qty::FLOAT) * 100 < 100 THEN 'orange'
                ELSE 'green'
            END
        ) as order_data
        FROM data_order
        WHERE COALESCE(loaded_qty, 0) < product_qty 
        AND product_qty > 0
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) sub;
    
    -- If no orders found
    IF v_orders IS NULL THEN
        v_orders := '[]'::JSONB;
    END IF;
    
    v_performance_end := clock_timestamp();
    
    -- Return result with metadata
    RETURN jsonb_build_object(
        'orders', v_orders,
        'total_count', v_total_count,
        'pending_count', v_pending_count,
        'has_more', v_pending_count > (p_offset + p_limit),
        'performance_ms', EXTRACT(MILLISECOND FROM (v_performance_end - v_performance_start)),
        'query_time', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'orders', '[]'::JSONB,
            'total_count', 0,
            'pending_count', 0
        );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_get_order_state_list(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_order_state_list(INTEGER, INTEGER) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_order_created_at_desc ON data_order(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_order_loaded_qty ON data_order(loaded_qty);
CREATE INDEX IF NOT EXISTS idx_data_order_product_qty ON data_order(product_qty);
CREATE INDEX IF NOT EXISTS idx_data_order_composite ON data_order(created_at DESC, loaded_qty, product_qty);

-- Add comment
COMMENT ON FUNCTION rpc_get_order_state_list IS 'Get pending order list with progress calculation for OrderStateListWidget';