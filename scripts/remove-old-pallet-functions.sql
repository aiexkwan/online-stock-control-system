-- 移除舊的棧板號生成函數
-- 生成時間: 2025-06-09T09:31:41.229Z
-- 目的: 防止意外調用舊版本函數

-- 1. 移除 generate_atomic_pallet_numbers 函數
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers(count INTEGER);

-- 2. 移除 test_atomic_pallet_generation 函數
DROP FUNCTION IF EXISTS public.test_atomic_pallet_generation();

-- 驗證函數已被移除
-- 以下查詢應該返回空結果
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_atomic_pallet_numbers', 'test_atomic_pallet_generation', 'monitor_pallet_generation_performance');
