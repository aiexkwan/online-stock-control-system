-- Feature Flags Table Migration
-- This creates the necessary tables and functions for the Feature Flag system

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'boolean' CHECK (type IN ('boolean', 'percentage', 'variant', 'release')),
    status VARCHAR(50) NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'disabled', 'partial')),
    default_value JSONB NOT NULL DEFAULT 'false'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON public.feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tags ON public.feature_flags USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feature_flags_dates ON public.feature_flags(start_date, end_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feature_flags_updated_at();

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.feature_flags_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_id UUID REFERENCES public.feature_flags(id) ON DELETE CASCADE,
    flag_key VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'evaluated')),
    old_value JSONB,
    new_value JSONB,
    context JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_flag_id ON public.feature_flags_audit(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_created_at ON public.feature_flags_audit(created_at);

-- Create evaluation stats table
CREATE TABLE IF NOT EXISTS public.feature_flags_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_key VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    evaluations INTEGER DEFAULT 0,
    enabled_count INTEGER DEFAULT 0,
    disabled_count INTEGER DEFAULT 0,
    variant_distribution JSONB DEFAULT '{}'::jsonb,
    unique_users INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flag_key, date, hour)
);

-- Create index for stats queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_stats_key_date ON public.feature_flags_stats(flag_key, date);

-- Row Level Security (RLS)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags_stats ENABLE ROW LEVEL SECURITY;

-- Policies for feature_flags table
CREATE POLICY "Feature flags are viewable by authenticated users" ON public.feature_flags
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Feature flags are editable by admins only" ON public.feature_flags
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Policies for audit table
CREATE POLICY "Audit logs are viewable by admins" ON public.feature_flags_audit
    FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Audit logs are insertable by system" ON public.feature_flags_audit
    FOR INSERT WITH CHECK (true);

-- Policies for stats table
CREATE POLICY "Stats are viewable by authenticated users" ON public.feature_flags_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Stats are insertable by system" ON public.feature_flags_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Stats are updatable by system" ON public.feature_flags_stats
    FOR UPDATE USING (true) WITH CHECK (true);

-- Helper functions

-- Function to log feature flag evaluation
CREATE OR REPLACE FUNCTION public.log_feature_flag_evaluation(
    p_flag_key VARCHAR(255),
    p_enabled BOOLEAN,
    p_variant VARCHAR(255) DEFAULT NULL,
    p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
    v_current_hour INTEGER := EXTRACT(HOUR FROM NOW());
BEGIN
    -- Update stats
    INSERT INTO public.feature_flags_stats (
        flag_key,
        date,
        hour,
        evaluations,
        enabled_count,
        disabled_count,
        variant_distribution
    ) VALUES (
        p_flag_key,
        v_current_date,
        v_current_hour,
        1,
        CASE WHEN p_enabled THEN 1 ELSE 0 END,
        CASE WHEN NOT p_enabled THEN 1 ELSE 0 END,
        CASE
            WHEN p_variant IS NOT NULL
            THEN jsonb_build_object(p_variant, 1)
            ELSE '{}'::jsonb
        END
    )
    ON CONFLICT (flag_key, date, hour) DO UPDATE SET
        evaluations = feature_flags_stats.evaluations + 1,
        enabled_count = feature_flags_stats.enabled_count + CASE WHEN p_enabled THEN 1 ELSE 0 END,
        disabled_count = feature_flags_stats.disabled_count + CASE WHEN NOT p_enabled THEN 1 ELSE 0 END,
        variant_distribution = CASE
            WHEN p_variant IS NOT NULL THEN
                jsonb_set(
                    COALESCE(feature_flags_stats.variant_distribution, '{}'::jsonb),
                    ARRAY[p_variant],
                    to_jsonb(COALESCE((feature_flags_stats.variant_distribution ->> p_variant)::integer, 0) + 1)
                )
            ELSE feature_flags_stats.variant_distribution
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feature flag stats
CREATE OR REPLACE FUNCTION public.get_feature_flag_stats(
    p_flag_key VARCHAR(255),
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    total_evaluations BIGINT,
    total_enabled BIGINT,
    total_disabled BIGINT,
    enable_rate NUMERIC,
    variant_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.date,
        SUM(s.evaluations)::BIGINT as total_evaluations,
        SUM(s.enabled_count)::BIGINT as total_enabled,
        SUM(s.disabled_count)::BIGINT as total_disabled,
        CASE
            WHEN SUM(s.evaluations) > 0
            THEN ROUND((SUM(s.enabled_count)::NUMERIC / SUM(s.evaluations)::NUMERIC) * 100, 2)
            ELSE 0
        END as enable_rate,
        jsonb_object_agg(
            variant_key,
            variant_count
        ) FILTER (WHERE variant_key IS NOT NULL) as variant_distribution
    FROM
        public.feature_flags_stats s,
        LATERAL jsonb_each_text(s.variant_distribution) as v(variant_key, variant_count)
    WHERE
        s.flag_key = p_flag_key
        AND s.date BETWEEN p_start_date AND p_end_date
    GROUP BY s.date
    ORDER BY s.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default feature flags
INSERT INTO public.feature_flags (key, name, description, type, status, default_value, tags) VALUES
    ('new_dashboard', 'New Dashboard', 'Enable the new dashboard design', 'boolean', 'partial', 'false', ARRAY['ui', 'experiment']),
    ('dark_mode', 'Dark Mode', 'Enable dark mode theme', 'boolean', 'enabled', 'false', ARRAY['ui', 'theme']),
    ('advanced_search', 'Advanced Search', 'Enable advanced search features', 'boolean', 'partial', 'false', ARRAY['feature', 'search']),
    ('batch_operations', 'Batch Operations', 'Enable batch operations for inventory', 'boolean', 'enabled', 'true', ARRAY['feature', 'inventory']),
    ('lazy_loading', 'Lazy Loading', 'Enable lazy loading for performance', 'boolean', 'enabled', 'true', ARRAY['performance']),
    ('virtual_scrolling', 'Virtual Scrolling', 'Enable virtual scrolling for large lists', 'boolean', 'enabled', 'true', ARRAY['performance', 'ui'])
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.feature_flags_stats TO authenticated;
GRANT ALL ON public.feature_flags_stats TO service_role;
GRANT SELECT, INSERT ON public.feature_flags_audit TO authenticated;
GRANT ALL ON public.feature_flags_audit TO service_role;
