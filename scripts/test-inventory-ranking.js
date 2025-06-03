// 測試庫存排名查詢功能（不同數量）

const testQueries = [
  { question: 'Show top 3 products with highest inventory', expected: 3 },
  { question: 'Show the top product with highest inventory', expected: 1 },
  { question: 'Show top 10 products with highest inventory', expected: 10 },
  { question: 'Show top 5 products with highest inventory', expected: 5 },
  { question: 'Give me top 7 products by inventory', expected: 7 },
  { question: '顯示前3個最高庫存的產品', expected: 3 },
  { question: '最高庫存的產品', expected: 1 }
];

const testSingleQuery = async (queryData) => {
  try {
    console.log(`\n=== Testing: "${queryData.question}" ===`);
    console.log(`Expected count: ${queryData.expected}`);
    
    const response = await fetch('http://localhost:3000/api/ask-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: queryData.question,
        sessionId: `test-inventory-${Date.now()}`
      })
    });
    
    const result = await response.json();
    
    console.log('Intent:', result.intent);
    console.log('Answer:', result.answer);
    
    if (result.result && result.result.data) {
      const actualCount = result.result.data.length;
      console.log(`Actual returned count: ${actualCount}`);
      console.log(`✅ Count match: ${actualCount === queryData.expected ? 'YES' : 'NO'}`);
      
      // 顯示前3個結果
      console.log('Sample results:');
      result.result.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.product_code}: ${item.total_inventory} units`);
      });
    }
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

const runAllTests = async () => {
  console.log('🧪 Testing inventory ranking with different quantities...\n');
  
  for (const queryData of testQueries) {
    await testSingleQuery(queryData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒間隔
  }
  
  console.log('\n✅ All tests completed!');
};

runAllTests(); 