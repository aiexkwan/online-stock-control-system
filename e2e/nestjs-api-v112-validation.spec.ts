import { test, expect } from '@playwright/test';

test.describe('NestJS v1.1.2 REST API Validation', () => {
  const API_BASE_URL = 'http://localhost:3001/api/v1';

  test('Basic Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('newpennine-api');
    expect(data.version).toBe('1.0.0');
    
    console.log('✅ Basic Health Check Passed');
  });

  test('Detailed Health Check with Connection Monitoring', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health/detailed`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.healthy).toBe(true);
    expect(data.healthScore).toBe(100);
    expect(data.tests).toHaveLength(3);
    
    // Verify all tests passed
    data.tests.forEach((test: any) => {
      expect(test.success).toBe(true);
    });
    
    console.log(`✅ Detailed Health Check: ${data.healthScore}% health, ${data.responseTime}ms response time`);
  });

  test('Widget Stats API - Basic and Inventory', async ({ request }) => {
    // Test basic stats
    const basicResponse = await request.get(`${API_BASE_URL}/widgets/stats`);
    expect(basicResponse.ok()).toBeTruthy();
    
    const basicData = await basicResponse.json();
    expect(basicData.success).toBe(true);
    expect(basicData.data).toHaveProperty('totalProducts');
    
    // Test inventory stats
    const inventoryResponse = await request.get(`${API_BASE_URL}/widgets/inventory`);
    expect(inventoryResponse.ok()).toBeTruthy();
    
    const inventoryData = await inventoryResponse.json();
    expect(inventoryData.success).toBe(true);
    expect(inventoryData.data).toHaveProperty('inventoryRecords');
    
    console.log('✅ Widget APIs working correctly');
  });

  test('Pallets CRUD Operations', async ({ request }) => {
    // Test pallets list
    const listResponse = await request.get(`${API_BASE_URL}/pallets?limit=5`);
    expect(listResponse.ok()).toBeTruthy();
    
    const listData = await listResponse.json();
    expect(listData.success).toBe(true);
    expect(Array.isArray(listData.data)).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);
    
    // Get first pallet ID and test individual pallet
    const firstPallet = listData.data[0];
    const pltNum = firstPallet.plt_num;
    
    const singleResponse = await request.get(`${API_BASE_URL}/pallets/${pltNum}`);
    expect(singleResponse.ok()).toBeTruthy();
    
    const singleData = await singleResponse.json();
    expect(singleData.success).toBe(true);
    expect(singleData.data.plt_num).toBe(pltNum);
    
    console.log(`✅ Pallets CRUD: Retrieved ${listData.data.length} pallets, individual lookup for ${pltNum} successful`);
  });

  test('Inventory Operations with Filtering', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/inventory?limit=10`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    
    // Verify inventory record structure
    const firstRecord = data.data[0];
    expect(firstRecord).toHaveProperty('product_code');
    expect(firstRecord).toHaveProperty('injection');
    expect(firstRecord).toHaveProperty('pipeline');
    expect(firstRecord).toHaveProperty('await');
    
    console.log(`✅ Inventory Operations: Retrieved ${data.data.length} records`);
  });

  test('Orders - ACO and GRN Operations', async ({ request }) => {
    // Test ACO orders
    const acoResponse = await request.get(`${API_BASE_URL}/orders/aco?limit=5`);
    expect(acoResponse.ok()).toBeTruthy();
    
    const acoData = await acoResponse.json();
    expect(acoData.success).toBe(true);
    
    // Test GRN records
    const grnResponse = await request.get(`${API_BASE_URL}/orders/grn?limit=5`);
    expect(grnResponse.ok()).toBeTruthy();
    
    const grnData = await grnResponse.json();
    expect(grnData.success).toBe(true);
    
    console.log('✅ Orders Operations: ACO and GRN endpoints working');
  });

  test('Transfer and History Operations', async ({ request }) => {
    // Test transfers
    const transferResponse = await request.get(`${API_BASE_URL}/transfers?limit=5`);
    expect(transferResponse.ok()).toBeTruthy();
    
    const transferData = await transferResponse.json();
    expect(transferData.success).toBe(true);
    
    // Test history
    const historyResponse = await request.get(`${API_BASE_URL}/history?limit=5`);
    expect(historyResponse.ok()).toBeTruthy();
    
    const historyData = await historyResponse.json();
    expect(historyData.success).toBe(true);
    
    console.log('✅ Transfer and History Operations working');
  });

  test('RPC Function - Await Location Count', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/rpc/await-location-count`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('await_count');
    expect(data.functionName).toBe('rpc_get_await_location_count');
    
    console.log(`✅ RPC Function: Await location count = ${data.data.await_count}`);
  });

  test('API Performance and Stability', async ({ request }) => {
    const requests = [];
    const numRequests = 5;
    
    // Test multiple concurrent requests
    for (let i = 0; i < numRequests; i++) {
      requests.push(request.get(`${API_BASE_URL}/health`));
    }
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
    });
    
    // Test response time
    const startTime = Date.now();
    const perfResponse = await request.get(`${API_BASE_URL}/health/detailed`);
    const responseTime = Date.now() - startTime;
    
    expect(perfResponse.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    
    console.log(`✅ Performance Test: ${numRequests} concurrent requests successful, response time: ${responseTime}ms`);
  });

  test('Error Handling and Edge Cases', async ({ request }) => {
    // Test non-existent endpoint
    const notFoundResponse = await request.get(`${API_BASE_URL}/non-existent`);
    expect(notFoundResponse.status()).toBe(404);
    
    // Test invalid pallet ID
    const invalidPalletResponse = await request.get(`${API_BASE_URL}/pallets/INVALID_ID`);
    expect(invalidPalletResponse.status()).toBe(404);
    
    console.log('✅ Error Handling: Proper 404 responses for invalid endpoints and resources');
  });
});