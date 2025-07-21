-- 事務管理 RPC 函數
-- 提供統一的事務記錄和回滾功能
-- Date: 2025-07-02

-- 1. 開始新事務
CREATE OR REPLACE FUNCTION start_transaction(
  p_transaction_id UUID,
  p_source_module TEXT,
  p_source_page TEXT,
  p_source_action TEXT,
  p_operation_type TEXT,
  p_user_id TEXT,
  p_user_clock_number TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_pre_state JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id INTEGER;
BEGIN
  INSERT INTO transaction_log (
    transaction_id,
    source_module,
    source_page,
    source_action,
    operation_type,
    user_id,
    user_clock_number,
    session_id,
    pre_state,
    metadata,
    status
  ) VALUES (
    p_transaction_id,
    p_source_module,
    p_source_page,
    p_source_action,
    p_operation_type,
    p_user_id,
    p_user_clock_number,
    p_session_id,
    p_pre_state,
    p_metadata,
    'in_progress'
  ) RETURNING id INTO v_log_id;

  RETURN p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 記錄事務步驟
CREATE OR REPLACE FUNCTION record_transaction_step(
  p_transaction_id UUID,
  p_step_name TEXT,
  p_step_sequence INTEGER,
  p_step_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO transaction_log (
    transaction_id,
    step_name,
    step_sequence,
    pre_state,
    status,
    source_module,
    source_page,
    source_action,
    operation_type,
    user_id
  )
  SELECT
    p_transaction_id,
    p_step_name,
    p_step_sequence,
    p_step_data,
    'completed',
    source_module,
    source_page,
    source_action,
    operation_type,
    user_id
  FROM transaction_log
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 完成事務
CREATE OR REPLACE FUNCTION complete_transaction(
  p_transaction_id UUID,
  p_post_state JSONB DEFAULT NULL,
  p_affected_records JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE transaction_log
  SET
    status = 'completed',
    completed_at = NOW(),
    post_state = p_post_state,
    affected_records = p_affected_records
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 記錄事務錯誤
CREATE OR REPLACE FUNCTION record_transaction_error(
  p_transaction_id UUID,
  p_error_code TEXT,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL,
  p_error_stack TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id TEXT;
  v_report_log_id UUID;
  v_source_info JSONB;
BEGIN
  -- 獲取用戶信息和來源信息
  SELECT user_id,
         jsonb_build_object(
           'source_module', source_module,
           'source_action', source_action,
           'metadata', metadata
         ) INTO v_user_id, v_source_info
  FROM transaction_log
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL
  LIMIT 1;

  -- 寫入 report_log 表（長期保存）
  INSERT INTO report_log (
    error,
    error_info,
    state,
    user_id
  ) VALUES (
    v_source_info->>'source_module' || ': ' || p_error_message,
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'source_info', v_source_info,
      'error_code', p_error_code,
      'error_stack', p_error_stack,
      'error_details', p_error_details,
      'timestamp', NOW()
    )::text,
    false,
    v_user_id::INTEGER
  ) RETURNING uuid INTO v_report_log_id;

  -- 更新 transaction_log
  UPDATE transaction_log
  SET
    status = 'failed',
    error_code = p_error_code,
    error_message = p_error_message,
    error_details = p_error_details,
    error_stack = p_error_stack,
    report_log_id = v_report_log_id
  WHERE transaction_id = p_transaction_id;

  RETURN v_report_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 智能回滾函數
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
        WHEN 'pallet_allocation' THEN
          -- 釋放棧板號碼
          IF v_step.pre_state->>'palletNumbers' IS NOT NULL THEN
            PERFORM release_pallet_reservation(
              ARRAY(SELECT jsonb_array_elements_text(v_step.pre_state->'palletNumbers'))
            );
          END IF;

        WHEN 'database_records' THEN
          -- 刪除創建的記錄
          IF v_step.pre_state->>'recordIds' IS NOT NULL THEN
            -- 這裡需要根據具體表結構實現刪除邏輯
            NULL; -- placeholder
          END IF;

        ELSE
          -- 其他步驟的通用回滾邏輯
          NULL;
      END CASE;

      v_rollback_results := array_append(v_rollback_results,
        jsonb_build_object(
          'step', v_step.step_name,
          'success', true
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_rollback_success := false;
      v_error_count := v_error_count + 1;
      v_rollback_results := array_append(v_rollback_results,
        jsonb_build_object(
          'step', v_step.step_name,
          'success', false,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;

  -- 更新回滾結果
  UPDATE transaction_log
  SET
    rollback_successful = v_rollback_success,
    status = CASE WHEN v_rollback_success THEN 'rolled_back' ELSE 'rollback_failed' END
  WHERE transaction_id = p_transaction_id
    AND step_name IS NULL;

  RETURN jsonb_build_object(
    'success', v_rollback_success,
    'rolled_back_steps', array_length(v_rollback_results, 1),
    'error_count', v_error_count,
    'details', v_rollback_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 改進的 GRN 處理函數（整合事務管理）
CREATE OR REPLACE FUNCTION process_grn_label_with_transaction(
  -- 原有參數
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
RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
  v_result JSONB;
  v_error_log_id UUID;
BEGIN
  -- 生成事務 ID
  v_transaction_id := gen_random_uuid();

  -- 開始事務記錄
  PERFORM start_transaction(
    v_transaction_id,
    'grn_label',
    '/print-grnlabel',
    'bulk_process',
    'print_label',
    p_clock_number,
    p_clock_number,
    p_session_id,
    jsonb_build_object(
      'grn_number', p_grn_number,
      'material_code', p_material_code,
      'label_mode', p_label_mode,
      'count', p_count
    )
  );

  BEGIN
    -- 調用原有的處理邏輯
    SELECT process_grn_label_unified(
      p_count, p_grn_number, p_material_code, p_supplier_code,
      p_clock_number, p_label_mode, p_session_id, p_gross_weights,
      p_net_weights, p_quantities, p_pallet_count, p_package_count,
      p_pallet_type, p_package_type, p_pdf_urls
    ) INTO v_result;

    -- 如果成功，完成事務
    IF v_result->>'success' = 'true' THEN
      PERFORM complete_transaction(
        v_transaction_id,
        v_result->'data',
        v_result->'data'->'pallet_numbers'
      );
    ELSE
      -- 如果失敗，記錄錯誤
      v_error_log_id := record_transaction_error(
        v_transaction_id,
        'GRN_PROCESSING_ERROR',
        v_result->>'message',
        v_result
      );

      -- 執行回滾
      PERFORM rollback_transaction(
        v_transaction_id,
        p_clock_number,
        'Processing failed'
      );
    END IF;

    -- 添加事務 ID 到結果
    v_result := jsonb_set(v_result, '{transaction_id}', to_jsonb(v_transaction_id));

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- 記錄異常錯誤
    v_error_log_id := record_transaction_error(
      v_transaction_id,
      SQLSTATE,
      SQLERRM,
      jsonb_build_object('error_detail', SQLSTATE)
    );

    -- 嘗試回滾
    PERFORM rollback_transaction(
      v_transaction_id,
      p_clock_number,
      'Exception occurred: ' || SQLERRM
    );

    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'transaction_id', v_transaction_id,
      'error_log_id', v_error_log_id
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION start_transaction(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION record_transaction_step(UUID, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_transaction(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION record_transaction_error(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_transaction(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_grn_label_with_transaction(INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC[], NUMERIC[], INTEGER[], INTEGER, INTEGER, TEXT, TEXT, TEXT[]) TO authenticated;

-- 註釋
COMMENT ON FUNCTION start_transaction IS '開始新的事務記錄';
COMMENT ON FUNCTION record_transaction_step IS '記錄事務執行步驟';
COMMENT ON FUNCTION complete_transaction IS '標記事務成功完成';
COMMENT ON FUNCTION record_transaction_error IS '記錄事務錯誤並寫入report_log';
COMMENT ON FUNCTION rollback_transaction IS '智能回滾事務，按步驟反向執行';
COMMENT ON FUNCTION process_grn_label_with_transaction IS '帶事務管理的GRN標籤處理函數';
