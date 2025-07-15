// Jest 設置文件
// 此文件會在每個測試文件執行前載入

// 支援 TypeScript 路徑映射
require('tsconfig-paths/register');

// 支援 ES 模組
require('source-map-support').install();

// 環境變量設置
process.env.NODE_ENV = 'test';

// 全域測試設置
global.console = {
  ...console,
  // 在測試中過濾不必要的 console 輸出
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 設置測試超時
jest.setTimeout(30000);

// 模擬環境變量
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// 全域測試工具
global.TestUtils = {
  // 延遲執行
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 模擬 Supabase 響應
  mockSupabaseResponse: (data, error = null) => ({
    data,
    error,
    count: data ? data.length : 0,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }),
  
  // 創建模擬的 JWT Token
  createMockJwtToken: (payload = {}) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const defaultPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    };
    
    // 簡單的 base64 編碼（僅用於測試）
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');
    return `${encode(header)}.${encode(defaultPayload)}.mock-signature`;
  },
  
  // 模擬 HTTP 請求
  mockRequest: (options = {}) => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    headers: {},
    query: {},
    params: {},
    body: {},
    ...options,
  }),
  
  // 模擬 HTTP 響應
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    return res;
  },
};

// 清理函數
afterEach(() => {
  jest.clearAllMocks();
});

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 確保所有 Promise 都被正確處理
beforeEach(() => {
  // 重置環境變量
  process.env.NODE_ENV = 'test';
});

// 測試完成後清理
afterAll(async () => {
  // 清理任何持久化資源
  await new Promise(resolve => setTimeout(resolve, 100));
});