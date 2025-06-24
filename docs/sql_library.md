# SQL查詢庫

## 概述

SQL查詢庫包含系統中常用嘅SQL查詢語句，覆蓋表定義、數據查詢、維護任務同診斷工具。呢啲查詢幫助開發人員同管理員有效管理同監控系統。

## 表定義

### 棧板號碼緩衝表
```sql
CREATE TABLE IF NOT EXISTS pallet_number_buffer (
    pallet_number TEXT PRIMARY KEY,
    date_str TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    session_id TEXT
);

-- 索引
CREATE INDEX idx_buffer_date_used ON pallet_number_buffer(date_str, used);
CREATE INDEX idx_buffer_allocated ON pallet_number_buffer(allocated_at);
```

### 每日棧板序列表
```sql
CREATE TABLE IF NOT EXISTS daily_pallet_sequence (
    date_str TEXT PRIMARY KEY,
    current_max INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 訂單裝載表
```sql
CREATE TABLE IF NOT EXISTS order_loading (
    id SERIAL PRIMARY KEY,
    order_ref TEXT NOT NULL,
    plt_num TEXT NOT NULL,
    product_code TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    loaded_by_id INTEGER,
    loaded_by_name TEXT,
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'loaded',
    previous_location TEXT,
    UNIQUE(order_ref, plt_num, product_code, status)
);

-- 索引
CREATE INDEX idx_order_loading_order ON order_loading(order_ref);
CREATE INDEX idx_order_loading_pallet ON order_loading(plt_num);
CREATE INDEX idx_order_loading_status ON order_loading(status);
```

## 棧板號碼生成查詢

### 查看緩衝池狀態
```sql
SELECT 
    date_str,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE used = true) as used_entries,
    COUNT(*) FILTER (WHERE used = false) as unused_entries,
    MIN(allocated_at) as oldest_entry,
    MAX(allocated_at) as newest_entry
FROM pallet_number_buffer
GROUP BY date_str
ORDER BY date_str DESC;
```

### 檢查號碼排序問題
```sql
WITH comparison AS (
    SELECT 
        pallet_number,
        CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER) as num_value,
        ROW_NUMBER() OVER (ORDER BY pallet_number) as string_order,
        ROW_NUMBER() OVER (ORDER BY CAST(SPLIT_PART(pallet_number, '/', 2) AS INTEGER)) as numeric_order
    FROM pallet_number_buffer
    WHERE date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY')
)
SELECT 
    pallet_number,
    num_value,
    string_order,
    numeric_order,
    CASE 
        WHEN string_order != numeric_order THEN '排序不匹配'
        ELSE 'OK'
    END as status
FROM comparison
ORDER BY numeric_order;
```

### 手動清理緩衝池
```sql
DELETE FROM pallet_number_buffer
WHERE date_str != TO_CHAR(CURRENT_DATE, 'DDMMYY')
   OR (used = TRUE AND used_at < NOW() - INTERVAL '2 hours')
   OR (used = FALSE AND allocated_at < NOW() - INTERVAL '30 minutes');
```

## 訂單裝載查詢

### 查看最近裝載記錄
```sql
SELECT 
    ol.*,
    rp.product_code,
    rp.product_qty,
    dc.description as product_description
FROM order_loading ol
JOIN record_palletinfo rp ON ol.plt_num = rp.plt_num
LEFT JOIN data_code dc ON rp.product_code = dc.code
WHERE ol.loaded_at >= NOW() - INTERVAL '24 hours'
ORDER BY ol.loaded_at DESC
LIMIT 20;
```

### 查看訂單進度
```sql
SELECT 
    co.order_ref,
    co.product_code,
    dc.description as product_description,
    co.order_qty,
    co.remain_qty,
    co.order_qty - co.remain_qty as loaded_qty,
    CASE 
        WHEN co.remain_qty = 0 THEN '已完成'
        WHEN co.remain_qty = co.order_qty THEN '未開始'
        ELSE '進行中'
    END as status
