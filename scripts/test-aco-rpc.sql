-- Test script for get_aco_order_details RPC function
-- Run this in Supabase SQL editor to verify the function works correctly

-- Test 1: Get available orders only (no order_ref provided)
SELECT get_aco_order_details('YOUR_PRODUCT_CODE_HERE', NULL);

-- Test 2: Get specific order details
SELECT get_aco_order_details('YOUR_PRODUCT_CODE_HERE', '12345');

-- Test 3: Invalid product code
SELECT get_aco_order_details('', NULL);

-- Test 4: Non-existent order
SELECT get_aco_order_details('YOUR_PRODUCT_CODE_HERE', '99999');

-- Example to check actual data in record_aco table
-- SELECT order_ref, code, finished_qty, required_qty 
-- FROM record_aco 
-- WHERE code = 'YOUR_PRODUCT_CODE_HERE'
-- ORDER BY order_ref;