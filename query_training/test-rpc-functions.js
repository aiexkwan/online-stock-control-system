#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 獲取當前檔案的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入環境變數
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 測試重量統計 RPC 函數...\n');

// 測試函數
async function testRpcFunction(functionName, params = {}) {
  console.log(`📝 測試 ${functionName}...`);
  
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.log(`❌ 錯誤: ${error.message}`);
      console.log(`   詳情: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`✅ 成功!`);
      console.log(`   資料類型: ${typeof data}`);
      console.log(`   資料: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (err) {
    console.log(`❌ 異常: ${err.message}`);
  }
  
  console.log('');
}

// 主執行函數
async function main() {
  // 測試重量統計函數
  await testRpcFunction('get_today_grn_weight_stats');
  await testRpcFunction('get_yesterday_grn_weight_stats');
  await testRpcFunction('get_week_grn_weight_stats');
  
  // 測試其他函數
  await testRpcFunction('get_today_pallet_count');
  await testRpcFunction('get_week_pallet_count');
  
  // 測試帶參數的函數
  await testRpcFunction('get_top_products_by_inventory', { limit_count: 5 });
  await testRpcFunction('get_location_pallet_count', { location_name: 'Await' });
}

// 執行測試
main().catch(console.error); 