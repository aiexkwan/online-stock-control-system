-- Fix process_qc_label_unified to remove duplicate ACO order updates
-- The ACO order finished_qty should only be updated via the API call, not in this RPC

-- Drop existing function first (required when changing parameter defaults)
DROP FUNCTION IF EXISTS process_qc_label_unified(integer,text,integer,text,text,text,text,integer,text,text[]);

-- Recreate function with fixed logic
CREATE FUNCTION process_qc_label_unified(
    p_count INTEGER,
    p_product_code TEXT,
    p_product_qty INTEGER,
    p_clock_number TEXT,
    p_plt_remark TEXT,
    p_session_id TEXT DEFAULT NULL,
    p_aco_order_ref TEXT DEFAULT NULL,
    p_aco_quantity_used INTEGER DEFAULT NULL,
    p_slate_batch_number TEXT DEFAULT NULL,
    p_pdf_urls TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id INTEGER;
    v_product_data RECORD;
    v_pallet_numbers TEXT[];
    v_series_numbers TEXT[];
    v_idx INTEGER;
    v_pallet_num TEXT;
    v_series TEXT;
    v_session_id TEXT;
    v_pallet_info JSONB[];
    v_total_quantity INTEGER;
    v_stats JSONB;
    v_result JSONB;
    v_warnings TEXT[] := '{}';
    v_aco_result JSONB := NULL;
    v_aco_order_ref_bigint BIGINT;
    v_pallet_record RECORD;
BEGIN
    -- Step 1: 驗證輸入參數
    IF p_count <= 0 OR p_count > 100 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid count: must be between 1 and 100'
        );
    END IF;

    IF p_product_code IS NULL OR TRIM(p_product_code) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product code is required'
        );
    END IF;

    IF p_product_qty <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product quantity must be greater than 0'
        );
    END IF;

    -- Step 2: 查找並驗證用戶
    v_user_id := p_clock_number::INTEGER;

    IF NOT EXISTS (SELECT 1 FROM data_id WHERE id = v_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid user ID (clock number)'
        );
    END IF;

    -- Step 3: 查找產品資訊
    SELECT code, description, standard_qty, type
    INTO v_product_data
    FROM data_code
    WHERE code = p_product_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product code not found'
        );
    END IF;

    -- Step 4: 從 pallet_number_buffer 獲取棧板號碼和系列號
    -- 生成 session ID（如果未提供）
    v_session_id := COALESCE(p_session_id, 'qc-' || extract(epoch from now())::bigint::text);

    -- 計算總數量
    v_total_quantity := p_count * p_product_qty;

    -- 預先分配數組大小
    v_pallet_numbers := ARRAY[]::TEXT[];
    v_series_numbers := ARRAY[]::TEXT[];
    v_pallet_info := ARRAY[]::JSONB[];

    -- 從 generate_atomic_pallet_numbers_v6 函數獲取棧板號碼
    FOR v_pallet_record IN
        SELECT * FROM generate_atomic_pallet_numbers_v6(p_count, v_session_id)
    LOOP
        -- 添加到數組
        v_pallet_numbers := array_append(v_pallet_numbers, v_pallet_record.pallet_number);
        v_series_numbers := array_append(v_series_numbers, v_pallet_record.series);

        -- 構建棧板信息
        v_pallet_info := array_append(v_pallet_info,
            jsonb_build_object(
                'pallet_number', v_pallet_record.pallet_number,
                'series', v_pallet_record.series,
                'pdf_url', CASE
                    WHEN p_pdf_urls IS NOT NULL AND
                         array_position(v_pallet_numbers, v_pallet_record.pallet_number) <= array_length(p_pdf_urls, 1)
                    THEN p_pdf_urls[array_position(v_pallet_numbers, v_pallet_record.pallet_number)]
                    ELSE NULL
                END
            )
        );
    END LOOP;

    -- 驗證是否獲得足夠的托盤編號
    IF array_length(v_pallet_numbers, 1) != p_count THEN
        RAISE EXCEPTION 'Failed to get enough pallet numbers. Got %, expected %',
            array_length(v_pallet_numbers, 1), p_count;
    END IF;

    -- Step 5: 批量插入數據
    -- 5.1 插入到 record_palletinfo
    FOR v_idx IN 1..p_count LOOP
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
            v_series_numbers[v_idx],
            p_product_code,
            p_product_qty,
            p_plt_remark,
            CASE
                WHEN p_pdf_urls IS NOT NULL AND v_idx <= array_length(p_pdf_urls, 1)
                THEN p_pdf_urls[v_idx]
                ELSE NULL
            END,
            NOW()
        );
    END LOOP;

    -- 5.2 插入到 record_history
    FOR v_idx IN 1..p_count LOOP
        INSERT INTO record_history (
            uuid,
            time,
            id,
            action,
            plt_num,
            loc,
            remark
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            v_user_id,
            'Finished QC',
            v_pallet_numbers[v_idx],
            'injection',
            p_product_code
        );
    END LOOP;

    -- 5.3 更新 record_inventory（增加 injection 數量）
    UPDATE record_inventory
    SET injection = injection + v_total_quantity,
        latest_update = NOW()
    WHERE product_code = p_product_code;

    -- 如果不存在則插入新記錄
    IF NOT FOUND THEN
        INSERT INTO record_inventory (
            uuid,
            product_code,
            injection,
            pipeline,
            prebook,
            await,
            fold,
            bulk,
            backcarpark,
            damage,
            await_grn,
            plt_num,
            latest_update
        ) VALUES (
            gen_random_uuid(),
            p_product_code,
            v_total_quantity,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            p_product_code || '_inventory',
            NOW()
        );
    END IF;

    -- Step 6: 處理 Slate 批次號（如果提供）
    -- 注意：record_slate 表有很多必填欄位，這裡跳過處理
    -- Slate 相關功能需要單獨處理

    -- Step 7: 處理 ACO 訂單詳情記錄（但不更新 finished_qty）
    -- 注意：finished_qty 的更新由獨立的 API 調用處理，避免重複更新
    IF p_aco_order_ref IS NOT NULL AND p_aco_quantity_used IS NOT NULL THEN
        -- 為每個托盤創建 ACO 詳細記錄
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

        -- 設置 ACO 結果信息（但不執行更新）
        v_aco_result := jsonb_build_object(
            'aco_processed', true,
            'order_ref', p_aco_order_ref,
            'quantity_to_update', p_aco_quantity_used,
            'note', 'ACO order quantity will be updated via separate API call'
        );

        -- 添加警告
        v_warnings := array_append(v_warnings,
            'ACO order quantity update pending - will be processed after label printing'
        );
    END IF;

    -- Step 8: 更新庫存水平（stock level）
    UPDATE stock_level
    SET current_qty = current_qty + v_total_quantity,
        last_updated = NOW()
    WHERE product_code = p_product_code;

    -- 如果不存在則插入
    IF NOT FOUND THEN
        INSERT INTO stock_level (product_code, current_qty, last_updated)
        VALUES (p_product_code, v_total_quantity, NOW());
    END IF;

    -- Step 9: 更新工作水平（work level）
    UPDATE work_level
    SET printed_labels = printed_labels + p_count,
        last_activity = NOW()
    WHERE user_id = v_user_id
      AND DATE(last_activity) = CURRENT_DATE;

    -- 如果今天沒有記錄則插入
    IF NOT FOUND THEN
        INSERT INTO work_level (user_id, printed_labels, last_activity)
        VALUES (v_user_id, p_count, NOW());
    END IF;

    -- Step 10: 建立統計信息
    v_stats := jsonb_build_object(
        'pallets_created', p_count,
        'total_quantity', v_total_quantity,
        'records_created', jsonb_build_object(
            'palletinfo', p_count,
            'history', p_count,
            'inventory', p_count,
            'slate', CASE WHEN p_slate_batch_number IS NOT NULL THEN p_count ELSE 0 END
        ),
        'updates_made', jsonb_build_object(
            'stock_level', true,
            'work_level', true
        )
    );

    -- Step 11: 返回結果
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully created %s QC labels', p_count),
        'data', jsonb_build_object(
            'pallet_numbers', v_pallet_numbers,
            'series', v_series_numbers,
            'pallet_data', v_pallet_info,
            'total_quantity', v_total_quantity,
            'product_code', p_product_code,
            'product_description', v_product_data.description,
            'user_id', v_user_id,
            'timestamp', NOW()::text,
            'session_id', v_session_id,
            'aco_info', v_aco_result
        ),
        'statistics', v_stats,
        'warnings', CASE
            WHEN array_length(v_warnings, 1) > 0 THEN v_warnings
            ELSE NULL
        END
    );

EXCEPTION WHEN OTHERS THEN
    -- 錯誤處理
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', jsonb_build_object(
            'state', SQLSTATE,
            'hint', COALESCE(
                NULLIF(current_setting('plpgsql.extra_errors', true), ''),
                'Check function parameters and database constraints'
            )
        )
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION process_qc_label_unified IS 'Unified QC label processing function that handles all label creation in one atomic operation. ACO order quantity updates are handled separately via API to avoid duplicate updates.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_qc_label_unified TO authenticated;
GRANT EXECUTE ON FUNCTION process_qc_label_unified TO service_role;
