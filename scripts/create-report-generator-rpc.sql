-- RPC function for loading unique references for report generation
-- 支援從不同表格和欄位動態加載唯一值

CREATE OR REPLACE FUNCTION rpc_get_report_references(
    p_table_name TEXT,
    p_field_name TEXT,
    p_limit INTEGER DEFAULT 1000,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_query TEXT;
    v_result JSONB;
    v_references TEXT[];
    v_total_count INTEGER;
    v_error_msg TEXT;
BEGIN
    -- 驗證表名和欄位名（防止 SQL injection）
    IF p_table_name NOT IN ('data_order', 'data_grn', 'data_supplier', 'record_transfer') THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', 'Invalid table name',
            'allowed_tables', ARRAY['data_order', 'data_grn', 'data_supplier', 'record_transfer']
        );
    END IF;

    -- 構建動態查詢
    v_query := format(
        'SELECT ARRAY(
            SELECT DISTINCT %I::TEXT
            FROM %I
            WHERE %I IS NOT NULL
            ORDER BY %I
            LIMIT %s OFFSET %s
        )',
        p_field_name,
        p_table_name,
        p_field_name,
        p_field_name,
        p_limit,
        p_offset
    );

    BEGIN
        -- 執行動態查詢
        EXECUTE v_query INTO v_references;

        -- 獲取總數
        v_query := format(
            'SELECT COUNT(DISTINCT %I) FROM %I WHERE %I IS NOT NULL',
            p_field_name,
            p_table_name,
            p_field_name
        );
        EXECUTE v_query INTO v_total_count;

    EXCEPTION WHEN OTHERS THEN
        -- 捕獲錯誤
        v_error_msg := SQLERRM;
        RETURN jsonb_build_object(
            'error', true,
            'message', v_error_msg,
            'table', p_table_name,
            'field', p_field_name
        );
    END;

    -- 構建返回結果
    v_result := jsonb_build_object(
        'references', COALESCE(v_references, ARRAY[]::TEXT[]),
        'total_count', v_total_count,
        'has_more', v_total_count > (p_offset + p_limit),
        'table_name', p_table_name,
        'field_name', p_field_name,
        'limit', p_limit,
        'offset', p_offset,
        'query_time', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER || 'ms',
        'performance', jsonb_build_object(
            'total_time_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER,
            'optimized', true
        )
    );

    RETURN v_result;
END;
$$;

-- 創建索引以優化常見查詢
CREATE INDEX IF NOT EXISTS idx_data_order_order_ref ON data_order(order_ref) WHERE order_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_grn_grn_ref ON data_grn(grn_ref) WHERE grn_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_supplier_supplier_ref ON data_supplier(supplier_ref) WHERE supplier_ref IS NOT NULL;

-- 授權
GRANT EXECUTE ON FUNCTION rpc_get_report_references TO authenticated;
