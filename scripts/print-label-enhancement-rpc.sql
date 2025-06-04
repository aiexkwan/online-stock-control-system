-- Print Label Enhancement RPC Functions
-- 處理 print label 按鈕後的額外動作

-- ============================================================================
-- 1. Stock Level 更新函數
-- ============================================================================

-- 更新或新增 stock_level 記錄
CREATE OR REPLACE FUNCTION update_stock_level(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_record RECORD;
    product_description TEXT;
    product_exists BOOLEAN;
BEGIN
    -- 檢查產品代碼是否存在於 data_code 表中
    SELECT EXISTS(SELECT 1 FROM data_code WHERE code = p_product_code) INTO product_exists;
    
    IF NOT product_exists THEN
        RAISE EXCEPTION 'Product code % does not exist in data_code table. Please ensure the product is properly registered.', p_product_code;
    END IF;
    
    -- 檢查是否已有該產品的記錄
    SELECT * INTO existing_record 
    FROM stock_level 
    WHERE stock = p_product_code;
    
    -- 如果沒有提供描述，從 data_code 表獲取
    IF p_description IS NULL THEN
        SELECT description INTO product_description 
        FROM data_code 
        WHERE code = p_product_code;
    ELSE
        product_description := p_description;
    END IF;
    
    IF existing_record IS NOT NULL THEN
        -- 更新現有記錄
        UPDATE stock_level 
        SET 
            stock_level = stock_level + p_quantity,
            update_time = NOW()
        WHERE stock = p_product_code;
    ELSE
        -- 新增記錄
        INSERT INTO stock_level (stock, description, stock_level, update_time)
        VALUES (p_product_code, COALESCE(product_description, ''), p_quantity, NOW());
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating stock level: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Work Level 更新函數
-- ============================================================================

-- 更新或新增 work_level 記錄 (QC工作量)
CREATE OR REPLACE FUNCTION update_work_level_qc(
    p_user_id INTEGER,
    p_pallet_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_record RECORD;
    today_date DATE;
    user_exists BOOLEAN;
BEGIN
    -- 檢查用戶ID是否存在於 data_id 表中
    SELECT EXISTS(SELECT 1 FROM data_id WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User ID % does not exist in data_id table. Please ensure the user is properly registered.', p_user_id;
    END IF;
    
    today_date := CURRENT_DATE;
    
    -- 檢查今天是否已有該用戶的記錄
    SELECT * INTO existing_record 
    FROM work_level 
    WHERE id = p_user_id 
    AND DATE(latest_update) = today_date;
    
    IF existing_record IS NOT NULL THEN
        -- 更新現有記錄的QC數量
        UPDATE work_level 
        SET 
            QC = QC + p_pallet_count,
            latest_update = NOW()
        WHERE id = p_user_id 
        AND DATE(latest_update) = today_date;
    ELSE
        -- 新增今天的記錄
        INSERT INTO work_level (id, QC, Move, latest_update)
        VALUES (p_user_id, p_pallet_count, 0, NOW());
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating work level: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. 組合函數 - 同時處理兩個更新
-- ============================================================================

-- 處理 print label 後的所有更新動作
CREATE OR REPLACE FUNCTION handle_print_label_updates(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_user_id INTEGER,
    p_pallet_count INTEGER DEFAULT 1,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    stock_result BOOLEAN;
    work_result BOOLEAN;
    result JSON;
BEGIN
    -- 更新 stock_level
    SELECT update_stock_level(p_product_code, p_quantity, p_description) INTO stock_result;
    
    -- 更新 work_level (QC)
    SELECT update_work_level_qc(p_user_id, p_pallet_count) INTO work_result;
    
    -- 返回結果
    result := json_build_object(
        'success', (stock_result AND work_result),
        'stock_updated', stock_result,
        'work_updated', work_result,
        'message', CASE 
            WHEN (stock_result AND work_result) THEN 'Both stock and work levels updated successfully'
            WHEN stock_result AND NOT work_result THEN 'Stock level updated, but work level update failed'
            WHEN NOT stock_result AND work_result THEN 'Work level updated, but stock level update failed'
            ELSE 'Both updates failed'
        END
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'stock_updated', false,
            'work_updated', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 授予權限
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_stock_level(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_work_level_qc(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_print_label_updates(TEXT, BIGINT, INTEGER, INTEGER, TEXT) TO authenticated;

-- 顯示創建結果
SELECT 'Print label enhancement RPC functions created successfully' as status; 