-- ========================================
-- PARTITIONING AND ARCHIVAL STRATEGY
-- Time-based Partitioning for Stock History Data
-- ========================================

-- 1. MONTHLY PARTITIONING SETUP
-- ==============================

-- Create parent table for partitioned record_history
CREATE TABLE record_history_partitioned (
    time timestamptz NOT NULL DEFAULT now(),
    id integer,
    action text NOT NULL,
    plt_num text,
    loc text,
    remark text NOT NULL DEFAULT '-'::text,
    uuid uuid NOT NULL DEFAULT gen_random_uuid()
) PARTITION BY RANGE (time);

-- Create partitions for next 12 months
DO $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
    month_offset integer;
BEGIN
    FOR month_offset IN 0..11 LOOP
        start_date := date_trunc('month', CURRENT_DATE + (month_offset || ' months')::interval);
        end_date := start_date + interval '1 month';
        partition_name := 'record_history_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
        
        EXECUTE format('
            CREATE TABLE %I PARTITION OF record_history_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date);
            
        -- Create indexes on each partition
        EXECUTE format('
            CREATE INDEX idx_%I_time ON %I (time DESC)',
            partition_name, partition_name);
        EXECUTE format('
            CREATE INDEX idx_%I_plt_time ON %I (plt_num, time DESC) WHERE plt_num IS NOT NULL',
            partition_name, partition_name);
    END LOOP;
END $$;

-- 2. AUTOMATED PARTITION MANAGEMENT
-- =================================

-- Function to create next month's partition
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    -- Create partition for 12 months from now
    start_date := date_trunc('month', CURRENT_DATE + interval '12 months');
    end_date := start_date + interval '1 month';
    partition_name := 'record_history_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
    
    EXECUTE format('
        CREATE TABLE %I PARTITION OF record_history_partitioned
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date);
        
    -- Create indexes
    EXECUTE format('
        CREATE INDEX idx_%I_time ON %I (time DESC)',
        partition_name, partition_name);
    EXECUTE format('
        CREATE INDEX idx_%I_plt_time ON %I (plt_num, time DESC) WHERE plt_num IS NOT NULL',
        partition_name, partition_name);
        
    -- Log creation
    INSERT INTO partition_management_log (operation, partition_name, created_at, status)
    VALUES ('CREATE_PARTITION', partition_name, NOW(), 'SUCCESS');
END;
$$;

-- Schedule monthly partition creation (cron: 0 0 1 * *)
SELECT cron.schedule('create-monthly-partition', '0 0 1 * *', 'SELECT create_monthly_partition();');

-- 3. DATA ARCHIVAL STRATEGY
-- =========================

-- Archive partitions older than 18 months
CREATE OR REPLACE FUNCTION archive_old_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    partition_rec record;
    archive_date date;
    partition_name text;
BEGIN
    archive_date := date_trunc('month', CURRENT_DATE - interval '18 months');
    
    FOR partition_rec IN 
        SELECT schemaname, tablename
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'record_history_y%m%'
          AND tablename <= 'record_history_y' || to_char(archive_date, 'YYYY') || 'm' || to_char(archive_date, 'MM')
    LOOP
        partition_name := partition_rec.tablename;
        
        -- Export to archive storage
        EXECUTE format('
            COPY %I TO ''/archive/stock_history/%I_%s.csv'' 
            WITH (FORMAT CSV, HEADER)',
            partition_name, partition_name, to_char(NOW(), 'YYYY_MM_DD'));
            
        -- Drop the partition after successful export
        EXECUTE format('DROP TABLE %I', partition_name);
        
        -- Log archival
        INSERT INTO partition_management_log (operation, partition_name, created_at, status)
        VALUES ('ARCHIVE_PARTITION', partition_name, NOW(), 'SUCCESS');
    END LOOP;
END;
$$;

-- Schedule quarterly archival (cron: 0 2 1 */3 *)
SELECT cron.schedule('archive-old-partitions', '0 2 1 */3 *', 'SELECT archive_old_partitions();');

-- 4. MIGRATION SCRIPT
-- ===================

-- Migrate existing data to partitioned table
CREATE OR REPLACE FUNCTION migrate_to_partitioned_table()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    batch_size integer := 10000;
    total_migrated integer := 0;
    batch_count integer;
BEGIN
    -- Create temporary table for migration tracking
    CREATE TEMP TABLE migration_progress (
        batch_number integer,
        min_time timestamptz,
        max_time timestamptz,
        row_count integer,
        completed_at timestamptz
    );
    
    -- Migrate in batches ordered by time
    LOOP
        WITH batch AS (
            SELECT * FROM record_history 
            WHERE time NOT IN (
                SELECT time FROM record_history_partitioned 
                WHERE uuid = record_history.uuid
            )
            ORDER BY time
            LIMIT batch_size
        )
        INSERT INTO record_history_partitioned 
        SELECT * FROM batch;
        
        GET DIAGNOSTICS batch_count = ROW_COUNT;
        EXIT WHEN batch_count = 0;
        
        total_migrated := total_migrated + batch_count;
        
        -- Log progress
        INSERT INTO migration_progress VALUES (
            total_migrated / batch_size,
            (SELECT MIN(time) FROM record_history_partitioned),
            (SELECT MAX(time) FROM record_history_partitioned),
            batch_count,
            NOW()
        );
        
        -- Commit batch
        COMMIT;
        
        -- Brief pause to avoid overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Total rows migrated: %', total_migrated;
