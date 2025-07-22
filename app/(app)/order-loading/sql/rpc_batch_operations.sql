-- =====================================================
-- 批量操作 RPC 函數
-- =====================================================
-- 優化多個查詢合併為單一調用
-- =====================================================

-- 1. 批量獲取訂單詳情和統計
CREATE OR REPLACE FUNCTION rpc_get_order_details_batch(
    p_order_ref TEXT
) RETURNS JSON AS $$
DECLARE
    v_order_items JSON;
    v_order_summary JSON;
    v_recent_loads JSON;
    v_user_stats JSON;
    v_inventory_status JSON;
BEGIN
    -- 獲取訂單項目
    SELECT json_agg(
        json_build_object(
            'order_ref', order_ref,
            'product_code', product_code,
            'product_desc', product_desc,
            'product_qty', product_qty::INTEGER,
            'loaded_qty', loaded_qty::INTEGER,
            'remaining_qty', (product_qty::INTEGER - loaded_qty::INTEGER),
            'completion_percentage',
                CASE
                    WHEN product_qty::INTEGER = 0 THEN 100
                    ELSE ROUND((loaded_qty::NUMERIC / product_qty::NUMERIC) * 100, 2)
                END,
            'status',
                CASE
                    WHEN loaded_qty::INTEGER >= product_qty::INTEGER THEN 'completed'
                    WHEN loaded_qty::INTEGER > 0 THEN 'in_progress'
                    ELSE 'pending'
                END
        )
    ) INTO v_order_items
    FROM data_order
    WHERE order_ref = p_order_ref;

    -- 獲取訂單摘要
    SELECT json_build_object(
        'total_items', COUNT(*),
        'completed_items', COUNT(*) FILTER (WHERE loaded_qty::INTEGER >= product_qty::INTEGER),
        'total_qty', SUM(product_qty::INTEGER),
        'loaded_qty', SUM(loaded_qty::INTEGER),
        'overall_percentage',
            CASE
                WHEN SUM(product_qty::INTEGER) = 0 THEN 100
                ELSE ROUND((SUM(loaded_qty::NUMERIC) / SUM(product_qty::NUMERIC)) * 100, 2)
            END
    ) INTO v_order_summary
    FROM data_order
    WHERE order_ref = p_order_ref;

    -- 獲取最近加載記錄（最近20條）
    SELECT json_agg(
        json_build_object(
            'time', time,
            'action', action,
            'plt_num', plt_num,
            'product_code', product_code,
            'user_name', name,
            'remark', remark
        ) ORDER BY time DESC
    ) INTO v_recent_loads
    FROM (
        SELECT h.*, d.name
        FROM record_history h
        LEFT JOIN data_id d ON h.id = d.id
        WHERE h.action IN ('Order Load', 'Order Unload')
        AND h.remark LIKE '%Order: ' || p_order_ref || '%'
        ORDER BY h.time DESC
        LIMIT 20
    ) sub;

    -- 獲取用戶統計
    WITH user_stats AS (
        SELECT
            h.id,
            d.name,
            COUNT(*) as load_count,
            MAX(h.time) as last_activity
        FROM record_history h
        LEFT JOIN data_id d ON h.id = d.id
        WHERE h.action = 'Order Load'
        AND h.remark LIKE '%Order: ' || p_order_ref || '%'
        AND h.time >= CURRENT_DATE
        GROUP BY h.id, d.name
    )
    SELECT json_agg(
        json_build_object(
            'user_id', id,
            'user_name', name,
            'load_count', load_count,
            'last_activity', last_activity
        ) ORDER BY load_count DESC
    ) INTO v_user_stats
    FROM user_stats;

    -- 獲取相關產品的庫存狀態
    SELECT json_agg(
        json_build_object(
            'product_code', sl.stock,
            'stock_level', sl.stock_level,
            'last_update', sl.update_time,
            'available_pallets', (
                SELECT COUNT(*)
                FROM record_palletinfo p
                WHERE p.product_code = sl.stock
                AND p.plt_num NOT IN (
                    SELECT plt_num FROM record_history
                    WHERE action = 'Order Load'
                    AND plt_num IS NOT NULL
                )
            )
        )
    ) INTO v_inventory_status
    FROM stock_level sl
    WHERE sl.stock IN (
        SELECT DISTINCT product_code
        FROM data_order
        WHERE order_ref = p_order_ref
    );

    -- 返回所有數據
    RETURN json_build_object(
        'success', true,
        'order_items', COALESCE(v_order_items, '[]'::json),
        'order_summary', COALESCE(v_order_summary, '{}'::json),
        'recent_loads', COALESCE(v_recent_loads, '[]'::json),
        'user_stats', COALESCE(v_user_stats, '[]'::json),
        'inventory_status', COALESCE(v_inventory_status, '[]'::json),
        'query_time', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 批量驗證卡板
CREATE OR REPLACE FUNCTION rpc_validate_pallets_batch(
    p_pallet_inputs TEXT[]
) RETURNS JSON AS $$
DECLARE
    v_results JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'input', input_val,
            'found', (pallet_info IS NOT NULL),
            'pallet_num', (pallet_info->>'plt_num'),
            'product_code', (pallet_info->>'product_code'),
            'quantity', (pallet_info->>'product_qty')::INTEGER,
            'is_loaded', EXISTS(
                SELECT 1 FROM record_history
                WHERE plt_num = (pallet_info->>'plt_num')
                AND action = 'Order Load'
            ),
            'location', (
                SELECT loc FROM record_history
                WHERE plt_num = (pallet_info->>'plt_num')
                ORDER BY time DESC
                LIMIT 1
            )
        )
    ) INTO v_results
    FROM (
        SELECT
            unnest(p_pallet_inputs) as input_val,
            (
                SELECT row_to_json(p.*)
                FROM record_palletinfo p
                WHERE p.plt_num = unnest(p_pallet_inputs)
                OR p.series = unnest(p_pallet_inputs)
                LIMIT 1
            ) as pallet_info
    ) sub;

    RETURN json_build_object(
        'success', true,
        'results', COALESCE(v_results, '[]'::json),
        'validated_at', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 批量加載預檢查
CREATE OR REPLACE FUNCTION rpc_precheck_batch_load(
    p_order_ref TEXT,
    p_pallet_inputs TEXT[]
) RETURNS JSON AS $$
DECLARE
    v_order_products JSON;
    v_validations JSON;
    v_conflicts JSON;
    v_recommendations JSON;
BEGIN
    -- 獲取訂單產品需求
    SELECT json_object_agg(
        product_code,
        json_build_object(
            'required_qty', (product_qty::INTEGER - loaded_qty::INTEGER),
            'product_desc', product_desc
        )
    ) INTO v_order_products
    FROM data_order
    WHERE order_ref = p_order_ref
    AND loaded_qty::INTEGER < product_qty::INTEGER;

    -- 驗證所有卡板
    SELECT json_agg(validation) INTO v_validations
    FROM (
        SELECT json_build_object(
            'input', p.input_val,
            'valid', (p.plt_num IS NOT NULL),
            'plt_num', p.plt_num,
            'product_code', p.product_code,
            'quantity', p.product_qty::INTEGER,
            'matches_order', (p.product_code IN (
                SELECT product_code FROM data_order
                WHERE order_ref = p_order_ref
            )),
            'already_loaded', EXISTS(
                SELECT 1 FROM record_history
                WHERE plt_num = p.plt_num
                AND action = 'Order Load'
            )
        ) as validation
        FROM (
            SELECT
                unnest(p_pallet_inputs) as input_val,
                rp.*
            FROM record_palletinfo rp
            WHERE rp.plt_num = ANY(p_pallet_inputs)
            OR rp.series = ANY(p_pallet_inputs)
        ) p
    ) sub;

    -- 檢查潛在衝突
    WITH load_summary AS (
        SELECT
            product_code,
            SUM(product_qty::INTEGER) as total_to_load
        FROM record_palletinfo
        WHERE (plt_num = ANY(p_pallet_inputs) OR series = ANY(p_pallet_inputs))
        GROUP BY product_code
    )
    SELECT json_agg(
        json_build_object(
            'product_code', ls.product_code,
            'to_load', ls.total_to_load,
            'required', (o.product_qty::INTEGER - o.loaded_qty::INTEGER),
            'excess', ls.total_to_load - (o.product_qty::INTEGER - o.loaded_qty::INTEGER),
            'warning', CASE
                WHEN ls.total_to_load > (o.product_qty::INTEGER - o.loaded_qty::INTEGER)
                THEN 'Will exceed order quantity'
                ELSE NULL
            END
        )
    ) INTO v_conflicts
    FROM load_summary ls
    JOIN data_order o ON ls.product_code = o.product_code
    WHERE o.order_ref = p_order_ref;

    RETURN json_build_object(
        'success', true,
        'order_products', COALESCE(v_order_products, '{}'::json),
        'validations', COALESCE(v_validations, '[]'::json),
        'conflicts', COALESCE(v_conflicts, '[]'::json),
        'can_proceed', NOT EXISTS(
            SELECT 1 FROM json_array_elements(v_validations) v
            WHERE (v->>'already_loaded')::boolean = true
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION rpc_get_order_details_batch(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_validate_pallets_batch(TEXT[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_precheck_batch_load(TEXT, TEXT[]) TO anon, authenticated, service_role;

-- =====================================================
-- 使用示例
-- =====================================================
/*
-- 1. 獲取訂單所有相關數據
SELECT rpc_get_order_details_batch('ORDER-001');

-- 2. 批量驗證卡板
SELECT rpc_validate_pallets_batch(ARRAY['PLT001', 'PLT002', 'SR-001']);

-- 3. 批量加載預檢查
SELECT rpc_precheck_batch_load('ORDER-001', ARRAY['PLT001', 'PLT002']);
*/
