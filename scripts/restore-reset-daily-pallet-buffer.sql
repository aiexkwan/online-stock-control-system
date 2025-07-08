-- 恢復 reset_daily_pallet_buffer 函數
-- 這個函數在資料庫清理時被誤刪，現在需要恢復
-- 日期：2025-01-27
-- 參考：scripts/simplify-pallet-buffer-with-series.sql 和 scripts/simplify-pallet-buffer.sql

-- 檢查函數是否已存在
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'reset_daily_pallet_buffer'
    ) THEN
        RAISE NOTICE 'Function reset_daily_pallet_buffer already exists, dropping first...';
        DROP FUNCTION IF EXISTS public.reset_daily_pallet_buffer();
    END IF;
END $$;

-- 恢復 reset_daily_pallet_buffer 函數（使用 series 版本）
CREATE OR REPLACE FUNCTION public.reset_daily_pallet_buffer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date_str TEXT;
    v_series_prefix TEXT;
    i INTEGER;
    v_series TEXT;
    v_retry_count INTEGER;
    v_max_retries INTEGER := 5;
BEGIN
    -- 獲取今天的日期格式 (DDMMYY)
    v_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    v_series_prefix := v_date_str || '-';
    
    -- 記錄開始清理
    RAISE NOTICE 'Starting pallet buffer reset for date: %', v_date_str;
    
    -- 清空表
    TRUNCATE TABLE pallet_number_buffer;
    
    -- 插入300條記錄
    FOR i IN 1..300 LOOP
        -- 生成唯一的 series（重試機制以確保唯一性）
        v_retry_count := 0;
        LOOP
            -- 使用簡化的隨機字串生成邏輯
            v_series := v_series_prefix || 
                       substr(md5(random()::text || clock_timestamp()::text), 1, 6);
            
            -- 檢查是否已存在
            IF NOT EXISTS (SELECT 1 FROM pallet_number_buffer WHERE series = v_series) THEN
                EXIT; -- 找到唯一的 series
            END IF;
            
            v_retry_count := v_retry_count + 1;
            IF v_retry_count > v_max_retries THEN
                RAISE EXCEPTION 'Failed to generate unique series after % attempts', v_max_retries;
            END IF;
        END LOOP;
        
        INSERT INTO pallet_number_buffer (id, pallet_number, series, date_str, used)
        VALUES (i, v_date_str || '/' || i, v_series, v_date_str, 'False');
    END LOOP;
    
    RAISE NOTICE 'Pallet buffer reset completed for date: % with % records', v_date_str, 300;
END;
$$;

-- 添加函數註釋
COMMENT ON FUNCTION public.reset_daily_pallet_buffer() IS 
'重置每日棧板緩衝區 - 清空 pallet_number_buffer 表並重新生成 300 個棧板號碼
格式：DDMMYY/1-300 (pallet_number), DDMMYY-XXXXXX (series)
通常由 generate_atomic_pallet_numbers_v6 在檢測到新的一天時自動調用
也可以手動調用來重置緩衝區';

-- 設置適當的權限
GRANT EXECUTE ON FUNCTION public.reset_daily_pallet_buffer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_daily_pallet_buffer() TO service_role;

-- 驗證函數是否創建成功
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'reset_daily_pallet_buffer'
    ) THEN
        RAISE NOTICE '✅ Function reset_daily_pallet_buffer has been successfully restored!';
    ELSE
        RAISE EXCEPTION '❌ Failed to restore reset_daily_pallet_buffer function';
    END IF;
END $$;

-- 可選：立即執行一次來測試函數
-- SELECT reset_daily_pallet_buffer(); 