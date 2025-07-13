/**
 * 批量查詢系統性能測試
 * 測試 GraphQL 批量查詢優化效果
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// 模擬 Widget 請求
const WIDGET_QUERIES = [
  {
    name: 'GRN Report Widget',
    query: `query GetGRNData($dateRange: DateRangeInput) {
      grnReport(dateRange: $dateRange) {
        totalCount
        recentItems { id supplier totalQty createdAt }
      }
    }`
  },
  {
    name: 'Stock Movement Widget',
    query: `query GetStockMovement($dateRange: DateRangeInput) {
      stockMovement(dateRange: $dateRange) {
        inbound { count value }
        outbound { count value }
      }
    }`
  },
  {
    name: 'Supplier Updates Widget',
    query: `query GetSupplierUpdates($limit: Int) {
      supplierUpdates(limit: $limit) {
        id name lastUpdate status
      }
    }`
  },
  {
    name: 'Order Status Widget',
    query: `query GetOrderStatus {
      orderStatus {
        pending processing completed cancelled
      }
    }`
  },
  {
    name: 'Inventory Levels Widget',
    query: `query GetInventoryLevels {
      inventoryLevels {
        totalSKUs lowStock outOfStock
      }
    }`
  }
];

// 測試單獨查詢性能
async function testIndividualQueries() {
  console.log('\n📊 測試單獨查詢性能...\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (const widget of WIDGET_QUERIES) {
    const queryStartTime = Date.now();
    
    try {
      const response = await axios.post(`${API_URL}/api/graphql`, {
        query: widget.query,
        variables: {
          dateRange: { from: '2025-01-01', to: '2025-07-12' },
          limit: 10
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      const queryTime = Date.now() - queryStartTime;
      
      results.push({
        widget: widget.name,
        time: queryTime,
        status: 'success',
        dataSize: JSON.stringify(response.data).length
      });
      
      console.log(`✅ ${widget.name}: ${queryTime}ms`);
      
    } catch (error) {
      const queryTime = Date.now() - queryStartTime;
      results.push({
        widget: widget.name,
        time: queryTime,
        status: 'error',
        error: error.message
      });
      
      console.log(`❌ ${widget.name}: ${error.message}`);
    }
    
    // 避免過載
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const totalTime = Date.now() - startTime;
  
  return {
    method: 'individual',
    totalTime,
    queryCount: WIDGET_QUERIES.length,
    results,
    avgTimePerQuery: totalTime / WIDGET_QUERIES.length
  };
}

// 測試批量查詢性能
async function testBatchQuery() {
  console.log('\n📊 測試批量查詢性能...\n');
  
  const batchQuery = `
    query BatchWidgetData($dateRange: DateRangeInput, $limit: Int) {
      grnReport(dateRange: $dateRange) {
        totalCount
        recentItems { id supplier totalQty createdAt }
      }
      stockMovement(dateRange: $dateRange) {
        inbound { count value }
        outbound { count value }
      }
      supplierUpdates(limit: $limit) {
        id name lastUpdate status
      }
      orderStatus {
        pending processing completed cancelled
      }
      inventoryLevels {
        totalSKUs lowStock outOfStock
      }
    }
  `;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_URL}/api/graphql`, {
      query: batchQuery,
      variables: {
        dateRange: { from: '2025-01-01', to: '2025-07-12' },
        limit: 10
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ 批量查詢完成: ${totalTime}ms`);
    
    return {
      method: 'batch',
      totalTime,
      queryCount: 1,
      status: 'success',
      dataSize: JSON.stringify(response.data).length
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    console.log(`❌ 批量查詢失敗: ${error.message}`);
    
    return {
      method: 'batch',
      totalTime,
      queryCount: 1,
      status: 'error',
      error: error.message
    };
  }
}

// 測試並發請求性能
async function testConcurrentQueries() {
  console.log('\n📊 測試並發查詢性能...\n');
  
  const startTime = Date.now();
  
  const promises = WIDGET_QUERIES.map(widget => 
    axios.post(`${API_URL}/api/graphql`, {
      query: widget.query,
      variables: {
        dateRange: { from: '2025-01-01', to: '2025-07-12' },
        limit: 10
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    }).then(response => ({
      widget: widget.name,
      status: 'success',
      dataSize: JSON.stringify(response.data).length
    })).catch(error => ({
      widget: widget.name,
      status: 'error',
      error: error.message
    }))
  );
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`✅ 並發查詢完成: ${successCount}/${WIDGET_QUERIES.length} 成功, 總時間: ${totalTime}ms`);
  
  return {
    method: 'concurrent',
    totalTime,
    queryCount: WIDGET_QUERIES.length,
    results,
    avgTimePerQuery: totalTime / WIDGET_QUERIES.length
  };
}

// 主測試函數
async function main() {
  console.log('🚀 開始批量查詢性能測試');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📝 測試 Widgets: ${WIDGET_QUERIES.length}`);
  
  const testResults = {
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    widgetCount: WIDGET_QUERIES.length,
    tests: {}
  };
  
  // 測試 1: 單獨查詢
  console.log('\n========== 測試 1: 單獨查詢 ==========');
  testResults.tests.individual = await testIndividualQueries();
  
  // 休息一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 測試 2: 批量查詢
  console.log('\n========== 測試 2: 批量查詢 ==========');
  testResults.tests.batch = await testBatchQuery();
  
  // 休息一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 測試 3: 並發查詢
  console.log('\n========== 測試 3: 並發查詢 ==========');
  testResults.tests.concurrent = await testConcurrentQueries();
  
  // 計算性能改善
  const improvement = calculateImprovement(testResults);
  testResults.improvement = improvement;
  
  // 保存報告
  const reportDir = path.join(__dirname, '..', 'performance-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `batch-query-performance-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // 打印摘要
  printSummary(testResults);
  
  console.log(`\n📄 詳細報告已保存: ${reportPath}`);
  
  // 更新性能文檔
  updatePerformanceDoc(testResults);
}

// 計算性能改善
function calculateImprovement(results) {
  const individual = results.tests.individual;
  const batch = results.tests.batch;
  const concurrent = results.tests.concurrent;
  
  return {
    batchVsIndividual: {
      timeReduction: individual.totalTime > 0 ? 
        ((individual.totalTime - batch.totalTime) / individual.totalTime * 100).toFixed(1) + '%' : 
        'N/A',
      requestReduction: `${individual.queryCount} → 1 (${((individual.queryCount - 1) / individual.queryCount * 100).toFixed(0)}% 減少)`
    },
    concurrentVsIndividual: {
      timeReduction: individual.totalTime > 0 ? 
        ((individual.totalTime - concurrent.totalTime) / individual.totalTime * 100).toFixed(1) + '%' : 
        'N/A'
    }
  };
}

// 打印摘要
function printSummary(results) {
  console.log('\n📊 性能測試摘要');
  console.log('================\n');
  
  // 單獨查詢
  if (results.tests.individual) {
    const ind = results.tests.individual;
    console.log('單獨查詢:');
    console.log(`  總時間: ${ind.totalTime}ms`);
    console.log(`  平均時間: ${ind.avgTimePerQuery.toFixed(0)}ms/查詢`);
    console.log(`  查詢數: ${ind.queryCount}`);
  }
  
  // 批量查詢
  if (results.tests.batch) {
    const batch = results.tests.batch;
    console.log('\n批量查詢:');
    console.log(`  總時間: ${batch.totalTime}ms`);
    console.log(`  狀態: ${batch.status}`);
  }
  
  // 並發查詢
  if (results.tests.concurrent) {
    const conc = results.tests.concurrent;
    console.log('\n並發查詢:');
    console.log(`  總時間: ${conc.totalTime}ms`);
    console.log(`  平均時間: ${conc.avgTimePerQuery.toFixed(0)}ms/查詢`);
  }
  
  // 改善情況
  if (results.improvement) {
    console.log('\n性能改善:');
    console.log(`  批量 vs 單獨: ${results.improvement.batchVsIndividual.timeReduction} 時間減少`);
    console.log(`  請求數減少: ${results.improvement.batchVsIndividual.requestReduction}`);
    console.log(`  並發 vs 單獨: ${results.improvement.concurrentVsIndividual.timeReduction} 時間減少`);
  }
}

// 更新性能文檔
function updatePerformanceDoc(results) {
  const docPath = path.join(__dirname, '..', 'docs', 'performance-benchmark-results.md');
  
  if (!fs.existsSync(docPath)) {
    return;
  }
  
  let content = fs.readFileSync(docPath, 'utf8');
  
  // 找到批量查詢優化部分
  const batchSection = `
### 批量查詢優化 (已測試)
- **測試時間**: ${results.timestamp}
- **單獨查詢總時間**: ${results.tests.individual?.totalTime || 'N/A'}ms
- **批量查詢總時間**: ${results.tests.batch?.totalTime || 'N/A'}ms
- **並發查詢總時間**: ${results.tests.concurrent?.totalTime || 'N/A'}ms
- **請求數減少**: ${results.improvement?.batchVsIndividual.requestReduction || 'N/A'}
- **性能提升**: ${results.improvement?.batchVsIndividual.timeReduction || 'N/A'}
`;
  
  // 替換批量查詢部分
  content = content.replace(
    /### 批量查詢優化 \(待測試\)[\s\S]*?(?=##|$)/,
    batchSection + '\n'
  );
  
  fs.writeFileSync(docPath, content);
  console.log('\n📝 性能文檔已更新');
}

// 執行測試
main().catch(console.error);