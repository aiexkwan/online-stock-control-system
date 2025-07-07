-- RPC functions for Stock Distribution Chart
-- Optimized server-side processing for treemap data

-- Function to get stock distribution data with latest stock levels
CREATE OR REPLACE FUNCTION rpc_get_stock_distribution(
    p_stock_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_total_stock NUMERIC;
    v_chart_colors TEXT[] := ARRAY[
        '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
        '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
        '#a855f7', '#eab308', '#059669', '#2563eb', '#7c3aed',
        '#db2777', '#d97706', '#0891b2', '#ea580c', '#4f46e5'
    ];
BEGIN
    -- Create temporary table for latest stock levels
    CREATE TEMP TABLE temp_latest_stock AS
    WITH latest_stock AS (
        SELECT DISTINCT ON (stock) 
            sl.stock,
            sl.stock_level,
            sl.update_time,
            dc.description,
            dc.type
        FROM stock_level sl
        LEFT JOIN data_code dc ON sl.stock = dc.code
        WHERE sl.stock_level > 0
        ORDER BY sl.stock, sl.update_time DESC
    )
    SELECT * FROM latest_stock;
    
    -- Apply type filter if specified
    IF p_stock_type IS NOT NULL AND p_stock_type != 'all' AND p_stock_type != 'ALL TYPES' THEN
        IF p_stock_type = 'non-material' THEN
            DELETE FROM temp_latest_stock 
            WHERE type IN ('material', 'Material', 'MATERIAL');
        ELSE
            DELETE FROM temp_latest_stock 
            WHERE LOWER(type) != LOWER(p_stock_type);
        END IF;
    END IF;
    
    -- Calculate total stock for percentage calculation
    SELECT SUM(stock_level) INTO v_total_stock FROM temp_latest_stock;
    
    -- Generate treemap data with server-side percentage calculation
    SELECT jsonb_build_object(
        'total_stock', COALESCE(v_total_stock, 0),
        'data', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', stock,
                    'size', stock_level,
                    'value', stock_level,
                    'percentage', ROUND((stock_level / NULLIF(v_total_stock, 0) * 100)::NUMERIC, 2),
                    'color', v_chart_colors[((ROW_NUMBER() OVER (ORDER BY stock_level DESC) - 1) % array_length(v_chart_colors, 1)) + 1],
                    'fill', v_chart_colors[((ROW_NUMBER() OVER (ORDER BY stock_level DESC) - 1) % array_length(v_chart_colors, 1)) + 1],
                    'description', COALESCE(description, '-'),
                    'type', COALESCE(type, '-')
                ) ORDER BY stock_level DESC
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM temp_latest_stock;
    
    -- Clean up
    DROP TABLE temp_latest_stock;
    
    RETURN v_result;
END;
$$;

-- Function to get available stock types
CREATE OR REPLACE FUNCTION rpc_get_stock_types()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'types', COALESCE(
            jsonb_agg(DISTINCT type ORDER BY type),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM data_code
    WHERE type IS NOT NULL 
    AND type != ''
    AND type NOT IN ('-', 'N/A');
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_stock_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_stock_types TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_level_stock_update ON stock_level(stock, update_time DESC);
CREATE INDEX IF NOT EXISTS idx_data_code_type ON data_code(type) WHERE type IS NOT NULL;