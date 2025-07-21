const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('執行儀表板設定唯一約束遷移...');

  try {
    // 執行 SQL 遷移
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error) {
      console.error('遷移失敗:', error);

      // 如果 exec_sql RPC 不存在，嘗試直接執行 SQL
      console.log('嘗試使用直接 SQL 執行...');

      // 檢查約束是否已存在
      const { data: constraints, error: checkError } = await supabase
        .from('pg_constraint')
        .select('conname')
        .eq('conname', 'user_dashboard_settings_user_id_dashboard_name_key')
        .single();

      if (!constraints && checkError?.code === 'PGRST116') {
        // 約束不存在，需要手動添加
        console.log('請在 Supabase 控制台執行以下 SQL：');
        console.log(`
ALTER TABLE user_dashboard_settings
ADD CONSTRAINT user_dashboard_settings_user_id_dashboard_name_key
UNIQUE (user_id, dashboard_name);

CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_user_dashboard
ON user_dashboard_settings (user_id, dashboard_name);
        `);
      } else {
        console.log('唯一約束可能已存在');
      }
    } else {
      console.log('遷移成功完成！');
    }

    // 檢查現有記錄
    const { data: records, error: recordsError } = await supabase
      .from('user_dashboard_settings')
      .select('user_id, dashboard_name, created_at')
      .order('created_at', { ascending: false });

    if (records) {
      console.log(`\n當前有 ${records.length} 條儀表板設定記錄`);
      if (records.length > 0) {
        console.log('最近的記錄：');
        records.slice(0, 5).forEach(record => {
          console.log(`- 用戶 ${record.user_id.substring(0, 8)}... | ${record.dashboard_name} | ${new Date(record.created_at).toLocaleString()}`);
        });
      }
    }

  } catch (error) {
    console.error('執行遷移時發生錯誤:', error);
    process.exit(1);
  }
}

runMigration();
