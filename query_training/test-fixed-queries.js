#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 獲取當前檔案的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入環境變數
dotenv.config({ path: join(__dirname, '../.env.local') });

// 測試修復後的查詢
const fixedTestQueries = [
  { id: 1, question: "庫存最少的前3個產品", expected: "應該使用get_lowest_inventory_products" },
  { id: 2, question: "今天生成的非GRN托盤數量", expected: "應該使用get_today_non_grn_pallet_count" },
  { id: 3, question: "本週只要GRN的托盤統計", expected: "應該使用get_week_grn_pallet_count" },
  { id: 4, question: "前天有多少個托盤被轉移？", expected: "應該使用get_day_before_yesterday_transfer_stats" },
  { id: 5, question: "今天GRN的總重量是多少？", expected: "應該使用直接查詢避免RPC錯誤" },
  { id: 6, question: "本週的平均淨重", expected: "應該使用直接查詢避免RPC錯誤" },
  { id: 7, question: "昨天收貨的總毛重", expected: "應該使用直接查詢避免RPC錯誤" }
];

// 測試單個查詢
async function testQuery(testCase) {
  console.log(`\n📝 測試 ${testCase.id}: ${testCase.question}`);
  console.log(`   預期: ${testCase.expected}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: testCase.question,
        sessionId: 'test-fixed-queries'
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ API 錯誤 (${response.status}): ${errorText}`);
      return { success: false, error: `API錯誤: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`   ❌ 查詢錯誤: ${data.error}`);
      return { success: false, error: data.error };
    }
    
    // 顯示結果
    console.log(`   ✅ 查詢成功`);
    console.log(`   🎯 意圖類型: ${data.intent?.type}`);
    console.log(`   🚀 RPC函數: ${data.intent?.rpcFunction}`);
    console.log(`   📊 信心度: ${data.intent?.confidence}`);
    console.log(`   ⏱️  執行時間: ${data.executionTime}ms`);
    
    // 顯示結果摘要
    const resultData = data.result?.data;
    if (Array.isArray(resultData)) {
      console.log(`   📊 返回 ${resultData.length} 筆記錄`);
      if (resultData.length > 0 && resultData.length <= 2) {
        console.log('   示例結果:');
        resultData.forEach((item, index) => {
          const summary = typeof item === 'object' ? 
            Object.keys(item).slice(0, 3).map(key => `${key}:${item[key]}`).join(', ') :
            item;
          console.log(`     ${index + 1}. ${summary}`);
        });
      }
    } else if (typeof resultData === 'number') {
      console.log(`   📊 返回數值: ${resultData}`);
    } else if (typeof resultData === 'object' && resultData !== null) {
      console.log(`   📊 返回物件:`, JSON.stringify(resultData, null, 2));
    }
    
    console.log(`   💬 AI回答: ${data.answer.substring(0, 100)}...`);
    
    return { success: true, data: data };
    
  } catch (error) {
    console.log(`   ❌ 網絡錯誤: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 檢查服務是否運行
async function checkService() {
  try {
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 主執行函數
async function main() {
  console.log('🔍 檢查服務狀態...\n');
  
  const serviceRunning = await checkService();
  if (!serviceRunning) {
    console.log('❌ Ask Database 服務未運行');
    console.log('請確保開發服務器正在運行：npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 服務正常運行');
  console.log('🧪 開始測試修復後的查詢...\n');
  
  const results = {
    total: fixedTestQueries.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  // 逐個測試問題
  for (const testCase of fixedTestQueries) {
    const result = await testQuery(testCase);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        question: testCase.question,
        error: result.error
      });
    }
    
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 顯示總結
  console.log('\n' + '='.repeat(80));
  console.log('📊 修復測試總結');
  console.log('='.repeat(80));
  console.log(`總問題數: ${results.total}`);
  console.log(`成功查詢: ${results.success} (${(results.success/results.total*100).toFixed(1)}%)`);
  console.log(`查詢失敗: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 失敗的查詢:');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.question}`);
      console.log(`   錯誤: ${err.error}`);
    });
  }
  
  if (results.success === results.total) {
    console.log('\n🎉 所有修復查詢測試通過！');
  } else {
    console.log('\n⚠️  仍有查詢需要進一步修復');
  }
  
  console.log('\n✅ 測試完成！');
}

// 執行測試
main().catch(console.error); 