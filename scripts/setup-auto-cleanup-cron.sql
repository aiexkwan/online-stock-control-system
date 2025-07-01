-- 設置自動清理 Cron Job（需要 pg_cron extension）
-- 注意：Supabase 需要開啟 pg_cron extension

-- 1. 檢查 pg_cron 是否可用
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron extension is available';
    ELSE
        RAISE NOTICE 'pg_cron extension is NOT available - manual cleanup required';
    END IF;
END;
$$;

-- 2. 如果 pg_cron 可用，設置定期清理任務
-- 每 30 分鐘執行一次清理
/*
SELECT cron.schedule(
    'cleanup-pallet-buffer',           -- job name
    '*/30 * * * *',                   -- every 30 minutes
    'SELECT auto_cleanup_pallet_buffer();'
);
*/

-- 3. 另一個選擇：使用 Supabase Edge Functions 或 外部 cron service
-- 創建一個可以通過 API 調用的清理函數
CREATE OR REPLACE FUNCTION api_cleanup_pallet_buffer()
RETURNS json AS $$
DECLARE
    v_deleted_unused INTEGER := 0;
    v_deleted_used INTEGER := 0;
    v_deleted_old INTEGER := 0;
    v_total_before INTEGER;
    v_total_after INTEGER;
BEGIN
    -- 獲取清理前的總數
    SELECT COUNT(*) INTO v_total_before FROM pallet_number_buffer;
    
    -- 清理非今日的條目
    DELETE FROM pallet_number_buffer
    WHERE date_str != TO_CHAR(CURRENT_DATE, 'DDMMYY');
    GET DIAGNOSTICS v_deleted_old = ROW_COUNT;
    
    -- 清理已使用超過 2 小時的條目
    DELETE FROM pallet_number_buffer
    WHERE used = 'True' 
    AND updated_at < NOW() - INTERVAL '2 hours';
    GET DIAGNOSTICS v_deleted_used = ROW_COUNT;
    
    -- 清理未使用超過 30 分鐘的條目
    DELETE FROM pallet_number_buffer
    WHERE used = 'False' 
    AND updated_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS v_deleted_unused = ROW_COUNT;
    
    -- 獲取清理後的總數
    SELECT COUNT(*) INTO v_total_after FROM pallet_number_buffer;
    
    -- 返回清理結果
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

-- 授權 API 函數
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO anon;
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO authenticated;

-- 4. 手動執行清理的簡單命令
-- 管理員可以隨時執行
CREATE OR REPLACE FUNCTION manual_cleanup_buffer()
RETURNS TABLE(
    status TEXT,
    deleted_count INTEGER,
    remaining_count INTEGER
) AS $$
BEGIN
    -- 執行清理
    PERFORM auto_cleanup_pallet_buffer();
    
    -- 返回結果
    RETURN QUERY
    SELECT 
        'Cleanup completed'::TEXT as status,
        (SELECT COUNT(*)::INTEGER FROM pallet_number_buffer WHERE used = 'True') as deleted_count,
        (SELECT COUNT(*)::INTEGER FROM pallet_number_buffer WHERE used = 'False') as remaining_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION manual_cleanup_buffer() TO authenticated;