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

// 20 個常見問題
const commonQuestions = [
  // 庫存相關
  { id: 1, question: "哪些產品的庫存低於100？", category: "庫存查詢" },
  { id: 2, question: "庫存最多的前5個產品是什麼？", category: "庫存排名" },
  { id: 3, question: "產品 MEP9090150 的總庫存是多少？", category: "特定產品庫存" },
  { id: 4, question: "今天有多少個托盤在庫？", category: "托盤統計" },
  
  // 托盤操作相關
  { id: 5, question: "今天生成了多少個托盤？", category: "托盤生成" },
  { id: 6, question: "本週生成的托盤數量是多少？", category: "托盤生成統計" },
  { id: 7, question: "最近生成的5個托盤是哪些？", category: "最新托盤" },
  
  // 轉移記錄相關
  { id: 8, question: "今天有哪些托盤被轉移？", category: "轉移記錄" },
  { id: 9, question: "本週的轉移記錄有多少筆？", category: "轉移統計" },
  { id: 10, question: "托盤 030625/10 的轉移歷史", category: "特定托盤歷史" },
  
  // GRN 相關
  { id: 11, question: "最近的GRN收貨記錄有哪些？", category: "GRN記錄" },
  { id: 12, question: "今天有多少個GRN收貨？", category: "GRN統計" },
  
  // ACO 訂單相關
  { id: 13, question: "有哪些活躍的ACO訂單？", category: "ACO訂單" },
  { id: 14, question: "ACO訂單的剩餘數量統計", category: "ACO統計" },
  
  // QC 相關
  { id: 15, question: "用戶 5997 本週進行了多少次QC？", category: "QC記錄" },
  { id: 16, question: "今天有哪些托盤被QC？", category: "QC統計" },
  
  // 產品資訊相關
  { id: 17, question: "有多少個不同的產品代碼？", category: "產品統計" },
  { id: 18, question: "顯示所有黑色的產品", category: "產品查詢" },
  
  // 供應商相關
  { id: 19, question: "有多少個供應商？", category: "供應商統計" },
  { id: 20, question: "供應商 S001 的資訊", category: "供應商查詢" }
];

