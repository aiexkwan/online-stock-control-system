const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExactMatching() {
  try {
    console.log('檢查精確匹配問題...\n');

    // 獲取前幾個有庫存的產品
    const { data: stockData } = await supabase
      .from('stock_level')
      .select('stock')
      .gt('stock_level', 0)
      .limit(5);

    console.log('Stock Level 產品代碼:');
    for (const stock of stockData || []) {
      console.log(`  "${stock.stock}" (長度: ${stock.stock.length})`);

      // 嘗試精確匹配
      const { data: exactMatch } = await supabase
        .from('data_code')
        .select('code, type')
        .eq('code', stock.stock)
        .single();

      if (exactMatch) {
        console.log(`    ✓ 找到精確匹配: type = ${exactMatch.type}`);
      } else {
        // 嘗試模糊匹配
        const { data: fuzzyMatch } = await supabase
          .from('data_code')
          .select('code, type')
          .ilike('code', `%${stock.stock}%`)
          .limit(3);

        if (fuzzyMatch && fuzzyMatch.length > 0) {
          console.log(`    ? 找到模糊匹配:`);
          fuzzyMatch.forEach(m => {
            console.log(`      - "${m.code}" (type: ${m.type})`);
          });
        } else {
          console.log(`    ✗ 完全找不到匹配`);
        }
      }
    }

    // 反向檢查 - 看看 data_code 中的代碼格式
    console.log('\n\nData Code 產品代碼範例:');
    const { data: codeData } = await supabase
      .from('data_code')
      .select('code, type')
      .neq('type', '-')
      .not('type', 'is', null)
      .limit(5);

    for (const code of codeData || []) {
      console.log(`  "${code.code}" (長度: ${code.code.length}, type: ${code.type})`);

      // 檢查是否在 stock_level 中存在
      const { data: stockMatch } = await supabase
        .from('stock_level')
        .select('stock, stock_level')
        .eq('stock', code.code)
        .single();

      if (stockMatch) {
        console.log(`    ✓ 在 stock_level 中找到，庫存: ${stockMatch.stock_level}`);
      } else {
        console.log(`    ✗ 在 stock_level 中找不到`);
      }
    }

    // 檢查是否有大小寫問題
    console.log('\n\n檢查大小寫敏感性...');
    const { data: testStock } = await supabase
      .from('stock_level')
      .select('stock')
      .gt('stock_level', 0)
      .limit(1)
      .single();

    if (testStock) {
      console.log(`測試產品: "${testStock.stock}"`);

      // 嘗試不同大小寫
      const variations = [
        testStock.stock,
        testStock.stock.toUpperCase(),
        testStock.stock.toLowerCase()
      ];

      for (const variant of variations) {
        const { data: match } = await supabase
          .from('data_code')
          .select('code')
          .eq('code', variant)
          .single();

        console.log(`  "${variant}": ${match ? '✓ 找到' : '✗ 找不到'}`);
      }
    }

  } catch (err) {
    console.error('錯誤:', err);
  }
}

checkExactMatching();
