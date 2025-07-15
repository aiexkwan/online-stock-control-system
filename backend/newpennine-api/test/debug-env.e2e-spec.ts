import './setup';
import { TestHelpers } from './test-helpers';

describe('Environment Debug', () => {
  it('should have JWT_SECRET', () => {
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'MISSING');
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should generate JWT token', async () => {
    const token = await TestHelpers.getValidJwtToken();
    console.log('Generated token:', token.substring(0, 50) + '...');
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
  });
});
