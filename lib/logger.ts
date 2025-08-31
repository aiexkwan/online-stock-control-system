// Pino 庫的動態導入 (避免 esModuleInterop 問題)
const pino = require('pino') as typeof import('pino');

import { DatabaseRecord } from '../types/database/tables';
import { ApiResponse, ApiRequest, QueryParams } from './validation/zod-schemas';
import { isProduction, isNotProduction } from './utils/env';

// Pino 類型定義
type PinoLogger = ReturnType<typeof pino>;
type PinoLoggerOptions = Parameters<typeof pino>[0];

// Pino 實例創建函數
const createPinoInstance = (options: PinoLoggerOptions): PinoLogger => {
  return pino(options);
};

// 基礎 logger 配置
const baseOptions: PinoLoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction() ? 'info' : 'debug'),
  formatters: {
    bindings: () => ({
      env: process.env.NODE_ENV,
      app: 'warehouse-system',
      hostname: process.env.HOSTNAME || 'localhost',
    }),
    level: label => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
};

// 建立主 logger - 在 Next.js 環境中避免使用 transport
let logger: PinoLogger;

if (isNotProduction() && typeof window === 'undefined') {
  // 只在 server-side 開發環境使用 pretty print
  try {
    // 使用靜態導入避免 webpack originalFactory.call 錯誤
    // const pretty = require('pino-pretty');
    // 由於 pino-pretty 是開發依賴，在生產環境可能不可用
    // 暫時使用基本 logger 避免動態 require 問題
    logger = createPinoInstance(baseOptions);
    console.log('[Logger] Using basic logger to avoid dynamic require issues');
  } catch (_error) {
    // 如果 pino-pretty 有問題，使用基本 logger
    logger = createPinoInstance(baseOptions);
  }
} else {
  // Production 或 client-side 使用基本 logger
  logger = createPinoInstance(baseOptions);
}

export { logger };

// 為不同模組建立 child logger
export const createLogger = (module: string): PinoLogger => {
  return logger.child({ module });
};

// 預設模組 logger
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
export const inventoryLogger = createLogger('inventory');
export const orderLogger = createLogger('order');
export const reportLogger = createLogger('report');
export const systemLogger = createLogger('system');

// 新增專用 logger (Re-Structure-8)
// Middleware logger 使用更高嘅 log level 減少噪音
const middlewareLoggerBase = createLogger('middleware');
export const middlewareLogger = new Proxy(middlewareLoggerBase, {
  get(target, prop) {
    // 只允許 warn 同 error level 嘅 log
    if (prop === 'info' || prop === 'debug') {
      return () => {}; // 返回空函數，唔做任何嘢
    }
    return target[prop as keyof typeof target];
  },
});
export const cacheLogger = createLogger('cache');
export const featureFlagLogger = createLogger('feature-flags');
export const queryLogger = createLogger('query-optimizer');
export const graphqlLogger = createLogger('graphql');

// 生成請求追蹤 ID (Edge Runtime 兼容)
export const generateCorrelationId = (): string => {
  // 使用 Web Crypto API (Edge Runtime 兼容)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: 生成簡單的 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 從請求中獲取或生成 correlation ID
export const getCorrelationId = (headers: Headers): string => {
  const existingId = headers.get('x-correlation-id');
  return existingId || generateCorrelationId();
};

// 輔助函數：記錄 API 請求
export const logApiRequest = (
  method: string,
  path: string,
  params?: Record<string, string | number | boolean>,
  body?: Record<string, unknown> | FormData | string | null
) => {
  apiLogger.info(
    {
      method,
      path,
      params,
      body: body ? Object.keys(body) : undefined, // 只記錄 key，避免敏感資料
    },
    'API Request'
  );
};

// 輔助函數：記錄 API 回應
export const logApiResponse = (method: string, path: string, status: number, duration?: number) => {
  if (status >= 400) {
    apiLogger.error(
      {
        method,
        path,
        status,
        duration,
      },
      'API Response Error'
    );
  } else {
    apiLogger.info(
      {
        method,
        path,
        status,
        duration,
      },
      'API Response'
    );
  }
};

// 輔助函數：記錄數據庫操作
export const logDbOperation = (
  operation: string,
  table: string,
  details?: Record<string, string | number | boolean | null>,
  error?: Error
) => {
  if (error) {
    dbLogger.error(
      {
        operation,
        table,
        details,
        err: error,
      },
      'Database operation failed'
    );
  } else {
    dbLogger.debug(
      {
        operation,
        table,
        details,
      },
      'Database operation'
    );
  }
};

// 輔助函數：記錄性能指標
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, string | number | boolean>
) => {
  systemLogger.info(
    {
      operation,
      duration,
      ...metadata,
    },
    'Performance metric'
  );
};

// 輔助函數：記錄 middleware 請求
export const logMiddlewareRequest = (
  path: string,
  method: string,
  correlationId: string,
  metadata?: Record<string, string | number | boolean>
) => {
  middlewareLogger.info(
    {
      correlationId,
      path,
      method,
      ...metadata,
    },
    'Middleware processing request'
  );
};

// 輔助函數：記錄 middleware 認證結果
export const logMiddlewareAuth = (
  correlationId: string,
  authenticated: boolean,
  userId?: string,
  error?: string
) => {
  const level = authenticated ? 'info' : 'warn';
  middlewareLogger[level](
    {
      correlationId,
      authenticated,
      userId,
      error,
    },
    authenticated ? 'User authenticated' : 'Authentication failed'
  );
};

// 輔助函數：記錄 middleware 路由決策
export const logMiddlewareRouting = (
  correlationId: string,
  path: string,
  isPublicRoute: boolean,
  redirectTo?: string
) => {
  middlewareLogger.debug(
    {
      correlationId,
      path,
      isPublicRoute,
      redirectTo,
    },
    redirectTo ? 'Redirecting request' : 'Route access decision'
  );
};

// 敏感資料過濾器
export const sanitizeLogData = (data: unknown): unknown => {
  // 策略4: unknown + type narrowing - 安全處理各種類型的日誌數據
  if (!data || typeof data !== 'object') return data;

  const sensitive = ['password', 'token', 'apiKey', 'secret', 'authorization'];

  // 處理陣列
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  // 處理物件
  const sanitized = { ...data } as Record<string, unknown>;

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitive.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

// 測試 logger 是否正常運作
if (isNotProduction()) {
  logger.info('Logger initialized successfully');
}

export default logger;
