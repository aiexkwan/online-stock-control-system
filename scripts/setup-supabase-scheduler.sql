-- 設置 Supabase Scheduler 自動清理 Pallet Buffer
-- 需要先啟用 pg_cron extension

-- 1. 啟用 pg_cron extension（如果未啟用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 創建排程任務 - 每 30 分鐘執行一次清理
SELECT cron.schedule(
    'cleanup-pallet-buffer',           -- job 名稱
    '*/30 * * * *',                   -- cron 表達式：每 30 分鐘
    $$SELECT api_cleanup_pallet_buffer();$$
);

-- 3. 查看現有的排程任務
SELECT * FROM cron.job;

-- 4. 查看排程執行歷史
SELECT 
    jrd.*,
    j.jobname
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'cleanup-pallet-buffer'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 5. 如果需要修改排程時間（例如改為每小時）
/*
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-pallet-buffer'),
    schedule := '0 * * * *'  -- 每小時整點執行
);
*/

-- 6. 如果需要暫停排程
/*
SELECT cron.unschedule('cleanup-pallet-buffer');
*/

-- 7. 創建更複雜的排程（例如只在工作時間執行）
/*
SELECT cron.schedule(
    'cleanup-pallet-buffer-business-hours',
    '*/30 8-18 * * 1-5',  -- 週一至週五，早上 8 點到下午 6 點，每 30 分鐘
    $$SELECT api_cleanup_pallet_buffer();$$
);
*/

-- 8. 使用 Edge Function 的排程方式
-- 如果要用 Edge Function 而不是直接 SQL 函數
/*
SELECT cron.schedule(
    'cleanup-pallet-buffer-edge',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-pallet-buffer',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object('trigger', 'scheduled')
    );
    $$
);
*/

-- 9. 創建清理日誌表（可選）
CREATE TABLE IF NOT EXISTS pallet_buffer_cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_old_days INTEGER,
    deleted_used INTEGER,
    deleted_unused INTEGER,
    total_deleted INTEGER,
    entries_before INTEGER,
    entries_after INTEGER,
    execution_time_ms INTEGER
);

-- 10. 修改清理函數以記錄日誌
CREATE OR REPLACE FUNCTION api_cleanup_pallet_buffer_with_log()
RETURNS json AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_result json;
    v_execution_time INTEGER;
BEGIN
    v_start_time := clock_timestamp();
    
    -- 執行原本的清理函數
    SELECT api_cleanup_pallet_buffer() INTO v_result;
    
    -- 計算執行時間
    v_execution_time := EXTRACT(MILLISECOND FROM clock_timestamp() - v_start_time)::INTEGER;
    
    -- 記錄到日誌表
    INSERT INTO pallet_buffer_cleanup_log (
        deleted_old_days,
        deleted_used,
        deleted_unused,
        total_deleted,
        entries_before,
        entries_after,
        execution_time_ms
    ) VALUES (
        (v_result->>'deleted_old_days')::INTEGER,
        (v_result->>'deleted_used')::INTEGER,
        (v_result->>'deleted_unused')::INTEGER,
        (v_result->>'total_deleted')::INTEGER,
        (v_result->>'entries_before')::INTEGER,
        (v_result->>'entries_after')::INTEGER,
        v_execution_time
    );
    
    -- 返回結果
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION api_cleanup_pallet_buffer_with_log() TO service_role;