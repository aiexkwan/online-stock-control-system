# 修復 doc_upload 表 RLS 權限問題

## 問題描述
doc_upload 表已成功建立並有數據，但由於 Row Level Security (RLS) 政策限制，前端應用無法讀取數據。

## 解決方法

### 方法 1：在 Supabase Dashboard 執行 SQL（推薦）

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 複製並執行以下 SQL：

```sql
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
```

### 方法 2：使用 Supabase Dashboard UI

1. 登入 Supabase Dashboard
2. 進入 Authentication > Policies
3. 找到 `doc_upload` 表
4. 點擊 "New Policy"
5. 選擇 "Create a policy from a template"
6. 選擇 "Enable read access for authenticated users"
7. 重複步驟 4-6，選擇 "Enable insert for authenticated users"

### 方法 3：臨時解決方案（僅用於測試）

如果你只是想快速測試，可以暫時禁用 RLS：

```sql
-- 警告：這會讓所有人都能訪問數據，僅用於測試！
ALTER TABLE doc_upload DISABLE ROW LEVEL SECURITY;
```

**重要**：測試完成後記得重新啟用 RLS！

## 驗證修復

執行以下查詢來驗證 RLS 政策是否正確設置：

```sql
-- 查看當前的 RLS 政策
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'doc_upload';
```

應該看到類似以下結果：
- Users can view all uploads (SELECT, authenticated)
- Users can insert uploads (INSERT, authenticated)
- Service role can do anything (ALL, service_role)

## 測試前端應用

1. 刷新你的儀表板頁面
2. 找到 Document Management widget
3. 應該能看到上傳歷史記錄了

如果還是看不到數據，請：
1. 檢查瀏覽器控制台是否有錯誤
2. 點擊 widget 右上角的刷新按鈕
3. 確保你已登入應用