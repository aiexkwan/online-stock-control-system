const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // 預設設置
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 文件擴展名
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 測試文件匹配規則 - 專門針對 e2e 測試
  testRegex: '.*\\.e2e-spec\\.ts$',
  rootDir: '.',

  // 轉換設置
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

  // 模組名稱映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@widgets/(.*)$': '<rootDir>/src/widgets/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },

  // 覆蓋率設置
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/*.interface.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: './coverage-e2e',
  coverageReporters: ['text', 'lcov', 'html'],

  // 設置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 清除模擬設置
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 靜默輸出設置
  silent: false,
  verbose: true,

  // 性能設置 - e2e 測試通常需要更多時間
  maxWorkers: 1,

  // 錯誤處理
  errorOnDeprecated: true,

  // 模組搜索路徑
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // 忽略模式
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // 監視模式忽略
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/coverage-e2e/',
  ],

  // 超時設置 - e2e 測試需要更長時間
  testTimeout: 60000,
};
