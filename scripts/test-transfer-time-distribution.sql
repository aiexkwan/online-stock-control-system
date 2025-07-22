-- =============================================
-- Test Script for rpc_get_transfer_time_distribution
-- 測試不同時間範圍和時段設定的查詢結果
-- =============================================

-- Test 1: 查詢昨天的 transfer 時間分布（12個時段）
-- 預期：返回12個時段，每個時段2小時
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE,
    12
  )
) AS yesterday_distribution;

-- Test 2: 查詢過去7天的 transfer 時間分布（24個時段）
-- 預期：返回24個時段，每個時段7小時
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    24
  )
) AS week_distribution;

-- Test 3: 查詢過去30天的 transfer 時間分布（12個時段）
-- 預期：返回12個時段，每個時段2.5天
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    12
  )
) AS month_distribution;

-- Test 4: 查詢今天的 transfer 時間分布（24個時段）
-- 預期：返回24個時段，每個時段1小時
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE,
    CURRENT_TIMESTAMP,
    24
  )
) AS today_hourly_distribution;

-- Test 5: 測試錯誤處理 - 無效日期範圍
-- 預期：返回錯誤訊息
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE,
    CURRENT_DATE - INTERVAL '1 day',
    12
  )
) AS invalid_date_range;

-- Test 6: 測試錯誤處理 - NULL 參數
-- 預期：返回錯誤訊息
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    NULL,
    CURRENT_DATE,
    12
  )
) AS null_start_date;

-- Test 7: 測試邊界值 - 最少時段
-- 預期：返回1個時段，包含所有數據
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE,
    1
  )
) AS single_slot;

-- Test 8: 測試邊界值 - 最多時段
-- 預期：返回24個時段（系統限制）
SELECT jsonb_pretty(
  rpc_get_transfer_time_distribution(
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE,
    100  -- 會被限制為24
  )
) AS max_slots;

-- Test 9: 檢查實際數據分布
-- 顯示最近7天每天的 transfer 數量，用於驗證函數結果
WITH daily_transfers AS (
  SELECT
    DATE(tran_date) as transfer_date,
    COUNT(*) as transfer_count
  FROM record_transfer
  WHERE tran_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(tran_date)
  ORDER BY transfer_date DESC
)
SELECT
  transfer_date,
  transfer_count,
  to_char(transfer_date, 'Day') as day_name
FROM daily_transfers;

-- Test 10: 性能測試 - 計算大範圍數據的執行時間
EXPLAIN ANALYZE
SELECT rpc_get_transfer_time_distribution(
  CURRENT_DATE - INTERVAL '365 days',
  CURRENT_DATE,
  12
);

-- Test 11: 驗證索引使用情況
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*)
FROM record_transfer
WHERE tran_date >= CURRENT_DATE - INTERVAL '7 days'
  AND tran_date < CURRENT_DATE;
