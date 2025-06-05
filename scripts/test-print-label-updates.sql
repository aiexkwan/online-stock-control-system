-- =====================================================
-- Print Label Updates 功能測試腳本
-- 日期: 2025-01-03
-- 功能: 測試修正後的 handle_print_label_updates 函數
-- =====================================================

-- 測試前準備：檢查當前狀態
SELECT 'BEFORE TEST - Current work_level records for user 5997:' as description;
SELECT id, qc, move, grn, latest_update
FROM work_level
WHERE id = 5997
ORDER BY latest_update DESC
LIMIT 5;

SELECT 'BEFORE TEST - Current stock_level for test product:' as description;
SELECT stock, description, stock_level, update_time
FROM stock_level
WHERE stock = 'test'
LIMIT 1;

-- 測試案例 1：正常的 print label 更新
SELECT 'TEST 1: Normal print label update' as test_case;
SELECT handle_print_label_updates('test', 50, 5997, 2, 'Test Product Description') as result;

-- 檢查結果
SELECT 'AFTER TEST 1 - work_level record:' as description;
SELECT id, qc, move, grn, latest_update
FROM work_level
WHERE id = 5997
AND DATE(latest_update) = CURRENT_DATE;

SELECT 'AFTER TEST 1 - stock_level record:' as description;
SELECT stock, description, stock_level, update_time
FROM stock_level
WHERE stock = 'test';

-- 測試案例 2：同一天再次更新（應該累加）
SELECT 'TEST 2: Same day update (should accumulate)' as test_case;
SELECT handle_print_label_updates('test', 30, 5997, 1, 'Test Product Description') as result;

-- 檢查結果
SELECT 'AFTER TEST 2 - work_level record:' as description;
SELECT id, qc, move, grn, latest_update
FROM work_level
WHERE id = 5997
AND DATE(latest_update) = CURRENT_DATE;

SELECT 'AFTER TEST 2 - stock_level record:' as description;
SELECT stock, description, stock_level, update_time
FROM stock_level
WHERE stock = 'test';

-- 測試案例 3：新產品測試
SELECT 'TEST 3: New product test' as test_case;
SELECT handle_print_label_updates('NEW_TEST_PRODUCT', 25, 5997, 1, 'New Test Product') as result;

-- 檢查結果
SELECT 'AFTER TEST 3 - stock_level for new product:' as description;
SELECT stock, description, stock_level, update_time
FROM stock_level
WHERE stock = 'NEW_TEST_PRODUCT';

-- 測試案例 4：錯誤處理測試
SELECT 'TEST 4: Error handling tests' as test_case;

-- 4a. 不存在的用戶ID
SELECT 'Test 4a: Non-existent user ID' as sub_test;
SELECT handle_print_label_updates('test', 10, 99999, 1, 'Test') as result;

-- 4b. 不存在的產品代碼（如果 data_code 表中沒有）
SELECT 'Test 4b: Non-existent product code' as sub_test;
SELECT handle_print_label_updates('NONEXISTENT_PRODUCT', 10, 5997, 1, 'Test') as result;

-- 測試總結
SELECT 'FINAL TEST SUMMARY' as summary;
SELECT 'work_level records for user 5997 today:' as description;
SELECT id, qc, move, grn, latest_update
FROM work_level
WHERE id = 5997
AND DATE(latest_update) = CURRENT_DATE;

SELECT 'stock_level records for test products:' as description;
SELECT stock, description, stock_level, update_time
FROM stock_level
WHERE stock IN ('test', 'NEW_TEST_PRODUCT')
ORDER BY stock;

-- 清理測試數據（可選）
-- DELETE FROM work_level WHERE id = 5997 AND DATE(latest_update) = CURRENT_DATE;
-- DELETE FROM stock_level WHERE stock = 'NEW_TEST_PRODUCT';

-- 測試說明
SELECT 'TEST EXPLANATION' as info,
       'QC 欄位應該累加托盤數量' as qc_logic,
       'grn 欄位應該設為 0（QC 操作不影響 GRN）' as grn_logic,
       'stock_level 應該增加總數量' as stock_logic; 