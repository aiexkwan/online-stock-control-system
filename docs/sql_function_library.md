# SQL 函數庫

本文檔記錄了項目中使用的自定義 PostgreSQL 函數。

## `get_product_details_by_code`

*   **用途描述:** 根據產品代碼從 `data_code` 表中檢索產品的詳細信息。
*   **參數:**
    *   `p_code` (TEXT): 要查詢的產品代碼。查詢時不區分大小寫。
*   **返回類型:** TABLE (`code` TEXT, `description` TEXT, `standard_qty` TEXT, `type` TEXT)
*   **返回結構:** 返回一個包含單行記錄的表，其中包含匹配產品的 `code`, `description`, `standard_qty`, 和 `type`。如果未找到匹配項，則返回空表。
*   **SQL 定義:**
    ```sql
    CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
    RETURNS TABLE (
      code TEXT,
      description TEXT,
      standard_qty TEXT,
      type TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        dc.code,
        dc.description,
        dc.standard_qty,
        dc.type
      FROM
        data_code dc
      WHERE
        dc.code ILIKE p_code;
    END;
    $$;
    ```

## `void_pallet_transaction`

This RPC function handles the complete process of voiding a pallet. It updates pallet status, adjusts inventory, cleans up related records, and logs the transaction.

**Parameters:**

*   `p_user_id` (INTEGER): The ID of the user performing the action.
*   `p_plt_num` (TEXT): The pallet number to be voided.
*   `p_product_code` (TEXT): The product code on the pallet.
*   `p_product_qty` (INTEGER): The quantity of the product on the pallet.
*   `p_void_location` (TEXT): The location from which the pallet is being voided (original location from `record_palletinfo`).
*   `p_void_reason` (TEXT): The reason for voiding the pallet.

**SQL Definition:**

