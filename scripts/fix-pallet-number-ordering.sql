-- 修復 pallet number 排序問題
-- 問題：ORDER BY pallet_number 使用字符串排序導致順序錯誤

-- 創建改進的 v5 版本，使用數字排序
CREATE OR REPLACE FUNCTION generate_atomic_pallet_numbers_v5(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
) RETURNS TEXT[] AS $$
DECLARE
    v_result TEXT[] := ARRAY[]::TEXT[];
    v_new_numbers TEXT[] := ARRAY[]::TEXT[];
    v_current_date_str TEXT;
    v_existing_max INTEGER;
    v_sequence_max INTEGER;
    v_start_num INTEGER;
    v_today TEXT;
    i INTEGER;
BEGIN
    -- 獲取當前日期字符串
    v_today := CURRENT_DATE::TEXT;
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 嘗試從緩衝區獲取未使用的號碼（使用數字排序）
    IF EXISTS (SELECT 1 FROM pallet_number_buffer WHERE date_str = v_current_date_str AND used = FALSE) THEN
        -- 使用數字排序
        SELECT array_agg(pallet_number ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER))
        INTO v_result
        FROM (
            SELECT pallet_number
            FROM pallet_number_buffer
            WHERE date_str = v_current_date_str
            AND used = FALSE
            AND (session_id IS NULL OR session_id = p_session_id)
            ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER)
            LIMIT p_count
            FOR UPDATE SKIP LOCKED
        ) AS available_numbers;

        -- 如果緩衝區有足夠的號碼，標記為已使用並返回
        IF array_length(v_result, 1) = p_count THEN
            UPDATE pallet_number_buffer
            SET used = TRUE,
                used_at = NOW(),
                session_id = p_session_id
            WHERE pallet_number = ANY(v_result);

            RETURN v_result;
        END IF;
    END IF;

    -- 緩衝區號碼不足，需要生成新號碼
    -- 使用 SERIALIZABLE 隔離級別確保原子性
    BEGIN
        -- 鎖定序列表記錄
        INSERT INTO daily_pallet_sequence (date_str, current_max)
        VALUES (v_current_date_str, 0)
        ON CONFLICT (date_str) DO NOTHING;

        -- 使用 FOR UPDATE 鎖定記錄
        SELECT current_max
        INTO v_sequence_max
        FROM daily_pallet_sequence
        WHERE date_str = v_current_date_str
        FOR UPDATE;

        -- 檢查實際表中的最大值（加入索引優化）
        SELECT COALESCE(MAX(
            CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
        ), 0)
        INTO v_existing_max
        FROM record_palletinfo
        WHERE plt_num LIKE v_current_date_str || '/%'
        AND plt_num ~ ('^' || v_current_date_str || '/[0-9]+$');

        -- 使用較大值作為起始點
        v_start_num := GREATEST(v_existing_max, COALESCE(v_sequence_max, 0));

        -- 更新序列表
        UPDATE daily_pallet_sequence
        SET current_max = v_start_num + p_count,
            last_updated = NOW()
        WHERE date_str = v_current_date_str;

        -- 生成號碼
        FOR i IN 1..p_count LOOP
            v_result := array_append(v_result, v_current_date_str || '/' || (v_start_num + i));
        END LOOP;

        -- 批量插入到緩衝表（預分配額外的號碼）
        IF p_count < 10 THEN
            -- 對於小批量，預分配額外 10 個號碼
            v_new_numbers := ARRAY[]::TEXT[];
            FOR i IN (p_count + 1)..(p_count + 10) LOOP
                v_new_numbers := array_append(v_new_numbers, v_current_date_str || '/' || (v_start_num + i));
            END LOOP;

            -- 插入預分配的號碼（忽略重複）
            INSERT INTO pallet_number_buffer (pallet_number, date_str, used)
            SELECT unnest(v_new_numbers), v_current_date_str, FALSE
            ON CONFLICT (pallet_number) DO NOTHING;

            -- 同時更新序列表
            UPDATE daily_pallet_sequence
            SET current_max = v_start_num + p_count + 10
            WHERE date_str = v_current_date_str;
        END IF;

        -- 標記使用的號碼
        UPDATE pallet_number_buffer
        SET used = TRUE,
            used_at = NOW(),
            session_id = p_session_id
        WHERE pallet_number = ANY(v_result);

        RETURN v_result;
    EXCEPTION
        WHEN serialization_failure THEN
            RAISE NOTICE 'Serialization failure, will retry';
            RAISE;
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in generate_atomic_pallet_numbers_v5: %', SQLERRM;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5(INTEGER, TEXT) TO service_role;

-- 創建自動清理函數
CREATE OR REPLACE FUNCTION auto_cleanup_pallet_buffer() RETURNS void AS $$
DECLARE
    v_deleted_count INTEGER;
    v_today TEXT;
BEGIN
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- 1. 清理非今日的所有條目
    DELETE FROM pallet_number_buffer
    WHERE date_str != v_today;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % entries from previous days', v_deleted_count;
    END IF;

    -- 2. 清理已使用超過 2 小時的條目
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE
    AND used_at < NOW() - INTERVAL '2 hours';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % used entries older than 2 hours', v_deleted_count;
    END IF;

    -- 3. 清理未使用但超過 30 分鐘的條目
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE
    AND allocated_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % unused entries older than 30 minutes', v_deleted_count;
    END IF;

    -- 4. 如果 buffer 太大（超過 100 個未使用），保留最新的 50 個
    IF (SELECT COUNT(*) FROM pallet_number_buffer WHERE used = FALSE) > 100 THEN
        DELETE FROM pallet_number_buffer
        WHERE pallet_number IN (
            SELECT pallet_number
            FROM pallet_number_buffer
            WHERE used = FALSE
            ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) DESC
            OFFSET 50
        );
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        IF v_deleted_count > 0 THEN
            RAISE NOTICE 'Buffer size exceeded limit, deleted % old unused entries', v_deleted_count;
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在每次生成新號碼前自動清理
CREATE OR REPLACE FUNCTION generate_atomic_pallet_numbers_v5_with_cleanup(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
) RETURNS TEXT[] AS $$
DECLARE
    v_result TEXT[];
BEGIN
    -- 先執行自動清理
    PERFORM auto_cleanup_pallet_buffer();

    -- 然後生成號碼
    SELECT generate_atomic_pallet_numbers_v5(p_count, p_session_id) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION auto_cleanup_pallet_buffer() TO service_role;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5_with_cleanup(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5_with_cleanup(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v5_with_cleanup(INTEGER, TEXT) TO service_role;

-- 檢查現有緩衝區的順序問題
SELECT
    pallet_number,
    CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) as num_part,
    used,
    allocated_at
FROM pallet_number_buffer
WHERE date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY')
ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER);

-- 顯示字符串排序 vs 數字排序的差異
WITH comparison AS (
    SELECT
        pallet_number,
        CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) as num_value,
        ROW_NUMBER() OVER (ORDER BY pallet_number) as string_order,
        ROW_NUMBER() OVER (ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER)) as numeric_order
    FROM pallet_number_buffer
    WHERE date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY')
)
SELECT
    pallet_number,
    num_value,
    string_order,
    numeric_order,
    CASE
        WHEN string_order != numeric_order THEN '⚠️ ORDER MISMATCH'
        ELSE 'OK'
    END as status
FROM comparison
ORDER BY numeric_order;
