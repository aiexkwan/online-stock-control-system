-- 刪除已棄用嘅棧板生成相關函數
-- 執行日期: 2025-06-26
-- 
-- 呢個腳本會刪除以下已確認冇使用嘅函數：
-- 1. generate_atomic_pallet_numbers_v5_with_cleanup - 只存在於 GraphQL schema，冇實際調用
-- 2. test_atomic_pallet_generation_v2 - 完全冇引用
-- 3. monitor_pallet_generation_performance_v2 - 完全冇引用

BEGIN;

-- 1. 刪除 generate_atomic_pallet_numbers_v5_with_cleanup
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v5_with_cleanup(p_count integer, p_session_id text);

-- 2. 刪除 test_atomic_pallet_generation_v2
DROP FUNCTION IF EXISTS public.test_atomic_pallet_generation_v2();

-- 3. 刪除 monitor_pallet_generation_performance_v2
DROP FUNCTION IF EXISTS public.monitor_pallet_generation_performance_v2();

-- 驗證函數已被刪除
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'generate_atomic_pallet_numbers_v5_with_cleanup',
        'test_atomic_pallet_generation_v2',
        'monitor_pallet_generation_performance_v2'
    );
    
    IF v_count > 0 THEN
        RAISE EXCEPTION '刪除失敗：仍有 % 個函數未被刪除', v_count;
    ELSE
        RAISE NOTICE '成功刪除所有已棄用嘅函數';
    END IF;
END $$;

COMMIT;

-- 列出剩餘嘅棧板生成相關函數（供參考）
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    obj_description(p.oid, 'pg_proc') AS description
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname LIKE '%pallet%'
    AND p.prokind = 'f'
ORDER BY 
    p.proname;