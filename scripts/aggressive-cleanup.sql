-- 激進清理腳本：只保留每個 user_id + dashboard_name 組合的最新記錄

-- 1. 創建臨時表，只保留最新的記錄
CREATE TEMP TABLE keep_records AS
SELECT DISTINCT ON (user_id, dashboard_name)
    id,
    user_id,
    dashboard_name,
    email,
    config,
    is_default,
    created_at,
    updated_at
FROM user_dashboard_settings
ORDER BY user_id, dashboard_name, updated_at DESC NULLS LAST, created_at DESC;

-- 2. 查看將保留多少條記錄
SELECT COUNT(*) as records_to_keep FROM keep_records;

-- 3. 查看將刪除多少條記錄
SELECT COUNT(*) as records_to_delete
FROM user_dashboard_settings
WHERE id NOT IN (SELECT id FROM keep_records);

-- 4. 刪除所有不在保留列表中的記錄
DELETE FROM user_dashboard_settings
WHERE id NOT IN (SELECT id FROM keep_records);

-- 5. 立即添加唯一約束，防止新的重複
ALTER TABLE user_dashboard_settings
ADD CONSTRAINT user_dashboard_settings_user_id_dashboard_name_key
UNIQUE (user_id, dashboard_name);

-- 6. 顯示最終結果
SELECT
    user_id,
    dashboard_name,
    COUNT(*) as count
FROM user_dashboard_settings
GROUP BY user_id, dashboard_name
ORDER BY count DESC;