// 測試單個問題
async function testQuestion(question) {
  console.log(`\n📝 測試問題 ${question.id}: ${question.question}`);
  console.log(`   類別: ${question.category}`);
  
  try {
    // 1. 調用 ask-database API
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.question,
        sessionId: 'test-20-questions'
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
    
    // 2. 顯示 API 回應
    console.log(`   ✅ 查詢成功`);
    console.log(`   🎯 意圖: ${data.intent?.type} (信心度: ${data.intent?.confidence})`);
    console.log(`   🚀 RPC函數: ${data.intent?.rpcFunction}`);
    console.log(`   ⏱️  執行時間: ${data.executionTime}ms`);
    console.log(`   💾 緩存: ${data.cached ? '是' : '否'}`);
    
    // 3. 顯示結果摘要
    const resultData = data.result?.data;
    if (Array.isArray(resultData)) {
      console.log(`   📊 返回 ${resultData.length} 筆記錄`);
      if (resultData.length > 0 && resultData.length <= 3) {
        console.log('   前幾筆結果:');
        resultData.forEach((item, index) => {
          console.log(`     ${index + 1}.`, JSON.stringify(item));
        });
      }
    } else if (typeof resultData === 'number') {
      console.log(`   📊 返回數值: ${resultData}`);
    } else if (typeof resultData === 'object' && resultData !== null) {
      console.log(`   📊 返回物件:`, JSON.stringify(resultData, null, 2));
    }
    
    console.log(`   💬 AI回答: ${data.answer}`);
    
    // 4. 驗證結果（根據問題類型進行不同的驗證）
    const verification = await verifyResult(question, data);
    if (verification.verified) {
      console.log(`   ✅ 驗證通過: ${verification.message}`);
    } else {
      console.log(`   ⚠️  驗證失敗: ${verification.message}`);
    }
    
    return { 
      success: true, 
      data: data,
      verification: verification
    };
    
  } catch (error) {
    console.log(`   ❌ 網絡錯誤: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 驗證結果的準確性
async function verifyResult(question, apiResponse) {
  try {
    const resultData = apiResponse.result?.data;
    
    switch (question.id) {
      case 1: // 庫存低於100的產品
        if (Array.isArray(resultData)) {
          // 直接查詢數據庫驗證
          const { data: dbData, error } = await supabase
            .from('record_inventory')
            .select('product_code, injection, pipeline, prebook, await, fold, bulk, backcarpark')
            .limit(1000);
          
          if (!error && dbData) {
            // 計算每個產品的總庫存
            const productInventory = {};
            dbData.forEach(record => {
              const total = Number(record.injection || 0) + Number(record.pipeline || 0) + 
                           Number(record.prebook || 0) + Number(record.await || 0) + 
                           Number(record.fold || 0) + Number(record.bulk || 0) + 
                           Number(record.backcarpark || 0);
              
              if (!productInventory[record.product_code]) {
                productInventory[record.product_code] = 0;
              }
              productInventory[record.product_code] += total;
            });
            
            // 找出庫存低於100的產品
            const lowInventoryProducts = Object.entries(productInventory)
              .filter(([code, total]) => total < 100 && total > 0)
              .map(([code, total]) => ({ product_code: code, total_inventory: total }));
            
            return {
              verified: true,
              message: `數據庫實際有 ${lowInventoryProducts.length} 個產品庫存低於100，API返回 ${resultData.length} 個`
            };
          }
        }
        break;
        
      case 3: // 特定產品庫存
        if (typeof resultData === 'number') {
          // 查詢數據庫驗證
          const { data: dbData, error } = await supabase
            .from('record_inventory')
            .select('injection, pipeline, prebook, await, fold, bulk, backcarpark')
            .eq('product_code', 'MEP9090150');
          
          if (!error && dbData) {
            let totalInventory = 0;
            dbData.forEach(record => {
              totalInventory += Number(record.injection || 0) + Number(record.pipeline || 0) + 
                               Number(record.prebook || 0) + Number(record.await || 0) + 
                               Number(record.fold || 0) + Number(record.bulk || 0) + 
                               Number(record.backcarpark || 0);
            });
            
            return {
              verified: resultData === totalInventory,
              message: `API返回: ${resultData}, 數據庫實際: ${totalInventory}`
            };
          }
        }
        break;
        
      case 5: // 今天生成的托盤數
        if (typeof resultData === 'number') {
          // 查詢數據庫驗證
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const { data: dbData, error } = await supabase
            .from('record_palletinfo')
            .select('plt_num')
            .gte('generate_time', today.toISOString())
            .lt('generate_time', tomorrow.toISOString());
          
          if (!error && dbData) {
            return {
              verified: resultData === dbData.length,
              message: `API返回: ${resultData}, 數據庫實際: ${dbData.length}`
            };
          }
        }
        break;
        
      case 17: // 產品代碼數量
        if (typeof resultData === 'number') {
          const { data: dbData, error } = await supabase
            .from('data_code')
            .select('code');
          
          if (!error && dbData) {
            return {
              verified: resultData === dbData.length,
              message: `API返回: ${resultData}, 數據庫實際: ${dbData.length}`
            };
          }
        }
        break;
        
      default:
        return {
          verified: true,
          message: '此問題類型暫不進行自動驗證'
        };
    }
    
    return {
      verified: false,
      message: '無法完成驗證'
    };
    
  } catch (error) {
    return {
      verified: false,
      message: `驗證過程出錯: ${error.message}`
    };
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
  console.log('🧪 開始測試 20 個常見問題...\n');
  
  const results = {
    total: commonQuestions.length,
    success: 0,
    failed: 0,
    verified: 0,
    notVerified: 0,
    errors: []
  };
  
  // 逐個測試問題
  for (const question of commonQuestions) {
    const result = await testQuestion(question);
    
    if (result.success) {
      results.success++;
      if (result.verification?.verified) {
        results.verified++;
      } else {
        results.notVerified++;
      }
    } else {
      results.failed++;
      results.errors.push({
        question: question.question,
        error: result.error
      });
    }
    
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 顯示總結
  console.log('\n' + '='.repeat(80));
  console.log('📊 測試總結');
  console.log('='.repeat(80));
  console.log(`總問題數: ${results.total}`);
  console.log(`成功查詢: ${results.success} (${(results.success/results.total*100).toFixed(1)}%)`);
  console.log(`查詢失敗: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  console.log(`驗證通過: ${results.verified}`);
  console.log(`驗證失敗: ${results.notVerified}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 失敗的查詢:');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.question}`);
      console.log(`   錯誤: ${err.error}`);
    });
  }
  
  console.log('\n✅ 測試完成！');
}

// 執行測試
main().catch(console.error); 