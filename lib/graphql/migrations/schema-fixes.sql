-- Migration Script for GraphQL Schema Fixes
-- Addresses database discrepancies found in department cards and stock history

-- ============================================================================
-- Phase 1: Add missing columns to record_transfer table
-- ============================================================================

-- Add action column to record_transfer table
-- This provides the missing 'action' field that GraphQL resolvers expect
ALTER TABLE record_transfer 
ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'TRANSFERRED';

-- Add computed action based on location transfer
UPDATE record_transfer 
SET action = CASE 
    WHEN f_loc LIKE '%PRODUCTION%' AND t_loc LIKE '%WAREHOUSE%' THEN 'PRODUCTION_TRANSFER'
    WHEN f_loc LIKE '%WAREHOUSE%' AND t_loc LIKE '%LOADING%' THEN 'LOADING_TRANSFER'
    WHEN f_loc = t_loc THEN 'LOCATION_UPDATE'
    ELSE 'TRANSFERRED'
END
WHERE action = 'TRANSFERRED';

-- Create index for better performance on action queries
CREATE INDEX IF NOT EXISTS idx_record_transfer_action ON record_transfer(action);
CREATE INDEX IF NOT EXISTS idx_record_transfer_date ON record_transfer(tran_date);
CREATE INDEX IF NOT EXISTS idx_record_transfer_operator ON record_transfer(operator_id);

-- ============================================================================
-- Phase 2: Create views for GraphQL compatibility
-- ============================================================================

-- Create a view that provides GraphQL-compatible field names for record_transfer
CREATE OR REPLACE VIEW v_graphql_transfer AS
SELECT 
    uuid AS id,
    tran_date AS transfer_date,
    f_loc AS from_location,
    t_loc AS to_location,
    plt_num AS pallet_number,
    operator_id,
    action,
    'MOVEMENT' AS action_type,
    CASE 
        WHEN f_loc LIKE '%PRODUCTION%' AND t_loc LIKE '%WAREHOUSE%' THEN 'INBOUND'
        WHEN f_loc LIKE '%WAREHOUSE%' AND t_loc LIKE '%LOADING%' THEN 'OUTBOUND'
        ELSE 'INTERNAL'
    END AS action_category
FROM record_transfer;

-- Create a view that provides GraphQL-compatible field names for record_palletinfo
CREATE OR REPLACE VIEW v_graphql_pallet_info AS
SELECT 
    plt_num AS id,
    generate_time,
    plt_num AS pallet_number,
    product_code,
    series,
    plt_remark AS remark,
    product_qty AS quantity,
    pdf_url,
    'CREATED' AS action,
    'SYSTEM_ACTION' AS action_type
FROM record_palletinfo;

-- Create unified stock history view
CREATE OR REPLACE VIEW v_graphql_stock_history AS
-- Stock creation records from record_palletinfo
SELECT 
    CONCAT(plt_num, '_', EXTRACT(EPOCH FROM generate_time)) AS id,
    generate_time AS timestamp,
    plt_num AS pallet_number,
    product_code,
    'CREATED' AS action,
    NULL AS location,
    NULL AS from_location,
    NULL AS to_location,
    NULL AS operator_id,
    'System' AS operator_name,
    product_qty AS quantity,
    plt_remark AS remark,
    'SYSTEM_ACTION' AS action_type,
    'ADMINISTRATIVE' AS action_category,
    generate_time AS created_at
FROM record_palletinfo

UNION ALL

-- Transfer records from record_transfer
SELECT 
    CONCAT(plt_num, '_', EXTRACT(EPOCH FROM tran_date)) AS id,
    tran_date AS timestamp,
    plt_num AS pallet_number,
    NULL AS product_code, -- Will need to be joined with pallet info
    action,
    t_loc AS location,
    f_loc AS from_location,
    t_loc AS to_location,
    operator_id,
    'Unknown' AS operator_name, -- Will need to be resolved via DataLoader
    NULL AS quantity,
    NULL AS remark,
    'MOVEMENT' AS action_type,
    CASE 
        WHEN f_loc LIKE '%PRODUCTION%' AND t_loc LIKE '%WAREHOUSE%' THEN 'INBOUND'
        WHEN f_loc LIKE '%WAREHOUSE%' AND t_loc LIKE '%LOADING%' THEN 'OUTBOUND'
        ELSE 'INTERNAL'
    END AS action_category,
    tran_date AS created_at
FROM record_transfer

UNION ALL

-- History records from record_history
SELECT 
    CONCAT(plt_num, '_', EXTRACT(EPOCH FROM time)) AS id,
    time AS timestamp,
    plt_num AS pallet_number,
    NULL AS product_code, -- Will need to be joined
    action,
    loc AS location,
    NULL AS from_location,
    NULL AS to_location,
    id AS operator_id,
    'Unknown' AS operator_name, -- Will need to be resolved
    NULL AS quantity,
    remark,
    CASE 
        WHEN action IN ('TRANSFERRED', 'MOVED', 'Stock Transfer', 'Loading') THEN 'MOVEMENT'
        WHEN action IN ('VOIDED', 'ALLOCATED', 'QUALITY_CHECK') THEN 'STATUS_CHANGE'
        WHEN action IN ('ADJUSTED', 'LOADED', 'UNLOADED') THEN 'QUANTITY_CHANGE'
        ELSE 'SYSTEM_ACTION'
    END AS action_type,
    CASE 
        WHEN action LIKE '%Loading%' OR loc LIKE '%LOADING%' THEN 'OUTBOUND'
        WHEN action LIKE '%Receiving%' OR loc LIKE '%RECEIVING%' THEN 'INBOUND'
        WHEN action LIKE '%Transfer%' AND loc IS NOT NULL THEN 'INTERNAL'
        ELSE 'ADMINISTRATIVE'
    END AS action_category,
    time AS created_at
