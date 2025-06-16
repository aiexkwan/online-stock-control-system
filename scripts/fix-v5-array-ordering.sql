-- 修復 v5 函數，確保返回的數組總是正確排序
CREATE OR REPLACE FUNCTION public.generate_atomic_pallet_numbers_v5(p_count integer, p_session_id text DEFAULT NULL::text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    -- 獲取當前日期字符串
    v_today := CURRENT_DATE::TEXT;
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 嘗試從緩衝區獲取未使用的號碼（使用數字排序）
    IF EXISTS (SELECT 1 FROM pallet_number_buffer WHERE date_str = v_current_date_str AND used = FALSE) THEN
        -- 使用數字排序
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
        
        -- 如果緩衝區有足夠的號碼，標記為已使用並返回
        IF array_length(v_result, 1) = p_count THEN
            UPDATE pallet_number_buffer
            SET used = TRUE,
                used_at = NOW(),
                session_id = p_session_id
            WHERE pallet_number = ANY(v_result);
            
            -- 確保返回的數組是排序的
            SELECT array_agg(elem ORDER BY CAST(SPLIT_PART(elem, '/', 2) AS INTEGER))
            INTO v_result
            FROM unnest(v_result) AS elem;
            
            RETURN v_result;
        END IF;
    END IF;
    
    -- 緩衝區號碼不足，需要生成新號碼
    -- 使用 SERIALIZABLE 隔離級別確保原子性
    BEGIN
        -- 鎖定序列表記錄
        INSERT INTO daily_pallet_sequence (date_str, current_max)
        VALUES (v_current_date_str, 0)
        ON CONFLICT (date_str) DO NOTHING;
        
        -- 使用 FOR UPDATE 鎖定記錄
        SELECT current_max 
        INTO v_sequence_max
        FROM daily_pallet_sequence
        WHERE date_str = v_current_date_str
        FOR UPDATE;
        
        -- 檢查實際表中的最大值（加入索引優化）
        SELECT COALESCE(MAX(
            CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
        ), 0) 
        INTO v_existing_max
        FROM record_palletinfo
        WHERE plt_num LIKE v_current_date_str || '/%'
        AND plt_num ~ ('^' || v_current_date_str || '/[0-9]+$');
        
        -- 使用較大值作為起始點
        v_start_num := GREATEST(v_existing_max, COALESCE(v_sequence_max, 0));
        
        -- 更新序列表
        UPDATE daily_pallet_sequence
        SET current_max = v_start_num + p_count,
            last_updated = NOW()
        WHERE date_str = v_current_date_str;
        
        -- 生成號碼 - 確保順序正確
        v_result := ARRAY[]::TEXT[];
        FOR i IN 1..p_count LOOP
            v_result := array_append(v_result, v_current_date_str || '/' || (v_start_num + i));
        END LOOP;
        
        -- 確保返回的數組是排序的（防禦性編程）
        SELECT array_agg(elem ORDER BY CAST(SPLIT_PART(elem, '/', 2) AS INTEGER))
        INTO v_result
        FROM unnest(v_result) AS elem;
        
        -- 批量插入到緩衝表（預分配額外的號碼）
        IF p_count < 10 THEN
            -- 對於小批量，預分配額外 10 個號碼
            v_new_numbers := ARRAY[]::TEXT[];
            FOR i IN (p_count + 1)..(p_count + 10) LOOP
                v_new_numbers := array_append(v_new_numbers, v_current_date_str || '/' || (v_start_num + i));
            END LOOP;
            
            -- 插入預分配的號碼（忽略重複）
            INSERT INTO pallet_number_buffer (pallet_number, date_str, used)
            SELECT unnest(v_new_numbers), v_current_date_str, FALSE
            ON CONFLICT (pallet_number) DO NOTHING;
            
            -- 同時更新序列表
            UPDATE daily_pallet_sequence
            SET current_max = v_start_num + p_count + 10
            WHERE date_str = v_current_date_str;
        END IF;
        
        -- 標記使用的號碼
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
$function$;