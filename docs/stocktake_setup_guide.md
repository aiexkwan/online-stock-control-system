# Stock Take Enhancement Setup Guide

Follow these steps to enable the stock take enhancement features.

## Quick Setup (Run All SQL at Once)

Copy and paste this entire SQL script into your Supabase SQL Editor and run:

```sql
-- ============================================
-- STOCK TAKE ENHANCEMENT - COMPLETE SETUP
-- ============================================

-- 1. Create Tables (only if they don't exist)
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

CREATE TABLE IF NOT EXISTS stocktake_report_cache (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_type TEXT CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    cache_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(report_date, report_type)
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_stocktake_date ON record_stocktake(created_at);
CREATE INDEX IF NOT EXISTS idx_stocktake_product ON record_stocktake(product_code);
CREATE INDEX IF NOT EXISTS idx_stocktake_plt ON record_stocktake(plt_num);
CREATE INDEX IF NOT EXISTS idx_stocktake_composite ON record_stocktake(created_at, product_code);

CREATE INDEX IF NOT EXISTS idx_batch_scan_batch ON stocktake_batch_scan(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_scan_product ON stocktake_batch_scan(product_code);
CREATE INDEX IF NOT EXISTS idx_batch_scan_timestamp ON stocktake_batch_scan(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_session_date ON stocktake_session(session_date);
CREATE INDEX IF NOT EXISTS idx_session_user ON stocktake_session(user_id);
CREATE INDEX IF NOT EXISTS idx_variance_date ON stocktake_variance_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_variance_product ON stocktake_variance_analysis(product_code);

-- 3. Create Views
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

-- 4. Insert Default Validation Rules
INSERT INTO stocktake_validation_rules (rule_name, rule_type, warning_threshold, error_threshold, require_approval)
VALUES 
    ('Quantity Variance Check', 'percentage', 10, 20, TRUE),
    ('Negative Quantity Check', 'quantity', 0, NULL, FALSE),
    ('Maximum Count Limit', 'quantity', NULL, 99999, FALSE),
    ('Zero Count Warning', 'quantity', 1, 0, FALSE)
ON CONFLICT (rule_name) DO NOTHING;

-- 5. Grant Permissions
GRANT SELECT, INSERT, UPDATE ON stocktake_batch_scan TO authenticated;
GRANT SELECT, INSERT, UPDATE ON stocktake_session TO authenticated;
GRANT SELECT, INSERT ON stocktake_variance_analysis TO authenticated;
GRANT SELECT ON stocktake_validation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_report_cache TO authenticated;
GRANT SELECT ON v_stocktake_daily_summary TO authenticated;

-- 6. Enable RLS (Row Level Security) if needed
ALTER TABLE stocktake_batch_scan ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_variance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_report_cache ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies (allow authenticated users to access their own data)
CREATE POLICY "Users can view all stock take data" ON stocktake_batch_scan
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert stock take data" ON stocktake_batch_scan
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update stock take data" ON stocktake_batch_scan
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view all sessions" ON stocktake_session
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create sessions" ON stocktake_session
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update sessions" ON stocktake_session
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view variance analysis" ON stocktake_variance_analysis
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create variance analysis" ON stocktake_variance_analysis
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view validation rules" ON stocktake_validation_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage report cache" ON stocktake_report_cache
    FOR ALL TO authenticated USING (true);

-- Done! The stock take enhancement features are now ready to use.
```

## Verification

After running the setup script, verify everything is working:

```sql
-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'stocktake%'
ORDER BY table_name;

-- Check if validation rules were inserted
SELECT * FROM stocktake_validation_rules;

-- Test the report view
SELECT * FROM v_stocktake_daily_summary LIMIT 5;
```

## Troubleshooting

### Error: "Failed to load report data"
This usually means:
1. Tables haven't been created yet - run the setup script above
2. Permissions haven't been granted - check the GRANT statements
3. RLS policies are blocking access - check the policies

### Error: "relation does not exist"
This means the required tables haven't been created. Run the complete setup script above.

### No data showing in reports
This is normal if you haven't done any stock counts yet. The reports will show data after you start using the cycle count feature.

## Optional: Advanced Features

If you want to enable the advanced reporting features with materialized views and functions, run this additional script:

```sql
-- Create Materialized View (Note: This requires the stock_level table to have a 'stock' column)
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

-- Grant permissions
GRANT SELECT ON mv_stocktake_variance_report TO authenticated;
```

## Next Steps

1. Navigate to `/stock-take/cycle-count` to start counting
2. Use batch mode for faster counting of multiple items
3. View reports at `/stock-take/report`
4. Export reports as CSV for further analysis

For the complete SQL reference, see `docs/stocktake_sql_queries.md`.