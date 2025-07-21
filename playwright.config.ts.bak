import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 測試配置
 *
 * 測試策略：
 * 1. 多瀏覽器支援 (Chromium, Firefox, WebKit)
 * 2. 移動設備測試
 * 3. 並行執行優化
 * 4. 詳細報告生成
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  // 測試超時設置
  timeout: 120 * 1000,
  expect: {
    timeout: 15000,
  },

  // 全局設置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 報告器配置
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list'],
  ],

  // 全局測試配置
  use: {
    // 基礎 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 追蹤和截圖設置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 瀏覽器選項
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 用戶操作設置
    actionTimeout: 45 * 1000,
    navigationTimeout: 90 * 1000,
  },

  // 測試項目配置
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開發服務器配置
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },

  // 輸出目錄
  outputDir: 'test-results/',
});
