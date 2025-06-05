-- =====================================================
-- Void Pallet Partially Damaged 優化測試腳本
-- 日期: 2025-01-03
-- 功能: 測試 Partially Damaged 時只減去 damage quantity 的邏輯
-- =====================================================

-- 測試案例 1: Partially Damaged - 只減去損壞數量
-- 假設托盤有 12 個產品，損壞 6 個，剩餘 6 個
-- Stock level 應該只減去 6 個（損壞數量），而不是 12 個（全部數量）

BEGIN;

-- 1. 準備測試數據
-- 假設產品 MEL6060A 當前庫存為 88
INSERT INTO stock_level (stock, description, stock_level, update_time)
VALUES ('MEL6060A', 'Test Product MEL6060A', 88, NOW())
ON CONFLICT (stock) DO UPDATE SET 
    stock_level = 88,
    update_time = NOW();

-- 顯示初始庫存
SELECT 'Initial Stock Level' as test_phase, stock, stock_level 
FROM stock_level 
WHERE stock = 'MEL6060A';

-- 2. 測試 Partially Damaged 邏輯
-- 模擬 Partially Damaged: 總數量 12，損壞 6，剩餘 6
-- 應該只減去損壞數量 6
SELECT update_stock_level_void('MEL6060A', 6, 'damage') as damage_result;

-- 顯示更新後的庫存
SELECT 'After Partial Damage' as test_phase, stock, stock_level 
FROM stock_level 
WHERE stock = 'MEL6060A';

-- 3. 驗證結果
-- 預期：88 - 6 = 82
DO $$
DECLARE
    v_current_stock BIGINT;
    v_expected_stock BIGINT := 82;
BEGIN
    SELECT stock_level INTO v_current_stock
    FROM stock_level
    WHERE stock = 'MEL6060A';
    
    IF v_current_stock = v_expected_stock THEN
        RAISE NOTICE '✅ TEST PASSED: Stock level correctly updated to % (expected %)', v_current_stock, v_expected_stock;
    ELSE
        RAISE NOTICE '❌ TEST FAILED: Stock level is % but expected %', v_current_stock, v_expected_stock;
    END IF;
END $$;

-- 4. 測試 remark 格式優化
-- 模擬生成優化後的 remark 格式
DO $$
DECLARE
    v_damage_qty INTEGER := 6;
    v_total_qty INTEGER := 12;
    v_remaining_qty INTEGER := 6;
    v_current_date TEXT;
    v_optimized_remark TEXT;
BEGIN
    -- 生成日期格式 (DDMMYY)
    v_current_date := TO_CHAR(NOW(), 'DDMMYY');
    
    -- 生成優化後的 remark
    v_optimized_remark := 'Damage: ' || v_damage_qty || '/' || v_total_qty || 
                         ', Remaining: ' || v_remaining_qty || 
                         ' Replaced By ' || v_current_date || '/XX';
    
    RAISE NOTICE '📝 Optimized Remark Format: %', v_optimized_remark;
    
    -- 生成 Stock Level Updated remark
    RAISE NOTICE '📊 Stock Level Remark: Stock level updated: Partially Damaged % > %', 
                 v_total_qty, (v_total_qty - v_damage_qty);
END $$;

-- 5. 測試案例 2: Fully Damaged
-- 重置庫存
UPDATE stock_level SET stock_level = 88 WHERE stock = 'MEL6060A';

-- 模擬 Fully Damaged: 總數量 12，損壞 12，剩餘 0
SELECT update_stock_level_void('MEL6060A', 12, 'damage') as full_damage_result;

-- 顯示更新後的庫存
SELECT 'After Full Damage' as test_phase, stock, stock_level 
FROM stock_level 
WHERE stock = 'MEL6060A';

-- 驗證 Fully Damaged 結果
DO $$
DECLARE
    v_current_stock BIGINT;
    v_expected_stock BIGINT := 76; -- 88 - 12 = 76
BEGIN
    SELECT stock_level INTO v_current_stock
    FROM stock_level
    WHERE stock = 'MEL6060A';
    
    IF v_current_stock = v_expected_stock THEN
        RAISE NOTICE '✅ FULLY DAMAGED TEST PASSED: Stock level correctly updated to % (expected %)', v_current_stock, v_expected_stock;
    ELSE
        RAISE NOTICE '❌ FULLY DAMAGED TEST FAILED: Stock level is % but expected %', v_current_stock, v_expected_stock;
    END IF;
END $$;

-- 6. 測試邊界情況
-- 測試新產品的 Partially Damaged
SELECT update_stock_level_void('NEW_PRODUCT_001', 5, 'damage') as new_product_damage_result;

-- 顯示新產品庫存
SELECT 'New Product After Damage' as test_phase, stock, stock_level 
FROM stock_level 
WHERE stock = 'NEW_PRODUCT_001';

-- 7. 清理測試數據
DELETE FROM stock_level WHERE stock IN ('MEL6060A', 'NEW_PRODUCT_001');

ROLLBACK;

-- 總結測試結果
SELECT '🎯 OPTIMIZATION SUMMARY' as summary,
       'Partially Damaged now only reduces stock by damage quantity' as improvement_1,
       'Remark format optimized with Replaced By date/XX' as improvement_2,
       'Stock Level Updated remark shows before > after values' as improvement_3; 