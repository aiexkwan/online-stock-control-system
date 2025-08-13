// Browser-safe logger for client-side
import pino from 'pino';

// 瀏覽器環境配置
const browserLogger = pino({
  browser: {
    serialize: true,
    asObject: true,
    transmit: {
      level: 'error',
      send: function (level: string, logEvent: pino.LogEvent) {
        // 可以發送錯誤到監控服務
        if (level === 'error') {
          // 例如: 發送到 Sentry, LogRocket 等
          console.error('Client Error:', logEvent);
        }
      },
    },
  },
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn',
});

// 建立模組 logger
export const createClientLogger = (module: string) => {
  return browserLogger.child({ module, client: true });
};

// 預設客戶端 logger
export const uiLogger = createClientLogger('ui');
export const stateLogger = createClientLogger('state');
export const apiClientLogger = createClientLogger('api-client');

// 輔助函數：記錄客戶端錯誤
export const logClientError = (
  error: Error,
  componentName?: string,
  additionalInfo?: Record<string, string | number | boolean | null>
) => {
  uiLogger.error(
    {
      err: error,
      component: componentName,
      ...additionalInfo,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
    'Client error occurred'
  );
};

// 輔助函數：記錄用戶操作
export const logUserAction = (
  action: string,
  component: string,
  details?: Record<string, string | number | boolean>
) => {
  uiLogger.info(
    {
      action,
      component,
      ...details,
    },
    'User action'
  );
};

// 輔助函數：記錄 API 調用
export const logApiCall = (
  method: string,
  endpoint: string,
  status?: number,
  duration?: number
) => {
  const level = status && status >= 400 ? 'error' : 'debug';
  apiClientLogger[level](
    {
      method,
      endpoint,
      status,
      duration,
    },
    'API call from client'
  );
};

export default browserLogger;
