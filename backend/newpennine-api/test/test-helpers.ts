import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export class TestHelpers {
  static async getValidJwtToken(): Promise<string> {
    const configService = new ConfigService();

    // Use environment variables from .env files
    const secret = configService.get<string>('JWT_SECRET');
    const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h';

    if (!secret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }

    // Create a test payload similar to what auth service creates
    const payload = {
      sub: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
      email: configService.get<string>('SYS_LOGIN') || 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  static async loginAndGetRealToken(app: INestApplication): Promise<string> {
    const configService = new ConfigService();
    const email = configService.get<string>('SYS_LOGIN');
    const password = configService.get<string>('SYS_PASSWORD');

    if (!email || !password) {
      throw new Error(
        'SYS_LOGIN or SYS_PASSWORD not found in environment variables',
      );
    }

    try {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      return response.body.access_token;
    } catch (error) {
      console.warn('Real login failed, using fallback token');
      return this.getValidJwtToken();
    }
  }

  static async loginAndGetToken(app?: INestApplication): Promise<string> {
    if (app) {
      return this.loginAndGetRealToken(app);
    }
    return this.getValidJwtToken();
  }
}
