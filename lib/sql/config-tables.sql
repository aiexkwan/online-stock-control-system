-- Config System Tables
-- This file creates the necessary tables for the ConfigCard GraphQL resolver

-- System configs table
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  default_value JSONB,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'SYSTEM_CONFIG',
    'USER_PREFERENCES',
    'DEPARTMENT_CONFIG',
    'NOTIFICATION_CONFIG',
    'API_CONFIG',
    'SECURITY_CONFIG',
    'DISPLAY_CONFIG',
    'WORKFLOW_CONFIG'
  )),
  scope VARCHAR(20) NOT NULL CHECK (scope IN (
    'GLOBAL',
    'DEPARTMENT',
    'USER',
    'ROLE'
  )),
  scope_id VARCHAR(255),
  description TEXT,
  data_type VARCHAR(20) NOT NULL CHECK (data_type IN (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON',
    'ARRAY',
    'DATE',
    'COLOR',
    'URL'
  )),
  validation JSONB,
  metadata JSONB,
  tags TEXT[],
  access_level VARCHAR(20) NOT NULL DEFAULT 'AUTHENTICATED' CHECK (access_level IN (
    'PUBLIC',
    'AUTHENTICATED',
    'DEPARTMENT',
    'ADMIN',
    'SUPER_ADMIN'
  )),
  is_inherited BOOLEAN DEFAULT FALSE,
  inherited_from VARCHAR(20),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for key-scope combination
  CONSTRAINT unique_config_key_scope UNIQUE (key, scope, scope_id)
);

-- Config history table
CREATE TABLE IF NOT EXISTS config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES system_configs(id) ON DELETE CASCADE,
  previous_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,
  metadata JSONB
);

-- Config templates table
CREATE TABLE IF NOT EXISTS config_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  scope VARCHAR(20) NOT NULL,
  configs JSONB NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  
  -- Unique template names per category
  CONSTRAINT unique_template_name UNIQUE (name, category)
);

-- Indexes for performance
CREATE INDEX idx_system_configs_key ON system_configs(key);
CREATE INDEX idx_system_configs_category ON system_configs(category);
CREATE INDEX idx_system_configs_scope ON system_configs(scope, scope_id);
CREATE INDEX idx_system_configs_tags ON system_configs USING GIN(tags);
CREATE INDEX idx_system_configs_updated_at ON system_configs(updated_at DESC);

CREATE INDEX idx_config_history_config_id ON config_history(config_id);
CREATE INDEX idx_config_history_changed_at ON config_history(changed_at DESC);

CREATE INDEX idx_config_templates_category ON config_templates(category);
CREATE INDEX idx_config_templates_is_public ON config_templates(is_public);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configs_updated_at 
  BEFORE UPDATE ON system_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_configs
-- Public configs can be read by anyone
CREATE POLICY "Public configs are viewable by all" ON system_configs
  FOR SELECT
  USING (access_level = 'PUBLIC');

-- Authenticated users can read authenticated-level configs
CREATE POLICY "Authenticated users can read authenticated configs" ON system_configs
  FOR SELECT
  TO authenticated
  USING (access_level IN ('PUBLIC', 'AUTHENTICATED'));

-- Users can read their own configs
CREATE POLICY "Users can read own configs" ON system_configs
  FOR SELECT
  TO authenticated
  USING (
    scope = 'USER' AND scope_id = auth.uid()::text
  );

-- Users can update their own configs
CREATE POLICY "Users can update own configs" ON system_configs
  FOR UPDATE
  TO authenticated
  USING (
    scope = 'USER' AND scope_id = auth.uid()::text
  );

-- Admins can manage all configs
CREATE POLICY "Admins can manage all configs" ON system_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for config_history
-- Users can view history of configs they can read
CREATE POLICY "Users can view config history" ON config_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_configs 
      WHERE id = config_history.config_id
      -- This will use the system_configs RLS policies
    )
  );

-- RLS Policies for config_templates
-- Public templates are viewable by all authenticated users
CREATE POLICY "Public templates are viewable" ON config_templates
  FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

-- Users can view their own templates
CREATE POLICY "Users can view own templates" ON config_templates
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can manage their own templates
CREATE POLICY "Users can manage own templates" ON config_templates
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Insert default system configurations
INSERT INTO system_configs (key, value, default_value, category, scope, description, data_type, access_level) VALUES
  -- System configs
  ('theme', '"light"', '"light"', 'SYSTEM_CONFIG', 'GLOBAL', 'System theme', 'STRING', 'PUBLIC'),
  ('language', '"en"', '"en"', 'SYSTEM_CONFIG', 'GLOBAL', 'System language', 'STRING', 'PUBLIC'),
  ('timezone', '"UTC"', '"UTC"', 'SYSTEM_CONFIG', 'GLOBAL', 'System timezone', 'STRING', 'AUTHENTICATED'),
  ('date_format', '"YYYY-MM-DD"', '"YYYY-MM-DD"', 'SYSTEM_CONFIG', 'GLOBAL', 'Date format', 'STRING', 'AUTHENTICATED'),
  ('currency', '"GBP"', '"GBP"', 'SYSTEM_CONFIG', 'GLOBAL', 'System currency', 'STRING', 'AUTHENTICATED'),
  
  -- Workflow configs
  ('auto_approve_orders', 'false', 'false', 'WORKFLOW_CONFIG', 'GLOBAL', 'Auto-approve orders', 'BOOLEAN', 'ADMIN'),
  ('require_qc_approval', 'true', 'true', 'WORKFLOW_CONFIG', 'GLOBAL', 'Require QC approval', 'BOOLEAN', 'ADMIN'),
  ('stock_alert_thresholds', '{"low": 10, "critical": 5}', '{"low": 10, "critical": 5}', 'WORKFLOW_CONFIG', 'GLOBAL', 'Stock alert thresholds', 'JSON', 'ADMIN'),
  
  -- Notification configs
  ('email_enabled', 'true', 'true', 'NOTIFICATION_CONFIG', 'GLOBAL', 'Email notifications enabled', 'BOOLEAN', 'AUTHENTICATED'),
  ('push_enabled', 'true', 'true', 'NOTIFICATION_CONFIG', 'GLOBAL', 'Push notifications enabled', 'BOOLEAN', 'AUTHENTICATED')
ON CONFLICT (key, scope, scope_id) DO NOTHING;