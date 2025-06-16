-- 修復 v5 函數，避免產生號碼空洞
CREATE OR REPLACE FUNCTION public.generate_atomic_pallet_numbers_v5(p_count integer, p_session_id text DEFAULT NULL::text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result TEXT[] := ARRAY[]::TEXT[];
    v_current_date_str TEXT;
    v_next_num INTEGER;
    v_available_count INTEGER;
    v_from_buffer TEXT[] := ARRAY[]::TEXT[];
    v_need_generate INTEGER;
    i INTEGER;
BEGIN
    -- 獲取當前日期字符串
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 步驟1：嘗試從緩衝區獲取號碼
    SELECT array_agg(pallet_number ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER))
    INTO v_from_buffer
    FROM (
        SELECT pallet_number
        FROM pallet_number_buffer
        WHERE date_str = v_current_date_str
        AND used = FALSE
        ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER)
        LIMIT p_count
        FOR UPDATE SKIP LOCKED
    ) AS available_numbers;
    
    v_available_count := COALESCE(array_length(v_from_buffer, 1), 0);
    
    -- 如果從緩衝區獲得了一些號碼，標記為已使用
    IF v_available_count > 0 THEN
        UPDATE pallet_number_buffer
        SET used = TRUE,
            used_at = NOW(),
            session_id = p_session_id
        WHERE pallet_number = ANY(v_from_buffer);
        
        v_result := v_from_buffer;
        RAISE NOTICE '[v5] Got % numbers from buffer', v_available_count;
    END IF;
    
    -- 步驟2：如果還需要更多號碼，生成新的
    v_need_generate := p_count - v_available_count;
    IF v_need_generate > 0 THEN
        -- 找出下一個應該使用的號碼
        SELECT COALESCE(MAX(num), 0) + 1
        INTO v_next_num
        FROM (
            -- 檢查 record_palletinfo
            SELECT CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER) as num
            FROM record_palletinfo
            WHERE plt_num LIKE v_current_date_str || '/%'
            
            UNION ALL
            
            -- 檢查 pallet_number_buffer
            SELECT CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) as num
            FROM pallet_number_buffer
            WHERE date_str = v_current_date_str
        ) AS all_numbers;
        
        -- 生成連續的號碼
        FOR i IN 0..(v_need_generate - 1) LOOP
            v_result := array_append(v_result, v_current_date_str || '/' || (v_next_num + i));
        END LOOP;
        
        -- 將生成的號碼插入緩衝區並標記為已使用
        INSERT INTO pallet_number_buffer (pallet_number, date_str, used, used_at, session_id)
        SELECT unnest(v_result[v_available_count + 1:array_length(v_result, 1)]), 
               v_current_date_str, TRUE, NOW(), p_session_id
        ON CONFLICT (pallet_number) 
        DO UPDATE SET 
            used = TRUE,
            used_at = NOW(),
            session_id = p_session_id;
        
        -- 更新序列表（但只更新到實際使用的最大值）
        UPDATE daily_pallet_sequence
        SET current_max = v_next_num + v_need_generate - 1,
            last_updated = NOW()
        WHERE date_str = v_current_date_str;
        
        -- 如果序列表不存在，插入
        INSERT INTO daily_pallet_sequence (date_str, current_max)
        VALUES (v_current_date_str, v_next_num + v_need_generate - 1)
        ON CONFLICT (date_str) DO NOTHING;
        
        RAISE NOTICE '[v5] Generated % new numbers starting from %', v_need_generate, v_next_num;
    END IF;
    
    -- 確保返回的數組是排序的
    SELECT array_agg(elem ORDER BY CAST(SPLIT_PART(elem, '/', 2) AS INTEGER))
    INTO v_result
    FROM unnest(v_result) AS elem;
    
    RETURN v_result;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in generate_atomic_pallet_numbers_v5: %', SQLERRM;
        RAISE;
END;
$function$;