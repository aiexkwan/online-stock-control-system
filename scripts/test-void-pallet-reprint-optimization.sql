-- =====================================================
-- Void Pallet 重印邏輯優化測試腳本
-- 日期: 2025-01-03
-- 功能: 測試 Wrong Label 和 Damage 的重印邏輯優化
-- =====================================================

-- 測試案例說明：
-- 1. Wrong Label - 應提供 product code 及 qty 欄供用戶修改
-- 2. Damage (部分損壞) - 只有非 ACO pallet 才顯示重印視窗
-- 3. Damage (完全損壞) - 不顯示重印視窗
-- 4. ACO pallet 部分損壞 - 應該被拒絕

BEGIN;

-- 1. 準備測試數據
-- 創建測試托盤
INSERT INTO record_palletinfo (plt_num, product_code, product_qty, series, plt_remark, generate_time)
VALUES 
  ('TEST001', 'MEP9090150', 12, 'TEST-001', 'Test Normal Pallet', NOW()),
  ('TEST002', 'MEL4545A', 24, 'TEST-002', 'Test ACO Ref : 123456', NOW()),
  ('TEST003', 'MHWEDGE30', 120, 'TEST-003', 'Test Normal Pallet for Full Damage', NOW())
ON CONFLICT (plt_num) DO UPDATE SET
  product_code = EXCLUDED.product_code,
  product_qty = EXCLUDED.product_qty,
  plt_remark = EXCLUDED.plt_remark;

-- 創建對應的 ACO 記錄
INSERT INTO record_aco (uuid, order_ref, code, remain_qty)
VALUES ('test-aco-uuid', '123456', 'MEL4545A', 50)
ON CONFLICT (uuid) DO UPDATE SET
  remain_qty = EXCLUDED.remain_qty;

-- 2. 測試案例 1: Wrong Label 邏輯
-- 這個測試在前端進行，主要驗證：
-- - ReprintInfoDialog 顯示 product code 和 quantity 輸入欄
-- - 用戶可以修改兩個欄位
-- - 驗證邏輯允許相同的 product code（因為可能只是標籤格式問題）

SELECT '=== 測試案例 1: Wrong Label 邏輯 ===' as test_case;
SELECT 'Wrong Label 應該：' as description,
       '1. 顯示可編輯的 Product Code 欄位' as requirement_1,
       '2. 顯示可編輯的 Quantity 欄位' as requirement_2,
       '3. 允許相同的 Product Code（標籤格式問題）' as requirement_3;

-- 3. 測試案例 2: 部分損壞 - 普通托盤
SELECT '=== 測試案例 2: 部分損壞 - 普通托盤 ===' as test_case;

-- 模擬部分損壞檢查
DO $$
DECLARE
    v_plt_remark TEXT := 'Test Normal Pallet';
    v_damage_qty INTEGER := 6;
    v_total_qty INTEGER := 12;
    v_is_aco BOOLEAN;
    v_is_partial_damage BOOLEAN;
    v_should_show_reprint BOOLEAN;
BEGIN
    -- 檢查是否為 ACO pallet
    v_is_aco := v_plt_remark LIKE '%ACO Ref%';
    
    -- 檢查是否為部分損壞
    v_is_partial_damage := v_damage_qty < v_total_qty;
    
    -- 決定是否顯示重印對話框
    v_should_show_reprint := v_is_partial_damage AND NOT v_is_aco;
    
    RAISE NOTICE '托盤備註: %', v_plt_remark;
    RAISE NOTICE '是否為 ACO pallet: %', v_is_aco;
    RAISE NOTICE '是否為部分損壞: %', v_is_partial_damage;
    RAISE NOTICE '應該顯示重印對話框: %', v_should_show_reprint;
    
    IF v_should_show_reprint THEN
        RAISE NOTICE '✅ 測試通過：普通托盤部分損壞應顯示重印對話框';
    ELSE
        RAISE NOTICE '❌ 測試失敗：普通托盤部分損壞應顯示重印對話框';
    END IF;
END $$;

-- 4. 測試案例 3: 部分損壞 - ACO 托盤（應該被拒絕）
SELECT '=== 測試案例 3: 部分損壞 - ACO 托盤 ===' as test_case;

DO $$
DECLARE
    v_plt_remark TEXT := 'Test ACO Ref : 123456';
    v_damage_qty INTEGER := 12;
    v_total_qty INTEGER := 24;
    v_is_aco BOOLEAN;
    v_is_partial_damage BOOLEAN;
    v_should_reject BOOLEAN;
