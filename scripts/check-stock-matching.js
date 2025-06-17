const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStockMatching() {
  try {
    console.log('深入檢查 stock_level 和 data_code 的匹配情況...\n');
    
    // 獲取所有有庫存的產品
    const { data: stockData, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level')
      .gt('stock_level', 0)
      .order('stock_level', { ascending: false })
      .limit(20);
    
    if (stockError) {
      console.error('Stock level error:', stockError);
      return;
    }
    
    console.log(`找到 ${stockData.length} 個有庫存的產品\n`);
    
    // 對每個產品檢查是否在 data_code 中存在
    for (const stock of stockData) {
      const { data: codeData } = await supabase
        .from('data_code')
        .select('code, type')
        .eq('code', stock.stock)
        .single();
        
      if (codeData) {
        const displayType = codeData.type === '-' ? 'Standard' : (codeData.type || 'Unknown');
        console.log(`✓ ${stock.stock} (庫存: ${stock.stock_level}) -> Type: ${displayType}`);
      } else {
        console.log(`✗ ${stock.stock} (庫存: ${stock.stock_level}) -> 在 data_code 中找不到`);
      }
    }
    
    // 統計不同 type 的分佈
    console.log('\n\n統計 data_code 中的 type 分佈...\n');
    
    const { data: typeStats } = await supabase
      .from('data_code')
      .select('type');
      
    const typeCounts = {};
    typeStats?.forEach(item => {
      const type = item.type === '-' ? 'Standard' : (item.type || 'Unknown');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    console.log('Type 分佈:');
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
    // 檢查有實際 type (非 "-") 的產品是否在 stock_level 中有庫存
    console.log('\n\n檢查有實際 type 的產品在 stock_level 中的庫存情況...\n');
    
    const { data: typedCodes } = await supabase
      .from('data_code')
      .select('code, type')
      .neq('type', '-')
      .not('type', 'is', null)
      .limit(10);
      
    for (const code of typedCodes || []) {
      const { data: stockInfo } = await supabase
        .from('stock_level')
        .select('stock_level')
        .eq('stock', code.code)
        .single();
        
      if (stockInfo && stockInfo.stock_level > 0) {
        console.log(`✓ ${code.code} (Type: ${code.type}) -> 庫存: ${stockInfo.stock_level}`);
      } else {
        console.log(`✗ ${code.code} (Type: ${code.type}) -> 無庫存或不存在`);
      }
    }
    
  } catch (err) {
    console.error('錯誤:', err);
  }
}

checkStockMatching();