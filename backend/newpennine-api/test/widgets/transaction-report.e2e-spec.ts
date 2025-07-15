import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../test-helpers';

describe('Transaction Report Widget Endpoint (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get valid JWT token for testing using real login
    authToken = await TestHelpers.loginAndGetToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/widgets/transaction-report (GET)', () => {
    it('should return transaction report data for valid date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('timestamp');

      expect(Array.isArray(response.body.transactions)).toBe(true);

      // Check summary structure
      const summary = response.body.summary;
      expect(summary).toHaveProperty('totalTransactions');
      expect(summary).toHaveProperty('totalQuantity');
      expect(summary).toHaveProperty('uniqueProducts');
      expect(summary).toHaveProperty('uniqueUsers');
      expect(summary).toHaveProperty('transactionsByType');
      expect(typeof summary.transactionsByType).toBe('object');

      // Check metadata
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('executed_at');
      expect(metadata).toHaveProperty('calculation_time');
      expect(metadata).toHaveProperty('startDate');
      expect(metadata).toHaveProperty('endDate');
    });

    it('should handle warehouse filter', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          warehouse: 'injection',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metadata.warehouse).toBe('injection');

      // All transactions should involve the specified warehouse
      response.body.transactions.forEach((transaction: any) => {
        const involvesWarehouse =
          transaction.fromLocation === 'injection' ||
          transaction.toLocation === 'injection';
        expect(involvesWarehouse).toBe(true);
      });
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: 'invalid-date',
          endDate: '2025-01-15',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 400 when dates are missing', async () => {
      await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-15',
        })
        .expect(401);
    });

    it('should validate transaction data structure', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.transactions.length > 0) {
        const firstTransaction = response.body.transactions[0];
        expect(firstTransaction).toHaveProperty('timestamp');
        expect(firstTransaction).toHaveProperty('transactionType');
        expect(firstTransaction).toHaveProperty('palletId');
        expect(firstTransaction).toHaveProperty('productCode');
        expect(firstTransaction).toHaveProperty('productName');
        expect(firstTransaction).toHaveProperty('quantity');
        expect(typeof firstTransaction.quantity).toBe('number');
      }
    });

    it('should return transactions sorted by timestamp descending', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get('/widgets/transaction-report')
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const transactions = response.body.transactions;
      if (transactions.length > 1) {
        for (let i = 1; i < transactions.length; i++) {
          const prevTimestamp = new Date(
            transactions[i - 1].timestamp,
          ).getTime();
          const currTimestamp = new Date(transactions[i].timestamp).getTime();
          expect(prevTimestamp).toBeGreaterThanOrEqual(currTimestamp);
        }
      }
    });
  });
});