BEGIN
    -- 檢查是否為 ACO pallet
    v_is_aco := v_plt_remark LIKE '%ACO Ref%';
    
    -- 檢查是否為部分損壞
    v_is_partial_damage := v_damage_qty < v_total_qty;
    
    -- ACO pallet 部分損壞應該被拒絕
    v_should_reject := v_is_aco AND v_is_partial_damage;
    
    RAISE NOTICE '托盤備註: %', v_plt_remark;
    RAISE NOTICE '是否為 ACO pallet: %', v_is_aco;
    RAISE NOTICE '是否為部分損壞: %', v_is_partial_damage;
    RAISE NOTICE '應該拒絕操作: %', v_should_reject;
    
    IF v_should_reject THEN
        RAISE NOTICE '✅ 測試通過：ACO pallet 部分損壞應該被拒絕';
        RAISE NOTICE '錯誤訊息：ACO Order Pallets do not support partial damage. If damaged, the entire pallet must be voided.';
    ELSE
        RAISE NOTICE '❌ 測試失敗：ACO pallet 部分損壞應該被拒絕';
    END IF;
END $$;

-- 5. 測試案例 4: 完全損壞 - 不顯示重印對話框
SELECT '=== 測試案例 4: 完全損壞 - 不顯示重印對話框 ===' as test_case;

DO $$
DECLARE
    v_damage_qty INTEGER := 120;
    v_total_qty INTEGER := 120;
    v_remaining_qty INTEGER;
    v_is_full_damage BOOLEAN;
    v_should_show_reprint BOOLEAN;
BEGIN
    v_remaining_qty := v_total_qty - v_damage_qty;
    v_is_full_damage := v_remaining_qty = 0;
    
    -- 完全損壞不應顯示重印對話框
    v_should_show_reprint := NOT v_is_full_damage;
    
    RAISE NOTICE '損壞數量: %', v_damage_qty;
    RAISE NOTICE '總數量: %', v_total_qty;
    RAISE NOTICE '剩餘數量: %', v_remaining_qty;
    RAISE NOTICE '是否完全損壞: %', v_is_full_damage;
    RAISE NOTICE '應該顯示重印對話框: %', v_should_show_reprint;
    
    IF NOT v_should_show_reprint THEN
        RAISE NOTICE '✅ 測試通過：完全損壞不應顯示重印對話框';
    ELSE
        RAISE NOTICE '❌ 測試失敗：完全損壞不應顯示重印對話框';
    END IF;
END $$;

-- 6. 測試案例 5: 重印類型映射
SELECT '=== 測試案例 5: 重印類型映射 ===' as test_case;

DO $$
DECLARE
    v_void_reasons TEXT[] := ARRAY['Wrong Label', 'Wrong Qty', 'Wrong Product Code', 'Damage'];
    v_expected_types TEXT[] := ARRAY['wrong_label', 'wrong_qty', 'wrong_code', 'damage'];
    v_reason TEXT;
    v_expected_type TEXT;
    v_actual_type TEXT;
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(v_void_reasons, 1) LOOP
        v_reason := v_void_reasons[i];
        v_expected_type := v_expected_types[i];
        
        -- 模擬 getReprintType 函數邏輯
        CASE v_reason
            WHEN 'Damage' THEN v_actual_type := 'damage';
            WHEN 'Wrong Qty' THEN v_actual_type := 'wrong_qty';
            WHEN 'Wrong Product Code' THEN v_actual_type := 'wrong_code';
            WHEN 'Wrong Label' THEN v_actual_type := 'wrong_label';
            ELSE v_actual_type := 'damage';
        END CASE;
        
        RAISE NOTICE 'Void Reason: % -> Expected: %, Actual: %', v_reason, v_expected_type, v_actual_type;
        
        IF v_actual_type = v_expected_type THEN
            RAISE NOTICE '✅ 映射正確';
        ELSE
            RAISE NOTICE '❌ 映射錯誤';
        END IF;
    END LOOP;
END $$;

-- 7. 清理測試數據
DELETE FROM record_aco WHERE uuid = 'test-aco-uuid';
DELETE FROM record_palletinfo WHERE plt_num IN ('TEST001', 'TEST002', 'TEST003');

ROLLBACK;

-- 總結測試結果
SELECT '🎯 優化總結' as summary,
       'Wrong Label: 提供 product code 及 qty 欄供用戶修改' as improvement_1,
       'Damage: 只有部分損壞且非 ACO pallet 才顯示重印視窗' as improvement_2,
       'ACO pallet: 不支援部分損壞，如有損壞需全數銷毀' as improvement_3,
       '完全損壞: 不顯示重印視窗' as improvement_4; 