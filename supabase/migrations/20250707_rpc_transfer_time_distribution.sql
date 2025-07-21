-- =============================================
-- RPC Function: Get Transfer Time Distribution
-- 將時間範圍分成指定數量的時段，計算每個時段的 transfer 數量
-- 用於 TransferTimeDistributionWidget 顯示時間分布圖表
-- =============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS rpc_get_transfer_time_distribution CASCADE;

-- Create the transfer time distribution function
CREATE OR REPLACE FUNCTION rpc_get_transfer_time_distribution(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_time_slots INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_distribution JSONB[] := ARRAY[]::JSONB[];
  v_slot_duration INTERVAL;
  v_current_start TIMESTAMPTZ;
  v_current_end TIMESTAMPTZ;
  v_slot_count INTEGER;
  v_total_transfers INTEGER := 0;
  v_peak_hour TEXT;
  v_peak_count INTEGER := 0;
  v_avg_per_slot NUMERIC;
  v_calculation_start TIMESTAMP;
  v_calculation_time TEXT;
  i INTEGER;
BEGIN
  -- 記錄計算開始時間
  v_calculation_start := clock_timestamp();

  -- 參數驗證
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Start date and end date are required',
      'distribution', ARRAY[]::JSONB[],
      'total_transfers', 0
    );
  END IF;

  IF p_end_date <= p_start_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'End date must be after start date',
      'distribution', ARRAY[]::JSONB[],
      'total_transfers', 0
    );
  END IF;

  -- 設定時段數量（最少 1，最多 24）
  p_time_slots := GREATEST(1, LEAST(COALESCE(p_time_slots, 12), 24));

  -- 計算每個時段的時長
  v_slot_duration := (p_end_date - p_start_date) / p_time_slots;

  -- 循環處理每個時段
  FOR i IN 0..(p_time_slots - 1) LOOP
    v_current_start := p_start_date + (v_slot_duration * i);
    v_current_end := p_start_date + (v_slot_duration * (i + 1));

    -- 計算這個時段的 transfer 數量
    SELECT COUNT(*) INTO v_slot_count
    FROM record_transfer
    WHERE tran_date >= v_current_start
      AND tran_date < v_current_end;

    -- 累計總數
    v_total_transfers := v_total_transfers + v_slot_count;

    -- 記錄高峰時段
    IF v_slot_count > v_peak_count THEN
      v_peak_count := v_slot_count;
      -- 根據時段長度決定顯示格式
      IF v_slot_duration < INTERVAL '1 hour' THEN
        v_peak_hour := to_char(v_current_start, 'HH24:MI') || '-' || to_char(v_current_end, 'HH24:MI');
      ELSIF v_slot_duration < INTERVAL '1 day' THEN
        v_peak_hour := to_char(v_current_start, 'Mon DD HH24:00');
      ELSE
        v_peak_hour := to_char(v_current_start, 'Mon DD');
      END IF;
    END IF;

    -- 構建時段資料
    v_distribution := array_append(v_distribution,
      jsonb_build_object(
        'time', CASE
          WHEN v_slot_duration < INTERVAL '1 hour' THEN
            to_char(v_current_start, 'HH24:MI')
          WHEN v_slot_duration < INTERVAL '1 day' THEN
            to_char(v_current_start, 'HH24:00')
          WHEN v_slot_duration < INTERVAL '7 days' THEN
            to_char(v_current_start, 'Mon DD')
          ELSE
            to_char(v_current_start, 'MM/DD')
        END,
        'value', v_slot_count,
        'fullTime', to_char(v_current_start, 'YYYY-MM-DD HH24:MI') || ' - ' || to_char(v_current_end, 'HH24:MI'),
        'startTime', v_current_start,
        'endTime', v_current_end
      )
    );
  END LOOP;

  -- 計算平均每時段數量
  v_avg_per_slot := CASE
    WHEN p_time_slots > 0 THEN ROUND(v_total_transfers::NUMERIC / p_time_slots, 2)
    ELSE 0
  END;

  -- 計算執行時間
  v_calculation_time := ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_calculation_start)) * 1000, 2)::TEXT || 'ms';

  -- 構建最終結果
  v_result := jsonb_build_object(
    'success', true,
    'distribution', v_distribution,
    'total_transfers', v_total_transfers,
    'time_slots', p_time_slots,
    'calculation_time', v_calculation_time,
    'peak_hour', v_peak_hour,
    'peak_count', v_peak_count,
    'avg_per_slot', v_avg_per_slot,
    'date_range', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date,
      'duration', age(p_end_date, p_start_date)::TEXT
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- 錯誤處理
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'distribution', ARRAY[]::JSONB[],
    'total_transfers', 0,
    'calculation_time', ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_calculation_start)) * 1000, 2)::TEXT || 'ms'
  );
END;
$$;

-- 設置函數權限
GRANT EXECUTE ON FUNCTION rpc_get_transfer_time_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_transfer_time_distribution TO service_role;

-- 為函數添加註解
COMMENT ON FUNCTION rpc_get_transfer_time_distribution IS
'Calculate transfer time distribution for a given date range, dividing the period into specified time slots (default 12) and counting transfers in each slot. Returns distribution array with time labels and counts, plus metadata including peak hour and average per slot.';

-- =============================================
-- 創建優化索引以提升查詢性能
-- =============================================

-- 如果索引不存在，創建複合索引
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'record_transfer'
    AND indexname = 'idx_record_transfer_tran_date_optimized'
  ) THEN
    CREATE INDEX idx_record_transfer_tran_date_optimized
    ON record_transfer(tran_date)
    WHERE tran_date IS NOT NULL;

    COMMENT ON INDEX idx_record_transfer_tran_date_optimized IS
    'Optimized index for transfer time distribution queries';
  END IF;
END $$;

-- =============================================
-- 測試查詢範例
-- =============================================

/*
-- 查詢昨天的 transfer 時間分布（12個時段）
SELECT rpc_get_transfer_time_distribution(
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE,
  12
);

-- 查詢過去7天的 transfer 時間分布（24個時段）
SELECT rpc_get_transfer_time_distribution(
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  24
);

-- 查詢特定日期範圍
SELECT rpc_get_transfer_time_distribution(
  '2025-01-01 00:00:00+00'::TIMESTAMPTZ,
  '2025-01-07 23:59:59+00'::TIMESTAMPTZ,
  12
);
*/
