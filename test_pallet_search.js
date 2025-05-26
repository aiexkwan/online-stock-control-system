const { createClient } = require('@supabase/supabase-js');

async function testPalletSearch() {
  try {
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 測試托盤號搜尋功能...\n');
    
    // 獲取一些真實的托盤號進行測試
    const { data: pallets, error: palletsError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, series, product_code')
      .limit(5);
    
    if (palletsError) {
      console.log('❌ 無法獲取托盤列表:', palletsError.message);
      return;
    }
    
    console.log('📦 找到的托盤:');
    pallets.forEach(pallet => {
      console.log(`  • 托盤號: ${pallet.plt_num}, 系列號: ${pallet.series}, 產品: ${pallet.product_code}`);
    });
    
    // 測試托盤號搜尋
    for (const pallet of pallets.slice(0, 3)) {
      console.log(`\n🧪 測試搜尋托盤號: ${pallet.plt_num}`);
      
      // 模擬前端的搜尋邏輯
      const { data: palletData, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, series')
        .eq('plt_num', pallet.plt_num.trim())
        .single();
      
      if (palletError) {
        console.log(`  ❌ 搜尋失敗: ${palletError.message}`);
        console.log(`  錯誤代碼: ${palletError.code}`);
        
        // 嘗試不同的搜尋方式
        console.log('  🔄 嘗試模糊搜尋...');
        const { data: fuzzyData, error: fuzzyError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .ilike('plt_num', `%${pallet.plt_num}%`);
        
        if (fuzzyError) {
          console.log(`    ❌ 模糊搜尋也失敗: ${fuzzyError.message}`);
        } else {
          console.log(`    ✅ 模糊搜尋找到 ${fuzzyData.length} 個結果`);
          fuzzyData.forEach(item => {
            console.log(`      - ${item.plt_num}`);
          });
        }
      } else {
        console.log(`  ✅ 搜尋成功: ${palletData.plt_num}`);
        
        // 獲取位置信息
        const { data: historyData, error: historyError } = await supabase
          .from('record_history')
          .select('loc')
          .eq('plt_num', palletData.plt_num)
          .order('time', { ascending: false })
          .limit(1);
        
        let currentLocation = 'Await';
        if (!historyError && historyData && historyData.length > 0) {
          currentLocation = historyData[0].loc || 'Await';
        }
        
        console.log(`    當前位置: ${currentLocation}`);
      }
    }
    
    // 測試系列號搜尋
    console.log('\n='.repeat(50));
    console.log('測試系列號搜尋');
    console.log('='.repeat(50));
    
    for (const pallet of pallets.slice(0, 2)) {
      if (pallet.series) {
        console.log(`\n🧪 測試搜尋系列號: ${pallet.series}`);
        
        const { data: seriesData, error: seriesError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('series', pallet.series.trim())
          .single();
        
        if (seriesError) {
          console.log(`  ❌ 系列號搜尋失敗: ${seriesError.message}`);
        } else {
          console.log(`  ✅ 系列號搜尋成功: ${seriesData.plt_num}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

testPalletSearch(); 