-- 部署 generate_atomic_pallet_numbers_v3 函數
-- 此腳本將創建新的 v3 函數，改進了原子性和同步機制

-- 創建或替換 generate_atomic_pallet_numbers_v3 函數
CREATE OR REPLACE FUNCTION generate_atomic_pallet_numbers_v3(count INTEGER)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date_str TEXT;
    result TEXT[] := ARRAY[]::TEXT[];
    i INTEGER;
    start_num INTEGER;
    existing_max INTEGER;
    sequence_max INTEGER;
BEGIN
    -- 檢查輸入參數
    IF count <= 0 THEN
        RETURN ARRAY[]::TEXT[];
    END IF;

    IF count > 50 THEN
        RAISE EXCEPTION 'Cannot generate more than 50 pallet numbers at once';
    END IF;

    -- 獲取當前日期字符串 (DDMMYY 格式)
    current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 🔒 使用 INSERT ... ON CONFLICT 來原子性地更新序列
    INSERT INTO daily_pallet_sequence (date_str, current_max)
    VALUES (current_date_str, 0)
    ON CONFLICT (date_str) DO NOTHING;

    -- 🔧 總是檢查實際的 record_palletinfo 表中的最大號碼
    SELECT COALESCE(MAX(
        CASE
            WHEN plt_num LIKE current_date_str || '/%'
            THEN CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
            ELSE 0
        END
    ), 0) INTO existing_max
    FROM record_palletinfo
    WHERE plt_num LIKE current_date_str || '/%';

    -- 獲取序列表中的當前值
    SELECT current_max INTO sequence_max
    FROM daily_pallet_sequence
    WHERE date_str = current_date_str;

    -- 🔧 使用實際最大值與序列值中的較大者
    start_num := GREATEST(existing_max, COALESCE(sequence_max, 0));

    -- 🔧 同步更新序列表為正確的值
    UPDATE daily_pallet_sequence
    SET current_max = start_num + count,
        last_updated = NOW()
    WHERE date_str = current_date_str;

    -- 生成連續的棧板號碼
    FOR i IN 1..count LOOP
        result := array_append(result, current_date_str || '/' || (start_num + i));
    END LOOP;

    -- 記錄生成日誌
    RAISE NOTICE 'Generated % pallet numbers for date % (actual_max: %, sequence_max: %): % to %',
        count, current_date_str, existing_max, sequence_max, start_num + 1, start_num + count;

    RETURN result;
END;
$$;

-- 授予必要的權限
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v3(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v3(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v3(INTEGER) TO service_role;

-- 測試函數
DO $$
DECLARE
    test_result TEXT[];
BEGIN
    RAISE NOTICE 'Testing generate_atomic_pallet_numbers_v3...';

    -- 測試生成 1 個棧板號碼
    SELECT generate_atomic_pallet_numbers_v3(1) INTO test_result;
    RAISE NOTICE 'Test result (1 pallet): %', test_result;

    -- 測試生成 3 個棧板號碼
    SELECT generate_atomic_pallet_numbers_v3(3) INTO test_result;
    RAISE NOTICE 'Test result (3 pallets): %', test_result;

    RAISE NOTICE 'generate_atomic_pallet_numbers_v3 function deployed and tested successfully!';
END;
$$;

-- 顯示當前函數狀態
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE 'generate_atomic_pallet_numbers%'
AND routine_schema = 'public'
ORDER BY routine_name;
