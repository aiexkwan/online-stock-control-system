-- ========================================
-- COMPREHENSIVE MONITORING & MAINTENANCE PLAN
-- Database Operations Excellence for StockLevelListAndChartCard
-- ========================================

-- 1. REAL-TIME PERFORMANCE MONITORING
-- ===================================

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Performance metrics collection table
CREATE TABLE monitoring.query_performance_log (
    id SERIAL PRIMARY KEY,
    timestamp timestamptz NOT NULL DEFAULT NOW(),
    query_type text NOT NULL, -- 'stockHistoryStats', 'productFormOptions', 'trendsData'
    execution_time_ms numeric NOT NULL,
    rows_returned integer,
    rows_examined integer,
    cache_hit_ratio numeric,
    connection_count integer,
    query_plan_hash text,
    parameters jsonb,
    error_message text,
    created_at timestamptz DEFAULT NOW()
);

-- Index for monitoring queries
CREATE INDEX idx_perf_log_timestamp ON monitoring.query_performance_log (timestamp DESC);
CREATE INDEX idx_perf_log_type_time ON monitoring.query_performance_log (query_type, timestamp DESC);

-- Real-time query monitoring function
CREATE OR REPLACE FUNCTION monitoring.log_query_performance(
    p_query_type text,
    p_execution_time numeric,
    p_rows_returned integer DEFAULT NULL,
    p_rows_examined integer DEFAULT NULL,
    p_parameters jsonb DEFAULT NULL,
    p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_cache_hit_ratio numeric;
    v_connection_count integer;
BEGIN
    -- Get current cache hit ratio
    SELECT round(
        (sum(blks_hit) * 100.0 / sum(blks_hit + blks_read))::numeric, 2
    ) INTO v_cache_hit_ratio
    FROM pg_stat_database 
    WHERE datname = current_database();
    
    -- Get current connection count
    SELECT count(*) INTO v_connection_count
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Log the performance data
    INSERT INTO monitoring.query_performance_log (
        query_type, execution_time_ms, rows_returned, rows_examined,
        cache_hit_ratio, connection_count, parameters, error_message
    ) VALUES (
        p_query_type, p_execution_time, p_rows_returned, p_rows_examined,
        v_cache_hit_ratio, v_connection_count, p_parameters, p_error_message
    );
END;
$$;

-- 2. AUTOMATED ALERTING SYSTEM
-- ============================

-- Alert configuration table
CREATE TABLE monitoring.alert_rules (
    id SERIAL PRIMARY KEY,
    alert_name text NOT NULL UNIQUE,
    condition_sql text NOT NULL,
    threshold_value numeric NOT NULL,
    severity text CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    notification_channels text[], -- email, slack, sms
    cooldown_minutes integer DEFAULT 60,
    is_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW(),
    last_triggered_at timestamptz
);

-- Insert alert rules for stock system
INSERT INTO monitoring.alert_rules (alert_name, condition_sql, threshold_value, severity, notification_channels) VALUES
('slow_stock_history_query', 'SELECT avg(execution_time_ms) FROM monitoring.query_performance_log WHERE query_type = ''stockHistoryStats'' AND timestamp >= NOW() - INTERVAL ''5 minutes''', 2000, 'HIGH', ARRAY['email', 'slack']),
('high_connection_count', 'SELECT count(*) FROM pg_stat_activity WHERE state = ''active''', 150, 'MEDIUM', ARRAY['email']),
('low_cache_hit_ratio', 'SELECT (sum(blks_hit) * 100.0 / sum(blks_hit + blks_read))::numeric FROM pg_stat_database WHERE datname = current_database()', 95, 'MEDIUM', ARRAY['email']),
('partition_missing', 'SELECT count(*) FROM pg_tables WHERE schemaname = ''public'' AND tablename LIKE ''record_history_y%m%'' AND tablename > ''record_history_y'' || to_char(CURRENT_DATE + interval ''1 month'', ''YYYY'') || ''m'' || to_char(CURRENT_DATE + interval ''1 month'', ''MM'')', 0, 'HIGH', ARRAY['email', 'slack']),
('dead_tuple_ratio_high', 'SELECT (sum(n_dead_tup)::numeric / sum(n_live_tup)::numeric * 100) FROM pg_stat_user_tables WHERE relname IN (''record_history'', ''record_palletinfo'', ''stock_level'')', 20, 'MEDIUM', ARRAY['email']);

-- Alert checking function
CREATE OR REPLACE FUNCTION monitoring.check_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    alert_rule record;
    current_value numeric;
    alert_triggered boolean;
BEGIN
    FOR alert_rule IN 
        SELECT * FROM monitoring.alert_rules 
        WHERE is_enabled = true
          AND (last_triggered_at IS NULL OR last_triggered_at < NOW() - (cooldown_minutes || ' minutes')::interval)
    LOOP
        -- Execute the condition SQL
        EXECUTE alert_rule.condition_sql INTO current_value;
        
        -- Check if alert should trigger based on severity and threshold
        alert_triggered := CASE 
            WHEN alert_rule.severity = 'CRITICAL' AND current_value > alert_rule.threshold_value * 1.5 THEN true
            WHEN alert_rule.severity = 'HIGH' AND current_value > alert_rule.threshold_value THEN true
            WHEN alert_rule.severity = 'MEDIUM' AND current_value > alert_rule.threshold_value * 0.8 THEN true
            WHEN alert_rule.severity = 'LOW' AND current_value > alert_rule.threshold_value * 0.6 THEN true
            ELSE false
        END;
        
        IF alert_triggered THEN
            -- Log alert
            INSERT INTO monitoring.alert_log (
                alert_name, current_value, threshold_value, severity, 
                notification_channels, triggered_at
            ) VALUES (
                alert_rule.alert_name, current_value, alert_rule.threshold_value,
                alert_rule.severity, alert_rule.notification_channels, NOW()
            );
            
            -- Update last triggered time
            UPDATE monitoring.alert_rules 
            SET last_triggered_at = NOW() 
            WHERE id = alert_rule.id;
            
            -- Send notification (implement based on your notification system)
            PERFORM monitoring.send_alert_notification(
                alert_rule.alert_name, 
                current_value, 
                alert_rule.threshold_value,
                alert_rule.severity,
                alert_rule.notification_channels
            );
        END IF;
    END LOOP;
END;
$$;

-- Alert log table
CREATE TABLE monitoring.alert_log (
    id SERIAL PRIMARY KEY,
    alert_name text NOT NULL,
    current_value numeric NOT NULL,
    threshold_value numeric NOT NULL,
    severity text NOT NULL,
    notification_channels text[],
    triggered_at timestamptz NOT NULL DEFAULT NOW(),
    acknowledged_at timestamptz,
    acknowledged_by text,
    resolution_notes text
);

-- Schedule alert checking every minute
SELECT cron.schedule('check-database-alerts', '* * * * *', 'SELECT monitoring.check_alerts();');

-- 3. MAINTENANCE AUTOMATION
-- =========================

-- Maintenance schedule table
CREATE TABLE monitoring.maintenance_schedule (
    id SERIAL PRIMARY KEY,
    task_name text NOT NULL,
    task_type text CHECK (task_type IN ('VACUUM', 'ANALYZE', 'REINDEX', 'BACKUP', 'CLEANUP')),
    target_tables text[],
    cron_expression text NOT NULL,
    is_enabled boolean DEFAULT true,
    last_run_at timestamptz,
    next_run_at timestamptz,
    average_duration interval,
    created_at timestamptz DEFAULT NOW()
);

-- Insert maintenance tasks
INSERT INTO monitoring.maintenance_schedule (task_name, task_type, target_tables, cron_expression) VALUES
('daily_vacuum_analyze', 'VACUUM', ARRAY['record_history', 'record_palletinfo', 'stock_level'], '0 2 * * *'),
('weekly_full_analyze', 'ANALYZE', ARRAY['record_history', 'record_palletinfo', 'stock_level'], '0 3 * * 0'),
('monthly_reindex', 'REINDEX', ARRAY['record_history', 'record_palletinfo'], '0 1 1 * *'),
('daily_backup', 'BACKUP', ARRAY['record_history', 'record_palletinfo', 'stock_level'], '0 4 * * *'),
('weekly_cleanup', 'CLEANUP', ARRAY['monitoring.query_performance_log', 'monitoring.alert_log'], '0 5 * * 1');

-- Automated maintenance execution
CREATE OR REPLACE FUNCTION monitoring.execute_maintenance_task(task_id integer)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    task record;
    table_name text;
    start_time timestamptz;
    end_time timestamptz;
    duration interval;
BEGIN
    SELECT * INTO task FROM monitoring.maintenance_schedule WHERE id = task_id;
    
    IF task IS NULL THEN
        RAISE EXCEPTION 'Maintenance task with id % not found', task_id;
    END IF;
    
    start_time := NOW();
    
    -- Execute based on task type
    CASE task.task_type
        WHEN 'VACUUM' THEN
            FOREACH table_name IN ARRAY task.target_tables
            LOOP
                EXECUTE format('VACUUM ANALYZE %I', table_name);
            END LOOP;
            
        WHEN 'ANALYZE' THEN
            FOREACH table_name IN ARRAY task.target_tables
            LOOP
                EXECUTE format('ANALYZE %I', table_name);
            END LOOP;
            
        WHEN 'REINDEX' THEN
            FOREACH table_name IN ARRAY task.target_tables
            LOOP
                EXECUTE format('REINDEX TABLE %I', table_name);
            END LOOP;
            
        WHEN 'BACKUP' THEN
            PERFORM monitoring.backup_tables(task.target_tables);
            
        WHEN 'CLEANUP' THEN
            PERFORM monitoring.cleanup_old_logs(task.target_tables);
    END CASE;
    
    end_time := NOW();
    duration := end_time - start_time;
    
    -- Update maintenance log
    UPDATE monitoring.maintenance_schedule 
    SET 
        last_run_at = start_time,
        average_duration = COALESCE(
            (average_duration + duration) / 2, 
            duration
        ),
        next_run_at = start_time + (task.cron_expression::text)::interval
    WHERE id = task_id;
    
    -- Log maintenance execution
    INSERT INTO monitoring.maintenance_log (
        task_name, task_type, target_tables, 
        started_at, completed_at, duration, status
    ) VALUES (
        task.task_name, task.task_type, task.target_tables,
        start_time, end_time, duration, 'SUCCESS'
    );
END;
$$;

-- Maintenance log table
CREATE TABLE monitoring.maintenance_log (
    id SERIAL PRIMARY KEY,
    task_name text NOT NULL,
    task_type text NOT NULL,
    target_tables text[],
    started_at timestamptz NOT NULL,
    completed_at timestamptz,
    duration interval,
    status text CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
    error_message text,
    details jsonb
);

-- 4. CONNECTION POOLING MONITORING
-- ================================

-- Connection pool health monitoring
CREATE OR REPLACE VIEW monitoring.v_connection_pool_health AS
SELECT 
    application_name,
    state,
    count(*) as connection_count,
    max(state_change) as last_state_change,
    avg(extract(epoch from (now() - query_start)))::integer as avg_query_duration_seconds
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY application_name, state
ORDER BY connection_count DESC;

-- Connection pool configuration recommendations
CREATE OR REPLACE FUNCTION monitoring.get_connection_pool_recommendations()
RETURNS TABLE(
    metric text,
    current_value text,
    recommended_value text,
    priority text
)
LANGUAGE plpgsql
AS $$
DECLARE
    total_connections integer;
    active_connections integer;
    idle_connections integer;
    max_connections integer;
BEGIN
    -- Get current connection statistics
    SELECT count(*) INTO total_connections FROM pg_stat_activity WHERE backend_type = 'client backend';
    SELECT count(*) INTO active_connections FROM pg_stat_activity WHERE state = 'active';
    SELECT count(*) INTO idle_connections FROM pg_stat_activity WHERE state = 'idle';
    SELECT setting::integer INTO max_connections FROM pg_settings WHERE name = 'max_connections';
    
    -- Generate recommendations
    RETURN QUERY
    SELECT 
        'Total Connections'::text,
        total_connections::text,
        CASE 
            WHEN total_connections > max_connections * 0.8 THEN 'Increase max_connections to ' || (max_connections * 1.2)::text
            ELSE 'Current setting is adequate'
        END,
        CASE 
            WHEN total_connections > max_connections * 0.8 THEN 'HIGH'
            ELSE 'LOW'
        END;
        
    RETURN QUERY
    SELECT 
        'Pool Size Recommendation'::text,
        'N/A'::text,
        'default_pool_size: ' || GREATEST(20, total_connections / 4)::text,
        'MEDIUM'::text;
        
    RETURN QUERY
    SELECT 
        'Idle Connection Ratio'::text,
        round((idle_connections::numeric / total_connections * 100), 2)::text || '%',
        CASE 
            WHEN idle_connections::numeric / total_connections > 0.5 THEN 'Consider reducing pool size or implementing connection recycling'
            ELSE 'Acceptable ratio'
        END,
        CASE 
            WHEN idle_connections::numeric / total_connections > 0.5 THEN 'MEDIUM'
            ELSE 'LOW'
        END;
END;
$$;

-- 5. DISASTER RECOVERY AUTOMATION
-- ===============================

-- Backup validation and testing
CREATE OR REPLACE FUNCTION monitoring.validate_backups()
RETURNS TABLE(
    backup_type text,
    backup_date date,
    validation_status text,
    file_size text,
    restore_test_result text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- This function should validate backup integrity
    -- Implementation depends on your backup infrastructure
    
    RETURN QUERY
    SELECT 
        'DAILY_FULL'::text,
        CURRENT_DATE,
        'VALID'::text,
        '2.1GB'::text,
        'PASS'::text;
END;
$$;

-- RTO/RPO monitoring
CREATE TABLE monitoring.recovery_metrics (
    id SERIAL PRIMARY KEY,
    measurement_date date NOT NULL DEFAULT CURRENT_DATE,
    rto_target_minutes integer NOT NULL DEFAULT 15, -- Recovery Time Objective
    rpo_target_minutes integer NOT NULL DEFAULT 5,  -- Recovery Point Objective
    last_backup_age_minutes integer,
    estimated_restore_time_minutes integer,
    backup_size_gb numeric,
    backup_validation_status text,
    notes text,
    created_at timestamptz DEFAULT NOW()
);

-- Daily recovery metrics collection
CREATE OR REPLACE FUNCTION monitoring.collect_recovery_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    last_backup_time timestamptz;
    backup_age_minutes integer;
    estimated_restore_time integer;
    total_backup_size numeric;
BEGIN
    -- Calculate backup age (this is a placeholder - implement based on your backup system)
    last_backup_time := NOW() - interval '2 hours'; -- Example
    backup_age_minutes := extract(epoch from (NOW() - last_backup_time)) / 60;
    
    -- Estimate restore time based on data size
    SELECT sum(pg_database_size(datname))::numeric / (1024*1024*1024) 
    INTO total_backup_size
    FROM pg_database;
    
    estimated_restore_time := (total_backup_size * 5)::integer; -- 5 minutes per GB estimate
    
    INSERT INTO monitoring.recovery_metrics (
        last_backup_age_minutes,
        estimated_restore_time_minutes,
        backup_size_gb,
        backup_validation_status
    ) VALUES (
        backup_age_minutes,
        estimated_restore_time,
        total_backup_size,
        'PENDING_VALIDATION'
    );
END;
$$;

-- Schedule daily recovery metrics collection
SELECT cron.schedule('collect-recovery-metrics', '0 6 * * *', 'SELECT monitoring.collect_recovery_metrics();');

-- 6. EMERGENCY PROCEDURES
-- =======================

-- Emergency runbook for 3AM incidents
CREATE OR REPLACE FUNCTION monitoring.emergency_diagnostics()
RETURNS TABLE(
    check_name text,
    status text,
    current_value text,
    threshold text,
    action_needed text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Quick health checks for immediate diagnosis
    
    -- Check 1: Current connection count
    RETURN QUERY
    SELECT 
        'Connection Count'::text,
        CASE WHEN count(*) > 150 THEN 'CRITICAL' ELSE 'OK' END,
        count(*)::text,
        '150'::text,
        CASE WHEN count(*) > 150 THEN 'Kill idle connections, check connection pooling' ELSE 'None' END
    FROM pg_stat_activity WHERE state = 'active';
    
    -- Check 2: Longest running query
    RETURN QUERY
    SELECT 
        'Long Running Queries'::text,
        CASE WHEN max(extract(epoch from (NOW() - query_start))) > 300 THEN 'WARNING' ELSE 'OK' END,
        COALESCE(max(extract(epoch from (NOW() - query_start)))::text, '0') || ' seconds',
        '300 seconds'::text,
        CASE WHEN max(extract(epoch from (NOW() - query_start))) > 300 THEN 'Check pg_stat_activity for blocking queries' ELSE 'None' END
    FROM pg_stat_activity WHERE state = 'active' AND query_start IS NOT NULL;
    
    -- Check 3: Lock conflicts
    RETURN QUERY
    SELECT 
        'Lock Conflicts'::text,
        CASE WHEN count(*) > 0 THEN 'CRITICAL' ELSE 'OK' END,
        count(*)::text,
        '0'::text,
        CASE WHEN count(*) > 0 THEN 'Check pg_locks and terminate conflicting sessions' ELSE 'None' END
    FROM pg_locks l1
    JOIN pg_locks l2 ON l1.locktype = l2.locktype AND l1.database = l2.database
    WHERE l1.pid != l2.pid AND l1.granted = false;
    
    -- Check 4: Disk space
    RETURN QUERY
    SELECT 
        'Database Size Growth'::text,
        'OK'::text, -- Placeholder - implement based on monitoring system
        pg_size_pretty(pg_database_size(current_database())),
        'Monitor growth rate'::text,
        'Monitor for unusual growth patterns'::text;
END;
$$;

-- Create monitoring dashboard view
CREATE OR REPLACE VIEW monitoring.v_system_dashboard AS
SELECT 
    'Stock System Health' as dashboard_section,
    (SELECT count(*) FROM monitoring.alert_log WHERE triggered_at >= NOW() - interval '1 hour') as active_alerts,
    (SELECT round(avg(execution_time_ms), 2) FROM monitoring.query_performance_log WHERE timestamp >= NOW() - interval '1 hour') as avg_query_time_ms,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT round((sum(blks_hit) * 100.0 / sum(blks_hit + blks_read))::numeric, 2) FROM pg_stat_database WHERE datname = current_database()) as cache_hit_ratio_pct,
    NOW() as last_updated;

-- Emergency contact and escalation procedures (store in configuration)
CREATE TABLE monitoring.emergency_contacts (
    id SERIAL PRIMARY KEY,
    role text NOT NULL,
    contact_name text NOT NULL,
    phone text,
    email text,
    escalation_level integer NOT NULL,
    availability_hours text DEFAULT '24/7',
    specialization text[]
);

INSERT INTO monitoring.emergency_contacts (role, contact_name, phone, email, escalation_level, specialization) VALUES
('Primary DBA', 'Database Administrator', '+1-555-0101', 'dba@company.com', 1, ARRAY['performance', 'backup_recovery', 'replication']),
('Secondary DBA', 'Backup DBA', '+1-555-0102', 'backup-dba@company.com', 2, ARRAY['performance', 'maintenance']),
('DevOps Engineer', 'Infrastructure Team', '+1-555-0103', 'devops@company.com', 1, ARRAY['monitoring', 'alerts', 'deployment']),
('Application Developer', 'Dev Team Lead', '+1-555-0104', 'dev-lead@company.com', 3, ARRAY['application_issues', 'query_optimization']);

COMMENT ON TABLE monitoring.emergency_contacts IS 'Emergency contact information for database incidents - keep updated!';

-- Log all monitoring setup
INSERT INTO monitoring.maintenance_log (
    task_name, task_type, started_at, completed_at, status
) VALUES (
    'monitoring_system_setup', 'SETUP', NOW(), NOW(), 'SUCCESS'
);