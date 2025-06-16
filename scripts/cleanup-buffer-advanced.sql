-- 高級緩衝區清理腳本
-- 清理已使用和過期的緩衝區條目

DO $$
DECLARE
    v_today TEXT;
    v_deleted_used INTEGER;
    v_deleted_old INTEGER;
    v_total_before INTEGER;
    v_total_after INTEGER;
BEGIN
    -- 獲取今天的日期字符串
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 統計清理前的數量
    SELECT COUNT(*) INTO v_total_before
    FROM pallet_number_buffer
    WHERE date_str = v_today;
    
    RAISE NOTICE 'Buffer cleanup started...';
    RAISE NOTICE 'Total entries before cleanup: %', v_total_before;
    
    -- 1. 清理已使用超過 1 小時的條目
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE 
    AND used_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_deleted_used = ROW_COUNT;
    RAISE NOTICE 'Deleted % used entries older than 1 hour', v_deleted_used;
    
    -- 2. 清理未使用但超過 30 分鐘的條目
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE 
    AND allocated_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS v_deleted_old = ROW_COUNT;
    RAISE NOTICE 'Deleted % unused entries older than 30 minutes', v_deleted_old;
    
    -- 3. 清理非今天的所有條目
    DELETE FROM pallet_number_buffer
    WHERE date_str <> v_today;
    
    GET DIAGNOSTICS v_deleted_old = ROW_COUNT;
    RAISE NOTICE 'Deleted % entries from previous days', v_deleted_old;
    
    -- 統計清理後的數量
    SELECT COUNT(*) INTO v_total_after
    FROM pallet_number_buffer
    WHERE date_str = v_today;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Cleanup completed!';
    RAISE NOTICE 'Total entries after cleanup: %', v_total_after;
    RAISE NOTICE 'Total entries removed: %', v_total_before - v_total_after;
    
END;
$$;

-- 顯示清理後的緩衝區狀態
SELECT 
    date_str,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE used = TRUE) as used_entries,
    COUNT(*) FILTER (WHERE used = FALSE) as unused_entries,
    MIN(allocated_at) as oldest_entry,
    MAX(allocated_at) as newest_entry
FROM pallet_number_buffer
GROUP BY date_str
ORDER BY date_str DESC;