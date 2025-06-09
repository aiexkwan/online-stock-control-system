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

async function checkOldFunctions() {
  try {
    console.log('🔍 檢查舊版本函數...\n');
    
    // 檢查舊版本函數是否仍然可用
    console.log('📋 測試舊版本函數:');
    
    try {
      const { data: oldResult, error: oldError } = await supabase.rpc('generate_atomic_pallet_numbers', {
        count: 1
      });
      
      if (oldError) {
        console.log('✅ 舊版本函數已禁用或不存在');
        console.log('   錯誤:', oldError.message);
      } else {
        console.warn('⚠️  舊版本函數仍然可用！');
        console.warn('   返回結果:', oldResult);
        console.warn('   這可能導致計數器不同步問題');
        
        console.log('\n💡 建議:');
        console.log('1. 在資料庫中重新命名或刪除舊函數 generate_atomic_pallet_numbers');
        console.log('2. 或者修改舊函數使其拋出錯誤');
        console.log('3. 確保所有代碼都使用 generate_atomic_pallet_numbers_v2');
      }
    } catch (error) {
      console.log('✅ 舊版本函數調用失敗（這是好事）');
      console.log('   錯誤:', error.message);
    }
    
    // 檢查其他可能的測試函數
    console.log('\n🧪 檢查測試函數:');
    
    const testFunctions = [
      'test_atomic_pallet_generation',
      'test_atomic_pallet_generation_v2',
      'monitor_pallet_generation_performance',
      'monitor_pallet_generation_performance_v2'
    ];
    
    for (const funcName of testFunctions) {
      try {
        const { data: testResult, error: testError } = await supabase.rpc(funcName);
        
        if (testError) {
          console.log(`❌ ${funcName}: 不可用 (${testError.message})`);
        } else {
          console.log(`✅ ${funcName}: 可用`);
          if (funcName.includes('test_atomic_pallet_generation')) {
            console.warn(`   ⚠️  警告: 測試函數可能會消耗棧板號序列！`);
          }
        }
      } catch (error) {
        console.log(`❌ ${funcName}: 調用失敗`);
      }
    }
    
    console.log('\n📝 重要提醒:');
    console.log('1. 🚫 不要在生產環境中運行棧板號生成測試');
    console.log('2. 🔧 測試函數會消耗實際的棧板號序列');
    console.log('3. 📊 如果需要測試，請在測試環境中進行');
    console.log('4. 🔄 如果意外消耗了序列，請使用 fix-sequence-counter.js 修復');
    
  } catch (error) {
    console.error('❌ 檢查過程中出錯:', error);
  }
}

checkOldFunctions().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 檢查失敗:', error);
  process.exit(1);
}); 