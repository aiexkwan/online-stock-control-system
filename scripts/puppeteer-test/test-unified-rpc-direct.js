const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iubrmjztlwnghlfzxhqt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YnJtanp0bHduZ2hsZnp4aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNzYxNTAsImV4cCI6MjA0Njk1MjE1MH0.Yp8UPjG7bvDwNgGkpBL-Zfm-CgvwVT0kBvTXTuJBw6w';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUnifiedRpc = async () => {
  console.log('🧪 直接測試統一 RPC 函數');
  console.log('='.repeat(50));

  try {
    // 測試參數
    const testParams = {
      p_count: 2,
      p_product_code: 'MEP9090150',
      p_product_qty: 50,
      p_clock_number: '5997',
      p_plt_remark: 'Test Unified RPC',
      p_session_id: `test-${Date.now()}`,
      p_aco_order_ref: null,
      p_aco_quantity_used: null,
      p_slate_batch_number: null,
      p_pdf_urls: null
    };

    console.log('📋 測試參數:');
    console.log(JSON.stringify(testParams, null, 2));
    console.log('\n🔄 正在調用統一 RPC...');

    // 調用統一 RPC
    const { data: result, error } = await supabase.rpc('process_qc_label_unified', testParams);

    console.log('\n📊 RPC 回應:');
    if (error) {
      console.error('❌ RPC 錯誤:', error);
      return;
    }

    if (result) {
      console.log('✅ RPC 成功執行');
      console.log('📋 結果:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('\n🎯 成功詳情:');
        console.log(`✅ ${result.message}`);

        if (result.data) {
          console.log(`🏷️ 生成托盤號碼: ${result.data.pallet_numbers?.join(', ')}`);
          console.log(`🔢 系列號碼: ${result.data.series?.join(', ')}`);
          console.log(`📦 總數量: ${result.data.total_quantity}`);
        }

        if (result.statistics) {
          console.log('\n📊 統計信息:');
          console.log(`📦 創建托盤數: ${result.statistics.pallets_created}`);
          console.log(`📋 總數量: ${result.statistics.total_quantity}`);

          if (result.statistics.records_created) {
            console.log('📝 創建記錄:');
            console.log(`  - Pallet Info: ${result.statistics.records_created.palletinfo}`);
            console.log(`  - History: ${result.statistics.records_created.history}`);
            console.log(`  - Inventory: ${result.statistics.records_created.inventory}`);
            console.log(`  - Slate: ${result.statistics.records_created.slate}`);
          }

          if (result.statistics.updates_made) {
            console.log('🔄 更新操作:');
            console.log(`  - Stock Level: ${result.statistics.updates_made.stock_level ? '✅' : '❌'}`);
            console.log(`  - Work Level: ${result.statistics.updates_made.work_level ? '✅' : '❌'}`);
          }
        }

        // 驗證數據庫記錄
        if (result.data?.pallet_numbers) {
          console.log('\n🔍 驗證數據庫記錄...');
          await verifyDatabaseRecords(result.data.pallet_numbers);
        }

      } else {
        console.log('❌ RPC 返回失敗:', result.message || result.error);
      }
    } else {
      console.log('❌ 未收到 RPC 回應');
    }

  } catch (error) {
    console.error('❌ 測試執行錯誤:', error);
  }
};

const verifyDatabaseRecords = async (palletNumbers) => {
  try {
    console.log(`📋 驗證托盤號碼: ${palletNumbers.join(', ')}`);

    // 查詢 record_palletinfo
    const { data: palletInfo } = await supabase
      .from('record_palletinfo')
      .select('*')
      .in('plt_num', palletNumbers);

    console.log(`📦 Pallet Info 記錄: ${palletInfo?.length || 0} 筆`);

    // 查詢 record_history
    const { data: history } = await supabase
      .from('record_history')
      .select('*')
      .in('plt_num', palletNumbers);

    console.log(`📜 History 記錄: ${history?.length || 0} 筆`);

    // 查詢 record_inventory
    const { data: inventory } = await supabase
      .from('record_inventory')
      .select('*')
      .in('plt_num', palletNumbers);

    console.log(`📋 Inventory 記錄: ${inventory?.length || 0} 筆`);

    // 顯示記錄詳情
    if (palletInfo && palletInfo.length > 0) {
      console.log('\n📋 Pallet Info 詳情:');
      palletInfo.forEach(p => {
        console.log(`  ${p.plt_num}: ${p.product_code} (${p.product_qty})`);
      });
    }

    if (history && history.length > 0) {
      console.log('\n📜 History 詳情:');
      history.forEach(h => {
        console.log(`  ${h.plt_num}: ${h.action} by ${h.id}`);
      });
    }

    return {
      palletInfo: palletInfo?.length || 0,
      history: history?.length || 0,
      inventory: inventory?.length || 0
    };

  } catch (error) {
    console.error('❌ 驗證數據庫記錄錯誤:', error);
    return null;
  }
};

// 執行測試
testUnifiedRpc().catch(console.error);
