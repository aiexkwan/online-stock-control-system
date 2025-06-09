const { createClient } = require('@supabase/supabase-js');

// 檢查環境變數
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugHardcodedPallet() {
  try {
    console.log('🔍 調查硬編碼棧板號問題...\n');
    
    const dateStr = '090625';
    const problemPallet = '090625/36';
    
    // 1. 檢查當前 daily_pallet_sequence 狀態
    console.log('📊 檢查 daily_pallet_sequence 當前狀態:');
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr)
      .single();
    
    if (sequenceError) {
      console.error('❌ 查詢 daily_pallet_sequence 時出錯:', sequenceError);
    } else {
      console.log(`✅ current_max: ${sequenceData.current_max}`);
      console.log(`✅ last_updated: ${sequenceData.last_updated}`);
    }
    
    // 2. 檢查 090625/36 是否真的存在
    console.log(`\n📦 檢查 ${problemPallet} 是否存在:`);
    const { data: palletExists, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('plt_num', problemPallet)
      .single();
    
    if (palletError && palletError.code === 'PGRST116') {
      console.log(`❌ ${problemPallet} 不存在於資料庫中`);
    } else if (palletExists) {
      console.log(`✅ ${problemPallet} 確實存在:`);
      console.log(`   - generate_time: ${palletExists.generate_time}`);
      console.log(`   - product_code: ${palletExists.product_code}`);
      console.log(`   - product_qty: ${palletExists.product_qty}`);
      console.log(`   - plt_remark: ${palletExists.plt_remark}`);
    } else {
      console.error('❌ 查詢時出錯:', palletError);
    }
    
    // 3. 檢查今天所有棧板號的範圍
    console.log(`\n📋 檢查今天 (${dateStr}) 所有棧板號:`);
    const { data: allTodayPallets, error: allPalletsError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, generate_time')
      .like('plt_num', `${dateStr}/%`)
      .order('generate_time', { ascending: false });
    
    if (allPalletsError) {
      console.error('❌ 查詢今天棧板號時出錯:', allPalletsError);
    } else if (allTodayPallets && allTodayPallets.length > 0) {
      // 按數字順序排序
      const sortedPallets = allTodayPallets.sort((a, b) => {
        const aNum = parseInt(a.plt_num.split('/')[1]);
        const bNum = parseInt(b.plt_num.split('/')[1]);
        return bNum - aNum; // 降序
      });
      
      console.log(`   總數: ${sortedPallets.length}`);
      console.log(`   最高號碼: ${sortedPallets[0].plt_num}`);
      console.log(`   最低號碼: ${sortedPallets[sortedPallets.length - 1].plt_num}`);
      
      // 檢查是否有 36 號
      const pallet36 = sortedPallets.find(p => p.plt_num === problemPallet);
      if (pallet36) {
        console.log(`   ✅ 找到 ${problemPallet}，生成時間: ${pallet36.generate_time}`);
      } else {
        console.log(`   ❌ 沒有找到 ${problemPallet}`);
      }
      
      // 顯示最新的幾個
      console.log(`   最新5個:`);
      sortedPallets.slice(0, 5).forEach((pallet, index) => {
        console.log(`     ${index + 1}. ${pallet.plt_num} (${pallet.generate_time})`);
      });
    }
    
    // 4. 測試原子性生成函數多次
    console.log('\n🧪 測試原子性生成函數 (連續5次):');
    for (let i = 1; i <= 5; i++) {
      const { data: testGenerated, error: testError } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
        count: 1
      });
      
      if (testError) {
        console.error(`❌ 第${i}次測試失敗:`, testError);
      } else {
        console.log(`✅ 第${i}次測試: ${testGenerated[0]}`);
      }
      
      // 短暫延遲
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 5. 檢查是否有其他 V1 函數被調用
    console.log('\n🔍 測試舊版本函數:');
    try {
      const { data: oldV1Result, error: oldV1Error } = await supabase.rpc('generate_atomic_pallet_numbers', {
        count: 1
      });
      
      if (oldV1Error) {
        console.log('✅ 舊版本函數已禁用或不存在');
      } else {
        console.warn('⚠️  舊版本函數仍然可用，返回:', oldV1Result);
      }
    } catch (error) {
      console.log('✅ 舊版本函數調用失敗（這是好事）');
    }
    
    // 6. 檢查序列表的更新歷史
    console.log('\n📈 檢查序列表更新歷史:');
    const { data: sequenceHistory, error: historyError } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr);
    
    if (historyError) {
      console.error('❌ 查詢序列歷史時出錯:', historyError);
    } else {
      console.log('序列表記錄:', sequenceHistory);
    }
    
    // 7. 建議的修復步驟
    console.log('\n💡 問題分析:');
    if (sequenceData && sequenceData.current_max === 31) {
      console.log('1. ✅ current_max 已正確設為 31');
      console.log('2. 🤔 但系統仍嘗試創建 090625/36，這表明:');
      console.log('   - 可能有緩存問題');
      console.log('   - 可能有併發請求');
      console.log('   - 可能有代碼路徑繞過了原子性生成');
    }
    
    console.log('\n🛠️  建議的修復步驟:');
    console.log('1. 確認 090625/36 是否真的存在');
    console.log('2. 如果存在，檢查它是何時創建的');
    console.log('3. 檢查是否有併發請求');
    console.log('4. 考慮重置序列表到正確的最大值');
    
    // 8. 提供修復建議
    if (palletExists) {
      const maxExistingNumber = Math.max(...allTodayPallets.map(p => parseInt(p.plt_num.split('/')[1])));
      console.log(`\n🔧 建議將 current_max 設為: ${maxExistingNumber}`);
      console.log(`   這樣下次生成會是: ${dateStr}/${maxExistingNumber + 1}`);
    }
    
  } catch (error) {
    console.error('❌ 調查過程中出錯:', error);
  }
}

debugHardcodedPallet().then(() => {
  console.log('\n✅ 調查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 調查失敗:', error);
  process.exit(1);
}); 