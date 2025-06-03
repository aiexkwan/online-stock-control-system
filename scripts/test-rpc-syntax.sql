-- 測試 RPC 函數語法 - 可以直接在 Supabase SQL Editor 中執行

-- 首先測試最關鍵的複雜條件托盤查詢函數
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

-- 授予執行權限
GRANT EXECUTE ON FUNCTION get_pallet_count_complex(TEXT, TEXT, TEXT) TO authenticated;

-- 測試函數是否工作
SELECT 'Function created successfully, testing...' as status;

-- 測試 1: 所有托盤計數
SELECT 'Test 1: All pallets' as test_name, count FROM get_pallet_count_complex('', '', '');

-- 測試 2: 今天的托盤
SELECT 'Test 2: Today pallets' as test_name, count FROM get_pallet_count_complex('DATE(generate_time) = CURRENT_DATE', '', '');

-- 測試 3: 今天排除GRN的托盤（關鍵測試）
SELECT 'Test 3: Today non-GRN pallets (CRITICAL)' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = CURRENT_DATE', 
    '(plt_remark IS NULL OR plt_remark NOT LIKE ''%Material GRN%'')', 
    ''
);

-- 測試 4: 今天GRN托盤
SELECT 'Test 4: Today GRN pallets' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = CURRENT_DATE', 
    'plt_remark LIKE ''%Material GRN%''', 
    ''
);

-- 顯示測試完成
SELECT 'All tests completed. Check the results above.' as final_status; 