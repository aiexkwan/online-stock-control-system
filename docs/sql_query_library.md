# SQL查詢庫

## 概述

SQL查詢庫包含系統中常用嘅實際查詢範例，按業務場景分類。呢啲查詢可以直接使用或者根據需要修改。

## 生產查詢

### 當日生產統計
```sql
-- 查詢今日生產嘅棧板數量同產品類型
SELECT 
    COUNT(DISTINCT plt_num) as total_pallets,
    COUNT(DISTINCT product_code) as product_types,
    SUM(product_qty) as total_quantity,
    STRING_AGG(DISTINCT product_code, ', ') as products
FROM record_palletinfo
WHERE DATE(created_at) = CURRENT_DATE;
```

### 每小時生產分析
```sql
-- 分析每小時生產棧板數量
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as pallets_created,
    STRING_AGG(DISTINCT product_code, ', ') as products
FROM record_palletinfo
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;
```

### 產品生產排名
```sql
-- 最近7日產品生產排名
SELECT 
    product_code,
    dc.description,
    COUNT(*) as pallet_count,
    SUM(product_qty) as total_quantity,
    RANK() OVER (ORDER BY SUM(product_qty) DESC) as rank
FROM record_palletinfo rp
LEFT JOIN data_code dc ON rp.product_code = dc.code
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY product_code, dc.description
ORDER BY total_quantity DESC;
```

## 庫存查詢

### 低庫存產品查詢
```sql
-- 查詢庫存低於100嘅產品
SELECT 
    sl.product_code,
    dc.description,
    sl.quantity as current_stock,
    CASE 
        WHEN sl.quantity = 0 THEN '缺貨'
        WHEN sl.quantity < 50 THEN '極低'
        WHEN sl.quantity < 100 THEN '低'
        ELSE '正常'
    END as stock_status
FROM stock_level sl
LEFT JOIN data_code dc ON sl.product_code = dc.code
WHERE sl.quantity < 100
ORDER BY sl.quantity ASC;
```

### 產品位置分佈
```sql
-- 分析特定產品喺唔同位置嘅分佈
WITH product_locations AS (
    SELECT 
        rp.product_code,
        ri.plt_num,
        CASE 
            WHEN ri.injection > 0 THEN 'Production'
            WHEN ri.pipeline > 0 THEN 'Pipeline'
            WHEN ri.await > 0 THEN 'Await'
            WHEN ri.fold > 0 THEN 'Fold Mill'
            WHEN ri.bulk > 0 THEN 'Bulk Room'
            WHEN ri.prebook > 0 THEN 'Pre-Book'
            WHEN ri.backcarpark > 0 THEN 'Back Car Park'
            WHEN ri.damage > 0 THEN 'Damage'
            ELSE 'Unknown'
        END as location,
        ri.injection + ri.pipeline + ri.await + ri.fold + 
        ri.bulk + ri.prebook + ri.backcarpark + ri.damage as qty
    FROM record_inventory ri
    JOIN record_palletinfo rp ON ri.plt_num = rp.plt_num
    WHERE rp.product_code = 'YOUR_PRODUCT_CODE'  -- 替換為實際產品代碼
)
SELECT 
    location,
    COUNT(*) as pallet_count,
    SUM(qty) as total_quantity
FROM product_locations
WHERE qty > 0
GROUP BY location
ORDER BY total_quantity DESC;
```

