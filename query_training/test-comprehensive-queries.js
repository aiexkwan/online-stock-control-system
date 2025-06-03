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

// 20個綜合專項測試問題（重量、日期、貨物數量、員工）
const comprehensiveQueries = [
  // 重量專項 (1-6)
  { id: 1, question: "What's the total weight of goods received yesterday?", category: "重量+日期", expected_type: "weight" },
  { id: 2, question: "昨天到今天的平均重量變化", category: "重量+日期範圍", expected_type: "weight" },
  { id: 3, question: "Show me the net weight for last week", category: "重量+日期", expected_type: "weight" },
  { id: 4, question: "本月到目前為止的總毛重是多少？", category: "重量+日期範圍", expected_type: "weight" },
  { id: 5, question: "Compare today's weight with yesterday", category: "重量+日期對比", expected_type: "weight" },
  { id: 6, question: "本週每天的平均重量統計", category: "重量+日期範圍", expected_type: "weight" },
  
  // 貨物數量專項 (7-12)
  { id: 7, question: "How many pallets were generated between 1st June and 3rd June?", category: "數量+日期範圍", expected_type: "count" },
  { id: 8, question: "今天生成的托盤數量與昨天相比", category: "數量+日期對比", expected_type: "count" },
  { id: 9, question: "Show me GRN quantities for the past 3 days", category: "數量+日期範圍", expected_type: "count" },
  { id: 10, question: "本月前10天的平均托盤生成量", category: "數量+日期範圍", expected_type: "count" },
  { id: 11, question: "How many non-GRN pallets this week vs last week?", category: "數量+日期對比", expected_type: "count" },
  { id: 12, question: "過去7天每天的托盤數量統計", category: "數量+日期範圍", expected_type: "count" },
  
  // 員工活動專項 (13-18)
  { id: 13, question: "Who are the most active employees this week?", category: "員工+日期", expected_type: "user_activity" },
  { id: 14, question: "員工5997在過去3天的工作量", category: "員工+日期範圍", expected_type: "user_activity" },
  { id: 15, question: "Show me today's employee performance ranking", category: "員工+日期", expected_type: "user_activity" },
  { id: 16, question: "本週哪些員工處理了超過10個托盤？", category: "員工+數量+日期", expected_type: "user_activity" },
  { id: 17, question: "Compare employee workload: today vs yesterday", category: "員工+日期對比", expected_type: "user_activity" },
  { id: 18, question: "過去一週員工工作量趨勢分析", category: "員工+日期範圍", expected_type: "user_activity" },
  
  // 複合查詢 (19-20)
  { id: 19, question: "What's the weight per employee for today's operations?", category: "重量+員工+數量", expected_type: "weight" },
  { id: 20, question: "本週每個員工平均處理的托盤重量和數量", category: "重量+員工+數量+日期", expected_type: "user_activity" }
];

// 測試單個問題
async function testComprehensiveQuery(testCase) {
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
        sessionId: 'test-comprehensive'
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
      if (resultData.length > 0 && resultData.length <= 3) {
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
    
    console.log(`   💬 AI回答: ${data.answer.substring(0, 100)}...`);
    
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
  console.log('🧪 開始測試綜合專項查詢（重量、日期、數量、員工）...\n');
  
  const results = {
    total: comprehensiveQueries.length,
    success: 0,
    failed: 0,
    typeCorrect: 0,
    typeIncorrect: 0,
    errors: [],
    typeErrors: []
  };
  
  // 逐個測試問題
  for (const testCase of comprehensiveQueries) {
    const result = await testComprehensiveQuery(testCase);
    
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
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // 顯示總結
  console.log('\n' + '='.repeat(80));
  console.log('📊 綜合專項查詢測試總結');
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
  const weightQueries = comprehensiveQueries.filter(q => q.category.includes('重量'));
  const employeeQueries = comprehensiveQueries.filter(q => q.category.includes('員工'));
  const dateQueries = comprehensiveQueries.filter(q => q.category.includes('日期'));
  const quantityQueries = comprehensiveQueries.filter(q => q.category.includes('數量'));
  
  console.log(`重量查詢: ${weightQueries.length}個`);
  console.log(`員工查詢: ${employeeQueries.length}個`);
  console.log(`日期查詢: ${dateQueries.length}個`);
  console.log(`數量查詢: ${quantityQueries.length}個`);
  
  if (results.typeCorrect === results.total) {
    console.log('\n🎉 所有意圖分類都正確！');
  } else {
    console.log('\n⚠️  仍有意圖分類需要調整');
    console.log('💡 建議檢查複合查詢的意圖識別邏輯');
  }
  
  console.log('\n✅ 測試完成！');
}

// 執行測試
main().catch(console.error); 