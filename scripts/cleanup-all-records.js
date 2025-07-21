const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAllDuplicates() {
  console.log('開始全面清理重複的儀表板設定記錄...\n');

  try {
    let totalDeleted = 0;
    let hasMore = true;
    let iteration = 0;

    while (hasMore) {
      iteration++;
      console.log(`\n第 ${iteration} 輪清理...`);

      // 獲取所有記錄
      const { data: allRecords, error: fetchError } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1000); // 每次處理 1000 條

      if (fetchError) {
        console.error('獲取記錄失敗:', fetchError);
        break;
      }

      if (!allRecords || allRecords.length === 0) {
        console.log('沒有更多記錄需要處理');
        hasMore = false;
        break;
      }

      console.log(`本輪獲取到 ${allRecords.length} 條記錄`);

      // 按 user_id + dashboard_name 分組
      const grouped = {};
      allRecords.forEach(record => {
        const key = `${record.user_id}_${record.dashboard_name}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(record);
      });

      // 找出重複的
      const toDelete = [];
      Object.values(grouped).forEach(records => {
        if (records.length > 1) {
          // 保留最新的，刪除其他的
          records.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          toDelete.push(...records.slice(1).map(r => r.id));
        }
      });

      if (toDelete.length === 0) {
        console.log('本輪沒有發現重複記錄');
        if (allRecords.length < 1000) {
          hasMore = false;
        }
        continue;
      }

      console.log(`本輪需要刪除 ${toDelete.length} 條重複記錄`);

      // 分批刪除
      const batchSize = 50;
      let roundDeleted = 0;

      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);

        const { error: deleteError } = await supabase
          .from('user_dashboard_settings')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error('批次刪除失敗:', deleteError);
        } else {
          roundDeleted += batch.length;
          process.stdout.write(`\r已刪除: ${roundDeleted}/${toDelete.length}`);
        }

        // 避免請求過快
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`\n本輪成功刪除 ${roundDeleted} 條記錄`);
      totalDeleted += roundDeleted;

      // 如果本輪處理的記錄少於 1000 條，說明已經處理完所有記錄
      if (allRecords.length < 1000) {
        hasMore = false;
      }
    }

    console.log(`\n清理完成！總共刪除了 ${totalDeleted} 條重複記錄`);

    // 最終統計
    const { count: finalCount } = await supabase
      .from('user_dashboard_settings')
      .select('*', { count: 'exact', head: true });

    console.log(`\n最終記錄數: ${finalCount}`);

    // 獲取唯一組合統計
    const { data: finalStats } = await supabase
      .from('user_dashboard_settings')
      .select('user_id, dashboard_name')
      .limit(1000);

    if (finalStats) {
      const uniqueCombos = new Set(
        finalStats.map(s => `${s.user_id}_${s.dashboard_name}`)
      );
      const uniqueUsers = new Set(finalStats.map(s => s.user_id));
      const uniqueDashboards = new Set(finalStats.map(s => s.dashboard_name));

      console.log(`\n統計信息:`);
      console.log(`唯一的用戶-儀表板組合數: ${uniqueCombos.size}`);
      console.log(`唯一用戶數: ${uniqueUsers.size}`);
      console.log(`儀表板類型: ${Array.from(uniqueDashboards).join(', ')}`);
    }

  } catch (error) {
    console.error('清理過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 確認執行
console.log('警告：此操作將清理所有重複的儀表板設定記錄！');
console.log('將逐批處理，每批 1000 條記錄。\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('是否繼續？(y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    cleanupAllDuplicates().then(() => {
      readline.close();
    });
  } else {
    console.log('操作已取消');
    readline.close();
  }
});
