import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './test-helpers';

describe('Products API (e2e)', () => {
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

  describe('/products/types (GET)', () => {
    it('should return product types', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('types');
      expect(response.body).toHaveProperty('totalTypes');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('dataSource');
      expect(response.body.dataSource).toBe('data_code');
      expect(Array.isArray(response.body.types)).toBe(true);
      expect(typeof response.body.totalTypes).toBe('number');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/types')
        .expect(401);
    });
  });

  describe('/inventory/stock-levels (GET)', () => {
    it('should return stock levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/inventory/stock-levels')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stockLevels');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('dataSource');
      expect(response.body.dataSource).toBe('record_inventory');
      expect(Array.isArray(response.body.stockLevels)).toBe(true);
      expect(typeof response.body.totalItems).toBe('number');
    });

    it('should handle productType filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/inventory/stock-levels')
        .query({ productType: 'EasyLiner' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stockLevels');
      expect(Array.isArray(response.body.stockLevels)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/inventory/stock-levels')
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stockLevels');
      expect(response.body.stockLevels.length).toBeLessThanOrEqual(10);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/inventory/stock-levels')
        .expect(401);
    });
  });
});
