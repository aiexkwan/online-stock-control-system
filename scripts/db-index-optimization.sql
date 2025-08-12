-- 數據庫索引優化建議
-- 基於 doc_upload 表的使用統計分析

-- 分析結果摘要：
-- ✅ GOOD: idx_doc_upload_created_at (11,264 scans - 高使用率)
-- ✅ GOOD: idx_doc_upload_doc_type_created (58 scans - 適中使用率)
-- ✅ GOOD: doc_upload_pkey (24 scans - 主鍵，必需)
-- ❌ UNUSED: idx_doc_upload_upload_by (0 scans)
-- ❌ UNUSED: idx_doc_upload_doc_name_pattern (0 scans)
-- ❌ UNUSED: idx_doc_upload_doc_type_time (0 scans - 與 idx_doc_upload_doc_type_created 重複)

-- 優化建議：

-- 1. 刪除未使用的索引以節省空間和提高插入性能
-- 注意：在生產環境中執行前，建議先監控一周確認真的沒有使用

-- 刪除 upload_by 索引（未被使用）
-- DROP INDEX IF EXISTS idx_doc_upload_upload_by;

-- 刪除文件名模式索引（未被使用）
-- DROP INDEX IF EXISTS idx_doc_upload_doc_name_pattern;

-- 刪除重複的時間索引（與 idx_doc_upload_doc_type_created 功能重疊）
-- DROP INDEX IF EXISTS idx_doc_upload_doc_type_time;

-- 2. 基於代碼分析，可能需要的新索引

-- 為插入操作優化：doc_name 可能用於重複檢查
CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_name 
ON doc_upload (doc_name) 
WHERE doc_type = 'order';

-- 為查詢優化：按用戶和時間查詢文檔
CREATE INDEX IF NOT EXISTS idx_doc_upload_user_time 
ON doc_upload (upload_by, created_at DESC) 
WHERE doc_type = 'order';

-- 3. 維持現有的有效索引

-- 保持 idx_doc_upload_created_at（高使用率 11,264 scans）
-- 保持 idx_doc_upload_doc_type_created（適中使用率 58 scans）
-- 保持 doc_upload_pkey（主鍵索引，必需）

-- 4. 監控腳本：執行此查詢來監控索引使用情況
/*
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_tup_read > 0 AND idx_tup_fetch::float / idx_tup_read < 0.1 THEN 'INEFFICIENT'
        ELSE 'GOOD'
    END as status,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    ROUND(100.0 * idx_tup_fetch / NULLIF(idx_tup_read, 0), 2) as hit_ratio
FROM pg_stat_user_indexes 
WHERE relname = 'doc_upload'
ORDER BY idx_scan DESC;
*/

-- 5. 空間節省估算
-- 刪除 3 個未使用的索引可節省約 48 kB (16 kB × 3)
-- 這在小表中影響不大，但在大表中會顯著提高插入性能

-- 6. 建議的執行順序：
-- a) 在非繁忙時間執行
-- b) 先監控一周確認索引真的未被使用
-- c) 逐個刪除未使用的索引
-- d) 添加新的優化索引
-- e) 執行 ANALYZE doc_upload; 更新統計信息

-- 7. 回滾計劃（如果需要恢復被刪除的索引）：
/*
-- 恢復 upload_by 索引
CREATE INDEX idx_doc_upload_upload_by ON doc_upload (upload_by);

-- 恢復文件名模式索引  
CREATE INDEX idx_doc_upload_doc_name_pattern ON doc_upload (doc_name text_pattern_ops);

-- 恢復時間索引
CREATE INDEX idx_doc_upload_doc_type_time ON doc_upload (doc_type, created_at DESC);
*/