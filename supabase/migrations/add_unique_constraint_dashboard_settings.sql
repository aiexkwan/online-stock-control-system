-- 為 user_dashboard_settings 表添加唯一約束
-- 確保每個用戶的每個 dashboard_name 只有一條記錄

-- 首先檢查是否已存在約束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_dashboard_settings_user_id_dashboard_name_key'
    ) THEN
        -- 添加唯一約束
        ALTER TABLE user_dashboard_settings
        ADD CONSTRAINT user_dashboard_settings_user_id_dashboard_name_key
        UNIQUE (user_id, dashboard_name);
    END IF;
END $$;

-- 添加索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_user_dashboard
ON user_dashboard_settings (user_id, dashboard_name);

-- 添加觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 如果觸發器不存在則創建
DROP TRIGGER IF EXISTS update_user_dashboard_settings_updated_at ON user_dashboard_settings;
CREATE TRIGGER update_user_dashboard_settings_updated_at
BEFORE UPDATE ON user_dashboard_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
