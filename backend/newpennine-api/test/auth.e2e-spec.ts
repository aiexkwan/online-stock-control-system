import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication System (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should check health endpoint without auth', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('newpennine-api');
        });
    });

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.access_token).toBeDefined();
          authToken = res.body.access_token;
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          authToken = res.body.access_token;
        });
    });

    it('should fail login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should fail to access protected route without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail to access protected route with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Protected API Endpoints', () => {
    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = loginResponse.body.access_token;
    });

    it('should access pallets endpoint with auth', () => {
      return request(app.getHttpServer())
        .get('/pallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should access inventory endpoint with auth', () => {
      return request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should access transfers endpoint with auth', () => {
      return request(app.getHttpServer())
        .get('/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should access history endpoint with auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should access RPC endpoint with auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/rpc/await-location-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should fail to access protected endpoints without auth', () => {
      return request(app.getHttpServer()).get('/pallets').expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    it('should refresh token successfully', async () => {
      // First login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const refreshToken = loginResponse.body.refresh_token;

      // Then refresh
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
        });
    });

    it('should verify token successfully', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.valid).toBe(true);
          expect(res.body.user).toBeDefined();
        });
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });
  });
});
