#!/usr/bin/env node

// 簡化的 RPC 函數測試 - 直接使用已知配置

const { createClient } = require('@supabase/supabase-js');

// 從 next.config.js 中的已知配置
const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';

// 嘗試從環境變量獲取 Service Role Key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 測試 Supabase RPC 函數（簡化版）\n');
console.log('📝 配置檢查:');
console.log('  Supabase URL:', supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
console.log('  Service Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing');

if (!supabaseServiceKey) {
  console.log('\n⚠️ Service Role Key 缺失，嘗試使用 Anon Key 測試基本連接');
}

// 創建 Supabase 客戶端
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

async function testBasicConnection() {
  console.log('\n1️⃣ 測試基本數據庫連接');
  console.log('─'.repeat(50));
  
  try {
    // 嘗試簡單的查詢來測試連接
    const { data, error } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .limit(1);
    
    if (error) {
      console.log('❌ 基本連接失敗:', error.message);
      return false;
    } else {
      console.log('✅ 基本連接成功');
      console.log('📊 測試數據:', data?.[0] || 'No data');
      return true;
    }
  } catch (err) {
    console.log('❌ 連接異常:', err.message);
    return false;
  }
}

async function testRpcFunctions() {
  console.log('\n2️⃣ 測試 RPC 函數存在性');
  console.log('─'.repeat(50));
  
  const today = new Date().toISOString().split('T')[0];
  
  // 測試專用計數函數
  console.log('\n📋 測試 get_pallet_count_complex:');
  try {
    const { data, error } = await supabase.rpc('get_pallet_count_complex', {
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: '',
      product_condition: ''
    });
    
    if (error) {
      console.log('❌ RPC 函數不存在:', error.message);
      console.log('💡 需要在 Supabase Dashboard 中創建 RPC 函數');
      console.log('📄 請執行 scripts/setup-rpc-functions.sql');
      return false;
    } else {
      console.log('✅ get_pallet_count_complex 工作正常');
      console.log('📊 今天總托盤:', data?.[0]?.count || 0);
    }
  } catch (err) {
    console.log('❌ RPC 調用異常:', err.message);
    return false;
  }
  
  // 測試複雜查詢
  console.log('\n🧮 測試複雜條件查詢:');
  
  const testCases = [
    {
      name: '今天排除GRN托盤',
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: '(plt_remark IS NULL OR plt_remark NOT LIKE \'%Material GRN%\')',
      product_condition: ''
    },
    {
      name: '今天GRN托盤',
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: 'plt_remark LIKE \'%Material GRN%\'',
      product_condition: ''
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase.rpc('get_pallet_count_complex', {
        date_condition: testCase.date_condition,
        grn_condition: testCase.grn_condition,
        product_condition: testCase.product_condition
      });
      
      if (error) {
        console.log(`❌ ${testCase.name}:`, error.message);
      } else {
        console.log(`✅ ${testCase.name}: ${data?.[0]?.count || 0}`);
      }
    } catch (err) {
      console.log(`❌ ${testCase.name} 異常:`, err.message);
    }
  }
  
  return true;
}

async function provideFeedback() {
  console.log('\n🎯 測試結果總結');
  console.log('─'.repeat(50));
  
  const connectionOK = await testBasicConnection();
  if (!connectionOK) {
    console.log('\n❌ 基本連接失敗，請檢查:');
    console.log('1. Supabase 項目是否正常運行');
    console.log('2. 網絡連接是否正常');
    console.log('3. 環境變量配置是否正確');
    return;
  }
  
  const rpcOK = await testRpcFunctions();
  if (!rpcOK) {
    console.log('\n❌ RPC 函數未設置，需要執行以下步驟:');
    console.log('');
    console.log('1. 登入 Supabase Dashboard:');
    console.log(`   https://app.supabase.com/project/bbmkuiplnzvpudszrend`);
    console.log('');
    console.log('2. 前往 SQL Editor');
    console.log('');
    console.log('3. 複製並執行 scripts/setup-rpc-functions.sql 中的所有 SQL');
    console.log('');
    console.log('4. 重新運行此測試');
    console.log('');
    console.log('🔧 設置完成後，Ask Database 功能將使用 RPC 函數');
    console.log('   這將解決查詢構建器的複雜條件問題');
  } else {
    console.log('\n✅ RPC 函數設置成功！');
    console.log('🚀 現在可以測試 Ask Database 功能');
    console.log('📈 複雜查詢將通過 RPC 函數執行，避免查詢構建器問題');
  }
}

// 執行測試
provideFeedback().catch(console.error); 