-- =============================================
-- Stock Transfer RPC Function
-- 將 5 個獨立操作合併成一個原子性事務
-- =============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS execute_stock_transfer CASCADE;

-- Create the atomic stock transfer function
CREATE OR REPLACE FUNCTION execute_stock_transfer(
  p_plt_num TEXT,
  p_product_code TEXT,
  p_product_qty INTEGER,
  p_from_location TEXT,
  p_to_location TEXT,
  p_operator_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_from_column TEXT;
  v_to_column TEXT;
  v_normalized_from_loc TEXT;
  v_operator_exists BOOLEAN;
  v_error_msg TEXT;
BEGIN
  -- 初始化結果
  v_result := jsonb_build_object(
    'success', false,
    'message', '',
    'data', NULL
  );

  -- =============================================
  -- 1. 驗證 Operator ID
  -- =============================================
  SELECT EXISTS(
    SELECT 1 FROM data_id WHERE id = p_operator_id
  ) INTO v_operator_exists;

  IF NOT v_operator_exists THEN
    v_result := jsonb_build_object(
      'success', false,
      'message', format('Operator ID %s not found in system', p_operator_id),
      'error_code', 'INVALID_OPERATOR'
    );
    RETURN v_result;
  END IF;

  -- =============================================
  -- 2. 驗證位置映射
  -- =============================================
  -- 獲取位置對應的欄位名稱（根據實際數據庫欄位）
  v_from_column := CASE p_from_location
    WHEN 'Await' THEN 'await'
    WHEN 'Await_grn' THEN 'await_grn'
    WHEN 'Fold Mill' THEN 'fold'
    WHEN 'PipeLine' THEN 'pipeline'
    WHEN 'Production' THEN 'injection'
    WHEN 'Damage' THEN 'damage'
    WHEN 'Bulk' THEN 'bulk'
    WHEN 'Prebook' THEN 'prebook'
    WHEN 'Backcarpark' THEN 'backcarpark'
    ELSE NULL
  END;

  v_to_column := CASE p_to_location
    WHEN 'Await' THEN 'await'
    WHEN 'Await_grn' THEN 'await_grn'
    WHEN 'Fold Mill' THEN 'fold'
    WHEN 'PipeLine' THEN 'pipeline'
    WHEN 'Production' THEN 'injection'
    WHEN 'Damage' THEN 'damage'
    WHEN 'Bulk' THEN 'bulk'
    WHEN 'Prebook' THEN 'prebook'
    WHEN 'Backcarpark' THEN 'backcarpark'
    ELSE NULL
  END;

  IF v_from_column IS NULL OR v_to_column IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'message', format('Invalid location mapping: %s → %s', p_from_location, p_to_location),
      'error_code', 'INVALID_LOCATION'
    );
    RETURN v_result;
  END IF;

  -- =============================================
  -- 3. 開始事務處理
  -- =============================================
  BEGIN
    -- 3.1 插入歷史記錄
    INSERT INTO record_history (
      id,
      action,
      plt_num,
      loc,
      remark,
      time
    ) VALUES (
      p_operator_id,
      'Stock Transfer',
      p_plt_num,
      p_to_location,
      format('Moved from %s to %s', p_from_location, p_to_location),
      CURRENT_TIMESTAMP
    );

    -- 3.2 插入轉移記錄
    -- 統一處理 Await_grn 為 Await（業務邏輯要求）
    v_normalized_from_loc := CASE
      WHEN p_from_location = 'Await_grn' THEN 'Await'
      ELSE p_from_location
    END;

    INSERT INTO record_transfer (
      plt_num,
      operator_id,
      tran_date,
      f_loc,
      t_loc
    ) VALUES (
      p_plt_num,
      p_operator_id,
      CURRENT_TIMESTAMP,
      v_normalized_from_loc,
      p_to_location
    );

    -- 3.3 更新庫存記錄
    -- 使用動態 SQL 處理欄位名稱
    EXECUTE format(
      'INSERT INTO record_inventory (product_code, plt_num, %I, %I, latest_update)
       VALUES ($1, $2, $3, $4, $5)',
      v_from_column, v_to_column
    ) USING p_product_code, p_plt_num, -p_product_qty, p_product_qty, CURRENT_TIMESTAMP;

    -- 3.4 更新員工工作量
    -- 使用現有的 update_work_level_move function
    PERFORM update_work_level_move(p_operator_id, 1);

    -- 3.5 記錄到 report_log (成功)
    INSERT INTO report_log (
      error,
      error_info,
      state,
      user_id,
      time
    ) VALUES (
      'STOCK_TRANSFER_SUCCESS',
      format('Successfully moved pallet %s from %s to %s', p_plt_num, p_from_location, p_to_location),
      true,
      p_operator_id,
      CURRENT_TIMESTAMP
    );

    -- 成功返回
    v_result := jsonb_build_object(
      'success', true,
      'message', format('Pallet %s successfully moved from %s to %s',
                       p_plt_num, p_from_location, p_to_location),
      'data', jsonb_build_object(
        'plt_num', p_plt_num,
        'from_location', p_from_location,
        'to_location', p_to_location,
        'operator_id', p_operator_id,
        'timestamp', CURRENT_TIMESTAMP
      )
    );

  EXCEPTION WHEN OTHERS THEN
    -- 捕獲任何錯誤並回滾
    v_error_msg := SQLERRM;

    -- 記錄到 report_log (失敗)
    BEGIN
      INSERT INTO report_log (
        error,
        error_info,
        state,
        user_id,
        time
      ) VALUES (
        'STOCK_TRANSFER_ERROR',
        format('Failed to move pallet %s: %s', p_plt_num, v_error_msg),
        false,
        p_operator_id,
        CURRENT_TIMESTAMP
      );
    EXCEPTION WHEN OTHERS THEN
      -- 如果連記錄日誌都失敗，繼續處理
      NULL;
    END;

    v_result := jsonb_build_object(
      'success', false,
      'message', format('Stock transfer failed: %s', v_error_msg),
      'error_code', 'TRANSFER_ERROR',
      'error_detail', v_error_msg
    );
  END;

  RETURN v_result;
