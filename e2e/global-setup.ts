import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global setup started');
  
  // Set default timeout
  process.env.PLAYWRIGHT_TEST_TIMEOUT = process.env.PLAYWRIGHT_TEST_TIMEOUT || '60000';
  
  // Ensure base URL is set
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    process.env.PLAYWRIGHT_BASE_URL = 'http://localhost:3000';
  }
  
  console.log(`Base URL: ${process.env.PLAYWRIGHT_BASE_URL}`);
  console.log('Global setup completed');
}

export default globalSetup;