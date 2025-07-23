# SQL 查詢庫 - NewPennine 倉庫管理系統

## 📋 文檔概覽

本文檔庫記錄了 NewPennine 倉庫管理系統中常用的 SQL 查詢模板、分析腳本和資料庫操作範例。

### 📊 查詢統計
- **查詢模板**: 50+ 個
- **分析腳本**: 20+ 個
- **優化查詢**: 15+ 個
- **最後更新**: 2025-01-15

---

## 📁 查詢分類

### 🏭 **生產查詢**
- 棧板生產統計
- QC 作業查詢
- 生產效率分析
- 員工工作量統計

### 📦 **庫存查詢**
- 庫存水平查詢
- 棧板位置追蹤
- 庫存異動記錄
- 庫存盤點查詢

### 📊 **分析查詢**
- 銷售趨勢分析
- 庫存週轉率
- 供應商績效
- 產品熱銷分析

### 🔍 **搜索查詢**
- 棧板搜索優化
- 產品代碼查詢
- 批次追蹤查詢
- 歷史記錄搜索

---

## 📋 查詢模板

### 1. 基礎庫存查詢

#### 當前庫存水平
```sql
-- 查詢所有產品的當前庫存水平
SELECT 
    product_code,
    SUM(COALESCE(injection, 0)) as injection,
    SUM(COALESCE(pipeline, 0)) as pipeline,
    SUM(COALESCE(prebook, 0)) as prebook,
    SUM(COALESCE(await, 0) + COALESCE(await_grn, 0)) as await_total,
    SUM(COALESCE(fold, 0)) as fold,
    SUM(COALESCE(bulk, 0)) as bulk,
    SUM(COALESCE(backcarpark, 0)) as backcarpark,
    SUM(
        COALESCE(injection, 0) + COALESCE(pipeline, 0) + 
        COALESCE(prebook, 0) + COALESCE(await, 0) + 
        COALESCE(await_grn, 0) + COALESCE(fold, 0) + 
        COALESCE(bulk, 0) + COALESCE(backcarpark, 0)
    ) as total_inventory
FROM record_inventory 
WHERE product_code IS NOT NULL
GROUP BY product_code
HAVING SUM(
    COALESCE(injection, 0) + COALESCE(pipeline, 0) + 
    COALESCE(prebook, 0) + COALESCE(await, 0) + 
    COALESCE(await_grn, 0) + COALESCE(fold, 0) + 
    COALESCE(bulk, 0) + COALESCE(backcarpark, 0)
) > 0
ORDER BY total_inventory DESC;
```

#### 棧板當前位置查詢
```sql
-- 查詢棧板的最新位置
WITH latest_history AS (
    SELECT DISTINCT ON (plt_num) 
        plt_num,
        loc as current_location,
        time as last_update
    FROM record_history
    WHERE plt_num IS NOT NULL 
    AND loc IS NOT NULL
    ORDER BY plt_num, time DESC
)
SELECT 
    p.plt_num,
    p.product_code,
    p.product_qty,
    p.series,
    COALESCE(h.current_location, 'Unknown') as current_location,
    h.last_update
FROM record_palletinfo p
LEFT JOIN latest_history h ON p.plt_num = h.plt_num
WHERE p.plt_num LIKE 'ABC%'  -- 替換為實際搜索條件
ORDER BY p.generate_time DESC;
```

### 2. 生產分析查詢

#### 每日生產統計
```sql
-- 查詢每日生產統計
SELECT 
    DATE(generate_time) as production_date,
    COUNT(*) as total_pallets,
    SUM(product_qty) as total_quantity,
    COUNT(DISTINCT product_code) as unique_products,
    AVG(product_qty) as avg_qty_per_pallet
FROM record_palletinfo
WHERE generate_time >= CURRENT_DATE - INTERVAL '30 days'
    AND plt_remark ILIKE '%finished in production%'
GROUP BY DATE(generate_time)
ORDER BY production_date DESC;
```

