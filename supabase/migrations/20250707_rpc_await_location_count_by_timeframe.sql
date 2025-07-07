/**
 * RPC Function: Get Await Location Count by Timeframe
 * 用於 StillInAwaitWidget 的優化查詢
 * 
 * 功能：
 * - 獲取指定時間範圍內生成的棧板中仍在 Await 位置的數量
 * - 服務器端優化查詢，避免客戶端多次請求和複雜處理
 * - 基於 rpc_get_await_percentage_stats 簡化，只返回計數
 * 
 * 參數：
 * - p_start_date: 開始時間（棧板生成時間）
 * - p_end_date: 結束時間（棧板生成時間）
 * 
 * 返回：包含計數和元數據的JSON對象
 */

CREATE OR REPLACE FUNCTION rpc_get_await_location_count_by_timeframe(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_pallets INTEGER := 0;
    v_still_await INTEGER := 0;
    v_result JSONB;
    v_execution_start TIMESTAMPTZ := clock_timestamp();
    v_calculation_time TEXT;
BEGIN
    -- 參數驗證
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Start date and end date are required',
            'await_count', 0,
            'total_pallets', 0
        );
    END IF;
    
    IF p_end_date <= p_start_date THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'End date must be after start date',
            'await_count', 0,
            'total_pallets', 0
        );
    END IF;
    
    -- 獲取指定時間範圍內生成的棧板總數
    SELECT COUNT(*) 
    INTO v_total_pallets
    FROM record_palletinfo 
    WHERE generate_time >= p_start_date 
      AND generate_time <= p_end_date;
    
    -- 如果沒有棧板，返回零統計
    IF v_total_pallets = 0 THEN
        v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000, 2)::TEXT || 'ms';
        
        RETURN jsonb_build_object(
            'success', true,
            'await_count', 0,
            'total_pallets', 0,
            'calculation_time', v_calculation_time,
            'date_range', jsonb_build_object(
                'start', p_start_date,
                'end', p_end_date
            ),
            'performance', jsonb_build_object(
                'optimized', true,
                'single_query', true,
                'server_calculated', true
            )
        );
    END IF;
    
    -- 使用優化查詢計算仍在 Await 位置的棧板數量
    WITH pallet_latest_locations AS (
        SELECT DISTINCT ON (rh.plt_num) 
            rh.plt_num,
            rh.loc as latest_location
        FROM record_history rh
        INNER JOIN record_palletinfo rpi ON rh.plt_num = rpi.plt_num
        WHERE rpi.generate_time >= p_start_date 
          AND rpi.generate_time <= p_end_date
          AND rh.plt_num IS NOT NULL
          AND rh.loc IS NOT NULL
        ORDER BY rh.plt_num, rh.time DESC
    )
    SELECT COUNT(*) 
    INTO v_still_await
    FROM pallet_latest_locations 
    WHERE latest_location IN ('Await', 'Awaiting');
    
    -- 計算執行時間
    v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000, 2)::TEXT || 'ms';
    
    -- 構建結果 JSON
    v_result := jsonb_build_object(
        'success', true,
        'await_count', v_still_await,
        'total_pallets', v_total_pallets,
        'calculation_time', v_calculation_time,
        'date_range', jsonb_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'performance', jsonb_build_object(
            'optimized', true,
            'single_query', true,
            'server_calculated', true,
            'query_method', 'DISTINCT_ON_WITH_JOIN'
        )
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- 錯誤處理：返回錯誤信息
    v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000, 2)::TEXT || 'ms';
    
    RAISE NOTICE 'Error in rpc_get_await_location_count_by_timeframe: %', SQLERRM;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'await_count', 0,
        'total_pallets', 0,
        'calculation_time', v_calculation_time
    );
END;
$$;

-- 添加函數註釋
COMMENT ON FUNCTION rpc_get_await_location_count_by_timeframe IS 
'Get count of pallets still in await location for a specific timeframe. Optimized for StillInAwaitWidget with server-side calculation and JOIN optimization.';

-- 設置函數權限
GRANT EXECUTE ON FUNCTION rpc_get_await_location_count_by_timeframe TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_await_location_count_by_timeframe TO service_role;

-- 創建優化索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_generate_time 
ON record_palletinfo(generate_time DESC) 
WHERE generate_time IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_record_history_plt_time_optimized 
ON record_history(plt_num, time DESC, loc) 
WHERE plt_num IS NOT NULL AND loc IS NOT NULL;

-- 複合索引優化 JOIN 查詢
CREATE INDEX IF NOT EXISTS idx_palletinfo_history_join_optimized 
ON record_palletinfo(plt_num, generate_time) 
WHERE generate_time IS NOT NULL;

COMMENT ON INDEX idx_palletinfo_history_join_optimized IS 
'Optimized compound index for pallet info and history JOIN queries with timeframe filtering';