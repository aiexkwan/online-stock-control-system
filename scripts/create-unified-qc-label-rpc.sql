-- 統一 QC Label 處理 RPC 函數
-- 日期：2025-07-02
-- 目的：整合所有 QC Label 相關操作到一個事務中

-- 創建統一的 QC Label 處理函數
CREATE OR REPLACE FUNCTION public.process_qc_label_unified(
    -- 基本參數
    p_count INTEGER,                    -- 生成標籤數量
    p_product_code TEXT,                -- 產品代碼
    p_product_qty INTEGER,              -- 每個托盤數量
    p_clock_number TEXT,                -- 員工時鐘號
    p_plt_remark TEXT DEFAULT '',       -- 托盤備註
    p_session_id TEXT DEFAULT NULL,     -- 會話 ID

    -- ACO 訂單參數（可選）
    p_aco_order_ref INTEGER DEFAULT NULL,
    p_aco_quantity_used INTEGER DEFAULT NULL,

    -- Slate 參數（可選）
    p_slate_batch_number TEXT DEFAULT NULL,

    -- PDF 參數
    p_pdf_urls TEXT[] DEFAULT NULL      -- PDF URLs 陣列
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_user_id INTEGER;
    v_total_quantity INTEGER;
    v_pallet_data JSONB[];
    v_pallet_numbers TEXT[];
    v_series TEXT[];
    v_pallet_result RECORD;
    v_idx INTEGER;
    v_product_description TEXT;
    v_date_str TEXT;
    v_history_action TEXT;
    v_history_time TIMESTAMP WITH TIME ZONE;
    v_aco_result JSONB;
    v_stock_result JSONB;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 開始事務
    BEGIN
        -- Step 1: 驗證參數
        IF p_count <= 0 OR p_count > 100 THEN
            RAISE EXCEPTION 'Invalid count: must be between 1 and 100';
        END IF;

        IF p_product_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid product quantity: must be greater than 0';
        END IF;

        -- 驗證產品代碼存在
        SELECT description INTO v_product_description
        FROM data_code
        WHERE code = p_product_code;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product code % not found', p_product_code;
        END IF;

        -- 驗證用戶 ID
        v_user_id := p_clock_number::INTEGER;
        IF NOT EXISTS (SELECT 1 FROM data_id WHERE id = v_user_id) THEN
            RAISE EXCEPTION 'User ID % not found', v_user_id;
        END IF;

        -- Step 2: 生成托盤編號和系列號
        v_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');

        -- 調用托盤生成函數
        FOR v_pallet_result IN
            SELECT * FROM generate_atomic_pallet_numbers_v6(p_count, COALESCE(p_session_id, 'qc-' || v_date_str || '-' || v_user_id))
        LOOP
            v_pallet_numbers := array_append(v_pallet_numbers, v_pallet_result.pallet_number);
            v_series := array_append(v_series, v_pallet_result.series);
        END LOOP;

        -- 驗證是否獲得足夠的托盤編號
        IF array_length(v_pallet_numbers, 1) != p_count THEN
            RAISE EXCEPTION 'Failed to generate enough pallet numbers. Got %, expected %',
                array_length(v_pallet_numbers, 1), p_count;
        END IF;

        -- Step 3: 創建 QC 記錄
        v_history_time := NOW();
        v_history_action := 'Finished QC';
        v_total_quantity := p_product_qty * p_count;

        -- 為每個托盤創建記錄
        FOR v_idx IN 1..p_count LOOP
            -- 插入 record_palletinfo
            INSERT INTO record_palletinfo (
                plt_num,
                series,
                product_code,
                product_qty,
                plt_remark,
                pdf_url,
                generate_time
            ) VALUES (
                v_pallet_numbers[v_idx],
                v_series[v_idx],
                p_product_code,
                p_product_qty,
                p_plt_remark,
                CASE WHEN p_pdf_urls IS NOT NULL AND array_length(p_pdf_urls, 1) >= v_idx
                     THEN p_pdf_urls[v_idx]
                     ELSE NULL
                END,
                v_history_time
            );

            -- 插入 record_history
            INSERT INTO record_history (
                time,
                id,
                action,
                plt_num,
                loc,
                remark
            ) VALUES (
                v_history_time,
                v_user_id,
                v_history_action,
                v_pallet_numbers[v_idx],
                'Await',
                '-'
            );

            -- 插入 record_inventory
            INSERT INTO record_inventory (
                plt_num,
                product_code,
                product_desc,
                product_qty,
                loc,
                id
            ) VALUES (
                v_pallet_numbers[v_idx],
                p_product_code,
                v_product_description,
                p_product_qty,
                'Await',
                v_user_id
            );

            -- 構建托盤數據
            v_pallet_data := array_append(
                v_pallet_data,
                jsonb_build_object(
                    'pallet_number', v_pallet_numbers[v_idx],
                    'series', v_series[v_idx],
                    'pdf_url', CASE WHEN p_pdf_urls IS NOT NULL AND array_length(p_pdf_urls, 1) >= v_idx
                                    THEN p_pdf_urls[v_idx]
                                    ELSE NULL
                               END
                )
            );
        END LOOP;

        -- Step 4: 更新庫存水平（使用正確的函數）
        -- 使用 update_stock_level 函數確保按日期正確處理
        PERFORM update_stock_level(p_product_code, v_total_quantity, v_product_description);

        -- Step 5: 更新工作量
        -- 檢查今天是否已有記錄
        IF EXISTS (
            SELECT 1 FROM work_level
            WHERE id = v_user_id
            AND DATE(latest_update) = CURRENT_DATE
        ) THEN
            UPDATE work_level
            SET
                qc = qc + p_count,
                latest_update = NOW()
            WHERE id = v_user_id
            AND DATE(latest_update) = CURRENT_DATE;
        ELSE
            INSERT INTO work_level (
                uuid,
                id,
                qc,
                move,
                grn,
                loading,
                latest_update
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                p_count,
                0,
                0,
                0,
                NOW()
            );
        END IF;

        -- Step 6: 處理 ACO 訂單（如果提供）
        IF p_aco_order_ref IS NOT NULL AND p_aco_quantity_used IS NOT NULL THEN
            -- 更新或插入 ACO 記錄到 record_aco 表
            INSERT INTO record_aco (
                uuid,
                order_ref,
                code,
                required_qty,
                remain_qty,
                latest_update
            ) VALUES (
                gen_random_uuid(),
                p_aco_order_ref,
                p_product_code,
                p_aco_quantity_used,
                GREATEST(0, p_aco_quantity_used - p_aco_quantity_used), -- 已使用，剩餘為0
                NOW()
            )
            ON CONFLICT (order_ref, code)
            DO UPDATE SET
                remain_qty = GREATEST(0, record_aco.remain_qty - p_aco_quantity_used),
                latest_update = NOW();

            -- 為每個托盤創建 ACO 詳細記錄（如果需要的話）
            FOR v_idx IN 1..p_count LOOP
                INSERT INTO record_aco_detail (
                    uuid,
                    plt_num,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    v_pallet_numbers[v_idx],
                    NOW()::time
                );
            END LOOP;

            -- 檢查訂單是否完成
            IF EXISTS (
                SELECT 1 FROM record_aco
                WHERE order_ref = p_aco_order_ref
                AND remain_qty = 0
            ) THEN
                v_aco_result := jsonb_build_object(
                    'order_completed', true,
                    'order_ref', p_aco_order_ref
                );

                v_warnings := array_append(v_warnings,
                    format('ACO Order %s has been completed', p_aco_order_ref));
            END IF;
        END IF;

        -- Step 7: 處理 Slate 批次（如果提供）
        IF p_slate_batch_number IS NOT NULL THEN
            FOR v_idx IN 1..p_count LOOP
                INSERT INTO record_slate (
                    plt_num,
                    batch_number,
                    created_at
                ) VALUES (
                    v_pallet_numbers[v_idx],
                    p_slate_batch_number,
                    NOW()
                );
            END LOOP;
        END IF;

        -- Step 8: 確認托盤使用
        PERFORM confirm_pallet_usage(v_pallet_numbers);

        -- 構建成功結果
        v_result := jsonb_build_object(
            'success', true,
            'message', format('Successfully processed %s QC labels', p_count),
            'data', jsonb_build_object(
                'pallet_numbers', v_pallet_numbers,
                'series', v_series,
                'pallet_data', v_pallet_data,
                'total_quantity', v_total_quantity,
                'product_code', p_product_code,
                'product_description', v_product_description,
                'user_id', v_user_id,
                'timestamp', v_history_time
            ),
            'statistics', jsonb_build_object(
                'pallets_created', p_count,
                'total_quantity', v_total_quantity,
                'stock_updated', true,
                'work_level_updated', true,
                'aco_updated', p_aco_order_ref IS NOT NULL,
                'slate_updated', p_slate_batch_number IS NOT NULL
            ),
            'warnings', v_warnings,
            'aco_result', v_aco_result
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- 回滾事務
            -- 如果已經預留了托盤編號，需要釋放它們
            IF v_pallet_numbers IS NOT NULL AND array_length(v_pallet_numbers, 1) > 0 THEN
                PERFORM release_pallet_reservation(v_pallet_numbers);
            END IF;

            -- 返回錯誤結果
            RETURN jsonb_build_object(
                'success', false,
                'message', format('Error processing QC labels: %s', SQLERRM),
                'error', SQLERRM,
                'error_detail', SQLSTATE,
                'data', NULL
            );
    END;
END;
$$;

-- 設置權限
GRANT EXECUTE ON FUNCTION public.process_qc_label_unified(
    INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT[]
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_qc_label_unified(
    INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT[]
) TO service_role;

-- 添加函數註釋
COMMENT ON FUNCTION public.process_qc_label_unified(
    INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT[]
) IS
'統一處理 QC 標籤生成的所有操作。
包括：
1. 生成托盤編號和系列號
2. 創建 QC 記錄（record_palletinfo, record_history, record_inventory）
3. 更新庫存水平（stock_level）
4. 更新員工工作量（work_level）
5. 處理 ACO 訂單（如果提供）
6. 處理 Slate 批次（如果提供）
7. 確認托盤使用

參數：
- p_count: 生成標籤數量
- p_product_code: 產品代碼
- p_product_qty: 每個托盤數量
- p_clock_number: 員工時鐘號
- p_plt_remark: 托盤備註（可選）
- p_session_id: 會話 ID（可選）
- p_aco_order_ref: ACO 訂單參考號（可選）
- p_aco_quantity_used: ACO 使用數量（可選）
- p_slate_batch_number: Slate 批次號（可選）
- p_pdf_urls: PDF URL 陣列（可選）

返回 JSONB 格式的結果，包含成功狀態、數據和統計信息。';

-- 測試函數
DO $$
DECLARE
    v_test_result JSONB;
BEGIN
    -- 測試基本 QC 標籤生成（不包含 ACO 或 Slate）
    v_test_result := process_qc_label_unified(
        p_count := 2,
        p_product_code := 'MEP9090150',
        p_product_qty := 50,
        p_clock_number := '5997',  -- 使用真實存在的 user ID
        p_plt_remark := 'Test QC Label',
        p_session_id := 'test-session-001'
    );

    IF (v_test_result->>'success')::boolean THEN
        RAISE NOTICE '✅ Test passed: QC label process works correctly';
        RAISE NOTICE 'Result: %', jsonb_pretty(v_test_result);

        -- 清理測試數據
        DELETE FROM record_palletinfo
        WHERE plt_num = ANY((v_test_result->'data'->>'pallet_numbers')::text[]);

        DELETE FROM record_history
        WHERE plt_num = ANY((v_test_result->'data'->>'pallet_numbers')::text[]);

        DELETE FROM record_inventory
        WHERE plt_num = ANY((v_test_result->'data'->>'pallet_numbers')::text[]);

        UPDATE stock_level
        SET stock_level = stock_level - (v_test_result->'data'->>'total_quantity')::integer
        WHERE stock = 'MEP9090150';

        DELETE FROM work_level
        WHERE id = 5997
        AND DATE(latest_update) = CURRENT_DATE;

        -- 釋放托盤編號
        PERFORM release_pallet_reservation((v_test_result->'data'->>'pallet_numbers')::text[]);

        RAISE NOTICE '✅ Test data cleaned up successfully';
    ELSE
        RAISE EXCEPTION '❌ Test failed: %', v_test_result->>'message';
    END IF;
END $$;
