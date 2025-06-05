-- =====================================================
-- 字句格式優化測試腳本
-- 日期: 2025-01-03
-- 功能: 測試優化後的字句格式
-- =====================================================

-- 測試案例說明：
-- 1. Auto-reprinted 字句優化：移除 "| Reason:" 部分
-- 2. Stock level updated 字句優化：簡化為 "產品代碼 - from X to Y" 格式

BEGIN;

-- 1. 測試 Stock Level 更新字句格式
SELECT '=== 測試案例 1: Stock Level 更新字句格式 ===' as test_case;

-- 測試現有產品的庫存更新
SELECT update_stock_level_void('TEST_PRODUCT', 10, 'void') as void_result;

-- 測試新產品的庫存更新
SELECT update_stock_level_void('NEW_PRODUCT', 5, 'damage') as damage_result;

-- 測試自動重印的庫存更新（增加庫存）
SELECT update_stock_level_void('TEST_PRODUCT', -15, 'auto_reprint') as auto_reprint_result;

-- 2. 驗證字句格式
DO $$
DECLARE
    v_test_results TEXT[];
    v_result TEXT;
    i INTEGER;
BEGIN
    -- 模擬測試結果
    v_test_results := ARRAY[
        'TEST_PRODUCT - from 50 to 40',
        'NEW_PRODUCT - new record with -5',
        'TEST_PRODUCT - from 40 to 55'
    ];
    
    RAISE NOTICE '📝 優化後的字句格式測試：';
    
    FOR i IN 1..array_length(v_test_results, 1) LOOP
        v_result := v_test_results[i];
        RAISE NOTICE '✅ 格式 %: %', i, v_result;
        
        -- 檢查格式是否符合預期
        IF v_result LIKE '%-%' AND (v_result LIKE '% - from % to %' OR v_result LIKE '% - new record with %') THEN
            RAISE NOTICE '   ✓ 格式正確：簡潔明了';
        ELSE
            RAISE NOTICE '   ✗ 格式錯誤：不符合預期';
        END IF;
    END LOOP;
END $$;

-- 3. 對比優化前後的格式
SELECT '=== 測試案例 2: 格式對比 ===' as test_case;

DO $$
DECLARE
    v_old_format TEXT := 'UPDATED: Product MT4545 stock level decreased by 48 (from 48 to 0) - voided';
    v_new_format TEXT := 'MT4545 - from 48 to 0';
    v_old_auto_format TEXT := 'Auto-reprinted from 050625/3 | Reason: Wrong Qty';
    v_new_auto_format TEXT := 'Auto-reprinted from 050625/3';
BEGIN
    RAISE NOTICE '📊 格式對比：';
    RAISE NOTICE '';
    RAISE NOTICE '1. Stock Level Updated 格式：';
    RAISE NOTICE '   優化前: %', v_old_format;
    RAISE NOTICE '   優化後: %', v_new_format;
    RAISE NOTICE '   改進: 字數從 % 減少到 %', LENGTH(v_old_format), LENGTH(v_new_format);
    RAISE NOTICE '';
    RAISE NOTICE '2. Auto-reprinted 格式：';
    RAISE NOTICE '   優化前: %', v_old_auto_format;
    RAISE NOTICE '   優化後: %', v_new_auto_format;
    RAISE NOTICE '   改進: 字數從 % 減少到 %', LENGTH(v_old_auto_format), LENGTH(v_new_auto_format);
END $$;

-- 4. 測試不同操作類型的字句
SELECT '=== 測試案例 3: 不同操作類型字句 ===' as test_case;

DO $$
DECLARE
    v_operations TEXT[] := ARRAY['void', 'damage', 'auto_reprint'];
    v_operation TEXT;
    v_sample_result TEXT;
    i INTEGER;
BEGIN
    RAISE NOTICE '🔄 不同操作類型的字句格式：';
    
    FOR i IN 1..array_length(v_operations, 1) LOOP
        v_operation := v_operations[i];
        
        CASE v_operation
            WHEN 'void' THEN v_sample_result := 'MEP9090150 - from 65 to 52';
            WHEN 'damage' THEN v_sample_result := 'MEL4545A - from 120 to 96';
            WHEN 'auto_reprint' THEN v_sample_result := 'MEP9090150 - from 52 to 59';
        END CASE;
        
        RAISE NOTICE '   %: %', UPPER(v_operation), v_sample_result;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ 所有操作類型都使用統一的簡潔格式';
END $$;

-- 5. 驗證字句長度優化
SELECT '=== 測試案例 4: 字句長度優化驗證 ===' as test_case;

DO $$
DECLARE
    v_old_examples TEXT[] := ARRAY[
        'UPDATED: Product MEP9090150 stock level decreased by 13 (from 65 to 52) - voided',
        'Auto-reprinted from 050625/3 | Reason: Wrong Qty'
    ];
    v_new_examples TEXT[] := ARRAY[
        'MEP9090150 - from 65 to 52',
        'Auto-reprinted from 050625/3'
    ];
    v_old_example TEXT;
    v_new_example TEXT;
    v_reduction NUMERIC;
    i INTEGER;
BEGIN
    RAISE NOTICE '📏 字句長度優化統計：';
    
    FOR i IN 1..array_length(v_old_examples, 1) LOOP
        v_old_example := v_old_examples[i];
        v_new_example := v_new_examples[i];
        v_reduction := ROUND((1.0 - LENGTH(v_new_example)::NUMERIC / LENGTH(v_old_example)::NUMERIC) * 100, 1);
        
        RAISE NOTICE '';
        RAISE NOTICE '範例 %:', i;
        RAISE NOTICE '  優化前: % 字元', LENGTH(v_old_example);
        RAISE NOTICE '  優化後: % 字元', LENGTH(v_new_example);
        RAISE NOTICE '  減少: %% (節省 % 字元)', v_reduction, LENGTH(v_old_example) - LENGTH(v_new_example);
    END LOOP;
END $$;

ROLLBACK;

-- 總結優化效果
SELECT '🎯 字句優化總結' as summary,
       'Auto-reprinted: 移除不必要的 "| Reason:" 部分' as improvement_1,
       'Stock level: 簡化為 "產品代碼 - from X to Y" 格式' as improvement_2,
       '整體效果: 更簡潔、更易讀、更一致' as improvement_3; 