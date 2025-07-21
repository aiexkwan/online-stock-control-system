-- 測試文件：測試 rpc_get_warehouse_work_level 函數
-- 注意：這個文件僅供測試用，不應該在生產環境執行

-- 1. 插入測試數據（如果需要）
/*
-- 插入測試 data_id 記錄
INSERT INTO data_id (id, department, description)
VALUES
    ('TEST001', 'Warehouse', 'Test Product 1'),
    ('TEST002', 'Warehouse', 'Test Product 2'),
    ('TEST003', 'Office', 'Test Product 3')
ON CONFLICT (id) DO NOTHING;

-- 插入測試 work_level 記錄
INSERT INTO work_level (id, operator, move, latest_update)
VALUES
    ('TEST001', 'John Doe', 50, NOW() - INTERVAL '1 day'),
    ('TEST001', 'Jane Smith', 30, NOW() - INTERVAL '1 day'),
    ('TEST002', 'John Doe', 40, NOW() - INTERVAL '2 days'),
    ('TEST002', 'Jane Smith', 60, NOW() - INTERVAL '2 days'),
    ('TEST001', 'Bob Wilson', 25, NOW()),
    ('TEST002', 'Bob Wilson', 35, NOW()),
    ('TEST003', 'Alice Brown', 100, NOW()) -- Office department, should be excluded
ON CONFLICT DO NOTHING;
*/

-- 2. 測試基本功能
SELECT '測試 1: 獲取過去 7 天的數據' as test_name;
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '7 days',
    NOW()
);

-- 3. 測試今天的數據
SELECT '測試 2: 獲取今天的數據' as test_name;
SELECT public.rpc_get_warehouse_work_level_today();

-- 4. 測試本週的數據
SELECT '測試 3: 獲取本週的數據' as test_name;
SELECT public.rpc_get_warehouse_work_level_this_week();

-- 5. 測試本月的數據
SELECT '測試 4: 獲取本月的數據' as test_name;
SELECT public.rpc_get_warehouse_work_level_this_month();

-- 6. 測試自定義日期範圍
SELECT '測試 5: 獲取過去 30 天的數據' as test_name;
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '30 days',
    NOW(),
    'Warehouse'
);

-- 7. 測試錯誤處理 - 無效日期範圍
SELECT '測試 6: 錯誤處理 - 開始日期大於結束日期' as test_name;
SELECT public.rpc_get_warehouse_work_level(
    NOW(),
    NOW() - INTERVAL '7 days'
);

-- 8. 測試錯誤處理 - 日期範圍太大
SELECT '測試 7: 錯誤處理 - 日期範圍超過 365 天' as test_name;
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '400 days',
    NOW()
);

-- 9. 性能測試
SELECT '測試 8: 性能分析' as test_name;
EXPLAIN (ANALYZE, BUFFERS, TIMING, VERBOSE)
SELECT public.rpc_get_warehouse_work_level(
    NOW() - INTERVAL '30 days',
    NOW()
);

-- 10. 檢查返回數據結構
SELECT '測試 9: 檢查返回數據結構' as test_name;
WITH result AS (
    SELECT public.rpc_get_warehouse_work_level(
        NOW() - INTERVAL '7 days',
        NOW()
    ) as data
)
SELECT
    jsonb_typeof(data) as result_type,
    jsonb_object_keys(data) as keys,
    jsonb_typeof(data->'daily_stats') as daily_stats_type,
    jsonb_typeof(data->'total_moves') as total_moves_type,
    jsonb_typeof(data->'unique_operators') as unique_operators_type,
    jsonb_typeof(data->'avg_moves_per_day') as avg_moves_per_day_type,
    jsonb_typeof(data->'peak_day') as peak_day_type,
    jsonb_typeof(data->'calculation_time') as calculation_time_type
FROM result;

-- 11. 檢查索引使用情況
SELECT '測試 10: 檢查相關索引' as test_name;
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('work_level', 'data_id')
    AND (
        indexname LIKE '%latest_update%'
        OR indexname LIKE '%department%'
        OR indexname LIKE '%_id%'
    )
ORDER BY tablename, indexname;

-- 12. 清理測試數據（如果需要）
/*
DELETE FROM work_level WHERE id LIKE 'TEST%';
DELETE FROM data_id WHERE id LIKE 'TEST%';
*/