### 庫存周轉率分析
```sql
-- 計算產品庫存周轉率（最近30日）
WITH movement_stats AS (
    SELECT 
        rp.product_code,
        COUNT(DISTINCT CASE 
            WHEN rh.action IN ('QC Label', 'GRN Receiving') 
            THEN rh.plt_num 
        END) as pallets_in,
        COUNT(DISTINCT CASE 
            WHEN rh.action IN ('Order Loading', 'Void Pallet') 
            THEN rh.plt_num 
        END) as pallets_out
    FROM record_history rh
    JOIN record_palletinfo rp ON rh.plt_num = rp.plt_num
    WHERE rh.time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY rp.product_code
)
SELECT 
    ms.product_code,
    dc.description,
    sl.quantity as current_stock,
    ms.pallets_in,
    ms.pallets_out,
    CASE 
        WHEN sl.quantity > 0 
        THEN ROUND((ms.pallets_out::numeric / sl.quantity) * 30, 2)
        ELSE 0 
    END as turnover_rate
FROM movement_stats ms
JOIN stock_level sl ON ms.product_code = sl.product_code
LEFT JOIN data_code dc ON ms.product_code = dc.code
ORDER BY turnover_rate DESC;
```

## 轉移查詢

### 當日轉移記錄
```sql
-- 查詢今日所有轉移記錄
SELECT 
    rt.plt_num,
    rt.f_loc as from_location,
    rt.t_loc as to_location,
    rp.product_code,
    dc.description,
    di.user_name as operator,
    rt.created_at
FROM record_transfer rt
JOIN record_palletinfo rp ON rt.plt_num = rp.plt_num
LEFT JOIN data_code dc ON rp.product_code = dc.code
LEFT JOIN data_id di ON rt.operator_id = di.clock_num
WHERE DATE(rt.created_at) = CURRENT_DATE
ORDER BY rt.created_at DESC;
```

### 位置轉移統計
```sql
-- 統計各位置之間嘅轉移數量
SELECT 
    f_loc as from_location,
    t_loc as to_location,
    COUNT(*) as transfer_count,
    COUNT(DISTINCT plt_num) as unique_pallets
FROM record_transfer
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY f_loc, t_loc
ORDER BY transfer_count DESC;
```

### 操作員轉移效率
```sql
-- 分析操作員轉移效率統計
SELECT 
    di.user_name,
    COUNT(*) as total_transfers,
    COUNT(DISTINCT DATE(rt.created_at)) as working_days,
    ROUND(COUNT(*)::numeric / COUNT(DISTINCT DATE(rt.created_at)), 2) as avg_per_day,
    MAX(rt.created_at) as last_transfer
FROM record_transfer rt
LEFT JOIN data_id di ON rt.operator_id = di.clock_num
WHERE rt.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY di.user_name
ORDER BY total_transfers DESC;
```

## GRN查詢

### 供應商收貨統計
```sql
-- 按供應商統計收貨情況
SELECT 
    g.supplier_code,
    s.sup_name as supplier_name,
    COUNT(DISTINCT g.grn_reference) as grn_count,
    COUNT(*) as pallet_count,
    SUM(g.net_weight) as total_net_weight,
    ROUND(AVG(g.net_weight), 2) as avg_net_weight
FROM record_grn g
LEFT JOIN data_supplier s ON g.supplier_code = s.sup_code
WHERE g.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY g.supplier_code, s.sup_name
ORDER BY total_net_weight DESC;
```

### 材料收貨趨勢
```sql
-- 分析材料收貨趨勢
SELECT 
    DATE(created_at) as receive_date,
    material_code,
    COUNT(*) as pallet_count,
    SUM(net_weight) as daily_weight
FROM record_grn
WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY DATE(created_at), material_code
ORDER BY receive_date DESC, daily_weight DESC;
```

### GRN完整性檢查
```sql
-- 檢查GRN記錄同實際棧板嘅匹配情況
SELECT 
    g.grn_reference,
    g.material_code,
    COUNT(DISTINCT g.plt_series) as grn_pallet_count,
    COUNT(DISTINCT p.plt_num) as actual_pallet_count,
    CASE 
        WHEN COUNT(DISTINCT g.plt_series) = COUNT(DISTINCT p.plt_num) 
        THEN '匹配'
        ELSE '不匹配'
    END as status
FROM record_grn g
LEFT JOIN record_palletinfo p ON g.plt_series = p.series
WHERE g.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY g.grn_reference, g.material_code
HAVING COUNT(DISTINCT g.plt_series) != COUNT(DISTINCT p.plt_num);
```

