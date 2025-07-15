import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * 快速驗證測試
 * 
 * 用於快速檢查系統基本功能是否正常
 * 適用於開發過程中的快速檢查
 */
describe('Quick Validation Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.init();
    console.log('🚀 快速驗證測試環境已啟動');
  });

  afterAll(async () => {
    await app.close();
    console.log('✅ 快速驗證測試環境已關閉');
  });

  describe('系統基本功能檢查', () => {
    it('健康檢查端點應該正常', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      console.log('✅ 健康檢查正常');
    });

    it('詳細健康檢查應該正常', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('ok');
      console.log('✅ 詳細健康檢查正常');
    });

    it('未認證的 Widget 端點應該返回 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/stats')
        .expect(401);

      console.log('✅ 認證保護正常工作');
    });

    it('不存在的端點應該返回 404', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      console.log('✅ 404 錯誤處理正常');
    });

    it('CORS 預檢請求應該正常', async () => {
      await request(app.getHttpServer())
        .options('/api/v1/health')
        .expect(204);

      console.log('✅ CORS 配置正常');
    });
  });

  describe('環境變量檢查', () => {
    it('應該有必要的環境變量', () => {
      const requiredEnvVars = [
        'PORT',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      for (const envVar of requiredEnvVars) {
        expect(process.env[envVar]).toBeDefined();
        console.log(`✅ ${envVar} 已設置`);
      }
    });

    it('JWT 相關環境變量應該存在', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      console.log('✅ JWT_SECRET 已設置');
      
      if (process.env.JWT_EXPIRES_IN) {
        console.log(`✅ JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN}`);
      }
    });
  });

  describe('API 路由結構檢查', () => {
    const expectedEndpoints = [
      { path: '/api/v1/health', method: 'GET', auth: false },
      { path: '/api/v1/health/detailed', method: 'GET', auth: false },
      { path: '/api/v1/auth/login', method: 'POST', auth: false },
      { path: '/api/v1/widgets/stats-card', method: 'GET', auth: true },
      { path: '/api/v1/widgets/inventory-analysis', method: 'GET', auth: true },
      { path: '/api/v1/pallets', method: 'GET', auth: true },
      { path: '/api/v1/inventory', method: 'GET', auth: true },
    ];

    expectedEndpoints.forEach(({ path, method, auth }) => {
      it(`${method} ${path} 應該${auth ? '需要' : '不需要'}認證`, async () => {
        const req = request(app.getHttpServer());
        
        if (method === 'GET') {
          const response = await req.get(path);
          if (auth) {
            expect([401, 403]).toContain(response.status);
          } else {
            expect([200, 400]).toContain(response.status);
          }
        } else if (method === 'POST') {
          const response = await req.post(path);
          expect([200, 400, 401]).toContain(response.status);
        }
        
        console.log(`✅ ${method} ${path} 路由正常`);
      });
    });
  });
});