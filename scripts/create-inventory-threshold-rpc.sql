-- 創建庫存閾值過濾查詢的 RPC 函數
-- 返回庫存總量低於指定閾值的產品

DROP FUNCTION IF EXISTS get_products_below_inventory_threshold(bigint);

CREATE OR REPLACE FUNCTION get_products_below_inventory_threshold(threshold_value bigint)
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
    -- 確保閾值是有效的
    IF threshold_value IS NULL OR threshold_value < 0 THEN
        threshold_value := 100;  -- 默認閾值
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
    AND (
        COALESCE(ri.injection, 0) + 
        COALESCE(ri.pipeline, 0) + 
        COALESCE(ri.prebook, 0) + 
        COALESCE(ri.await, 0) + 
        COALESCE(ri.fold, 0) + 
        COALESCE(ri.bulk, 0) + 
        COALESCE(ri.backcarpark, 0)
    ) < threshold_value
    ORDER BY total_inventory ASC;  -- 最低庫存優先
END;
$$;

-- 設置函數權限
GRANT EXECUTE ON FUNCTION get_products_below_inventory_threshold(bigint) TO anon;
GRANT EXECUTE ON FUNCTION get_products_below_inventory_threshold(bigint) TO authenticated;

-- 測試函數
SELECT 'Products below 100:' AS test_case;
SELECT * FROM get_products_below_inventory_threshold(100);

SELECT 'Products below 50:' AS test_case;
SELECT * FROM get_products_below_inventory_threshold(50); 