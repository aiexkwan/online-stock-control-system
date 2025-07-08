import pino from 'pino';
import { isProduction, isNotProduction } from '@/lib/utils/env';

// 基礎 logger 配置
const baseOptions: pino.LoggerOptions = {
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
let logger: pino.Logger;

if (isNotProduction() && typeof window === 'undefined') {
  // 只在 server-side 開發環境使用 pretty print
  try {
    const pretty = require('pino-pretty');
    const stream = pretty({
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      sync: true, // 避免 worker thread 問題
    });
    logger = pino(baseOptions, stream);
  } catch (error) {
    // 如果 pino-pretty 有問題，使用基本 logger
    logger = pino(baseOptions);
  }
} else {
  // Production 或 client-side 使用基本 logger
  logger = pino(baseOptions);
}

export { logger };

// 為不同模組建立 child logger
export const createLogger = (module: string) => {
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

// 輔助函數：記錄 API 請求
export const logApiRequest = (
  method: string,
  path: string,
  params?: Record<string, any>,
  body?: any
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
  details?: Record<string, any>,
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
  metadata?: Record<string, any>
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

// 測試 logger 是否正常運作
if (isNotProduction()) {
  logger.info('Logger initialized successfully');
}

export default logger;
