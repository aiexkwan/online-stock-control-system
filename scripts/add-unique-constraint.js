const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUniqueConstraint() {
  console.log('添加唯一約束到 user_dashboard_settings 表...\n');

  // 由於不能直接執行 ALTER TABLE，需要在 Supabase 控制台執行
  console.log('請在 Supabase 控制台的 SQL 編輯器中執行以下 SQL：\n');

  const sql = `
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
`;

  console.log(sql);
  console.log('\n執行此 SQL 後，將防止未來出現重複記錄。');

  // 檢查最終狀態
  const { data: finalRecords, error } = await supabase
    .from('user_dashboard_settings')
    .select('user_id, dashboard_name, created_at')
    .order('created_at', { ascending: false });

  if (finalRecords) {
    console.log(`\n當前狀態：`);
    console.log(`- 總記錄數: ${finalRecords.length}`);

    const uniqueCombos = new Set(
      finalRecords.map(r => `${r.user_id}_${r.dashboard_name}`)
    );
    console.log(`- 唯一的用戶-儀表板組合: ${uniqueCombos.size}`);

    console.log('\n最新的記錄：');
    finalRecords.slice(0, 5).forEach(record => {
      console.log(`- ${record.dashboard_name} | ${new Date(record.created_at).toLocaleString()}`);
    });
  }
}

addUniqueConstraint();
