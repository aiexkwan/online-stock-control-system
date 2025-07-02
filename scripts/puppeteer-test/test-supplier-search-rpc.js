// 測試供應商搜索 RPC 函數
// 用法: node scripts/test-supplier-search-rpc.js

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

// 測試供應商代碼
const testSupplierCodes = ['BSWF', 'UNKNOWN_SUPPLIER', 'JCPL', ''];

async function testSupplierSearch() {
  console.log('開始測試供應商搜索 RPC 函數...\n');

  for (const code of testSupplierCodes) {
    console.log(`測試供應商代碼: "${code}"`);
    
    try {
      console.time('查詢耗時');
      const { data, error } = await supabase.rpc('search_supplier_code', { 
        p_code: code 
      });
      console.timeEnd('查詢耗時');

      if (error) {
        console.error('錯誤:', error.message);
        continue;
      }

      console.log('結果:', data ? data : '未找到供應商');
    } catch (err) {
      console.error('執行錯誤:', err);
    }
    
    console.log('-'.repeat(50));
  }

  // 性能測試 - 多次查詢同一個供應商
  console.log('\n性能測試 - 重複查詢 10 次:');
  
  const testCode = 'BSWF';
  console.time('總耗時');
  
  for (let i = 0; i < 10; i++) {
    try {
      const start = performance.now();
      const { data, error } = await supabase.rpc('search_supplier_code', { 
        p_code: testCode 
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
testSupplierSearch()
  .catch(err => {
    console.error('測試失敗:', err);
    process.exit(1);
  })
  .finally(() => {
    console.log('\n測試完成');
  }); 