-- 創建 execute_sql_query RPC 函數以支援 OpenAI 生成的 SQL 查詢
-- 這個函數將安全地執行 SELECT 查詢並返回結果

CREATE OR REPLACE FUNCTION execute_sql_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_row RECORD;
    cleaned_query TEXT;
BEGIN
    -- 清理查詢文本
    cleaned_query := TRIM(query_text);
    
    -- 安全檢查：只允許 SELECT 語句
    IF LOWER(cleaned_query) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed. Query must start with SELECT.';
    END IF;
    
    -- 檢查危險關鍵字
    IF LOWER(cleaned_query) ~ '(insert|update|delete|drop|create|alter|truncate|grant|revoke|exec|execute)' THEN
        RAISE EXCEPTION 'Unsafe query detected. Query contains prohibited keywords.';
    END IF;
    
    -- 檢查是否包含分號（防止多語句執行）
    IF cleaned_query ~ ';.*[^[:space:]]' THEN
        RAISE EXCEPTION 'Multiple statements not allowed. Query must be a single SELECT statement.';
    END IF;
    
    -- 移除末尾的分號
    cleaned_query := RTRIM(cleaned_query, ';');
    
    -- 執行查詢並返回結果
    FOR result_row IN EXECUTE cleaned_query
    LOOP
        result := to_jsonb(result_row);
        RETURN NEXT;
    END LOOP;
    
    RETURN;
EXCEPTION
    WHEN OTHERS THEN
        -- 記錄錯誤並重新拋出
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION execute_sql_query(TEXT) TO authenticated;

-- 測試函數
SELECT 'execute_sql_query function created successfully' as status; 