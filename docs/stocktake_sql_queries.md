# Stock Take SQL Queries

This document contains all SQL queries required for the stock take enhancement features.

## 🗃️ Complete SQL Script for Stock Take Enhancement

### 1. Create Tables

```sql
-- 1. Batch Scan Records Table
CREATE TABLE IF NOT EXISTS stocktake_batch_scan (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    plt_num TEXT REFERENCES record_palletinfo(plt_num),
    product_code TEXT NOT NULL,
    product_desc TEXT,
    counted_qty BIGINT DEFAULT 0,
    scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    user_id INTEGER REFERENCES data_id(id),
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stock Take Session Table
CREATE TABLE IF NOT EXISTS stocktake_session (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_date DATE DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    user_id INTEGER REFERENCES data_id(id),
    user_name TEXT,
    total_scans INTEGER DEFAULT 0,
    success_scans INTEGER DEFAULT 0,
    error_scans INTEGER DEFAULT 0,
    session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Stock Take Variance Analysis Table
CREATE TABLE IF NOT EXISTS stocktake_variance_analysis (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_date DATE DEFAULT CURRENT_DATE,
    product_code TEXT NOT NULL,
    product_desc TEXT,
    system_qty BIGINT,
    counted_qty BIGINT,
    variance_qty BIGINT,
    variance_percentage DECIMAL(10,2),
    variance_value DECIMAL(15,2),
    variance_reason TEXT,
    approved_by INTEGER REFERENCES data_id(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Stock Take Validation Rules Table
CREATE TABLE IF NOT EXISTS stocktake_validation_rules (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL UNIQUE,
    rule_type TEXT CHECK (rule_type IN ('quantity', 'percentage', 'value')),
    min_value DECIMAL(15,2),
    max_value DECIMAL(15,2),
    warning_threshold DECIMAL(15,2),
    error_threshold DECIMAL(15,2),
    require_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stock Take Report Cache Table
CREATE TABLE IF NOT EXISTS stocktake_report_cache (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_type TEXT CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    cache_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(report_date, report_type)
);
```

### 2. Create Indexes

```sql
-- Indexes for existing record_stocktake table
CREATE INDEX IF NOT EXISTS idx_stocktake_date ON record_stocktake(created_at);
CREATE INDEX IF NOT EXISTS idx_stocktake_product ON record_stocktake(product_code);
CREATE INDEX IF NOT EXISTS idx_stocktake_plt ON record_stocktake(plt_num);
CREATE INDEX IF NOT EXISTS idx_stocktake_composite ON record_stocktake(created_at, product_code);

-- Indexes for new tables
CREATE INDEX idx_batch_scan_batch ON stocktake_batch_scan(batch_id);
CREATE INDEX idx_batch_scan_product ON stocktake_batch_scan(product_code);
CREATE INDEX idx_batch_scan_timestamp ON stocktake_batch_scan(scan_timestamp);
CREATE INDEX idx_session_date ON stocktake_session(session_date);
CREATE INDEX idx_session_user ON stocktake_session(user_id);
CREATE INDEX idx_variance_date ON stocktake_variance_analysis(analysis_date);
CREATE INDEX idx_variance_product ON stocktake_variance_analysis(product_code);
```

### 3. Create Views

```sql
-- Daily Summary View
CREATE OR REPLACE VIEW v_stocktake_daily_summary AS
SELECT 
    DATE(created_at) as count_date,
    product_code,
    product_desc,
    COUNT(DISTINCT plt_num) as pallet_count,
    SUM(counted_qty) as total_counted,
    MIN(remain_qty) as final_remain_qty,
    MAX(created_at) as last_count_time
FROM record_stocktake
GROUP BY DATE(created_at), product_code, product_desc;

-- Batch Scan Summary View
CREATE OR REPLACE VIEW v_stocktake_batch AS
SELECT 
    DATE_TRUNC('minute', created_at) as batch_time,
    counted_id,
    counted_name,
    COUNT(*) as scan_count,
    COUNT(DISTINCT product_code) as product_count,
    SUM(counted_qty) as total_counted,
    MIN(created_at) as start_time,
    MAX(created_at) as end_time
FROM record_stocktake
WHERE plt_num IS NOT NULL
GROUP BY DATE_TRUNC('minute', created_at), counted_id, counted_name;
```

### 4. Create Materialized View

