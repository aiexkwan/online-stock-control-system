-- =====================================================
-- 快速部署腳本 - 修復物化視圖新增托盤追蹤問題
--
-- 使用方法：
-- 1. 登入 Supabase Dashboard
-- 2. 進入 SQL Editor
-- 3. 複製並執行此腳本
-- =====================================================

-- 1. 添加托盤表觸發器
DROP TRIGGER IF EXISTS trg_palletinfo_mv_refresh ON record_palletinfo;
CREATE TRIGGER trg_palletinfo_mv_refresh
AFTER INSERT OR UPDATE ON record_palletinfo
FOR EACH STATEMENT
EXECUTE FUNCTION mark_mv_needs_refresh();

-- 2. 創建 V2 查詢函數（包含回退機制）
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
    is_from_mv BOOLEAN
) AS $$
DECLARE
    v_needs_refresh BOOLEAN;
    v_result_count INTEGER;
BEGIN
    -- 檢查是否需要刷新
    SELECT needs_refresh INTO v_needs_refresh
    FROM mv_refresh_tracking
    WHERE mv_name = 'mv_pallet_current_location';

    -- 從物化視圖查詢
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

    GET DIAGNOSTICS v_result_count = ROW_COUNT;

    -- 如果沒找到且需要刷新，使用實時查詢
    IF v_result_count = 0 AND v_needs_refresh THEN
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
                FALSE as is_from_mv
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

-- 3. 創建智能刷新函數
CREATE OR REPLACE FUNCTION smart_refresh_mv()
RETURNS void AS $$
DECLARE
    v_needs_refresh BOOLEAN;
    v_last_refresh TIMESTAMP;
    v_minutes_since_refresh INTEGER;
BEGIN
    SELECT needs_refresh, last_refresh
    INTO v_needs_refresh, v_last_refresh
    FROM mv_refresh_tracking
    WHERE mv_name = 'mv_pallet_current_location';

    v_minutes_since_refresh := EXTRACT(EPOCH FROM (NOW() - v_last_refresh)) / 60;

    IF v_needs_refresh OR v_minutes_since_refresh > 5 THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pallet_current_location;

        UPDATE mv_refresh_tracking
        SET needs_refresh = FALSE,
            last_refresh = NOW()
        WHERE mv_name = 'mv_pallet_current_location';

        RAISE NOTICE '物化視圖已刷新';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建強制同步函數
CREATE OR REPLACE FUNCTION force_sync_pallet_mv()
RETURNS TEXT AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_pallet_current_location;

    UPDATE mv_refresh_tracking
    SET needs_refresh = FALSE,
        last_refresh = NOW()
    WHERE mv_name = 'mv_pallet_current_location';

    RETURN '物化視圖已強制同步完成';
END;
$$ LANGUAGE plpgsql;

-- 5. 授權
GRANT EXECUTE ON FUNCTION search_pallet_optimized_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION smart_refresh_mv TO authenticated;
GRANT EXECUTE ON FUNCTION force_sync_pallet_mv TO authenticated;

-- 6. 立即執行一次智能刷新
SELECT smart_refresh_mv();

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '================================';
    RAISE NOTICE '部署完成！';
    RAISE NOTICE '新增托盤現在會自動標記視圖需要刷新';
    RAISE NOTICE '查詢時會智能回退到實時查詢';
    RAISE NOTICE '================================';
END $$;
