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

console.log('🔍 驗證修復後的RPC函數...\n');

// 測試修復後的函數
async function testFixedFunctions() {
  const testCases = [
    {
      name: 'get_today_grn_weight_stats',
      description: '今天GRN重量統計',
      params: {}
    },
    {
      name: 'get_yesterday_grn_weight_stats', 
      description: '昨天GRN重量統計',
      params: {}
    },
    {
      name: 'get_week_grn_weight_stats',
      description: '本週GRN重量統計',
      params: {}
    },
    {
      name: 'get_lowest_inventory_products',
      description: '庫存最少產品',
      params: { limit_count: 3 }
    },
    {
      name: 'get_today_non_grn_pallet_count',
      description: '今天非GRN托盤數',
      params: {}
    },
    {
      name: 'get_week_grn_pallet_count',
      description: '本週GRN托盤數',
      params: {}
    },
    {
      name: 'get_day_before_yesterday_transfer_stats',
      description: '前天轉移統計',
      params: {}
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`📝 測試 ${testCase.description} (${testCase.name})...`);
    
    try {
      const { data, error } = await supabase.rpc(testCase.name, testCase.params);
      
      if (error) {
        console.log(`   ❌ 錯誤: ${error.message}`);
        failCount++;
      } else {
        console.log(`   ✅ 成功! 返回類型: ${typeof data}`);
        if (Array.isArray(data)) {
          console.log(`   📊 返回 ${data.length} 筆記錄`);
        } else if (typeof data === 'object' && data !== null) {
          console.log(`   📊 返回物件:`, Object.keys(data).join(', '));
        } else {
          console.log(`   📊 返回值: ${data}`);
        }
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ 異常: ${err.message}`);
      failCount++;
    }
    
    console.log('');
  }

  // 顯示總結
  console.log('='.repeat(50));
  console.log(`📊 測試總結:`);
  console.log(`總函數數: ${testCases.length}`);
  console.log(`成功: ${successCount} (${(successCount/testCases.length*100).toFixed(1)}%)`);
  console.log(`失敗: ${failCount} (${(failCount/testCases.length*100).toFixed(1)}%)`);
  
  if (successCount === testCases.length) {
    console.log('\n🎉 所有RPC函數修復成功！');
    console.log('現在可以運行完整測試：node test-fixed-queries.js');
  } else {
    console.log('\n⚠️  仍有函數需要修復');
  }
}

// 執行測試
testFixedFunctions().catch(console.error); 