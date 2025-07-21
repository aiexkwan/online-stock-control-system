-- RPC Function: rpc_get_warehouse_work_level
-- Description: 獲取倉庫部門的工作水平統計數據
-- Created: 2025-01-07
-- Author: NewPennine System

-- 首先創建索引以優化查詢性能
CREATE INDEX IF NOT EXISTS idx_work_level_latest_update ON work_level(latest_update) WHERE latest_update IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_level_id ON work_level(id);
CREATE INDEX IF NOT EXISTS idx_data_id_department ON data_id(department) WHERE department = 'Warehouse';
CREATE INDEX IF NOT EXISTS idx_data_id_id ON data_id(id);

-- 創建複合索引以優化 JOIN 操作
CREATE INDEX IF NOT EXISTS idx_work_level_id_latest_update ON work_level(id, latest_update);
CREATE INDEX IF NOT EXISTS idx_data_id_id_department ON data_id(id, department);

-- 刪除舊函數（如果存在）
DROP FUNCTION IF EXISTS public.rpc_get_warehouse_work_level(timestamptz, timestamptz, text);

-- 創建 RPC 函數
CREATE OR REPLACE FUNCTION public.rpc_get_warehouse_work_level(
    p_start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
    p_end_date timestamptz DEFAULT NOW(),
    p_department text DEFAULT 'Warehouse'
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE  -- 改為 VOLATILE 因為函數會建立和刪除臨時表
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time timestamptz;
    v_daily_stats jsonb;
    v_total_moves bigint;
    v_unique_operators bigint;
    v_avg_moves_per_day numeric;
    v_peak_day record;
    v_calculation_time interval;
    v_result jsonb;
BEGIN
    -- 記錄開始時間
    v_start_time := clock_timestamp();

    -- 驗證日期參數
    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date must be before end date';
    END IF;

    IF p_end_date > NOW() + INTERVAL '1 day' THEN
        RAISE EXCEPTION 'End date cannot be in the future';
    END IF;

    -- 限制查詢範圍（最多 365 天）
    IF p_end_date - p_start_date > INTERVAL '365 days' THEN
        RAISE EXCEPTION 'Date range cannot exceed 365 days';
    END IF;

    -- 創建臨時表以優化計算
    CREATE TEMP TABLE temp_warehouse_moves AS
    SELECT
        DATE(wl.latest_update AT TIME ZONE 'UTC') as work_date,
        di.name as operator,  -- 修正：使用 data_id.name 作為 operator
        COALESCE(wl.move, 0) as move
    FROM work_level wl
    INNER JOIN data_id di ON wl.id = di.id
    WHERE di.department = p_department
        AND wl.latest_update >= p_start_date
        AND wl.latest_update < p_end_date + INTERVAL '1 day'
        AND wl.latest_update IS NOT NULL
        AND wl.move > 0;

    -- 創建索引以加速後續查詢
    CREATE INDEX idx_temp_work_date ON temp_warehouse_moves(work_date);

    -- 計算日期分組統計
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', daily_stat.work_date,
            'total_moves', daily_stat.total_moves,
            'operator_count', daily_stat.operator_count,
            'operators', daily_stat.operators
        ) ORDER BY daily_stat.work_date
    ) INTO v_daily_stats
    FROM (
        SELECT
            work_date,
            SUM(move) as total_moves,
            COUNT(DISTINCT operator) as operator_count,
            jsonb_agg(DISTINCT operator) as operators
        FROM temp_warehouse_moves
        GROUP BY work_date
    ) daily_stat;

    -- 計算總移動數
    SELECT COALESCE(SUM(move), 0)
    INTO v_total_moves
    FROM temp_warehouse_moves;

    -- 計算唯一操作員數
    SELECT COUNT(DISTINCT operator)
    INTO v_unique_operators
    FROM temp_warehouse_moves
    WHERE operator IS NOT NULL;

    -- 計算平均每日移動數
    WITH daily_totals AS (
        SELECT work_date, SUM(move) as daily_total
        FROM temp_warehouse_moves
        GROUP BY work_date
    )
    SELECT ROUND(AVG(daily_total), 2)
    INTO v_avg_moves_per_day
    FROM daily_totals;

    -- 找出高峰日期
    WITH daily_peaks AS (
        SELECT
            work_date,
            SUM(move) as total_moves
        FROM temp_warehouse_moves
        GROUP BY work_date
        ORDER BY total_moves DESC
        LIMIT 1
    )
    SELECT work_date, total_moves
    INTO v_peak_day
    FROM daily_peaks;

    -- 清理臨時表
    DROP TABLE IF EXISTS temp_warehouse_moves;

    -- 計算執行時間
    v_calculation_time := clock_timestamp() - v_start_time;

    -- 構建返回結果
    v_result := jsonb_build_object(
        'daily_stats', COALESCE(v_daily_stats, '[]'::jsonb),
        'total_moves', COALESCE(v_total_moves, 0),
        'unique_operators', COALESCE(v_unique_operators, 0),
        'avg_moves_per_day', COALESCE(v_avg_moves_per_day, 0),
        'peak_day', CASE
            WHEN v_peak_day.work_date IS NOT NULL THEN
                jsonb_build_object(
                    'date', v_peak_day.work_date,
                    'moves', v_peak_day.total_moves
                )
            ELSE NULL
        END,
        'calculation_time', extract(epoch from v_calculation_time) * 1000 || ' ms',
        'query_params', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date,
            'department', p_department
        ),
        'metadata', jsonb_build_object(
            'executed_at', NOW(),
            'version', '1.0.1'
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- 清理臨時表（如果存在）
        DROP TABLE IF EXISTS temp_warehouse_moves;

        -- 返回錯誤信息
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'detail', SQLSTATE,
            'hint', 'Please check your parameters and try again',
            'query_params', jsonb_build_object(
                'start_date', p_start_date,
                'end_date', p_end_date,
                'department', p_department
            )
        );