END;
$$;

-- 5. RETENTION POLICY
-- ===================

-- Define retention policies per data type
CREATE TABLE data_retention_policy (
    table_name text PRIMARY KEY,
    retention_months integer NOT NULL,
    archive_location text,
    compression_enabled boolean DEFAULT true,
    last_cleanup_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);

-- Set retention policies
INSERT INTO data_retention_policy (table_name, retention_months, archive_location) VALUES
('record_history_partitioned', 18, '/archive/stock_history/'),
('record_palletinfo', 24, '/archive/pallet_info/'),
('stock_level', 12, '/archive/stock_levels/');

-- 6. DISASTER RECOVERY FOR PARTITIONS
-- ===================================

-- Backup recent partitions more frequently
CREATE OR REPLACE FUNCTION backup_recent_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    partition_rec record;
    backup_path text;
BEGIN
    -- Backup current month and last 2 months
    FOR partition_rec IN 
        SELECT schemaname, tablename
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'record_history_y%m%'
          AND tablename >= 'record_history_y' || to_char(CURRENT_DATE - interval '2 months', 'YYYY') || 'm' || to_char(CURRENT_DATE - interval '2 months', 'MM')
        ORDER BY tablename DESC
    LOOP
        backup_path := '/backup/partitions/' || partition_rec.tablename || '_' || to_char(NOW(), 'YYYY_MM_DD_HH24MI') || '.sql';
        
        EXECUTE format('
            SELECT pg_dump_table(''%I'', ''%s'')',
            partition_rec.tablename, backup_path);
            
        -- Log backup
        INSERT INTO backup_log (table_name, backup_path, created_at, status)
        VALUES (partition_rec.tablename, backup_path, NOW(), 'SUCCESS');
    END LOOP;
END;
$$;

-- Schedule daily backup of recent partitions (cron: 0 3 * * *)
SELECT cron.schedule('backup-recent-partitions', '0 3 * * *', 'SELECT backup_recent_partitions();');

-- 7. MONITORING PARTITION HEALTH
-- ==============================

-- View to monitor partition sizes and health
CREATE OR REPLACE VIEW v_partition_health AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    (SELECT count(*) FROM information_schema.tables 
     WHERE table_schema = schemaname AND table_name = tablename) as row_count,
    (SELECT max(time) FROM record_history_partitioned 
     WHERE tableoid = (schemaname||'.'||tablename)::regclass) as latest_data,
    (SELECT min(time) FROM record_history_partitioned 
     WHERE tableoid = (schemaname||'.'||tablename)::regclass) as earliest_data
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'record_history_y%m%'
ORDER BY tablename DESC;

-- Alert on partition issues
CREATE OR REPLACE FUNCTION check_partition_health()
RETURNS TABLE(alert_type text, partition_name text, issue_description text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Check for missing partitions (future months)
    WITH expected_partitions AS (
        SELECT 'record_history_y' || to_char(generate_series(
            date_trunc('month', CURRENT_DATE),
            date_trunc('month', CURRENT_DATE + interval '3 months'),
            interval '1 month'
        ), 'YYYY') || 'm' || to_char(generate_series(
            date_trunc('month', CURRENT_DATE),
            date_trunc('month', CURRENT_DATE + interval '3 months'),
            interval '1 month'
        ), 'MM') as expected_name
    ),
    existing_partitions AS (
        SELECT tablename as existing_name
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'record_history_y%m%'
    )
    SELECT 
        'MISSING_PARTITION'::text,
        ep.expected_name::text,
        'Future partition is missing and should be created'::text
    FROM expected_partitions ep
    LEFT JOIN existing_partitions ex ON ep.expected_name = ex.existing_name
    WHERE ex.existing_name IS NULL;
END;
$$;

-- 8. PERFORMANCE OPTIMIZATION FOR PARTITIONED TABLES
-- ==================================================

-- Enable constraint exclusion for better partition pruning
ALTER DATABASE wms_production SET constraint_exclusion = partition;

-- Update query planner statistics more frequently for partitioned tables
CREATE OR REPLACE FUNCTION update_partition_statistics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    partition_name text;
BEGIN
    -- Update statistics on all current partitions
    FOR partition_name IN 
        SELECT tablename
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'record_history_y%m%'
          AND tablename >= 'record_history_y' || to_char(CURRENT_DATE - interval '3 months', 'YYYY') || 'm' || to_char(CURRENT_DATE - interval '3 months', 'MM')
    LOOP
        EXECUTE format('ANALYZE %I', partition_name);
    END LOOP;
    
    -- Log statistics update
    INSERT INTO maintenance_log (operation, table_name, executed_at, status)
    VALUES ('UPDATE_STATISTICS', 'partitioned_tables', NOW(), 'SUCCESS');
END;
$$;

-- Schedule statistics update (cron: 0 4 * * 1)  -- Weekly on Monday
SELECT cron.schedule('update-partition-stats', '0 4 * * 1', 'SELECT update_partition_statistics();');