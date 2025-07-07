-- ACO Order Completion RPC Functions
-- These functions handle ACO order updates and completion checks

-- Function 1: update_aco_order_with_completion_check
-- Updates ACO order finished quantity and checks if the entire order is completed
CREATE OR REPLACE FUNCTION public.update_aco_order_with_completion_check(
    p_order_ref integer, 
    p_product_code text, 
    p_quantity_used integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_previous_finished_qty INTEGER;
    v_new_finished_qty INTEGER;
    v_required_qty INTEGER;
    v_total_remaining INTEGER;
    v_order_completed BOOLEAN := FALSE;
    v_result JSONB;
BEGIN
    -- 檢查訂單是否存在
    SELECT finished_qty, required_qty 
    INTO v_previous_finished_qty, v_required_qty
    FROM record_aco
    WHERE order_ref = p_order_ref
      AND code = p_product_code
    FOR UPDATE;  -- 鎖定行以避免並發問題
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', format('ACO order %s for product %s not found', p_order_ref, p_product_code)
        );
    END IF;
    
    -- 計算新的完成數量
    v_new_finished_qty := v_previous_finished_qty + p_quantity_used;
    
    -- 更新記錄
    UPDATE record_aco
    SET finished_qty = v_new_finished_qty,
        latest_update = NOW()
    WHERE order_ref = p_order_ref
      AND code = p_product_code;
    
    -- 檢查整個訂單的總剩餘數量
    SELECT SUM(GREATEST(0, required_qty - finished_qty))
    INTO v_total_remaining
    FROM record_aco
    WHERE order_ref = p_order_ref;
    
    -- 如果總剩餘數量為 0，則訂單完成
    IF v_total_remaining = 0 THEN
        v_order_completed := TRUE;
    END IF;
    
    -- 構建返回結果
    v_result := jsonb_build_object(
        'success', TRUE,
        'message', 'ACO order updated successfully',
        'order_ref', p_order_ref,
        'product_code', p_product_code,
        'previous_finished_qty', v_previous_finished_qty,
        'quantity_used', p_quantity_used,
        'new_finished_qty', v_new_finished_qty,
        'required_qty', v_required_qty,
        'total_remaining_in_order', v_total_remaining,
        'order_completed', v_order_completed
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', format('Error updating ACO order: %s', SQLERRM)
        );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_aco_order_with_completion_check IS '更新 ACO 訂單的完成數量並檢查是否完成
參數:
- p_order_ref: 訂單參考號
- p_product_code: 產品代碼
- p_quantity_used: 使用的數量
返回: JSON 包含更新結果和訂單完成狀態';

-- Function 2: check_aco_order_completion
-- Checks the completion status of an ACO order
CREATE OR REPLACE FUNCTION public.check_aco_order_completion(p_order_ref integer)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_required INTEGER;
    v_total_finished INTEGER;
    v_total_remaining INTEGER;
    v_is_completed BOOLEAN;
    v_products JSONB;
BEGIN
    -- 獲取訂單的總需求和總完成數量
    SELECT 
        SUM(required_qty),
        SUM(finished_qty),
        SUM(GREATEST(0, required_qty - finished_qty))
    INTO 
        v_total_required,
        v_total_finished,
        v_total_remaining
    FROM record_aco
    WHERE order_ref = p_order_ref;
    
    -- 如果找不到訂單
    IF v_total_required IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', format('Order %s not found', p_order_ref)
        );
    END IF;
    
    -- 檢查是否完成
    v_is_completed := (v_total_remaining = 0);
    
    -- 獲取每個產品的詳情
    SELECT jsonb_agg(
        jsonb_build_object(
            'code', code,
            'required_qty', required_qty,
            'finished_qty', finished_qty,
            'remaining_qty', GREATEST(0, required_qty - finished_qty)
        )
    ) INTO v_products
    FROM record_aco
    WHERE order_ref = p_order_ref;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_ref', p_order_ref,
        'is_completed', v_is_completed,
        'total_required', v_total_required,
        'total_finished', v_total_finished,
        'total_remaining', v_total_remaining,
        'products', v_products
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', format('Error checking order completion: %s', SQLERRM)
        );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_aco_order_completion IS '檢查 ACO 訂單的完成狀態
參數:
- p_order_ref: 訂單參考號
返回: JSON 包含訂單完成狀態和詳情';