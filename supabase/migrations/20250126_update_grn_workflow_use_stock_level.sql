-- Migration: Update update_grn_workflow to use update_stock_level instead of update_stock_level_grn
-- Purpose: Change stock level update logic to create new records for each day instead of accumulating

CREATE OR REPLACE FUNCTION update_grn_workflow(
    p_grn_ref bigint,
    p_product_code text,
    p_product_description text,
    p_label_mode text,
    p_user_id text,
    p_grn_quantity bigint DEFAULT NULL,
    p_grn_weight numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_quantity bigint;
    v_grn_result text;
    v_work_result text;
    v_stock_result text;
BEGIN
    -- Determine stock quantity based on label mode
    IF p_label_mode = 'weight' THEN
        v_stock_quantity := COALESCE(p_grn_weight::bigint, 0);
    ELSE -- qty mode
        v_stock_quantity := COALESCE(p_grn_quantity, 0);
    END IF;

    -- Update GRN level
    BEGIN
        SELECT update_grn_level(
            p_grn_ref::text,
            p_product_code,
            v_stock_quantity
        ) INTO v_grn_result;
    EXCEPTION WHEN OTHERS THEN
        v_grn_result := 'Error updating GRN level: ' || SQLERRM;
    END;

    -- Update work level
    BEGIN
        SELECT update_work_level(
            p_user_id,
            v_stock_quantity
        ) INTO v_work_result;
    EXCEPTION WHEN OTHERS THEN
        v_work_result := 'Error updating work level: ' || SQLERRM;
    END;

    -- Update stock level
    -- 🔄 Changed from update_stock_level_grn to update_stock_level
    -- This will now create new records for each day instead of accumulating
    BEGIN
        SELECT update_stock_level(
            p_product_code,
            v_stock_quantity,
            p_product_description
        )::text INTO v_stock_result;
    EXCEPTION WHEN OTHERS THEN
        v_stock_result := 'Error updating stock level: ' || SQLERRM;
    END;

    -- Return combined results
    RETURN jsonb_build_object(
        'grn_level_result', v_grn_result,
        'work_level_result', v_work_result,
        'stock_level_result', v_stock_result,
        'stock_quantity', v_stock_quantity
    );
END;
$$;

-- Add comment explaining the change
COMMENT ON FUNCTION update_grn_workflow IS 'Updates GRN, work, and stock levels. Modified to use update_stock_level for daily stock tracking instead of cumulative stock.';
