-- 簡化 pallet_number_buffer 表結構（含 series）
-- 1. 先備份現有數據（如需要）
CREATE TABLE IF NOT EXISTS pallet_number_buffer_backup AS
SELECT * FROM pallet_number_buffer;

-- 2. 刪除現有表
DROP TABLE IF EXISTS pallet_number_buffer;

-- 3. 創建新的簡化版本（包含 series）
CREATE TABLE pallet_number_buffer (
    id INTEGER PRIMARY KEY,
    pallet_number TEXT NOT NULL UNIQUE,
    series TEXT NOT NULL UNIQUE,
    date_str TEXT NOT NULL,
    used TEXT NOT NULL DEFAULT 'False' CHECK (used IN ('False', 'Holded', 'True')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢效能
CREATE INDEX idx_pallet_buffer_used ON pallet_number_buffer(used);
CREATE INDEX idx_pallet_buffer_date_str ON pallet_number_buffer(date_str);
CREATE INDEX idx_pallet_buffer_id_used ON pallet_number_buffer(id, used); -- 複合索引

-- 4. 創建生成隨機字符串的函數
CREATE OR REPLACE FUNCTION generate_random_alphanumeric(length INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 5. 創建每日重置函數（含 series 生成）
CREATE OR REPLACE FUNCTION reset_daily_pallet_buffer()
RETURNS void
LANGUAGE plpgsql
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

    -- 清空表
    TRUNCATE TABLE pallet_number_buffer;

    -- 插入300條記錄
    FOR i IN 1..300 LOOP
        -- 生成唯一的 series（重試機制以確保唯一性）
        v_retry_count := 0;
        LOOP
            v_series := v_series_prefix || generate_random_alphanumeric(6);

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

-- 6. 創建簡化版的 v6 pallet 生成函數
CREATE OR REPLACE FUNCTION public.generate_atomic_pallet_numbers_v6(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE(pallet_number TEXT, series TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date_str TEXT;
BEGIN
    -- 獲取當前日期
    v_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 檢查是否是新的一天，如果緩衝區日期不匹配則重置
    IF NOT EXISTS (
        SELECT 1 FROM pallet_number_buffer
        WHERE date_str = v_date_str
        LIMIT 1
    ) THEN
        PERFORM reset_daily_pallet_buffer();
    END IF;

    -- 返回可用的 pallet numbers 和 series
    RETURN QUERY
    WITH available AS (
        SELECT pb.id, pb.pallet_number, pb.series
        FROM pallet_number_buffer pb
        WHERE pb.used = 'False'
        AND pb.date_str = v_date_str
        ORDER BY pb.id
        LIMIT p_count
        FOR UPDATE SKIP LOCKED
    )
    UPDATE pallet_number_buffer pb
    SET used = 'Holded',
        updated_at = NOW()
    FROM available a
    WHERE pb.id = a.id
    RETURNING pb.pallet_number, pb.series;

    -- 檢查是否獲得足夠的號碼
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No pallet numbers available';
    END IF;
END;
$$;

-- 7. 創建確認函數（列印成功後調用）
CREATE OR REPLACE FUNCTION public.confirm_pallet_usage(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'True',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count = 0 THEN
        RAISE WARNING 'No pallet numbers were confirmed. They may have already been used or released.';
        RETURN FALSE;
    END IF;

    RAISE NOTICE 'Confirmed % pallet numbers as used', v_count;
    RETURN TRUE;
END;
$$;

-- 8. 創建釋放函數（列印失敗或取消時調用）
CREATE OR REPLACE FUNCTION public.release_pallet_reservation(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count = 0 THEN
        RAISE WARNING 'No pallet numbers were released. They may have already been used or were not held.';
        RETURN FALSE;
    END IF;

    RAISE NOTICE 'Released % pallet numbers', v_count;
    RETURN TRUE;
END;
$$;

-- 9. 創建清理超時保留的函數
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 釋放超過 10 分鐘的保留
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE used = 'Holded'
    AND updated_at < NOW() - INTERVAL '10 minutes';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count > 0 THEN
        RAISE NOTICE 'Released % expired holds', v_count;
    END IF;

    RETURN v_count;
END;
$$;

-- 10. 創建查看當天使用狀況的函數
CREATE OR REPLACE FUNCTION public.get_pallet_buffer_status()
RETURNS TABLE(
    total_count INTEGER,
    available_count INTEGER,
    holded_count INTEGER,
    used_count INTEGER,
    next_available_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN used = 'False' THEN 1 END)::INTEGER as available_count,
        COUNT(CASE WHEN used = 'Holded' THEN 1 END)::INTEGER as holded_count,
        COUNT(CASE WHEN used = 'True' THEN 1 END)::INTEGER as used_count,
        COALESCE(MIN(CASE WHEN used = 'False' THEN id END), 0)::INTEGER as next_available_id
    FROM pallet_number_buffer
    WHERE date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY');
END;
$$;

-- 11. 創建定時任務（每日凌晨執行）
-- 注意：這需要在 Supabase 的 Cron Jobs 中設置
-- 在 Supabase Dashboard > Database > Extensions 啟用 pg_cron
-- 然後執行：
/*
SELECT cron.schedule(
    'reset-pallet-buffer-daily',
    '0 0 * * *',  -- 每天凌晨 0 點
    'SELECT reset_daily_pallet_buffer();'
);

-- 每 30 分鐘清理一次超時的保留
SELECT cron.schedule(
    'cleanup-expired-holds',
    '*/30 * * * *',  -- 每 30 分鐘
    'SELECT cleanup_expired_holds();'
);
*/

-- 12. 立即執行一次重置以初始化數據
SELECT reset_daily_pallet_buffer();
