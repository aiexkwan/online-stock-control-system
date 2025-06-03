#!/usr/bin/env node

// 測試修復後的 Ask Database 庫存查詢功能

async function testFixedAskDatabase() {
  console.log('🧪 測試修復後的 Ask Database 庫存查詢功能\n');
  
  const testQueries = [
    {
      id: 1,
      question: "Which products have inventory below 100?",
      description: "修復前會返回Z01ATM1 (-376)等負數結果，修復後應該返回合理的正數結果"
    },
    {
      id: 2, 
      question: "Show me products with stock less than 50",
      description: "測試不同閾值"
    },
    {
      id: 3,
      question: "庫存低於10的產品有哪些？",
      description: "測試中文查詢"
    }
  ];
  
  console.log('📋 測試查詢列表:');
  testQueries.forEach(query => {
    console.log(`${query.id}. ${query.question}`);
    console.log(`   說明: ${query.description}\n`);
  });
  
  for (const query of testQueries) {
    console.log(`🔍 測試 ${query.id}: ${query.question}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ask-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query.question,
          sessionId: 'test-fixed-session'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ API錯誤 (${response.status}): ${errorText}\n`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`   ❌ 查詢錯誤: ${data.error}\n`);
        continue;
      }
      
      // 分析結果
      const resultData = data.result?.data || [];
      
      console.log(`   ✅ 查詢成功`);
      console.log(`   📊 返回 ${resultData.length} 個產品`);
      console.log(`   🎯 意圖: ${data.intent?.type} (${data.intent?.confidence})`);
      console.log(`   🚀 RPC函數: ${data.intent?.rpcFunction}`);
      console.log(`   ⏱️ 執行時間: ${data.executionTime}ms`);
      
      if (resultData.length > 0) {
        console.log('   前3個結果:');
        resultData.slice(0, 3).forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.product_code}: ${product.total_inventory} 單位`);
          
          // 檢查是否有負數（這是我們要修復的問題）
          if (product.total_inventory < 0) {
            console.log(`       ⚠️ 警告: 發現負數庫存！這表示修復不完全`);
          }
        });
        
        // 檢查是否還有Z01ATM1出現在低庫存列表中
        const z01atm1Result = resultData.find(p => p.product_code === 'Z01ATM1');
        if (z01atm1Result) {
          console.log(`   ⚠️ Z01ATM1 仍在結果中: ${z01atm1Result.total_inventory} 單位`);
        } else {
          console.log(`   ✅ Z01ATM1 不在低庫存列表中（符合期望）`);
        }
      }
      
      console.log(`   💬 AI回答: ${data.answer}\n`);
      
    } catch (error) {
      console.log(`   ❌ 網絡錯誤: ${error.message}\n`);
    }
  }
  
  console.log('🎉 測試完成！');
  console.log('\n📝 總結:');
  console.log('- 修復前: Z01ATM1 顯示 -376 單位（錯誤）');
  console.log('- 修復後: Z01ATM1 應該不出現在低庫存列表中（正確）');
  console.log('- 所有結果應該都是正數且合理');
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
  
  console.log('✅ 服務正常運行\n');
  await testFixedAskDatabase();
}

main().catch(console.error); 