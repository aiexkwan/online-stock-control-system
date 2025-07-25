import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001/api/v1';

test.describe('Pallets API Tests', () => {
  test('GET /pallets - should return pallets list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pallets`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('offset');
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.limit).toBe(50); // Default limit
    expect(body.offset).toBe(0); // Default offset

    console.log(`✅ GET /pallets returned ${body.data.length} pallets, total: ${body.total}`);
  });

  test('GET /pallets with query params', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pallets?limit=10&offset=0`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.limit).toBe(10);
    expect(body.data.length).toBeLessThanOrEqual(10);

    console.log('✅ GET /pallets with pagination works correctly');
  });

  test('GET /pallets/:id - should return pallet details', async ({ request }) => {
    // First get a list to find a valid pallet ID
    const listResponse = await request.get(`${BASE_URL}/pallets?limit=1`);
    const listBody = await listResponse.json();

    if (listBody.data.length > 0) {
      const palletId = listBody.data[0].plt_num;
      console.log(`Testing with pallet ID: ${palletId}`);

      const response = await request.get(`${BASE_URL}/pallets/${palletId}`);
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('plt_num');
      expect(body).toHaveProperty('product_code');
      expect(body).toHaveProperty('generate_time');
      expect(body).toHaveProperty('series');
      expect(body).toHaveProperty('product_qty');
      expect(body.plt_num).toBe(palletId);

      console.log('✅ GET /pallets/:id returns correct pallet details');
    } else {
      console.log('⚠️ No pallets found in database to test GET /pallets/:id');
    }
  });

  test('GET /pallets/:id - should return 404 for non-existent pallet', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pallets/NON_EXISTENT_ID`);

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Pallet not found');

    console.log('✅ GET /pallets/:id returns 404 for non-existent pallet');
  });

  test('Check API response structure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pallets?limit=5`);
    const body = await response.json();

    if (body.data.length > 0) {
      const pallet = body.data[0];
      console.log('Sample pallet structure:', JSON.stringify(pallet, null, 2));

      // Verify the structure matches our DTO
      expect(pallet).toHaveProperty('plt_num');
      expect(pallet).toHaveProperty('product_code');
      expect(pallet).toHaveProperty('generate_time');
      expect(pallet).toHaveProperty('series');
      expect(pallet).toHaveProperty('product_qty');

      console.log('✅ Pallet structure matches expected DTO');
    }
  });
});
