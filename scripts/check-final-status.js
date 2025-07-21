const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFinalStatus() {
  console.log('檢查最終的儀表板設定狀態...\n');

  try {
    // 獲取所有剩餘記錄
    const { data: allRecords, error } = await supabase
      .from('user_dashboard_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('獲取記錄失敗:', error);
      return;
    }

    console.log(`資料庫中現有 ${allRecords.length} 條記錄：\n`);

    allRecords.forEach((record, index) => {
      console.log(`記錄 ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  用戶 ID: ${record.user_id}`);
      console.log(`  Email: ${record.email}`);
      console.log(`  儀表板名稱: ${record.dashboard_name}`);
      console.log(`  是預設: ${record.is_default}`);
      console.log(`  創建時間: ${new Date(record.created_at).toLocaleString()}`);
      console.log(`  更新時間: ${new Date(record.updated_at).toLocaleString()}`);
      console.log(`  Widget 數量: ${record.config?.widgets?.length || 0}`);
      console.log('---');
    });

    // 檢查是否有重複
    const uniqueKeys = new Set();
    let hasDuplicates = false;

    allRecords.forEach(record => {
      const key = `${record.user_id}_${record.dashboard_name}`;
      if (uniqueKeys.has(key)) {
        hasDuplicates = true;
        console.log(`\n⚠️ 發現重複記錄: ${key}`);
      }
      uniqueKeys.add(key);
    });

    if (!hasDuplicates) {
      console.log('\n✅ 沒有重複記錄！每個用戶-儀表板組合都是唯一的。');
    }

    console.log(`\n總結：`);
    console.log(`- 總記錄數: ${allRecords.length}`);
    console.log(`- 唯一組合數: ${uniqueKeys.size}`);
    console.log(`- 重複記錄: ${hasDuplicates ? '有' : '無'}`);

  } catch (error) {
    console.error('檢查過程中發生錯誤:', error);
  }
}

checkFinalStatus();
