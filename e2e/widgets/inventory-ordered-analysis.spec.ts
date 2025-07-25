import { test, expect } from '@playwright/test';

test.describe('Inventory Ordered Analysis Widget API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: 'akwan@pennineindustries.com',
        password: 'X315Y316',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.access_token;
    expect(authToken).toBeTruthy();
  });

  test('should fetch inventory ordered analysis data', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('products');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('timestamp');
    expect(Array.isArray(data.products)).toBe(true);

    // Verify summary structure
    expect(data.summary).toHaveProperty('totalStock');
    expect(data.summary).toHaveProperty('totalDemand');
    expect(data.summary).toHaveProperty('totalRemaining');
    expect(data.summary).toHaveProperty('overallSufficient');
    expect(data.summary).toHaveProperty('insufficientCount');
    expect(data.summary).toHaveProperty('sufficientCount');

    // Verify data types
    expect(typeof data.summary.totalStock).toBe('number');
    expect(typeof data.summary.totalDemand).toBe('number');
    expect(typeof data.summary.totalRemaining).toBe('number');
    expect(typeof data.summary.overallSufficient).toBe('boolean');
    expect(typeof data.summary.insufficientCount).toBe('number');
    expect(typeof data.summary.sufficientCount).toBe('number');
  });

  test('should filter by product type', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          productType: 'Injection Plastic',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBe(true);
  });

  test('should filter by product codes', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          'productCodes[]': 'PROD001,PROD002',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBe(true);
  });

  test('should include metadata with calculation time', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.metadata) {
      expect(data.metadata).toHaveProperty('executed_at');
      expect(data.metadata).toHaveProperty('calculation_time');
      expect(data.metadata.calculation_time).toMatch(/^\d+ms$/);
    }
  });

  test('should validate product structure when products exist', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.products.length > 0) {
      const product = data.products[0];
      expect(product).toHaveProperty('productCode');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('currentStock');
      expect(product).toHaveProperty('orderDemand');
      expect(product).toHaveProperty('remainingStock');
      expect(product).toHaveProperty('fulfillmentRate');
      expect(product).toHaveProperty('isSufficient');

      // Verify data types
      expect(typeof product.productCode).toBe('string');
      expect(typeof product.description).toBe('string');
      expect(typeof product.currentStock).toBe('number');
      expect(typeof product.orderDemand).toBe('number');
      expect(typeof product.remainingStock).toBe('number');
      expect(typeof product.fulfillmentRate).toBe('number');
      expect(typeof product.isSufficient).toBe('boolean');
    }
  });

  test('should return 401 without authentication', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/v1/widgets/inventory-ordered-analysis'
    );
    expect(response.status()).toBe(401);
  });
});
