import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright A11y 測試配置
 * 
 * 專門針對無障礙性測試優化的配置
 * 基於四個專家的協作方案：
 * - 系統架構專家：模組化測試架構
 * - Backend工程師：API 無障礙性支援
 * - 優化專家：性能測試整合
 * - QA專家：WCAG 2.1 AA 合規性驗證
 */
export default defineConfig({
  testDir: './e2e/a11y',
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  // A11y 測試專用超時設置
  timeout: 60 * 1000, // 較短超時，專注於快速反饋
  expect: {
    timeout: 10000, // A11y 檢查通常較快
  },

  // 測試執行配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // A11y 測試通常穩定，減少重試次數
  workers: process.env.CI ? 2 : 4, // 專用於 A11y 測試的 worker 數

  // 三層測試策略報告器
  reporter: [
    ['html', { 
      open: 'never', 
      outputFolder: 'playwright-report/a11y',
      titleSuffix: ' - A11y Testing Report'
    }],
    ['json', { outputFile: 'test-results/a11y-results.json' }],
    ['junit', { outputFile: 'test-results/a11y-junit.xml' }],
    ['list'],
    // 自定義 A11y 報告器
    ['./e2e/a11y/utils/a11y-reporter.ts'],
  ],

  // 全局測試配置
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // A11y 測試特殊配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 無障礙性測試友好的瀏覽器配置
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 適合無障礙性測試的操作超時
    actionTimeout: 30 * 1000,
    navigationTimeout: 45 * 1000,

    // 額外的無障礙性測試配置
    extraHTTPHeaders: {
      'User-Agent': 'PlaywrightA11yTest/1.0 (Accessibility Testing)',
    },
  },

  // 測試項目配置 - 專注於主要瀏覽器和輔助技術
  projects: [
    // 桌面瀏覽器 - 主要測試平台
    {
      name: 'chromium-a11y',
      use: { 
        ...devices['Desktop Chrome'],
        // 模擬螢幕閱讀器環境
        extraHTTPHeaders: {
          'User-Agent': 'PlaywrightA11yTest/1.0 (Screen Reader Compatible)',
        },
      },
    },
    {
      name: 'firefox-a11y',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox 對無障礙性的原生支援
      },
    },
    {
      name: 'webkit-a11y',
      use: { 
        ...devices['Desktop Safari'],
        // Safari 對 VoiceOver 的支援
      },
    },

    // 行動裝置 - 無障礙性測試
    {
      name: 'mobile-chrome-a11y',
      use: { 
        ...devices['Pixel 5'],
        // 行動裝置無障礙性特殊配置
      },
    },
    {
      name: 'mobile-safari-a11y',
      use: { 
        ...devices['iPhone 12'],
        // iOS VoiceOver 支援
      },
    },

    // 高對比度和縮放測試
    {
      name: 'high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        colorScheme: 'dark',
        // 模擬高對比度模式
        extraHTTPHeaders: {
          'User-Agent': 'PlaywrightA11yTest/1.0 (High Contrast Mode)',
        },
      },
    },

    // 縮放測試項目
    {
      name: 'zoom-200',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 640, height: 360 }, // 模擬 200% 縮放
        deviceScaleFactor: 2,
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

  // A11y 測試專用輸出目錄
  outputDir: 'test-results/a11y/',

  // 測試匹配模式
  testMatch: [
    'e2e/a11y/**/*.spec.ts',
    'e2e/a11y/**/*.test.ts',
  ],

  // 忽略的測試檔案
  testIgnore: [
    'e2e/a11y/utils/**',
    'e2e/a11y/fixtures/**',
    'e2e/a11y/helpers/**',
  ],

  // 全域設定
  metadata: {
    purpose: 'WCAG 2.1 AA Compliance Testing',
    framework: 'Playwright + jest-axe',
    strategy: 'Three-tier testing approach',
    coverage: 'Four WCAG principles',
  },
});