-- Stock Transfer 索引分析和優化腳本
-- 用於檢查現有索引並根據查詢模式創建優化索引

-- ====================================
-- 1. 檢查現有索引
-- ====================================

-- 查看 record_palletinfo 表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'record_palletinfo'
ORDER BY indexname;

-- 查看 record_history 表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'record_history'
ORDER BY indexname;

-- 查看 record_transfer 表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'record_transfer'
ORDER BY indexname;

-- 查看 record_inventory 表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'record_inventory'
ORDER BY indexname;

-- 查看 data_id 表的索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'data_id'
ORDER BY indexname;

-- ====================================
-- 2. 分析查詢模式
-- ====================================

-- Stock Transfer 主要查詢模式：
-- a) 根據 plt_num 查詢托盤信息
-- b) 根據 series 查詢托盤信息
-- c) 根據 plt_num 查詢最新位置（從 record_history）
-- d) 插入轉移記錄到 record_history 和 record_transfer
-- e) 根據 operator_id (data_id.id) 驗證員工

-- ====================================
-- 3. 創建優化索引
-- ====================================

-- 3.1 record_palletinfo 表索引
-- 托盤號查詢索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_palletinfo_plt_num
ON record_palletinfo(plt_num);

-- 系列號查詢索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_palletinfo_series
ON record_palletinfo(series)
WHERE series IS NOT NULL;

-- 複合索引：用於同時獲取托盤信息
CREATE INDEX IF NOT EXISTS idx_palletinfo_plt_series_info
ON record_palletinfo(plt_num, series, product_code, product_qty);

-- 3.2 record_history 表索引
-- 托盤號+時間複合索引（用於查詢最新位置）
CREATE INDEX IF NOT EXISTS idx_history_plt_time_desc
ON record_history(plt_num, time DESC);

-- 位置索引（用於統計和分析）
CREATE INDEX IF NOT EXISTS idx_history_loc
ON record_history(loc)
WHERE loc IS NOT NULL;

-- 3.3 record_transfer 表索引
-- 托盤號索引
CREATE INDEX IF NOT EXISTS idx_transfer_plt_num
ON record_transfer(plt_num);

-- 操作員索引
CREATE INDEX IF NOT EXISTS idx_transfer_operator_id
ON record_transfer(operator_id);

-- 日期索引（用於查詢歷史記錄）
CREATE INDEX IF NOT EXISTS idx_transfer_tran_date
ON record_transfer(tran_date DESC);

-- 3.4 record_inventory 表索引
-- 產品代碼索引
CREATE INDEX IF NOT EXISTS idx_inventory_product_code
ON record_inventory(product_code);

-- 托盤號索引
CREATE INDEX IF NOT EXISTS idx_inventory_plt_num
ON record_inventory(plt_num);

-- 更新時間索引
CREATE INDEX IF NOT EXISTS idx_inventory_latest_update
ON record_inventory(latest_update DESC);

-- 3.5 data_id 表索引
-- ID 索引（主鍵應該已經有索引，但確認一下）
CREATE INDEX IF NOT EXISTS idx_data_id_id
ON data_id(id);

-- ====================================
-- 4. 分析索引使用情況
-- ====================================

-- 查看索引使用統計
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('record_palletinfo', 'record_history', 'record_transfer', 'record_inventory', 'data_id')
ORDER BY tablename, idx_scan DESC;

-- ====================================
-- 5. 查詢執行計劃分析
-- ====================================

-- 分析托盤號查詢
EXPLAIN (ANALYZE, BUFFERS)
SELECT plt_num, product_code, product_qty, plt_remark, series
FROM record_palletinfo
WHERE plt_num = 'PM-20240315-001';

-- 分析系列號查詢
EXPLAIN (ANALYZE, BUFFERS)
SELECT plt_num, product_code, product_qty, plt_remark, series
FROM record_palletinfo
WHERE series = 'A001';

-- 分析歷史位置查詢
EXPLAIN (ANALYZE, BUFFERS)
SELECT loc
FROM record_history
WHERE plt_num = 'PM-20240315-001'
ORDER BY time DESC
LIMIT 1;

-- ====================================
-- 6. 維護建議
-- ====================================

-- 更新統計信息
ANALYZE record_palletinfo;
ANALYZE record_history;
ANALYZE record_transfer;
ANALYZE record_inventory;
ANALYZE data_id;

-- 查看表大小和索引大小
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE tablename IN ('record_palletinfo', 'record_history', 'record_transfer', 'record_inventory', 'data_id')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
