#!/usr/bin/env node

/**
 * Stock Transfer RPC 測試腳本
 * 測試新嘅 RPC implementation
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

async function testSearchPallet() {
  console.log('\n📦 Testing search_pallet_info RPC...');
  
  try {
    const { data, error } = await supabase.rpc('search_pallet_info', {
      p_search_type: 'pallet_num',
      p_search_value: '140625/5'
    });

    if (error) {
      console.error('❌ Search error:', error);
      return false;
    }

    if (data?.success) {
      console.log('✅ Search successful:', data.data);
      return true;
    } else {
      console.log('❌ Search failed:', data?.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function testStockTransfer() {
  console.log('\n🚀 Testing execute_stock_transfer RPC...');
  
  try {
    // 先搜尋托盤資訊
    const searchResult = await supabase.rpc('search_pallet_info', {
      p_search_type: 'pallet_num',
      p_search_value: '140625/5'
    });

    if (!searchResult.data?.success) {
      console.error('❌ Cannot find pallet for testing');
      return false;
    }

    const palletInfo = searchResult.data.data;
    console.log('📍 Current location:', palletInfo.current_plt_loc);

    // 測試轉移
    const { data, error } = await supabase.rpc('execute_stock_transfer', {
      p_plt_num: palletInfo.plt_num,
      p_product_code: palletInfo.product_code,
      p_product_qty: palletInfo.product_qty,
      p_from_location: palletInfo.current_plt_loc,
      p_to_location: palletInfo.current_plt_loc === 'Await' ? 'Fold Mill' : 'Await',
      p_operator_id: 1
    });

    if (error) {
      console.error('❌ Transfer error:', error);
      return false;
    }

    if (data?.success) {
      console.log('✅ Transfer successful:', data.message);
      return true;
    } else {
      console.log('❌ Transfer failed:', data?.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function checkReportLog() {
  console.log('\n📊 Checking report_log...');
  
  try {
    const { data, error } = await supabase
      .from('report_log')
      .select('error, error_info, state, user_id, time')
      .like('error', 'STOCK_TRANSFER%')
      .order('time', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Report log error:', error);
      return false;
    }

    console.log('📝 Recent stock transfer logs:');
    data.forEach(log => {
      const icon = log.state ? '✅' : '❌';
      console.log(`${icon} ${log.error}: ${log.error_info}`);
      console.log(`   User: ${log.user_id}, Time: ${new Date(log.time).toLocaleString()}`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Stock Transfer RPC Tests...');
  console.log('================================');
  
  let allPassed = true;

  // Test 1: Search Pallet
  if (!await testSearchPallet()) {
    allPassed = false;
  }

  // Test 2: Stock Transfer
  if (!await testStockTransfer()) {
    allPassed = false;
  }

  // Test 3: Check Report Log
  if (!await checkReportLog()) {
    allPassed = false;
  }

  console.log('\n================================');
  if (allPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed!');
  }
}

// Run tests
runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});