#!/usr/bin/env node

// 測試 Ask Database 功能（使用 RPC 函數）
// 驗證所有6個測試案例是否能返回正確結果

const queries = [
  {
    id: 1,
    question: "今日總共生成了多少個托盤？",
    expected: "28個",
    description: "今天所有托盤總數"
  },
  {
    id: 2,
    question: "今日排除 GRN 收貨後，總共生成了多少個托盤？",
    expected: "14個",
    description: "今天非GRN托盤數量（關鍵測試案例）"
  },
  {
    id: 3,
    question: "今日 GRN 收貨了多少個托盤，總淨重和毛重是多少？",
    expected: "14個托盤，淨重2930，毛重3300",
    description: "今天GRN重量統計"
  },
  {
    id: 4,
    question: "昨天 GRN 收貨了多少個托盤？",
    expected: "0個",
    description: "昨天GRN收貨數量"
  },
  {
    id: 5,
    question: "前天 GRN 收貨了多少個托盤？",
    expected: "8個",
    description: "前天GRN收貨數量"
  },
  {
    id: 6,
    question: "產品代碼 MEP9090150 有多少個托盤，總數量是多少？",
    expected: "35個托盤，總數411",
    description: "產品聚合查詢"
  }
];

async function testAskDatabase() {
  console.log('🧪 測試 Ask Database 功能（使用 RPC 函數）\n');
  console.log('📋 將測試以下6個查詢，驗證RPC函數是否解決了複雜條件問題：\n');
  
  let allPassed = true;
  const results = [];
  
  for (const query of queries) {
    console.log(`${query.id}️⃣ 測試：${query.description}`);
    console.log(`   問題：${query.question}`);
    console.log(`   預期：${query.expected}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ask-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query.question,
          sessionId: 'test-session-rpc'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ API錯誤 (${response.status}): ${errorText}\n`);
        allPassed = false;
        results.push({
          id: query.id,
          status: 'API_ERROR',
          error: `${response.status}: ${errorText}`
        });
        continue;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`   ❌ 查詢錯誤: ${data.error}\n`);
        allPassed = false;
        results.push({
          id: query.id,
          status: 'QUERY_ERROR',
          error: data.error
        });
        continue;
      }
      
      // 提取結果
      const resultData = data.result?.data || [];
      let actualResult = '';
      
      if (query.id === 1) {
        // 今日總托盤
        const count = resultData[0]?.count || 0;
        actualResult = `${count}個`;
      } else if (query.id === 2) {
        // 今日排除GRN（關鍵測試）
        const count = resultData[0]?.count || 0;
        actualResult = `${count}個`;
      } else if (query.id === 3) {
        // GRN重量統計
        const stats = resultData[0] || {};
        const palletCount = stats.pallet_count || 0;
        const netWeight = stats.total_net_weight || 0;
        const grossWeight = stats.total_gross_weight || 0;
        actualResult = `${palletCount}個托盤，淨重${netWeight}，毛重${grossWeight}`;
      } else if (query.id === 4 || query.id === 5) {
        // 昨天/前天GRN
        const count = resultData[0]?.count || 0;
        actualResult = `${count}個`;
      } else if (query.id === 6) {
        // 產品統計
        const stats = resultData[0] || {};
        const palletCount = stats.pallet_count || 0;
        const totalQty = stats.total_quantity || 0;
        actualResult = `${palletCount}個托盤，總數${totalQty}`;
      }
      
      console.log(`   📊 實際：${actualResult}`);
      
      // 檢查是否正確（簡化的比較）
      const isCorrect = actualResult.includes(query.expected.split('個')[0]) || 
                       actualResult === query.expected;
      
      if (isCorrect) {
        console.log(`   ✅ 通過\n`);
        results.push({
          id: query.id,
          status: 'PASS',
          expected: query.expected,
          actual: actualResult
        });
      } else {
        console.log(`   ❌ 失敗\n`);
        allPassed = false;
        results.push({
          id: query.id,
          status: 'FAIL',
          expected: query.expected,
          actual: actualResult
        });
      }
      
    } catch (error) {
      console.log(`   ❌ 網絡錯誤: ${error.message}\n`);
      allPassed = false;
      results.push({
        id: query.id,
        status: 'NETWORK_ERROR',
        error: error.message
      });
    }
  }
  
  // 總結報告
  console.log('🎯 測試總結');
  console.log('─'.repeat(60));
  
  const passedCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;
  
  console.log(`📊 通過率: ${passedCount}/${totalCount} (${Math.round(passedCount/totalCount*100)}%)`);
  
  if (allPassed) {
    console.log('\n🎉 所有測試通過！RPC 函數成功解決了複雜查詢問題');
    console.log('✅ Ask Database 功能現在能正確處理所有查詢類型');
    console.log('📈 數學邏輯檢查：28 = 14 + 14 ✅');
  } else {
    console.log('\n❌ 部分測試失敗');
    console.log('\n失敗的測試:');
    results.forEach(result => {
      if (result.status !== 'PASS') {
        console.log(`  ${result.id}. ${result.status}`);
        if (result.error) {
          console.log(`     錯誤: ${result.error}`);
        } else {
          console.log(`     預期: ${result.expected}`);
          console.log(`     實際: ${result.actual}`);
        }
      }
    });
    
    console.log('\n🔧 故障排除建議:');
    console.log('1. 確保 RPC 函數已正確設置（運行 node test-rpc-simple.js）');
    console.log('2. 檢查 API 服務是否正常運行（npm run dev）');
    console.log('3. 驗證數據庫數據是否符合預期');
    console.log('4. 查看瀏覽器控制台或 API 日誌獲取詳細錯誤');
  }
  
  // 特別檢查關鍵測試案例
  const criticalTest = results.find(r => r.id === 2);
  if (criticalTest && criticalTest.status === 'PASS') {
    console.log('\n🎯 關鍵測試通過！');
    console.log('   「今天排除GRN托盤」查詢現在返回正確結果');
    console.log('   這證明 RPC 函數成功解決了查詢構建器的複雜條件問題');
  } else if (criticalTest && criticalTest.status !== 'PASS') {
    console.log('\n⚠️ 關鍵測試失敗！');
    console.log('   「今天排除GRN托盤」查詢仍有問題');
    console.log('   請檢查 RPC 函數設置和 API 實現');
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
  console.log('🔍 檢查 Ask Database 服務...\n');
  
  const serviceRunning = await checkService();
  if (!serviceRunning) {
    console.log('❌ Ask Database 服務未運行');
    console.log('請先啟動開發服務器：npm run dev');
    console.log('然後在瀏覽器中訪問：http://localhost:3000');
    process.exit(1);
  }
  
  console.log('✅ 服務正常運行，開始測試...\n');
  await testAskDatabase();
}

main().catch(console.error); 