const { createClient } = require('@supabase/supabase-js');

// 驗證舊函數已被移除
async function verifyOldFunctionsRemoved() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const oldFunctions = ['generate_atomic_pallet_numbers', 'test_atomic_pallet_generation', 'monitor_pallet_generation_performance'];
  
  console.log('🔍 驗證舊函數已被移除...');
  
  for (const funcName of oldFunctions) {
    try {
      const { data, error } = await supabase.rpc(funcName, funcName.includes('generate') ? { count: 1 } : {});
      
      if (error) {
        console.log(`✅ ${funcName}: 已成功移除`);
      } else {
        console.error(`❌ ${funcName}: 仍然存在！`);
      }
    } catch (err) {
      console.log(`✅ ${funcName}: 已成功移除`);
    }
  }
  
  // 測試新函數仍然正常
  console.log('\n🧪 測試新函數...');
  try {
    const { data, error } = await supabase.rpc('generate_atomic_pallet_numbers_v2', { count: 1 });
    if (error) {
      console.error('❌ generate_atomic_pallet_numbers_v2 函數有問題:', error);
    } else {
      console.log('✅ generate_atomic_pallet_numbers_v2 函數正常:', data);
    }
  } catch (err) {
    console.error('❌ generate_atomic_pallet_numbers_v2 函數調用失敗:', err);
  }
}

verifyOldFunctionsRemoved();