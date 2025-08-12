-- GraphQL 重複記錄監控查詢
-- 用於檢測和診斷數據重複問題

-- 1. 檢查完全重複的歷史記錄
WITH duplicate_history AS (
  SELECT 
    time,
    plt_num,
    action,
    loc,
    id,
    remark,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(ctid) as row_locations  -- PostgreSQL 內部行ID
  FROM record_history 
  GROUP BY time, plt_num, action, loc, id, remark
  HAVING COUNT(*) > 1
)
SELECT 
  'Complete Duplicates' as issue_type,
  plt_num as pallet_number,
  time as timestamp,
  action,
  loc as location,
  id as operator_id,
  duplicate_count,
  row_locations
FROM duplicate_history
ORDER BY duplicate_count DESC, time DESC;

-- 2. 檢查同一 pallet 同一時間的多個動作
WITH same_time_actions AS (
  SELECT 
    plt_num,
    time,
    COUNT(DISTINCT action) as action_count,
    STRING_AGG(DISTINCT action, ', ') as actions
  FROM record_history 
  GROUP BY plt_num, time
  HAVING COUNT(DISTINCT action) > 1
)
SELECT 
  'Multiple Actions Same Time' as issue_type,
  plt_num as pallet_number,
  time as timestamp,
  action_count,
  actions
FROM same_time_actions
ORDER BY time DESC;

-- 3. 檢查產品代碼相關的潛在問題
WITH product_history AS (
  SELECT 
    pi.product_code,
    rh.plt_num,
    rh.time,
    rh.action,
    rh.loc,
    rh.id,
    COUNT(*) OVER (
      PARTITION BY pi.product_code, rh.time, rh.action, rh.loc, rh.id
    ) as same_product_action_count
  FROM record_history rh
  JOIN record_palletinfo pi ON rh.plt_num = pi.plt_num
  WHERE pi.product_code IS NOT NULL
)
SELECT 
  'Product Level Analysis' as issue_type,
  product_code,
  plt_num as pallet_number,
  time as timestamp,
  action,
  loc as location,
  id as operator_id,
  same_product_action_count
FROM product_history
WHERE same_product_action_count > 1
ORDER BY product_code, time DESC;

-- 4. GraphQL DataLoader 調試用查詢
-- 模擬 DataLoader 的查詢邏輯
WITH product_pallets AS (
  SELECT plt_num
  FROM record_palletinfo 
  WHERE product_code ILIKE '%MEL4545A%'
),
history_with_operators AS (
  SELECT 
    rh.time,
    rh.plt_num,
    rh.action,
    rh.loc,
    rh.remark,
    rh.id,
    di.name as operator_name,
    -- 創建與 DataLoader 相同的唯一鍵
    CONCAT(rh.time, '-', rh.plt_num, '-', rh.action, '-', COALESCE(rh.loc, 'null'), '-', COALESCE(rh.id::text, 'null')) as unique_key
  FROM record_history rh
  LEFT JOIN data_id di ON rh.id = di.id
  WHERE rh.plt_num IN (SELECT plt_num FROM product_pallets)
  ORDER BY rh.time DESC
)
SELECT 
  'DataLoader Simulation' as issue_type,
  unique_key,
  time as timestamp,
  plt_num as pallet_number,
  action,
  loc as location,
  operator_name,
  COUNT(*) OVER (PARTITION BY unique_key) as duplicate_count
FROM history_with_operators
ORDER BY time DESC;