#### 員工績效查詢
```sql
-- 查詢員工績效統計
SELECT 
    d.name as employee_name,
    d.department,
    COUNT(*) as total_actions,
    COUNT(DISTINCT h.action) as unique_actions,
    COUNT(*) FILTER (WHERE h.action = 'Finished QC') as qc_count,
    COUNT(*) FILTER (WHERE h.action = 'Stock Transfer') as transfer_count,
    COUNT(*) FILTER (WHERE h.action = 'GRN Receiving') as grn_count
FROM record_history h
JOIN data_id d ON h.id = d.id
WHERE h.time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY d.id, d.name, d.department
ORDER BY total_actions DESC;
```

### 3. 庫存分析查詢

#### 庫存週轉分析
```sql
-- 庫存週轉率分析
WITH inventory_movement AS (
    SELECT 
        product_code,
        DATE(latest_update) as movement_date,
        SUM(
            ABS(COALESCE(injection, 0)) + ABS(COALESCE(pipeline, 0)) + 
            ABS(COALESCE(prebook, 0)) + ABS(COALESCE(await, 0)) + 
            ABS(COALESCE(fold, 0)) + ABS(COALESCE(bulk, 0)) + 
            ABS(COALESCE(backcarpark, 0))
        ) as daily_movement
    FROM record_inventory
    WHERE latest_update >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY product_code, DATE(latest_update)
),
current_stock AS (
    SELECT 
        stock as product_code,
        stock_level as current_inventory
    FROM stock_level
    WHERE DATE(update_time) = CURRENT_DATE
)
SELECT 
    c.product_code,
    c.current_inventory,
    COALESCE(AVG(m.daily_movement), 0) as avg_daily_movement,
    CASE 
        WHEN COALESCE(AVG(m.daily_movement), 0) > 0 
        THEN c.current_inventory / COALESCE(AVG(m.daily_movement), 1)
        ELSE NULL 
    END as days_of_stock,
    COUNT(m.movement_date) as active_days
FROM current_stock c
LEFT JOIN inventory_movement m ON c.product_code = m.product_code
GROUP BY c.product_code, c.current_inventory
ORDER BY days_of_stock ASC NULLS LAST;
```

### 4. 訂單分析查詢

#### 訂單完成率分析
```sql
-- ACO 訂單完成率分析
SELECT 
    order_ref,
    COUNT(*) as total_items,
    SUM(required_qty) as total_required,
    SUM(COALESCE(finished_qty, 0)) as total_finished,
    SUM(GREATEST(0, required_qty - COALESCE(finished_qty, 0))) as total_outstanding,
    ROUND(
        (SUM(COALESCE(finished_qty, 0))::NUMERIC / SUM(required_qty)::NUMERIC) * 100, 
        2
    ) as completion_percentage,
    CASE 
        WHEN SUM(GREATEST(0, required_qty - COALESCE(finished_qty, 0))) = 0 
        THEN 'Completed'
        WHEN SUM(COALESCE(finished_qty, 0)) > 0 
        THEN 'In Progress'
        ELSE 'Not Started'
    END as order_status
FROM record_aco
WHERE order_ref IS NOT NULL
GROUP BY order_ref
ORDER BY completion_percentage ASC;
```

### 5. 品質控制查詢

