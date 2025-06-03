-- 創建庫存閾值過濾查詢的 RPC 函數
-- 返回當前實際庫存總量低於指定閾值的產品
-- 修復：正確計算每個位置的當前庫存總量

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
        -- 計算當前實際庫存總量：每個位置的當前庫存總和
        COALESCE(SUM(ri.injection), 0) + 
        COALESCE(SUM(ri.pipeline), 0) + 
        COALESCE(SUM(ri.prebook), 0) + 
        COALESCE(SUM(ri.await), 0) + 
        COALESCE(SUM(ri.fold), 0) + 
        COALESCE(SUM(ri.bulk), 0) + 
        COALESCE(SUM(ri.backcarpark), 0) AS total_inventory,
        -- 每個位置的當前庫存總量
        COALESCE(SUM(ri.injection), 0) AS injection_qty,
        COALESCE(SUM(ri.pipeline), 0) AS pipeline_qty,
        COALESCE(SUM(ri.prebook), 0) AS prebook_qty,
        COALESCE(SUM(ri.await), 0) AS await_qty,
        COALESCE(SUM(ri.fold), 0) AS fold_qty,
        COALESCE(SUM(ri.bulk), 0) AS bulk_qty,
        COALESCE(SUM(ri.backcarpark), 0) AS backcarpark_qty
    FROM record_inventory ri
    WHERE ri.product_code IS NOT NULL 
    AND ri.product_code != ''
    GROUP BY ri.product_code  -- 按產品代碼分組
    HAVING (
        -- 只返回總庫存低於閾值的產品
        COALESCE(SUM(ri.injection), 0) + 
        COALESCE(SUM(ri.pipeline), 0) + 
        COALESCE(SUM(ri.prebook), 0) + 
        COALESCE(SUM(ri.await), 0) + 
        COALESCE(SUM(ri.fold), 0) + 
        COALESCE(SUM(ri.bulk), 0) + 
        COALESCE(SUM(ri.backcarpark), 0)
    ) < threshold_value
    AND (
        -- 確保總庫存是正數（過濾掉計算錯誤的負數庫存）
        COALESCE(SUM(ri.injection), 0) + 
        COALESCE(SUM(ri.pipeline), 0) + 
        COALESCE(SUM(ri.prebook), 0) + 
        COALESCE(SUM(ri.await), 0) + 
        COALESCE(SUM(ri.fold), 0) + 
        COALESCE(SUM(ri.bulk), 0) + 
        COALESCE(SUM(ri.backcarpark), 0)
    ) >= 0
    ORDER BY total_inventory ASC;  -- 最低庫存優先
END;
$$;

-- 設置函數權限
GRANT EXECUTE ON FUNCTION get_products_below_inventory_threshold(bigint) TO anon;
GRANT EXECUTE ON FUNCTION get_products_below_inventory_threshold(bigint) TO authenticated;

-- 測試函數
SELECT 'Products below 100 (Fixed):' AS test_case;
SELECT * FROM get_products_below_inventory_threshold(100) LIMIT 10;

SELECT 'Products below 5000 (to include Z01ATM1):' AS test_case;
SELECT * FROM get_products_below_inventory_threshold(5000) 
WHERE product_code = 'Z01ATM1'; 