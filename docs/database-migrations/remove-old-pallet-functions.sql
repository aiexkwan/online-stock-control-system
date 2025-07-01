-- Database Migration: Remove Old Pallet Generation Functions (V3-V5)
-- Date: 2025-01-01
-- Purpose: Clean up deprecated pallet generation functions after migrating to V6

-- IMPORTANT: Run this migration only after confirming all systems are using V6

-- Step 1: Verify no recent usage (run this query first)
-- This should return 0 for all functions if safe to proceed
/*
SELECT 
    p.proname as function_name,
    COUNT(DISTINCT date_trunc('day', query_start)) as days_used_recently
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_stat_activity ON pg_stat_activity.query LIKE '%' || p.proname || '%'
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_atomic_pallet_numbers_v3',
    'generate_atomic_pallet_numbers_v4',
    'generate_atomic_pallet_numbers_v5'
)
AND query_start > NOW() - INTERVAL '7 days'
GROUP BY p.proname;
*/

-- Step 2: Drop deprecated functions
BEGIN;

-- Drop V3 function
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v3(count integer);

-- Drop V4 function  
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v4(p_count integer, p_session_id text);

-- Drop V5 function
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v5(p_count integer, p_session_id text);

-- Drop test functions that are no longer needed
DROP FUNCTION IF EXISTS public.test_atomic_pallet_generation();
DROP FUNCTION IF EXISTS public.monitor_pallet_generation_performance();

-- Clean up old tables/sequences if they exist (from V3)
DROP TABLE IF EXISTS public.daily_pallet_sequence CASCADE;

COMMIT;

-- Step 3: Add comments to V6 function for documentation
COMMENT ON FUNCTION public.generate_atomic_pallet_numbers_v6(integer, text) IS 
'Generates unique pallet numbers and series using pre-generated buffer pool. 
Format: DDMMYY/1-300 for pallet numbers, DDMMYY-XXXXXX for series.
Uses atomic operations with hold/release mechanism to ensure uniqueness.
Buffer resets daily at midnight.';

-- Step 4: Verify only V6 remains
/*
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname LIKE '%generate_atomic_pallet_numbers%'
ORDER BY p.proname;
*/

-- Expected result: Only generate_atomic_pallet_numbers_v6 should remain