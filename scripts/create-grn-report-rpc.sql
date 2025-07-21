-- RPC functions for GRN Report Widget
-- Optimized server-side data fetching for GRN reports

-- Function to get unique GRN references
CREATE OR REPLACE FUNCTION rpc_get_grn_references(
    p_limit INTEGER DEFAULT 1000,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    v_start_time := clock_timestamp();

    -- Get unique GRN references with optimized query
    SELECT jsonb_build_object(
        'grn_refs', COALESCE(
            jsonb_agg(DISTINCT grn_ref ORDER BY grn_ref DESC),
            '[]'::jsonb
        ),
        'total_count', COUNT(DISTINCT grn_ref)::INTEGER
    ) INTO v_result
    FROM (
        SELECT DISTINCT grn_ref
        FROM record_grn
        WHERE grn_ref IS NOT NULL
        ORDER BY grn_ref DESC
        LIMIT p_limit
        OFFSET p_offset
    ) AS unique_refs;

    v_end_time := clock_timestamp();

    -- Add metadata
    v_result := v_result || jsonb_build_object(
        'metadata', jsonb_build_object(
            'limit', p_limit,
            'offset', p_offset,
            'query_time', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER || 'ms'
        )
    );

    RETURN v_result;
END;
$$;

-- Function to get material codes for a GRN reference
CREATE OR REPLACE FUNCTION rpc_get_grn_material_codes(
    p_grn_ref TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_material_codes TEXT[];
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    v_start_time := clock_timestamp();

    -- Validate input
    IF p_grn_ref IS NULL OR TRIM(p_grn_ref) = '' THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', 'GRN reference is required',
            'material_codes', '[]'::jsonb
        );
    END IF;

    -- Get unique material codes for the GRN reference
    SELECT ARRAY_AGG(DISTINCT material_code ORDER BY material_code)
    INTO v_material_codes
    FROM record_grn
    WHERE grn_ref = p_grn_ref
    AND material_code IS NOT NULL;

    v_end_time := clock_timestamp();

    -- Build result
    v_result := jsonb_build_object(
        'error', false,
        'grn_ref', p_grn_ref,
        'material_codes', COALESCE(to_jsonb(v_material_codes), '[]'::jsonb),
        'count', COALESCE(array_length(v_material_codes, 1), 0),
        'metadata', jsonb_build_object(
            'query_time', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER || 'ms'
        )
    );

    RETURN v_result;
END;
$$;

-- Function to get GRN report data with all necessary joins
CREATE OR REPLACE FUNCTION rpc_get_grn_report_data(
    p_grn_ref TEXT,
    p_material_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_supplier_code TEXT;
    v_supplier_name TEXT;
    v_material_description TEXT;
BEGIN
    v_start_time := clock_timestamp();

    -- Validate inputs
    IF p_grn_ref IS NULL OR TRIM(p_grn_ref) = '' THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', 'GRN reference is required'
        );
    END IF;

    IF p_material_code IS NULL OR TRIM(p_material_code) = '' THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', 'Material code is required'
        );
    END IF;

    -- Get supplier code from GRN record
    SELECT supplier_code INTO v_supplier_code
    FROM record_grn
    WHERE grn_ref = p_grn_ref
    LIMIT 1;

    -- Get supplier name if supplier code exists
    IF v_supplier_code IS NOT NULL THEN
        SELECT supplier_name INTO v_supplier_name
        FROM data_supplier
        WHERE supplier_code = v_supplier_code;
    END IF;

    -- Get material description
    SELECT description INTO v_material_description
    FROM data_code
    WHERE code = p_material_code;

    -- Get all GRN records with enhanced data
    WITH grn_records AS (
        SELECT
            rg.supplier_invoice_number,
            rg.package_count,
            rg.gross_weight,
            rg.net_weight,
            rg.remarks,
            rg.date_received,
            rg.plt_num,
            rg.material_code,
            rg.grn_ref,
            rg.supplier_code,
            -- Additional fields that might be needed
            rg.creat_time,
            rg.total_cost,
            rg.unit_cost,
            rg.currency,
            rg.status
        FROM record_grn rg
        WHERE rg.grn_ref = p_grn_ref
        AND rg.material_code = p_material_code
        ORDER BY rg.creat_time
    )
    SELECT jsonb_build_object(
        'error', false,
        'grn_ref', p_grn_ref,
        'material_code', p_material_code,
        'material_description', COALESCE(v_material_description, ''),
        'supplier_code', COALESCE(v_supplier_code, ''),
        'supplier_name', COALESCE(v_supplier_name, ''),
        'report_date', TO_CHAR(CURRENT_DATE, 'MM/DD/YYYY'),
        'records', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'supplier_invoice_number', supplier_invoice_number,
                    'package_count', COALESCE(package_count, 0),
                    'gross_weight', COALESCE(gross_weight, 0),
                    'net_weight', COALESCE(net_weight, 0),
                    'pallet_weight', COALESCE(gross_weight, 0) - COALESCE(net_weight, 0),
                    'remarks', COALESCE(remarks, ''),
                    'date_received', CASE
                        WHEN date_received IS NOT NULL
                        THEN TO_CHAR(date_received, 'MM/DD/YYYY')
                        ELSE ''
                    END,
                    'plt_num', plt_num,
                    'total_cost', total_cost,
                    'unit_cost', unit_cost,
                    'currency', currency,
                    'status', status
                )
            ),
            '[]'::jsonb
        ),
        'summary', jsonb_build_object(
            'total_packages', COALESCE(SUM(package_count), 0),
            'total_gross_weight', COALESCE(SUM(gross_weight), 0),
            'total_net_weight', COALESCE(SUM(net_weight), 0),
            'total_pallet_weight', COALESCE(SUM(gross_weight), 0) - COALESCE(SUM(net_weight), 0),
            'record_count', COUNT(*)
        )
    ) INTO v_result
    FROM grn_records;

    v_end_time := clock_timestamp();

    -- Add metadata
    v_result := v_result || jsonb_build_object(
        'metadata', jsonb_build_object(
            'query_time', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER || 'ms',
            'generated_at', NOW()
        )
    );

    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_grn_references TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_grn_material_codes TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_grn_report_data TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_record_grn_grn_ref ON record_grn(grn_ref) WHERE grn_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_record_grn_material_code ON record_grn(material_code) WHERE material_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_record_grn_composite ON record_grn(grn_ref, material_code);
