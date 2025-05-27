-- Update create_grn_entries_atomic RPC function
-- This script updates the existing RPC function to fix current issues

-- Drop the existing function first
DROP FUNCTION IF EXISTS create_grn_entries_atomic(
    p_plt_num TEXT,
    p_series TEXT,
    p_product_code TEXT,
    p_product_qty NUMERIC,
    p_plt_remark TEXT,
    p_grn_ref TEXT,
    p_material_code TEXT,
    p_sup_code TEXT,
    p_gross_weight NUMERIC,
    p_net_weight NUMERIC,
    p_pallet_count INTEGER,
    p_package_count_param INTEGER,
    p_pallet TEXT,
    p_package_col TEXT,
    p_operator_id INTEGER,
    p_loc TEXT
);

-- Create the updated function
CREATE OR REPLACE FUNCTION create_grn_entries_atomic(
    p_plt_num TEXT,
    p_series TEXT,
    p_product_code TEXT,
    p_product_qty NUMERIC,
    p_plt_remark TEXT,
    p_grn_ref TEXT,
    p_material_code TEXT,
    p_sup_code TEXT,
    p_gross_weight NUMERIC,
    p_net_weight NUMERIC,
    p_pallet_count INTEGER,
    p_package_count_param INTEGER,
    p_pallet TEXT,
    p_package_col TEXT,
    p_operator_id INTEGER,
    p_loc TEXT DEFAULT 'Await'  -- Add p_loc parameter with default value
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grn_ref_int INT;
BEGIN
    -- Validate and cast GRN Reference
    BEGIN
        v_grn_ref_int := p_grn_ref::INT;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid GRN Reference format: "%". Must be a valid number.', p_grn_ref;
    END;

    -- 1. Insert into record_palletinfo
    INSERT INTO public.record_palletinfo (plt_num, series, product_code, product_qty, plt_remark)
    VALUES (p_plt_num, p_series, p_product_code, ROUND(p_product_qty), p_plt_remark);

    -- 2. Insert into record_grn
    INSERT INTO public.record_grn (
        grn_ref, material_code, sup_code, plt_num, 
        gross_weight, net_weight, pallet_count, package_count, 
        pallet, "package" 
    )
    VALUES (
        v_grn_ref_int, p_material_code, p_sup_code, p_plt_num, 
        p_gross_weight, p_net_weight, p_pallet_count, p_package_count_param, 
        p_pallet, p_package_col
    );

    -- 3. Insert into record_inventory
    -- Use p_net_weight for the await column
    INSERT INTO public.record_inventory (product_code, plt_num, await)
    VALUES (p_material_code, p_plt_num, p_net_weight);

    -- 4. Insert into record_history
    -- Use p_loc parameter for the loc field (defaults to 'Await')
    INSERT INTO public.record_history (action, id, plt_num, loc, remark, "time")
    VALUES (
        'GRN Receiving', 
        p_operator_id, 
        p_plt_num, 
        p_loc, -- Use the p_loc parameter instead of hardcoded 'Awaiting'
        'GRN: ' || v_grn_ref_int::TEXT || ', Material: ' || p_material_code,
        NOW()
    );

    RETURN 'Successfully created GRN database entries.';

EXCEPTION
    WHEN OTHERS THEN
        -- Log the detailed error to the server logs for debugging
        RAISE WARNING '[create_grn_entries_atomic] - GRN Atomic Entry Failed. SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        -- Return a more generic error message to the client with our custom prefix
        RAISE EXCEPTION 'GRN_ATOMIC_FAILURE: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_grn_entries_atomic TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_grn_entries_atomic IS 'Atomically creates GRN entries across multiple tables: record_palletinfo, record_grn, record_inventory, and record_history'; 