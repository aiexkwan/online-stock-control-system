-- RPC functions for Supplier Update Widget
-- Optimized server-side CRUD operations

-- Function to search supplier with existence check
CREATE OR REPLACE FUNCTION rpc_search_supplier(
    p_supplier_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_supplier RECORD;
    v_normalized_code TEXT;
BEGIN
    -- Normalize supplier code (uppercase, trim)
    v_normalized_code := UPPER(TRIM(p_supplier_code));
    
    -- Check if supplier exists
    SELECT * INTO v_supplier
    FROM data_supplier
    WHERE supplier_code = v_normalized_code;
    
    IF FOUND THEN
        v_result := jsonb_build_object(
            'exists', true,
            'supplier', jsonb_build_object(
                'supplier_code', v_supplier.supplier_code,
                'supplier_name', v_supplier.supplier_name
            )
        );
    ELSE
        v_result := jsonb_build_object(
            'exists', false,
            'normalized_code', v_normalized_code
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function to create supplier with history recording
CREATE OR REPLACE FUNCTION rpc_create_supplier(
    p_supplier_code TEXT,
    p_supplier_name TEXT,
    p_user_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_supplier RECORD;
    v_normalized_code TEXT;
BEGIN
    -- Normalize supplier code
    v_normalized_code := UPPER(TRIM(p_supplier_code));
    
    -- Check if already exists
    IF EXISTS (SELECT 1 FROM data_supplier WHERE supplier_code = v_normalized_code) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Supplier already exists'
        );
    END IF;
    
    -- Insert supplier
    INSERT INTO data_supplier (supplier_code, supplier_name)
    VALUES (v_normalized_code, p_supplier_name)
    RETURNING * INTO v_supplier;
    
    -- Record history
    INSERT INTO record_history (time, id, action, plt_num, loc, remark)
    VALUES (
        NOW(),
        p_user_id,
        'Supplier Added',
        NULL,
        NULL,
        v_normalized_code
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'supplier', jsonb_build_object(
            'supplier_code', v_supplier.supplier_code,
            'supplier_name', v_supplier.supplier_name
        )
    );
    
    RETURN v_result;
END;
$$;

-- Function to update supplier with history recording
CREATE OR REPLACE FUNCTION rpc_update_supplier(
    p_supplier_code TEXT,
    p_supplier_name TEXT,
    p_user_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_supplier RECORD;
    v_normalized_code TEXT;
BEGIN
    -- Normalize supplier code
    v_normalized_code := UPPER(TRIM(p_supplier_code));
    
    -- Update supplier
    UPDATE data_supplier
    SET supplier_name = p_supplier_name
    WHERE supplier_code = v_normalized_code
    RETURNING * INTO v_supplier;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Supplier not found'
        );
    END IF;
    
    -- Record history
    INSERT INTO record_history (time, id, action, plt_num, loc, remark)
    VALUES (
        NOW(),
        p_user_id,
        'Supplier Update',
        NULL,
        NULL,
        v_normalized_code
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'supplier', jsonb_build_object(
            'supplier_code', v_supplier.supplier_code,
            'supplier_name', v_supplier.supplier_name
        )
    );
    
    RETURN v_result;
END;
$$;

-- Function to get user ID from email
CREATE OR REPLACE FUNCTION rpc_get_user_id_by_email(
    p_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id
    FROM data_id
    WHERE LOWER(email) = LOWER(p_email)
    ORDER BY id
    LIMIT 1;
    
    -- Return 999 if user not found (consistent with original logic)
    RETURN COALESCE(v_user_id, 999);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_search_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_create_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_update_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_user_id_by_email TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_supplier_code ON data_supplier(supplier_code);
CREATE INDEX IF NOT EXISTS idx_data_id_email_lower ON data_id(LOWER(email));