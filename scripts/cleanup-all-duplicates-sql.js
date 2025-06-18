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
  console.log('使用 SQL DELETE 清理所有重複的儀表板設定記錄...\n');
  
  try {
    // 先檢查當前狀態
    const { count: beforeCount } = await supabase
      .from('user_dashboard_settings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`清理前總記錄數: ${beforeCount}`);
    
    // 使用 SQL 刪除重複記錄，只保留每個 user_id + dashboard_name 組合的最新記錄
    const deleteSQL = `
      DELETE FROM user_dashboard_settings
      WHERE id NOT IN (
        SELECT DISTINCT ON (user_id, dashboard_name) id
        FROM user_dashboard_settings
        ORDER BY user_id, dashboard_name, updated_at DESC
      );
    `;
    
    console.log('執行 SQL DELETE 命令...');
    console.log('SQL:', deleteSQL);
    
    // 嘗試使用 RPC 執行 SQL
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query: deleteSQL
    });
    
    if (error) {
      console.error('執行 SQL 失敗:', error);
      
      // 如果 RPC 不可用，嘗試其他方法
      console.log('\n嘗試使用替代方法...');
      
      // 獲取要保留的記錄 ID
      const { data: recordsToKeep, error: selectError } = await supabase
        .from('user_dashboard_settings')
        .select('user_id, dashboard_name, id, updated_at')
        .order('updated_at', { ascending: false });
      
      if (selectError) {
        console.error('獲取記錄失敗:', selectError);
        return;
      }
      
      // 按 user_id + dashboard_name 分組，只保留最新的
      const keepIds = new Set();
      const seen = new Set();
      
      recordsToKeep.forEach(record => {
        const key = `${record.user_id}_${record.dashboard_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          keepIds.add(record.id);
        }
      });
      
      console.log(`將保留 ${keepIds.size} 條記錄`);
      console.log(`將刪除 ${recordsToKeep.length - keepIds.size} 條重複記錄`);
      
      // 獲取要刪除的 ID
      const deleteIds = recordsToKeep
        .filter(r => !keepIds.has(r.id))
        .map(r => r.id);
      
      // 分批刪除
      const batchSize = 50;
      let totalDeleted = 0;
      
      for (let i = 0; i < deleteIds.length; i += batchSize) {
        const batch = deleteIds.slice(i, i + batchSize);
        
        console.log(`刪除第 ${Math.floor(i / batchSize) + 1}/${Math.ceil(deleteIds.length / batchSize)} 批...`);
        
        const { error: deleteError } = await supabase
          .from('user_dashboard_settings')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error('批次刪除失敗:', deleteError);
        } else {
          totalDeleted += batch.length;
        }
        
        // 避免請求過快
        if (i + batchSize < deleteIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`\n成功刪除 ${totalDeleted} 條重複記錄`);
    } else {
      console.log('SQL DELETE 執行成功！');
    }
    
    // 檢查清理後的狀態
    const { count: afterCount } = await supabase
      .from('user_dashboard_settings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n清理後總記錄數: ${afterCount}`);
    console.log(`共刪除: ${beforeCount - afterCount} 條記錄`);
    
    // 顯示一些統計信息
    const { data: stats, error: statsError } = await supabase
      .from('user_dashboard_settings')
      .select('user_id, dashboard_name')
      .limit(100);
    
    if (stats) {
      const uniqueUsers = new Set(stats.map(s => s.user_id));
      const uniqueDashboards = new Set(stats.map(s => s.dashboard_name));
      
      console.log(`\n統計信息（前 100 條）:`);
      console.log(`唯一用戶數: ${uniqueUsers.size}`);
      console.log(`唯一儀表板類型: ${uniqueDashboards.size}`);
      console.log(`儀表板類型: ${Array.from(uniqueDashboards).join(', ')}`);
    }
    
  } catch (error) {
    console.error('清理過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 確認執行
console.log('警告：此操作將使用 SQL DELETE 刪除所有重複的儀表板設定記錄！');
console.log('將保留每個用戶-儀表板組合的最新記錄。\n');

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