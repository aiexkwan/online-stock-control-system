-- 統一 GRN Label 處理 RPC 函數
-- 日期：2025-07-02
-- 目的：整合所有 GRN Label 相關操作到一個事務中，使用預生成的棧板號碼池

CREATE OR REPLACE FUNCTION public.process_grn_label_unified(
    p_count INTEGER,
    p_grn_number TEXT,
    p_material_code TEXT,
    p_supplier_code TEXT,
    p_clock_number TEXT,
    p_label_mode TEXT DEFAULT 'weight',
    p_session_id TEXT DEFAULT NULL,
    p_gross_weights NUMERIC[] DEFAULT NULL,
    p_net_weights NUMERIC[] DEFAULT NULL,
    p_quantities INTEGER[] DEFAULT NULL,
    p_pallet_count INTEGER DEFAULT 0,
    p_package_count INTEGER DEFAULT 0,
    p_pallet_type TEXT DEFAULT '',
    p_package_type TEXT DEFAULT '',
    p_pdf_urls TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id INTEGER;
    v_pallet_numbers TEXT[];
    v_series TEXT[];
    v_pallet_result RECORD;
    v_idx INTEGER;
    v_material_description TEXT;
    v_supplier_name TEXT;
    v_history_time TIMESTAMP WITH TIME ZONE;
    v_current_gross_weight NUMERIC;
    v_current_net_weight NUMERIC;
    v_current_quantity INTEGER;
    v_total_gross_weight NUMERIC := 0;
    v_total_net_weight NUMERIC := 0;
    v_total_quantity INTEGER := 0;
    v_workflow_result JSONB;
BEGIN
    BEGIN
        -- 驗證參數
        IF p_count <= 0 OR p_count > 100 THEN
            RAISE EXCEPTION 'Invalid count: must be between 1 and 100';
        END IF;

        IF p_label_mode NOT IN ('weight', 'qty') THEN
            RAISE EXCEPTION 'Invalid label mode: must be weight or qty';
        END IF;

        -- 驗證物料代碼
        SELECT description INTO v_material_description
        FROM data_code WHERE code = p_material_code;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Material code % not found', p_material_code;
        END IF;

        -- 驗證供應商代碼
        SELECT supplier_name INTO v_supplier_name
        FROM data_supplier WHERE supplier_code = p_supplier_code;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier code % not found', p_supplier_code;
        END IF;

        -- 驗證用戶 ID
        v_user_id := p_clock_number::INTEGER;
        IF NOT EXISTS (SELECT 1 FROM data_id WHERE id = v_user_id) THEN
            RAISE EXCEPTION 'User ID % not found', v_user_id;
        END IF;

        -- 分配棧板編號（從預生成的每日 300 個棧板號碼池）
        FOR v_pallet_result IN
            SELECT * FROM generate_atomic_pallet_numbers_v6(p_count,
                COALESCE(p_session_id, 'grn-' || p_grn_number || '-' || v_user_id))
        LOOP
            v_pallet_numbers := array_append(v_pallet_numbers, v_pallet_result.pallet_number);
            v_series := array_append(v_series, v_pallet_result.series);
        END LOOP;

        IF array_length(v_pallet_numbers, 1) != p_count THEN
            RAISE EXCEPTION 'Failed to allocate enough pallet numbers. Got %, expected %',
                array_length(v_pallet_numbers, 1), p_count;
        END IF;

        v_history_time := NOW();

        -- 為每個棧板創建記錄
        FOR v_idx IN 1..p_count LOOP
            -- 根據標籤模式設置重量/數量
            IF p_label_mode = 'weight' THEN
                v_current_gross_weight := p_gross_weights[v_idx];
                v_current_net_weight := p_net_weights[v_idx];
                v_current_quantity := ROUND(v_current_net_weight);
            ELSE -- qty mode
                v_current_quantity := p_quantities[v_idx];
                v_current_gross_weight := NULL;
                v_current_net_weight := v_current_quantity;
            END IF;

            -- 驗證數據有效性
            IF p_label_mode = 'weight' AND (v_current_gross_weight <= 0 OR v_current_net_weight <= 0) THEN
                RAISE EXCEPTION 'Invalid weights for pallet %: gross=%, net=%', v_idx, v_current_gross_weight, v_current_net_weight;
            END IF;

            IF p_label_mode = 'qty' AND v_current_quantity <= 0 THEN
                RAISE EXCEPTION 'Invalid quantity for pallet %: %', v_idx, v_current_quantity;
            END IF;

            -- 累計統計數據
            v_total_gross_weight := v_total_gross_weight + COALESCE(v_current_gross_weight, 0);
            v_total_net_weight := v_total_net_weight + COALESCE(v_current_net_weight, v_current_quantity);
            v_total_quantity := v_total_quantity + v_current_quantity;

            -- 插入 record_palletinfo
            INSERT INTO record_palletinfo (
                plt_num, series, product_code, product_qty, plt_remark,
                pdf_url, generate_time
            ) VALUES (
                v_pallet_numbers[v_idx], v_series[v_idx], p_material_code,
                v_current_quantity, 'Material GRN-' || p_grn_number,
                CASE WHEN p_pdf_urls IS NOT NULL AND array_length(p_pdf_urls, 1) >= v_idx
                     THEN p_pdf_urls[v_idx] ELSE NULL END,
                v_history_time
            );

            -- 插入 record_grn
            INSERT INTO record_grn (
                grn_ref, material_code, sup_code, plt_num,
                gross_weight, net_weight, pallet_count, package_count,
                pallet, package
            ) VALUES (
                p_grn_number::INTEGER, p_material_code, p_supplier_code,
                v_pallet_numbers[v_idx], COALESCE(v_current_gross_weight, 0),
                COALESCE(v_current_net_weight, v_current_quantity),
                p_pallet_count, p_package_count, p_pallet_type, p_package_type
            );

            -- 插入 record_history
            INSERT INTO record_history (time, id, action, plt_num, loc, remark)
            VALUES (v_history_time, v_user_id, 'GRN Receiving', v_pallet_numbers[v_idx],
                    'Await_grn', format('GRN: %s, Material: %s', p_grn_number, p_material_code));

            -- 插入 record_inventory
            INSERT INTO record_inventory (plt_num, product_code, await_grn)
            VALUES (v_pallet_numbers[v_idx], p_material_code,
                    COALESCE(v_current_net_weight, v_current_quantity));
        END LOOP;

        -- 確認棧板使用（從 'Holded' 狀態改為 'True'）
        PERFORM confirm_pallet_usage(v_pallet_numbers);

        -- 🚀 新增：調用 GRN workflow 更新 stock_level, grn_level, work_level
        BEGIN
            SELECT update_grn_workflow(
                p_grn_number::BIGINT,
                p_material_code,
                v_material_description,
                p_label_mode,
                v_user_id::TEXT,
                CASE WHEN p_label_mode = 'qty' THEN v_total_quantity ELSE NULL END,
                CASE WHEN p_label_mode = 'weight' THEN v_total_net_weight ELSE NULL END
            ) INTO v_workflow_result;
        EXCEPTION WHEN OTHERS THEN
            -- 記錄但不中斷主流程
            v_workflow_result := jsonb_build_object(
                'grn_level_result', 'Error: ' || SQLERRM,
                'work_level_result', 'Error: ' || SQLERRM,
                'stock_level_result', 'Error: ' || SQLERRM,
                'error', true
            );
        END;

        -- 返回成功結果
        RETURN jsonb_build_object(
            'success', true,
            'message', format('Successfully processed %s GRN labels for GRN %s', p_count, p_grn_number),
            'data', jsonb_build_object(
                'pallet_numbers', v_pallet_numbers,
                'series', v_series,
                'grn_number', p_grn_number,
                'material_code', p_material_code,
                'material_description', v_material_description,
                'supplier_code', p_supplier_code,
                'supplier_name', v_supplier_name,
                'user_id', v_user_id,
                'label_mode', p_label_mode,
                'timestamp', v_history_time
            ),
            'statistics', jsonb_build_object(
                'pallets_created', p_count,
                'total_gross_weight', CASE WHEN p_label_mode = 'weight'
                    THEN v_total_gross_weight ELSE NULL END,
                'total_net_weight', v_total_net_weight,
                'total_quantity', v_total_quantity
            ),
            'workflow_result', v_workflow_result
        );

    EXCEPTION
        WHEN OTHERS THEN
            -- 釋放已分配的棧板編號
            IF v_pallet_numbers IS NOT NULL AND array_length(v_pallet_numbers, 1) > 0 THEN
                PERFORM release_pallet_reservation(v_pallet_numbers);
            END IF;

            RETURN jsonb_build_object(
                'success', false,
                'message', format('Error processing GRN labels: %s', SQLERRM),
                'error', SQLERRM,
                'error_detail', SQLSTATE
            );
    END;
END;
$function$;

-- 設置權限
GRANT EXECUTE ON FUNCTION public.process_grn_label_unified(
    INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC[], NUMERIC[], INTEGER[], INTEGER, INTEGER, TEXT, TEXT, TEXT[]
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.process_grn_label_unified(
    INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC[], NUMERIC[], INTEGER[], INTEGER, INTEGER, TEXT, TEXT, TEXT[]
) TO service_role;

-- 添加函數註釋
COMMENT ON FUNCTION public.process_grn_label_unified(
    INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC[], NUMERIC[], INTEGER[], INTEGER, INTEGER, TEXT, TEXT, TEXT[]
) IS
'統一處理 GRN 標籤生成的所有操作。使用預生成的每日 300 個棧板號碼池。
包括：
1. 從 pallet_number_buffer 分配棧板編號和系列號
2. 創建 GRN 記錄（record_palletinfo, record_grn, record_history, record_inventory）
3. 確認棧板使用狀態

支援兩種標籤模式：
- weight: 使用重量數據（毛重、淨重）
- qty: 使用數量數據

關鍵優化：
- 使用現有的每日 300 個預生成棧板號碼系統
- 無需重新生成，只需分配可用的棧板編號
- 原子操作確保數據一致性

返回 JSONB 格式的結果，包含成功狀態、數據和統計信息。';