#### QC 通過率統計
```sql
-- QC 通過率和品質統計
WITH qc_stats AS (
    SELECT 
        p.product_code,
        COUNT(*) as total_qc_pallets,
        COUNT(*) FILTER (
            WHERE h.action = 'Finished QC' 
            AND h.remark NOT ILIKE '%damage%'
            AND h.remark NOT ILIKE '%reject%'
        ) as passed_pallets,
        SUM(p.product_qty) as total_qty_qc,
        SUM(p.product_qty) FILTER (
            WHERE h.action = 'Finished QC' 
            AND h.remark NOT ILIKE '%damage%'
            AND h.remark NOT ILIKE '%reject%'
        ) as passed_qty
    FROM record_palletinfo p
    JOIN record_history h ON p.plt_num = h.plt_num
    WHERE h.action = 'Finished QC'
        AND p.generate_time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.product_code
)
SELECT 
    product_code,
    total_qc_pallets,
    passed_pallets,
    total_qc_pallets - passed_pallets as failed_pallets,
    ROUND((passed_pallets::NUMERIC / total_qc_pallets::NUMERIC) * 100, 2) as pass_rate_pallets,
    total_qty_qc,
    passed_qty,
    total_qty_qc - passed_qty as failed_qty,
    ROUND((passed_qty::NUMERIC / total_qty_qc::NUMERIC) * 100, 2) as pass_rate_quantity
FROM qc_stats
WHERE total_qc_pallets > 0
ORDER BY pass_rate_pallets ASC;
```

---

## 🚀 優化查詢範例

### 1. 索引優化查詢

#### 使用索引的棧板搜索
```sql
-- 優化：使用複合索引
-- CREATE INDEX CONCURRENTLY idx_palletinfo_code_time 
-- ON record_palletinfo(product_code, generate_time DESC);

SELECT plt_num, product_code, product_qty, generate_time
FROM record_palletinfo
WHERE product_code = 'X01A1234'  -- 使用索引的第一列
ORDER BY generate_time DESC      -- 使用索引的第二列
LIMIT 20;
```

#### 使用部分索引的庫存查詢
```sql
-- 優化：部分索引只針對有效庫存
-- CREATE INDEX CONCURRENTLY idx_inventory_active 
-- ON record_inventory(product_code, latest_update) 
-- WHERE (COALESCE(injection,0) + COALESCE(pipeline,0) + 
--        COALESCE(prebook,0) + COALESCE(await,0) + 
--        COALESCE(fold,0) + COALESCE(bulk,0) + 
--        COALESCE(backcarpark,0)) > 0;

SELECT product_code, latest_update,
       COALESCE(injection,0) + COALESCE(pipeline,0) + 
       COALESCE(prebook,0) + COALESCE(await,0) + 
       COALESCE(fold,0) + COALESCE(bulk,0) + 
       COALESCE(backcarpark,0) as total_qty
FROM record_inventory
WHERE product_code LIKE 'X01%'
  AND (COALESCE(injection,0) + COALESCE(pipeline,0) + 
       COALESCE(prebook,0) + COALESCE(await,0) + 
       COALESCE(fold,0) + COALESCE(bulk,0) + 
       COALESCE(backcarpark,0)) > 0
ORDER BY latest_update DESC;
```

### 2. 窗口函數優化

#### 排名和累計統計
```sql
-- 使用窗口函數進行高效排名
WITH product_performance AS (
    SELECT 
        product_code,
        SUM(product_qty) as total_production,
        COUNT(*) as pallet_count,
        AVG(product_qty) as avg_qty_per_pallet,
        -- 排名函數
        ROW_NUMBER() OVER (ORDER BY SUM(product_qty) DESC) as production_rank,
        RANK() OVER (ORDER BY COUNT(*) DESC) as pallet_count_rank,
        -- 累計百分比
        PERCENT_RANK() OVER (ORDER BY SUM(product_qty)) as production_percentile,
        -- 累計總和
        SUM(SUM(product_qty)) OVER (ORDER BY SUM(product_qty) DESC 
                                   ROWS UNBOUNDED PRECEDING) as cumulative_production
    FROM record_palletinfo
    WHERE generate_time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY product_code
)
SELECT 
    product_code,
    total_production,
    pallet_count,
    avg_qty_per_pallet,
    production_rank,
    pallet_count_rank,
    ROUND(production_percentile * 100, 2) as production_percentile_pct,
    cumulative_production,
    ROUND((cumulative_production::NUMERIC / 
           MAX(cumulative_production) OVER()) * 100, 2) as cumulative_percentage
FROM product_performance
ORDER BY production_rank;
```

