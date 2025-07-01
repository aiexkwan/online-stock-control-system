-- Database Migration: Remove Unused and Deprecated Functions
-- Date: 2025-01-01
-- Purpose: Clean up unused, deprecated, and potentially dangerous functions

-- IMPORTANT: Run this migration only after confirming all systems are stable with V6

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
    'generate_atomic_pallet_numbers_v5',
    'monitor_pallet_generation_performance',
    'process_atomic_stock_transfer',
    'enable_rls_and_policy_all',
    'cleanup_pallet_buffer'
)
AND query_start > NOW() - INTERVAL '7 days'
GROUP BY p.proname;
*/

-- Step 2: Drop deprecated functions
BEGIN;

-- Drop old pallet generation functions (V3-V5)
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v3(count integer);
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v4(p_count integer, p_session_id text);
DROP FUNCTION IF EXISTS public.generate_atomic_pallet_numbers_v5(p_count integer, p_session_id text);

-- Drop monitoring/test function
DROP FUNCTION IF EXISTS public.monitor_pallet_generation_performance();

-- Drop unused stock transfer function
DROP FUNCTION IF EXISTS public.process_atomic_stock_transfer(p_plt_num text, p_product_code text, p_product_qty integer, p_current_plt_loc text, p_new_plt_loc text, p_operator_id integer);

-- Drop dangerous RLS function
DROP FUNCTION IF EXISTS public.enable_rls_and_policy_all();

-- Drop old cleanup function (keeping auto_cleanup_pallet_buffer and api_cleanup_pallet_buffer)
DROP FUNCTION IF EXISTS public.cleanup_pallet_buffer();

-- Drop test function if it exists
DROP FUNCTION IF EXISTS public.test_atomic_pallet_generation();

-- Clean up old tables/sequences if they exist (from V3)
DROP TABLE IF EXISTS public.daily_pallet_sequence CASCADE;

COMMIT;

-- Step 3: Add comments to remaining important functions
COMMENT ON FUNCTION public.generate_atomic_pallet_numbers_v6(integer, text) IS 
'Generates unique pallet numbers and series using pre-generated buffer pool. 
Format: DDMMYY/1-300 for pallet numbers, DDMMYY-XXXXXX for series.
Uses atomic operations with hold/release mechanism to ensure uniqueness.
Buffer resets daily at midnight.';

COMMENT ON FUNCTION public.auto_cleanup_pallet_buffer() IS
'Core cleanup logic for pallet buffer. Removes old entries, expired holds, and maintains buffer size.
Called by other cleanup functions and during pallet generation.';

COMMENT ON FUNCTION public.api_cleanup_pallet_buffer() IS
'API endpoint for pallet buffer cleanup. Returns JSON with cleanup statistics.
Used by admin UI, cron jobs, and Edge Functions.';

-- Step 4: Verify cleanup was successful
/*
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_atomic_pallet_numbers_v3',
    'generate_atomic_pallet_numbers_v4',
    'generate_atomic_pallet_numbers_v5',
    'monitor_pallet_generation_performance',
    'process_atomic_stock_transfer',
    'enable_rls_and_policy_all',
    'cleanup_pallet_buffer'
);
*/

-- Expected result: No rows returned (all functions deleted)