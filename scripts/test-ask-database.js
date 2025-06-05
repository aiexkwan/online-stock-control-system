// 測試 Ask Database API 的簡單腳本
// 使用方法: node scripts/test-ask-database.js

const testQuestions = [
  "今天生成了多少個托盤？",
  "How many pallets were generated today?",
  "顯示庫存最高的前5個產品",
  "Show top 5 products with highest inventory",
  "MHCOL2產品的總庫存是多少？",
  "What is the total inventory for MHCOL2?"
];

async function testAskDatabase() {
  console.log('🚀 Testing Ask Database API with OpenAI Integration');
  console.log('=' .repeat(60));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/ask-database`;

  // 首先檢查 API 狀態
  try {
    console.log('📊 Checking API status...');
    const statusResponse = await fetch(apiUrl, { method: 'GET' });
    const status = await statusResponse.json();
    
    console.log('✅ API Status:', {
      mode: status.mode,
      version: status.version,
      openaiApiKey: status.environment?.openaiApiKey ? '✅ Configured' : '❌ Missing',
      database: status.database?.connected ? '✅ Connected' : '❌ Disconnected'
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed to check API status:', error.message);
    return;
  }

  // 測試查詢
  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`📝 Test ${i + 1}: ${question}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          sessionId: `test_session_${Date.now()}`
        })
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`❌ Failed (${response.status}): ${errorData.error}`);
        console.log('');
        continue;
      }

      const result = await response.json();
      
      console.log(`✅ Success (${responseTime}ms)`);
      console.log(`   SQL: ${result.sql?.substring(0, 100)}${result.sql?.length > 100 ? '...' : ''}`);
      console.log(`   Answer: ${result.answer?.substring(0, 150)}${result.answer?.length > 150 ? '...' : ''}`);
      console.log(`   Tokens: ${result.tokensUsed || 0}`);
      console.log(`   Complexity: ${result.complexity}`);
      console.log(`   Cached: ${result.cached ? 'Yes' : 'No'}`);
      console.log('');

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('');
    }

    // 添加延遲以避免 API 限制
    if (i < testQuestions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('🎉 Testing completed!');
}

// 運行測試
if (require.main === module) {
  testAskDatabase().catch(console.error);
}

module.exports = { testAskDatabase }; 