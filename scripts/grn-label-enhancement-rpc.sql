-- =====================================================
-- GRN Label 列印工作流程優化 RPC 函數
-- 日期: 2025-01-03
-- 功能: 在每次列印 GRN 標籤時更新 grn_level、work_level 和 stock_level 表
-- =====================================================

-- 新動作（一）：更新或新增 grn_level 記錄
CREATE OR REPLACE FUNCTION update_grn_level(
    p_grn_ref TEXT,
    p_label_mode TEXT, -- 'weight' 或 'qty'
    p_gross_weight NUMERIC DEFAULT NULL,
    p_net_weight NUMERIC DEFAULT NULL,
    p_quantity INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grn_ref_int INTEGER;
    v_existing_record RECORD;
    v_result TEXT;
BEGIN
    -- 驗證並轉換 GRN 參考號為整數
    BEGIN
        v_grn_ref_int := p_grn_ref::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'ERROR: Invalid GRN reference format - must be a number';
    END;
    
    -- 檢查是否已有該 GRN 的記錄
    SELECT * INTO v_existing_record
    FROM grn_level
    WHERE grn_ref = v_grn_ref_int;
    
    IF FOUND THEN
        -- 更新現有記錄
        IF p_label_mode = 'weight' THEN
            -- 重量模式：更新 total_gross 和 total_net
            UPDATE grn_level
            SET 
                total_gross = total_gross + COALESCE(p_gross_weight, 0),
                total_net = total_net + COALESCE(p_net_weight, 0),
                latest_update = NOW()
            WHERE grn_ref = v_grn_ref_int;
            
            v_result := 'UPDATED: GRN ' || p_grn_ref || ' weight totals updated';
        ELSIF p_label_mode = 'qty' THEN
            -- 數量模式：更新 total_unit
            UPDATE grn_level
            SET 
                total_unit = total_unit + COALESCE(p_quantity, 0),
                latest_update = NOW()
            WHERE grn_ref = v_grn_ref_int;
            
            v_result := 'UPDATED: GRN ' || p_grn_ref || ' quantity total updated';
        ELSE
            RETURN 'ERROR: Invalid label mode - must be weight or qty';
        END IF;
    ELSE
        -- 新增記錄
        IF p_label_mode = 'weight' THEN
            INSERT INTO grn_level (grn_ref, total_gross, total_net, total_unit, latest_update)
            VALUES (
                v_grn_ref_int,
                COALESCE(p_gross_weight, 0),
                COALESCE(p_net_weight, 0),
                0,
                NOW()
            );
            
            v_result := 'INSERTED: New GRN ' || p_grn_ref || ' weight record created';
        ELSIF p_label_mode = 'qty' THEN
            INSERT INTO grn_level (grn_ref, total_gross, total_net, total_unit, latest_update)
            VALUES (
                v_grn_ref_int,
                0,
                0,
                COALESCE(p_quantity, 0),
                NOW()
            );
            
            v_result := 'INSERTED: New GRN ' || p_grn_ref || ' quantity record created';
        ELSE
            RETURN 'ERROR: Invalid label mode - must be weight or qty';
        END IF;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 新動作（二）：更新或新增 work_level 記錄 (GRN 工作量)
CREATE OR REPLACE FUNCTION update_work_level_grn(
    p_user_id INTEGER,
    p_grn_count INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record RECORD;
    v_today DATE;
    v_result TEXT;
BEGIN
    -- 獲取今天的日期
    v_today := CURRENT_DATE;
    
    -- 檢查該員工今天是否已有記錄
    SELECT * INTO v_existing_record
    FROM work_level
    WHERE id = p_user_id
    AND DATE(latest_update) = v_today;
    
    IF FOUND THEN
        -- 更新現有記錄：在 grn 欄位加上新的數量
        UPDATE work_level
        SET 
            grn = grn + p_grn_count,
            latest_update = NOW()
        WHERE id = p_user_id
        AND DATE(latest_update) = v_today;
        
        v_result := 'UPDATED: User ' || p_user_id || ' GRN count increased by ' || p_grn_count;
    ELSE
        -- 新增記錄：設定 grn 為指定數量，其他欄位為 0
        INSERT INTO work_level (id, qc, move, grn, latest_update)
        VALUES (
            p_user_id,
            0,  -- QC 欄位設為 0
            0,  -- Move 欄位設為 0
            p_grn_count,  -- GRN 欄位設為指定數量
            NOW()
        );
        
        v_result := 'INSERTED: New work record for User ' || p_user_id || ' with GRN count ' || p_grn_count;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 🚀 新動作（三）：更新或新增 stock_level 記錄
CREATE OR REPLACE FUNCTION update_stock_level_grn(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_description TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record RECORD;
    v_product_description TEXT;
    v_result TEXT;
BEGIN
    -- 檢查是否已有該產品代碼的記錄
    SELECT * INTO v_existing_record
    FROM stock_level
    WHERE stock = p_product_code;
    
    IF FOUND THEN
        -- 更新現有記錄：在 stock_level 欄位加上新的數量，並更新 update_time
        UPDATE stock_level
        SET 
            stock_level = stock_level + p_quantity,
            update_time = NOW()
        WHERE stock = p_product_code;
        
        v_result := 'UPDATED: Product ' || p_product_code || ' stock level increased by ' || p_quantity;
    ELSE
        -- 新增記錄前，先獲取產品描述（如果沒有提供的話）
        IF p_description IS NULL OR p_description = '' THEN
            SELECT description INTO v_product_description
            FROM data_code
            WHERE code = p_product_code;
            
            IF NOT FOUND THEN
                v_product_description := 'Unknown Product';
            END IF;
        ELSE
            v_product_description := p_description;
        END IF;
        
        -- 新增記錄：設定 stock_level 為指定數量
        INSERT INTO stock_level (stock, description, stock_level, update_time)
        VALUES (
            p_product_code,
            v_product_description,
            p_quantity,
            NOW()
        );
        
        v_result := 'INSERTED: New stock record for Product ' || p_product_code || ' with quantity ' || p_quantity;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 組合函數：同時更新 grn_level、work_level 和 stock_level
CREATE OR REPLACE FUNCTION update_grn_workflow(
    p_grn_ref TEXT,
    p_label_mode TEXT,
    p_user_id INTEGER,
    p_product_code TEXT,
    p_product_description TEXT DEFAULT NULL,
    p_gross_weight NUMERIC DEFAULT NULL,
    p_net_weight NUMERIC DEFAULT NULL,
    p_quantity INTEGER DEFAULT NULL,
    p_grn_count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grn_result TEXT;
    v_work_result TEXT;
    v_stock_result TEXT;
    v_final_result JSONB;
    v_stock_quantity BIGINT;
BEGIN
    -- 更新 grn_level
    SELECT update_grn_level(
        p_grn_ref,
        p_label_mode,
        p_gross_weight,
        p_net_weight,
        p_quantity
    ) INTO v_grn_result;
    
    -- 更新 work_level
    SELECT update_work_level_grn(
        p_user_id,
        p_grn_count
    ) INTO v_work_result;
    
    -- 🚀 新增：更新 stock_level
    -- 根據標籤模式決定庫存數量
    IF p_label_mode = 'weight' THEN
        -- 重量模式：使用淨重作為庫存數量
        v_stock_quantity := COALESCE(p_net_weight, 0)::BIGINT;
    ELSIF p_label_mode = 'qty' THEN
        -- 數量模式：使用數量作為庫存數量
        v_stock_quantity := COALESCE(p_quantity, 0)::BIGINT;
    ELSE
        v_stock_quantity := 0;
    END IF;
    
    SELECT update_stock_level_grn(
        p_product_code,
        v_stock_quantity,
        p_product_description
    ) INTO v_stock_result;
    
    -- 組合結果
    v_final_result := jsonb_build_object(
        'grn_level_result', v_grn_result,
        'work_level_result', v_work_result,
        'stock_level_result', v_stock_result,
        'success', NOT (v_grn_result LIKE 'ERROR:%' OR v_work_result LIKE 'ERROR:%' OR v_stock_result LIKE 'ERROR:%'),
        'timestamp', NOW()
    );
    
    RETURN v_final_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'grn_level_result', 'ERROR: ' || SQLERRM,
        'work_level_result', 'ERROR: Function failed before work_level update',
        'stock_level_result', 'ERROR: Function failed before stock_level update',
        'success', false,
        'timestamp', NOW()
    );
END;
$$;

-- 授權函數給認證用戶
GRANT EXECUTE ON FUNCTION update_grn_level(TEXT, TEXT, NUMERIC, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_work_level_grn(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_stock_level_grn(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_grn_workflow(TEXT, TEXT, INTEGER, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, INTEGER) TO authenticated;

-- 註釋說明
COMMENT ON FUNCTION update_grn_level IS 'GRN Label 優化：更新或新增 grn_level 表記錄，支援重量和數量模式';
COMMENT ON FUNCTION update_work_level_grn IS 'GRN Label 優化：更新或新增 work_level 表的 GRN 工作量記錄';
COMMENT ON FUNCTION update_stock_level_grn IS 'GRN Label 優化：更新或新增 stock_level 表的庫存記錄';
COMMENT ON FUNCTION update_grn_workflow IS 'GRN Label 優化：組合函數，同時更新 grn_level、work_level 和 stock_level 表';

-- =====================================================
-- Stock Transfer 工作流程優化 RPC 函數
-- 日期: 2025-01-03
-- 功能: 在每次成功轉移托盤位置後更新 work_level 表的 move 欄位
-- =====================================================

-- Stock Transfer 動作：更新或新增 work_level 記錄 (Move 工作量)
CREATE OR REPLACE FUNCTION update_work_level_move(
    p_user_id INTEGER,
    p_move_count INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record RECORD;
    v_today DATE;
    v_result TEXT;
BEGIN
    -- 獲取今天的日期
    v_today := CURRENT_DATE;
    
    -- 檢查該員工今天是否已有記錄
    SELECT * INTO v_existing_record
    FROM work_level
    WHERE id = p_user_id
    AND DATE(latest_update) = v_today;
    
    IF FOUND THEN
        -- 更新現有記錄：在 move 欄位加上新的數量
        UPDATE work_level
        SET 
            move = move + p_move_count,
            latest_update = NOW()
        WHERE id = p_user_id
        AND DATE(latest_update) = v_today;
        
        v_result := 'UPDATED: User ' || p_user_id || ' Move count increased by ' || p_move_count;
    ELSE
        -- 新增記錄：設定 move 為指定數量，其他欄位為 0
        INSERT INTO work_level (id, qc, move, grn, latest_update)
        VALUES (
            p_user_id,
            0,  -- QC 欄位設為 0
            p_move_count,  -- Move 欄位設為指定數量
            0,  -- GRN 欄位設為 0
            NOW()
        );
        
        v_result := 'INSERTED: New work record for User ' || p_user_id || ' with Move count ' || p_move_count;
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 授權函數給認證用戶
GRANT EXECUTE ON FUNCTION update_work_level_move(INTEGER, INTEGER) TO authenticated;

-- 註釋說明
COMMENT ON FUNCTION update_work_level_move IS 'Stock Transfer 優化：更新或新增 work_level 表的 Move 工作量記錄'; 