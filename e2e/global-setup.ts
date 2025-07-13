import { config } from 'dotenv';
import { resolve } from 'path';

async function globalSetup() {
  // Load .env.local file
  config({ path: resolve(process.cwd(), '.env.local') });
  
  console.log('🔧 Loading environment variables from .env.local');
  
  // Check if credentials are available
  if (process.env.SYS_LOGIN && process.env.SYS_PASSWORD) {
    console.log('✅ Found SYS_LOGIN and SYS_PASSWORD');
  } else if (process.env.PUPPETEER_LOGIN && process.env.PUPPETEER_PASSWORD) {
    console.log('✅ Found PUPPETEER_LOGIN and PUPPETEER_PASSWORD');
  } else if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
    console.log('✅ Found E2E_USER_EMAIL and E2E_USER_PASSWORD');
  } else {
    console.log('⚠️  No test credentials found. Login tests will be skipped.');
    console.log('   Set SYS_LOGIN/SYS_PASSWORD in .env.local');
  }
}

export default globalSetup;