---

## 📊 報表查詢範例

### 1. 管理報表

#### 倉庫效率報表
```sql
-- 倉庫整體效率報表
WITH daily_metrics AS (
    SELECT 
        DATE(time) as report_date,
        -- 生產指標
        COUNT(*) FILTER (WHERE action = 'Finished QC') as qc_completed,
        COUNT(*) FILTER (WHERE action = 'GRN Receiving') as grn_received,
        COUNT(*) FILTER (WHERE action = 'Stock Transfer') as transfers_made,
        COUNT(*) FILTER (WHERE action = 'Order Load') as orders_loaded,
        -- 唯一操作員
        COUNT(DISTINCT id) as active_operators,
        -- 處理的唯一棧板
        COUNT(DISTINCT plt_num) as unique_pallets_handled
    FROM record_history
    WHERE time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(time)
)
SELECT 
    report_date,
    qc_completed,
    grn_received,
    transfers_made,
    orders_loaded,
    qc_completed + grn_received + transfers_made + orders_loaded as total_operations,
    active_operators,
    unique_pallets_handled,
    ROUND(
        (qc_completed + grn_received + transfers_made + orders_loaded)::NUMERIC / 
        NULLIF(active_operators, 0), 
        2
    ) as operations_per_operator,
    -- 7天移動平均
    ROUND(
        AVG(qc_completed + grn_received + transfers_made + orders_loaded) 
        OVER (ORDER BY report_date ROWS 6 PRECEDING), 
        2
    ) as operations_7day_avg
FROM daily_metrics
ORDER BY report_date DESC;
```

### 2. 異常檢測查詢

#### 庫存異常檢測
```sql
-- 檢測可能的庫存異常
WITH inventory_anomalies AS (
    SELECT 
        product_code,
        plt_num,
        -- 檢查負庫存
        CASE WHEN injection < 0 OR pipeline < 0 OR prebook < 0 OR 
                  await < 0 OR fold < 0 OR bulk < 0 OR backcarpark < 0
             THEN 'NEGATIVE_INVENTORY' 
        END as negative_check,
        -- 檢查異常大的庫存值
        CASE WHEN (COALESCE(injection,0) + COALESCE(pipeline,0) + 
                   COALESCE(prebook,0) + COALESCE(await,0) + 
                   COALESCE(fold,0) + COALESCE(bulk,0) + 
                   COALESCE(backcarpark,0)) > 10000
             THEN 'EXCESSIVE_INVENTORY'
        END as excessive_check,
        -- 檢查重複記錄
        CASE WHEN COUNT(*) OVER (PARTITION BY plt_num) > 1
             THEN 'DUPLICATE_PALLET'
        END as duplicate_check,
        latest_update
    FROM record_inventory
),
pallet_anomalies AS (
    SELECT 
        plt_num,
        product_code,
        product_qty,
        -- 檢查數量異常
        CASE WHEN product_qty <= 0 THEN 'ZERO_OR_NEGATIVE_QTY'
             WHEN product_qty > 1000 THEN 'EXCESSIVE_QTY'
        END as qty_check,
        -- 檢查無效產品代碼
        CASE WHEN product_code IS NULL OR product_code = ''
             THEN 'MISSING_PRODUCT_CODE'
        END as code_check,
        generate_time
    FROM record_palletinfo
)
-- 合併所有異常
SELECT 'INVENTORY' as source_table, 
       product_code, plt_num, 
       negative_check as anomaly_type, 
       latest_update as record_time
FROM inventory_anomalies 
WHERE negative_check IS NOT NULL

UNION ALL

SELECT 'INVENTORY' as source_table, 
       product_code, plt_num, 
       excessive_check as anomaly_type, 
       latest_update as record_time
FROM inventory_anomalies 
WHERE excessive_check IS NOT NULL

UNION ALL

SELECT 'PALLET' as source_table, 
       product_code, plt_num, 
       qty_check as anomaly_type, 
       generate_time as record_time
FROM pallet_anomalies 
WHERE qty_check IS NOT NULL

ORDER BY record_time DESC;
```

