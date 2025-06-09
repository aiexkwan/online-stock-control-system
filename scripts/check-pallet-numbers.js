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

async function checkPalletNumbers() {
  try {
    console.log('🔍 檢查今天的棧板號狀況...');
    
    // 獲取今天日期的格式 (DDMMYY)
    const today = new Date();
    const todayString = String(today.getDate()).padStart(2, '0') + 
                       String(today.getMonth() + 1).padStart(2, '0') + 
                       String(today.getFullYear()).slice(-2);
    
    console.log(`📅 今天日期格式: ${todayString}`);
    
    // 檢查今天的棧板號
    const { data: todayPallets, error: todayError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .like('plt_num', `${todayString}/%`);
    
    if (todayError) {
      console.error('❌ 查詢今天棧板號時出錯:', todayError);
      return;
    }
    
    console.log(`\n📦 今天 (${todayString}) 的棧板號:`);
    if (todayPallets && todayPallets.length > 0) {
      // 按數字順序排序
      const sortedPallets = todayPallets.sort((a, b) => {
        const aNum = parseInt(a.plt_num.split('/')[1]);
        const bNum = parseInt(b.plt_num.split('/')[1]);
        return bNum - aNum; // 降序
      });
      
      console.log(`  總數: ${sortedPallets.length}`);
      console.log(`  最新10個:`);
      sortedPallets.slice(0, 10).forEach((pallet, index) => {
        console.log(`    ${index + 1}. ${pallet.plt_num}`);
      });
      
      const latestPallet = sortedPallets[0];
      const latestNumber = parseInt(latestPallet.plt_num.split('/')[1]);
      console.log(`\n🔢 最新棧板號: ${latestPallet.plt_num}`);
      console.log(`🔢 最新序號: ${latestNumber}`);
      console.log(`🔢 下一個應該是: ${todayString}/${latestNumber + 1}`);
      
      // 檢查是否有序號不連續的情況
      const allNumbers = sortedPallets.map(p => parseInt(p.plt_num.split('/')[1])).sort((a, b) => a - b);
      const missing = [];
      for (let i = 1; i < allNumbers[allNumbers.length - 1]; i++) {
        if (!allNumbers.includes(i)) {
          missing.push(i);
        }
      }
      if (missing.length > 0) {
        console.log(`⚠️  缺失的序號: ${missing.join(', ')}`);
      }
    } else {
      console.log('  (沒有找到今天的棧板號)');
    }
    
    // 測試原子性棧板號生成函數
    console.log('\n🧪 測試原子性棧板號生成函數...');
    const { data: generatedPallets, error: generateError } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
      count: 1
    });
    
    if (generateError) {
      console.error('❌ 原子性棧板號生成失敗:', generateError);
    } else if (generatedPallets && generatedPallets.length > 0) {
      console.log(`✅ 生成的棧板號: ${generatedPallets[0]}`);
    } else {
      console.log('❌ 沒有生成棧板號');
    }
    
    // 檢查 pallet_counter 表的狀況
    console.log('\n📊 檢查 pallet_counter 表狀況...');
    const { data: counterData, error: counterError } = await supabase
      .from('pallet_counter')
      .select('*')
      .eq('date', todayString)
      .single();
    
    if (counterError) {
      if (counterError.code === 'PGRST116') {
        console.log(`❌ pallet_counter 表中沒有今天 (${todayString}) 的記錄`);
        
        // 嘗試創建今天的記錄
        console.log('🔧 嘗試初始化今天的計數器...');
        const { error: insertError } = await supabase
          .from('pallet_counter')
          .insert({ date: todayString, counter: 0 });
        
        if (insertError) {
          console.error('❌ 初始化計數器失敗:', insertError);
        } else {
          console.log('✅ 成功初始化今天的計數器');
        }
      } else {
        console.error('❌ 查詢 pallet_counter 時出錯:', counterError);
      }
    } else {
      console.log(`📊 pallet_counter 記錄:`, counterData);
    }
    
  } catch (error) {
    console.error('❌ 檢查過程中出錯:', error);
  }
}

checkPalletNumbers().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 檢查失敗:', error);
  process.exit(1);
}); 