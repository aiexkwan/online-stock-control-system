-- =====================================================
-- Void Pallet Stock Level 更新功能測試腳本
-- 日期: 2025-01-03
-- 功能: 測試 void pallet 時 stock_level 表的同步更新
-- =====================================================

-- 測試前準備：檢查當前 stock_level 狀態
SELECT 
    'BEFORE TEST' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock IN ('TEST001', 'Z01ATM1', 'MT4545')
ORDER BY stock;

-- 測試案例 1：產品已存在於 stock_level 表中
-- 假設 Z01ATM1 已有庫存記錄，測試減少庫存
SELECT 'TEST 1: Existing product void' as test_case;
SELECT update_stock_level_void('Z01ATM1', 25, 'void') as result;

-- 檢查結果
SELECT 
    'AFTER TEST 1' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'Z01ATM1';

-- 測試案例 2：產品不存在於 stock_level 表中
-- 測試新產品的 void 操作
SELECT 'TEST 2: New product void' as test_case;
SELECT update_stock_level_void('TEST001', 10, 'void') as result;

-- 檢查結果
SELECT 
    'AFTER TEST 2' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'TEST001';

-- 測試案例 3：Damage 操作
-- 測試 damage 操作對庫存的影響
SELECT 'TEST 3: Damage operation' as test_case;
SELECT update_stock_level_void('MT4545', 15, 'damage') as result;

-- 檢查結果
SELECT 
    'AFTER TEST 3' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'MT4545';

-- 測試案例 4：錯誤處理 - 空產品代碼
SELECT 'TEST 4: Error handling - empty product code' as test_case;
SELECT update_stock_level_void('', 10, 'void') as result;

-- 測試案例 5：錯誤處理 - 零數量
SELECT 'TEST 5: Error handling - zero quantity' as test_case;
SELECT update_stock_level_void('TEST002', 0, 'void') as result;

-- 測試案例 6：錯誤處理 - 負數量
SELECT 'TEST 6: Error handling - negative quantity' as test_case;
SELECT update_stock_level_void('TEST003', -5, 'void') as result;

-- 測試後清理：移除測試數據
DELETE FROM stock_level WHERE stock IN ('TEST001', 'TEST002', 'TEST003');

-- 最終狀態檢查
SELECT 
    'FINAL STATE' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock IN ('Z01ATM1', 'MT4545')
ORDER BY stock;

-- 測試總結
SELECT 
    'TEST SUMMARY' as summary,
    'Void Pallet Stock Level Update Tests Completed' as message,
    NOW() as completion_time; 