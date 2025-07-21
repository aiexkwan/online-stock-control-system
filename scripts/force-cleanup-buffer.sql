-- 強制清理緩衝區腳本
-- 用於清理所有已使用的緩衝區條目

DO $$
DECLARE
    v_today TEXT;
    v_total_before INTEGER;
    v_total_after INTEGER;
    v_deleted INTEGER;
BEGIN
    -- 獲取今天的日期字符串
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 統計清理前的數量
    SELECT COUNT(*) INTO v_total_before
    FROM pallet_number_buffer;

    RAISE NOTICE '=== FORCE BUFFER CLEANUP ===';
    RAISE NOTICE 'Total entries before cleanup: %', v_total_before;

    -- 顯示緩衝區詳情
    RAISE NOTICE '';
    RAISE NOTICE 'Buffer details:';
    PERFORM COUNT(*) FROM pallet_number_buffer WHERE used = TRUE;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '- Used entries: %', (SELECT COUNT(*) FROM pallet_number_buffer WHERE used = TRUE);
    RAISE NOTICE '- Unused entries: %', (SELECT COUNT(*) FROM pallet_number_buffer WHERE used = FALSE);
    RAISE NOTICE '- Today entries: %', (SELECT COUNT(*) FROM pallet_number_buffer WHERE date_str = v_today);

    -- 強制清理所有已使用的條目
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '';
    RAISE NOTICE 'Deleted % used entries', v_deleted;

    -- 清理超過 10 分鐘的未使用條目
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE
    AND allocated_at < NOW() - INTERVAL '10 minutes';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE 'Deleted % old unused entries', v_deleted;

    -- 統計清理後的數量
    SELECT COUNT(*) INTO v_total_after
    FROM pallet_number_buffer;

    RAISE NOTICE '';
    RAISE NOTICE '=== CLEANUP COMPLETED ===';
    RAISE NOTICE 'Total entries after cleanup: %', v_total_after;
    RAISE NOTICE 'Total entries removed: %', v_total_before - v_total_after;

END;
$$;

-- 顯示清理後的狀態
SELECT
    'Buffer Status' as info,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE used = TRUE) as used_entries,
    COUNT(*) FILTER (WHERE used = FALSE) as unused_entries
FROM pallet_number_buffer

UNION ALL

-- 顯示監控狀態
SELECT
    'Monitor Status' as info,
    out_buffer_count as total_entries,
    out_buffer_used as used_entries,
    out_buffer_count - out_buffer_used as unused_entries
FROM monitor_pallet_generation_v4();
