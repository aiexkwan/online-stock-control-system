-- RPC function for ACO Order Report Widget
-- Optimized server-side data processing

CREATE OR REPLACE FUNCTION rpc_get_aco_order_report(
    p_order_ref INTEGER,
    p_limit INTEGER DEFAULT 1000,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_products JSONB;
    v_metadata JSONB;
    v_start_time TIMESTAMP;
BEGIN
    v_start_time := clock_timestamp();

    -- Step 1: Get products and required quantities from record_aco
    WITH aco_products AS (
        SELECT DISTINCT
            code AS product_code,
            FIRST_VALUE(required_qty) OVER (PARTITION BY code ORDER BY latest_update DESC) AS required_qty
        FROM record_aco
        WHERE order_ref = p_order_ref
            AND code IS NOT NULL
            AND code != ''
    ),
    -- Step 2: Get pallet information for each product
    product_pallets AS (
        SELECT
            ap.product_code,
            ap.required_qty,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'plt_num', rp.plt_num,
                        'product_qty', rp.product_qty,
                        'generate_time', TO_CHAR(rp.generate_time, 'DD-Mon-YY')
                    ) ORDER BY rp.plt_num
                ) FILTER (WHERE rp.plt_num IS NOT NULL),
                '[]'::jsonb
            ) AS pallets
        FROM aco_products ap
        LEFT JOIN record_palletinfo rp ON rp.product_code = ap.product_code
            AND (
                rp.plt_remark ILIKE '%ACO Ref : ' || p_order_ref || '%'
                OR rp.plt_remark ILIKE '%ACO Ref: ' || p_order_ref || '%'
                OR rp.plt_remark ILIKE '%ACO_Ref_' || p_order_ref || '%'
                OR rp.plt_remark ILIKE '%ACO-Ref-' || p_order_ref || '%'
            )
        GROUP BY ap.product_code, ap.required_qty
    )
    -- Step 3: Build final result
    SELECT jsonb_agg(
        jsonb_build_object(
            'product_code', product_code,
            'required_qty', COALESCE(required_qty, 0),
            'pallets', pallets,
            'pallet_count', jsonb_array_length(pallets)
        ) ORDER BY product_code
    ) INTO v_products
    FROM product_pallets
    LIMIT p_limit
    OFFSET p_offset;

    -- Build metadata
    v_metadata := jsonb_build_object(
        'orderRef', p_order_ref,
        'productCount', COALESCE(jsonb_array_length(v_products), 0),
        'totalPallets', (
            SELECT COUNT(DISTINCT rp.plt_num)
            FROM record_aco ra
            JOIN record_palletinfo rp ON rp.product_code = ra.code
            WHERE ra.order_ref = p_order_ref
                AND (
                    rp.plt_remark ILIKE '%ACO Ref : ' || p_order_ref || '%'
                    OR rp.plt_remark ILIKE '%ACO Ref: ' || p_order_ref || '%'
                    OR rp.plt_remark ILIKE '%ACO_Ref_' || p_order_ref || '%'
                    OR rp.plt_remark ILIKE '%ACO-Ref-' || p_order_ref || '%'
                )
        ),
        'performanceMs', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
        'optimized', true
    );

    -- Build final result
    v_result := jsonb_build_object(
        'products', COALESCE(v_products, '[]'::jsonb),
        'metadata', v_metadata
    );

    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_aco_order_report TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_record_aco_order_ref ON record_aco(order_ref);
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_plt_remark ON record_palletinfo(plt_remark);

-- Also create a function to get unique ACO order refs
CREATE OR REPLACE FUNCTION rpc_get_aco_order_refs(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_refs JSONB;
    v_metadata JSONB;
    v_start_time TIMESTAMP;
BEGIN
    v_start_time := clock_timestamp();

    -- Get unique order refs
    WITH unique_refs AS (
        SELECT DISTINCT order_ref
        FROM record_aco
        WHERE order_ref IS NOT NULL
        ORDER BY order_ref DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT jsonb_agg(order_ref::TEXT ORDER BY order_ref DESC) INTO v_refs
    FROM unique_refs;

    -- Build metadata
    v_metadata := jsonb_build_object(
        'totalCount', (SELECT COUNT(DISTINCT order_ref) FROM record_aco WHERE order_ref IS NOT NULL),
        'hasMore', (
            SELECT COUNT(*) > (p_limit + p_offset)
            FROM (SELECT DISTINCT order_ref FROM record_aco WHERE order_ref IS NOT NULL) AS sub
        ),
        'performanceMs', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
        'optimized', true
    );

    -- Build final result
    v_result := jsonb_build_object(
        'orderRefs', COALESCE(v_refs, '[]'::jsonb),
        'metadata', v_metadata
    );

    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_aco_order_refs TO authenticated;
