-- 創建簡化版的 v6 pallet 生成函數
CREATE OR REPLACE FUNCTION public.generate_atomic_pallet_numbers_v6(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result TEXT[] := ARRAY[]::TEXT[];
    v_date_str TEXT;
BEGIN
    -- 獲取當前日期
    v_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 檢查是否是新的一天，如果緩衝區日期不匹配則重置
    IF NOT EXISTS (
        SELECT 1 FROM pallet_number_buffer 
        WHERE date_str = v_date_str 
        LIMIT 1
    ) THEN
        PERFORM reset_daily_pallet_buffer();
    END IF;
    
    -- 獲取可用的 pallet numbers
    SELECT array_agg(pallet_number ORDER BY id)
    INTO v_result
    FROM (
        SELECT pb.id, pb.pallet_number
        FROM pallet_number_buffer pb
        WHERE pb.used = 'False'
        AND pb.date_str = v_date_str
        ORDER BY pb.id
        LIMIT p_count
        FOR UPDATE SKIP LOCKED
    ) AS available;
    
    -- 檢查是否獲得足夠的號碼
    IF array_length(v_result, 1) IS NULL OR array_length(v_result, 1) < p_count THEN
        RAISE EXCEPTION 'Not enough pallet numbers available. Requested: %, Available: %', 
            p_count, COALESCE(array_length(v_result, 1), 0);
    END IF;
    
    -- 將這些號碼標記為 Holded
    UPDATE pallet_number_buffer
    SET used = 'Holded',
        updated_at = NOW()
    WHERE pallet_number = ANY(v_result);
    
    RAISE NOTICE '[v6] Reserved % pallet numbers: %', array_length(v_result, 1), v_result;
    
    RETURN v_result;
END;
$$;

-- 創建確認函數（列印成功後調用）
CREATE OR REPLACE FUNCTION public.confirm_pallet_usage(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'True',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';
    
    IF NOT FOUND THEN
        RAISE WARNING 'No pallet numbers were confirmed. They may have already been used or released.';
        RETURN FALSE;
    END IF;
    
    RAISE NOTICE '[v6] Confirmed % pallet numbers as used', array_length(p_pallet_numbers, 1);
    RETURN TRUE;
END;
$$;

-- 創建釋放函數（列印失敗或取消時調用）
CREATE OR REPLACE FUNCTION public.release_pallet_reservation(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';
    
    IF NOT FOUND THEN
        RAISE WARNING 'No pallet numbers were released. They may have already been used or were not held.';
        RETURN FALSE;
    END IF;
    
    RAISE NOTICE '[v6] Released % pallet numbers', array_length(p_pallet_numbers, 1);
    RETURN TRUE;
END;
$$;

-- 創建清理超時保留的函數（可選）
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 釋放超過 5 分鐘的保留
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE used = 'Holded'
    AND updated_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Released % expired holds', v_count;
    END IF;
    
    RETURN v_count;
END;
$$;