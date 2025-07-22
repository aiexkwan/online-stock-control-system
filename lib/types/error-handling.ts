/**
 * 錯誤處理類型定義和工具函數
 *
 * 多專家協作設計：
 * - 分析師：錯誤分類和模式識別
 * - 架構專家：類型系統設計
 * - 代碼品質專家：最佳實踐實施
 */

/**
 * 標準錯誤類型
 */
export interface StandardError {
  message: string;
  code?: string;
  stack?: string;
  name?: string;
}

/**
 * API 錯誤類型
 */
export interface ApiError extends StandardError {
  status?: number;
  statusText?: string;
  data?: unknown;
}

/**
 * 數據庫錯誤類型
 */
export interface DatabaseError extends StandardError {
  table?: string;
  operation?: string;
  constraint?: string;
}

/**
 * 驗證錯誤類型
 */
export interface ValidationError extends StandardError {
  field?: string;
  value?: unknown;
  rule?: string;
}

/**
 * 業務邏輯錯誤類型
 */
export interface BusinessError extends StandardError {
  businessCode?: string;
  context?: Record<string, unknown>;
}

/**
 * 聯合錯誤類型
 */
export type AppError = StandardError | ApiError | DatabaseError | ValidationError | BusinessError;

/**
 * 錯誤類型守衛函數
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function isApiError(error: unknown): error is ApiError {
  return (
    isErrorWithMessage(error) &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  );
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    isErrorWithMessage(error) && ('table' in error || 'operation' in error || 'constraint' in error)
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return isErrorWithMessage(error) && ('field' in error || 'value' in error || 'rule' in error);
}

export function isBusinessError(error: unknown): error is BusinessError {
  return isErrorWithMessage(error) && ('businessCode' in error || 'context' in error);
}

/**
 * 錯誤消息提取函數
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * 錯誤轉換函數
 */
export function toStandardError(error: unknown): StandardError {
  if (isError(error)) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (isErrorWithMessage(error)) {
    return {
      message: error.message,
      name: 'UnknownError',
    };
  }

  return {
    message: String(error),
    name: 'UnknownError',
  };
}

/**
 * 安全錯誤處理包裝器
 */
export function safeErrorHandler<T>(
  operation: () => T,
  fallback: T,
  errorHandler?: (error: unknown) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Safe error handler caught:', getErrorMessage(error));
    }
    return fallback;
  }
}

/**
 * 異步安全錯誤處理包裝器
 */
export async function safeAsyncErrorHandler<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Safe async error handler caught:', getErrorMessage(error));
    }
    return fallback;
  }
}

/**
 * 錯誤記錄函數
 */
export function logError(error: unknown, context?: string): void {
  const errorMessage = getErrorMessage(error);
  const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;

  if (isError(error) && error.stack) {
    console.error(logMessage, error.stack);
  } else {
    console.error(logMessage);
  }
}

/**
 * 結構化錯誤記錄
 */
export function logStructuredError(error: unknown, metadata?: Record<string, unknown>): void {
  const structuredError = {
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
    type: isError(error) ? error.name : 'Unknown',
    stack: isError(error) ? error.stack : undefined,
    metadata,
  };

  console.error('Structured error:', JSON.stringify(structuredError, null, 2));
}

/**
 * 錯誤分類器
 */
export function categorizeError(error: unknown): {
  category: 'api' | 'database' | 'validation' | 'business' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
} {
  if (isApiError(error)) {
    const status = error.status || 500;
    return {
      category: 'api',
      severity: status >= 500 ? 'critical' : status >= 400 ? 'high' : 'medium',
      retryable: status >= 500 || status === 429,
    };
  }

  if (isDatabaseError(error)) {
    return {
      category: 'database',
      severity: 'high',
      retryable: true,
    };
  }

  if (isValidationError(error)) {
    return {
      category: 'validation',
      severity: 'medium',
      retryable: false,
    };
  }

  if (isBusinessError(error)) {
    return {
      category: 'business',
      severity: 'medium',
      retryable: false,
    };
  }

  return {
    category: 'unknown',
    severity: 'medium',
    retryable: false,
  };
}
