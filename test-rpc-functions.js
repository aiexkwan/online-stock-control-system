#!/usr/bin/env node

// 測試 Supabase RPC 函數功能

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 從環境變量讀取配置 - 確保路徑正確
const envPath = path.join(__dirname, '.env.local');
console.log('🔍 Looking for env file at:', envPath);

try {
  require('dotenv').config({ path: envPath });
  console.log('✅ dotenv loaded from:', envPath);
} catch (err) {
  console.log('⚠️ dotenv error:', err.message);
  console.log('⚠️ Using process.env directly');
}

// 檢查環境變量
console.log('\n🔍 Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase environment variables');
  console.log('請確保 .env.local 文件包含:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  
  // 嘗試直接從文件讀取 
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    console.log('\n📄 .env.local file content (first 200 chars):');
    console.log(envContent.substring(0, 200));
  } catch (readError) {
    console.log('\n❌ Cannot read .env.local file:', readError.message);
  }
  
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRpcFunctions() {
  console.log('🧪 測試 Supabase RPC 函數\n');
  
  const today = new Date().toISOString().split('T')[0];
  console.log('📅 測試日期:', today);
  
  // 測試 1: 檢查 RPC 函數是否存在
  console.log('\n1️⃣ 測試基本連接和函數存在性');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('execute_count_query', {
      table_name: 'record_palletinfo',
      where_conditions: ''
    });
    
    if (error) {
      console.log('❌ RPC 函數不存在或權限不足:', error.message);
      console.log('');
      console.log('請執行以下步驟設置 RPC 函數:');
      console.log('1. 登入 Supabase Dashboard');
      console.log('2. 前往 SQL Editor');
      console.log('3. 執行 scripts/setup-rpc-functions.sql 中的所有SQL');
      console.log('4. 確保 RLS (Row Level Security) 設置正確');
      return false;
    } else {
      console.log('✅ RPC 函數正常工作');
      console.log('📊 記錄總數:', data);
    }
  } catch (err) {
    console.log('❌ 連接錯誤:', err.message);
    return false;
  }
  
  // 測試 2: 複雜條件查詢函數
  console.log('\n2️⃣ 測試複雜條件查詢函數');
  console.log('─'.repeat(50));
  
  // 2.1 今天所有托盤
  console.log('\n📅 2.1 今天所有托盤:');
  try {
    const { data, error } = await supabase.rpc('get_pallet_count_complex', {
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: '',
      product_condition: ''
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      console.log('✅ 今天總托盤:', data?.[0]?.count || 0);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  // 2.2 今天排除GRN托盤
  console.log('\n🚫 2.2 今天排除GRN托盤:');
  try {
    const { data, error } = await supabase.rpc('get_pallet_count_complex', {
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: '(plt_remark IS NULL OR plt_remark NOT LIKE \'%Material GRN%\')',
      product_condition: ''
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      console.log('✅ 今天非GRN托盤:', data?.[0]?.count || 0);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  // 2.3 今天GRN托盤
  console.log('\n📦 2.3 今天GRN托盤:');
  try {
    const { data, error } = await supabase.rpc('get_pallet_count_complex', {
      date_condition: `DATE(generate_time) = '${today}'`,
      grn_condition: 'plt_remark LIKE \'%Material GRN%\'',
      product_condition: ''
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      console.log('✅ 今天GRN托盤:', data?.[0]?.count || 0);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  // 測試 3: GRN 重量統計函數
  console.log('\n3️⃣ 測試 GRN 重量統計函數');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('get_grn_weight_stats', {
      date_filter: `DATE(rp.generate_time) = '${today}'`
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      const stats = data?.[0] || {};
      console.log('✅ 今天GRN重量統計:');
      console.log('   托盤數:', stats.pallet_count || 0);
      console.log('   淨重:', stats.total_net_weight || 0);
      console.log('   毛重:', stats.total_gross_weight || 0);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  // 測試 4: 產品統計函數
  console.log('\n4️⃣ 測試產品統計函數');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('get_product_stats', {
      product_code_param: 'MEP9090150'
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      const stats = data?.[0] || {};
      console.log('✅ MEP9090150 產品統計:');
      console.log('   托盤數:', stats.pallet_count || 0);
      console.log('   總數量:', stats.total_quantity || 0);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  // 測試 5: 通用SQL執行函數
  console.log('\n5️⃣ 測試通用SQL執行函數');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('execute_query', {
      query_text: `
        SELECT 
          COUNT(*) as count,
          'Today total pallets' as description
        FROM record_palletinfo 
        WHERE DATE(generate_time) = '${today}'
      `
    });
    
    if (error) {
      console.log('❌ 錯誤:', error.message);
    } else {
      console.log('✅ 通用SQL執行成功:');
      console.log('   結果:', data);
    }
  } catch (err) {
    console.log('❌ 異常:', err.message);
  }
  
  console.log('\n🎯 測試總結');
  console.log('─'.repeat(50));
  console.log('如果所有測試都成功，RPC函數已正確設置');
  console.log('現在可以修改 ask-database API 以使用 RPC 函數');
  console.log('這將解決查詢構建器的複雜條件問題');
  
  return true;
}

// 執行測試
testRpcFunctions().catch(console.error); 