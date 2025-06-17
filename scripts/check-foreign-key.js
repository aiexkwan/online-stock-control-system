const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKey() {
  try {
    console.log('檢查 Foreign Key 關係...\n');
    
    // 獲取有庫存的產品
    const { data: stockData, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level')
      .gt('stock_level', 0)
      .limit(10);
    
    if (stockError) {
      console.error('Stock error:', stockError);
      return;
    }
    
    console.log(`找到 ${stockData.length} 個有庫存的產品\n`);
    
    // 對每個產品直接查詢 data_code
    for (const stock of stockData) {
      console.log(`\n產品: "${stock.stock}" (庫存: ${stock.stock_level})`);
      
      // 方法 1: 直接查詢
      const { data: directMatch, error: directError } = await supabase
        .from('data_code')
        .select('code, type')
        .eq('code', stock.stock)
        .single();
        
      if (directError) {
        console.log('  直接查詢錯誤:', directError.message);
      } else if (directMatch) {
        console.log(`  ✓ 直接查詢成功: type = ${directMatch.type}`);
      }
      
      // 方法 2: 使用 JOIN (通過 select)
      const { data: joinData, error: joinError } = await supabase
        .from('stock_level')
        .select(`
          stock,
          stock_level,
          data_code!inner(
            code,
            type
          )
        `)
        .eq('stock', stock.stock)
        .single();
        
      if (joinError) {
        console.log('  JOIN 查詢錯誤:', joinError.message);
      } else if (joinData) {
        console.log(`  ✓ JOIN 查詢成功: type = ${joinData.data_code?.type}`);
      }
    }
    
    // 測試反向查詢 - 從 stock_level 獲取所有資料包括關聯的 data_code
    console.log('\n\n測試一次性 JOIN 查詢...');
    const { data: fullJoinData, error: fullJoinError } = await supabase
      .from('stock_level')
      .select(`
        stock,
        stock_level,
        data_code!inner(
          code,
          type
        )
      `)
      .gt('stock_level', 0)
      .limit(5);
      
    if (fullJoinError) {
      console.log('Full JOIN 錯誤:', fullJoinError);
    } else {
      console.log('\nFull JOIN 結果:');
      fullJoinData?.forEach(item => {
        const type = item.data_code?.type === '-' ? 'Standard' : (item.data_code?.type || 'Unknown');
        console.log(`  ${item.stock}: ${type} (庫存: ${item.stock_level})`);
      });
    }
    
  } catch (err) {
    console.error('錯誤:', err);
  }
}

checkForeignKey();