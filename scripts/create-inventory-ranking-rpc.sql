-- 創建庫存排名查詢的 RPC 函數
-- 返回庫存總量最高的指定數量產品代碼

DROP FUNCTION IF EXISTS get_top_products_by_inventory();
DROP FUNCTION IF EXISTS get_top_products_by_inventory(integer);

CREATE OR REPLACE FUNCTION get_top_products_by_inventory(limit_count integer DEFAULT 5)
RETURNS TABLE (
    product_code TEXT,
    total_inventory BIGINT,
    injection_qty BIGINT,
    pipeline_qty BIGINT,
    prebook_qty BIGINT,
    await_qty BIGINT,
    fold_qty BIGINT,
    bulk_qty BIGINT,
    backcarpark_qty BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 限制查詢數量在合理範圍內
    IF limit_count IS NULL OR limit_count <= 0 THEN
        limit_count := 5;
    END IF;
    
    IF limit_count > 50 THEN
        limit_count := 50;
    END IF;
    
    RETURN QUERY
    SELECT 
        ri.product_code,
        COALESCE(ri.injection, 0) + 
        COALESCE(ri.pipeline, 0) + 
        COALESCE(ri.prebook, 0) + 
        COALESCE(ri.await, 0) + 
        COALESCE(ri.fold, 0) + 
        COALESCE(ri.bulk, 0) + 
        COALESCE(ri.backcarpark, 0) AS total_inventory,
        COALESCE(ri.injection, 0) AS injection_qty,
        COALESCE(ri.pipeline, 0) AS pipeline_qty,
        COALESCE(ri.prebook, 0) AS prebook_qty,
        COALESCE(ri.await, 0) AS await_qty,
        COALESCE(ri.fold, 0) AS fold_qty,
        COALESCE(ri.bulk, 0) AS bulk_qty,
        COALESCE(ri.backcarpark, 0) AS backcarpark_qty
    FROM record_inventory ri
    WHERE ri.product_code IS NOT NULL 
    AND ri.product_code != ''
    ORDER BY total_inventory DESC
    LIMIT limit_count;
END;
$$;

-- 設置函數權限
GRANT EXECUTE ON FUNCTION get_top_products_by_inventory(integer) TO anon;
GRANT EXECUTE ON FUNCTION get_top_products_by_inventory(integer) TO authenticated;

-- 測試函數（不同參數）
SELECT 'Top 3 products:' AS test_case;
SELECT * FROM get_top_products_by_inventory(3);

SELECT 'Top 1 product:' AS test_case;
SELECT * FROM get_top_products_by_inventory(1);

SELECT 'Default top 5:' AS test_case;
SELECT * FROM get_top_products_by_inventory(); 