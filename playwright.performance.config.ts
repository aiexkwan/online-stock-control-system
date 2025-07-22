import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 性能測試配置
 * 專門用於 Widget 優化性能測試
 */
export default defineConfig({
  testDir: './tests/performance',
  testMatch: ['**/*.perf.ts', '**/*.performance.ts'],

  // 性能測試需要更長的超時時間
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },

  // 性能測試配置
  fullyParallel: false, // 性能測試需要串行執行避免相互影響
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // 單線程執行確保性能測試準確性

  // 性能測試專用報告器
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/performance-report' }],
    ['json', { outputFile: 'test-results/performance-results.json' }],
    ['list'],
  ],

  // 性能測試專用配置
  use: {
    // 基礎 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 性能測試追蹤設置
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 瀏覽器選項 - 性能測試需要特定設置
    headless: true, // 性能測試必須 headless
    viewport: { width: 1920, height: 1080 }, // 固定視口大小
    ignoreHTTPSErrors: true,

    // 用戶操作設置
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
  },

  // 性能測試只在 Chrome 上運行以保持一致性
  projects: [
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // 啟用 Chrome 的性能 API
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--enable-precise-memory-info',
            '--enable-performance-manager-debug-mode',
            '--enable-logging',
            '--v=1',
          ],
        },
      },
    },
  ],

  // 開發服務器配置
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  // 輸出目錄
  outputDir: 'test-results/performance/',
});
