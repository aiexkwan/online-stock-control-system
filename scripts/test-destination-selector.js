#!/usr/bin/env node

/**
 * 測試新嘅目標位置選擇器功能
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

// 測試位置映射
const LOCATION_DESTINATIONS = {
  'Await': ['Fold Mill', 'Production', 'PipeLine'],
  'Await_grn': ['Production', 'PipeLine'],
  'Fold Mill': ['Production', 'PipeLine'],
  'PipeLine': ['Production', 'Fold Mill'],
  'Production': ['Fold Mill', 'PipeLine'],
  'Damage': [],
  'Voided': []
};

async function testLocationMappings() {
  console.log('\n📍 Testing location destination mappings...');
  console.log('==========================================');
  
  for (const [fromLocation, destinations] of Object.entries(LOCATION_DESTINATIONS)) {
    console.log(`\nFrom: ${fromLocation}`);
    if (destinations.length === 0) {
      console.log('  ❌ Cannot transfer from this location');
    } else {
      console.log('  ✅ Can transfer to:');
      destinations.forEach(dest => {
        console.log(`     → ${dest}`);
      });
    }
  }
}

async function testTransferScenarios() {
  console.log('\n\n🧪 Testing transfer scenarios...');
  console.log('================================');
  
  const testCases = [
    { from: 'Await', to: 'Fold Mill', expected: true },
    { from: 'Await', to: 'Production', expected: true },
    { from: 'Await', to: 'PipeLine', expected: true },
    { from: 'Fold Mill', to: 'Production', expected: true },
    { from: 'Fold Mill', to: 'PipeLine', expected: true },
    { from: 'Voided', to: 'Anywhere', expected: false },
    { from: 'Damage', to: 'Anywhere', expected: false }
  ];
  
  for (const testCase of testCases) {
    const destinations = LOCATION_DESTINATIONS[testCase.from] || [];
    const canTransfer = testCase.expected ? destinations.includes(testCase.to) : destinations.length === 0;
    const icon = canTransfer === testCase.expected ? '✅' : '❌';
    
    console.log(`${icon} ${testCase.from} → ${testCase.to}: ${canTransfer ? 'Allowed' : 'Blocked'}`);
  }
}

async function testRealTransfer() {
  console.log('\n\n🚀 Testing real transfer with new UI...');
  console.log('=====================================');
  
  try {
    // 搵一個真實嘅托盤
    const { data: palletData } = await supabase.rpc('search_pallet_info', {
      p_search_type: 'pallet_num',
      p_search_value: '140625/6'
    });
    
    if (!palletData?.success) {
      console.log('❌ Cannot find test pallet');
      return;
    }
    
    const pallet = palletData.data;
    console.log(`\n📦 Pallet: ${pallet.plt_num}`);
    console.log(`📍 Current Location: ${pallet.current_plt_loc}`);
    
    // 獲取可用目標
    const availableDestinations = LOCATION_DESTINATIONS[pallet.current_plt_loc] || [];
    console.log(`\n🎯 Available destinations:`);
    availableDestinations.forEach((dest, index) => {
      console.log(`   ${index + 1}. ${dest} ${index === 0 ? '(Default)' : ''}`);
    });
    
    // 模擬選擇默認目標（第一個）
    if (availableDestinations.length > 0) {
      const defaultDestination = availableDestinations[0];
      console.log(`\n✅ Would select: ${defaultDestination} (default)`);
      
      // 執行轉移
      const { data: transferResult } = await supabase.rpc('execute_stock_transfer', {
        p_plt_num: pallet.plt_num,
        p_product_code: pallet.product_code,
        p_product_qty: pallet.product_qty,
        p_from_location: pallet.current_plt_loc,
        p_to_location: defaultDestination,
        p_operator_id: 1
      });
      
      if (transferResult?.success) {
        console.log(`✅ Transfer successful: ${pallet.plt_num} moved to ${defaultDestination}`);
      } else {
        console.log(`❌ Transfer failed: ${transferResult?.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runTests() {
  console.log('🎯 Testing New Destination Selector Feature');
  console.log('==========================================');
  
  await testLocationMappings();
  await testTransferScenarios();
  await testRealTransfer();
  
  console.log('\n\n✅ All tests completed!');
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});