-- =====================================================
-- 自動重印 Stock Level 更新功能測試腳本
-- 日期: 2025-01-03
-- 功能: 測試自動重印時 stock_level 表的同步更新
-- =====================================================

-- 測試前準備：檢查當前 stock_level 狀態
SELECT 
    'BEFORE AUTO REPRINT TEST' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock IN ('test', 'Z01ATM1', 'MT4545')
ORDER BY stock;

-- 測試案例 1：模擬自動重印操作（增加庫存）
-- 假設原本 void 了 10 個 test 產品，現在重印 20 個
SELECT 'TEST 1: Auto reprint - increase stock' as test_case;
SELECT update_stock_level_void('test', -20, 'auto_reprint') as result;

-- 檢查結果
SELECT 
    'AFTER TEST 1' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'test';

-- 測試案例 2：新產品的自動重印
-- 測試一個不存在於 stock_level 表中的產品
SELECT 'TEST 2: Auto reprint - new product' as test_case;
SELECT update_stock_level_void('NEW_PRODUCT_001', -15, 'auto_reprint') as result;

-- 檢查結果
SELECT 
    'AFTER TEST 2' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'NEW_PRODUCT_001';

-- 測試案例 3：混合操作測試
-- 先 void 一些數量，再自動重印
SELECT 'TEST 3: Mixed operations - void then auto reprint' as test_case;

-- 3a. 先 void 5 個
SELECT update_stock_level_void('Z01ATM1', 5, 'void') as void_result;

-- 3b. 再自動重印 8 個
SELECT update_stock_level_void('Z01ATM1', -8, 'auto_reprint') as reprint_result;

-- 檢查最終結果
SELECT 
    'AFTER TEST 3' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock = 'Z01ATM1';

-- 測試案例 4：錯誤處理測試
SELECT 'TEST 4: Error handling' as test_case;

-- 4a. 空產品代碼
SELECT update_stock_level_void('', -10, 'auto_reprint') as empty_code_result;

-- 4b. 零數量
SELECT update_stock_level_void('test', 0, 'auto_reprint') as zero_quantity_result;

-- 4c. NULL 產品代碼
SELECT update_stock_level_void(NULL, -10, 'auto_reprint') as null_code_result;

-- 測試總結：顯示所有測試產品的最終狀態
SELECT 
    'FINAL TEST SUMMARY' as test_phase,
    stock as product_code,
    description,
    stock_level,
    update_time
FROM stock_level 
WHERE stock IN ('test', 'Z01ATM1', 'MT4545', 'NEW_PRODUCT_001')
ORDER BY stock;

-- 清理測試數據（可選）
-- DELETE FROM stock_level WHERE stock = 'NEW_PRODUCT_001';

-- 測試說明
SELECT 'TEST EXPLANATION' as info, 
       '正數 p_quantity: 減少庫存 (void/damage)' as positive_quantity,
       '負數 p_quantity: 增加庫存 (auto_reprint)' as negative_quantity,
       '自動重印應該增加庫存，因為創建了新的托盤' as auto_reprint_logic; 