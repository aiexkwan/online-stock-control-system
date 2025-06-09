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

async function fixSequenceCounter() {
  try {
    console.log('🔧 修復序列計數器...\n');
    
    const dateStr = '090625';
    
    // 1. 檢查當前狀態
    console.log('📊 檢查當前狀態:');
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr)
      .single();
    
    if (sequenceError) {
      console.error('❌ 查詢序列表時出錯:', sequenceError);
      return;
    }
    
    console.log(`   當前 current_max: ${sequenceData.current_max}`);
    
    // 2. 找到實際存在的最高棧板號
    console.log('\n📋 查找實際存在的最高棧板號:');
    const { data: allTodayPallets, error: allPalletsError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .like('plt_num', `${dateStr}/%`);
    
    if (allPalletsError) {
      console.error('❌ 查詢棧板號時出錯:', allPalletsError);
      return;
    }
    
    if (!allTodayPallets || allTodayPallets.length === 0) {
      console.log('❌ 沒有找到今天的棧板號');
      return;
    }
    
    // 找到最高的序號
    const maxExistingNumber = Math.max(...allTodayPallets.map(p => {
      const parts = p.plt_num.split('/');
      return parseInt(parts[1]);
    }));
    
    console.log(`   實際最高棧板號: ${dateStr}/${maxExistingNumber}`);
    console.log(`   應該設置 current_max 為: ${maxExistingNumber}`);
    
    // 3. 檢查是否需要修復
    if (sequenceData.current_max === maxExistingNumber) {
      console.log('\n✅ 序列計數器已經正確，無需修復');
      return;
    }
    
    console.log(`\n🔧 需要修復: ${sequenceData.current_max} → ${maxExistingNumber}`);
    
    // 4. 執行修復
    const { error: updateError } = await supabase
      .from('daily_pallet_sequence')
      .update({ 
        current_max: maxExistingNumber,
        last_updated: new Date().toISOString()
      })
      .eq('date_str', dateStr);
    
    if (updateError) {
      console.error('❌ 更新序列表時出錯:', updateError);
      return;
    }
    
    console.log('✅ 序列計數器修復成功！');
    
    // 5. 驗證修復結果
    console.log('\n🧪 驗證修復結果:');
    const { data: testGenerated, error: testError } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
      count: 1
    });
    
    if (testError) {
      console.error('❌ 測試生成失敗:', testError);
    } else {
      const expectedNext = `${dateStr}/${maxExistingNumber + 1}`;
      if (testGenerated[0] === expectedNext) {
        console.log(`✅ 修復成功！下次生成將是: ${testGenerated[0]}`);
      } else {
        console.error(`❌ 修復可能有問題。期望: ${expectedNext}, 實際: ${testGenerated[0]}`);
      }
    }
    
    // 6. 最終狀態檢查
    console.log('\n📊 最終狀態:');
    const { data: finalSequenceData } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr)
      .single();
    
    console.log(`   current_max: ${finalSequenceData.current_max}`);
    console.log(`   last_updated: ${finalSequenceData.last_updated}`);
    
  } catch (error) {
    console.error('❌ 修復過程中出錯:', error);
  }
}

fixSequenceCounter().then(() => {
  console.log('\n✅ 修復完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 修復失敗:', error);
  process.exit(1);
}); 