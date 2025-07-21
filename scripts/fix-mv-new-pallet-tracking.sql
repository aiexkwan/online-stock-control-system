-- 修復物化視圖新增托盤追蹤問題
-- 確保新增的托盤也能及時更新到物化視圖

-- ====================================
-- 1. 在 record_palletinfo 表上添加觸發器
-- ====================================

-- 當新增托盤時，也標記物化視圖需要刷新
DROP TRIGGER IF EXISTS trg_palletinfo_mv_refresh ON record_palletinfo;
CREATE TRIGGER trg_palletinfo_mv_refresh
AFTER INSERT OR UPDATE ON record_palletinfo
FOR EACH STATEMENT
EXECUTE FUNCTION mark_mv_needs_refresh();

-- ====================================
-- 2. 創建改進的查詢函數（帶回退機制）
-- ====================================

-- 優化的托盤查詢函數 V2（包含回退到實時查詢）
CREATE OR REPLACE FUNCTION search_pallet_optimized_v2(
    p_search_type TEXT,
    p_search_value TEXT
)
RETURNS TABLE (
    plt_num TEXT,
    product_code TEXT,
    product_qty INTEGER,
    plt_remark TEXT,
    series TEXT,
    current_location TEXT,
    last_update TIMESTAMP,
    is_from_mv BOOLEAN  -- 標記數據來源
) AS $$
DECLARE
    v_needs_refresh BOOLEAN;
    v_result_count INTEGER;
BEGIN
    -- 檢查物化視圖是否需要刷新
    SELECT needs_refresh INTO v_needs_refresh
    FROM mv_refresh_tracking
    WHERE mv_name = 'mv_pallet_current_location';

    -- 首先嘗試從物化視圖查詢
    IF p_search_type = 'series' THEN
        RETURN QUERY
        SELECT
            mv.plt_num,
            mv.product_code,
            mv.product_qty,
            mv.plt_remark,
            mv.series,
            mv.current_location,
            mv.last_update,
            TRUE as is_from_mv
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
            mv.last_update,
            TRUE as is_from_mv
        FROM mv_pallet_current_location mv
        WHERE mv.plt_num = p_search_value;
    END IF;

    -- 檢查是否找到結果
    GET DIAGNOSTICS v_result_count = ROW_COUNT;

    -- 如果沒找到結果且物化視圖需要刷新，回退到實時查詢
    IF v_result_count = 0 AND v_needs_refresh THEN
        -- 實時查詢 record_palletinfo
        IF p_search_type = 'series' THEN
            RETURN QUERY
            WITH latest_history AS (
                SELECT DISTINCT ON (h.plt_num)
                    h.plt_num,
                    h.loc as current_location,
                    h.time as last_update
                FROM record_history h
                INNER JOIN record_palletinfo p ON h.plt_num = p.plt_num
                WHERE p.series = p_search_value
                ORDER BY h.plt_num, h.time DESC
            )
            SELECT
                p.plt_num,
                p.product_code,
                p.product_qty,
                p.plt_remark,
                p.series,
                COALESCE(h.current_location, 'Await') as current_location,
                h.last_update,
                FALSE as is_from_mv  -- 標記來自實時查詢
            FROM record_palletinfo p
            LEFT JOIN latest_history h ON p.plt_num = h.plt_num
            WHERE p.series = p_search_value;
        ELSE
            RETURN QUERY
            WITH latest_history AS (
                SELECT DISTINCT ON (h.plt_num)
                    h.plt_num,
                    h.loc as current_location,
                    h.time as last_update
                FROM record_history h
                WHERE h.plt_num = p_search_value
                ORDER BY h.plt_num, h.time DESC
            )
            SELECT
                p.plt_num,
                p.product_code,
                p.product_qty,
                p.plt_remark,
                p.series,
                COALESCE(h.current_location, 'Await') as current_location,
                h.last_update,
                FALSE as is_from_mv
            FROM record_palletinfo p
            LEFT JOIN latest_history h ON p.plt_num = h.plt_num
            WHERE p.plt_num = p_search_value;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 3. 創建智能刷新函數
-- ====================================

-- 智能刷新函數：只在需要時刷新
CREATE OR REPLACE FUNCTION smart_refresh_mv()
RETURNS void AS $$
DECLARE
    v_needs_refresh BOOLEAN;
    v_last_refresh TIMESTAMP;
    v_minutes_since_refresh INTEGER;
BEGIN
    -- 獲取刷新狀態
    SELECT needs_refresh, last_refresh
    INTO v_needs_refresh, v_last_refresh
    FROM mv_refresh_tracking
    WHERE mv_name = 'mv_pallet_current_location';

    -- 計算距離上次刷新的時間（分鐘）
    v_minutes_since_refresh := EXTRACT(EPOCH FROM (NOW() - v_last_refresh)) / 60;

    -- 如果需要刷新，或者超過5分鐘沒刷新，則執行刷新
    IF v_needs_refresh OR v_minutes_since_refresh > 5 THEN
        -- 刷新物化視圖
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pallet_current_location;

        -- 更新追蹤記錄
        UPDATE mv_refresh_tracking
        SET needs_refresh = FALSE,
            last_refresh = NOW()
        WHERE mv_name = 'mv_pallet_current_location';

        RAISE NOTICE '物化視圖已刷新';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 4. 創建後台定期刷新作業
-- ====================================

-- 使用 pg_cron 創建定期刷新作業（如果已安裝）
-- 每分鐘檢查並刷新（如果需要）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- 刪除舊作業
        PERFORM cron.unschedule('refresh-pallet-mv');

        -- 創建新作業
        PERFORM cron.schedule(
            'refresh-pallet-mv',
            '* * * * *',  -- 每分鐘
            'SELECT smart_refresh_mv();'
        );

        RAISE NOTICE 'pg_cron 作業已創建';
    ELSE
        RAISE NOTICE 'pg_cron 未安裝，請手動定期執行 smart_refresh_mv()';
    END IF;
END $$;

-- ====================================
-- 5. 提供手動同步函數
-- ====================================

-- 強制同步函數（供緊急使用）
CREATE OR REPLACE FUNCTION force_sync_pallet_mv()
RETURNS TEXT AS $$
BEGIN
    -- 立即刷新物化視圖
    REFRESH MATERIALIZED VIEW mv_pallet_current_location;

    -- 重置追蹤狀態
    UPDATE mv_refresh_tracking
    SET needs_refresh = FALSE,
        last_refresh = NOW()
    WHERE mv_name = 'mv_pallet_current_location';

    RETURN '物化視圖已強制同步完成';
END;
$$ LANGUAGE plpgsql;

-- 授權給應用程序使用
GRANT EXECUTE ON FUNCTION search_pallet_optimized_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION smart_refresh_mv TO authenticated;
GRANT EXECUTE ON FUNCTION force_sync_pallet_mv TO authenticated;
