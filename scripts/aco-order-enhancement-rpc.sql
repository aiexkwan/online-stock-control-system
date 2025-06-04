-- ACO Order Enhancement RPC Functions
-- 處理 ACO 訂單的增強功能

-- ============================================================================
-- 1. 更新 ACO 訂單並檢查完成狀態
-- ============================================================================

-- 更新 ACO 訂單的 remain_qty 和 latest_update，並檢查是否完成
CREATE OR REPLACE FUNCTION update_aco_order_with_completion_check(
    p_order_ref INTEGER,
    p_product_code TEXT,
    p_quantity_used INTEGER
)
RETURNS JSON AS $$
DECLARE
    current_remain_qty INTEGER;
    new_remain_qty INTEGER;
    order_completed BOOLEAN := FALSE;
    total_remaining INTEGER;
    affected_rows INTEGER;
BEGIN
    -- 檢查訂單和產品是否存在
    SELECT remain_qty INTO current_remain_qty
    FROM record_aco 
    WHERE order_ref = p_order_ref AND code = p_product_code;
    
    IF current_remain_qty IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ACO order not found for order_ref: ' || p_order_ref || ' and product: ' || p_product_code
        );
    END IF;
    
    -- 計算新的剩餘數量
    new_remain_qty := GREATEST(0, current_remain_qty - p_quantity_used);
    
    -- 動作一：更新 record_aco 表，包括 latest_update 欄位
    UPDATE record_aco 
    SET 
        remain_qty = new_remain_qty,
        latest_update = NOW()
    WHERE order_ref = p_order_ref AND code = p_product_code;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update ACO order'
        );
    END IF;
    
    -- 動作二：檢查整張訂單是否完成
    -- 計算該訂單的總剩餘數量
    SELECT COALESCE(SUM(remain_qty), 0) INTO total_remaining
    FROM record_aco 
    WHERE order_ref = p_order_ref;
    
    -- 如果總剩餘數量為0，表示訂單完成
    IF total_remaining = 0 THEN
        order_completed := TRUE;
    END IF;
    
    -- 返回結果
    RETURN json_build_object(
        'success', true,
        'order_ref', p_order_ref,
        'product_code', p_product_code,
        'previous_remain_qty', current_remain_qty,
        'quantity_used', p_quantity_used,
        'new_remain_qty', new_remain_qty,
        'total_remaining_in_order', total_remaining,
        'order_completed', order_completed,
        'message', CASE 
            WHEN order_completed THEN 'ACO order completed successfully'
            ELSE 'ACO order updated successfully'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error updating ACO order: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. 檢查 ACO 訂單完成狀態（獨立函數）
-- ============================================================================

-- 檢查指定訂單是否完成
CREATE OR REPLACE FUNCTION check_aco_order_completion(
    p_order_ref INTEGER
)
RETURNS JSON AS $$
DECLARE
    total_remaining INTEGER;
    order_details JSON;
BEGIN
    -- 計算該訂單的總剩餘數量
    SELECT COALESCE(SUM(remain_qty), 0) INTO total_remaining
    FROM record_aco 
    WHERE order_ref = p_order_ref;
    
    -- 如果沒有找到訂單
    IF NOT EXISTS (SELECT 1 FROM record_aco WHERE order_ref = p_order_ref) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ACO order not found: ' || p_order_ref
        );
    END IF;
    
    -- 獲取訂單詳情
    SELECT json_agg(
        json_build_object(
            'product_code', code,
            'required_qty', required_qty,
            'remain_qty', remain_qty,
            'latest_update', latest_update
        )
    ) INTO order_details
    FROM record_aco 
    WHERE order_ref = p_order_ref;
    
    -- 返回結果
    RETURN json_build_object(
        'success', true,
        'order_ref', p_order_ref,
        'total_remaining', total_remaining,
        'is_completed', (total_remaining = 0),
        'order_details', order_details
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error checking ACO order completion: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. 獲取已完成的 ACO 訂單列表
-- ============================================================================

-- 獲取所有已完成的訂單
CREATE OR REPLACE FUNCTION get_completed_aco_orders()
RETURNS TABLE(
    order_ref INTEGER,
    completion_date TIMESTAMP WITH TIME ZONE,
    total_products INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.order_ref,
        MAX(r.latest_update) as completion_date,
        COUNT(*)::INTEGER as total_products
    FROM record_aco r
    WHERE r.order_ref IN (
        -- 找出所有剩餘數量為0的訂單
        SELECT ra.order_ref 
        FROM record_aco ra 
        GROUP BY ra.order_ref 
        HAVING SUM(ra.remain_qty) = 0
    )
    GROUP BY r.order_ref
    ORDER BY completion_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 授予權限
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_aco_order_with_completion_check(INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_aco_order_completion(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_completed_aco_orders() TO authenticated;

-- 顯示創建結果
SELECT 'ACO order enhancement RPC functions created successfully' as status; 