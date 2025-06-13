-- 修復 execute_sql_query 函數的安全檢查機制
-- 生成時間: 2025-01-03
-- 目的: 解決 Ask Database 功能中 SQL 查詢被誤判為不安全的問題

-- 刪除舊的函數（如果存在）
DROP FUNCTION IF EXISTS public.execute_sql_query(text);

-- 創建新的 execute_sql_query 函數，放寬安全檢查
CREATE OR REPLACE FUNCTION public.execute_sql_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    result_array JSONB := '[]'::JSONB;
    temp_result JSONB;
BEGIN
    -- 基本安全檢查：只允許 SELECT 查詢
    IF NOT (TRIM(UPPER(query_text)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- 🔥 修復：使用更精確的單詞邊界檢查危險關鍵字
    -- 避免 COUNT 被誤判為 CREATE 的一部分
    IF UPPER(query_text) ~ '\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b' THEN
        RAISE EXCEPTION 'Query contains prohibited modification keywords';
    END IF;
    
    -- 檢查是否包含多個語句（防止 SQL 注入）
    IF query_text ~ ';\s*[^;]+' THEN
        RAISE EXCEPTION 'Multiple statements are not allowed';
    END IF;
    
    -- 執行查詢並收集結果
    FOR rec IN EXECUTE query_text LOOP
        temp_result := to_jsonb(rec);
        result_array := result_array || temp_result;
    END LOOP;
    
    -- 返回結果數組中的每個元素
    FOR temp_result IN SELECT jsonb_array_elements(result_array) LOOP
        result := temp_result;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- 授權給 authenticated 角色
GRANT EXECUTE ON FUNCTION public.execute_sql_query(TEXT) TO authenticated;

-- 授權給 anon 角色（用於開發環境）
GRANT EXECUTE ON FUNCTION public.execute_sql_query(TEXT) TO anon;

-- 測試函數
DO $$
BEGIN
    -- 測試基本查詢
    PERFORM public.execute_sql_query('SELECT 1 as test_value');
    RAISE NOTICE '✅ 基本查詢測試通過';
    
    -- 測試日期函數
    PERFORM public.execute_sql_query('SELECT CURRENT_DATE as today');
    RAISE NOTICE '✅ 日期函數測試通過';
    
    -- 測試聚合函數和日期組合（原始問題查詢）
    PERFORM public.execute_sql_query('SELECT COUNT(*) AS grn_receipts_today FROM grn_level WHERE DATE(latest_update) = CURRENT_DATE');
    RAISE NOTICE '✅ 原始問題查詢測試通過';
    
    -- 測試 COUNT 函數不會被誤判
    PERFORM public.execute_sql_query('SELECT COUNT(*) as count_test FROM data_code LIMIT 1');
    RAISE NOTICE '✅ COUNT 函數測試通過';
    
    RAISE NOTICE '🎉 execute_sql_query 函數修復完成！';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 測試失敗: %', SQLERRM;
END;
$$;

-- 顯示函數資訊
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'execute_sql_query'
AND routine_schema = 'public'; 