## ACO訂單查詢

### ACO訂單進度查詢
```sql
-- 查詢所有ACO訂單嘅進度
SELECT 
    order_ref,
    product_code,
    order_qty,
    remain_qty,
    order_qty - remain_qty as completed_qty,
    ROUND(((order_qty - remain_qty)::numeric / order_qty) * 100, 2) as completion_percentage,
    CASE 
        WHEN remain_qty = 0 THEN '已完成'
        WHEN remain_qty = order_qty THEN '未開始'
        ELSE '進行中'
    END as status
FROM data_customerorder
WHERE order_ref::TEXT LIKE 'ACO%'
ORDER BY completion_percentage DESC;
```

### ACO產品生產情況
```sql
-- 分析ACO產品嘅生產情況
SELECT 
    ra.aco_order_ref,
    ra.product_code,
    COUNT(*) as pallet_count,
    SUM(rp.product_qty) as total_quantity,
    MIN(ra.created_at) as first_production,
    MAX(ra.created_at) as last_production
FROM record_aco ra
JOIN record_palletinfo rp ON ra.plt_num = rp.plt_num
WHERE ra.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ra.aco_order_ref, ra.product_code
ORDER BY last_production DESC;
```

## 操作員效率查詢

### 每日操作統計
```sql
-- 分析操作員每日操作統計
WITH daily_stats AS (
    SELECT 
        DATE(time) as work_date,
        id::INTEGER as operator_id,
        action,
        COUNT(*) as action_count
    FROM record_history
    WHERE time >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(time), id, action
)
SELECT 
    ds.work_date,
    di.user_name,
    SUM(CASE WHEN action = 'QC Label' THEN action_count ELSE 0 END) as qc_labels,
    SUM(CASE WHEN action = 'GRN Receiving' THEN action_count ELSE 0 END) as grn_receiving,
    SUM(CASE WHEN action = 'Stock Transfer' THEN action_count ELSE 0 END) as transfers,
    SUM(action_count) as total_actions
FROM daily_stats ds
LEFT JOIN data_id di ON ds.operator_id = di.clock_num
GROUP BY ds.work_date, di.user_name
ORDER BY ds.work_date DESC, total_actions DESC;
```

### 操作員排名
```sql
-- 本月操作員效率排名
SELECT 
    di.user_name,
    COUNT(DISTINCT CASE WHEN rh.action = 'QC Label' THEN rh.plt_num END) as qc_pallets,
    COUNT(DISTINCT CASE WHEN rh.action = 'GRN Receiving' THEN rh.plt_num END) as grn_pallets,
    COUNT(DISTINCT CASE WHEN rh.action = 'Stock Transfer' THEN rh.plt_num END) as transfers,
    COUNT(DISTINCT rh.plt_num) as total_pallets,
    RANK() OVER (ORDER BY COUNT(DISTINCT rh.plt_num) DESC) as rank
FROM record_history rh
LEFT JOIN data_id di ON rh.id::INTEGER = di.clock_num
WHERE rh.time >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY di.user_name
ORDER BY total_pallets DESC;
```

## 異常檢測查詢

### 長期未移動棧板
```sql
-- 查詢超過30日未移動嘅棧板
WITH last_movement AS (
    SELECT 
        plt_num,
        MAX(time) as last_move_time
    FROM record_history
    WHERE action IN ('Stock Transfer', 'Order Loading')
    GROUP BY plt_num
)
SELECT 
    rp.plt_num,
    rp.product_code,
    dc.description,
    lm.last_move_time,
    CURRENT_DATE - DATE(lm.last_move_time) as days_idle,
    rh.loc as current_location
FROM record_palletinfo rp
LEFT JOIN last_movement lm ON rp.plt_num = lm.plt_num
LEFT JOIN data_code dc ON rp.product_code = dc.code
LEFT JOIN LATERAL (
    SELECT loc FROM record_history 
    WHERE plt_num = rp.plt_num 
    ORDER BY time DESC 
    LIMIT 1
) rh ON true
WHERE lm.last_move_time < CURRENT_DATE - INTERVAL '30 days'
   OR lm.last_move_time IS NULL
ORDER BY days_idle DESC;
```

