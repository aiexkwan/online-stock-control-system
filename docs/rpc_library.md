-- ====================================================
-- RPC Functions Library
-- ====================================================
-- ,��+@	 RPC �x�q �
-- (������b��w
--  ���2025-06-14
-- ====================================================

-- ====================================================
-- 1. X�_��x (Pallet Number Generation)
-- ====================================================

-- V5 H, - /�xW���z�OL
CREATE OR REPLACE FUNCTION generate_atomic_pallet_numbers_v5(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
) RETURNS TEXT[] AS $$
DECLARE
    v_result TEXT[] := ARRAY[]::TEXT[];
    v_new_numbers TEXT[] := ARRAY[]::TEXT[];
    v_current_date_str TEXT;
    v_existing_max INTEGER;
    v_sequence_max INTEGER;
    v_start_num INTEGER;
    v_today TEXT;
    i INTEGER;
BEGIN
    -- r�vM�W&2
    v_today := CURRENT_DATE::TEXT;
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- f��]@r�*(�_�(xW��	
    IF EXISTS (SELECT 1 FROM pallet_number_buffer WHERE date_str = v_current_date_str AND used = FALSE) THEN
        -- (xW��
        SELECT array_agg(pallet_number ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER))
        INTO v_result
        FROM (
            SELECT pallet_number
            FROM pallet_number_buffer
            WHERE date_str = v_current_date_str
            AND used = FALSE
            AND (session_id IS NULL OR session_id = p_session_id)
            ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER)
            LIMIT p_count
            FOR UPDATE SKIP LOCKED
        ) AS available_numbers;
        
        -- ���]@	� �_���(&��
        IF array_length(v_result, 1) = p_count THEN
            UPDATE pallet_number_buffer
            SET used = TRUE,
                used_at = NOW(),
                session_id = p_session_id
            WHERE pallet_number = ANY(v_result);
            
            RETURN v_result;
        END IF;
    END IF;
    
    -- �]@_�� ��_�
    -- ( SERIALIZABLE ��%�ݟP'
    BEGIN
        -- ���h
        INSERT INTO daily_pallet_sequence (date_str, current_max)
        VALUES (v_current_date_str, 0)
        ON CONFLICT (date_str) DO NOTHING;
        
        -- ( FOR UPDATE ��
        SELECT current_max 
        INTO v_sequence_max
        FROM daily_pallet_sequence
        WHERE date_str = v_current_date_str
        FOR UPDATE;
        
        -- ���h-� '<�e"*	
        SELECT COALESCE(MAX(
            CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
        ), 0) 
        INTO v_existing_max
        FROM record_palletinfo
        WHERE plt_num LIKE v_current_date_str || '/%'
        AND plt_num ~ ('^' || v_current_date_str || '/[0-9]+$');
        
        -- ('<\�w��
        v_start_num := GREATEST(v_existing_max, COALESCE(v_sequence_max, 0));
        
        -- ���h
        UPDATE daily_pallet_sequence
        SET current_max = v_start_num + p_count,
            last_updated = NOW()
        WHERE date_str = v_current_date_str;
        
        -- _�
        FOR i IN 1..p_count LOOP
            v_result := array_append(v_result, v_current_date_str || '/' || (v_start_num + i));
        END LOOP;
        
        -- y��e0�]hMM�_�	
        IF p_count < 10 THEN
            -- �y�MM 10 _�
            v_new_numbers := ARRAY[]::TEXT[];
            FOR i IN (p_count + 1)..(p_count + 10) LOOP
                v_new_numbers := array_append(v_new_numbers, v_current_date_str || '/' || (v_start_num + i));
            END LOOP;
            
            -- �eM�_��e�	
            INSERT INTO pallet_number_buffer (pallet_number, date_str, used)
            SELECT unnest(v_new_numbers), v_current_date_str, FALSE
            ON CONFLICT (pallet_number) DO NOTHING;
            
            -- B���h
            UPDATE daily_pallet_sequence
            SET current_max = v_start_num + p_count + 10
            WHERE date_str = v_current_date_str;
        END IF;
        
        -- (�_�
        UPDATE pallet_number_buffer
        SET used = TRUE,
            used_at = NOW(),
            session_id = p_session_id
        WHERE pallet_number = ANY(v_result);
        
        RETURN v_result;
    EXCEPTION 
        WHEN serialization_failure THEN
            RAISE NOTICE 'Serialization failure, will retry';
            RAISE;
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in generate_atomic_pallet_numbers_v5: %', SQLERRM;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- �

GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO service_role;

-- ====================================================
-- 2. �]@�x (Buffer Cleanup Functions)
-- ====================================================

-- ���x
CREATE OR REPLACE FUNCTION auto_cleanup_pallet_buffer() RETURNS void AS $$
DECLARE
    v_deleted_count INTEGER;
    v_today TEXT;
BEGIN
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 1. ^��@	��
    DELETE FROM pallet_number_buffer
    WHERE date_str != v_today;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % entries from previous days', v_deleted_count;
    END IF;
    
    -- 2. �(�N 2 B���
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE 
    AND used_at < NOW() - INTERVAL '2 hours';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % used entries older than 2 hours', v_deleted_count;
    END IF;
    
    -- 3. *(F�N 30 ���
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE 
    AND allocated_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % unused entries older than 30 minutes', v_deleted_count;
    END IF;
    
    -- 4. �� buffer *'�N 100 *(	�Y �� 50 
    IF (SELECT COUNT(*) FROM pallet_number_buffer WHERE used = FALSE) > 100 THEN
        DELETE FROM pallet_number_buffer
        WHERE pallet_number IN (
            SELECT pallet_number 
            FROM pallet_number_buffer 
            WHERE used = FALSE
            ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) DESC
            OFFSET 50
        );
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        IF v_deleted_count > 0 THEN
            RAISE NOTICE 'Buffer size exceeded limit, deleted % old unused entries', v_deleted_count;
        END IF;
    END IF;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API �x��(	
CREATE OR REPLACE FUNCTION api_cleanup_pallet_buffer()
RETURNS json AS $$
DECLARE
    v_deleted_unused INTEGER := 0;
    v_deleted_used INTEGER := 0;
    v_deleted_old INTEGER := 0;
    v_total_before INTEGER;
    v_total_after INTEGER;
BEGIN
    -- r�M�=x
    SELECT COUNT(*) INTO v_total_before FROM pallet_number_buffer;
    
    -- ^�儝�
    DELETE FROM pallet_number_buffer
    WHERE date_str != TO_CHAR(CURRENT_DATE, 'DDMMYY');
    GET DIAGNOSTICS v_deleted_old = ROW_COUNT;
    
    -- �(�N 2 B���
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE 
    AND used_at < NOW() - INTERVAL '2 hours';
    GET DIAGNOSTICS v_deleted_used = ROW_COUNT;
    
    -- *(�N 30 ���
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE 
    AND allocated_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS v_deleted_unused = ROW_COUNT;
    
    -- r���=x
    SELECT COUNT(*) INTO v_total_after FROM pallet_number_buffer;
    
    -- ��P�
    RETURN json_build_object(
        'success', true,
        'deleted_old_days', v_deleted_old,
        'deleted_used', v_deleted_used,
        'deleted_unused', v_deleted_unused,
        'total_deleted', v_deleted_old + v_deleted_used + v_deleted_unused,
        'entries_before', v_total_before,
        'entries_after', v_total_after,
        'cleaned_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- �

GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO anon;
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO authenticated;

-- ====================================================
-- 3. ��	�x (Order Loading Functions)
-- ====================================================

-- �P'�	X�0�
CREATE OR REPLACE FUNCTION rpc_load_pallet_to_order(
    p_order_ref TEXT,
    p_pallet_input TEXT,
    p_user_id INTEGER DEFAULT 0,
    p_user_name TEXT DEFAULT 'System'
) RETURNS json AS $$
DECLARE
    v_pallet_num TEXT;
    v_product_code TEXT;
    v_quantity INTEGER;
    v_current_location TEXT;
    v_existing_load record;
    v_order_exists BOOLEAN;
    v_order_product record;
    v_result json;
    v_history_id UUID;
BEGIN
    -- �ˋ�
    -- 1. �8eX�_�_	
    IF p_pallet_input LIKE '%/%' THEN
        v_pallet_num := p_pallet_input;
    ELSE
        -- ��_�~X�_
        SELECT plt_num INTO v_pallet_num
        FROM record_palletinfo
        WHERE series = p_pallet_input
        LIMIT 1;
        
        IF v_pallet_num IS NULL THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Pallet not found for series: ' || p_pallet_input
            );
        END IF;
    END IF;
    
    -- 2. r�X��o
    SELECT product_code, product_qty
    INTO v_product_code, v_quantity
    FROM record_palletinfo
    WHERE plt_num = v_pallet_num;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Pallet not found: ' || v_pallet_num
        );
    END IF;
    
    -- 3. ��X�/&��	0�
    SELECT * INTO v_existing_load
    FROM order_loading
    WHERE plt_num = v_pallet_num
    AND status = 'loaded';
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Pallet already loaded to order: ' || v_existing_load.order_ref,
            'existing_order', v_existing_load.order_ref
        );
    END IF;
    
    -- 4. ���/&X(&r�"��o
    SELECT EXISTS(
        SELECT 1 FROM data_customerorder 
        WHERE order_ref = p_order_ref::INTEGER
    ) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Order not found: ' || p_order_ref
        );
    END IF;
    
    -- 5. ��"�/&(�-
    SELECT * INTO v_order_product
    FROM data_customerorder
    WHERE order_ref = p_order_ref::INTEGER
    AND product_code = v_product_code;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product ' || v_product_code || ' not in order ' || p_order_ref
        );
    END IF;
    
    -- 6. ��x�/&�N� B
    IF v_order_product.remain_qty < v_quantity THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Quantity exceeds order requirement. Required: ' || v_order_product.remain_qty || ', Available: ' || v_quantity
        );
    END IF;
    
    -- 7. r�vMMn� ��w�	
    SELECT loc INTO v_current_location
    FROM record_history
    WHERE plt_num = v_pallet_num
    ORDER BY time DESC
    LIMIT 1;
    
    -- 8. �e�	
    INSERT INTO order_loading (
        order_ref, plt_num, product_code, quantity,
        loaded_by_id, loaded_by_name, loaded_at,
        status, previous_location
    ) VALUES (
        p_order_ref, v_pallet_num, v_product_code, v_quantity,
        p_user_id, p_user_name, NOW(),
        'loaded', COALESCE(v_current_location, 'Unknown')
    );
    
    -- 9. ���ix�
    UPDATE data_customerorder
    SET remain_qty = remain_qty - v_quantity
    WHERE order_ref = p_order_ref::INTEGER
    AND product_code = v_product_code;
    
    -- 10. �ew�
    INSERT INTO record_history (
        uuid, time, id, action, plt_num, loc, remark
    ) VALUES (
        gen_random_uuid(),
        NOW(),
        p_user_id::TEXT,
        'Order Loading',
        v_pallet_num,
        'Order: ' || p_order_ref,
        'Loaded to order ' || p_order_ref || ' by ' || p_user_name
    ) RETURNING uuid INTO v_history_id;
    
    -- 11. ���X4s
    UPDATE stock_level
    SET quantity = quantity - v_quantity,
        last_updated = NOW()
    WHERE product_code = v_product_code;
    
    -- 12. ���X�Mn�x�	
    UPDATE record_inventory
    SET injection = 0,
        pipeline = 0,
        prebook = 0,
        await = 0,
        fold = 0,
        bulk = 0,
        backcarpark = 0,
        damage = 0
    WHERE plt_num = v_pallet_num;
    
    -- 13. ��X�;
    UPDATE record_palletinfo
    SET plt_remark = COALESCE(plt_remark || ' | ', '') || 'Loaded to Order: ' || p_order_ref
    WHERE plt_num = v_pallet_num;
    
    -- ����P�
    v_result := json_build_object(
        'success', true,
        'message', 'Pallet loaded successfully',
        'data', json_build_object(
            'order_ref', p_order_ref,
            'pallet_number', v_pallet_num,
            'product_code', v_product_code,
            'quantity', v_quantity,
            'remaining_qty', v_order_product.remain_qty - v_quantity,
            'loaded_by', p_user_name,
            'loaded_at', NOW(),
            'history_id', v_history_id
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- |/�B��
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ���	�\
CREATE OR REPLACE FUNCTION rpc_undo_load_pallet(
    p_order_ref TEXT,
    p_pallet_num TEXT,
    p_product_code TEXT,
    p_quantity INTEGER,
    p_user_id INTEGER DEFAULT 0,
    p_user_name TEXT DEFAULT 'System'
) RETURNS json AS $$
DECLARE
    v_load_record record;
    v_result json;
    v_history_id UUID;
BEGIN
    -- 1. �~�	
    SELECT * INTO v_load_record
    FROM order_loading
    WHERE order_ref = p_order_ref
    AND plt_num = p_pallet_num
    AND product_code = p_product_code
    AND status = 'loaded';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Load record not found'
        );
    END IF;
    
    -- 2. ���ix�b�	
    UPDATE data_customerorder
    SET remain_qty = remain_qty + p_quantity
    WHERE order_ref = p_order_ref::INTEGER
    AND product_code = p_product_code;
    
    -- 3. �e��w�
    INSERT INTO record_history (
        uuid, time, id, action, plt_num, loc, remark
    ) VALUES (
        gen_random_uuid(),
        NOW(),
        p_user_id::TEXT,
        'Order Unloading',
        p_pallet_num,
        COALESCE(v_load_record.previous_location, 'Pipeline'),
        'Unloaded from order ' || p_order_ref || ' by ' || p_user_name
    ) RETURNING uuid INTO v_history_id;
    
    -- 4. ���X4sb�	
    UPDATE stock_level
    SET quantity = quantity + p_quantity,
        last_updated = NOW()
    WHERE product_code = p_product_code;
    
    -- 5. ���Xb�0 pipeline	
    UPDATE record_inventory
    SET pipeline = p_quantity
    WHERE plt_num = p_pallet_num;
    
    -- 6. ��X�;
    UPDATE record_palletinfo
    SET plt_remark = COALESCE(plt_remark || ' | ', '') || 'Unloaded from Order: ' || p_order_ref
    WHERE plt_num = p_pallet_num;
    
    -- 7. *d�	
    DELETE FROM order_loading
    WHERE order_ref = p_order_ref
    AND plt_num = p_pallet_num
    AND product_code = p_product_code
    AND status = 'loaded';
    
    -- ����P�
    v_result := json_build_object(
        'success', true,
        'message', 'Pallet unloaded successfully',
        'data', json_build_object(
            'order_ref', p_order_ref,
            'pallet_number', p_pallet_num,
            'product_code', p_product_code,
            'quantity', p_quantity,
            'unloaded_by', p_user_name,
            'unloaded_at', NOW(),
            'restored_location', COALESCE(v_load_record.previous_location, 'Pipeline'),
            'history_id', v_history_id
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- 4. �b�L�x (Query Execution Functions)
-- ====================================================

-- �L� SQL �b(� Ask Me Anything	
CREATE OR REPLACE FUNCTION execute_sql_query(query_text TEXT)
RETURNS TABLE(result JSONB) AS $$
BEGIN
    -- �h���A1 SELECT ��
    IF NOT (TRIM(UPPER(query_text)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- �bq��uW
    IF query_text ~* '(DELETE|INSERT|UPDATE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)' THEN
        RAISE EXCEPTION 'Dangerous SQL keywords detected';
    END IF;
    
    -- �L�b&�� JSON P�
    RETURN QUERY EXECUTE 
        'SELECT to_jsonb(t) FROM (' || query_text || ') t';
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- 5. �X��x (Stock Management Functions)
-- ====================================================

-- ���X4s(� void �\	
CREATE OR REPLACE FUNCTION update_stock_level_void(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_operation TEXT
) RETURNS TEXT AS $$
DECLARE
    v_current_qty BIGINT;
    v_new_qty BIGINT;
BEGIN
    -- r�vM�X
    SELECT quantity INTO v_current_qty
    FROM stock_level
    WHERE product_code = p_product_code;
    
    IF NOT FOUND THEN
        RETURN 'Product not found in stock_level: ' || p_product_code;
    END IF;
    
    -- ��x�void �\�X	
    v_new_qty := v_current_qty - p_quantity;
    
    -- ����x
    IF v_new_qty < 0 THEN
        v_new_qty := 0;
    END IF;
    
    -- ���X
    UPDATE stock_level
    SET quantity = v_new_qty,
        last_updated = NOW()
    WHERE product_code = p_product_code;
    
    RETURN format('Stock updated for %s: %s -> %s (-%s for %s)',
        p_product_code, v_current_qty, v_new_qty, p_quantity, p_operation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- 6. "�Ǚ�b�x (Product Query Functions)
-- ====================================================

-- 9�"��r�"�s�
CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
RETURNS TABLE(
    code TEXT,
    description TEXT,
    type TEXT,
    short_code TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.code,
        dc.description,
        dc.type,
        dc.short_code,
        dc.category
    FROM data_code dc
    WHERE dc.code = p_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- �
-n (Permissions)
-- ====================================================

-- �@	�x-niv�
P
GRANT EXECUTE ON FUNCTION rpc_load_pallet_to_order(TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_undo_load_pallet(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_stock_level_void(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_details_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_cleanup_pallet_buffer() TO service_role;

-- ====================================================
-- �w� (Maintenance Notes)
-- ====================================================
-- 1. ��L auto_cleanup_pallet_buffer() N�]
-- 2. � daily_pallet_sequence h��w
-- 3. ��� pallet_number_buffer �(��
-- 4. ( pg_cron  Supabase Scheduler ���L
-- ====================================================