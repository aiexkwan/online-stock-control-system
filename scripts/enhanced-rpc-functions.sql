-- 增強版 RPC 函數 - 覆蓋絕大部分查詢場景
-- 這些函數將完全取代 OpenAI SQL 生成

-- ============================================================================
-- 1. 基礎托盤計數函數 (覆蓋 80% 的查詢)
-- ============================================================================

-- 今天托盤總數
CREATE OR REPLACE FUNCTION get_today_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天托盤總數
CREATE OR REPLACE FUNCTION get_yesterday_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 前天托盤總數
CREATE OR REPLACE FUNCTION get_day_before_yesterday_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE - INTERVAL '2 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今天非GRN托盤數
CREATE OR REPLACE FUNCTION get_today_non_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE
            AND (plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天非GRN托盤數
CREATE OR REPLACE FUNCTION get_yesterday_non_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day'
            AND (plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今天GRN托盤數
CREATE OR REPLACE FUNCTION get_today_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE
            AND plt_remark LIKE '%Material GRN%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天GRN托盤數
CREATE OR REPLACE FUNCTION get_yesterday_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day'
            AND plt_remark LIKE '%Material GRN%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. 產品相關函數
-- ============================================================================

-- 先刪除現有的函數（如果存在）
DROP FUNCTION IF EXISTS get_product_details_by_code(text);

-- 根據產品代碼獲取產品詳細資訊 (包含 remark)
CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
RETURNS TABLE(
    code TEXT,
    description TEXT,
    standard_qty TEXT,
    type TEXT,
    remark TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.code,
        dc.description,
        dc.standard_qty::TEXT,
        dc.type,
        COALESCE(dc.remark, '-') as remark
    FROM data_code dc
    WHERE UPPER(dc.code) = UPPER(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 產品托盤統計 (所有時間)
CREATE OR REPLACE FUNCTION get_product_pallet_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT, latest_date TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT,
        MAX(generate_time)
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今天特定產品統計
CREATE OR REPLACE FUNCTION get_today_product_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param)
    AND DATE(generate_time) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天特定產品統計
CREATE OR REPLACE FUNCTION get_yesterday_product_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param)
    AND DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今天特定產品非GRN統計
CREATE OR REPLACE FUNCTION get_today_product_non_grn_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param)
    AND DATE(generate_time) = CURRENT_DATE
    AND (plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GRN 重量統計函數
-- ============================================================================

-- 今天GRN重量統計
CREATE OR REPLACE FUNCTION get_today_grn_weight_stats()
RETURNS TABLE(pallet_count BIGINT, total_net_weight NUMERIC, total_gross_weight NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rp.plt_num)::BIGINT,
        COALESCE(SUM(rg.net_weight), 0),
        COALESCE(SUM(rg.gross_weight), 0)
    FROM record_palletinfo rp
    JOIN record_grn rg ON rp.plt_num = rg.plt_num
    WHERE DATE(rp.generate_time) = CURRENT_DATE
    AND rp.plt_remark LIKE '%Material GRN%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天GRN重量統計
CREATE OR REPLACE FUNCTION get_yesterday_grn_weight_stats()
RETURNS TABLE(pallet_count BIGINT, total_net_weight NUMERIC, total_gross_weight NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rp.plt_num)::BIGINT,
        COALESCE(SUM(rg.net_weight), 0),
        COALESCE(SUM(rg.gross_weight), 0)
    FROM record_palletinfo rp
    JOIN record_grn rg ON rp.plt_num = rg.plt_num
    WHERE DATE(rp.generate_time) = CURRENT_DATE - INTERVAL '1 day'
    AND rp.plt_remark LIKE '%Material GRN%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 本週GRN重量統計
CREATE OR REPLACE FUNCTION get_week_grn_weight_stats()
RETURNS TABLE(pallet_count BIGINT, total_net_weight NUMERIC, total_gross_weight NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rp.plt_num)::BIGINT,
        COALESCE(SUM(rg.net_weight), 0),
        COALESCE(SUM(rg.gross_weight), 0)
    FROM record_palletinfo rp
    JOIN record_grn rg ON rp.plt_num = rg.plt_num
    WHERE rp.generate_time >= CURRENT_DATE - INTERVAL '7 days'
    AND rp.plt_remark LIKE '%Material GRN%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. 庫存位置函數
-- ============================================================================

-- 獲取托盤當前位置
CREATE OR REPLACE FUNCTION get_pallet_current_location(pallet_nums TEXT[])
RETURNS TABLE(plt_num TEXT, current_location TEXT, last_update TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (rh.plt_num) 
        rh.plt_num, 
        rh.loc,
        rh.time
    FROM record_history rh
    WHERE rh.plt_num = ANY(pallet_nums)
    ORDER BY rh.plt_num, rh.time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 各位置庫存統計
CREATE OR REPLACE FUNCTION get_location_inventory_stats()
RETURNS TABLE(location TEXT, pallet_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH latest_locations AS (
        SELECT DISTINCT ON (plt_num) plt_num, loc
        FROM record_history
        ORDER BY plt_num, time DESC
    )
    SELECT loc, COUNT(*)::BIGINT
    FROM latest_locations
    WHERE loc != 'Voided'
    GROUP BY loc
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 特定位置的托盤數量
CREATE OR REPLACE FUNCTION get_location_pallet_count(location_name TEXT)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        WITH latest_locations AS (
            SELECT DISTINCT ON (plt_num) plt_num, loc
            FROM record_history
            ORDER BY plt_num, time DESC
        )
        SELECT COUNT(*)
        FROM latest_locations
        WHERE UPPER(loc) = UPPER(location_name)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. 時間範圍統計函數
-- ============================================================================

-- 本週托盤總數
CREATE OR REPLACE FUNCTION get_week_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE generate_time >= CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 本月托盤總數
CREATE OR REPLACE FUNCTION get_month_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE_TRUNC('month', generate_time) = DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 本週非GRN托盤數
CREATE OR REPLACE FUNCTION get_week_non_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE generate_time >= CURRENT_DATE - INTERVAL '7 days'
            AND (plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. 最新托盤查詢函數
-- ============================================================================

-- 今天最新的N個托盤
CREATE OR REPLACE FUNCTION get_today_latest_pallets(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    plt_num TEXT, 
    product_code TEXT, 
    product_qty INTEGER, 
    generate_time TIMESTAMP,
    plt_remark TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.plt_num,
        rp.product_code,
        rp.product_qty,
        rp.generate_time,
        rp.plt_remark
    FROM record_palletinfo rp
    WHERE DATE(rp.generate_time) = CURRENT_DATE
    ORDER BY rp.generate_time DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 今天特定產品的最新托盤
CREATE OR REPLACE FUNCTION get_today_product_latest_pallets(
    product_code_param TEXT, 
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    plt_num TEXT, 
    product_qty INTEGER, 
    generate_time TIMESTAMP,
    plt_remark TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.plt_num,
        rp.product_qty,
        rp.generate_time,
        rp.plt_remark
    FROM record_palletinfo rp
    WHERE DATE(rp.generate_time) = CURRENT_DATE
    AND UPPER(rp.product_code) = UPPER(product_code_param)
    ORDER BY rp.generate_time DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. 轉移歷史函數
-- ============================================================================

-- 今天的轉移記錄統計
CREATE OR REPLACE FUNCTION get_today_transfer_stats()
RETURNS TABLE(transfer_count BIGINT, unique_pallets BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as transfer_count,
        COUNT(DISTINCT plt_num)::BIGINT as unique_pallets
    FROM record_transfer
    WHERE DATE(tran_date) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 昨天的轉移記錄統計
CREATE OR REPLACE FUNCTION get_yesterday_transfer_stats()
RETURNS TABLE(transfer_count BIGINT, unique_pallets BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as transfer_count,
        COUNT(DISTINCT plt_num)::BIGINT as unique_pallets
    FROM record_transfer
    WHERE DATE(tran_date) = CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 本週的轉移記錄統計
CREATE OR REPLACE FUNCTION get_week_transfer_stats()
RETURNS TABLE(transfer_count BIGINT, unique_pallets BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as transfer_count,
        COUNT(DISTINCT plt_num)::BIGINT as unique_pallets
    FROM record_transfer
    WHERE tran_date >= DATE_TRUNC('week', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 本月的轉移記錄統計
CREATE OR REPLACE FUNCTION get_month_transfer_stats()
RETURNS TABLE(transfer_count BIGINT, unique_pallets BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as transfer_count,
        COUNT(DISTINCT plt_num)::BIGINT as unique_pallets
    FROM record_transfer
    WHERE tran_date >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 特定托盤的轉移歷史
CREATE OR REPLACE FUNCTION get_pallet_transfer_history(pallet_num TEXT)
RETURNS TABLE(
    from_location TEXT,
    to_location TEXT,
    transfer_date TIMESTAMP,
    operator_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.f_loc,
        rt.t_loc,
        rt.tran_date,
        rt.operator_id
    FROM record_transfer rt
    WHERE rt.plt_num = pallet_num
    ORDER BY rt.tran_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. 通用靈活查詢函數 (作為後備)
-- ============================================================================

-- 靈活的托盤計數函數
CREATE OR REPLACE FUNCTION get_flexible_pallet_count(
    date_filter TEXT DEFAULT '',
    grn_filter TEXT DEFAULT '',
    product_filter TEXT DEFAULT '',
    location_filter TEXT DEFAULT ''
)
RETURNS BIGINT AS $$
DECLARE
    sql_query TEXT;
    where_parts TEXT[] := ARRAY[]::TEXT[];
    result_count BIGINT;
BEGIN
    sql_query := 'SELECT COUNT(*) FROM record_palletinfo rp';
    
    -- 需要 JOIN record_history 來獲取位置信息
    IF location_filter IS NOT NULL AND TRIM(location_filter) != '' THEN
        sql_query := sql_query || ' 
            JOIN (
                SELECT DISTINCT ON (plt_num) plt_num, loc
                FROM record_history
                ORDER BY plt_num, time DESC
            ) rh ON rp.plt_num = rh.plt_num';
    END IF;
    
    -- 添加日期條件
    IF date_filter IS NOT NULL AND TRIM(date_filter) != '' THEN
        where_parts := array_append(where_parts, date_filter);
    END IF;
    
    -- 添加GRN條件
    IF grn_filter IS NOT NULL AND TRIM(grn_filter) != '' THEN
        where_parts := array_append(where_parts, grn_filter);
    END IF;
    
    -- 添加產品條件
    IF product_filter IS NOT NULL AND TRIM(product_filter) != '' THEN
        where_parts := array_append(where_parts, product_filter);
    END IF;
    
    -- 添加位置條件
    IF location_filter IS NOT NULL AND TRIM(location_filter) != '' THEN
        where_parts := array_append(where_parts, location_filter);
    END IF;
    
    -- 組合WHERE條件
    IF array_length(where_parts, 1) > 0 THEN
        sql_query := sql_query || ' WHERE ' || array_to_string(where_parts, ' AND ');
    END IF;
    
    -- 執行查詢
    EXECUTE sql_query INTO result_count;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 授予權限
-- ============================================================================

-- 授予所有新函數的執行權限
GRANT EXECUTE ON FUNCTION get_today_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_day_before_yesterday_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_non_grn_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_non_grn_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_grn_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_grn_pallet_count() TO authenticated;

GRANT EXECUTE ON FUNCTION get_product_details_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_pallet_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_product_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_product_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_product_non_grn_stats(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_today_grn_weight_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_grn_weight_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_grn_weight_stats() TO authenticated;

GRANT EXECUTE ON FUNCTION get_pallet_current_location(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_pallet_count(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_week_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_month_pallet_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_non_grn_pallet_count() TO authenticated;

GRANT EXECUTE ON FUNCTION get_today_latest_pallets(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_product_latest_pallets(TEXT, INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION get_today_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_month_transfer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pallet_transfer_history(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_flexible_pallet_count(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 顯示創建結果
SELECT 'Enhanced RPC functions created successfully - Total: 28 functions' as status; 