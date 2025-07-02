#!/usr/bin/env node

/**
 * 測試相同位置防錯機制
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSameLocationTransfer() {
  console.log('\n🔍 Testing same location prevention...');
  console.log('=====================================');
  
  try {
    // 搵一個托盤測試
    const { data: palletData } = await supabase.rpc('search_pallet_info', {
      p_search_type: 'pallet_num',
      p_search_value: '140625/7'
    });
    
    if (!palletData?.success) {
      console.log('❌ Cannot find test pallet');
      return;
    }
    
    const pallet = palletData.data;
    console.log(`\n📦 Testing Pallet: ${pallet.plt_num}`);
    console.log(`📍 Current Location: ${pallet.current_plt_loc}`);
    
    // 測試轉移到相同位置
    console.log(`\n🧪 Attempting to transfer to same location (${pallet.current_plt_loc})...`);
    
    const { data: transferResult, error } = await supabase.rpc('execute_stock_transfer', {
      p_plt_num: pallet.plt_num,
      p_product_code: pallet.product_code,
      p_product_qty: pallet.product_qty,
      p_from_location: pallet.current_plt_loc,
      p_to_location: pallet.current_plt_loc,  // 相同位置
      p_operator_id: 1
    });
    
    if (transferResult?.success === false && transferResult?.error_code === 'SAME_LOCATION') {
      console.log('✅ Successfully blocked same location transfer');
      console.log(`   Message: ${transferResult.message}`);
    } else {
      console.log('❌ Failed to block same location transfer');
      console.log('   Result:', transferResult);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

async function testUIFiltering() {
  console.log('\n\n🎨 Testing UI filtering logic...');
  console.log('==================================');
  
  const testLocations = [
    'Await', 'Fold Mill', 'Production', 'PipeLine'
  ];
  
  const LOCATION_DESTINATIONS = {
    'Await': ['Fold Mill', 'Production', 'PipeLine'],
    'Await_grn': ['Production', 'PipeLine'],
    'Fold Mill': ['Production', 'PipeLine'],
    'PipeLine': ['Production', 'Fold Mill'],
    'Production': ['Fold Mill', 'PipeLine']
  };
  
  for (const currentLocation of testLocations) {
    const allDestinations = LOCATION_DESTINATIONS[currentLocation] || [];
    const filteredDestinations = allDestinations.filter(dest => dest !== currentLocation);
    
    console.log(`\nFrom: ${currentLocation}`);
    console.log(`  All destinations: [${allDestinations.join(', ')}]`);
    console.log(`  After filtering: [${filteredDestinations.join(', ')}]`);
    
    // 檢查是否正確過濾掉當前位置
    if (allDestinations.includes(currentLocation) && !filteredDestinations.includes(currentLocation)) {
      console.log('  ✅ Current location correctly filtered out');
    } else if (!allDestinations.includes(currentLocation)) {
      console.log('  ✅ Current location not in destination list');
    } else {
      console.log('  ❌ Filtering failed');
    }
  }
}

async function testEdgeCases() {
  console.log('\n\n🔧 Testing edge cases...');
  console.log('========================');
  
  // 測試特殊情況
  const edgeCases = [
    {
      name: 'Empty location string',
      from: '',
      to: 'Fold Mill',
      expected: 'INVALID_LOCATION'
    },
    {
      name: 'Null-like location',
      from: 'Await',
      to: 'Await',
      expected: 'SAME_LOCATION'
    },
    {
      name: 'Case sensitivity',
      from: 'await',
      to: 'Await',
      expected: 'INVALID_LOCATION'  // 因為小寫 'await' 唔喺映射入面
    }
  ];
  
  for (const testCase of edgeCases) {
    console.log(`\n🧪 ${testCase.name}:`);
    console.log(`   From: "${testCase.from}" → To: "${testCase.to}"`);
    
    const { data: result } = await supabase.rpc('execute_stock_transfer', {
      p_plt_num: 'TEST123',
      p_product_code: 'TEST',
      p_product_qty: 1,
      p_from_location: testCase.from,
      p_to_location: testCase.to,
      p_operator_id: 1
    });
    
    if (result?.error_code === testCase.expected) {
      console.log(`   ✅ Got expected error: ${testCase.expected}`);
    } else {
      console.log(`   ❌ Unexpected result:`, result);
    }
  }
}

async function runTests() {
  console.log('🛡️ Testing Same Location Prevention');
  console.log('===================================');
  
  await testSameLocationTransfer();
  await testUIFiltering();
  await testEdgeCases();
  
  console.log('\n\n✅ All tests completed!');
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});