END;
$$;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION public.rpc_get_warehouse_work_level(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_warehouse_work_level(timestamptz, timestamptz, text) TO service_role;

-- 添加函數註釋
COMMENT ON FUNCTION public.rpc_get_warehouse_work_level(timestamptz, timestamptz, text) IS
'獲取倉庫部門的工作水平統計數據，包括每日移動數、操作員統計和高峰期分析。
參數：
- p_start_date: 開始日期（預設為過去30天）
- p_end_date: 結束日期（預設為今天）
- p_department: 部門名稱（預設為 Warehouse）
返回 JSON 格式的統計數據。';

-- 創建輔助函數以提供簡化的調用接口
CREATE OR REPLACE FUNCTION public.rpc_get_warehouse_work_level_today()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT public.rpc_get_warehouse_work_level(
        CURRENT_DATE::timestamptz,
        CURRENT_DATE::timestamptz + INTERVAL '1 day' - INTERVAL '1 second'
    );
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_warehouse_work_level_this_week()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT public.rpc_get_warehouse_work_level(
        date_trunc('week', CURRENT_DATE)::timestamptz,
        NOW()
    );
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_warehouse_work_level_this_month()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT public.rpc_get_warehouse_work_level(
        date_trunc('month', CURRENT_DATE)::timestamptz,
        NOW()
    );
$$;

-- 授予輔助函數執行權限
GRANT EXECUTE ON FUNCTION public.rpc_get_warehouse_work_level_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_warehouse_work_level_this_week() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_warehouse_work_level_this_month() TO authenticated;

-- 性能測試查詢（註釋形式）
/*
-- 測試查詢：獲取過去 7 天的數據
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '7 days',
    NOW()
);

-- 測試查詢：獲取今天的數據
SELECT public.rpc_get_warehouse_work_level_today();

-- 測試查詢：獲取本週的數據
SELECT public.rpc_get_warehouse_work_level_this_week();

-- 測試查詢：獲取本月的數據
SELECT public.rpc_get_warehouse_work_level_this_month();

-- 性能分析查詢
EXPLAIN (ANALYZE, BUFFERS, TIMING, VERBOSE)
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '30 days',
    NOW()
);
*/

-- 建議的維護任務
/*
-- 定期更新統計信息
ANALYZE work_level;
ANALYZE data_id;

-- 監控索引使用情況
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('work_level', 'data_id')
ORDER BY idx_scan DESC;

-- 檢查表大小和索引大小
SELECT
    pg_size_pretty(pg_total_relation_size('work_level')) as table_size,
    pg_size_pretty(pg_indexes_size('work_level')) as indexes_size;
*/