---

## 🔧 維護查詢

### 1. 資料清理

#### 清理過期緩存
```sql
-- 清理過期的棧板號碼緩存
DELETE FROM pallet_number_buffer
WHERE date_str != TO_CHAR(CURRENT_DATE, 'DDMMYY')
   OR (used = 'True' AND updated_at < NOW() - INTERVAL '4 hours')
   OR (used = 'Holded' AND updated_at < NOW() - INTERVAL '1 hour');
```

#### 歸檔舊記錄
```sql
-- 歸檔超過1年的歷史記錄
WITH old_records AS (
    DELETE FROM record_history
    WHERE time < CURRENT_DATE - INTERVAL '1 year'
    RETURNING *
)
INSERT INTO record_history_archive 
SELECT * FROM old_records;
```

### 2. 數據完整性檢查

#### 孤立記錄檢查
```sql
-- 檢查沒有對應棧板信息的庫存記錄
SELECT ri.plt_num, ri.product_code, ri.latest_update
FROM record_inventory ri
LEFT JOIN record_palletinfo rp ON ri.plt_num = rp.plt_num
WHERE rp.plt_num IS NULL
  AND ri.plt_num IS NOT NULL
ORDER BY ri.latest_update DESC;

-- 檢查沒有歷史記錄的棧板
SELECT rp.plt_num, rp.product_code, rp.generate_time
FROM record_palletinfo rp
LEFT JOIN record_history rh ON rp.plt_num = rh.plt_num
WHERE rh.plt_num IS NULL
ORDER BY rp.generate_time DESC;
```

---

## 📝 最佳實踐

### 1. 查詢優化技巧
```sql
-- ✅ 好的實踐：使用 EXISTS 而非 IN
SELECT p.*
FROM record_palletinfo p
WHERE EXISTS (
    SELECT 1 FROM record_inventory i 
    WHERE i.plt_num = p.plt_num 
    AND i.product_code = 'X01A1234'
);

-- ❌ 避免：大表的 IN 查詢
-- SELECT * FROM record_palletinfo 
-- WHERE plt_num IN (SELECT plt_num FROM record_inventory);
```

### 2. 日期範圍查詢
```sql
-- ✅ 好的實踐：使用索引友好的日期範圍
SELECT * FROM record_history
WHERE time >= '2025-01-01'::DATE
  AND time < '2025-02-01'::DATE;

-- ❌ 避免：函數包裝的日期列
-- SELECT * FROM record_history
-- WHERE DATE(time) = '2025-01-15';
```

### 3. 大表分頁
```sql
-- ✅ 好的實踐：使用 OFFSET/LIMIT 配合 ORDER BY
SELECT plt_num, product_code, generate_time
FROM record_palletinfo
ORDER BY generate_time DESC
LIMIT 50 OFFSET 100;

-- 🚀 更好的實踐：游標分頁（適合大偏移量）
SELECT plt_num, product_code, generate_time
FROM record_palletinfo
WHERE generate_time < '2025-01-15 10:00:00'
ORDER BY generate_time DESC
LIMIT 50;
```

---

## 📞 技術支援

### 常見問題
1. **查詢慢**: 檢查是否使用了合適的索引
2. **結果不準確**: 確認日期範圍和過濾條件
3. **記憶體不足**: 使用分頁或限制結果集大小

### 性能調優建議
- 定期更新表統計信息：`ANALYZE table_name;`
- 監控慢查詢日誌
- 使用 EXPLAIN ANALYZE 分析查詢計劃
- 考慮創建適當的索引

---

**最後更新**: 2025-01-15  
**版本**: v2.0  
**維護團隊**: NewPennine 開發團隊

> 💡 **提示**: 所有查詢範例都經過測試和優化。在生產環境執行前請先在測試環境驗證。 