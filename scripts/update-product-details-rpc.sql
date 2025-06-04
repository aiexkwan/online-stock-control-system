-- 更新產品詳細資訊 RPC 函數以包含 remark 欄位
-- 這個腳本專門處理 get_product_details_by_code 函數的更新

-- 先刪除現有的函數（如果存在）
DROP FUNCTION IF EXISTS get_product_details_by_code(text);

-- 創建新的函數，包含 remark 欄位
CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
RETURNS TABLE(
    code TEXT,
    description TEXT,
    standard_qty TEXT,
    type TEXT,
    remark TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.code,
        dc.description,
        dc.standard_qty::TEXT,
        dc.type,
        COALESCE(dc.remark, '-') as remark
    FROM data_code dc
    WHERE UPPER(dc.code) = UPPER(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION get_product_details_by_code(TEXT) TO authenticated;

-- 顯示創建結果
SELECT 'Product details RPC function updated successfully with remark field' as status; 