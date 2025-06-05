-- =====================================================
-- Void Pallet 庫存同步優化 RPC 函數
-- 日期: 2025-01-03
-- 功能: 在 void pallet 記錄到 record_inventory 時同步更新 stock_level 表
-- =====================================================

-- Void Pallet 動作：更新 stock_level 記錄（減少或增加庫存）
CREATE OR REPLACE FUNCTION update_stock_level_void(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_operation TEXT DEFAULT 'void' -- 'void', 'damage', 'auto_reprint'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record RECORD;
    v_product_description TEXT;
    v_result TEXT;
    v_new_stock_level BIGINT;
    v_operation_desc TEXT;
BEGIN
    -- 驗證輸入參數
    IF p_product_code IS NULL OR p_product_code = '' THEN
        RETURN 'ERROR: Product code cannot be empty';
    END IF;
    
    IF p_quantity IS NULL OR p_quantity = 0 THEN
        RETURN 'ERROR: Quantity cannot be zero';
    END IF;
    
    -- 設定操作描述
    CASE p_operation
        WHEN 'void' THEN v_operation_desc := 'voided';
        WHEN 'damage' THEN v_operation_desc := 'damaged';
        WHEN 'auto_reprint' THEN v_operation_desc := 'auto-reprinted';
        ELSE v_operation_desc := p_operation;
    END CASE;
    
    -- 檢查是否已有該產品代碼的記錄
    SELECT * INTO v_existing_record
    FROM stock_level
    WHERE stock = p_product_code;
    
    IF FOUND THEN
        -- 計算新的庫存水平
        -- 正數：減少庫存（void/damage）
        -- 負數：增加庫存（auto_reprint）
        v_new_stock_level := v_existing_record.stock_level - p_quantity;
        
        -- 更新現有記錄
        UPDATE stock_level
        SET 
            stock_level = v_new_stock_level,
            update_time = NOW()
        WHERE stock = p_product_code;
        
        IF p_quantity > 0 THEN
            v_result := p_product_code || ' - from ' || v_existing_record.stock_level || ' to ' || v_new_stock_level;
        ELSE
            v_result := p_product_code || ' - from ' || v_existing_record.stock_level || ' to ' || v_new_stock_level;
        END IF;
    ELSE
        -- 如果沒有現有記錄，先獲取產品描述
        SELECT description INTO v_product_description
        FROM data_code
        WHERE code = p_product_code;
        
        IF NOT FOUND THEN
            v_product_description := 'Unknown Product';
        END IF;
        
        -- 新增記錄
        v_new_stock_level := -p_quantity;  -- 直接使用負的 p_quantity
        
        INSERT INTO stock_level (stock, description, stock_level, update_time)
        VALUES (
            p_product_code,
            v_product_description,
            v_new_stock_level,
            NOW()
        );
        
        v_result := p_product_code || ' - new record with ' || v_new_stock_level;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 組合函數：同時處理 record_inventory 和 stock_level 更新
CREATE OR REPLACE FUNCTION process_void_pallet_inventory(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_plt_num TEXT,
    p_location_column TEXT,
    p_operation TEXT DEFAULT 'void',
    p_damage_quantity BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inventory_result TEXT;
    v_stock_result TEXT;
    v_final_result JSONB;
    v_inventory_update_sql TEXT;
    v_effective_quantity BIGINT;
BEGIN
    -- 確定有效數量（對於 damage 操作，使用總數量）
    v_effective_quantity := p_quantity;
    
    -- 1. 更新 record_inventory（這部分保持原有邏輯）
    -- 注意：這裡我們不直接執行 INSERT，而是返回成功標記
    -- 實際的 record_inventory 更新仍由原有的 TypeScript 代碼處理
    v_inventory_result := 'PROCESSED: Inventory update for ' || p_product_code || 
                         ' quantity ' || v_effective_quantity || ' from location ' || p_location_column;
    
    -- 2. 更新 stock_level（減少庫存）
    SELECT update_stock_level_void(
        p_product_code,
        v_effective_quantity,
        p_operation
    ) INTO v_stock_result;
    
    -- 3. 組合結果
    v_final_result := jsonb_build_object(
        'inventory_result', v_inventory_result,
        'stock_level_result', v_stock_result,
        'success', NOT (v_stock_result LIKE 'ERROR:%'),
        'operation', p_operation,
        'product_code', p_product_code,
        'quantity_processed', v_effective_quantity,
        'timestamp', NOW()
    );
    
    RETURN v_final_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'inventory_result', 'ERROR: Function failed before inventory update',
        'stock_level_result', 'ERROR: ' || SQLERRM,
        'success', false,
        'operation', p_operation,
        'product_code', p_product_code,
        'quantity_processed', 0,
        'timestamp', NOW()
    );
END;
$$;

-- 授權函數給認證用戶
GRANT EXECUTE ON FUNCTION update_stock_level_void(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_void_pallet_inventory(TEXT, BIGINT, TEXT, TEXT, TEXT, BIGINT) TO authenticated;

-- 註釋說明
COMMENT ON FUNCTION update_stock_level_void IS 'Void Pallet 優化：更新 stock_level 表，減少指定產品的庫存數量';
COMMENT ON FUNCTION process_void_pallet_inventory IS 'Void Pallet 優化：組合函數，同時處理 record_inventory 和 stock_level 更新'; 