-- 調查數據庫中的實際數據情況

-- 1. 檢查 record_palletinfo 表中最近的數據
SELECT 'Recent data investigation' as info;

-- 查看最近 5 條記錄的日期和備註
SELECT 
    plt_num,
    generate_time,
    plt_remark,
    DATE(generate_time) as date_part,
    CURRENT_DATE as today_date
FROM record_palletinfo 
ORDER BY generate_time DESC 
LIMIT 5;

-- 2. 檢查不同日期的數據分佈
SELECT 
    'Data distribution by date' as info;

SELECT 
    DATE(generate_time) as date_part,
    COUNT(*) as total_count,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as grn_count,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as non_grn_count
FROM record_palletinfo 
WHERE generate_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(generate_time)
ORDER BY DATE(generate_time) DESC;

-- 3. 檢查今天的具體情況
SELECT 'Today specific analysis' as info;

-- 檢查今天的數據（如果有的話）
SELECT 
    COUNT(*) as today_total,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as today_grn,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as today_non_grn,
    CURRENT_DATE as checking_date
FROM record_palletinfo 
WHERE DATE(generate_time) = CURRENT_DATE;

-- 4. 檢查昨天的數據作為參考
SELECT 'Yesterday reference data' as info;

SELECT 
    COUNT(*) as yesterday_total,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as yesterday_grn,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as yesterday_non_grn,
    (CURRENT_DATE - INTERVAL '1 day') as yesterday_date
FROM record_palletinfo 
WHERE DATE(generate_time) = (CURRENT_DATE - INTERVAL '1 day');

-- 5. 檢查前天的數據作為參考
SELECT 'Day before yesterday reference' as info;

SELECT 
    COUNT(*) as day_before_total,
    COUNT(CASE WHEN plt_remark LIKE '%Material GRN%' THEN 1 END) as day_before_grn,
    COUNT(CASE WHEN plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%' THEN 1 END) as day_before_non_grn,
    (CURRENT_DATE - INTERVAL '2 day') as day_before_date
FROM record_palletinfo 
WHERE DATE(generate_time) = (CURRENT_DATE - INTERVAL '2 day');

-- 6. 測試我們的 RPC 函數在有數據的日期
SELECT 'Testing RPC function with known data dates' as info;

-- 如果昨天有數據，測試昨天的RPC結果
SELECT 'RPC test for yesterday' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = (CURRENT_DATE - INTERVAL ''1 day'')', 
    '', 
    ''
);

-- 測試昨天排除GRN
SELECT 'RPC test for yesterday non-GRN' as test_name, count 
FROM get_pallet_count_complex(
    'DATE(generate_time) = (CURRENT_DATE - INTERVAL ''1 day'')', 
    '(plt_remark IS NULL OR plt_remark NOT LIKE ''%Material GRN%'')', 
    ''
);

-- 7. 檢查時區問題
SELECT 
    'Timezone investigation' as info,
    NOW() as current_timestamp,
    CURRENT_DATE as current_date,
    CURRENT_TIME as current_time,
    NOW()::date as now_as_date; 