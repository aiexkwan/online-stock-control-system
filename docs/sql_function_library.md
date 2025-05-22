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

---
*(未來可以添加更多函數...)* 