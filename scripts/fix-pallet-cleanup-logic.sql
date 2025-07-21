-- 修正 pallet_number_buffer 清理邏輯
-- 問題：原本的清理會刪除 used='False' 的未使用棧板號碼，導致 QC label 功能無法正常運作

-- 1. 修正清理函數，保留當日未使用的棧板號碼
CREATE OR REPLACE FUNCTION api_cleanup_pallet_buffer()
RETURNS json AS $$
DECLARE
    v_deleted_old INTEGER := 0;
    v_deleted_used INTEGER := 0;
    v_deleted_holded INTEGER := 0;
    v_total_before INTEGER;
    v_total_after INTEGER;
    v_current_date_str TEXT := TO_CHAR(CURRENT_DATE, 'DDMMYY');
BEGIN
    -- 獲取清理前的總數
    SELECT COUNT(*) INTO v_total_before FROM pallet_number_buffer;

    -- 批量刪除，但保留當日未使用的號碼
    WITH deleted_counts AS (
        DELETE FROM pallet_number_buffer
        WHERE
            -- 刪除非今日的資料
            date_str != v_current_date_str
            -- 刪除已使用超過 4 小時的資料（延長時間以防止意外清理）
            OR (used = 'True' AND updated_at < NOW() - INTERVAL '4 hours')
            -- 刪除處於 'Holded' 狀態超過 1 小時的資料（可能是異常狀況）
            OR (used = 'Holded' AND updated_at < NOW() - INTERVAL '1 hour')
            -- 🔥 重要：不再刪除 used = 'False' 的當日資料，這些是 QC label 需要的可用號碼
        RETURNING
            CASE
                WHEN date_str != v_current_date_str THEN 'old'
                WHEN used = 'True' THEN 'used'
                WHEN used = 'Holded' THEN 'holded'
                ELSE 'other'
            END as delete_type
    )
    SELECT
        COUNT(*) FILTER (WHERE delete_type = 'old'),
        COUNT(*) FILTER (WHERE delete_type = 'used'),
        COUNT(*) FILTER (WHERE delete_type = 'holded')
    INTO v_deleted_old, v_deleted_used, v_deleted_holded
    FROM deleted_counts;

    -- 獲取清理後的總數
    SELECT COUNT(*) INTO v_total_after FROM pallet_number_buffer;

    -- 返回詳細的清理結果
    RETURN json_build_object(
        'success', true,
        'deleted_old_days', v_deleted_old,
        'deleted_used', v_deleted_used,
        'deleted_holded', v_deleted_holded,
        'total_deleted', v_deleted_old + v_deleted_used + v_deleted_holded,
        'entries_before', v_total_before,
        'entries_after', v_total_after,
        'unused_preserved', (SELECT COUNT(*) FROM pallet_number_buffer WHERE used = 'False'),
        'cleaned_at', NOW(),
        'note', 'Preserved unused pallet numbers for QC label functionality'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 創建專門的監控函數，檢查 buffer 健康狀況
CREATE OR REPLACE FUNCTION check_pallet_buffer_health()
RETURNS json AS $$
DECLARE
    v_current_date_str TEXT := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    v_unused_count INTEGER;
    v_used_count INTEGER;
    v_holded_count INTEGER;
    v_old_dates_count INTEGER;
    v_needs_reset BOOLEAN := false;
BEGIN
    -- 統計各種狀態的數量
    SELECT
        COUNT(*) FILTER (WHERE used = 'False') as unused,
        COUNT(*) FILTER (WHERE used = 'True') as used,
        COUNT(*) FILTER (WHERE used = 'Holded') as holded,
        COUNT(*) FILTER (WHERE date_str != v_current_date_str) as old_dates
    INTO v_unused_count, v_used_count, v_holded_count, v_old_dates_count
    FROM pallet_number_buffer;

    -- 檢查是否需要重置（可用號碼過少）
    IF v_unused_count < 50 THEN
        v_needs_reset := true;
    END IF;

    RETURN json_build_object(
        'current_date', v_current_date_str,
        'unused_count', v_unused_count,
        'used_count', v_used_count,
        'holded_count', v_holded_count,
        'old_dates_count', v_old_dates_count,
        'total_count', v_unused_count + v_used_count + v_holded_count + v_old_dates_count,
        'needs_reset', v_needs_reset,
        'health_status', CASE
            WHEN v_unused_count >= 100 THEN 'healthy'
            WHEN v_unused_count >= 50 THEN 'warning'
            ELSE 'critical'
        END,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 創建智能重置函數，只在需要時重置
CREATE OR REPLACE FUNCTION smart_reset_pallet_buffer()
RETURNS json AS $$
DECLARE
    v_health_check json;
    v_needs_reset BOOLEAN;
    v_result json;
BEGIN
    -- 檢查健康狀況
    SELECT check_pallet_buffer_health() INTO v_health_check;
    v_needs_reset := (v_health_check->>'needs_reset')::boolean;

    IF v_needs_reset THEN
        -- 執行重置
        PERFORM reset_daily_pallet_buffer();
        v_result := json_build_object(
            'action', 'reset_performed',
            'reason', 'insufficient_unused_numbers',
            'health_before', v_health_check,
            'reset_at', NOW()
        );
    ELSE
        v_result := json_build_object(
            'action', 'no_reset_needed',
            'health_status', v_health_check,
            'checked_at', NOW()
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 授權函數
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer() TO service_role;
GRANT EXECUTE ON FUNCTION check_pallet_buffer_health() TO service_role;
GRANT EXECUTE ON FUNCTION smart_reset_pallet_buffer() TO service_role;

-- 5. 為監控提供權限
GRANT EXECUTE ON FUNCTION check_pallet_buffer_health() TO authenticated;
GRANT EXECUTE ON FUNCTION smart_reset_pallet_buffer() TO authenticated;

-- 6. 測試新的清理邏輯
DO $$
DECLARE
    v_cleanup_result json;
    v_health_result json;
BEGIN
    RAISE NOTICE '=== 測試修正後的清理邏輯 ===';

    -- 執行清理
    SELECT api_cleanup_pallet_buffer() INTO v_cleanup_result;
    RAISE NOTICE '清理結果: %', v_cleanup_result;

    -- 檢查健康狀況
    SELECT check_pallet_buffer_health() INTO v_health_result;
    RAISE NOTICE '健康狀況: %', v_health_result;

    RAISE NOTICE '✅ 修正完成：現在清理邏輯會保留當日未使用的棧板號碼供 QC label 使用';
END;
$$;
