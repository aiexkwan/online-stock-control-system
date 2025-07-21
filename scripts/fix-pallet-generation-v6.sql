-- 修復 generate_atomic_pallet_numbers_v6 函數問題
-- 日期：2025-07-02
-- 問題：函數依賴的 reset_daily_pallet_buffer 可能不存在，且返回格式不匹配

-- Step 1: 檢查並創建 pallet_number_buffer 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.pallet_number_buffer (
    id INTEGER PRIMARY KEY,
    pallet_number TEXT UNIQUE NOT NULL,
    series TEXT UNIQUE NOT NULL,
    date_str TEXT NOT NULL,
    used TEXT NOT NULL DEFAULT 'False' CHECK (used IN ('False', 'True', 'Holded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_pallet_buffer_date_used ON pallet_number_buffer(date_str, used);
CREATE INDEX IF NOT EXISTS idx_pallet_buffer_series ON pallet_number_buffer(series);

-- Step 2: 恢復 reset_daily_pallet_buffer 函數（如果不存在）
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

-- Step 3: 修正 generate_atomic_pallet_numbers_v6 函數以返回正確格式
CREATE OR REPLACE FUNCTION public.generate_atomic_pallet_numbers_v6(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE(pallet_number TEXT, series TEXT)  -- 改為返回表格式，包含兩個欄位
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
        SELECT 1 FROM pallet_number_buffer pb
        WHERE pb.date_str = v_date_str
        LIMIT 1
    ) THEN
        PERFORM reset_daily_pallet_buffer();
    END IF;

    -- 返回可用的 pallet numbers 和 series
    RETURN QUERY
    WITH available AS (
        SELECT pb.id, pb.pallet_number AS pallet_num, pb.series AS series_code
        FROM pallet_number_buffer pb
        WHERE pb.used = 'False'
        AND pb.date_str = v_date_str
        ORDER BY pb.id
        LIMIT p_count
        FOR UPDATE SKIP LOCKED
    ),
    updated AS (
        UPDATE pallet_number_buffer pb
        SET used = 'Holded',
            updated_at = NOW()
        WHERE pb.pallet_number IN (SELECT a.pallet_num FROM available a)
        RETURNING pb.pallet_number, pb.series
    )
    SELECT u.pallet_number, u.series FROM updated u
    ORDER BY u.pallet_number;

    -- 檢查是否獲得足夠的號碼
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not enough pallet numbers available. Requested: %', p_count;
    END IF;

    RAISE NOTICE '[v6] Reserved % pallet numbers', p_count;
END;
$$;

-- Step 4: 確保其他相關函數存在
CREATE OR REPLACE FUNCTION public.confirm_pallet_usage(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'True',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    IF NOT FOUND THEN
        RAISE WARNING 'No pallet numbers were confirmed. They may have already been used or released.';
        RETURN FALSE;
    END IF;

    RAISE NOTICE '[v6] Confirmed % pallet numbers as used', array_length(p_pallet_numbers, 1);
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_pallet_reservation(
    p_pallet_numbers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    IF NOT FOUND THEN
        RAISE WARNING 'No pallet numbers were released. They may have already been used or were not held.';
        RETURN FALSE;
    END IF;

    RAISE NOTICE '[v6] Released % pallet numbers', array_length(p_pallet_numbers, 1);
    RETURN TRUE;
END;
$$;

-- Step 5: 設置權限
GRANT EXECUTE ON FUNCTION public.reset_daily_pallet_buffer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_daily_pallet_buffer() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_atomic_pallet_numbers_v6(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_atomic_pallet_numbers_v6(INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_pallet_usage(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_pallet_usage(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_pallet_reservation(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_pallet_reservation(TEXT[]) TO service_role;

-- Step 6: 初始化今天的緩衝區
SELECT reset_daily_pallet_buffer();

-- Step 7: 測試函數
DO $$
DECLARE
    v_result RECORD;
    v_count INTEGER := 0;
BEGIN
    -- 測試生成 5 個托盤編號
    FOR v_result IN SELECT * FROM generate_atomic_pallet_numbers_v6(5, 'test-session') LOOP
        v_count := v_count + 1;
        RAISE NOTICE 'Generated: pallet_number=%, series=%', v_result.pallet_number, v_result.series;
    END LOOP;

    IF v_count = 5 THEN
        RAISE NOTICE '✅ Test passed: Successfully generated 5 pallet numbers';
    ELSE
        RAISE EXCEPTION '❌ Test failed: Expected 5 pallet numbers, got %', v_count;
    END IF;
END $$;

-- 添加函數註釋
COMMENT ON FUNCTION public.generate_atomic_pallet_numbers_v6(INTEGER, TEXT) IS
'生成唯一的托盤編號和系列，使用預生成的緩衝池。
返回格式：包含 pallet_number 和 series 的表格
托盤編號格式：DDMMYY/1-300
系列格式：DDMMYY-XXXXXX
使用原子操作和保留/釋放機制確保唯一性。
緩衝區每天午夜重置。';
