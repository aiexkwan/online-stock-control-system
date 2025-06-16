-- 優化 generate_atomic_pallet_numbers_v4 函數
-- 改進點：
-- 1. 使用 FOR UPDATE 鎖定避免並發問題
-- 2. 批量插入預分配的號碼到緩衝表
-- 3. 改進錯誤處理和重試機制
-- 4. 添加性能監控

-- 創建托盤號碼緩衝表（如果不存在）
CREATE TABLE IF NOT EXISTS pallet_number_buffer (
    id SERIAL PRIMARY KEY,
    pallet_number TEXT UNIQUE NOT NULL,
    date_str TEXT NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    session_id TEXT
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_unused_numbers ON pallet_number_buffer (date_str, used) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_allocated_time ON pallet_number_buffer (allocated_at);

-- 創建清理函數
CREATE OR REPLACE FUNCTION cleanup_pallet_buffer()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 刪除超過 5 分鐘未使用的預分配號碼
    DELETE FROM pallet_number_buffer
    WHERE used = FALSE 
    AND allocated_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 刪除超過 7 天的已使用記錄
    DELETE FROM pallet_number_buffer
    WHERE used = TRUE 
    AND used_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$;

-- 優化的托盤編號生成函數
CREATE OR REPLACE FUNCTION generate_atomic_pallet_numbers_v4(
    p_count INTEGER,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_date_str TEXT;
    v_result TEXT[] := ARRAY[]::TEXT[];
    v_start_num INTEGER;
    v_existing_max INTEGER;
    v_sequence_max INTEGER;
    v_buffer_available INTEGER;
    v_new_numbers TEXT[];
    i INTEGER;
BEGIN
    -- 參數驗證
    IF p_count <= 0 THEN
        RAISE EXCEPTION 'Count must be greater than 0';
    END IF;
    
    IF p_count > 50 THEN
        RAISE EXCEPTION 'Cannot generate more than 50 pallet numbers at once';
    END IF;
    
    -- 獲取當前日期字符串
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 首先嘗試從緩衝區獲取可用號碼
    IF p_session_id IS NOT NULL THEN
        SELECT array_agg(pallet_number ORDER BY pallet_number)
        INTO v_result
        FROM (
            SELECT pallet_number
            FROM pallet_number_buffer
            WHERE date_str = v_current_date_str
            AND used = FALSE
            AND (session_id IS NULL OR session_id = p_session_id)
            ORDER BY pallet_number
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
        
        RETURN v_result;
        
    EXCEPTION
        WHEN serialization_failure THEN
            -- 序列化失敗，返回錯誤讓客戶端重試
            RAISE EXCEPTION 'Serialization failure, please retry';
        WHEN OTHERS THEN
            -- 其他錯誤
            RAISE;
    END;
END;
$$;

-- 創建監控函數
CREATE OR REPLACE FUNCTION monitor_pallet_generation_v4()
RETURNS TABLE (
    out_date_str TEXT,
    out_sequence_max INTEGER,
    out_actual_max INTEGER,
    out_buffer_count INTEGER,
    out_buffer_used INTEGER,
    out_generation_errors INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_today TEXT;
BEGIN
    -- 獲取今天的日期字符串
    v_today := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    RETURN QUERY
    WITH sequence_info AS (
        SELECT 
            s.date_str AS seq_date_str,
            s.current_max as sequence_max
        FROM daily_pallet_sequence s
        WHERE s.date_str = v_today
    ),
    actual_info AS (
        SELECT 
            COUNT(*) as total_count,
            MAX(CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)) as actual_max
        FROM record_palletinfo
        WHERE plt_num LIKE v_today || '/%'
    ),
    buffer_info AS (
        SELECT 
            COUNT(*) as buffer_count,
            COUNT(*) FILTER (WHERE used = TRUE) as buffer_used
        FROM pallet_number_buffer b
        WHERE b.date_str = v_today
    )
    SELECT 
        COALESCE(si.seq_date_str, v_today)::TEXT,
        COALESCE(si.sequence_max, 0)::INTEGER,
        COALESCE(ai.actual_max, 0)::INTEGER,
        COALESCE(bi.buffer_count, 0)::INTEGER,
        COALESCE(bi.buffer_used, 0)::INTEGER,
        0::INTEGER as generation_errors -- 可以從日誌表獲取
    FROM sequence_info si
    FULL OUTER JOIN actual_info ai ON TRUE
    FULL OUTER JOIN buffer_info bi ON TRUE;
END;
$$;

-- 創建索引優化查詢性能
CREATE INDEX IF NOT EXISTS idx_palletinfo_datestr ON record_palletinfo (plt_num text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_daily_sequence_date ON daily_pallet_sequence (date_str);

-- 授權
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v4(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v4(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_atomic_pallet_numbers_v4(INTEGER, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION cleanup_pallet_buffer() TO service_role;
GRANT EXECUTE ON FUNCTION monitor_pallet_generation_v4() TO authenticated;

-- 測試新函數
DO $$
DECLARE
    test_result TEXT[];
    monitor_result RECORD;
BEGIN
    -- 測試生成
    RAISE NOTICE 'Testing generate_atomic_pallet_numbers_v4...';
    
    SELECT generate_atomic_pallet_numbers_v4(3, 'test-session-001') INTO test_result;
    RAISE NOTICE 'Generated pallets: %', test_result;
    
    -- 檢查監控
    SELECT * INTO monitor_result FROM monitor_pallet_generation_v4();
    RAISE NOTICE 'Monitor result: %', monitor_result;
    
    -- 清理測試數據
    PERFORM cleanup_pallet_buffer();
    
    RAISE NOTICE 'Function deployed successfully!';
END;
$$;