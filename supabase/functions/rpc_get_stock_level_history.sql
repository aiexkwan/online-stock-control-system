/**
 * RPC Function: Get Stock Level History
 * 用於 StockLevelHistoryChart 的優化查詢
 *
 * 功能：
 * - 獲取多個產品的庫存歷史數據
 * - 服務器端進行時間分段計算（默認24個時間段）
 * - 優化查詢性能和數據處理
 * - 支援動態時間範圍調整
 *
 * 參數：
 * - p_product_codes: 產品代碼數組 (最多10個)
 * - p_start_date: 開始時間
 * - p_end_date: 結束時間
 * - p_time_segments: 時間段數量 (默認24)
 *
 * 返回：時間段化的庫存歷史數據
 */

CREATE OR REPLACE FUNCTION rpc_get_stock_level_history(
    p_product_codes TEXT[] DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_time_segments INTEGER DEFAULT 24
)
RETURNS TABLE(
    time_segment TEXT,
    segment_start TIMESTAMPTZ,
    segment_end TIMESTAMPTZ,
    product_data JSONB,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_segment_duration INTERVAL;
    v_current_segment_start TIMESTAMPTZ;
    v_current_segment_end TIMESTAMPTZ;
    v_segment_index INTEGER := 0;
    v_total_duration INTERVAL;
    v_duration_days NUMERIC;
    v_time_format TEXT;
    v_product_codes_limited TEXT[];
    v_execution_start TIMESTAMPTZ := clock_timestamp();
    v_query_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- 參數驗證和默認值設置
    v_start_time := COALESCE(p_start_date, NOW() - INTERVAL '14 days');
    v_end_time := COALESCE(p_end_date, NOW());

    -- 限制產品代碼數量（最多10個）
    IF p_product_codes IS NOT NULL THEN
        v_product_codes_limited := p_product_codes[1:10];
    ELSE
        -- 如果沒有提供產品代碼，返回空結果
        RETURN;
    END IF;

    -- 驗證時間範圍
    IF v_start_time >= v_end_time THEN
        RAISE EXCEPTION 'Start time must be before end time';
    END IF;

    -- 計算時間段相關參數
    v_total_duration := v_end_time - v_start_time;
    v_duration_days := EXTRACT(EPOCH FROM v_total_duration) / 86400;
    v_segment_duration := v_total_duration / p_time_segments;

    -- 根據時間範圍決定時間格式
    IF v_duration_days <= 1 THEN
        v_time_format := 'HH24:MI';
    ELSIF v_duration_days <= 7 THEN
        v_time_format := 'Dy HH24:MI';
    ELSIF v_duration_days <= 30 THEN
        v_time_format := 'MM/DD';
    ELSE
        v_time_format := 'Mon DD';
    END IF;

    -- 生成時間段並獲取庫存數據
    FOR v_segment_index IN 0..(p_time_segments - 1) LOOP
        v_current_segment_start := v_start_time + (v_segment_duration * v_segment_index);
        v_current_segment_end := v_start_time + (v_segment_duration * (v_segment_index + 1));

        -- 為每個時間段構建產品數據
        WITH segment_data AS (
            SELECT
                sl.stock as product_code,
                sl.stock_level,
                sl.update_time,
                ROW_NUMBER() OVER (
                    PARTITION BY sl.stock
                    ORDER BY sl.update_time DESC
                ) as rn
            FROM stock_level sl
            WHERE sl.stock = ANY(v_product_codes_limited)
              AND sl.update_time >= v_current_segment_start
              AND sl.update_time < v_current_segment_end
        ),
        latest_in_segment AS (
            SELECT
                product_code,
                stock_level,
                update_time
            FROM segment_data
            WHERE rn = 1
        ),
        -- 獲取該時間段之前的最新數據（用於填充無數據的產品）
        previous_data AS (
            SELECT DISTINCT ON (sl.stock)
                sl.stock as product_code,
                sl.stock_level,
                sl.update_time
            FROM stock_level sl
            WHERE sl.stock = ANY(v_product_codes_limited)
              AND sl.update_time < v_current_segment_start
            ORDER BY sl.stock, sl.update_time DESC
        ),
        combined_data AS (
            -- 優先使用當前時間段的數據
            SELECT product_code, stock_level, update_time, 'current' as data_source
            FROM latest_in_segment

            UNION ALL

            -- 對於沒有當前數據的產品，使用之前的數據
            SELECT pd.product_code, pd.stock_level, pd.update_time, 'previous' as data_source
            FROM previous_data pd
            WHERE pd.product_code NOT IN (SELECT product_code FROM latest_in_segment)
        )
        SELECT
            COALESCE(
                jsonb_object_agg(
                    cd.product_code,
                    jsonb_build_object(
                        'stock_level', COALESCE(cd.stock_level, 0),
                        'last_update', cd.update_time,
                        'data_source', cd.data_source
                    )
                ),
                '{}'::jsonb
            ) INTO rec
        FROM combined_data cd;

        v_query_count := v_query_count + 1;

        -- 返回時間段數據
        RETURN QUERY SELECT
            to_char(v_current_segment_start, v_time_format),
            v_current_segment_start,
            v_current_segment_end,
            rec.jsonb_object_agg,
            jsonb_build_object(
                'segment_index', v_segment_index,
                'total_segments', p_time_segments,
                'duration_minutes', EXTRACT(EPOCH FROM v_segment_duration) / 60,
                'format_used', v_time_format
            );
    END LOOP;

    -- 最後返回執行元數據
    RETURN QUERY SELECT
        'metadata'::TEXT,
        v_execution_start,
        clock_timestamp(),
        '{}'::jsonb,
        jsonb_build_object(
            'execution_time_ms', EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000,
            'total_segments', p_time_segments,
            'product_count', array_length(v_product_codes_limited, 1),
            'time_range', jsonb_build_object(
                'start', v_start_time,
                'end', v_end_time,
                'duration_days', v_duration_days
            ),
            'query_count', v_query_count,
            'optimized', true,
            'function_version', '1.0.0'
        );

END;
$$;

-- 添加函數註釋
COMMENT ON FUNCTION rpc_get_stock_level_history IS
'Get stock level history data with server-side time segmentation for StockLevelHistoryChart widget. Optimized for performance with up to 10 products and configurable time segments.';

-- 創建相關索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_stock_level_stock_time
ON stock_level(stock, update_time DESC);

CREATE INDEX IF NOT EXISTS idx_stock_level_update_time
ON stock_level(update_time DESC);
