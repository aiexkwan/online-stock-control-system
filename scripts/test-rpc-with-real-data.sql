-- 測試 RPC 函數在實際有數據的日期

-- 1. 首先找到最近有數據的日期
SELECT 'Finding dates with data' as info;

SELECT 
    DATE(generate_time) as data_date,
    COUNT(*) as total_count,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as grn_count,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as non_grn_count
FROM record_palletinfo 
WHERE generate_time >= '2025-05-20'  -- 檢查最近兩週的數據
GROUP BY DATE(generate_time)
HAVING COUNT(*) > 0
ORDER BY DATE(generate_time) DESC
LIMIT 10;

-- 2. 基於托盤號模式，測試 2025-05-28 的數據
SELECT 'Testing 2025-05-28 data (based on plt_num pattern)' as info;

SELECT 
    COUNT(*) as total_280528,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as grn_280528,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as non_grn_280528
FROM record_palletinfo 
WHERE DATE(generate_time) = '2025-05-28';

-- 3. 測試 RPC 函數在 2025-05-28 的表現
SELECT 'RPC function test for 2025-05-28' as info;

-- 總數測試
SELECT 'Total pallets on 2025-05-28' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = ''2025-05-28''', 
    '', 
    ''
);

-- 排除GRN測試（關鍵測試案例）
SELECT 'Non-GRN pallets on 2025-05-28 (CRITICAL)' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = ''2025-05-28''', 
    '(plt_remark IS NULL OR plt_remark NOT LIKE ''%Material GRN%'')', 
    ''
);

-- GRN托盤測試
SELECT 'GRN pallets on 2025-05-28' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = ''2025-05-28''', 
    'plt_remark LIKE ''%Material GRN%''', 
    ''
);

-- 4. 如果5月28日沒有數據，測試其他可能的日期
SELECT 'Backup test: checking other recent dates' as info;

-- 測試最近一個有數據的日期的RPC函數
WITH recent_data_date AS (
    SELECT DATE(generate_time) as data_date
    FROM record_palletinfo 
    WHERE generate_time >= '2025-05-01'
    GROUP BY DATE(generate_time)
    HAVING COUNT(*) > 10  -- 至少有10個托盤的日期
    ORDER BY DATE(generate_time) DESC
    LIMIT 1
)
SELECT 
    'Most recent date with significant data: ' || data_date as info,
    data_date
FROM recent_data_date;

-- 5. 驗證數學邏輯：總數 = GRN + 非GRN
SELECT 'Mathematical verification for 2025-05-28' as info;

WITH counts AS (
    SELECT 
        (SELECT count FROM get_pallet_count_complex('DATE(generate_time) = ''2025-05-28''', '', '')) as total,
        (SELECT count FROM get_pallet_count_complex('DATE(generate_time) = ''2025-05-28''', 'plt_remark LIKE ''%Material GRN%''', '')) as grn,
        (SELECT count FROM get_pallet_count_complex('DATE(generate_time) = ''2025-05-28''', '(plt_remark IS NULL OR plt_remark NOT LIKE ''%Material GRN%'')', '')) as non_grn
)
SELECT 
    total,
    grn,
    non_grn,
    (grn + non_grn) as calculated_total,
    CASE 
        WHEN total = (grn + non_grn) THEN '✅ Math checks out!'
        ELSE '❌ Math error detected!'
    END as math_check,
    CASE 
        WHEN total = 28 AND grn = 14 AND non_grn = 14 THEN '🎯 Expected test values confirmed!'
        ELSE '📊 Different data pattern'
    END as expected_check
FROM counts; 