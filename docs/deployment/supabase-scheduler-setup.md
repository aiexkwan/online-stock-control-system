# Supabase Scheduler 自動清理設置指南

## 概述
使用 Supabase 內置的 pg_cron 擴展來自動執行 pallet buffer 清理任務。

## 設置步驟

### 1. 啟用 pg_cron Extension

在 Supabase Dashboard：
1. 進入 Database → Extensions
2. 搜尋 "pg_cron"
3. 點擊 "Enable" 啟用擴展

或執行 SQL：
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. 部署清理函數

執行以下 SQL 腳本：
```bash
# 部署主要清理函數
scripts/fix-pallet-number-ordering.sql
scripts/setup-auto-cleanup-cron.sql
```

### 3. 設置排程任務

執行排程設置腳本：
```sql
-- 設置每 30 分鐘執行一次
SELECT cron.schedule(
    'cleanup-pallet-buffer',
    '*/30 * * * *',
    $$SELECT api_cleanup_pallet_buffer();$$
);
```

### 4. 部署 Edge Function（可選）

如果想使用 Edge Function 而非直接 SQL：

```bash
# 部署 Edge Function
supabase functions deploy cleanup-pallet-buffer

# 設置排程調用 Edge Function
SELECT cron.schedule(
    'cleanup-pallet-buffer-edge',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-pallet-buffer',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        )
    );
    $$
);
```

## Cron 表達式說明

常用排程設置：
- `*/30 * * * *` - 每 30 分鐘
- `0 * * * *` - 每小時整點
- `0 */2 * * *` - 每 2 小時
- `0 0 * * *` - 每天午夜
- `*/30 8-18 * * 1-5` - 工作日早上 8 點到下午 6 點每 30 分鐘

## 監控和管理

### 查看排程任務
```sql
-- 查看所有排程任務
SELECT * FROM cron.job;

-- 查看特定任務
SELECT * FROM cron.job WHERE jobname = 'cleanup-pallet-buffer';
```

### 查看執行歷史
```sql
-- 最近 10 次執行記錄
SELECT 
    jrd.*,
    j.jobname
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'cleanup-pallet-buffer'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

### 修改排程
```sql
-- 修改為每小時執行
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-pallet-buffer'),
    schedule := '0 * * * *'
);
```

### 暫停/恢復排程
```sql
-- 暫停
SELECT cron.unschedule('cleanup-pallet-buffer');

-- 重新啟用（需要重新創建）
SELECT cron.schedule(
    'cleanup-pallet-buffer',
    '*/30 * * * *',
    $$SELECT api_cleanup_pallet_buffer();$$
);
```

## 清理日誌（可選）

創建日誌表來追蹤清理歷史：
```sql
-- 使用帶日誌功能的清理函數
SELECT cron.schedule(
    'cleanup-pallet-buffer-with-log',
    '*/30 * * * *',
    $$SELECT api_cleanup_pallet_buffer_with_log();$$
);

-- 查看清理日誌
SELECT * FROM pallet_buffer_cleanup_log
ORDER BY cleanup_time DESC
LIMIT 20;
```

## 故障排除

### pg_cron 未啟用
錯誤：`extension "pg_cron" does not exist`
解決：在 Supabase Dashboard 啟用 pg_cron extension

### 排程未執行
1. 檢查 cron.job 表確認任務存在
2. 查看 cron.job_run_details 的錯誤信息
3. 確認函數權限正確

### 清理效果不佳
1. 調整清理頻率
2. 修改清理條件（在 auto_cleanup_pallet_buffer 函數中）
3. 檢查是否有大量並發生成導致 buffer 快速增長

## 最佳實踐

1. **監控 Buffer 大小**
   ```sql
   -- 創建監控查詢
   SELECT 
       COUNT(*) as total_entries,
       COUNT(*) FILTER (WHERE used = true) as used_entries,
       COUNT(*) FILTER (WHERE used = false) as unused_entries
   FROM pallet_number_buffer;
   ```

2. **設置告警**
   - 當 buffer 大小超過閾值時發送通知
   - 當清理任務失敗時發送告警

3. **定期檢查**
   - 每週檢查清理日誌
   - 調整清理策略以優化性能

## 立即行動

1. 在 Supabase SQL Editor 執行：
   ```sql
   -- 啟用 pg_cron
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   -- 設置排程
   SELECT cron.schedule(
       'cleanup-pallet-buffer',
       '*/30 * * * *',
       $$SELECT api_cleanup_pallet_buffer();$$
   );
   ```

2. 驗證設置：
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-pallet-buffer';
   ```

3. 等待 30 分鐘後檢查執行結果：
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'cleanup-pallet-buffer'
   ORDER BY start_time DESC;