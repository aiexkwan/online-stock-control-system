import { test, expect } from '@playwright/test';
import { TEST_USER } from '../utils/test-data';

// v1.2.2 Widget API 測試 - 測試新實施的 4 個 widget endpoints
test.describe('NestJS REST API v1.2.2 Widget Endpoints', () => {
  let authToken: string;
  const baseUrl = 'http://localhost:3000/api/v1';

  test.beforeAll(async ({ request }) => {
    // 登入獲取 JWT token
    const loginResponse = await request.post(`${baseUrl}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;
  });

  test.describe('StatsCardWidget API', () => {
    test('should retrieve stats card data for different data sources', async ({ request }) => {
      const dataSources = [
        'total_pallets',
        'today_transfers',
        'active_products',
        'pending_orders',
        'await_percentage_stats',
        'await_location_count',
        'transfer_count',
        'production_stats',
        'update_stats',
      ];

      for (const dataSource of dataSources) {
        const response = await request.get(`${baseUrl}/widgets/stats-card`, {
          params: { dataSource },
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        
        expect(data).toHaveProperty('value');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('label');
        
        // 驗證數據類型
        expect(typeof data.value).toMatch(/number|string/);
        expect(data.label).toBeTruthy();
        
        console.log(`✅ StatsCard ${dataSource}: value=${data.value}, label=${data.label}`);
      }
    });

    test('should include trend data when requested', async ({ request }) => {
      const response = await request.get(`${baseUrl}/widgets/stats-card`, {
        params: { 
          dataSource: 'today_transfers',
          includeTrend: true,
        },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toHaveProperty('trend');
      expect(typeof data.trend).toBe('number');
    });
  });

  test.describe('ProductDistributionChartWidget API', () => {
    test('should retrieve product distribution data', async ({ request }) => {
      const response = await request.get(`${baseUrl}/widgets/product-distribution`, {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toHaveProperty('value');
      expect(data).toHaveProperty('timestamp');
      expect(Array.isArray(data.value)).toBeTruthy();
      
      if (data.value.length > 0) {
        const firstItem = data.value[0];
        expect(firstItem).toHaveProperty('name');
        expect(firstItem).toHaveProperty('value');
        expect(firstItem).toHaveProperty('percentage');
        
        // 驗證百分比計算
        const total = data.value.reduce((sum: number, item: Record<string, unknown>) => sum + item.value, 0);
        const calculatedPercentage = (firstItem.value / total) * 100;
        expect(Math.abs(firstItem.percentage - calculatedPercentage)).toBeLessThan(0.1);
      }
      
      console.log(`✅ ProductDistribution: ${data.value.length} products returned`);
    });

    test('should respect limit parameter', async ({ request }) => {
      const limit = 5;
      const response = await request.get(`${baseUrl}/widgets/product-distribution`, {
        params: { limit },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.value.length).toBeLessThanOrEqual(limit);
    });
  });

  test.describe('InventoryOrderedAnalysisWidget API', () => {
    test('should retrieve inventory vs order analysis', async ({ request }) => {
      const response = await request.get(`${baseUrl}/widgets/inventory-ordered-analysis`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toHaveProperty('products');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('timestamp');
      
      // 驗證 summary 結構
      const summary = data.summary;
      expect(summary).toHaveProperty('totalStock');
      expect(summary).toHaveProperty('totalDemand');
      expect(summary).toHaveProperty('totalRemaining');
      expect(summary).toHaveProperty('overallSufficient');
      expect(summary).toHaveProperty('insufficientCount');
      expect(summary).toHaveProperty('sufficientCount');
      
      // 驗證計算邏輯
      expect(summary.totalRemaining).toBe(summary.totalStock - summary.totalDemand);
      expect(summary.overallSufficient).toBe(summary.totalStock >= summary.totalDemand);
      
      console.log(`✅ InventoryOrderedAnalysis: ${data.products.length} products analyzed`);
    });

    test('should filter by product codes', async ({ request }) => {
      const productCodes = ['PROD001', 'PROD002'];
      const response = await request.get(`${baseUrl}/widgets/inventory-ordered-analysis`, {
        params: { productCodes: productCodes.join(',') },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // 所有返回的產品應該在指定的產品代碼中
      data.products.forEach((product: any) => {
        expect(productCodes).toContain(product.productCode);
      });
    });
  });

  test.describe('TransactionReportWidget API', () => {
    test('should retrieve transaction report for date range', async ({ request }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7天前
      
      const response = await request.get(`${baseUrl}/widgets/transaction-report`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toHaveProperty('transactions');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('metadata');
      expect(Array.isArray(data.transactions)).toBeTruthy();
      
      // 驗證 summary 數據
      const summary = data.summary;
      expect(summary.totalTransactions).toBe(data.transactions.length);
      
      // 驗證交易數據結構
      if (data.transactions.length > 0) {
        const firstTransaction = data.transactions[0];
        expect(firstTransaction).toHaveProperty('timestamp');
        expect(firstTransaction).toHaveProperty('transactionType');
        expect(firstTransaction).toHaveProperty('palletId');
        expect(firstTransaction).toHaveProperty('productCode');
        expect(firstTransaction).toHaveProperty('quantity');
      }
      
      console.log(`✅ TransactionReport: ${data.transactions.length} transactions found`);
    });

    test('should filter by warehouse', async ({ request }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      
      const warehouse = 'injection';
      const response = await request.get(`${baseUrl}/widgets/transaction-report`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          warehouse,
        },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // 驗證所有交易都涉及指定倉庫
      data.transactions.forEach((transaction: any) => {
        const involvesWarehouse = 
          transaction.fromLocation === warehouse || 
          transaction.toLocation === warehouse;
        expect(involvesWarehouse).toBeTruthy();
      });
    });
  });

  test.describe('API Error Handling', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const endpoints = [
        '/widgets/stats-card',
        '/widgets/product-distribution',
        '/widgets/inventory-ordered-analysis',
        '/widgets/transaction-report',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${baseUrl}${endpoint}`, {
          params: endpoint.includes('transaction-report') 
            ? { startDate: '2025-01-01', endDate: '2025-01-15' }
            : { dataSource: 'total_pallets' },
        });
        
        expect(response.status()).toBe(401);
      }
    });

    test('should return 400 for invalid parameters', async ({ request }) => {
      // Invalid data source for stats card
      let response = await request.get(`${baseUrl}/widgets/stats-card`, {
        params: { dataSource: 'invalid_source' },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(400);

      // Invalid limit for product distribution
      response = await request.get(`${baseUrl}/widgets/product-distribution`, {
        params: { limit: 'invalid' },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(400);

      // Missing dates for transaction report
      response = await request.get(`${baseUrl}/widgets/transaction-report`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(400);
    });
  });
});