```sql
-- Variance Report Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stocktake_variance_report AS
SELECT 
    st.product_code,
    st.product_desc,
    DATE(st.created_at) as count_date,
    sl.stock_level as system_stock,
    SUM(st.counted_qty) as counted_stock,
    sl.stock_level - SUM(st.counted_qty) as variance,
    CASE 
        WHEN sl.stock_level > 0 
        THEN ((sl.stock_level - SUM(st.counted_qty))::DECIMAL / sl.stock_level * 100)
        ELSE 0 
    END as variance_percentage
FROM record_stocktake st
LEFT JOIN stock_level sl ON st.product_code = sl.stock
WHERE st.plt_num IS NOT NULL
GROUP BY st.product_code, st.product_desc, DATE(st.created_at), sl.stock_level;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_stocktake_date ON mv_stocktake_variance_report(count_date);
CREATE INDEX IF NOT EXISTS idx_mv_stocktake_product ON mv_stocktake_variance_report(product_code);
```

### 5. Insert Default Data

```sql
-- Insert default validation rules
INSERT INTO stocktake_validation_rules (rule_name, rule_type, warning_threshold, error_threshold, require_approval)
VALUES 
    ('Quantity Variance Check', 'percentage', 10, 20, TRUE),
    ('Negative Quantity Check', 'quantity', 0, NULL, FALSE),
    ('Maximum Count Limit', 'quantity', NULL, 99999, FALSE),
    ('Zero Count Warning', 'quantity', 1, 0, FALSE)
ON CONFLICT (rule_name) DO NOTHING;
```

### 6. Create Functions

```sql
-- Function: Validate Stock Count
CREATE OR REPLACE FUNCTION validate_stocktake_count(
    p_product_code TEXT,
    p_counted_qty BIGINT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_rules RECORD;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_stock_level BIGINT;
    v_variance_pct DECIMAL;
BEGIN
    -- Get current stock level
    SELECT stock_level INTO v_stock_level
    FROM stock_level
    WHERE stock = p_product_code;
    
    -- Check all active validation rules
    FOR v_rules IN 
        SELECT * FROM stocktake_validation_rules 
        WHERE is_active = TRUE
    LOOP
        -- Check quantity rules
        IF v_rules.rule_type = 'quantity' THEN
            IF v_rules.min_value IS NOT NULL AND p_counted_qty < v_rules.min_value THEN
                v_errors := array_append(v_errors, 
                    format('%s: Count %s below minimum %s', 
                        v_rules.rule_name, p_counted_qty, v_rules.min_value));
            END IF;
            
            IF v_rules.max_value IS NOT NULL AND p_counted_qty > v_rules.max_value THEN
                v_errors := array_append(v_errors, 
                    format('%s: Count %s exceeds maximum %s', 
                        v_rules.rule_name, p_counted_qty, v_rules.max_value));
            END IF;
        END IF;
        
        -- Check percentage rules
        IF v_rules.rule_type = 'percentage' AND v_stock_level > 0 THEN
            v_variance_pct := ABS((v_stock_level - p_counted_qty)::DECIMAL / v_stock_level * 100);
            
            IF v_rules.warning_threshold IS NOT NULL AND v_variance_pct > v_rules.warning_threshold THEN
                v_warnings := array_append(v_warnings, 
                    format('%s: Variance %.1f%% exceeds warning threshold %.1f%%', 
                        v_rules.rule_name, v_variance_pct, v_rules.warning_threshold));
            END IF;
            
            IF v_rules.error_threshold IS NOT NULL AND v_variance_pct > v_rules.error_threshold THEN
                v_errors := array_append(v_errors, 
                    format('%s: Variance %.1f%% exceeds error threshold %.1f%%', 
                        v_rules.rule_name, v_variance_pct, v_rules.error_threshold));
            END IF;
        END IF;
    END LOOP;
    
    -- Build result
    v_result := jsonb_build_object(
        'is_valid', array_length(v_errors, 1) IS NULL,
        'warnings', v_warnings,
        'errors', v_errors,
        'system_stock', v_stock_level,
        'counted_stock', p_counted_qty,
        'variance', v_stock_level - p_counted_qty,
        'variance_percentage', CASE 
            WHEN v_stock_level > 0 
            THEN ((v_stock_level - p_counted_qty)::DECIMAL / v_stock_level * 100)
            ELSE 0 
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Process Batch Scan
CREATE OR REPLACE FUNCTION process_batch_scan(
    p_batch_id UUID,
    p_scans JSONB
) RETURNS JSONB AS $$
DECLARE
    v_scan JSONB;
    v_result JSONB;
    v_success_count INT := 0;
    v_error_count INT := 0;
BEGIN
    -- Process each scan record
    FOR v_scan IN SELECT * FROM jsonb_array_elements(p_scans)
    LOOP
        BEGIN
            -- Insert batch scan record
            INSERT INTO stocktake_batch_scan (
                batch_id, plt_num, product_code, product_desc, 
                counted_qty, status, user_id, user_name
            ) VALUES (
                p_batch_id,
                v_scan->>'plt_num',
                v_scan->>'product_code',
                v_scan->>'product_desc',
                (v_scan->>'counted_qty')::BIGINT,
                'success',
                (v_scan->>'user_id')::INTEGER,
                v_scan->>'user_name'
            );
            
            v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Record error
            INSERT INTO stocktake_batch_scan (
                batch_id, plt_num, product_code, 
                status, error_message, user_id, user_name
            ) VALUES (
                p_batch_id,
                v_scan->>'plt_num',
                v_scan->>'product_code',
                'error',
                SQLERRM,
                (v_scan->>'user_id')::INTEGER,
                v_scan->>'user_name'
            );
            
            v_error_count := v_error_count + 1;
        END;
    END LOOP;
    
    -- Return processing result
    v_result := jsonb_build_object(
        'batch_id', p_batch_id,
        'total_processed', jsonb_array_length(p_scans),
        'success_count', v_success_count,
        'error_count', v_error_count
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refresh Reports
CREATE OR REPLACE FUNCTION refresh_stocktake_reports()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stocktake_variance_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 7. Create Triggers

```sql
-- Auto-update timestamp trigger
CREATE TRIGGER update_stocktake_validation_rules_updated_at
BEFORE UPDATE ON stocktake_validation_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 8. Grant Permissions

