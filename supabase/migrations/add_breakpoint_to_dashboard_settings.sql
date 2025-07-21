-- 添加 breakpoint 欄位支援多螢幕尺寸布局
ALTER TABLE user_dashboard_settings
ADD COLUMN IF NOT EXISTS breakpoint TEXT DEFAULT 'lg';

-- 更新唯一鍵約束，包含 breakpoint
ALTER TABLE user_dashboard_settings
DROP CONSTRAINT IF EXISTS user_dashboard_settings_user_id_dashboard_name_key;

ALTER TABLE user_dashboard_settings
ADD CONSTRAINT user_dashboard_settings_user_id_dashboard_name_breakpoint_key
UNIQUE (user_id, dashboard_name, breakpoint);

-- 為現有記錄設置預設 breakpoint
UPDATE user_dashboard_settings
SET breakpoint = 'lg'
WHERE breakpoint IS NULL;

-- 添加註解
COMMENT ON COLUMN user_dashboard_settings.breakpoint IS 'Responsive breakpoint: xxs, xs, sm, md, lg';
