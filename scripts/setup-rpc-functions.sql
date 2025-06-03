-- 設置 Supabase RPC 函數以支援複雜 SQL 查詢
-- 這些函數將繞過查詢構建器的限制，直接執行原生 SQL

-- 1. 創建通用查詢執行函數
CREATE OR REPLACE FUNCTION execute_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_row RECORD;
BEGIN
    -- 安全檢查：只允許 SELECT 語句
    IF LOWER(TRIM(query_text)) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- 檢查危險關鍵字
    IF LOWER(query_text) ~ '(insert|update|delete|drop|create|alter|truncate|grant|revoke)' THEN
        RAISE EXCEPTION 'Unsafe query detected';
    END IF;
    
    -- 執行查詢並返回結果
    FOR result_row IN EXECUTE query_text
    LOOP
        result := to_jsonb(result_row);
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- 2. 創建專門的計數查詢函數（更安全，更快速）
CREATE OR REPLACE FUNCTION execute_count_query(table_name TEXT, where_conditions TEXT DEFAULT '')
RETURNS TABLE(count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    valid_tables TEXT[] := ARRAY['data_code', 'data_id', 'data_slateinfo', 'data_supplier',
                                'record_aco', 'record_grn', 'record_history', 'record_inventory',
                                'record_palletinfo', 'record_slate', 'record_transfer', 'report_log'];
BEGIN
    -- 驗證表名安全性
    IF NOT (table_name = ANY(valid_tables)) THEN
        RAISE EXCEPTION 'Invalid table name: %', table_name;
    END IF;
    
    -- 構建查詢
    sql_query := 'SELECT COUNT(*) FROM ' || quote_ident(table_name);
    
    -- 添加 WHERE 條件（如果提供）
    IF where_conditions IS NOT NULL AND TRIM(where_conditions) != '' THEN
        -- 基本安全檢查
        IF LOWER(where_conditions) ~ '(insert|update|delete|drop|create|alter|truncate|grant|revoke)' THEN
            RAISE EXCEPTION 'Unsafe WHERE conditions detected';
        END IF;
        
        sql_query := sql_query || ' WHERE ' || where_conditions;
    END IF;
    
    -- 執行查詢
    RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 3. 創建專門的 GRN 重量查詢函數
CREATE OR REPLACE FUNCTION get_grn_weight_stats(date_filter TEXT DEFAULT '')
RETURNS TABLE(
    pallet_count BIGINT,
    total_net_weight NUMERIC,
    total_gross_weight NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
BEGIN
    sql_query := '
        SELECT 
            COUNT(DISTINCT rp.plt_num)::BIGINT as pallet_count,
            COALESCE(SUM(rg.net_weight), 0) as total_net_weight,
            COALESCE(SUM(rg.gross_weight), 0) as total_gross_weight
        FROM record_palletinfo rp
        JOIN record_grn rg ON rp.plt_num = rg.plt_num
        WHERE rp.plt_remark LIKE ''%Material GRN%''
    ';
    
    -- 添加日期過濾條件
    IF date_filter IS NOT NULL AND TRIM(date_filter) != '' THEN
        sql_query := sql_query || ' AND ' || date_filter;
    END IF;
    
    -- 執行查詢
    RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 4. 創建專門的產品聚合查詢函數
CREATE OR REPLACE FUNCTION get_product_stats(product_code_param TEXT)
RETURNS TABLE(
    pallet_count BIGINT,
    total_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as pallet_count,
        COALESCE(SUM(product_qty), 0)::BIGINT as total_quantity
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param);
END;
$$;

-- 5. 創建複雜條件的托盤查詢函數
CREATE OR REPLACE FUNCTION get_pallet_count_complex(
    date_condition TEXT DEFAULT '',
    grn_condition TEXT DEFAULT '',
    product_condition TEXT DEFAULT ''
)
RETURNS TABLE(count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    where_parts TEXT[] := ARRAY[]::TEXT[];
BEGIN
    sql_query := 'SELECT COUNT(*) FROM record_palletinfo';
    
    -- 添加日期條件
    IF date_condition IS NOT NULL AND TRIM(date_condition) != '' THEN
        where_parts := array_append(where_parts, date_condition);
    END IF;
    
    -- 添加GRN條件
    IF grn_condition IS NOT NULL AND TRIM(grn_condition) != '' THEN
        where_parts := array_append(where_parts, grn_condition);
    END IF;
    
    -- 添加產品條件
    IF product_condition IS NOT NULL AND TRIM(product_condition) != '' THEN
        where_parts := array_append(where_parts, product_condition);
    END IF;
    
    -- 組合WHERE條件
    IF array_length(where_parts, 1) > 0 THEN
        sql_query := sql_query || ' WHERE ' || array_to_string(where_parts, ' AND ');
    END IF;
    
    -- 執行查詢
    RETURN QUERY EXECUTE sql_query;
END;
$$;

-- 授予執行權限（根據需要調整）
GRANT EXECUTE ON FUNCTION execute_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_count_query(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grn_weight_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pallet_count_complex(TEXT, TEXT, TEXT) TO authenticated;

-- 顯示創建結果
SELECT 'RPC functions created successfully' as status; 