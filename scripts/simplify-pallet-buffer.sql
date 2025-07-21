-- 簡化 pallet_number_buffer 表結構
-- 1. 先備份現有數據（如需要）
CREATE TABLE IF NOT EXISTS pallet_number_buffer_backup AS
SELECT * FROM pallet_number_buffer;

-- 2. 刪除現有表
DROP TABLE IF EXISTS pallet_number_buffer;

-- 3. 創建新的簡化版本
CREATE TABLE pallet_number_buffer (
    id INTEGER PRIMARY KEY,
    pallet_number TEXT NOT NULL UNIQUE,
    date_str TEXT NOT NULL,
    used TEXT NOT NULL DEFAULT 'False' CHECK (used IN ('False', 'Holded', 'True')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢效能
CREATE INDEX idx_pallet_buffer_used ON pallet_number_buffer(used);
CREATE INDEX idx_pallet_buffer_date_str ON pallet_number_buffer(date_str);

-- 4. 創建每日重置函數
CREATE OR REPLACE FUNCTION reset_daily_pallet_buffer()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_date_str TEXT;
    i INTEGER;
BEGIN
    -- 獲取今天的日期格式 (DDMMYY)
    v_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 清空表
    TRUNCATE TABLE pallet_number_buffer;

    -- 插入300條記錄
    FOR i IN 1..300 LOOP
        INSERT INTO pallet_number_buffer (id, pallet_number, date_str, used)
        VALUES (i, v_date_str || '/' || i, v_date_str, 'False');
    END LOOP;

    RAISE NOTICE 'Pallet buffer reset completed for date: %', v_date_str;
END;
$$;

-- 5. 創建獲取可用 pallet numbers 的函數
CREATE OR REPLACE FUNCTION get_available_pallet_numbers(p_count INTEGER)
RETURNS TABLE(pallet_number TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 返回指定數量的可用號碼
    RETURN QUERY
    SELECT pb.pallet_number
    FROM pallet_number_buffer pb
    WHERE pb.used = 'False'
    AND pb.date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY')
    ORDER BY pb.id
    LIMIT p_count
    FOR UPDATE SKIP LOCKED;
END;
$$;

-- 6. 創建保留 pallet numbers 的函數
CREATE OR REPLACE FUNCTION hold_pallet_numbers(p_pallet_numbers TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'Holded',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'False';

    -- 檢查是否所有號碼都成功保留
    RETURN (SELECT COUNT(*) FROM pallet_number_buffer
            WHERE pallet_number = ANY(p_pallet_numbers)
            AND used = 'Holded') = array_length(p_pallet_numbers, 1);
END;
$$;

-- 7. 創建確認使用 pallet numbers 的函數
CREATE OR REPLACE FUNCTION confirm_pallet_numbers(p_pallet_numbers TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'True',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    RETURN FOUND;
END;
$$;

-- 8. 創建釋放保留的 pallet numbers 的函數（用於取消或錯誤情況）
CREATE OR REPLACE FUNCTION release_pallet_numbers(p_pallet_numbers TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE pallet_number_buffer
    SET used = 'False',
        updated_at = NOW()
    WHERE pallet_number = ANY(p_pallet_numbers)
    AND used = 'Holded';

    RETURN FOUND;
END;
$$;

-- 9. 創建定時任務（每日凌晨執行）
-- 注意：這需要在 Supabase 的 Cron Jobs 中設置
-- 在 Supabase Dashboard > Database > Extensions 啟用 pg_cron
-- 然後執行：
/*
SELECT cron.schedule(
    'reset-pallet-buffer-daily',
    '0 0 * * *',  -- 每天凌晨 0 點
    'SELECT reset_daily_pallet_buffer();'
);
*/

-- 10. 立即執行一次重置以初始化數據
SELECT reset_daily_pallet_buffer();
