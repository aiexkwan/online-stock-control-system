import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api/v1';

test.describe('NestJS Basic API Validation', () => {
  test('Basic Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version', '1.0.0');
  });

  test('Detailed Health Check with Database Status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health/detailed`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('database');
    expect(data.database).toHaveProperty('status');
    expect(data.database).toHaveProperty('latency');
  });

  test('Widget Stats API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/widgets/stats`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('totalPallets');
    expect(data).toHaveProperty('activeTransfers');
    expect(data).toHaveProperty('todayGRN');
    expect(data).toHaveProperty('pendingOrders');
    expect(data).toHaveProperty('timestamp');
  });

  test('Widget Inventory API with Query Parameters', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/widgets/inventory?limit=10&offset=0`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit', 10);
    expect(data).toHaveProperty('offset', 0);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('API Response Time Performance', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/health`);
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(200); // Should respond within 200ms
  });

  test('CORS Headers are Present', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    // Check for CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });
});
