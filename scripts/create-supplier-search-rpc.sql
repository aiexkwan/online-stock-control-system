-- 創建供應商搜索 RPC 函數
-- 此函數用於高效率地搜索供應商代碼
-- 返回供應商代碼和名稱

CREATE OR REPLACE FUNCTION search_supplier_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- 檢查輸入參數
    IF p_code IS NULL OR p_code = '' THEN
        RETURN NULL;
    END IF;

    -- 查詢供應商信息
    SELECT json_build_object(
        'supplier_code', supplier_code,
        'supplier_name', supplier_name
    ) INTO v_result
    FROM data_supplier
    WHERE supplier_code = UPPER(p_code)
    LIMIT 1;

    -- 如果沒有找到結果，返回 NULL
    IF v_result IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN v_result;
END;
$$;

-- 添加註釋
COMMENT ON FUNCTION search_supplier_code(TEXT) IS '高效率搜索供應商代碼，返回供應商代碼和名稱';

-- 授予權限
GRANT EXECUTE ON FUNCTION search_supplier_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_supplier_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_supplier_code(TEXT) TO service_role;
