-- 部署清理函數到 Supabase
-- 只包含必要的清理函數，不包含 v5 pallet generation

-- 創建 API 清理函數
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
    WHERE used = TRUE
    AND used_at < NOW() - INTERVAL '2 hours';
    GET DIAGNOSTICS v_deleted_used = ROW_COUNT;

    -- 清理未使用超過 30 分鐘的條目
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE
    AND allocated_at < NOW() - INTERVAL '30 minutes';
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
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO service_role;

-- 測試函數是否正常運作
SELECT api_cleanup_pallet_buffer();

-- 查看當前 buffer 狀態
SELECT
    date_str,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE used = true) as used_entries,
    COUNT(*) FILTER (WHERE used = false) as unused_entries,
    MIN(allocated_at) as oldest_entry,
    MAX(allocated_at) as newest_entry
FROM pallet_number_buffer
GROUP BY date_str
ORDER BY date_str DESC;