### 重複操作檢測
```sql
-- 檢測可能嘅重複操作
WITH duplicate_check AS (
    SELECT 
        plt_num,
        action,
        id as operator_id,
        time,
        LAG(time) OVER (PARTITION BY plt_num, action ORDER BY time) as prev_time
    FROM record_history
    WHERE time >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT 
    dc.plt_num,
    dc.action,
    di.user_name as operator,
    dc.time,
    dc.prev_time,
    EXTRACT(EPOCH FROM (dc.time - dc.prev_time))/60 as minutes_between
FROM duplicate_check dc
LEFT JOIN data_id di ON dc.operator_id::INTEGER = di.clock_num
WHERE dc.prev_time IS NOT NULL
  AND dc.time - dc.prev_time < INTERVAL '5 minutes'
ORDER BY dc.time DESC;
```

## 盤點查詢

### 盤點差異分析
```sql
-- 分析盤點差異
WITH stocktake_summary AS (
    SELECT 
        product_code,
        product_desc,
        MAX(CASE WHEN plt_num IS NULL THEN remain_qty END) as system_stock,
        SUM(counted_qty) as total_counted,
        COUNT(DISTINCT plt_num) as pallets_counted,
        MAX(created_at) as last_count_time
    FROM record_stocktake
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY product_code, product_desc
)
SELECT 
    ss.product_code,
    ss.product_desc,
    ss.system_stock,
    ss.total_counted,
    ss.total_counted - ss.system_stock as variance,
    ROUND(((ss.total_counted - ss.system_stock)::numeric / NULLIF(ss.system_stock, 0)) * 100, 2) as variance_percentage,
    ss.pallets_counted,
    CASE 
        WHEN ABS((ss.total_counted - ss.system_stock)::numeric / NULLIF(ss.system_stock, 0)) > 0.1 
        THEN '高差異'
        ELSE '正常'
    END as status
FROM stocktake_summary ss
ORDER BY ABS(variance_percentage) DESC NULLS LAST;
```

### 盤點覆蓋率
```sql
-- 檢查盤點覆蓋率
WITH products_to_count AS (
    SELECT DISTINCT product_code
    FROM stock_level
    WHERE quantity > 0
),
counted_products AS (
    SELECT DISTINCT product_code
    FROM record_stocktake
    WHERE DATE(created_at) = CURRENT_DATE
)
SELECT 
    (SELECT COUNT(*) FROM counted_products)::numeric / 
    (SELECT COUNT(*) FROM products_to_count) * 100 as coverage_percentage,
    (SELECT COUNT(*) FROM products_to_count) as total_products,
    (SELECT COUNT(*) FROM counted_products) as counted_products,
    (SELECT COUNT(*) FROM products_to_count) - 
    (SELECT COUNT(*) FROM counted_products) as remaining_products;
```

## 使用說明

### 參數替換
- 所有包含 `?` 或者 `YOUR_` 開頭嘅值都需要替換為實際參數
- 時間範圍可以根據需要調整（例如：`INTERVAL '7 days'`）

### 性能建議
- 對於大數據量查詢，考慮添加適當嘅索引
- 使用 EXPLAIN ANALYZE 分析查詢計劃
- 避免喺高峰期運行複雜查詢

### 安全注意
- 唔好直接將用戶輸入拼接到SQL語句
- 使用參數化查詢防止SQL注入
- 限制查詢結果數量避免過載