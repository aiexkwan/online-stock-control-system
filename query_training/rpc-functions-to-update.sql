-- 修復重量統計RPC函數
-- 問題：返回類型從 numeric 改為 bigint
-- 解決：先DROP再CREATE以避免返回類型衝突

-- 1. 今天GRN重量統計
DROP FUNCTION IF EXISTS get_today_grn_weight_stats();

CREATE FUNCTION get_today_grn_weight_stats()
RETURNS TABLE(
  total_gross_weight BIGINT,
  total_net_weight BIGINT,
  average_gross_weight BIGINT,
  average_net_weight BIGINT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(COALESCE(rg.gross_weight, 0))::BIGINT as total_gross_weight,
    SUM(COALESCE(rg.net_weight, 0))::BIGINT as total_net_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.gross_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_gross_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.net_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_net_weight,
    COUNT(*)::BIGINT as count
  FROM record_grn rg
  WHERE DATE(rg.creat_time) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 2. 昨天GRN重量統計
DROP FUNCTION IF EXISTS get_yesterday_grn_weight_stats();

CREATE FUNCTION get_yesterday_grn_weight_stats()
RETURNS TABLE(
  total_gross_weight BIGINT,
  total_net_weight BIGINT,
  average_gross_weight BIGINT,
  average_net_weight BIGINT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(COALESCE(rg.gross_weight, 0))::BIGINT as total_gross_weight,
    SUM(COALESCE(rg.net_weight, 0))::BIGINT as total_net_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.gross_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_gross_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.net_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_net_weight,
    COUNT(*)::BIGINT as count
  FROM record_grn rg
  WHERE DATE(rg.creat_time) = CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- 3. 本週GRN重量統計
DROP FUNCTION IF EXISTS get_week_grn_weight_stats();

CREATE FUNCTION get_week_grn_weight_stats()
RETURNS TABLE(
  total_gross_weight BIGINT,
  total_net_weight BIGINT,
  average_gross_weight BIGINT,
  average_net_weight BIGINT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(COALESCE(rg.gross_weight, 0))::BIGINT as total_gross_weight,
    SUM(COALESCE(rg.net_weight, 0))::BIGINT as total_net_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.gross_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_gross_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.net_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_net_weight,
    COUNT(*)::BIGINT as count
  FROM record_grn rg
  WHERE rg.creat_time >= date_trunc('week', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 4. 本月GRN重量統計 (新增)
DROP FUNCTION IF EXISTS get_month_grn_weight_stats();

CREATE FUNCTION get_month_grn_weight_stats()
RETURNS TABLE(
  total_gross_weight BIGINT,
  total_net_weight BIGINT,
  average_gross_weight BIGINT,
  average_net_weight BIGINT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(COALESCE(rg.gross_weight, 0))::BIGINT as total_gross_weight,
    SUM(COALESCE(rg.net_weight, 0))::BIGINT as total_net_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.gross_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_gross_weight,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(COALESCE(rg.net_weight, 0)) / COUNT(*))::BIGINT
      ELSE 0::BIGINT
    END as average_net_weight,
    COUNT(*)::BIGINT as count
  FROM record_grn rg
  WHERE rg.creat_time >= date_trunc('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 5. 需要新增的RPC函數

-- 前天轉移統計
DROP FUNCTION IF EXISTS get_day_before_yesterday_transfer_stats();

CREATE FUNCTION get_day_before_yesterday_transfer_stats()
RETURNS TABLE(transfer_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT as transfer_count
  FROM record_transfer rt
  WHERE DATE(rt.tran_date) = CURRENT_DATE - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;

-- 庫存最少的產品（改進版）
DROP FUNCTION IF EXISTS get_lowest_inventory_products(INTEGER);

CREATE FUNCTION get_lowest_inventory_products(limit_count INTEGER DEFAULT 3)
RETURNS TABLE(
  product_code TEXT,
  total_inventory BIGINT,
  injection_qty BIGINT,
  pipeline_qty BIGINT,
  prebook_qty BIGINT,
  await_qty BIGINT,
  fold_qty BIGINT,
  bulk_qty BIGINT,
  backcarpark_qty BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ri.product_code::TEXT,
    (SUM(COALESCE(ri.injection, 0)) + SUM(COALESCE(ri.pipeline, 0)) + 
     SUM(COALESCE(ri.prebook, 0)) + SUM(COALESCE(ri.await, 0)) + 
     SUM(COALESCE(ri.fold, 0)) + SUM(COALESCE(ri.bulk, 0)) + 
     SUM(COALESCE(ri.backcarpark, 0)))::BIGINT as total_inventory,
    SUM(COALESCE(ri.injection, 0))::BIGINT as injection_qty,
    SUM(COALESCE(ri.pipeline, 0))::BIGINT as pipeline_qty,
    SUM(COALESCE(ri.prebook, 0))::BIGINT as prebook_qty,
    SUM(COALESCE(ri.await, 0))::BIGINT as await_qty,
    SUM(COALESCE(ri.fold, 0))::BIGINT as fold_qty,
    SUM(COALESCE(ri.bulk, 0))::BIGINT as bulk_qty,
    SUM(COALESCE(ri.backcarpark, 0))::BIGINT as backcarpark_qty
  FROM record_inventory ri
  WHERE ri.product_code IS NOT NULL AND ri.product_code != ''
  GROUP BY ri.product_code
  HAVING (SUM(COALESCE(ri.injection, 0)) + SUM(COALESCE(ri.pipeline, 0)) + 
          SUM(COALESCE(ri.prebook, 0)) + SUM(COALESCE(ri.await, 0)) + 
          SUM(COALESCE(ri.fold, 0)) + SUM(COALESCE(ri.bulk, 0)) + 
          SUM(COALESCE(ri.backcarpark, 0))) >= 0
  ORDER BY total_inventory ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 今天非GRN托盤數量
DROP FUNCTION IF EXISTS get_today_non_grn_pallet_count();

CREATE FUNCTION get_today_non_grn_pallet_count()
RETURNS BIGINT AS $$
DECLARE
  result_count BIGINT;
BEGIN
  SELECT COUNT(*)::BIGINT INTO result_count
  FROM record_palletinfo rp
  WHERE DATE(rp.generate_time) = CURRENT_DATE
  AND rp.plt_num NOT IN (
    SELECT DISTINCT plt_num 
    FROM record_grn 
    WHERE DATE(creat_time) = CURRENT_DATE
  );
  
  RETURN COALESCE(result_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 本週GRN托盤統計（修正版）
DROP FUNCTION IF EXISTS get_week_grn_pallet_count();

CREATE FUNCTION get_week_grn_pallet_count()
RETURNS BIGINT AS $$
DECLARE
  result_count BIGINT;
BEGIN
  SELECT COUNT(*)::BIGINT INTO result_count
  FROM record_grn rg
  WHERE rg.creat_time >= date_trunc('week', CURRENT_DATE);
  
  RETURN COALESCE(result_count, 0);
END;
$$ LANGUAGE plpgsql; 