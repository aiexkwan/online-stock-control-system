/**
 * RPC Function: Get ACO Incomplete Orders for Dashboard
 * 用於 AcoOrderProgressWidget 的優化查詢
 * 
 * 功能：
 * - 獲取所有未完成的 ACO 訂單列表
 * - 服務器端聚合和計算
 * - 為每個訂單計算總需求量、完成量和剩餘量
 * - 支持分頁和排序
 * 
 * 返回：包含未完成訂單列表和統計信息的JSON對象
 */

CREATE OR REPLACE FUNCTION rpc_get_aco_incomplete_orders_dashboard(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orders JSONB;
    v_total_count INTEGER;
    v_execution_start TIMESTAMPTZ := clock_timestamp();
    v_calculation_time TEXT;
BEGIN
    -- 獲取總數量（未完成的訂單數）
    SELECT COUNT(DISTINCT order_ref)
    INTO v_total_count
    FROM record_aco
    WHERE finished_qty IS NULL 
       OR finished_qty < required_qty;
    
    -- 獲取未完成訂單列表，按訂單參考號分組並計算統計
    WITH incomplete_orders AS (
        SELECT 
            order_ref,
            MAX(latest_update) as latest_update,
            SUM(required_qty) as total_required,
            SUM(COALESCE(finished_qty, 0)) as total_finished,
            SUM(GREATEST(0, required_qty - COALESCE(finished_qty, 0))) as total_remaining,
            COUNT(*) as product_count
        FROM record_aco
        WHERE finished_qty IS NULL 
           OR finished_qty < required_qty
        GROUP BY order_ref
        HAVING SUM(GREATEST(0, required_qty - COALESCE(finished_qty, 0))) > 0
        ORDER BY order_ref DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'order_ref', order_ref,
            'latest_update', latest_update,
            'total_required', total_required,
            'total_finished', total_finished,
            'total_remaining', total_remaining,
            'product_count', product_count,
            'completion_percentage', CASE 
                WHEN total_required > 0 THEN 
                    ROUND((total_finished::NUMERIC / total_required::NUMERIC) * 100, 1)
                ELSE 0 
            END
        )
    )
    INTO v_orders
    FROM incomplete_orders;
    
    -- 計算執行時間
    v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000, 2)::TEXT || 'ms';
    
    -- 構建最終結果
    RETURN jsonb_build_object(
        'success', true,
        'orders', COALESCE(v_orders, '[]'::jsonb),
        'total_count', v_total_count,
        'returned_count', jsonb_array_length(COALESCE(v_orders, '[]'::jsonb)),
        'limit', p_limit,
        'offset', p_offset,
        'has_more', (p_offset + jsonb_array_length(COALESCE(v_orders, '[]'::jsonb))) < v_total_count,
        'calculation_time', v_calculation_time,
        'metadata', jsonb_build_object(
            'query_method', 'GROUP_BY_WITH_AGGREGATION',
            'performance', jsonb_build_object(
                'optimized', true,
                'server_calculated', true,
                'single_query', true
            )
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    -- 錯誤處理
    v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000, 2)::TEXT || 'ms';
    
    RAISE NOTICE 'Error in rpc_get_aco_incomplete_orders_dashboard: %', SQLERRM;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'orders', '[]'::jsonb,
        'total_count', 0,
        'calculation_time', v_calculation_time
    );
END;
$$;

-- 添加函數註釋
COMMENT ON FUNCTION rpc_get_aco_incomplete_orders_dashboard IS 
'Get list of incomplete ACO orders with aggregated statistics. Optimized for AcoOrderProgressWidget with server-side calculation and aggregation.';

-- 設置函數權限
GRANT EXECUTE ON FUNCTION rpc_get_aco_incomplete_orders_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_aco_incomplete_orders_dashboard TO service_role;

-- 創建優化索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_record_aco_incomplete_orders 
ON record_aco(order_ref, finished_qty, required_qty) 
WHERE finished_qty IS NULL OR finished_qty < required_qty;

CREATE INDEX IF NOT EXISTS idx_record_aco_order_ref_latest_update 
ON record_aco(order_ref, latest_update DESC) 
WHERE latest_update IS NOT NULL;

-- 複合索引優化聚合查詢
CREATE INDEX IF NOT EXISTS idx_record_aco_dashboard_optimized 
ON record_aco(order_ref, required_qty, finished_qty, latest_update) 
WHERE finished_qty IS NULL OR finished_qty < required_qty;

COMMENT ON INDEX idx_record_aco_dashboard_optimized IS 
'Optimized compound index for ACO incomplete orders dashboard queries with aggregation';