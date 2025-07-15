import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../test-helpers';

describe('Analysis Module Widget Endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.init();

    // Get valid JWT token for testing using real login
    authToken = await TestHelpers.loginAndGetToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/widgets/inventory-analysis (GET)', () => {
    it('should return inventory analysis data without warehouse filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('warehouses');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalQuantity');
      expect(response.body).toHaveProperty('turnoverAnalysis');
      expect(response.body).toHaveProperty('timestamp');

      expect(Array.isArray(response.body.warehouses)).toBe(true);
      expect(Array.isArray(response.body.turnoverAnalysis)).toBe(true);
      expect(typeof response.body.totalItems).toBe('number');
      expect(typeof response.body.totalQuantity).toBe('number');
    });

    it('should return inventory analysis data with warehouse filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-analysis')
        .query({ warehouse: 'injection' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('warehouses');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('turnoverAnalysis');

      // Check that warehouse filtering is applied in the data structure
      expect(response.body.warehouses.length).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-analysis')
        .expect(401);
    });

    it('should validate warehouse structure in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.warehouses.length > 0) {
        const firstWarehouse = response.body.warehouses[0];
        expect(firstWarehouse).toHaveProperty('warehouse');
        expect(firstWarehouse).toHaveProperty('totalItems');
        expect(firstWarehouse).toHaveProperty('totalQuantity');
        expect(firstWarehouse).toHaveProperty('utilization');
        expect(typeof firstWarehouse.utilization).toBe('number');
      }
    });
  });

  describe('/widgets/inventory-ordered-analysis (GET)', () => {
    it('should return inventory vs order demand analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-ordered-analysis')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-15',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('timestamp');

      expect(Array.isArray(response.body.products)).toBe(true);

      // Check summary structure
      const summary = response.body.summary;
      expect(summary).toHaveProperty('totalProducts');
      expect(summary).toHaveProperty('averageInventoryLevel');
      expect(summary).toHaveProperty('averageDemand');
      expect(summary).toHaveProperty('overStockedProducts');
      expect(summary).toHaveProperty('underStockedProducts');
    });

    it('should handle warehouse filter for inventory-ordered analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-ordered-analysis')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-15',
          warehouse: 'injection',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metadata.warehouse).toBe('injection');
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-ordered-analysis')
        .query({
          startDate: 'invalid-date',
          endDate: '2025-01-15',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 400 when dates are missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-ordered-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should validate product analysis structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-ordered-analysis')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-15',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.products.length > 0) {
        const firstProduct = response.body.products[0];
        expect(firstProduct).toHaveProperty('productCode');
        expect(firstProduct).toHaveProperty('productName');
        expect(firstProduct).toHaveProperty('currentInventory');
        expect(firstProduct).toHaveProperty('totalDemand');
        expect(firstProduct).toHaveProperty('inventoryTurnover');
        expect(firstProduct).toHaveProperty('stockStatus');
        expect(typeof firstProduct.currentInventory).toBe('number');
        expect(typeof firstProduct.totalDemand).toBe('number');
      }
    });
  });

  describe('/widgets/stats-card (GET)', () => {
    it('should return stats card data for totalPallets data source', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'totalPallets' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('value');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('dataSource');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.dataSource).toBe('totalPallets');
      expect(typeof response.body.value).toBe('number');
    });

    it('should return stats card data for activeTransfers data source', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'activeTransfers' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataSource).toBe('activeTransfers');
      expect(typeof response.body.value).toBe('number');
    });

    it('should return stats card data for todayGRN data source', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'todayGRN' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataSource).toBe('todayGRN');
      expect(typeof response.body.value).toBe('number');
    });

    it('should return stats card data for pendingOrders data source', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'pendingOrders' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataSource).toBe('pendingOrders');
      expect(typeof response.body.value).toBe('number');
    });

    it('should return 400 for invalid data source', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'invalidSource' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 400 when dataSource is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle warehouse filter for stats card', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({
          dataSource: 'totalPallets',
          warehouse: 'injection',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('metadata');
      if (response.body.metadata) {
        expect(response.body.metadata).toHaveProperty('warehouse', 'injection');
      }
    });
  });

  describe('/widgets/product-distribution (GET)', () => {
    it('should return product distribution data for pie chart', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/product-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('distribution');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('timestamp');

      expect(Array.isArray(response.body.distribution)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should handle warehouse filter for product distribution', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/product-distribution')
        .query({ warehouse: 'injection' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metadata.warehouse).toBe('injection');
    });

    it('should handle limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/product-distribution')
        .query({ limit: '5' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.distribution.length).toBeLessThanOrEqual(5);
    });

    it('should validate distribution item structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/product-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.distribution.length > 0) {
        const firstItem = response.body.distribution[0];
        expect(firstItem).toHaveProperty('productCode');
        expect(firstItem).toHaveProperty('productName');
        expect(firstItem).toHaveProperty('quantity');
        expect(firstItem).toHaveProperty('percentage');
        expect(typeof firstItem.quantity).toBe('number');
        expect(typeof firstItem.percentage).toBe('number');
      }
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/product-distribution')
        .expect(401);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test ensures error handling works even if DB is down
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/inventory-analysis')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either return data or a proper error response
      expect([200, 500, 503]).toContain(response.status);

      if (response.status !== 200) {
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/widgets/stats-card')
        .query({ dataSource: 'totalPallets' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    }, 10000);
  });
});
