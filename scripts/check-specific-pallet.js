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

async function checkSpecificPallet() {
  try {
    const palletToCheck = '090625/1';
    
    console.log(`🔍 檢查棧板號 ${palletToCheck} 是否存在...`);
    
    // 檢查 record_palletinfo 表
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('plt_num', palletToCheck)
      .single();
    
    if (palletError) {
      if (palletError.code === 'PGRST116') {
        console.log(`❌ 棧板號 ${palletToCheck} 在 record_palletinfo 表中不存在`);
      } else {
        console.error('❌ 查詢 record_palletinfo 時出錯:', palletError);
      }
    } else {
      console.log(`✅ 棧板號 ${palletToCheck} 在 record_palletinfo 表中存在:`, palletData);
    }
    
    // 檢查 record_history 表
    const { data: historyData, error: historyError } = await supabase
      .from('record_history')
      .select('*')
      .eq('plt_num', palletToCheck);
    
    if (historyError) {
      console.error('❌ 查詢 record_history 時出錯:', historyError);
    } else {
      console.log(`📊 棧板號 ${palletToCheck} 在 record_history 表中的記錄數: ${historyData ? historyData.length : 0}`);
      if (historyData && historyData.length > 0) {
        historyData.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.action} at ${record.time} by ${record.id}`);
        });
      }
    }
    
    // 檢查 record_inventory 表
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('record_inventory')
      .select('*')
      .eq('plt_num', palletToCheck);
    
    if (inventoryError) {
      console.error('❌ 查詢 record_inventory 時出錯:', inventoryError);
    } else {
      console.log(`📦 棧板號 ${palletToCheck} 在 record_inventory 表中的記錄數: ${inventoryData ? inventoryData.length : 0}`);
      if (inventoryData && inventoryData.length > 0) {
        inventoryData.forEach((record, index) => {
          console.log(`  ${index + 1}. Product: ${record.product_code}, Await: ${record.await || 0}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 檢查過程中出錯:', error);
  }
}

checkSpecificPallet().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 檢查失敗:', error);
  process.exit(1);
}); 