-- 修復托盤編號序列同步問題
-- 執行此腳本來同步序列表與實際數據

DO $$
DECLARE
    v_today TEXT;
    v_actual_max INTEGER;
    v_sequence_max INTEGER;
BEGIN
    -- 獲取今天的日期字符串
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 獲取實際的最大編號
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
    ), 0) INTO v_actual_max
    FROM record_palletinfo
    WHERE plt_num LIKE v_today || '/%'
    AND plt_num ~ ('^' || v_today || '/[0-9]+$');
    
    -- 獲取序列表中的值
    SELECT current_max INTO v_sequence_max
    FROM daily_pallet_sequence
    WHERE date_str = v_today;
    
    RAISE NOTICE 'Current date: %', v_today;
    RAISE NOTICE 'Actual max in record_palletinfo: %', v_actual_max;
    RAISE NOTICE 'Sequence max in daily_pallet_sequence: %', v_sequence_max;
    
    -- 如果不同步，更新序列表
    IF v_sequence_max IS NULL OR v_sequence_max <> v_actual_max THEN
        INSERT INTO daily_pallet_sequence (date_str, current_max, last_updated)
        VALUES (v_today, v_actual_max, NOW())
        ON CONFLICT (date_str) 
        DO UPDATE SET 
            current_max = v_actual_max,
            last_updated = NOW();
            
        RAISE NOTICE 'Updated sequence from % to %', v_sequence_max, v_actual_max;
    ELSE
        RAISE NOTICE 'Sequence is already in sync';
    END IF;
    
    -- 清理緩衝區中的過期數據
    DELETE FROM pallet_number_buffer
    WHERE allocated_at < NOW() - INTERVAL '10 minutes'
    AND used = FALSE;
    
    GET DIAGNOSTICS v_actual_max = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % unused buffer entries', v_actual_max;
    
END;
$$;

-- 檢查當前狀態
SELECT * FROM monitor_pallet_generation_v4();