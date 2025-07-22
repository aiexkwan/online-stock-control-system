-- RPC function to analyze inventory vs order demand
-- This function provides comprehensive inventory analysis with order demand comparison
CREATE OR REPLACE FUNCTION rpc_get_inventory_ordered_analysis(
  p_product_codes text[] DEFAULT NULL,
  p_product_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
  v_start_time timestamp;
  v_end_time timestamp;
BEGIN
  v_start_time := clock_timestamp();

  -- Create temporary table for analysis
  CREATE TEMP TABLE IF NOT EXISTS temp_inventory_analysis ON COMMIT DROP AS
  WITH latest_stock AS (
    -- Get latest stock levels using window function for performance
    SELECT DISTINCT ON (sl.stock)
      sl.stock as product_code,
      sl.description as product_description,
      sl.stock_level as current_stock,
      sl.update_time,
      dc.type as product_type,
      dc.colour as product_colour
    FROM stock_level sl
    LEFT JOIN data_code dc ON sl.stock = dc.code
    WHERE 1=1
      AND (p_product_codes IS NULL OR sl.stock = ANY(p_product_codes))
      AND (p_product_type IS NULL OR dc.type = p_product_type)
    ORDER BY sl.stock, sl.update_time DESC
  ),
  order_demand AS (
    -- Calculate order demand (product_qty - loaded_qty)
    SELECT
      product_code,
      SUM(CAST(product_qty AS bigint) - CAST(loaded_qty AS bigint)) as order_demand
    FROM data_order
    WHERE 1=1
      AND (CAST(product_qty AS bigint) - CAST(loaded_qty AS bigint)) > 0
      AND (p_product_codes IS NULL OR product_code = ANY(p_product_codes))
    GROUP BY product_code
    HAVING SUM(CAST(product_qty AS bigint) - CAST(loaded_qty AS bigint)) > 0
  ),
  analysis AS (
    -- Combine stock and demand data
    SELECT
      ls.product_code,
      ls.product_description,
      ls.product_type,
      ls.product_colour,
      COALESCE(ls.current_stock, 0) as current_stock,
      COALESCE(od.order_demand, 0) as order_demand,
      COALESCE(ls.current_stock, 0) - COALESCE(od.order_demand, 0) as remaining_stock,
      CASE
        WHEN COALESCE(od.order_demand, 0) = 0 THEN 100
        WHEN COALESCE(ls.current_stock, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(ls.current_stock, 0)::numeric / COALESCE(od.order_demand, 0)::numeric) * 100, 2)
      END as fulfillment_rate,
      (COALESCE(ls.current_stock, 0) - COALESCE(od.order_demand, 0)) >= 0 as is_sufficient,
      ls.update_time
    FROM latest_stock ls
    INNER JOIN order_demand od ON ls.product_code = od.product_code
  )
  SELECT * FROM analysis;

  -- Build result JSON
  WITH products_array AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_code', product_code,
        'product_description', product_description,
        'product_type', product_type,
        'product_colour', product_colour,
        'current_stock', current_stock,
        'order_demand', order_demand,
        'remaining_stock', remaining_stock,
        'fulfillment_rate', fulfillment_rate,
        'is_sufficient', is_sufficient,
        'last_updated', update_time
      ) ORDER BY
        is_sufficient ASC,  -- Show insufficient items first
        fulfillment_rate ASC,  -- Then by lowest fulfillment rate
        order_demand DESC  -- Then by highest demand
    ) as products
    FROM temp_inventory_analysis
  ),
  summary_stats AS (
    SELECT
      COUNT(*) as total_products,
      COALESCE(SUM(current_stock), 0) as total_stock,
      COALESCE(SUM(order_demand), 0) as total_demand,
      COALESCE(SUM(remaining_stock), 0) as total_remaining,
      COALESCE(SUM(CASE WHEN is_sufficient THEN 1 ELSE 0 END), 0) as sufficient_count,
      COALESCE(SUM(CASE WHEN NOT is_sufficient THEN 1 ELSE 0 END), 0) as insufficient_count,
      COALESCE(SUM(remaining_stock), 0) >= 0 as overall_sufficient,
      CASE
        WHEN COALESCE(SUM(order_demand), 0) = 0 THEN 100
        ELSE ROUND((COALESCE(SUM(current_stock), 0)::numeric / COALESCE(SUM(order_demand), 0)::numeric) * 100, 2)
      END as overall_fulfillment_rate
    FROM temp_inventory_analysis
  )
  SELECT jsonb_build_object(
    'products', COALESCE(products_array.products, '[]'::jsonb),
    'summary', jsonb_build_object(
      'total_products', summary_stats.total_products,
      'total_stock', summary_stats.total_stock,
      'total_demand', summary_stats.total_demand,
      'total_remaining', summary_stats.total_remaining,
      'sufficient_count', summary_stats.sufficient_count,
      'insufficient_count', summary_stats.insufficient_count,
      'overall_sufficient', summary_stats.overall_sufficient,
      'overall_fulfillment_rate', summary_stats.overall_fulfillment_rate
    ),
    'metadata', jsonb_build_object(
      'execution_time_ms', EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time)),
      'filters_applied', jsonb_build_object(
        'product_codes', p_product_codes,
        'product_type', p_product_type
      ),
      'generated_at', NOW()
    )
  ) INTO v_result
  FROM products_array, summary_stats;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
      'products', '[]'::jsonb,
      'summary', jsonb_build_object(
        'total_products', 0,
        'total_stock', 0,
        'total_demand', 0,
        'total_remaining', 0,
        'sufficient_count', 0,
        'insufficient_count', 0,
        'overall_sufficient', false,
        'overall_fulfillment_rate', 0
      ),
      'metadata', jsonb_build_object(
        'error', true,
        'error_message', SQLERRM,
        'error_detail', SQLSTATE,
        'generated_at', NOW()
      )
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_get_inventory_ordered_analysis(text[], text) TO authenticated;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_stock_level_stock_update_time ON stock_level(stock, update_time DESC);
CREATE INDEX IF NOT EXISTS idx_data_order_product_code ON data_order(product_code);
CREATE INDEX IF NOT EXISTS idx_data_order_qty_loaded ON data_order((CAST(product_qty AS bigint) - CAST(loaded_qty AS bigint)));
CREATE INDEX IF NOT EXISTS idx_data_code_type ON data_code(type);

-- Add comment
COMMENT ON FUNCTION rpc_get_inventory_ordered_analysis(text[], text) IS
'Analyzes inventory levels against order demands. Returns products with demand, their current stock levels,
fulfillment rates, and whether stock is sufficient. Includes comprehensive summary statistics.';
