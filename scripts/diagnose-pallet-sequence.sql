-- 診斷托盤編號序列問題
-- 此腳本用於深入分析序列不同步的原因

DO $$
DECLARE
    v_today TEXT;
    v_actual_max INTEGER;
    v_sequence_max INTEGER;
    v_buffer_unused INTEGER;
    v_buffer_used INTEGER;
    v_recent_pallet RECORD;
BEGIN
    -- 獲取今天的日期字符串
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    RAISE NOTICE '=== PALLET SEQUENCE DIAGNOSIS ===';
    RAISE NOTICE 'Date: %', v_today;
    RAISE NOTICE '';
    
    -- 1. 檢查實際的托盤編號
    RAISE NOTICE '1. Checking actual pallet numbers:';
    FOR v_recent_pallet IN 
        SELECT plt_num, generate_time 
        FROM record_palletinfo 
        WHERE plt_num LIKE v_today || '/%'
        ORDER BY CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER) DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '   - %: %', v_recent_pallet.plt_num, v_recent_pallet.generate_time;
    END LOOP;
    
    -- 獲取實際最大值
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
    ), 0) INTO v_actual_max
    FROM record_palletinfo
    WHERE plt_num LIKE v_today || '/%'
    AND plt_num ~ ('^' || v_today || '/[0-9]+$');
    
    RAISE NOTICE '';
    RAISE NOTICE '2. Actual maximum: %', v_actual_max;
    
    -- 2. 檢查序列表
    SELECT current_max INTO v_sequence_max
    FROM daily_pallet_sequence
    WHERE date_str = v_today;
    
    RAISE NOTICE '3. Sequence maximum: %', v_sequence_max;
    RAISE NOTICE '';
    
    -- 3. 檢查緩衝區
    SELECT 
        COUNT(*) FILTER (WHERE used = FALSE),
        COUNT(*) FILTER (WHERE used = TRUE)
    INTO v_buffer_unused, v_buffer_used
    FROM pallet_number_buffer
    WHERE date_str = v_today;
    
    RAISE NOTICE '4. Buffer status:';
    RAISE NOTICE '   - Unused: %', v_buffer_unused;
    RAISE NOTICE '   - Used: %', v_buffer_used;
    RAISE NOTICE '';
    
    -- 4. 檢查是否有跳號
    RAISE NOTICE '5. Checking for gaps in sequence:';
    WITH number_sequence AS (
        SELECT generate_series(1, v_actual_max) AS expected_num
    ),
    actual_numbers AS (
        SELECT CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER) AS actual_num
        FROM record_palletinfo
        WHERE plt_num LIKE v_today || '/%'
        AND plt_num ~ ('^' || v_today || '/[0-9]+$')
    )
    SELECT expected_num
    FROM number_sequence
    WHERE expected_num NOT IN (SELECT actual_num FROM actual_numbers)
    ORDER BY expected_num
    LIMIT 10
    INTO v_actual_max;
    
    IF v_actual_max IS NOT NULL THEN
        RAISE NOTICE '   - Found gaps in sequence!';
    ELSE
        RAISE NOTICE '   - No gaps found in sequence';
    END IF;
    
    -- 5. 建議操作
    RAISE NOTICE '';
    RAISE NOTICE '6. Recommendations:';
    IF v_sequence_max > v_actual_max THEN
        RAISE NOTICE '   - Sequence is ahead of actual data';
        RAISE NOTICE '   - This might cause gaps in numbering';
        RAISE NOTICE '   - Consider resetting sequence to actual max: %', v_actual_max;
    ELSIF v_sequence_max < v_actual_max THEN
        RAISE NOTICE '   - Sequence is behind actual data';
        RAISE NOTICE '   - This might cause duplicate numbers';
        RAISE NOTICE '   - Must update sequence to: %', v_actual_max;
    ELSE
        RAISE NOTICE '   - Sequence is in sync';
    END IF;
    
    IF v_buffer_unused > 20 THEN
        RAISE NOTICE '   - Consider cleaning up unused buffer entries';
    END IF;
    
END;
$$;

-- 顯示當前監控狀態
SELECT * FROM monitor_pallet_generation_v4();