import { test, expect } from '@playwright/test';

test.describe('NestJS REST API Validation', () => {
  const API_BASE_URL = 'http://localhost:3001/api/v1';

  test('API Health Check and Database Connection', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('newpennine-api');
    expect(data.database.supabase).toBe('connected');

    console.log('✅ Health Check Passed:', data);
  });

  test('Widget Stats API Performance and Data Validation', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/widgets/stats`);
    const responseTime = Date.now() - startTime;

    // Performance check: should respond within 500ms
    expect(responseTime).toBeLessThan(500);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalProducts');
    expect(data.data).toHaveProperty('products');
    expect(data.data).toHaveProperty('timestamp');
    expect(Array.isArray(data.data.products)).toBe(true);

    console.log(`✅ Widget Stats Performance: ${responseTime}ms`, {
      totalProducts: data.data.totalProducts,
      responseTime: `${responseTime}ms`,
    });
  });

  test('Error Handling and Response Format', async ({ request }) => {
    // Test non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/non-existent`);
    expect(response.status()).toBe(404);

    console.log('✅ Error Handling: 404 for non-existent endpoint');
  });

  test('API Stability - Multiple Requests', async ({ request }) => {
    const requests = [];
    const numRequests = 5;

    for (let i = 0; i < numRequests; i++) {
      requests.push(request.get(`${API_BASE_URL}/health`));
    }

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
    });

    console.log(`✅ Stability Test: ${numRequests} concurrent requests all successful`);
  });
});
