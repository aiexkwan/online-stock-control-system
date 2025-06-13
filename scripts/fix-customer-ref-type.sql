-- Fix customer_ref column type from bigint to text
-- This allows storing alphanumeric customer references like "PO0034637", "DSPO-0360425", etc.

BEGIN;

-- Step 1: Add a new temporary column with the correct type
ALTER TABLE data_order ADD COLUMN customer_ref_new TEXT;

-- Step 2: Copy existing data, converting numbers to text
UPDATE data_order SET customer_ref_new = customer_ref::TEXT WHERE customer_ref IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE data_order DROP COLUMN customer_ref;

-- Step 4: Rename the new column to the original name
ALTER TABLE data_order RENAME COLUMN customer_ref_new TO customer_ref;

-- Step 5: Add any constraints if needed (optional)
-- ALTER TABLE data_order ALTER COLUMN customer_ref SET NOT NULL; -- Uncomment if needed

COMMIT;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'data_order' AND column_name = 'customer_ref'; 