const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // 並行測試優化
  maxWorkers: process.env.CI ? 2 : '50%',
  maxConcurrency: 5,

  // 測試運行優化
  bail: false,
  verbose: false,
  silent: false,

  // 性能優化配置
  testTimeout: 10000, // 10秒超時
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 緩存配置
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 性能監控
  detectOpenHandles: process.env.CI ? false : true,
  forceExit: process.env.CI ? true : false,
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/__tests__/mocks/',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|exceljs|uuid|isows|@supabase/realtime-js|@supabase/ssr|@supabase/supabase-js))',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
  ],
  coverageThreshold: {
    global: {
      branches: 15, // 漸進式提升，目標 80%
      functions: 15, // 漸進式提升，目標 80%
      lines: 15, // 漸進式提升，目標 80%
      statements: 15, // 漸進式提升，目標 80%
    },
    // 針對核心功能設定更高標準
    './app/actions/**/*.ts': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './lib/**/*.ts': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 測試分組配置
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/**/*.test.(js|ts|tsx)'],
      testPathIgnorePatterns: ['<rootDir>/__tests__/integration/'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.(js|ts|tsx)'],
      // Integration tests run serially
      maxWorkers: 1,
    },
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
