# 建立 doc_upload 表的步驟

## 方法 1：使用 Supabase Dashboard (推薦)

1. 登入 Supabase Dashboard：https://app.supabase.com
2. 選擇你的專案
3. 點擊左側選單的 "SQL Editor"
4. 複製以下 SQL 並執行：

```sql
-- 建立 doc_upload 表
CREATE TABLE IF NOT EXISTS doc_upload (
    -- 主鍵
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 文檔名稱
    doc_name VARCHAR(255) NOT NULL,
    
    -- 上傳者 ID (關聯到 data_id 表)
    upload_by INTEGER NOT NULL,
    
    -- 文檔類型: 'image', 'spec', 或 'order'
    doc_type VARCHAR(50),
    
    -- 文檔 URL
    doc_url TEXT,
    
    -- 文件大小 (bytes)
    file_size BIGINT,
    
    -- 存儲文件夾
    folder VARCHAR(100),
    
    -- 上傳時間
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_doc_upload_created_at ON doc_upload(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_upload_upload_by ON doc_upload(upload_by);
CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_type ON doc_upload(doc_type);

-- 測試查詢（確認表格建立成功）
SELECT COUNT(*) FROM doc_upload;
```

## 方法 2：使用 Supabase Table Editor

1. 登入 Supabase Dashboard
2. 點擊左側選單的 "Table Editor"
3. 點擊 "New Table" 按鈕
4. 輸入表名：`doc_upload`
5. 添加以下欄位：

| Column Name | Type | Default | Nullable | Primary |
|------------|------|---------|----------|---------|
| uuid | uuid | gen_random_uuid() | No | Yes |
| doc_name | varchar(255) | | No | No |
| upload_by | int4 | | No | No |
| doc_type | varchar(50) | | Yes | No |
| doc_url | text | | Yes | No |
| file_size | int8 | | Yes | No |
| folder | varchar(100) | | Yes | No |
| created_at | timestamptz | now() | No | No |

6. 點擊 "Save" 建立表格

## 驗證表格建立成功

執行以下 SQL 查詢來驗證：

```sql
-- 查看表格結構
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doc_upload'
ORDER BY ordinal_position;

-- 插入測試資料
INSERT INTO doc_upload (doc_name, upload_by, doc_type, doc_url, file_size, folder)
VALUES 
    ('test-document.pdf', 1, 'spec', 'https://example.com/test.pdf', 1024000, 'productSpec'),
    ('stock-image.jpg', 1, 'image', 'https://example.com/image.jpg', 512000, 'stockPic');

-- 查詢測試資料
SELECT * FROM doc_upload ORDER BY created_at DESC;

-- 刪除測試資料（可選）
DELETE FROM doc_upload WHERE doc_name LIKE 'test-%' OR doc_name LIKE 'stock-%';
```

## 注意事項

1. 確保你有建立表格的權限
2. `upload_by` 欄位應該關聯到 `data_id` 表的 `id` 欄位
3. `doc_type` 的值應該是：'image', 'spec', 或 'order'
4. `folder` 的值對應到 Supabase Storage 的文件夾：
   - 'stockPic' - 庫存圖片
   - 'productSpec' - 產品規格文檔
   - 'orderpdf' - 訂單 PDF

## 故障排除

如果遇到錯誤：

1. **權限錯誤**：確保你使用的是有足夠權限的帳號
2. **表格已存在**：先執行 `DROP TABLE IF EXISTS doc_upload;` 來刪除舊表（注意：這會刪除所有資料）
3. **外鍵約束錯誤**：確保 `data_id` 表存在且有 `id` 欄位