-- Create RPC function for inventory ordered analysis
-- This function analyzes inventory levels against outstanding orders

CREATE OR REPLACE FUNCTION rpc_get_inventory_ordered_analysis(
    p_product_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    WITH
    -- Aggregate inventory by product code
    inventory_summary AS (
        SELECT
            product_code,
            SUM(
                COALESCE(injection, 0) +
                COALESCE(pipeline, 0) +
                COALESCE(prebook, 0) +
                COALESCE(await, 0) +
                COALESCE(fold, 0) +
                COALESCE(bulk, 0) +
                COALESCE(backcarpark, 0) +
                COALESCE(damage, 0) +
                COALESCE(await_grn, 0)
            ) AS total_inventory,
            -- Location breakdown for additional insights
            SUM(COALESCE(injection, 0)) AS qty_injection,
            SUM(COALESCE(pipeline, 0)) AS qty_pipeline,
            SUM(COALESCE(prebook, 0)) AS qty_prebook,
            SUM(COALESCE(await, 0)) AS qty_await,
            SUM(COALESCE(fold, 0)) AS qty_fold,
            SUM(COALESCE(bulk, 0)) AS qty_bulk,
            SUM(COALESCE(backcarpark, 0)) AS qty_backcarpark,
            SUM(COALESCE(damage, 0)) AS qty_damage,
            SUM(COALESCE(await_grn, 0)) AS qty_await_grn,
            MAX(latest_update) AS last_inventory_update
        FROM record_inventory
        WHERE product_code IS NOT NULL
        AND product_code != ''
        GROUP BY product_code
    ),
    -- Aggregate outstanding orders by product code
    order_summary AS (
        SELECT
            product_code,
            COUNT(*) AS total_orders,
            SUM(
                CASE
                    -- Handle loaded_qty as text (convert to numeric for comparison)
                    WHEN loaded_qty IS NULL OR loaded_qty = '' OR loaded_qty = '0' THEN product_qty
                    WHEN CAST(loaded_qty AS numeric) < product_qty THEN product_qty - CAST(loaded_qty AS numeric)
                    ELSE 0
                END
            ) AS total_outstanding_qty,
            SUM(product_qty) AS total_ordered_qty,
            SUM(
                CASE
                    WHEN loaded_qty IS NULL OR loaded_qty = '' OR loaded_qty = '0' THEN 0
                    ELSE CAST(loaded_qty AS numeric)
                END
            ) AS total_loaded_qty
        FROM data_order
        WHERE product_code IS NOT NULL
        AND product_code != ''
        GROUP BY product_code
    ),
    -- Combine with product master data
    analysis AS (
        SELECT
            COALESCE(i.product_code, o.product_code, c.code) AS product_code,
            c.description AS product_description,
            c.type AS product_type,
            c.standard_qty,
            -- Inventory data
            COALESCE(i.total_inventory, 0) AS total_inventory,
            i.qty_injection,
            i.qty_pipeline,
            i.qty_prebook,
            i.qty_await,
            i.qty_fold,
            i.qty_bulk,
            i.qty_backcarpark,
            i.qty_damage,
            i.qty_await_grn,
            i.last_inventory_update,
            -- Order data
            COALESCE(o.total_orders, 0) AS total_orders,
            COALESCE(o.total_outstanding_qty, 0) AS total_outstanding_qty,
            COALESCE(o.total_ordered_qty, 0) AS total_ordered_qty,
            COALESCE(o.total_loaded_qty, 0) AS total_loaded_qty,
            -- Analysis metrics
            CASE
                WHEN COALESCE(o.total_outstanding_qty, 0) = 0 THEN 100
                ELSE ROUND((COALESCE(i.total_inventory, 0)::numeric / o.total_outstanding_qty::numeric) * 100, 2)
            END AS fulfillment_rate,
            COALESCE(i.total_inventory, 0) - COALESCE(o.total_outstanding_qty, 0) AS inventory_gap,
            -- Status classification
            CASE
                WHEN COALESCE(i.total_inventory, 0) = 0 AND COALESCE(o.total_outstanding_qty, 0) > 0 THEN 'Out of Stock'
                WHEN COALESCE(i.total_inventory, 0) >= COALESCE(o.total_outstanding_qty, 0) THEN 'Sufficient'
                WHEN COALESCE(i.total_inventory, 0) > 0 AND COALESCE(i.total_inventory, 0) < COALESCE(o.total_outstanding_qty, 0) THEN 'Insufficient'
                ELSE 'No Orders'
            END AS status
        FROM inventory_summary i
        FULL OUTER JOIN order_summary o ON i.product_code = o.product_code
        LEFT JOIN data_code c ON COALESCE(i.product_code, o.product_code) = c.code
        WHERE
            -- Filter by product type if specified
            (p_product_type IS NULL OR c.type = p_product_type)
            -- Include only products with inventory or orders
            AND (i.total_inventory > 0 OR o.total_outstanding_qty > 0)
    )
    SELECT jsonb_build_object(
        'success', true,
        'summary', jsonb_build_object(
            'total_products', COUNT(DISTINCT product_code),
            'total_inventory_value', SUM(total_inventory),
            'total_outstanding_orders_value', SUM(total_outstanding_qty),
            'overall_fulfillment_rate',
                CASE
                    WHEN SUM(total_outstanding_qty) = 0 THEN 100
                    ELSE ROUND((SUM(total_inventory)::numeric / SUM(total_outstanding_qty)::numeric) * 100, 2)
                END,
            'products_sufficient', COUNT(*) FILTER (WHERE status = 'Sufficient'),
            'products_insufficient', COUNT(*) FILTER (WHERE status = 'Insufficient'),
            'products_out_of_stock', COUNT(*) FILTER (WHERE status = 'Out of Stock'),
            'products_no_orders', COUNT(*) FILTER (WHERE status = 'No Orders')
        ),
        'data', jsonb_agg(
            jsonb_build_object(
                'product_code', product_code,
                'product_description', product_description,
                'product_type', product_type,
                'standard_qty', standard_qty,
                'inventory', jsonb_build_object(
                    'total', total_inventory,
                    'locations', jsonb_build_object(
                        'injection', qty_injection,
                        'pipeline', qty_pipeline,
                        'prebook', qty_prebook,
                        'await', qty_await,
                        'fold', qty_fold,
                        'bulk', qty_bulk,
                        'backcarpark', qty_backcarpark,
                        'damage', qty_damage,
                        'await_grn', qty_await_grn
                    ),
                    'last_update', last_inventory_update
                ),
                'orders', jsonb_build_object(
                    'total_orders', total_orders,
                    'total_ordered_qty', total_ordered_qty,
                    'total_loaded_qty', total_loaded_qty,
                    'total_outstanding_qty', total_outstanding_qty
                ),
                'analysis', jsonb_build_object(
                    'fulfillment_rate', fulfillment_rate,
                    'inventory_gap', inventory_gap,
                    'status', status
                )
            ) ORDER BY
                CASE status
                    WHEN 'Out of Stock' THEN 1
                    WHEN 'Insufficient' THEN 2
                    WHEN 'Sufficient' THEN 3
                    ELSE 4
                END,
                inventory_gap ASC
        ),
        'generated_at', NOW()
    ) INTO v_result
    FROM analysis;

    RETURN v_result;
END;
$$;

-- Add comment to describe the function
COMMENT ON FUNCTION rpc_get_inventory_ordered_analysis(text) IS
'Analyzes inventory levels against outstanding orders.
Returns inventory summary, order demand, fulfillment rates, and inventory gaps.
Can filter by product type.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rpc_get_inventory_ordered_analysis(text) TO authenticated;
