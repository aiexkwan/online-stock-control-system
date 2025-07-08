-- RPC function for ProductCodeInput - Fast product search
CREATE OR REPLACE FUNCTION search_product_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- 檢查輸入參數
  IF p_code IS NULL OR p_code = '' THEN
    RETURN NULL;
  END IF;

  -- Search for product code using case-insensitive match
  SELECT json_build_object(
    'code', code,
    'description', description,
    'standard_qty', standard_qty,
    'type', type,
    'remark', remark
  ) INTO result
  FROM data_code
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;
  
  -- If no exact match, try partial match
  IF result IS NULL THEN
    SELECT json_build_object(
      'code', code,
      'description', description,
      'standard_qty', standard_qty,
      'type', type,
      'remark', remark
    ) INTO result
    FROM data_code
    WHERE UPPER(code) LIKE UPPER(p_code || '%')
    ORDER BY code
    LIMIT 1;
  END IF;
  
  RETURN result;
END;
$$;

-- 添加註釋
COMMENT ON FUNCTION search_product_code(TEXT) IS '高效率搜索產品代碼，返回產品詳細信息';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_product_code TO authenticated;
GRANT EXECUTE ON FUNCTION search_product_code TO anon;
GRANT EXECUTE ON FUNCTION search_product_code TO service_role; 