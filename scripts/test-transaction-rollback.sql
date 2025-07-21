-- 測試事務回滾機制
-- Date: 2025-07-02

-- 1. 創建測試數據
DO $$
DECLARE
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- 生成測試事務 ID
  v_transaction_id := gen_random_uuid();

  -- 測試 1: 開始事務
  RAISE NOTICE '測試 1: 開始事務';
  PERFORM start_transaction(
    v_transaction_id,
    'grn_label',
    '/print-grnlabel',
    'test_rollback',
    'print_label',
    '12345',
    '12345',
    'test-session-001',
    jsonb_build_object(
      'grnNumber', 'GRN2025010001',
      'materialCode', 'TEST001',
      'palletCount', 3
    ),
    jsonb_build_object('test', true)
  );

  -- 測試 2: 記錄步驟
  RAISE NOTICE '測試 2: 記錄步驟';

  -- 步驟 1: 棧板分配
  PERFORM record_transaction_step(
    v_transaction_id,
    'pallet_allocation',
    1,
    jsonb_build_object(
      'palletNumbers', ARRAY['020125/1', '020125/2', '020125/3'],
      'series', ARRAY['020125-ABC123', '020125-DEF456', '020125-GHI789']
    )
  );

  -- 步驟 2: 數據庫記錄
  PERFORM record_transaction_step(
    v_transaction_id,
    'database_records',
    2,
    jsonb_build_object(
      'recordIds', ARRAY[1001, 1002, 1003],
      'tables', ARRAY['record_palletinfo', 'record_grn', 'record_inventory']
    )
  );

  -- 步驟 3: PDF 生成
  PERFORM record_transaction_step(
    v_transaction_id,
    'pdf_generation',
    3,
    jsonb_build_object(
      'pdfCount', 3,
      'pdfUrls', ARRAY['pdf1.pdf', 'pdf2.pdf', 'pdf3.pdf']
    )
  );

  -- 測試 3: 模擬錯誤
  RAISE NOTICE '測試 3: 記錄錯誤';
  PERFORM record_transaction_error(
    v_transaction_id,
    'TEST_ERROR',
    'Simulated error for testing rollback',
    jsonb_build_object('testError', true),
    'Error stack trace here...'
  );

  -- 測試 4: 執行回滾
  RAISE NOTICE '測試 4: 執行回滾';
  SELECT rollback_transaction(
    v_transaction_id,
    '12345',
    'Testing rollback mechanism'
  ) INTO v_result;

  RAISE NOTICE '回滾結果: %', v_result;

  -- 測試 5: 查詢事務狀態
  RAISE NOTICE '測試 5: 查詢事務狀態';
  PERFORM (
    SELECT status
    FROM transaction_log
    WHERE transaction_id = v_transaction_id
      AND step_name IS NULL
  );

  RAISE NOTICE '測試完成！';

  -- 清理測試數據
  DELETE FROM transaction_log WHERE transaction_id = v_transaction_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '測試過程中發生錯誤: %', SQLERRM;
END;
$$;

-- 查詢最近的事務記錄
SELECT
  transaction_id,
  source_module,
  source_action,
  status,
  step_name,
  step_sequence,
  created_at,
  rollback_attempted,
  rollback_successful
FROM transaction_log
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- 查詢錯誤記錄
SELECT
  t.transaction_id,
  t.source_module,
  t.error_message,
  r.error as report_error,
  r.time as report_time
FROM v_transaction_report t
LEFT JOIN report_log r ON t.report_log_uuid = r.uuid
WHERE t.status = 'failed'
  AND t.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY t.created_at DESC;
