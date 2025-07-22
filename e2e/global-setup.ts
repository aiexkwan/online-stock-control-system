import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * 統一憑證管理
 * 獲取測試憑證，按優先級順序
 */
export function getTestCredentials() {
  const credentials = {
    email: process.env.SYS_LOGIN || process.env.E2E_USER_EMAIL || process.env.PUPPETEER_LOGIN,
    password:
      process.env.SYS_PASSWORD || process.env.E2E_USER_PASSWORD || process.env.PUPPETEER_PASSWORD,
  };

  return credentials;
}

/**
 * 驗證憑證是否可用
 */
export function validateCredentials(credentials: { email?: string; password?: string }) {
  if (!credentials.email || !credentials.password) {
    throw new Error('Missing test credentials. Please set SYS_LOGIN/SYS_PASSWORD in .env.local');
  }

  // 驗證 email 格式
  if (!credentials.email.includes('@')) {
    throw new Error('Invalid email format in test credentials');
  }

  return true;
}

async function globalSetup() {
  // Load .env.local file
  config({ path: resolve(process.cwd(), '.env.local') });

  console.log('🔧 Loading environment variables from .env.local');

  try {
    const credentials = getTestCredentials();
    validateCredentials(credentials);

    console.log('✅ Test credentials validated successfully');
    console.log(`📧 Using email: ${credentials.email}`);

    // 將統一憑證存儲到環境變量中
    process.env.UNIFIED_TEST_EMAIL = credentials.email;
    process.env.UNIFIED_TEST_PASSWORD = credentials.password;
  } catch (error) {
    console.log('⚠️  Credential validation failed:', (error as Error).message);
    console.log('   Available credential options:');
    console.log('   - SYS_LOGIN/SYS_PASSWORD (preferred)');
    console.log('   - E2E_USER_EMAIL/E2E_USER_PASSWORD');
    console.log('   - PUPPETEER_LOGIN/PUPPETEER_PASSWORD');
    console.log('   Tests requiring authentication will be skipped.');
  }
}

export default globalSetup;
