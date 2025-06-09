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

async function investigateDuplicateError() {
  try {
    console.log('🔍 調查 090625/1 重複錯誤的原因...\n');
    
    const dateStr = '090625';
    const problemPallet = '090625/1';
    
    // 1. 檢查 daily_pallet_sequence 表
    console.log('📊 檢查 daily_pallet_sequence 表:');
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr)
      .single();
    
    if (sequenceError) {
      if (sequenceError.code === 'PGRST116') {
        console.log(`❌ daily_pallet_sequence 表中沒有 ${dateStr} 的記錄`);
      } else {
        console.error('❌ 查詢 daily_pallet_sequence 時出錯:', sequenceError);
      }
    } else {
      console.log(`✅ daily_pallet_sequence 記錄:`, sequenceData);
      console.log(`   - current_max: ${sequenceData.current_max}`);
      console.log(`   - last_updated: ${sequenceData.last_updated}`);
    }
    
    // 2. 測試原子性生成函數
    console.log('\n🧪 測試原子性生成函數 (生成1個):');
    const { data: testGenerated, error: testError } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
      count: 1
    });
    
    if (testError) {
      console.error('❌ 原子性生成函數失敗:', testError);
    } else {
      console.log(`✅ 成功生成: ${testGenerated}`);
    }
    
    // 3. 檢查是否有其他函數可能生成舊號碼
    console.log('\n🔍 檢查可能使用舊邏輯的地方...');
    
    // 檢查是否有非原子性的棧板號生成
    const { data: oldGenFunction, error: oldGenError } = await supabase.rpc('generate_atomic_pallet_numbers', {
      count: 1
    });
    
    if (oldGenError) {
      console.log('✅ 舊的 generate_atomic_pallet_numbers 函數不存在或已禁用');
    } else {
      console.warn('⚠️  舊的 generate_atomic_pallet_numbers 函數仍然存在:', oldGenFunction);
    }
    
    // 4. 檢查問題棧板的詳細信息
    console.log(`\n📦 檢查問題棧板 ${problemPallet} 的詳細信息:`);
    const { data: problemPalletData, error: problemPalletError } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('plt_num', problemPallet)
      .single();
    
    if (problemPalletError) {
      console.log(`❌ 問題棧板 ${problemPallet} 不存在`);
    } else {
      console.log(`✅ 問題棧板詳細信息:`);
      console.log(`   - plt_num: ${problemPalletData.plt_num}`);
      console.log(`   - generate_time: ${problemPalletData.generate_time}`);
      console.log(`   - product_code: ${problemPalletData.product_code}`);
      console.log(`   - product_qty: ${problemPalletData.product_qty}`);
      console.log(`   - plt_remark: ${problemPalletData.plt_remark}`);
    }
    
    // 5. 檢查最近的錯誤模式
    console.log('\n📋 檢查最近可能的重複錯誤模式...');
    
    // 模擬檢查當有人試圖創建已存在的棧板號時會發生什麼
    console.log('\n🧪 模擬重複檢查邏輯...');
    const { data: existingCheck, error: existingError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .eq('plt_num', problemPallet)
      .single();
    
    if (existingError && existingError.code === 'PGRST116') {
      console.log(`✅ ${problemPallet} 不存在，可以創建`);
    } else if (existingCheck) {
      console.log(`❌ ${problemPallet} 已存在，會觸發重複錯誤`);
      console.log('💡 這解釋了為什麼會看到 "Duplicate pallet number detected" 錯誤');
    } else {
      console.error('❌ 檢查重複時出錯:', existingError);
    }
    
    // 6. 建議的調試步驟
    console.log('\n💡 可能的原因分析:');
    console.log('1. 🔄 可能有代碼仍在使用舊的棧板號生成邏輯');
    console.log('2. 🚫 可能有重試邏輯使用了緩存的舊棧板號');
    console.log('3. 🕐 可能有併發請求導致重複檢查');
    console.log('4. 💾 可能有客戶端緩存了舊的棧板號');
    
    console.log('\n🛠️  建議的調試方法:');
    console.log('1. 檢查所有調用棧板號生成的代碼路徑');
    console.log('2. 添加更詳細的日誌記錄，包括調用堆棧');
    console.log('3. 檢查 Auto-reprint 功能的具體調用參數');
    console.log('4. 檢查是否有任何地方硬編碼了棧板號');
    
  } catch (error) {
    console.error('❌ 調查過程中出錯:', error);
  }
}

investigateDuplicateError().then(() => {
  console.log('\n✅ 調查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 調查失敗:', error);
  process.exit(1);
}); 