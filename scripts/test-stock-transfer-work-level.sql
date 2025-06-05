-- =====================================================
-- Stock Transfer Work Level 測試腳本
-- 日期: 2025-01-03
-- 功能: 測試 update_work_level_move 函數
-- =====================================================

-- 測試 1: 新增員工的第一個 move 記錄
SELECT 'Test 1: First move record for user 5997' as test_description;
SELECT update_work_level_move(5997, 1) as result;

-- 查看結果
SELECT 'Current work_level record for user 5997:' as description;
SELECT id, qc, move, grn, latest_update 
FROM work_level 
WHERE id = 5997 
AND DATE(latest_update) = CURRENT_DATE;

-- 測試 2: 更新現有員工的 move 記錄
SELECT 'Test 2: Update existing move record for user 5997' as test_description;
SELECT update_work_level_move(5997, 1) as result;

-- 查看更新後的結果
SELECT 'Updated work_level record for user 5997:' as description;
SELECT id, qc, move, grn, latest_update 
FROM work_level 
WHERE id = 5997 
AND DATE(latest_update) = CURRENT_DATE;

-- 測試 3: 測試多次移動
SELECT 'Test 3: Multiple moves for user 5997' as test_description;
SELECT update_work_level_move(5997, 3) as result;

-- 查看最終結果
SELECT 'Final work_level record for user 5997:' as description;
SELECT id, qc, move, grn, latest_update 
FROM work_level 
WHERE id = 5997 
AND DATE(latest_update) = CURRENT_DATE;

-- 測試 4: 測試無效用戶 ID
SELECT 'Test 4: Invalid user ID test' as test_description;
SELECT update_work_level_move(99999, 1) as result;

-- 清理測試數據（可選）
-- DELETE FROM work_level WHERE id = 5997 AND DATE(latest_update) = CURRENT_DATE; 