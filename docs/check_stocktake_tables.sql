-- Check if stock take enhancement tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'stocktake_batch_scan',
            'stocktake_session',
            'stocktake_variance_analysis',
            'stocktake_validation_rules',
            'stocktake_report_cache'
        ) THEN 'New Table (Create Required)'
        ELSE 'Existing Table'
    END as table_status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'record_stocktake',
    'stock_level',
    'data_code',
    'data_id',
    'record_palletinfo',
    'stocktake_batch_scan',
    'stocktake_session',
    'stocktake_variance_analysis',
    'stocktake_validation_rules',
    'stocktake_report_cache'
)
ORDER BY table_status, table_name;

-- Check if views exist
SELECT 
    table_name as view_name,
    CASE 
        WHEN table_name IN (
            'v_stocktake_daily_summary',
            'v_stocktake_batch'
        ) THEN 'New View (Create Required)'
        ELSE 'Existing View'
    END as view_status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
    'v_stocktake_daily_summary',
    'v_stocktake_batch'
);

-- Check if materialized views exist
SELECT 
    matviewname,
    CASE 
        WHEN matviewname = 'mv_stocktake_variance_report' 
        THEN 'New Materialized View (Create Required)'
        ELSE 'Existing Materialized View'
    END as mv_status
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname = 'mv_stocktake_variance_report';

-- Check if functions exist
SELECT 
    routine_name as function_name,
    CASE 
        WHEN routine_name IN (
            'validate_stocktake_count',
            'process_batch_scan',
            'refresh_stocktake_reports'
        ) THEN 'New Function (Create Required)'
        ELSE 'Existing Function'
    END as function_status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'validate_stocktake_count',
    'process_batch_scan',
    'refresh_stocktake_reports'
);

-- Quick test query for existing data
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(created_at)) as days_with_counts,
    MIN(created_at) as first_count,
    MAX(created_at) as last_count
FROM record_stocktake;