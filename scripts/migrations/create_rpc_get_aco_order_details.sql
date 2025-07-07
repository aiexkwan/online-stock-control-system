-- Create RPC function to get ACO order details in a single call
-- This replaces multiple queries with one atomic operation

CREATE OR REPLACE FUNCTION get_aco_order_details(
    p_product_code TEXT,
    p_order_ref TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_ref_bigint BIGINT;
    v_result JSONB;
    v_available_orders JSONB;
    v_order_details JSONB;
    v_finished_qty NUMERIC;
    v_required_qty NUMERIC;
    v_outstanding_qty NUMERIC;
    v_order_status TEXT;
BEGIN
    -- Validate input
    IF p_product_code IS NULL OR TRIM(p_product_code) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product code is required'
        );
    END IF;

    -- Get all available ACO orders for this product
    -- Group by order_ref to handle multiple records per order
    SELECT jsonb_agg(DISTINCT order_ref ORDER BY order_ref) 
    INTO v_available_orders
    FROM record_aco
    WHERE code = p_product_code
        AND order_ref IS NOT NULL;

    -- If no order ref provided, just return available orders
    IF p_order_ref IS NULL OR TRIM(p_order_ref) = '' THEN
        RETURN jsonb_build_object(
            'success', true,
            'available_orders', COALESCE(v_available_orders, '[]'::jsonb),
            'order_details', NULL
        );
    END IF;

    -- Convert order ref to bigint
    BEGIN
        v_order_ref_bigint := p_order_ref::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid order reference format'
        );
    END;

    -- Get order details for specific order
    -- Sum all records for the same order_ref and product code
    SELECT 
        COALESCE(SUM(finished_qty), 0) AS total_finished,
        COALESCE(SUM(required_qty), 0) AS total_required,
        COALESCE(SUM(required_qty - finished_qty), 0) AS total_outstanding
    INTO 
        v_finished_qty,
        v_required_qty,
        v_outstanding_qty
    FROM record_aco
    WHERE order_ref = v_order_ref_bigint 
        AND code = p_product_code;

    -- Check if order exists (no records found)
    IF v_required_qty = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'available_orders', COALESCE(v_available_orders, '[]'::jsonb),
            'order_details', jsonb_build_object(
                'exists', false,
                'message', format('No Order Found for %s.', p_product_code)
            )
        );
    END IF;

    -- Determine order status
    IF v_finished_qty >= v_required_qty THEN
        v_order_status := 'fulfilled';
        v_order_details := jsonb_build_object(
            'exists', true,
            'status', v_order_status,
            'order_ref', v_order_ref_bigint,
            'product_code', p_product_code,
            'finished_qty', v_finished_qty,
            'required_qty', v_required_qty,
            'outstanding_qty', 0,
            'message', format('Order Already Fulfilled for %s (Finished: %s, Required: %s)', 
                p_product_code, v_finished_qty, v_required_qty)
        );
    ELSE
        v_order_status := 'outstanding';
        v_order_details := jsonb_build_object(
            'exists', true,
            'status', v_order_status,
            'order_ref', v_order_ref_bigint,
            'product_code', p_product_code,
            'finished_qty', v_finished_qty,
            'required_qty', v_required_qty,
            'outstanding_qty', v_outstanding_qty,
            'message', format('Order Outstanding Qty for %s: %s (Current: %s/%s)', 
                p_product_code, v_outstanding_qty, v_finished_qty, v_required_qty)
        );
    END IF;

    -- Return combined result
    RETURN jsonb_build_object(
        'success', true,
        'available_orders', COALESCE(v_available_orders, '[]'::jsonb),
        'order_details', v_order_details
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error and return
    RAISE WARNING 'Error in get_aco_order_details: %', SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_aco_order_details IS 'Get ACO order details and available orders in a single atomic operation. Returns available orders list and specific order details if order_ref is provided.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_aco_order_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_aco_order_details TO service_role;