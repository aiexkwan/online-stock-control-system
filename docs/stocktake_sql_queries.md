# Stock Take SQL Queries

This document contains all SQL queries required for the stock take enhancement features.

## 🗃️ Complete SQL Script for Stock Take Enhancement

 1. 刪除現有的 Views 和 Materialized View

  -- Drop existing views and materialized view
  DROP MATERIALIZED VIEW IF EXISTS mv_stocktake_variance_report
  CASCADE;
  DROP VIEW IF EXISTS v_stocktake_batch CASCADE;
  DROP VIEW IF EXISTS v_stocktake_daily_summary CASCADE;
  DROP FUNCTION IF EXISTS refresh_stocktake_reports() CASCADE;

  2. 創建新的 Tables

  -- 1. Daily Summary Table (替代 v_stocktake_daily_summary)
  CREATE TABLE IF NOT EXISTS stocktake_daily_summary (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      count_date DATE NOT NULL,
      product_code TEXT NOT NULL,
      product_desc TEXT,
      pallet_count INTEGER,
      total_counted BIGINT,
      final_remain_qty BIGINT,
      last_count_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(count_date, product_code)
  );

  -- 2. Batch Summary Table (替代 v_stocktake_batch)
  CREATE TABLE IF NOT EXISTS stocktake_batch_summary (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_time TIMESTAMPTZ NOT NULL,
      counted_id INTEGER,
      counted_name TEXT,
      scan_count INTEGER,
      product_count INTEGER,
      total_counted BIGINT,
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(batch_time, counted_id)
  );

  -- 3. Variance Report Table (替代 mv_stocktake_variance_report)
  CREATE TABLE IF NOT EXISTS stocktake_variance_report (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_code TEXT NOT NULL,
      product_desc TEXT,
      count_date DATE NOT NULL,
      system_stock BIGINT,
      counted_stock BIGINT,
      variance BIGINT,
      variance_percentage DECIMAL(10,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_code, count_date)
  );

  -- Create indexes
  CREATE INDEX idx_daily_summary_date ON
  stocktake_daily_summary(count_date);
  CREATE INDEX idx_daily_summary_product ON
  stocktake_daily_summary(product_code);
  CREATE INDEX idx_batch_summary_time ON
  stocktake_batch_summary(batch_time);
  CREATE INDEX idx_batch_summary_user ON
  stocktake_batch_summary(counted_id);
  CREATE INDEX idx_variance_report_date ON
  stocktake_variance_report(count_date);
  CREATE INDEX idx_variance_report_product ON
  stocktake_variance_report(product_code);

  3. 創建更新函數

  -- Function to update daily summary
  CREATE OR REPLACE FUNCTION update_stocktake_daily_summary()
  RETURNS void AS $$
  BEGIN
      -- Delete existing data for today
      DELETE FROM stocktake_daily_summary
      WHERE count_date = CURRENT_DATE;

      -- Insert new summary data
      INSERT INTO stocktake_daily_summary (
          count_date, product_code, product_desc,
          pallet_count, total_counted, final_remain_qty,
  last_count_time
      )
      SELECT
          DATE(created_at) as count_date,
          product_code,
          product_desc,
          COUNT(DISTINCT plt_num) as pallet_count,
          SUM(counted_qty) as total_counted,
          MIN(remain_qty) as final_remain_qty,
          MAX(created_at) as last_count_time
      FROM record_stocktake
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY DATE(created_at), product_code, product_desc
      ON CONFLICT (count_date, product_code)
      DO UPDATE SET
          product_desc = EXCLUDED.product_desc,
          pallet_count = EXCLUDED.pallet_count,
          total_counted = EXCLUDED.total_counted,
          final_remain_qty = EXCLUDED.final_remain_qty,
          last_count_time = EXCLUDED.last_count_time,
          updated_at = NOW();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function to update batch summary
  CREATE OR REPLACE FUNCTION update_stocktake_batch_summary()
  RETURNS void AS $$
  BEGIN
      -- Delete existing data for last hour
      DELETE FROM stocktake_batch_summary
      WHERE batch_time >= DATE_TRUNC('hour', NOW() - INTERVAL '1 
  hour');

      -- Insert new batch data
      INSERT INTO stocktake_batch_summary (
          batch_time, counted_id, counted_name,
          scan_count, product_count, total_counted,
          start_time, end_time
      )
      SELECT
          DATE_TRUNC('minute', created_at) as batch_time,
          counted_id,
          counted_name,
          COUNT(*) as scan_count,
          COUNT(DISTINCT product_code) as product_count,
          SUM(counted_qty) as total_counted,
          MIN(created_at) as start_time,
          MAX(created_at) as end_time
      FROM record_stocktake
      WHERE plt_num IS NOT NULL
      AND created_at >= DATE_TRUNC('hour', NOW() - INTERVAL '1 
  hour')
      GROUP BY DATE_TRUNC('minute', created_at), counted_id,
  counted_name
      ON CONFLICT (batch_time, counted_id)
      DO UPDATE SET
          counted_name = EXCLUDED.counted_name,
          scan_count = EXCLUDED.scan_count,
          product_count = EXCLUDED.product_count,
          total_counted = EXCLUDED.total_counted,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          updated_at = NOW();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function to update variance report
  CREATE OR REPLACE FUNCTION update_stocktake_variance_report()
  RETURNS void AS $$
  BEGIN
      -- Delete existing data for today
      DELETE FROM stocktake_variance_report
      WHERE count_date = CURRENT_DATE;

      -- Insert new variance data
      INSERT INTO stocktake_variance_report (
          product_code, product_desc, count_date,
          system_stock, counted_stock, variance,
  variance_percentage
      )
      SELECT
          st.product_code,
          st.product_desc,
          DATE(st.created_at) as count_date,
          sl.stock_level as system_stock,
          SUM(st.counted_qty) as counted_stock,
          sl.stock_level - SUM(st.counted_qty) as variance,
          CASE
              WHEN sl.stock_level > 0
              THEN ((sl.stock_level -
  SUM(st.counted_qty))::DECIMAL / sl.stock_level * 100)
              ELSE 0
          END as variance_percentage
      FROM record_stocktake st
      LEFT JOIN stock_level sl ON st.product_code = sl.stock
      WHERE st.plt_num IS NOT NULL
      AND DATE(st.created_at) = CURRENT_DATE
      GROUP BY st.product_code, st.product_desc,
  DATE(st.created_at), sl.stock_level
      ON CONFLICT (product_code, count_date)
      DO UPDATE SET
          product_desc = EXCLUDED.product_desc,
          system_stock = EXCLUDED.system_stock,
          counted_stock = EXCLUDED.counted_stock,
          variance = EXCLUDED.variance,
          variance_percentage = EXCLUDED.variance_percentage,
          updated_at = NOW();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Master function to update all summary tables
  CREATE OR REPLACE FUNCTION update_all_stocktake_summaries()
  RETURNS void AS $$
  BEGIN
      PERFORM update_stocktake_daily_summary();
      PERFORM update_stocktake_batch_summary();
      PERFORM update_stocktake_variance_report();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  4. 創建觸發器自動更新

  -- Trigger to update summaries after stocktake insert
  CREATE OR REPLACE FUNCTION trigger_update_stocktake_summaries()
  RETURNS TRIGGER AS $$
  BEGIN
      -- Update summaries asynchronously to avoid blocking
      PERFORM pg_notify('stocktake_update', 'update_required');
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER after_stocktake_insert
  AFTER INSERT ON record_stocktake
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_stocktake_summaries();

  5. 初始化數據

  -- Populate tables with existing data
  -- Daily Summary
  INSERT INTO stocktake_daily_summary (
      count_date, product_code, product_desc,
      pallet_count, total_counted, final_remain_qty,
  last_count_time
  )
  SELECT
      DATE(created_at) as count_date,
      product_code,
      product_desc,
      COUNT(DISTINCT plt_num) as pallet_count,
      SUM(counted_qty) as total_counted,
      MIN(remain_qty) as final_remain_qty,
      MAX(created_at) as last_count_time
  FROM record_stocktake
  GROUP BY DATE(created_at), product_code, product_desc
  ON CONFLICT (count_date, product_code) DO NOTHING;

  -- Batch Summary
  INSERT INTO stocktake_batch_summary (
      batch_time, counted_id, counted_name,
      scan_count, product_count, total_counted,
      start_time, end_time
  )
  SELECT
      DATE_TRUNC('minute', created_at) as batch_time,
      counted_id,
      counted_name,
      COUNT(*) as scan_count,
      COUNT(DISTINCT product_code) as product_count,
      SUM(counted_qty) as total_counted,
      MIN(created_at) as start_time,
      MAX(created_at) as end_time
  FROM record_stocktake
  WHERE plt_num IS NOT NULL
  GROUP BY DATE_TRUNC('minute', created_at), counted_id,
  counted_name
  ON CONFLICT (batch_time, counted_id) DO NOTHING;

  -- Variance Report
  INSERT INTO stocktake_variance_report (
      product_code, product_desc, count_date,
      system_stock, counted_stock, variance, variance_percentage
  )
  SELECT
      st.product_code,
      st.product_desc,
      DATE(st.created_at) as count_date,
      sl.stock_level as system_stock,
      SUM(st.counted_qty) as counted_stock,
      sl.stock_level - SUM(st.counted_qty) as variance,
      CASE
          WHEN sl.stock_level > 0
          THEN ((sl.stock_level - SUM(st.counted_qty))::DECIMAL /
  sl.stock_level * 100)
          ELSE 0
      END as variance_percentage
  FROM record_stocktake st
  LEFT JOIN stock_level sl ON st.product_code = sl.stock
  WHERE st.plt_num IS NOT NULL
  GROUP BY st.product_code, st.product_desc, DATE(st.created_at),
  sl.stock_level
  ON CONFLICT (product_code, count_date) DO NOTHING;

  6. 授予權限

  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_daily_summary
  TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_batch_summary
  TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON
  stocktake_variance_report TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_daily_summary
  TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_batch_summary
  TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON
  stocktake_variance_report TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_daily_summary
  TO service_role;
  GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_batch_summary
  TO service_role;
  GRANT SELECT, INSERT, UPDATE, DELETE ON
  stocktake_variance_report TO service_role;

  -- Grant function permissions
  GRANT EXECUTE ON FUNCTION update_stocktake_daily_summary TO
  authenticated;
  GRANT EXECUTE ON FUNCTION update_stocktake_batch_summary TO
  authenticated;
  GRANT EXECUTE ON FUNCTION update_stocktake_variance_report TO
  authenticated;
  GRANT EXECUTE ON FUNCTION update_all_stocktake_summaries TO
  authenticated;

  7. 創建定時更新 (如果需要)

  -- Create a scheduled job to update summaries (requires pg_cron 
  extension)
  -- Run every 5 minutes
  SELECT cron.schedule(
      'update-stocktake-summaries',
      '*/5 * * * *',
      'SELECT update_all_stocktake_summaries();'
  );

  8. 更新後的 Rollback Script

  -- Drop all new tables and functions
  DROP TRIGGER IF EXISTS after_stocktake_insert ON
  record_stocktake;
  DROP FUNCTION IF EXISTS trigger_update_stocktake_summaries();
  DROP FUNCTION IF EXISTS update_all_stocktake_summaries();
  DROP FUNCTION IF EXISTS update_stocktake_variance_report();
  DROP FUNCTION IF EXISTS update_stocktake_batch_summary();
  DROP FUNCTION IF EXISTS update_stocktake_daily_summary();
  DROP TABLE IF EXISTS stocktake_variance_report;
  DROP TABLE IF EXISTS stocktake_batch_summary;
  DROP TABLE IF EXISTS stocktake_daily_summary;
