const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // 預設設置
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 文件擴展名
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 測試文件匹配規則
  testRegex: '.*\\.spec\\.ts$',
  rootDir: 'src',

  // 轉換設置 - 使用新的 ts-jest 配置格式
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'ES2023',
          module: 'commonjs',
          resolveJsonModule: true,
          moduleResolution: 'node',
          allowJs: true,
          isolatedModules: true,
        },
      },
    ],
  },

  // 模組名稱映射（支援路徑別名）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@auth/(.*)$': '<rootDir>/auth/$1',
    '^@widgets/(.*)$': '<rootDir>/widgets/$1',
    '^@dto/(.*)$': '<rootDir>/dto/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    // 移除 @supabase 別名，避免與 npm 包衝突
    // '^@supabase/(.*)$': '<rootDir>/supabase/$1',
  },

  // 覆蓋率設置
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // 移除 globals，已遷移到 transform 配置

  // 設置文件
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.js'],

  // 清除模擬設置
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 靜默輸出設置
  silent: false,
  verbose: true,

  // 性能設置
  maxWorkers: '50%',

  // 錯誤處理
  errorOnDeprecated: true,

  // 模組搜索路徑
  moduleDirectories: ['node_modules', '<rootDir>'],

  // 忽略模式
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // 監視模式忽略
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],

  // 超時設置
  testTimeout: 30000,
};
