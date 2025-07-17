import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Stock Distribution Widget (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/widgets/stock-distribution (GET)', () => {
    it('should return stock distribution data', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept limit and offset parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution?limit=10&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body.offset).toBe(0);
      expect(response.body.limit).toBe(10);
    });

    it('should return proper data structure for stock distribution items', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution?limit=5')
        .expect(200);

      if (response.body.data.length > 0) {
        const item = response.body.data[0];
        expect(item).toHaveProperty('product_code');
        expect(item).toHaveProperty('injection');
        expect(item).toHaveProperty('pipeline');
        expect(item).toHaveProperty('prebook');
        expect(item).toHaveProperty('await');
        expect(item).toHaveProperty('fold');
        expect(item).toHaveProperty('bulk');
        expect(item).toHaveProperty('await_grn');
        expect(item).toHaveProperty('backcarpark');
        expect(item).toHaveProperty('data_code');

        if (item.data_code) {
          expect(item.data_code).toHaveProperty('description');
          expect(item.data_code).toHaveProperty('colour');
          expect(item.data_code).toHaveProperty('type');
        }
      }
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution?limit=invalid')
        .expect(400);
    });

    it('should handle invalid offset parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution?offset=invalid')
        .expect(400);
    });

    it('should return metadata with execution time', async () => {
      const response = await request(app.getHttpServer())
        .get('/widgets/stock-distribution')
        .expect(200);

      expect(response.body).toHaveProperty('metadata');
      if (response.body.metadata) {
        expect(response.body.metadata).toHaveProperty('executed_at');
        expect(response.body.metadata).toHaveProperty('calculation_time');
      }
    });
  });
});
