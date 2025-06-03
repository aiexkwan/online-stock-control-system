#!/usr/bin/env node

import fetch from 'node-fetch';
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

// 20個重量和員工專項測試問題
const weightEmployeeQueries = [
  // 重量查詢系列 (1-12)
  { id: 1, question: "今天GRN的總重量是多少？", category: "重量統計", expected_type: "weight" },
  { id: 2, question: "昨天收貨的總毛重", category: "重量統計", expected_type: "weight" },
  { id: 3, question: "本週的平均淨重", category: "重量統計", expected_type: "weight" },
  { id: 4, question: "本月GRN的總重量統計", category: "重量統計", expected_type: "weight" },
  { id: 5, question: "今天的平均毛重是多少？", category: "重量統計", expected_type: "weight" },
  { id: 6, question: "昨天GRN的平均重量", category: "重量統計", expected_type: "weight" },
  { id: 7, question: "本週收貨的淨重總計", category: "重量統計", expected_type: "weight" },
  { id: 8, question: "今天收貨的毛重統計", category: "重量統計", expected_type: "weight" },
  { id: 9, question: "本週平均每筆GRN的重量", category: "重量統計", expected_type: "weight" },
  { id: 10, question: "昨天的net weight是多少？", category: "重量統計", expected_type: "weight" },
  { id: 11, question: "今天gross weight總計", category: "重量統計", expected_type: "weight" },
  { id: 12, question: "本週的total weight統計", category: "重量統計", expected_type: "weight" },
  
  // 員工工作量查詢系列 (13-20)
  { id: 13, question: "用戶5997今天處理了多少個托盤？", category: "員工工作量", expected_type: "user_activity" },
  { id: 14, question: "員工1234本週的工作量是多少？", category: "員工工作量", expected_type: "user_activity" },
  { id: 15, question: "今天哪些員工在工作？", category: "員工活動", expected_type: "user_activity" },
  { id: 16, question: "本週工作量最多的前5個員工", category: "員工統計", expected_type: "user_activity" },
  { id: 17, question: "用戶6789昨天完成了多少次操作？", category: "員工工作量", expected_type: "user_activity" },
  { id: 18, question: "今天有多少個員工在進行操作？", category: "員工活動", expected_type: "user_activity" },
  { id: 19, question: "員工4567本週處理了哪些任務？", category: "員工工作量", expected_type: "user_activity" },
  { id: 20, question: "本週所有員工的總工作量統計", category: "員工統計", expected_type: "user_activity" }
];

// 測試單個問題
async function testWeightEmployeeQuery(testCase) {
  console.log(`\n📝 測試 ${testCase.id}: ${testCase.question}`);
  console.log(`   類別: ${testCase.category} | 預期類型: ${testCase.expected_type}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: testCase.question,
        sessionId: 'test-weight-employee'
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ API 錯誤 (${response.status}): ${errorText}`);
      return { success: false, error: `API錯誤: ${response.status}`, testCase };
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`   ❌ 查詢錯誤: ${data.error}`);
      return { success: false, error: data.error, testCase };
    }
    
    // 檢查意圖分類是否正確
    const actualType = data.intent?.type;
    const expectedType = testCase.expected_type;
    const typeCorrect = actualType === expectedType;
    
    // 顯示結果
    console.log(`   ✅ 查詢成功`);
    console.log(`   🎯 意圖類型: ${actualType} ${typeCorrect ? '✅' : '❌'} (預期: ${expectedType})`);
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
      console.log(`   📊 返回物件:`, Object.keys(resultData).join(', '));
    }
    
    console.log(`   💬 AI回答: ${data.answer.substring(0, 80)}...`);
    
    return { 
      success: true, 
      data: data,
      typeCorrect: typeCorrect,
      testCase
    };
    
  } catch (error) {
    console.log(`   ❌ 網絡錯誤: ${error.message}`);
    return { success: false, error: error.message, testCase };
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
  console.log('🧪 開始測試重量和員工專項查詢...\n');
  
  const results = {
    total: weightEmployeeQueries.length,
    success: 0,
    failed: 0,
    typeCorrect: 0,
    typeIncorrect: 0,
    errors: [],
    typeErrors: []
  };
  
  // 逐個測試問題
  for (const testCase of weightEmployeeQueries) {
    const result = await testWeightEmployeeQuery(testCase);
    
    if (result.success) {
      results.success++;
      
      if (result.typeCorrect) {
        results.typeCorrect++;
      } else {
        results.typeIncorrect++;
        results.typeErrors.push({
          question: testCase.question,
          expected: testCase.expected_type,
          actual: result.data?.intent?.type,
          rpcFunction: result.data?.intent?.rpcFunction
        });
      }
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
  console.log('📊 重量和員工查詢測試總結');
  console.log('='.repeat(80));
  console.log(`總問題數: ${results.total}`);
  console.log(`成功查詢: ${results.success} (${(results.success/results.total*100).toFixed(1)}%)`);
  console.log(`查詢失敗: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  console.log(`意圖分類正確: ${results.typeCorrect} (${(results.typeCorrect/results.total*100).toFixed(1)}%)`);
  console.log(`意圖分類錯誤: ${results.typeIncorrect} (${(results.typeIncorrect/results.total*100).toFixed(1)}%)`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 查詢失敗:');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.question}`);
      console.log(`   錯誤: ${err.error}`);
    });
  }
  
  if (results.typeErrors.length > 0) {
    console.log('\n⚠️  意圖分類錯誤:');
    results.typeErrors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.question}`);
      console.log(`   預期: ${err.expected} | 實際: ${err.actual}`);
      console.log(`   RPC函數: ${err.rpcFunction}`);
    });
  }
  
  // 分類統計
  console.log('\n📈 分類統計:');
  const weightQueries = weightEmployeeQueries.filter(q => q.category.includes('重量'));
  const employeeQueries = weightEmployeeQueries.filter(q => q.category.includes('員工'));
  
  console.log(`重量查詢: ${weightQueries.length}個`);
  console.log(`員工查詢: ${employeeQueries.length}個`);
  
  if (results.typeCorrect === results.total) {
    console.log('\n🎉 所有意圖分類都正確！');
  } else {
    console.log('\n⚠️  仍有意圖分類需要調整');
    console.log('💡 建議檢查重量查詢的關鍵詞識別邏輯');
  }
  
  console.log('\n✅ 測試完成！');
}

// 執行測試
main().catch(console.error); 