const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDuplicates() {
  console.log('開始清理重複的儀表板設定記錄...\n');

  try {
    // 1. 獲取所有記錄，按用戶和儀表板名稱分組
    const { data: allRecords, error: fetchError } = await supabase
      .from('user_dashboard_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('獲取記錄失敗:', fetchError);
      return;
    }

    console.log(`總共找到 ${allRecords.length} 條記錄`);

    // 2. 按 user_id 和 dashboard_name 分組
    const grouped = {};
    allRecords.forEach(record => {
      const key = `${record.user_id}_${record.dashboard_name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    console.log(`\n發現 ${Object.keys(grouped).length} 個唯一的用戶-儀表板組合`);

    // 3. 找出有重複的組合
    const duplicates = Object.entries(grouped).filter(([key, records]) => records.length > 1);
    console.log(`其中 ${duplicates.length} 個組合有重複記錄\n`);

    if (duplicates.length === 0) {
      console.log('沒有發現重複記錄，無需清理');
      return;
    }

    // 4. 清理重複記錄（保留最新的一條）
    let totalDeleted = 0;

    for (const [key, records] of duplicates) {
      // 按 updated_at 降序排序（最新的在前）
      records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      const [keep, ...toDelete] = records;

      console.log(`\n處理 ${key}:`);
      console.log(`  保留記錄 ID: ${keep.id} (更新於 ${new Date(keep.updated_at).toLocaleString()})`);
      console.log(`  需要刪除 ${toDelete.length} 條舊記錄`);

      // 分批刪除（每批最多 50 條）
      const batchSize = 50;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        const idsToDelete = batch.map(r => r.id);

        console.log(`  刪除第 ${Math.floor(i / batchSize) + 1} 批（${idsToDelete.length} 條）...`);

        const { error: deleteError } = await supabase
          .from('user_dashboard_settings')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error(`  批次刪除失敗:`, deleteError);
        } else {
          console.log(`  成功刪除 ${idsToDelete.length} 條記錄`);
          totalDeleted += idsToDelete.length;
        }

        // 避免請求過快
        if (i + batchSize < toDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    console.log(`\n清理完成！總共刪除了 ${totalDeleted} 條重複記錄`);

    // 5. 驗證清理結果
    const { count, error: countError } = await supabase
      .from('user_dashboard_settings')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n清理後剩餘 ${count} 條記錄`);
    }

  } catch (error) {
    console.error('清理過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 確認執行
console.log('警告：此操作將刪除重複的儀表板設定記錄！');
console.log('將保留每個用戶-儀表板組合的最新記錄，刪除所有舊記錄。\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('是否繼續？(y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    cleanupDuplicates().then(() => {
      readline.close();
    });
  } else {
    console.log('操作已取消');
    readline.close();
  }
});
