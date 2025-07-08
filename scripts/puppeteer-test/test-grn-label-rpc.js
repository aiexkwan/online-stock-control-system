// 測試 GRN Label 頁面的 RPC 函數
// 用法: node scripts/test-grn-label-rpc.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境變數缺失: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 測試數據
const testCases = [
  {
    name: '供應商搜索 - 有效代碼',
    fn: 'search_supplier_code',
    params: { p_code: 'BSWF' }
  },
  {
    name: '供應商搜索 - 無效代碼',
    fn: 'search_supplier_code',
    params: { p_code: 'INVALID_CODE' }
  },
  {
    name: '產品代碼搜索 - 有效代碼',
    fn: 'search_product_code',
    params: { p_code: 'TAV1' }
  },
  {
    name: '產品代碼搜索 - 無效代碼',
    fn: 'search_product_code',
    params: { p_code: 'INVALID_CODE' }
  }
];

async function testRpcFunctions() {
  console.log('開始測試 GRN Label RPC 函數...\n');

  for (const test of testCases) {
    console.log(`測試: ${test.name}`);
    console.log(`函數: ${test.fn}`);
    console.log(`參數:`, test.params);
    
    try {
      console.time('查詢耗時');
      const { data, error } = await supabase.rpc(test.fn, test.params);
      console.timeEnd('查詢耗時');

      if (error) {
        console.error('錯誤:', error.message);
        console.log('-'.repeat(50));
        continue;
      }

      console.log('結果:', data ? JSON.stringify(data, null, 2) : '未找到數據');
    } catch (err) {
      console.error('執行錯誤:', err);
    }
    
    console.log('-'.repeat(50));
  }

  // 性能測試 - 多次查詢
  console.log('\n性能測試 - 重複查詢產品代碼 10 次:');
  
  console.time('總耗時');
  
  for (let i = 0; i < 10; i++) {
    try {
      const start = performance.now();
      const { data, error } = await supabase.rpc('search_product_code', { 
        p_code: 'TAV1'
      });
      const end = performance.now();
      
      console.log(`查詢 #${i+1}: ${Math.round(end - start)}ms`, error ? '失敗' : '成功');
    } catch (err) {
      console.error(`查詢 #${i+1} 錯誤:`, err);
    }
  }
  
  console.timeEnd('總耗時');
}

// 執行測試
testRpcFunctions()
  .catch(err => {
    console.error('測試失敗:', err);
    process.exit(1);
  })
  .finally(() => {
    console.log('\n測試完成');
  }); 