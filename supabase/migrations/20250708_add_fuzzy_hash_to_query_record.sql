-- Migration: Add fuzzy_hash and cache invalidation columns to query_record table
-- Created: 2025-07-08
-- Purpose: Support fuzzy matching for cache optimization and cache invalidation

-- 1. Add fuzzy_hash column
ALTER TABLE query_record
ADD COLUMN IF NOT EXISTS fuzzy_hash VARCHAR(16);

-- 2. Add cache invalidation columns
ALTER TABLE query_record
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_reason TEXT;

-- 3. Create index for fuzzy_hash
CREATE INDEX IF NOT EXISTS idx_query_record_fuzzy_hash
ON query_record (fuzzy_hash)
WHERE fuzzy_hash IS NOT NULL;

-- 4. Create composite index for fuzzy_hash with created_at
CREATE INDEX IF NOT EXISTS idx_query_record_fuzzy_hash_created
ON query_record (fuzzy_hash, created_at DESC)
WHERE fuzzy_hash IS NOT NULL;

-- 5. Create index for expired_at
CREATE INDEX IF NOT EXISTS idx_query_record_expired_at
ON query_record (expired_at)
WHERE expired_at IS NOT NULL;

-- 6. Create index for non-expired records
CREATE INDEX IF NOT EXISTS idx_query_record_active
ON query_record (query_hash, created_at DESC)
WHERE expired_at IS NULL;

-- 7. Add comments
COMMENT ON COLUMN query_record.fuzzy_hash IS 'Fuzzy hash for semantic query matching (16 chars)';
COMMENT ON COLUMN query_record.expired_at IS 'Timestamp when cache entry was invalidated';
COMMENT ON COLUMN query_record.expired_reason IS 'Reason for cache invalidation';

-- 5. Create function to update existing records with fuzzy_hash (optional)
CREATE OR REPLACE FUNCTION update_existing_fuzzy_hashes()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- This is a placeholder function
  -- In production, you would implement the actual fuzzy hash generation logic
  -- For now, we'll leave existing records with NULL fuzzy_hash
  RAISE NOTICE 'Fuzzy hash update function created. Existing records will have NULL fuzzy_hash.';
END;
$$ LANGUAGE plpgsql;

-- Note: Existing records will have NULL fuzzy_hash values
-- They will be gradually updated as new queries come in
