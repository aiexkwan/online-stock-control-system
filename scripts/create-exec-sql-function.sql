-- 創建執行 SQL 語句的函數
CREATE OR REPLACE FUNCTION exec_sql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;

-- 授予權限
GRANT EXECUTE ON FUNCTION exec_sql TO anon;
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated; 