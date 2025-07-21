// 測試 search_product_code RPC 函數
// 此腳本測試產品代碼搜索功能

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 創建 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 測試產品代碼
const testCodes = [
  'TAV1',     // 精確匹配
  'tav1',     // 小寫測試
  'TAV',      // 前綴匹配
  'NONEXIST', // 不存在的代碼
  '',         // 空字符串
];

// 執行測試
async function runTests() {
  console.log('開始測試 search_product_code RPC 函數...');
  console.log('----------------------------------------');

  for (const code of testCodes) {
    console.log(`測試產品代碼: "${code}"`);

    try {
      const startTime = performance.now();
      const { data, error } = await supabase.rpc('search_product_code', { p_code: code });
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      if (error) {
        console.error(`錯誤: ${error.message}`);
        continue;
      }

      console.log(`查詢耗時: ${duration}ms`);

      if (data) {
        console.log('結果:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('未找到產品');
      }
    } catch (err) {
      console.error(`執行錯誤: ${err.message}`);
    }

    console.log('----------------------------------------');
  }

  console.log('測試完成');
}

// 執行測試
runTests()
  .catch(err => {
    console.error('測試過程中發生錯誤:', err);
    process.exit(1);
  });
