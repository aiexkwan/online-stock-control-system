const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalCleanupAndVerify() {
  console.log('執行最終清理並驗證...\n');
  
  try {
    // 1. 獲取所有記錄
    const { data: allRecords, error: fetchError } = await supabase
      .from('user_dashboard_settings')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (fetchError) {
      console.error('獲取記錄失敗:', fetchError);
      return;
    }
    
    console.log(`找到 ${allRecords.length} 條記錄`);
    
    // 2. 找出每個 user_id + dashboard_name 組合的最新記錄
    const latestRecords = new Map();
    const toDelete = [];
    
    allRecords.forEach(record => {
      const key = `${record.user_id}_${record.dashboard_name}`;
      
      if (!latestRecords.has(key)) {
        // 第一次看到這個組合，保留它
        latestRecords.set(key, record);
      } else {
        // 已經有這個組合了，比較時間
        const existing = latestRecords.get(key);
        const existingTime = new Date(existing.updated_at || existing.created_at);
        const currentTime = new Date(record.updated_at || record.created_at);
        
        if (currentTime > existingTime) {
          // 當前記錄更新，刪除舊的
          toDelete.push(existing.id);
          latestRecords.set(key, record);
        } else {
          // 當前記錄較舊，刪除它
          toDelete.push(record.id);
        }
      }
    });
    
    console.log(`\n將保留 ${latestRecords.size} 條記錄`);
    console.log(`需要刪除 ${toDelete.length} 條重複記錄`);
    
    // 3. 顯示將保留的記錄
    console.log('\n將保留的記錄：');
    for (const [key, record] of latestRecords) {
      console.log(`- ${key}: ${record.id} (更新於 ${new Date(record.updated_at || record.created_at).toLocaleString()})`);
    }
    
    if (toDelete.length === 0) {
      console.log('\n✅ 沒有重複記錄需要刪除！');
      return true;
    }
    
    // 4. 執行刪除
    console.log('\n開始刪除重複記錄...');
    const batchSize = 50;
    let totalDeleted = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('user_dashboard_settings')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error('批次刪除失敗:', deleteError);
      } else {
        totalDeleted += batch.length;
        process.stdout.write(`\r已刪除: ${totalDeleted}/${toDelete.length}`);
      }
      
      // 避免請求過快
      if (i + batchSize < toDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`\n\n✅ 成功刪除 ${totalDeleted} 條重複記錄`);
    
    // 5. 驗證結果
    const { data: finalRecords, error: verifyError } = await supabase
      .from('user_dashboard_settings')
      .select('user_id, dashboard_name')
      .order('created_at', { ascending: false });
    
    if (!verifyError && finalRecords) {
      const finalKeys = new Set();
      let hasDuplicates = false;
      
      finalRecords.forEach(record => {
        const key = `${record.user_id}_${record.dashboard_name}`;
        if (finalKeys.has(key)) {
          hasDuplicates = true;
          console.error(`\n❌ 仍有重複: ${key}`);
        }
        finalKeys.add(key);
      });
      
      if (!hasDuplicates) {
        console.log('\n✅ 驗證通過！沒有重複記錄。');
        console.log(`最終記錄數: ${finalRecords.length}`);
        console.log(`唯一組合數: ${finalKeys.size}`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('清理過程中發生錯誤:', error);
    return false;
  }
}

// 執行清理
finalCleanupAndVerify().then(success => {
  if (success) {
    console.log('\n\n現在可以安全地添加唯一約束了！');
    console.log('請在 Supabase 控制台執行：\n');
    console.log(`ALTER TABLE user_dashboard_settings
ADD CONSTRAINT user_dashboard_settings_user_id_dashboard_name_key 
UNIQUE (user_id, dashboard_name);`);
  } else {
    console.log('\n\n請再次運行此腳本或手動檢查資料庫。');
  }
  process.exit(success ? 0 : 1);
});