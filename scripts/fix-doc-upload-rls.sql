-- 修復 doc_upload 表的 RLS 政策
-- 允許已認證用戶讀取和插入記錄

-- 首先禁用 RLS（如果已啟用）
ALTER TABLE doc_upload DISABLE ROW LEVEL SECURITY;

-- 重新啟用 RLS
ALTER TABLE doc_upload ENABLE ROW LEVEL SECURITY;

-- 刪除現有政策（如果存在）
DROP POLICY IF EXISTS "Users can view all uploads" ON doc_upload;
DROP POLICY IF EXISTS "Users can insert uploads" ON doc_upload;
DROP POLICY IF EXISTS "Service role can do anything" ON doc_upload;

-- 創建新的 RLS 政策

-- 1. 允許所有已認證用戶查看所有上傳記錄
CREATE POLICY "Users can view all uploads" ON doc_upload
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. 允許已認證用戶插入記錄
CREATE POLICY "Users can insert uploads" ON doc_upload
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. 允許 service role 完全訪問（用於 API）
CREATE POLICY "Service role can do anything" ON doc_upload
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 測試查詢
SELECT COUNT(*) as total_records FROM doc_upload;

-- 查看當前的 RLS 政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'doc_upload';