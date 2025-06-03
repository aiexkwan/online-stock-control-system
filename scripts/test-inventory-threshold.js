// 測試庫存閾值查詢功能

const testQueries = [
  { question: 'Which products have inventory below 100?', expectedThreshold: 100 },
  { question: 'Show products with inventory under 50', expectedThreshold: 50 },
  { question: 'Products with inventory less than 200', expectedThreshold: 200 },
  { question: 'Which products have low inventory below 75?', expectedThreshold: 75 },
  { question: 'Show me products with inventory < 150', expectedThreshold: 150 },
  { question: '庫存低於100的產品', expectedThreshold: 100 },
  { question: '哪些產品的庫存少於50?', expectedThreshold: 50 },
  { question: 'Products with inventory below threshold', expectedThreshold: 100 }, // 默認
];

const testSingleQuery = async (queryData) => {
  try {
    console.log(`\n=== Testing: "${queryData.question}" ===`);
    console.log(`Expected threshold: ${queryData.expectedThreshold}`);
    
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: queryData.question,
        sessionId: `test-threshold-${Date.now()}`
      })
    });
    
    const result = await response.json();
    
    console.log('Intent:', result.intent);
    console.log('Answer:', result.answer?.substring(0, 200) + '...');
    
    if (result.intent) {
      console.log(`✅ Intent type: ${result.intent.type}`);
      console.log(`✅ RPC function: ${result.intent.rpcFunction}`);
      console.log(`✅ Description: ${result.intent.description}`);
      
      if (result.intent.parameters && result.intent.parameters.length > 0) {
        const actualThreshold = result.intent.parameters[0];
        console.log(`✅ Threshold match: ${actualThreshold === queryData.expectedThreshold ? 'YES' : 'NO'} (got ${actualThreshold})`);
      }
    }
    
    if (result.result && result.result.data) {
      console.log(`Products found: ${result.result.data.length}`);
      
      // 顯示前3個結果
      if (result.result.data.length > 0) {
        console.log('Sample results:');
        result.result.data.slice(0, 3).forEach((product) => {
          console.log(`  - ${product.product_code}: ${product.total_inventory} units`);
        });
      }
    }
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

const runAllTests = async () => {
  console.log('🧪 Testing inventory threshold queries...\n');
  
  for (const queryData of testQueries) {
    await testSingleQuery(queryData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒間隔
  }
  
  console.log('\n✅ All threshold tests completed!');
};

runAllTests(); 