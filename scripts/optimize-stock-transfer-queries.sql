-- Stock Transfer 查詢優化腳本
-- 創建物化視圖和優化查詢性能

-- ====================================
-- 1. 創建物化視圖（用於快速查詢托盤當前位置）
-- ====================================

-- 創建托盤當前位置的物化視圖
DROP MATERIALIZED VIEW IF EXISTS mv_pallet_current_location CASCADE;

CREATE MATERIALIZED VIEW mv_pallet_current_location AS
WITH latest_history AS (
    SELECT DISTINCT ON (plt_num)
        plt_num,
        loc as current_location,
        time as last_update,
        id as operator_id,
        action as last_action
    FROM record_history
    ORDER BY plt_num, time DESC
)
SELECT
    p.plt_num,
    p.product_code,
    p.product_qty,
    p.plt_remark,
    p.series,
    COALESCE(h.current_location, 'Await') as current_location,
    h.last_update,
    h.operator_id,
    h.last_action
FROM record_palletinfo p
LEFT JOIN latest_history h ON p.plt_num = h.plt_num;

-- 創建索引以加速物化視圖查詢
CREATE INDEX idx_mv_pallet_plt_num ON mv_pallet_current_location(plt_num);
CREATE INDEX idx_mv_pallet_series ON mv_pallet_current_location(series) WHERE series IS NOT NULL;
CREATE INDEX idx_mv_pallet_location ON mv_pallet_current_location(current_location);
CREATE INDEX idx_mv_pallet_product_code ON mv_pallet_current_location(product_code);

-- ====================================
-- 2. 創建自動刷新物化視圖的函數
-- ====================================

CREATE OR REPLACE FUNCTION refresh_pallet_location_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pallet_current_location;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 3. 創建觸發器函數以標記需要刷新
-- ====================================

-- 創建一個表來跟踪物化視圖是否需要刷新
CREATE TABLE IF NOT EXISTS mv_refresh_tracking (
    mv_name TEXT PRIMARY KEY,
    needs_refresh BOOLEAN DEFAULT FALSE,
    last_refresh TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化跟踪記錄
INSERT INTO mv_refresh_tracking (mv_name, needs_refresh)
VALUES ('mv_pallet_current_location', FALSE)
ON CONFLICT (mv_name) DO NOTHING;

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION mark_mv_needs_refresh()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE mv_refresh_tracking
    SET needs_refresh = TRUE
    WHERE mv_name = 'mv_pallet_current_location';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在 record_history 表上創建觸發器
DROP TRIGGER IF EXISTS trg_history_mv_refresh ON record_history;
CREATE TRIGGER trg_history_mv_refresh
AFTER INSERT OR UPDATE ON record_history
FOR EACH STATEMENT
EXECUTE FUNCTION mark_mv_needs_refresh();

-- ====================================
-- 4. 創建優化的查詢函數
-- ====================================

-- 優化的托盤查詢函數（使用物化視圖）
CREATE OR REPLACE FUNCTION search_pallet_optimized(
    p_search_type TEXT,  -- 'pallet_num' 或 'series'
    p_search_value TEXT
)
RETURNS TABLE (
    plt_num TEXT,
    product_code TEXT,
    product_qty INTEGER,
    plt_remark TEXT,
    series TEXT,
    current_location TEXT,
    last_update TIMESTAMP
) AS $$
BEGIN
    -- 檢查是否需要刷新物化視圖
    IF (SELECT needs_refresh FROM mv_refresh_tracking WHERE mv_name = 'mv_pallet_current_location') THEN
        PERFORM refresh_pallet_location_mv();
        UPDATE mv_refresh_tracking
        SET needs_refresh = FALSE, last_refresh = CURRENT_TIMESTAMP
        WHERE mv_name = 'mv_pallet_current_location';
    END IF;

    -- 根據搜索類型查詢
    IF p_search_type = 'series' THEN
        RETURN QUERY
        SELECT
            mv.plt_num,
            mv.product_code,
            mv.product_qty,
            mv.plt_remark,
            mv.series,
            mv.current_location,
            mv.last_update
        FROM mv_pallet_current_location mv
        WHERE mv.series = p_search_value;
    ELSE
        RETURN QUERY
        SELECT
            mv.plt_num,
            mv.product_code,
            mv.product_qty,
            mv.plt_remark,
            mv.series,
            mv.current_location,
            mv.last_update
        FROM mv_pallet_current_location mv
        WHERE mv.plt_num = p_search_value;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 5. 創建批量查詢優化函數
-- ====================================

-- 批量查詢托盤信息（用於預加載）
CREATE OR REPLACE FUNCTION batch_search_pallets(
    p_patterns TEXT[]  -- 托盤號前綴數組
)
RETURNS TABLE (
    plt_num TEXT,
    product_code TEXT,
    product_qty INTEGER,
    plt_remark TEXT,
    series TEXT,
    current_location TEXT,
    last_update TIMESTAMP
) AS $$
DECLARE
    pattern TEXT;
BEGIN
    -- 創建臨時表存儲結果
    CREATE TEMP TABLE temp_batch_results (
        plt_num TEXT,
        product_code TEXT,
        product_qty INTEGER,
        plt_remark TEXT,
        series TEXT,
        current_location TEXT,
        last_update TIMESTAMP
    ) ON COMMIT DROP;

    -- 對每個模式進行查詢
    FOREACH pattern IN ARRAY p_patterns
    LOOP
        INSERT INTO temp_batch_results
        SELECT
            mv.plt_num,
            mv.product_code,
            mv.product_qty,
            mv.plt_remark,
            mv.series,
            mv.current_location,
            mv.last_update
        FROM mv_pallet_current_location mv
        WHERE mv.plt_num LIKE pattern || '%'
        ORDER BY mv.last_update DESC
        LIMIT 10;  -- 每個前綴最多返回10個最近的托盤
    END LOOP;

    -- 返回去重後的結果
    RETURN QUERY
    SELECT DISTINCT * FROM temp_batch_results;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 6. 創建定期維護任務
-- ====================================

-- 創建定期刷新物化視圖的函數（可以通過 pg_cron 或外部調度器調用）
CREATE OR REPLACE FUNCTION periodic_mv_refresh()
RETURNS void AS $$
DECLARE
    last_refresh_time TIMESTAMP;
    refresh_interval INTERVAL := '5 minutes';
BEGIN
    -- 獲取上次刷新時間
    SELECT last_refresh INTO last_refresh_time
    FROM mv_refresh_tracking
    WHERE mv_name = 'mv_pallet_current_location';

    -- 如果超過刷新間隔或標記需要刷新，則執行刷新
    IF (CURRENT_TIMESTAMP - last_refresh_time > refresh_interval) OR
       (SELECT needs_refresh FROM mv_refresh_tracking WHERE mv_name = 'mv_pallet_current_location') THEN
        PERFORM refresh_pallet_location_mv();
        UPDATE mv_refresh_tracking
        SET needs_refresh = FALSE, last_refresh = CURRENT_TIMESTAMP
        WHERE mv_name = 'mv_pallet_current_location';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 7. 查詢性能統計視圖
-- ====================================

CREATE OR REPLACE VIEW v_stock_transfer_performance AS
SELECT
    'record_palletinfo' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('record_palletinfo')) as total_size
FROM record_palletinfo
UNION ALL
SELECT
    'record_history' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('record_history')) as total_size
FROM record_history
UNION ALL
SELECT
    'mv_pallet_current_location' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('mv_pallet_current_location')) as total_size
FROM mv_pallet_current_location;
