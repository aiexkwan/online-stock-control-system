-- 恢復打印標籤相關的數據庫函數
-- 日期：2025-07-02
-- 問題：這些函數在清理時被錯誤刪除，但實際上仍被 API 使用

-- Step 1: 創建 update_work_level_qc 函數
CREATE OR REPLACE FUNCTION public.update_work_level_qc(
    p_user_id INTEGER,
    p_pallet_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_existing_record RECORD;
BEGIN
    -- 檢查是否已存在今天的記錄
    SELECT * INTO v_existing_record
    FROM work_level
    WHERE id = p_user_id
    AND DATE(latest_update) = CURRENT_DATE;

    IF FOUND THEN
        -- 更新現有記錄
        UPDATE work_level
        SET
            qc = qc + p_pallet_count,
            latest_update = NOW()
        WHERE uuid = v_existing_record.uuid;
    ELSE
        -- 插入新記錄
        INSERT INTO work_level (
            uuid,
            id,
            qc,
            move,
            grn,
            loading,
            latest_update
        )
        VALUES (
            gen_random_uuid(),
            p_user_id,
            p_pallet_count,
            0,
            0,
            0,
            NOW()
        );
    END IF;

    -- 如果存在 employee_statistics 表，也更新它
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'employee_statistics'
    ) THEN
        UPDATE employee_statistics
        SET
            total_qc_pallets = total_qc_pallets + p_pallet_count,
            last_qc_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- 如果沒有記錄則插入
        IF NOT FOUND THEN
            INSERT INTO employee_statistics (
                user_id,
                total_qc_pallets,
                last_qc_date,
                created_at,
                updated_at
            )
            VALUES (
                p_user_id,
                p_pallet_count,
                CURRENT_DATE,
                NOW(),
                NOW()
            );
        END IF;
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'pallets_added', p_pallet_count,
        'date', CURRENT_DATE
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Step 2: 創建 handle_print_label_updates 函數
CREATE OR REPLACE FUNCTION public.handle_print_label_updates(
    p_product_code TEXT,
    p_quantity INTEGER,
    p_user_id INTEGER,
    p_pallet_count INTEGER DEFAULT 1,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_result RECORD;
    v_work_result JSONB;
    v_result JSONB;
BEGIN
    -- 開始事務

    -- Step 1: 更新庫存（使用正確的函數）
    -- 使用 update_stock_level 函數確保按日期正確處理
    PERFORM update_stock_level(p_product_code, p_quantity, COALESCE(p_description, p_product_code));

    -- Step 2: 更新工作量
    v_work_result := update_work_level_qc(p_user_id, p_pallet_count);

    -- Step 3: 記錄日誌（如果有日誌表）
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'print_label_log'
    ) THEN
        INSERT INTO print_label_log (
            product_code,
            quantity,
            user_id,
            pallet_count,
            created_at
        )
        VALUES (
            p_product_code,
            p_quantity,
            p_user_id,
            p_pallet_count,
            NOW()
        );
    END IF;

    -- 構建返回結果
    v_result := jsonb_build_object(
        'success', true,
        'message', format('Successfully updated stock for %s and work level for user %s', p_product_code, p_user_id),
        'stock_updated', true,
        'work_updated', (v_work_result->>'success')::boolean,
        'details', jsonb_build_object(
            'product_code', p_product_code,
            'quantity_added', p_quantity,
            'user_id', p_user_id,
            'pallet_count', p_pallet_count
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- 發生錯誤時回滾
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Error: %s', SQLERRM),
            'stock_updated', false,
            'work_updated', false
        );
END;
$$;

-- Step 3: 設置權限
GRANT EXECUTE ON FUNCTION public.update_work_level_qc(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_work_level_qc(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_print_label_updates(TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_print_label_updates(TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;

-- Step 4: 添加函數註釋
COMMENT ON FUNCTION public.update_work_level_qc(INTEGER, INTEGER) IS
'更新員工的 QC 工作量統計。
參數：
- p_user_id: 員工 ID
- p_pallet_count: 處理的棧板數量
返回 JSONB 格式的結果';

COMMENT ON FUNCTION public.handle_print_label_updates(TEXT, INTEGER, INTEGER, INTEGER, TEXT) IS
'處理打印標籤後的庫存和工作量更新。
參數：
- p_product_code: 產品代碼
- p_quantity: 數量
- p_user_id: 員工 ID
- p_pallet_count: 棧板數量（默認為1）
- p_description: 產品描述（可選）
返回 JSONB 格式的結果';

-- Step 5: 測試函數（使用真實存在的產品代碼）
DO $$
DECLARE
    v_test_result JSONB;
BEGIN
    -- 測試 handle_print_label_updates
    v_test_result := handle_print_label_updates(
        'MEP9090150',  -- 使用真實存在的產品代碼
        100,
        1001,
        2,
        'Test Product MEP9090150'
    );

    IF (v_test_result->>'success')::boolean THEN
        RAISE NOTICE '✅ Test passed: handle_print_label_updates works correctly';
        RAISE NOTICE 'Result: %', v_test_result;

        -- 回滾測試數據（避免影響真實數據）
        UPDATE stock_level
        SET stock_level = stock_level - 100,
            update_time = NOW()
        WHERE stock = 'MEP9090150';

        DELETE FROM work_level
        WHERE id = 1001
        AND DATE(latest_update) = CURRENT_DATE;

        RAISE NOTICE '✅ Test data rolled back successfully';
    ELSE
        RAISE EXCEPTION '❌ Test failed: %', v_test_result->>'message';
    END IF;
END $$;
