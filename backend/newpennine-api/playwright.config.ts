import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 * 用於 v1.3.2 前端 widgets 和整合測試
 */
export default defineConfig({
  testDir: './test/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  use: {
    baseURL: 'http://localhost:3000', // Next.js 前端
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // 測試前設置
  globalSetup: './test/playwright/global-setup.ts',
  globalTeardown: './test/playwright/global-teardown.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移動端測試
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 本地開發服務器配置
  webServer: [
    {
      command: 'npm run start:dev',
      url: 'http://localhost:3001/api/v1/health',
      reuseExistingServer: !process.env.CI,
      cwd: '.',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../', // 前端目錄
    },
  ],

  // 環境變量
  expect: {
    timeout: 10000,
  },
  
  timeout: 30000,
});