FROM data_customerorder co
LEFT JOIN data_code dc ON co.product_code = dc.code
WHERE co.order_ref = ?  -- 替換為實際訂單號
ORDER BY co.product_code;
```

## 庫存管理查詢

### 庫存總覽
```sql
SELECT 
    sl.product_code,
    dc.description,
    sl.quantity as stock_level_qty,
    COUNT(DISTINCT ri.plt_num) as pallet_count,
    SUM(ri.injection + ri.pipeline + ri.prebook + ri.await + 
        ri.fold + ri.bulk + ri.backcarpark) as inventory_total
FROM stock_level sl
LEFT JOIN data_code dc ON sl.product_code = dc.code
LEFT JOIN record_inventory ri ON sl.product_code = 
    (SELECT product_code FROM record_palletinfo WHERE plt_num = ri.plt_num)
GROUP BY sl.product_code, dc.description, sl.quantity
ORDER BY sl.quantity DESC;
```

### 按位置統計庫存
```sql
SELECT 
    CASE 
        WHEN injection > 0 THEN 'Production'
        WHEN pipeline > 0 THEN 'Pipeline'
        WHEN prebook > 0 THEN 'Pre-Book'
        WHEN await > 0 THEN 'Await'
        WHEN fold > 0 THEN 'Fold Mill'
        WHEN bulk > 0 THEN 'Bulk Room'
        WHEN backcarpark > 0 THEN 'Back Car Park'
        WHEN damage > 0 THEN 'Damage'
        ELSE 'Unknown'
    END as location,
    COUNT(*) as pallet_count,
    SUM(injection + pipeline + prebook + await + fold + bulk + backcarpark + damage) as total_qty
FROM record_inventory
WHERE (injection + pipeline + prebook + await + fold + bulk + backcarpark + damage) > 0
GROUP BY location
ORDER BY total_qty DESC;
```

## 歷史追蹤查詢

### 查看最近操作歷史
```sql
SELECT 
    h.time,
    h.id as operator_id,
    di.user_name as operator_name,
    h.action,
    h.plt_num,
    h.loc as location,
    h.remark
FROM record_history h
LEFT JOIN data_id di ON h.id::INTEGER = di.clock_num
WHERE h.time >= NOW() - INTERVAL '24 hours'
ORDER BY h.time DESC
LIMIT 50;
```

### 追蹤特定棧板歷史
```sql
SELECT 
    h.time,
    h.action,
    h.loc as location,
    h.remark,
    di.user_name as operator
FROM record_history h
LEFT JOIN data_id di ON h.id::INTEGER = di.clock_num
WHERE h.plt_num = ?  -- 替換為實際棧板號
ORDER BY h.time DESC;
```

## 報表查詢

### 生產報表
```sql
SELECT 
    DATE(rp.created_at) as production_date,
    rp.product_code,
    dc.description,
    COUNT(DISTINCT rp.plt_num) as pallets_created,
    SUM(rp.product_qty) as total_quantity
FROM record_palletinfo rp
LEFT JOIN data_code dc ON rp.product_code = dc.code
WHERE rp.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(rp.created_at), rp.product_code, dc.description
ORDER BY production_date DESC, total_quantity DESC;
```

### 操作員工作量報表
```sql
SELECT 
    wl.user_id,
    di.user_name,
    wl.qc_pallets,
    wl.grn_pallets,
    wl.stock_moves,
    wl.qc_pallets + wl.grn_pallets as total_pallets,
    wl.last_updated
FROM work_level wl
LEFT JOIN data_id di ON wl.user_id = di.clock_num
WHERE wl.last_updated >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY total_pallets DESC;
```

### GRN收貨統計
```sql
SELECT 
    g.grn_reference,
    g.material_code,
    g.supplier_code,
    s.sup_name as supplier_name,
    SUM(g.gross_weight) as total_gross_weight,
    SUM(g.net_weight) as total_net_weight,
    COUNT(*) as pallet_count,
    g.created_at::date as received_date
