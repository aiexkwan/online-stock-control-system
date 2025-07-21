-- Test script for rpc_get_inventory_ordered_analysis function

-- Test 1: Get all products with order demand
SELECT * FROM rpc_get_inventory_ordered_analysis();

-- Test 2: Filter by specific product codes
SELECT * FROM rpc_get_inventory_ordered_analysis(
  p_product_codes := ARRAY['APBK3M', 'APGY3M', 'APBL3M']
);

-- Test 3: Filter by product type
SELECT * FROM rpc_get_inventory_ordered_analysis(
  p_product_type := 'Slate'
);

-- Test 4: Combined filters
SELECT * FROM rpc_get_inventory_ordered_analysis(
  p_product_codes := ARRAY['APBK3M', 'APGY3M'],
  p_product_type := 'Slate'
);

-- Test 5: Extract only insufficient products
WITH analysis AS (
  SELECT * FROM rpc_get_inventory_ordered_analysis()
)
SELECT
  jsonb_array_elements(analysis->'products') AS product
FROM analysis
WHERE (jsonb_array_elements(analysis->'products')->>'is_sufficient')::boolean = false;

-- Test 6: Get summary statistics only
SELECT
  analysis->'summary' AS summary_stats
FROM rpc_get_inventory_ordered_analysis() AS analysis;

-- Test 7: Performance test with execution time
SELECT
  analysis->'metadata'->>'execution_time_ms' AS execution_time_ms,
  jsonb_array_length(analysis->'products') AS product_count,
  analysis->'summary'->>'total_stock' AS total_stock,
  analysis->'summary'->>'total_demand' AS total_demand
FROM rpc_get_inventory_ordered_analysis() AS analysis;

-- Test 8: Check critical products (fulfillment rate < 50%)
WITH analysis AS (
  SELECT * FROM rpc_get_inventory_ordered_analysis()
),
products AS (
  SELECT jsonb_array_elements(analysis->'products') AS product
  FROM analysis
)
SELECT
  product->>'product_code' AS product_code,
  product->>'product_description' AS description,
  product->>'current_stock' AS current_stock,
  product->>'order_demand' AS order_demand,
  product->>'fulfillment_rate' AS fulfillment_rate
FROM products
WHERE (product->>'fulfillment_rate')::numeric < 50
ORDER BY (product->>'fulfillment_rate')::numeric;

-- Test 9: Group by product type
WITH analysis AS (
  SELECT * FROM rpc_get_inventory_ordered_analysis()
),
products AS (
  SELECT jsonb_array_elements(analysis->'products') AS product
  FROM analysis
)
SELECT
  COALESCE(product->>'product_type', 'Unknown') AS product_type,
  COUNT(*) AS product_count,
  SUM((product->>'current_stock')::numeric) AS total_stock,
  SUM((product->>'order_demand')::numeric) AS total_demand,
  SUM(CASE WHEN (product->>'is_sufficient')::boolean THEN 1 ELSE 0 END) AS sufficient_count,
  SUM(CASE WHEN NOT (product->>'is_sufficient')::boolean THEN 1 ELSE 0 END) AS insufficient_count
FROM products
GROUP BY product->>'product_type'
ORDER BY insufficient_count DESC;

-- Test 10: Validate data consistency
WITH stock_check AS (
  SELECT
    sl.stock,
    sl.stock_level,
    COALESCE(SUM(CAST(do.product_qty AS bigint) - CAST(do.loaded_qty AS bigint)), 0) AS order_demand
  FROM stock_level sl
  LEFT JOIN data_order do ON sl.stock = do.product_code
    AND (CAST(do.product_qty AS bigint) - CAST(do.loaded_qty AS bigint)) > 0
  WHERE sl.stock IN ('APBK3M', 'APGY3M')
  GROUP BY sl.stock, sl.stock_level
),
rpc_check AS (
  SELECT
    product->>'product_code' AS product_code,
    (product->>'current_stock')::bigint AS current_stock,
    (product->>'order_demand')::bigint AS order_demand
  FROM (
    SELECT jsonb_array_elements(analysis->'products') AS product
    FROM rpc_get_inventory_ordered_analysis(
      p_product_codes := ARRAY['APBK3M', 'APGY3M']
    ) AS analysis
  ) AS products
)
SELECT
  sc.stock,
  sc.stock_level AS actual_stock,
  rc.current_stock AS rpc_stock,
  sc.order_demand AS actual_demand,
  rc.order_demand AS rpc_demand,
  CASE
    WHEN sc.stock_level = rc.current_stock AND sc.order_demand = rc.order_demand
    THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS validation_status
FROM stock_check sc
JOIN rpc_check rc ON sc.stock = rc.product_code;
