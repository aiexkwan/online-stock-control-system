import { test, expect } from '@playwright/test';
import { TEST_USER } from '../utils/test-data';

interface PerformanceMetric {
  endpoint: string;
  method: 'GraphQL' | 'REST';
  responseTime: number;
  dataSize: number;
  success: boolean;
}

// 性能基準測試 - 對比 GraphQL 和 REST API
test.describe('GraphQL vs REST API Performance Benchmark', () => {
  let authToken: string;
  let graphqlClient: any;
  const restBaseUrl = 'http://localhost:3001/api/v1';
  const graphqlUrl = 'http://localhost:3000/api/graphql';
  const metrics: PerformanceMetric[] = [];

  test.beforeAll(async ({ request }) => {
    // 獲取 REST API token
    const loginResponse = await request.post(`${restBaseUrl}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;

    // 登入 GraphQL (假設使用相同的認證)
    // 實際實現可能需要調整
  });

  test.afterAll(async () => {
    // 生成性能報告
    console.log('\n\n=== 性能基準測試報告 ===\n');
    
    // 按端點分組計算平均值
    const endpointGroups = metrics.reduce((acc, metric) => {
      const key = metric.endpoint;
      if (!acc[key]) acc[key] = { GraphQL: [], REST: [] };
      acc[key][metric.method].push(metric);
      return acc;
    }, {} as Record<string, Record<string, PerformanceMetric[]>>);

    // 生成報告表格
    console.log('| Endpoint | GraphQL Avg (ms) | REST Avg (ms) | 改善幅度 | GraphQL Size (KB) | REST Size (KB) | Size 減少 |');
    console.log('|----------|------------------|---------------|---------|-------------------|----------------|-----------|');
    
    Object.entries(endpointGroups).forEach(([endpoint, methods]) => {
      const graphqlMetrics = methods.GraphQL || [];
      const restMetrics = methods.REST || [];
      
      if (graphqlMetrics.length > 0 && restMetrics.length > 0) {
        const graphqlAvgTime = graphqlMetrics.reduce((sum, m) => sum + m.responseTime, 0) / graphqlMetrics.length;
        const restAvgTime = restMetrics.reduce((sum, m) => sum + m.responseTime, 0) / restMetrics.length;
        const timeImprovement = ((graphqlAvgTime - restAvgTime) / graphqlAvgTime * 100).toFixed(1);
        
        const graphqlAvgSize = graphqlMetrics.reduce((sum, m) => sum + m.dataSize, 0) / graphqlMetrics.length / 1024;
        const restAvgSize = restMetrics.reduce((sum, m) => sum + m.dataSize, 0) / restMetrics.length / 1024;
        const sizeReduction = ((graphqlAvgSize - restAvgSize) / graphqlAvgSize * 100).toFixed(1);
        
        console.log(
          `| ${endpoint.padEnd(8)} | ${graphqlAvgTime.toFixed(2).padEnd(16)} | ${restAvgTime.toFixed(2).padEnd(13)} | ${timeImprovement}%${timeImprovement.length < 6 ? ' '.repeat(6 - timeImprovement.length) : ''} | ${graphqlAvgSize.toFixed(2).padEnd(17)} | ${restAvgSize.toFixed(2).padEnd(14)} | ${sizeReduction}%${sizeReduction.length < 8 ? ' '.repeat(8 - sizeReduction.length) : ''} |`
        );
      }
    });
    
    // 總體統計
    const graphqlTotal = metrics.filter(m => m.method === 'GraphQL');
    const restTotal = metrics.filter(m => m.method === 'REST');
    
    if (graphqlTotal.length > 0 && restTotal.length > 0) {
      const graphqlAvgTotal = graphqlTotal.reduce((sum, m) => sum + m.responseTime, 0) / graphqlTotal.length;
      const restAvgTotal = restTotal.reduce((sum, m) => sum + m.responseTime, 0) / restTotal.length;
      const totalImprovement = ((graphqlAvgTotal - restAvgTotal) / graphqlAvgTotal * 100).toFixed(1);
      
      console.log('\n總體性能改善: ' + totalImprovement + '%');
      console.log(`GraphQL 平均響應時間: ${graphqlAvgTotal.toFixed(2)}ms`);
      console.log(`REST API 平均響應時間: ${restAvgTotal.toFixed(2)}ms`);
    }
  });

  test('Benchmark: Stats Card Data', async ({ page, request }) => {
    const dataSource = 'total_pallets';
    
    // REST API 測試
    const restStart = Date.now();
    const restResponse = await request.get(`${restBaseUrl}/widgets/stats-card`, {
      params: { dataSource },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const restEnd = Date.now();
    
    expect(restResponse.ok()).toBeTruthy();
    const restData = await restResponse.json();
    const restSize = JSON.stringify(restData).length;
    
    metrics.push({
      endpoint: 'StatsCard',
      method: 'REST',
      responseTime: restEnd - restStart,
      dataSize: restSize,
      success: true,
    });

    // GraphQL 測試
    await page.goto('http://localhost:3000');
    await page.evaluate(async () => {
      const query = `
        query GetDashboardStats {
          getDashboardStats {
            totalPallets
            activeProducts
            lowStockAlerts
            recentTransfers
          }
        }
      `;
      
      const graphqlStart = Date.now();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const graphqlEnd = Date.now();
      
      const data = await response.json();
      const graphqlSize = JSON.stringify(data).length;
      
      // 保存到 window 對象以便測試訪問
      (window as any).graphqlMetric = {
        responseTime: graphqlEnd - graphqlStart,
        dataSize: graphqlSize,
        success: !data.errors,
      };
    });
    
    const graphqlMetric = await page.evaluate(() => (window as any).graphqlMetric);
    metrics.push({
      endpoint: 'StatsCard',
      method: 'GraphQL',
      ...graphqlMetric,
    });
  });

  test('Benchmark: Product Distribution', async ({ page, request }) => {
    // REST API 測試
    const restStart = Date.now();
    const restResponse = await request.get(`${restBaseUrl}/widgets/product-distribution`, {
      params: { limit: 10 },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const restEnd = Date.now();
    
    expect(restResponse.ok()).toBeTruthy();
    const restData = await restResponse.json();
    const restSize = JSON.stringify(restData).length;
    
    metrics.push({
      endpoint: 'ProductDist',
      method: 'REST',
      responseTime: restEnd - restStart,
      dataSize: restSize,
      success: true,
    });

    // GraphQL 測試
    await page.goto('http://localhost:3000');
    await page.evaluate(async () => {
      const query = `
        query GetProductDistribution {
          getInventoryAnalysis {
            productDistribution {
              productCode
              totalQuantity
              percentage
            }
          }
        }
      `;
      
      const graphqlStart = Date.now();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const graphqlEnd = Date.now();
      
      const data = await response.json();
      const graphqlSize = JSON.stringify(data).length;
      
      (window as any).graphqlMetric = {
        responseTime: graphqlEnd - graphqlStart,
        dataSize: graphqlSize,
        success: !data.errors,
      };
    });
    
    const graphqlMetric = await page.evaluate(() => (window as any).graphqlMetric);
    metrics.push({
      endpoint: 'ProductDist',
      method: 'GraphQL',
      ...graphqlMetric,
    });
  });

  test('Benchmark: Inventory Analysis', async ({ page, request }) => {
    // REST API 測試
    const restStart = Date.now();
    const restResponse = await request.get(`${restBaseUrl}/widgets/inventory-ordered-analysis`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const restEnd = Date.now();
    
    expect(restResponse.ok()).toBeTruthy();
    const restData = await restResponse.json();
    const restSize = JSON.stringify(restData).length;
    
    metrics.push({
      endpoint: 'InvAnalysis',
      method: 'REST',
      responseTime: restEnd - restStart,
      dataSize: restSize,
      success: true,
    });

    // GraphQL 測試 (複雜查詢)
    await page.goto('http://localhost:3000');
    await page.evaluate(async () => {
      const query = `
        query GetInventoryAnalysis {
          getInventoryAnalysis {
            warehouseDistribution {
              warehouse
              products {
                productCode
                quantity
              }
            }
            turnoverAnalysis {
              productCode
              turnoverRate
              daysInStock
            }
          }
        }
      `;
      
      const graphqlStart = Date.now();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const graphqlEnd = Date.now();
      
      const data = await response.json();
      const graphqlSize = JSON.stringify(data).length;
      
      (window as any).graphqlMetric = {
        responseTime: graphqlEnd - graphqlStart,
        dataSize: graphqlSize,
        success: !data.errors,
      };
    });
    
    const graphqlMetric = await page.evaluate(() => (window as any).graphqlMetric);
    metrics.push({
      endpoint: 'InvAnalysis',
      method: 'GraphQL',
      ...graphqlMetric,
    });
  });

  test('Benchmark: Concurrent Requests', async ({ page, request }) => {
    // REST API 並發測試
    const restStart = Date.now();
    const restPromises = [
      request.get(`${restBaseUrl}/widgets/stats-card`, {
        params: { dataSource: 'total_pallets' },
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      request.get(`${restBaseUrl}/widgets/stats-card`, {
        params: { dataSource: 'today_transfers' },
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      request.get(`${restBaseUrl}/widgets/stats-card`, {
        params: { dataSource: 'active_products' },
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      request.get(`${restBaseUrl}/widgets/product-distribution`, {
        params: { limit: 5 },
        headers: { Authorization: `Bearer ${authToken}` },
      }),
    ];
    
    const restResponses = await Promise.all(restPromises);
    const restEnd = Date.now();
    
    restResponses.forEach(resp => expect(resp.ok()).toBeTruthy());
    const restDataSize = (await Promise.all(restResponses.map(r => r.text()))).join('').length;
    
    metrics.push({
      endpoint: 'Concurrent',
      method: 'REST',
      responseTime: restEnd - restStart,
      dataSize: restDataSize,
      success: true,
    });

    // GraphQL 並發測試（單一請求，多個字段）
    await page.goto('http://localhost:3000');
    await page.evaluate(async () => {
      const query = `
        query GetMultipleData {
          getDashboardStats {
            totalPallets
            activeProducts
            lowStockAlerts
            recentTransfers
          }
          getInventoryAnalysis {
            productDistribution {
              productCode
              totalQuantity
            }
          }
        }
      `;
      
      const graphqlStart = Date.now();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const graphqlEnd = Date.now();
      
      const data = await response.json();
      const graphqlSize = JSON.stringify(data).length;
      
      (window as any).graphqlMetric = {
        responseTime: graphqlEnd - graphqlStart,
        dataSize: graphqlSize,
        success: !data.errors,
      };
    });
    
    const graphqlMetric = await page.evaluate(() => (window as any).graphqlMetric);
    metrics.push({
      endpoint: 'Concurrent',
      method: 'GraphQL',
      ...graphqlMetric,
    });
  });

  test('Benchmark: Load Test (100 requests)', async ({ request }) => {
    const iterations = 100;
    
    // REST API 負載測試
    const restStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      const response = await request.get(`${restBaseUrl}/widgets/stats-card`, {
        params: { dataSource: 'total_pallets' },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.ok()).toBeTruthy();
    }
    const restEnd = Date.now();
    
    const restAvgTime = (restEnd - restStart) / iterations;
    
    console.log(`\n負載測試結果 (${iterations} 個請求):`);
    console.log(`REST API 平均響應時間: ${restAvgTime.toFixed(2)}ms`);
    console.log(`REST API 總時間: ${restEnd - restStart}ms`);
    
    // 注意：GraphQL 負載測試需要實際的 GraphQL 端點運行
    // 這裡省略了 GraphQL 部分，因為需要確保 GraphQL 服務器正在運行
  });
});