END;
$$;

-- 設置函數權限
GRANT EXECUTE ON FUNCTION execute_stock_transfer TO authenticated;

-- 為函數添加註解
COMMENT ON FUNCTION execute_stock_transfer IS
'Atomic stock transfer function that handles all aspects of moving a pallet between locations';

-- =============================================
-- 創建搜尋托盤的 RPC function（優化版）
-- =============================================
CREATE OR REPLACE FUNCTION search_pallet_info(
  p_search_type TEXT,  -- 'pallet_num' 或 'series'
  p_search_value TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_pallet_info RECORD;
  v_current_location TEXT;
BEGIN
  -- 初始化結果
  v_result := jsonb_build_object(
    'success', false,
    'data', NULL
  );

  -- 根據搜尋類型查詢托盤資訊
  IF p_search_type = 'series' THEN
    SELECT * INTO v_pallet_info
    FROM record_palletinfo
    WHERE series = p_search_value
    LIMIT 1;
  ELSE
    SELECT * INTO v_pallet_info
    FROM record_palletinfo
    WHERE plt_num = p_search_value
    LIMIT 1;
  END IF;

  -- 如果找不到托盤
  IF NOT FOUND THEN
    v_result := jsonb_build_object(
      'success', false,
      'message', format('%s %s not found',
        CASE p_search_type
          WHEN 'series' THEN 'Series'
          ELSE 'Pallet'
        END,
        p_search_value
      ),
      'data', NULL
    );
    RETURN v_result;
  END IF;

  -- 獲取托盤最新位置
  SELECT loc INTO v_current_location
  FROM record_history
  WHERE plt_num = v_pallet_info.plt_num
  ORDER BY time DESC
  LIMIT 1;

  -- 如果沒有歷史記錄，預設為 'Await'
  v_current_location := COALESCE(v_current_location, 'Await');

  -- 返回成功結果
  v_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'plt_num', v_pallet_info.plt_num,
      'product_code', v_pallet_info.product_code,
      'product_qty', v_pallet_info.product_qty,
      'plt_remark', v_pallet_info.plt_remark,
      'series', v_pallet_info.series,
      'current_plt_loc', v_current_location
    )
  );

  RETURN v_result;
END;
$$;

-- 設置權限
GRANT EXECUTE ON FUNCTION search_pallet_info TO authenticated;

-- 添加註解
COMMENT ON FUNCTION search_pallet_info IS
'Search for pallet information by pallet number or series with current location';
