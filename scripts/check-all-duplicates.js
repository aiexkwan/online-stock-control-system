const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllDuplicates() {
  console.log('檢查所有重複的儀表板設定記錄...\n');
  
  try {
    // 使用 SQL 查詢來找出所有重複的組合
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query: `
        SELECT 
          user_id,
          dashboard_name,
          COUNT(*) as duplicate_count,
          MAX(updated_at) as latest_update
        FROM user_dashboard_settings
        GROUP BY user_id, dashboard_name
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
        LIMIT 20
      `
    });
    
    if (error) {
      // 如果 RPC 不可用，使用替代方法
      console.log('使用替代方法檢查...');
      
      // 獲取總記錄數
      const { count: totalCount } = await supabase
        .from('user_dashboard_settings')
        .select('*', { count: 'exact', head: true });
      
      console.log(`資料庫中總共有 ${totalCount} 條儀表板設定記錄`);
      
      // 獲取唯一的用戶-儀表板組合數
      const { data: distinctCombos, error: distinctError } = await supabase
        .from('user_dashboard_settings')
        .select('user_id, dashboard_name')
        .limit(1000);
      
      if (distinctCombos) {
        const uniqueCombos = new Set(
          distinctCombos.map(r => `${r.user_id}_${r.dashboard_name}`)
        );
        console.log(`前 1000 條記錄中有 ${uniqueCombos.size} 個唯一組合`);
        
        if (uniqueCombos.size < 1000) {
          console.log('\n看起來還有很多重複記錄需要清理！');
          console.log('建議運行完整的清理腳本來處理所有重複記錄。');
        }
      }
      
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`發現 ${data.length} 個有重複記錄的用戶-儀表板組合：\n`);
      
      data.forEach(row => {
        console.log(`用戶 ID: ${row.user_id.substring(0, 8)}...`);
        console.log(`儀表板名稱: ${row.dashboard_name}`);
        console.log(`重複數量: ${row.duplicate_count}`);
        console.log(`最後更新: ${new Date(row.latest_update).toLocaleString()}`);
        console.log('---');
      });
      
      // 計算總重複記錄數
      const totalDuplicates = data.reduce((sum, row) => sum + (row.duplicate_count - 1), 0);
      console.log(`\n總共需要刪除 ${totalDuplicates} 條重複記錄`);
    } else {
      console.log('太好了！沒有發現重複記錄。');
    }
    
  } catch (error) {
    console.error('檢查過程中發生錯誤:', error);
  }
}

checkAllDuplicates();