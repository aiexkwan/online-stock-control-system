-- ====================================================
-- SQL Library - @	 SQL s,q 
-- ====================================================
-- ,��+@	́� SQL s,�hP˚�
-- (������b��w
--  ���2025-06-14
-- ====================================================

-- ====================================================
-- 1. hP˚� (Table Definitions)
-- ====================================================

-- X�_��]h
CREATE TABLE IF NOT EXISTS pallet_number_buffer (
    pallet_number TEXT PRIMARY KEY,
    date_str TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    session_id TEXT
);

-- u�"
CREATE INDEX IF NOT EXISTS idx_buffer_date_used ON pallet_number_buffer(date_str, used);
CREATE INDEX IF NOT EXISTS idx_buffer_allocated ON pallet_number_buffer(allocated_at);

-- ��X�h
CREATE TABLE IF NOT EXISTS daily_pallet_sequence (
    date_str TEXT PRIMARY KEY,
    current_max INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ��	h
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

-- u�"
CREATE INDEX IF NOT EXISTS idx_order_loading_order ON order_loading(order_ref);
CREATE INDEX IF NOT EXISTS idx_order_loading_pallet ON order_loading(plt_num);
CREATE INDEX IF NOT EXISTS idx_order_loading_status ON order_loading(status);

-- ====================================================
-- 2. X�_��� SQL (Pallet Number Generation)
-- ====================================================

-- ��vM�]@�K
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

-- ��X�_���OL
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
        WHEN string_order != numeric_order THEN '� ORDER MISMATCH'
        ELSE 'OK'
    END as status
FROM comparison
ORDER BY numeric_order;

-- K��]@
DELETE FROM pallet_number_buffer
WHERE date_str != TO_CHAR(CURRENT_DATE, 'DDMMYY')
   OR (used = TRUE AND used_at < NOW() - INTERVAL '2 hours')
   OR (used = FALSE AND allocated_at < NOW() - INTERVAL '30 minutes');

-- ====================================================
-- 3. ��	�� SQL (Order Loading)
-- ====================================================

-- � ф�	
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

-- ���	�K
SELECT 
    co.order_ref,
    co.product_code,
    dc.description as product_description,
    co.order_qty,
    co.remain_qty,
    co.order_qty - co.remain_qty as loaded_qty,
    CASE 
        WHEN co.remain_qty = 0 THEN ' Complete'
        WHEN co.remain_qty = co.order_qty THEN '� Not Started'
        ELSE '= In Progress'
    END as status
FROM data_customerorder co
LEFT JOIN data_code dc ON co.product_code = dc.code
WHERE co.order_ref = 'YOUR_ORDER_REF'
ORDER BY co.product_code;

-- ====================================================
-- 4. �X�� SQL (Inventory Management)
-- ====================================================

-- �vM�X=�
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

-- �X�MnH
SELECT 
    CASE 
        WHEN injection > 0 THEN 'Injection'
        WHEN pipeline > 0 THEN 'Pipeline'
        WHEN prebook > 0 THEN 'Prebook'
        WHEN await > 0 THEN 'Await'
        WHEN fold > 0 THEN 'Fold'
        WHEN bulk > 0 THEN 'Bulk'
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

-- ====================================================
-- 5. w��� SQL (History Tracking)
-- ====================================================

-- � ф�\w�
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

-- �y�X䄌tw�
SELECT 
    h.time,
    h.action,
    h.loc as location,
    h.remark,
    di.user_name as operator
FROM record_history h
LEFT JOIN data_id di ON h.id::INTEGER = di.clock_num
WHERE h.plt_num = 'YOUR_PALLET_NUMBER'
ORDER BY h.time DESC;

-- ====================================================
-- 6. 1h�� SQL (Reporting)
-- ====================================================

-- ��"1h
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

-- �\��\q
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

-- ====================================================
-- 7. ��w SQL (Cleanup & Maintenance)
-- ====================================================

-- N��]@��
DELETE FROM pallet_number_buffer
WHERE date_str < TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'DDMMYY');

-- 
��
DELETE FROM daily_pallet_sequence
WHERE date_str < TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'DDMMYY');

-- �h'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ====================================================
-- 8. :��OL�� SQL (Diagnostics)
-- ====================================================

-- ����X�_�
SELECT 
    plt_num,
    COUNT(*) as duplicate_count
FROM record_palletinfo
GROUP BY plt_num
HAVING COUNT(*) > 1;

-- ��X �
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

-- ====================================================
-- 9. Scheduler �� SQL (Scheduler & Cron)
-- ====================================================

-- � pg_cron ��
SELECT * FROM cron.job;

-- � pg_cron �Lw�
SELECT 
    jrd.*,
    j.jobname
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 20;

-- -n����
SELECT cron.schedule(
    'cleanup-pallet-buffer',
    '*/30 * * * *',  -- � 30 
    $$SELECT api_cleanup_pallet_buffer();$$
);

-- ====================================================
-- �w� (Maintenance Notes)
-- ====================================================
-- 1. ��L SQL ��xګ'�
-- 2. �h'ŁB2L VACUUM �\
-- 3. ���"(����b'�
-- 4. ����xګP�e
-- ====================================================