```sql
-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON stocktake_batch_scan TO authenticated;
GRANT SELECT, INSERT, UPDATE ON stocktake_session TO authenticated;
GRANT SELECT, INSERT ON stocktake_variance_analysis TO authenticated;
GRANT SELECT ON stocktake_validation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_report_cache TO authenticated;
GRANT SELECT ON v_stocktake_daily_summary TO authenticated;
GRANT SELECT ON mv_stocktake_variance_report TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION validate_stocktake_count TO authenticated;
GRANT EXECUTE ON FUNCTION process_batch_scan TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_stocktake_reports TO authenticated;
```

## 🔧 Maintenance Scripts

### Daily Maintenance

```sql
-- Refresh materialized views
SELECT refresh_stocktake_reports();

-- Clean up expired cache
DELETE FROM stocktake_report_cache 
WHERE expires_at < NOW();
```

### Weekly Maintenance

```sql
-- Archive old batch scans
INSERT INTO stocktake_batch_scan_archive
SELECT * FROM stocktake_batch_scan
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM stocktake_batch_scan
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Performance Monitoring

```sql
-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%stocktake%'
ORDER BY mean_time DESC
LIMIT 20;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup,
    n_dead_tup,
    n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) * 100 AS dead_percentage
FROM pg_stat_user_tables
WHERE tablename LIKE 'stocktake%'
ORDER BY n_dead_tup DESC;
```

## 📝 Rollback Script

```sql
-- Drop all stock take enhancement objects (use with caution!)
DROP TRIGGER IF EXISTS update_stocktake_validation_rules_updated_at ON stocktake_validation_rules;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS refresh_stocktake_reports();
DROP FUNCTION IF EXISTS process_batch_scan(UUID, JSONB);
DROP FUNCTION IF EXISTS validate_stocktake_count(TEXT, BIGINT);
DROP MATERIALIZED VIEW IF EXISTS mv_stocktake_variance_report;
DROP VIEW IF EXISTS v_stocktake_batch;
DROP VIEW IF EXISTS v_stocktake_daily_summary;
DROP TABLE IF EXISTS stocktake_report_cache;
DROP TABLE IF EXISTS stocktake_validation_rules;
DROP TABLE IF EXISTS stocktake_variance_analysis;
DROP TABLE IF EXISTS stocktake_session;
DROP TABLE IF EXISTS stocktake_batch_scan;
```