FROM record_grn g
LEFT JOIN data_supplier s ON g.supplier_code = s.sup_code
WHERE g.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY g.grn_reference, g.material_code, g.supplier_code, s.sup_name, g.created_at::date
ORDER BY received_date DESC, total_net_weight DESC;
```

## 清理同維護查詢

### 清理舊緩衝池條目
```sql
DELETE FROM pallet_number_buffer
WHERE date_str < TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'DDMMYY');
```

### 清理舊序列記錄
```sql
DELETE FROM daily_pallet_sequence
WHERE date_str < TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'DDMMYY');
```

### 查看表大小
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 診斷查詢

### 檢查重複棧板號
```sql
SELECT 
    plt_num,
    COUNT(*) as duplicate_count
FROM record_palletinfo
GROUP BY plt_num
HAVING COUNT(*) > 1;
```

### 庫存差異檢查
```sql
WITH inventory_sum AS (
    SELECT 
        rp.product_code,
        SUM(ri.injection + ri.pipeline + ri.prebook + ri.await + 
            ri.fold + ri.bulk + ri.backcarpark) as inventory_total
    FROM record_inventory ri
    JOIN record_palletinfo rp ON ri.plt_num = rp.plt_num
    GROUP BY rp.product_code
)
SELECT 
    sl.product_code,
    sl.quantity as stock_level,
    COALESCE(inv.inventory_total, 0) as inventory_total,
    sl.quantity - COALESCE(inv.inventory_total, 0) as difference
FROM stock_level sl
LEFT JOIN inventory_sum inv ON sl.product_code = inv.product_code
WHERE sl.quantity != COALESCE(inv.inventory_total, 0)
ORDER BY ABS(sl.quantity - COALESCE(inv.inventory_total, 0)) DESC;
```

### 孤立棧板檢查
```sql
-- 查找沒有庫存記錄嘅棧板
SELECT p.plt_num, p.product_code, p.product_qty
FROM record_palletinfo p
LEFT JOIN record_inventory i ON p.plt_num = i.plt_num
WHERE i.plt_num IS NULL
AND p.created_at >= CURRENT_DATE - INTERVAL '30 days';
```

## Scheduler同Cron任務

### 查看pg_cron任務
```sql
SELECT * FROM cron.job;
```

### 查看pg_cron執行歷史
```sql
SELECT 
    jrd.*,
    j.jobname
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 20;
```

### 設置自動清理任務
```sql
SELECT cron.schedule(
    'cleanup-pallet-buffer',
    '*/5 * * * *',  -- 每5分鐘
    $$SELECT auto_cleanup_pallet_buffer();$$
);
```

## 性能優化查詢

### 查找慢查詢
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 20;
```

### 查看索引使用情況
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 維護建議

### 日常維護
1. 每日檢查緩衝池狀態
2. 監控表大小增長
3. 檢查重複記錄
4. 驗證庫存一致性

### 定期任務
1. 每週運行VACUUM ANALYZE
2. 每月清理歷史數據
3. 每季度重建索引
4. 每年歸檔舊數據

### 性能監控
1. 追蹤慢查詢
2. 監控索引效率
3. 檢查表膨脹
4. 分析查詢計劃

## 緊急修復

### 修復庫存不一致
```sql
-- 重新計算stock_level
UPDATE stock_level sl
SET quantity = (
    SELECT COALESCE(SUM(ri.injection + ri.pipeline + ri.prebook + 
                       ri.await + ri.fold + ri.bulk + ri.backcarpark), 0)
    FROM record_inventory ri
    JOIN record_palletinfo rp ON ri.plt_num = rp.plt_num
    WHERE rp.product_code = sl.product_code
),
last_updated = NOW()
WHERE sl.product_code IN (
    -- 只更新有差異嘅產品
    SELECT product_code FROM inventory_difference_view
);
```

### 重置序列號
```sql
-- 重置當日序列號（謹慎使用）
UPDATE daily_pallet_sequence
SET current_max = (
    SELECT COALESCE(MAX(CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)), 0)
    FROM record_palletinfo
    WHERE plt_num LIKE TO_CHAR(CURRENT_DATE, 'DDMMYY') || '/%'
)
WHERE date_str = TO_CHAR(CURRENT_DATE, 'DDMMYY');
```