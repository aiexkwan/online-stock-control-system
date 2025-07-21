-- 擴展回滾事務函數，加入刪除相關業務記錄的邏輯（修正版）
-- Date: 2025-07-02

-- 增強的智能回滾函數
CREATE OR REPLACE FUNCTION rollback_transaction(
  p_transaction_id UUID,
  p_rollback_by TEXT,
  p_rollback_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_step RECORD;
  v_rollback_results JSONB[] := '{}';
  v_rollback_success BOOLEAN := true;
  v_error_count INTEGER := 0;
  v_pallet_numbers TEXT[];
  v_deleted_count INTEGER;
  v_deleted_temp INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 標記開始回滾
  UPDATE transaction_log
  SET
    rollback_attempted = true,
    rollback_timestamp = NOW(),
    rollback_by = p_rollback_by,
    rollback_reason = p_rollback_reason
  WHERE transaction_id = p_transaction_id;

  -- 獲取所有步驟，按相反順序回滾
  FOR v_step IN
    SELECT * FROM transaction_log
    WHERE transaction_id = p_transaction_id
      AND step_name IS NOT NULL
    ORDER BY step_sequence DESC
  LOOP
    BEGIN
      -- 根據步驟類型執行相應的回滾操作
      CASE v_step.step_name

        -- 1. 回滾 PDF 生成（目前只記錄，實際 PDF 文件可能需要從 storage 刪除）
        WHEN 'pdf_generation' THEN
          -- 記錄 PDF 回滾（實際刪除需要調用 storage API）
          v_rollback_results := array_append(v_rollback_results,
            jsonb_build_object(
              'step', v_step.step_name,
              'success', true,
              'message', 'PDF generation rollback recorded (manual cleanup may be required)'
            )
          );

        -- 2. 回滾數據庫記錄
        WHEN 'database_records' THEN
          -- 獲取棧板號碼列表
          IF v_step.pre_state->'palletNumbers' IS NOT NULL THEN
            v_pallet_numbers := ARRAY(
              SELECT jsonb_array_elements_text(v_step.pre_state->'palletNumbers')
            );

            v_deleted_count := 0;

            -- 刪除 record_inventory 記錄
            DELETE FROM record_inventory
            WHERE plt_num = ANY(v_pallet_numbers);
            GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_deleted_temp;

            -- 刪除 record_history 記錄（只刪除 GRN Receiving 動作）
            DELETE FROM record_history
            WHERE plt_num = ANY(v_pallet_numbers)
              AND action = 'GRN Receiving';
            GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_deleted_temp;

            -- 刪除 record_grn 記錄
            DELETE FROM record_grn
            WHERE plt_num = ANY(v_pallet_numbers);
            GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_deleted_temp;

            -- 刪除 record_palletinfo 記錄
            DELETE FROM record_palletinfo
            WHERE plt_num = ANY(v_pallet_numbers);
            GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
            v_deleted_count := v_deleted_count + v_deleted_temp;

            -- 添加回滾歷史記錄
            INSERT INTO record_history (time, id, action, plt_num, loc, remark)
            SELECT
              NOW(),
              p_rollback_by::INTEGER,
              'GRN Rollback',
              unnest(v_pallet_numbers),
              'System',
              format('Transaction %s rolled back: %s', p_transaction_id, p_rollback_reason)
            ;

            v_rollback_results := array_append(v_rollback_results,
              jsonb_build_object(
                'step', v_step.step_name,
                'success', true,
                'deleted_records', v_deleted_count,
                'affected_pallets', v_pallet_numbers
              )
            );
          END IF;

        -- 3. 回滾棧板號碼分配
        WHEN 'pallet_allocation' THEN
          -- 釋放棧板號碼
          IF v_step.pre_state->'palletNumbers' IS NOT NULL THEN
            v_pallet_numbers := ARRAY(
              SELECT jsonb_array_elements_text(v_step.pre_state->'palletNumbers')
            );

            -- 調用釋放函數
            PERFORM release_pallet_reservation(v_pallet_numbers);

            -- 驗證釋放是否成功
            SELECT COUNT(*) INTO v_updated_count
            FROM pallet_number_buffer
            WHERE pallet_number = ANY(v_pallet_numbers)
              AND status = 'False';

            v_rollback_results := array_append(v_rollback_results,
              jsonb_build_object(
                'step', v_step.step_name,
                'success', v_updated_count = array_length(v_pallet_numbers, 1),
                'released_count', v_updated_count,
                'total_pallets', array_length(v_pallet_numbers, 1)
              )
            );
          END IF;

        -- 4. 處理其他步驟類型
        ELSE
          -- 通用回滾邏輯（可根據需要擴展）
          v_rollback_results := array_append(v_rollback_results,
            jsonb_build_object(
              'step', v_step.step_name,
              'success', true,
              'message', 'No specific rollback action required'
            )
          );
      END CASE;

    EXCEPTION WHEN OTHERS THEN
      v_rollback_success := false;
      v_error_count := v_error_count + 1;
      v_rollback_results := array_append(v_rollback_results,
        jsonb_build_object(
          'step', v_step.step_name,
          'success', false,
          'error', SQLERRM,
          'error_detail', SQLSTATE
        )
      );
    END;
  END LOOP;

  -- 更新回滾結果
  UPDATE transaction_log
  SET
    rollback_successful = v_rollback_success,
    status = CASE WHEN v_rollback_success THEN 'rolled_back' ELSE 'rollback_failed' END,
    compensation_actions = to_jsonb(v_rollback_results)
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL;

  RETURN jsonb_build_object(
    'success', v_rollback_success,
    'rolled_back_steps', array_length(v_rollback_results, 1),
    'error_count', v_error_count,
    'details', v_rollback_results,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建專門的 GRN 記錄清理函數
CREATE OR REPLACE FUNCTION cleanup_grn_records(
  p_pallet_numbers TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_deleted_palletinfo INTEGER := 0;
  v_deleted_grn INTEGER := 0;
  v_deleted_inventory INTEGER := 0;
  v_deleted_history INTEGER := 0;
BEGIN
  -- 開始事務
  BEGIN
    -- 1. 刪除庫存記錄
    DELETE FROM record_inventory
    WHERE plt_num = ANY(p_pallet_numbers);
    GET DIAGNOSTICS v_deleted_inventory = ROW_COUNT;

    -- 2. 刪除歷史記錄（只刪除 GRN 相關）
    DELETE FROM record_history
    WHERE plt_num = ANY(p_pallet_numbers)
      AND action IN ('GRN Receiving', 'GRN Label Printed');
    GET DIAGNOSTICS v_deleted_history = ROW_COUNT;

    -- 3. 刪除 GRN 記錄
    DELETE FROM record_grn
    WHERE plt_num = ANY(p_pallet_numbers);
    GET DIAGNOSTICS v_deleted_grn = ROW_COUNT;

    -- 4. 刪除棧板信息
    DELETE FROM record_palletinfo
    WHERE plt_num = ANY(p_pallet_numbers);
    GET DIAGNOSTICS v_deleted_palletinfo = ROW_COUNT;

    -- 5. 釋放棧板號碼
    PERFORM release_pallet_reservation(p_pallet_numbers);

    v_result := jsonb_build_object(
      'success', true,
      'deleted', jsonb_build_object(
        'palletinfo', v_deleted_palletinfo,
        'grn', v_deleted_grn,
        'inventory', v_deleted_inventory,
        'history', v_deleted_history
      ),
      'pallet_numbers', p_pallet_numbers,
      'total_deleted', v_deleted_palletinfo + v_deleted_grn + v_deleted_inventory + v_deleted_history
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- 如果出錯，返回錯誤信息
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建回滾狀態查詢函數
CREATE OR REPLACE FUNCTION get_rollback_status(
  p_transaction_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_main_record RECORD;
  v_steps JSONB[];
BEGIN
  -- 獲取主事務記錄
  SELECT
    transaction_id,
    source_module,
    source_action,
    status,
    rollback_attempted,
    rollback_successful,
    rollback_timestamp,
    rollback_by,
    rollback_reason,
    compensation_actions,
    created_at
  INTO v_main_record
  FROM transaction_log
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  -- 獲取所有步驟
  SELECT array_agg(
    jsonb_build_object(
      'step_name', step_name,
      'step_sequence', step_sequence,
      'status', status,
      'created_at', created_at
    ) ORDER BY step_sequence
  ) INTO v_steps
  FROM transaction_log
  WHERE transaction_id = p_transaction_id
    AND step_name IS NOT NULL;

  -- 構建結果
  v_result := jsonb_build_object(
    'success', true,
    'transaction', jsonb_build_object(
      'id', v_main_record.transaction_id,
      'module', v_main_record.source_module,
      'action', v_main_record.source_action,
      'status', v_main_record.status,
      'created_at', v_main_record.created_at
    ),
    'rollback', jsonb_build_object(
      'attempted', v_main_record.rollback_attempted,
      'successful', v_main_record.rollback_successful,
      'timestamp', v_main_record.rollback_timestamp,
      'by', v_main_record.rollback_by,
      'reason', v_main_record.rollback_reason,
      'actions', v_main_record.compensation_actions
    ),
    'steps', v_steps
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION rollback_transaction(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_grn_records(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rollback_status(UUID) TO authenticated;

-- 註釋
COMMENT ON FUNCTION rollback_transaction IS '增強版智能回滾事務函數，包含完整的業務數據刪除邏輯';
COMMENT ON FUNCTION cleanup_grn_records IS '清理 GRN 相關記錄的專用函數';
COMMENT ON FUNCTION get_rollback_status IS '查詢事務回滾狀態的輔助函數';
