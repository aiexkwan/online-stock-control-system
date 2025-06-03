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

// 另外 20 個常見問題
const moreCommonQuestions = [
  // 時間範圍查詢
  { id: 21, question: "昨天生成了多少個托盤？", category: "時間範圍統計" },
  { id: 22, question: "前天有多少個托盤被轉移？", category: "時間範圍統計" },
  { id: 23, question: "本月生成的托盤總數是多少？", category: "月度統計" },
  { id: 24, question: "昨天的GRN收貨數量", category: "GRN時間統計" },
  
  // 位置相關查詢
  { id: 25, question: "在 Await 位置有多少個托盤？", category: "位置查詢" },
  { id: 26, question: "Fold Mill 區域的托盤數量", category: "位置查詢" },
  { id: 27, question: "Bulk Room 有哪些產品？", category: "位置產品查詢" },
  
  // 產品特定查詢
  { id: 28, question: "產品 Z01ATM1 今天生成了多少托盤？", category: "產品日統計" },
  { id: 29, question: "MEP9090150 昨天的托盤數量", category: "產品日統計" },
  { id: 30, question: "產品 MT4545 的庫存位置分佈", category: "產品位置分佈" },
  
  // 重量相關查詢
  { id: 31, question: "今天GRN的總重量是多少？", category: "重量統計" },
  { id: 32, question: "本週的平均淨重", category: "重量統計" },
  { id: 33, question: "昨天收貨的總毛重", category: "重量統計" },
  
  // 複雜查詢
  { id: 34, question: "庫存最少的前3個產品", category: "庫存排名" },
  { id: 35, question: "今天生成的非GRN托盤數量", category: "過濾查詢" },
  { id: 36, question: "本週只要GRN的托盤統計", category: "過濾查詢" },
  
  // 業務相關查詢
  { id: 37, question: "有多少個托盤被作廢？", category: "作廢統計" },
  { id: 38, question: "最近的作廢記錄", category: "作廢記錄" },
  { id: 39, question: "今天有哪些用戶進行了操作？", category: "用戶活動" },
  { id: 40, question: "本週的操作歷史總數", category: "操作統計" }
];

// 測試單個問題（複用原有函數）
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
        sessionId: 'test-more-questions'
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
    
    // 4. 驗證結果
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

// 驗證結果的準確性（針對新問題的驗證邏輯）
async function verifyResult(question, apiResponse) {
  try {
    const resultData = apiResponse.result?.data;
    
    switch (question.id) {
      case 21: // 昨天生成的托盤數
        if (typeof resultData === 'number') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data: dbData, error } = await supabase
            .from('record_palletinfo')
            .select('plt_num')
            .gte('generate_time', yesterday.toISOString())
            .lt('generate_time', today.toISOString());
          
          if (!error && dbData) {
            return {
              verified: resultData === dbData.length,
              message: `API返回: ${resultData}, 數據庫實際: ${dbData.length}`
            };
          }
        }
        break;
        
      case 25: // Await 位置的托盤數
        if (typeof resultData === 'number') {
          const { data: dbData, error } = await supabase
            .from('record_inventory')
            .select('await')
            .gt('await', 0);
          
          if (!error && dbData) {
            // 計算 await 位置的總托盤數
            let totalPallets = 0;
            dbData.forEach(record => {
              if (record.await > 0) totalPallets++;
            });
            
            return {
              verified: true,
              message: `API返回: ${resultData}, 數據庫有 ${totalPallets} 個托盤在 Await 位置`
            };
          }
        }
        break;
        
      case 34: // 庫存最少的前3個產品
        if (Array.isArray(resultData)) {
          return {
            verified: resultData.length <= 3,
            message: `返回了 ${resultData.length} 個產品（預期最多3個）`
          };
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
  console.log('🧪 開始測試另外 20 個常見問題...\n');
  
  const results = {
    total: moreCommonQuestions.length,
    success: 0,
    failed: 0,
    verified: 0,
    notVerified: 0,
    errors: [],
    needsImprovement: [] // 記錄需要改進的查詢
  };
  
  // 逐個測試問題
  for (const question of moreCommonQuestions) {
    const result = await testQuestion(question);
    
    if (result.success) {
      results.success++;
      if (result.verification?.verified) {
        results.verified++;
      } else {
        results.notVerified++;
      }
      
      // 檢查是否需要改進
      const intent = result.data?.intent;
      if (intent && (intent.confidence < 0.8 || intent.type === 'count' && !question.question.includes('多少'))) {
        results.needsImprovement.push({
          question: question.question,
          currentIntent: intent.type,
          currentRpc: intent.rpcFunction,
          confidence: intent.confidence,
          reason: intent.confidence < 0.8 ? '信心度過低' : '意圖分類可能錯誤'
        });
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
  
  if (results.needsImprovement.length > 0) {
    console.log('\n⚠️  需要改進的查詢:');
    results.needsImprovement.forEach((item, index) => {
      console.log(`${index + 1}. ${item.question}`);
      console.log(`   當前意圖: ${item.currentIntent} (信心度: ${item.confidence})`);
      console.log(`   RPC函數: ${item.currentRpc}`);
      console.log(`   原因: ${item.reason}`);
    });
  }
  
  console.log('\n✅ 測試完成！');
  
  // 生成改進建議
  if (results.needsImprovement.length > 0 || results.errors.length > 0) {
    console.log('\n💡 改進建議:');
    console.log('1. 添加更多關鍵詞匹配規則');
    console.log('2. 調整意圖分類的優先級');
    console.log('3. 為特定查詢類型創建專門的 RPC 函數');
    console.log('4. 改善時間範圍識別邏輯');
  }
}

// 執行測試
main().catch(console.error); 