```sql
CREATE OR REPLACE FUNCTION public.void_pallet_transaction(
    p_user_id integer,
    p_plt_num text,
    p_product_code text,
    p_product_qty integer,
    p_void_location text,
    p_void_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_current_pallet_info_status TEXT;
    v_original_pallet_remark TEXT; 
    v_inventory_column_name TEXT;
    v_transfer_record_exists BOOLEAN; 
    v_result JSONB;
    v_aco_ref TEXT; 
    v_aco_ref_regex TEXT := 'ACO Ref : (\d{5,7})'; 
    v_match_array TEXT[];
    v_success_message TEXT;
    v_actual_inventory_deduction_loc TEXT;
BEGIN
    -- 1. Get current pallet status and original remark from record_palletinfo
    SELECT plt_loc, plt_remark 
    INTO v_current_pallet_info_status, v_original_pallet_remark
    FROM public.record_palletinfo
    WHERE plt_num = p_plt_num;

    IF v_current_pallet_info_status IS NULL THEN
        v_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'PALLET_NOT_FOUND_IN_PALLETINFO',
            'message', 'Pallet ' || p_plt_num || ' not found in pallet info records.'
        );
        RETURN v_result;
    END IF;

    -- If already 'Voided', block. If 'Damaged' (fully), also block as it's a final state.
    IF v_current_pallet_info_status = 'Voided' OR v_current_pallet_info_status = 'Damaged' THEN
        INSERT INTO public.record_history (id, action, plt_num, loc, remark, time) 
        VALUES (p_user_id, 'Void Attempt Blocked', p_plt_num, v_current_pallet_info_status, 
                'Attempt to void pallet already in final state: ' || v_current_pallet_info_status, now());
        
        v_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ALREADY_IN_FINAL_STATE',
            'message', 'Pallet ' || p_plt_num || ' is already ' || v_current_pallet_info_status || '.'
        );
        RETURN v_result;
    END IF;

    -- Determine the actual location from which inventory should be deducted
    v_actual_inventory_deduction_loc := p_void_location; 

    IF p_void_location IN ('Partial Damaged') THEN 
        SELECT rh.loc 
        INTO v_actual_inventory_deduction_loc
        FROM public.record_history rh
        WHERE rh.plt_num = p_plt_num
          AND rh.loc NOT IN ('Partial Damaged', 'Damaged', 'Voided') 
        ORDER BY rh.time DESC
        LIMIT 1;

        IF v_actual_inventory_deduction_loc IS NULL THEN
            RAISE EXCEPTION 'Cannot determine original inventory location from history for pallet % which is currently at % (passed as p_void_location)', p_plt_num, p_void_location;
        END IF;
    END IF;
    
    -- 2. Check if a record exists in record_transfer for this plt_num
    SELECT EXISTS (
        SELECT 1 FROM public.record_transfer WHERE plt_num = p_plt_num
    ) INTO v_transfer_record_exists;

    -- 3. Update record_palletinfo: set plt_loc to 'Voided'
    UPDATE public.record_palletinfo
    SET plt_loc = 'Voided',
        plt_remark = COALESCE(v_original_pallet_remark || '; ', '') || 'Voided on ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || ' due to: ' || p_void_reason,
        product_qty = 0 
    WHERE plt_num = p_plt_num;

    -- 4. Determine the correct inventory column based on v_actual_inventory_deduction_loc
    CASE v_actual_inventory_deduction_loc
        WHEN 'Production' THEN v_inventory_column_name := 'injection';
        WHEN 'PipeLine' THEN v_inventory_column_name := 'pipeline';
        WHEN 'Pre-Book' THEN v_inventory_column_name := 'prebook';
        WHEN 'Await' THEN v_inventory_column_name := 'await';
        WHEN 'Fold Mill' THEN v_inventory_column_name := 'fold';
        WHEN 'Bulk Room' THEN v_inventory_column_name := 'bulk';
        WHEN 'Back Car Park' THEN v_inventory_column_name := 'backcarpark';
        ELSE
            RAISE EXCEPTION 'Unknown actual inventory deduction location: "%" for pallet %. Derived from p_void_location: "%".', 
                           v_actual_inventory_deduction_loc, p_plt_num, p_void_location;
    END CASE;

    EXECUTE format('INSERT INTO public.record_inventory (product_code, plt_num, %I, latest_update) VALUES ($1, $2, $3, $4)', v_inventory_column_name)
    USING p_product_code, p_plt_num, -p_product_qty, now(); 
    
    -- 5. Conditionally delete from record_transfer
    IF v_transfer_record_exists THEN
        DELETE FROM public.record_transfer
        WHERE plt_num = p_plt_num;
    END IF; 

    -- 5a. Conditionally delete from record_grn
    IF p_void_reason <> 'Used Material' THEN
        DELETE FROM public.record_grn
        WHERE plt_num = p_plt_num;
    END IF;

    -- 5b. Conditionally update record_aco based on original plt_remark and void reason
    IF v_original_pallet_remark IS NOT NULL AND p_void_reason <> 'Used Material' THEN
        v_match_array := regexp_match(v_original_pallet_remark, v_aco_ref_regex);
        IF v_match_array IS NOT NULL AND array_length(v_match_array, 1) > 0 THEN
            v_aco_ref := trim(v_match_array[1]); 
            IF v_aco_ref IS NOT NULL AND v_aco_ref <> '' THEN
                UPDATE public.record_aco
                SET remain_qty = remain_qty + p_product_qty 
                WHERE code = p_product_code AND order_ref = v_aco_ref::INTEGER; 
            END IF;
        END IF;
    END IF;

    -- 6. Log the void action to record_history
    INSERT INTO public.record_history (id, action, plt_num, loc, remark, time) 
    VALUES (p_user_id, 'Voided Pallet', p_plt_num, 'Voided', p_void_reason, now());

    -- 7. Log to report_void
    INSERT INTO public.report_void (plt_num, reason, damage_qty)
    VALUES (p_plt_num, p_void_reason, 0); 
    
    IF v_transfer_record_exists THEN 
        v_success_message := 'Pallet ' || p_plt_num || ' has been voided successfully (transfer record processed).';
    ELSE
        v_success_message := 'Pallet ' || p_plt_num || ' has been voided successfully (no transfer record found/processed).';
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'message', v_success_message
    );
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '[void_pallet_transaction] - Error for pallet %: %', p_plt_num, SQLERRM;
        v_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'TRANSACTION_FAILED',
            'message', 'Voiding pallet ' || p_plt_num || ' failed: ' || SQLERRM
        );
        RETURN v_result;
END;
$function$;

## `process_damaged_pallet_void`

This RPC function handles the logic for processing a pallet that has been reported as damaged, either partially or fully. It updates inventory, pallet status, and logs relevant information. For partial damage, it returns the remaining good quantity and original location, expecting the calling layer (e.g., a server action) to handle the creation of a new pallet for the remaining good items.

**Parameters:**

*   `p_user_id` (INTEGER): The ID of the user performing the action.
*   `p_plt_num` (TEXT): The pallet number being processed for damage.
*   `p_product_code` (TEXT): The product code on the pallet.
*   `p_original_product_qty` (BIGINT): The original total quantity on the pallet before damage.
*   `p_damage_qty_to_process` (BIGINT): The quantity being reported as damaged in this transaction.
*   `p_current_true_location` (TEXT): The actual, last known good location of the pallet before this damage processing. Used to determine inventory deduction.
*   `p_void_reason` (TEXT): The reason provided for the damage/void.
*   `p_original_plt_remark` (TEXT): The original remark associated with the pallet (from `record_palletinfo.plt_remark`), used for potential ACO logic.

**Returns:** `JSONB`

A JSONB object containing:
*   `success` (BOOLEAN): True if the processing was successful, false otherwise.
*   `message` (TEXT): A descriptive message about the outcome.
*   `error_code` (TEXT, optional): An error code if `success` is false.
*   `remainingQty` (BIGINT): The calculated remaining good quantity after deducting `p_damage_qty_to_process`. This is -1 in case of an error or if not applicable. For partial damage, this value is intended to be used by the caller to create a new pallet.
*   `actual_original_location` (TEXT): The determined actual location from which inventory was adjusted. For partial damage, this value is intended to be used by the caller for the new pallet's location.

**SQL Definition:**

```sql
CREATE OR REPLACE FUNCTION public.process_damaged_pallet_void(
    p_user_id integer,
    p_plt_num text,
    p_product_code text,
    p_original_product_qty bigint,
    p_damage_qty_to_process bigint,
    p_current_true_location text,
    p_void_reason text,
    p_original_plt_remark text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_inventory_column_name TEXT;
    v_transfer_record_exists BOOLEAN;
    v_result JSONB;
    v_aco_ref TEXT;
    v_aco_ref_regex TEXT := 'ACO Ref : (\d{5,7})'; 
    v_match_array TEXT[];
    v_new_plt_loc_status TEXT;     -- 用於 record_palletinfo.plt_loc 嘅最終狀態
    v_history_action TEXT;
    v_is_full_damage BOOLEAN := (p_damage_qty_to_process = p_original_product_qty);
    v_actual_inventory_deduction_loc TEXT; -- 庫存扣減嘅實際來源位置
    v_current_palletinfo_status TEXT;    -- 執行前，棧板喺 palletinfo 嘅狀態
    v_remaining_good_qty BIGINT;
BEGIN
    -- Initial Validations for damage quantity
    IF p_damage_qty_to_process <= 0 THEN
        v_result := jsonb_build_object('success', FALSE, 'message', 'Damage quantity must be greater than zero.', 'remainingQty', -1, 'actual_original_location', NULL);
        RETURN v_result;
    END IF;
    IF p_damage_qty_to_process > p_original_product_qty THEN
        v_result := jsonb_build_object('success', FALSE, 'message', 'Damage quantity cannot exceed original pallet quantity.', 'remainingQty', -1, 'actual_original_location', NULL);
        RETURN v_result;
    END IF;

    -- Check current status in record_palletinfo.
    SELECT plt_loc INTO v_current_palletinfo_status FROM public.record_palletinfo WHERE plt_num = p_plt_num;

    IF v_current_palletinfo_status IS NULL THEN
        v_result := jsonb_build_object('success', FALSE, 'message', 'Pallet ' || p_plt_num || ' not found in pallet info for damage processing.', 'remainingQty', -1, 'actual_original_location', NULL);
        RETURN v_result;
    END IF;
    
    -- 如果棧板已經係最終作廢/損壞狀態，就唔再處理
    IF v_current_palletinfo_status IN ('Voided', 'Damaged', 'Voided (Partial)', 'Voided - Full Damage', 'Partial Damaged') THEN -- 根據你實際使用嘅最終狀態調整
        v_result := jsonb_build_object('success', FALSE, 'message', 'Pallet ' || p_plt_num || ' is already in a final processed state: ' || v_current_palletinfo_status || '. Cannot process further damage.', 'remainingQty', -1, 'actual_original_location', NULL);
        RETURN v_result;
    END IF;

    -- 確定真實嘅庫存扣減位置
    v_actual_inventory_deduction_loc := p_current_true_location; 

    -- 如果傳入嘅 p_current_true_location 已經係一個中間狀態 (例如 'Partial Damaged')
    -- 呢段邏輯嘗試從 history 搵出喺變成中間狀態之前嘅實際位置。
    -- 注意：如果 p_current_true_location 總能保證係損壞前嘅最後一個正常位置，則呢段 IF 可以簡化或移除。
    IF p_current_true_location IN ('Partial Damaged') THEN -- 根據你可能傳入嘅中間狀態調整
        SELECT rh.loc 
        INTO v_actual_inventory_deduction_loc
        FROM public.record_history rh
        WHERE rh.plt_num = p_plt_num
          AND rh.loc NOT IN ('Partial Damaged', 'Damaged', 'Voided') -- 排除作廢/損壞狀態
        ORDER BY rh.time DESC
        LIMIT 1;

        IF v_actual_inventory_deduction_loc IS NULL THEN
            RAISE EXCEPTION 'Cannot determine original inventory location from history for pallet % which was passed as current location %', p_plt_num, p_current_true_location;
        END IF;
    END IF;

    -- 將庫存位置映射到 record_inventory 嘅欄位名
    CASE v_actual_inventory_deduction_loc
        WHEN 'Production' THEN v_inventory_column_name := 'injection';
        WHEN 'PipeLine' THEN v_inventory_column_name := 'pipeline';
        WHEN 'Pre-Book' THEN v_inventory_column_name := 'prebook';
        WHEN 'Await' THEN v_inventory_column_name := 'await';
        WHEN 'Fold Mill' THEN v_inventory_column_name := 'fold';
        WHEN 'Bulk Room' THEN v_inventory_column_name := 'bulk'; 
        WHEN 'Back Car Park' THEN v_inventory_column_name := 'backcarpark';
        ELSE
            RAISE EXCEPTION 'Unknown actual inventory deduction location: "%" for pallet %. (Derived from p_current_true_location: "%")', 
                           v_actual_inventory_deduction_loc, p_plt_num, p_current_true_location;
    END CASE;

    -- 計算剩餘完好數量
    v_remaining_good_qty := p_original_product_qty - p_damage_qty_to_process;

    -- 1. 調整庫存：於單一記錄中，從來源位置扣除原始總量 (-p_original_product_qty)，
    --    並將實際處理嘅損壞量 (+p_damage_qty_to_process) 計入 'damage' 欄位。
    --    由於 p_damage_qty_to_process 已被驗證 > 0，此操作必定執行。
    EXECUTE format(
        'INSERT INTO public.record_inventory (product_code, plt_num, %I, damage, latest_update) ' ||
        'VALUES ($1, $2, $3, $4, $5)',
        v_inventory_column_name
    )
    USING p_product_code, p_plt_num, -p_original_product_qty, p_damage_qty_to_process, now();

    -- 3. 更新 record_palletinfo 狀態
    IF v_is_full_damage THEN
        v_new_plt_loc_status := 'Damaged'; 
        v_history_action := 'Fully Damaged';

        UPDATE public.record_palletinfo
        SET plt_loc = v_new_plt_loc_status,
            product_qty = 0, 
            plt_remark = COALESCE(p_original_plt_remark || '; ', '') || 
                         'Fully Damaged on ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || 
                         ' due to: ' || p_void_reason
        WHERE plt_num = p_plt_num;

        -- 清理相關記錄 (僅限完全損壞時，如果業務邏輯如此要求)
        SELECT EXISTS (SELECT 1 FROM public.record_transfer WHERE plt_num = p_plt_num) INTO v_transfer_record_exists;
        IF v_transfer_record_exists THEN
            DELETE FROM public.record_transfer WHERE plt_num = p_plt_num;
        END IF;
        DELETE FROM public.record_grn WHERE plt_num = p_plt_num;

        -- ACO 邏輯: 如果完全損壞，將原數量加回 ACO 剩餘量
        IF p_original_plt_remark IS NOT NULL THEN
            v_match_array := regexp_match(p_original_plt_remark, v_aco_ref_regex);
            IF v_match_array IS NOT NULL AND array_length(v_match_array, 1) > 0 THEN
                v_aco_ref := trim(v_match_array[1]);
                IF v_aco_ref IS NOT NULL AND v_aco_ref <> '' THEN
                    UPDATE public.record_aco
                    SET remain_qty = remain_qty + p_original_product_qty 
                    WHERE code = p_product_code AND order_ref = v_aco_ref::INTEGER;
                END IF;
            END IF;
        END IF;
    ELSE -- Partial Damage (所有剩餘完好品項將轉移到新棧板)
        v_new_plt_loc_status := 'Voided (Partial)'; 
        v_history_action := 'Partially Damaged';

        UPDATE public.record_palletinfo
        SET plt_loc = v_new_plt_loc_status, 
            product_qty = 0, -- 舊棧板數量變為0，因剩餘貨物會到新棧板
            plt_remark = COALESCE(p_original_plt_remark || '; ', '') || 
                         'Voided (Damage Qty: ' || p_damage_qty_to_process || 
                         ', Remaining Qty: ' || v_remaining_good_qty || ' to new pallet) on ' || 
                         TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || ' due to: ' || p_void_reason
        WHERE plt_num = p_plt_num;
        -- 部分損壞時，通常唔會刪除 GRN 或 Transfer 記錄，除非有特定業務需求
        -- ACO 邏輯：部分損壞時，如果損壞品項影響 ACO，可能需要調整 ACO 嘅 completed_qty 或 remark，但呢度較複雜，目前冇處理
    END IF;

    -- 4. 記錄操作歷史
    INSERT INTO public.record_history (id, action, plt_num, loc, remark, time) 
    VALUES (p_user_id, v_history_action, p_plt_num, v_new_plt_loc_status, 
            'Reason: ' || p_void_reason || ', Original Qty: ' || p_original_product_qty || 
            CASE WHEN NOT v_is_full_damage THEN ', Remaining Good Qty (for new pallet): ' || v_remaining_good_qty ELSE '' END, 
            now());

    -- 5. 記錄到作廢報告表
    INSERT INTO public.report_void (plt_num, reason, damage_qty)
    VALUES (p_plt_num, p_void_reason, p_damage_qty_to_process);
    
    -- 6. 構建成功返回結果
    v_result := jsonb_build_object(
        'success', TRUE,
        'message', 'Pallet ' || p_plt_num || ' processed: ' || v_history_action || 
                   '. Original Qty: ' || p_original_product_qty || 
                   ', Damaged Qty: ' || p_damage_qty_to_process || 
                   CASE WHEN NOT v_is_full_damage THEN 
                        ', Remaining Good Qty for new pallet: ' || v_remaining_good_qty
                        ELSE '. No remaining good quantity.' 
                   END,
        'remainingQty', v_remaining_good_qty, -- 前端需要此值以決定新標籤數量
        'actual_original_location', v_actual_inventory_deduction_loc -- 前端需要此值以決定新標籤入庫位置
    );
    
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '[process_damaged_pallet_void] - Error for pallet % (Product: %, OriginalLoc: %): %', p_plt_num, p_product_code, p_current_true_location, SQLERRM;
        v_result := jsonb_build_object(
            'success', FALSE,
            'error_code', SQLSTATE, -- 使用 SQLSTATE 獲取標準錯誤碼
            'message', 'Processing damaged pallet ' || p_plt_num || ' failed: ' || SQLERRM,
            'remainingQty', -1, -- 表示錯誤或未知
            'actual_original_location', NULL
        );
        RETURN v_result;
END;
$function$;

---
*(未來可以添加更多函數...)* 