FROM record_history;

-- Create indexes on the unified view
CREATE INDEX IF NOT EXISTS idx_stock_history_timestamp ON record_palletinfo(generate_time);
CREATE INDEX IF NOT EXISTS idx_stock_history_pallet ON record_palletinfo(plt_num);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON record_palletinfo(product_code);

-- ============================================================================
-- Phase 3: Create functions for data consistency
-- ============================================================================

-- Function to validate schema consistency
CREATE OR REPLACE FUNCTION check_graphql_schema_consistency()
RETURNS TABLE (
    table_name TEXT,
    issue_type TEXT,
    description TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for missing action column in record_transfer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'record_transfer' AND column_name = 'action'
    ) THEN
        RETURN QUERY SELECT 
            'record_transfer'::TEXT, 
            'missing_column'::TEXT, 
            'Missing action column'::TEXT, 
            'high'::TEXT;
    END IF;

    -- Check for NULL values in critical fields
    IF EXISTS (SELECT 1 FROM record_transfer WHERE operator_id IS NULL LIMIT 1) THEN
        RETURN QUERY SELECT 
            'record_transfer'::TEXT, 
            'null_values'::TEXT, 
            'NULL operator_id values found'::TEXT, 
            'medium'::TEXT;
    END IF;

    -- Check for orphaned records
    IF EXISTS (
        SELECT 1 FROM record_transfer rt 
        LEFT JOIN data_id di ON rt.operator_id = di.id 
        WHERE di.id IS NULL LIMIT 1
    ) THEN
        RETURN QUERY SELECT 
            'record_transfer'::TEXT, 
            'orphaned_records'::TEXT, 
            'Transfer records with invalid operator_id'::TEXT, 
            'medium'::TEXT;
    END IF;

    -- Add more consistency checks as needed
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate legacy data to new schema
CREATE OR REPLACE FUNCTION migrate_legacy_stock_data()
RETURNS INTEGER AS $$
DECLARE
    records_updated INTEGER := 0;
BEGIN
    -- Update any NULL action fields in record_transfer
    UPDATE record_transfer 
    SET action = 'TRANSFERRED'
    WHERE action IS NULL;
    
    GET DIAGNOSTICS records_updated = ROW_COUNT;
    
    -- Log the migration
    INSERT INTO migration_log (
        migration_name, 
        records_affected, 
        executed_at, 
        description
    ) VALUES (
        'schema_fixes_001', 
        records_updated, 
        NOW(), 
        'Updated NULL action fields in record_transfer'
    );
    
    RETURN records_updated;
END;
$$ LANGUAGE plpgsql;

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) NOT NULL,
    records_affected INTEGER DEFAULT 0,
    executed_at TIMESTAMP DEFAULT NOW(),
    description TEXT,
    success BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Phase 4: Create triggers for data consistency
-- ============================================================================

-- Trigger function to ensure action field is always populated
CREATE OR REPLACE FUNCTION ensure_transfer_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default action if not provided
    IF NEW.action IS NULL OR NEW.action = '' THEN
        NEW.action := 'TRANSFERRED';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_ensure_transfer_action ON record_transfer;
CREATE TRIGGER tr_ensure_transfer_action
    BEFORE INSERT OR UPDATE ON record_transfer
    FOR EACH ROW
    EXECUTE FUNCTION ensure_transfer_action();

-- ============================================================================
-- Phase 5: Data quality constraints
-- ============================================================================

-- Add constraints to prevent future data quality issues
ALTER TABLE record_transfer 
ADD CONSTRAINT chk_transfer_action_not_empty 
CHECK (action IS NOT NULL AND action != '');

ALTER TABLE record_transfer 
ADD CONSTRAINT chk_transfer_locations_not_empty 
CHECK (f_loc IS NOT NULL AND f_loc != '' AND t_loc IS NOT NULL AND t_loc != '');

ALTER TABLE record_palletinfo 
ADD CONSTRAINT chk_pallet_qty_positive 
CHECK (product_qty > 0);

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Verify the migration was successful
SELECT 'Migration Verification' AS status;

-- Check action column exists and is populated
SELECT 
    COUNT(*) AS total_transfers,
    COUNT(CASE WHEN action IS NOT NULL THEN 1 END) AS with_action,
    COUNT(CASE WHEN action IS NULL THEN 1 END) AS without_action
FROM record_transfer;

-- Check view functionality
SELECT 'View Test' AS test, COUNT(*) AS record_count 
FROM v_graphql_stock_history 
WHERE timestamp >= NOW() - INTERVAL '7 days';

-- Run consistency check
SELECT * FROM check_graphql_schema_consistency();