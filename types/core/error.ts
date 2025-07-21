/**
 * 錯誤處理類型定義和工具函數
 * 從 lib/types/error-handling.ts 遷移
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
  query?: string;
  details?: unknown;
  hint?: string;
}

/**
 * 驗證錯誤類型
 */
export interface ValidationError extends StandardError {
  field?: string;
  value?: unknown;
  constraint?: string;
}

// 類型守衛函數
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

/**
 * 統一錯誤消息提取函數
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
    };
  }

  return {
    message: typeof error === 'string' ? error : 'An unknown error occurred',
  };
}

/**
 * 安全錯誤處理器
 */
export function safeErrorHandler<T>(
  operation: () => T,
  fallback: T,
  onError?: (error: unknown) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Safe error handler caught:', getErrorMessage(error));
    }
    return fallback;
  }
}

/**
 * 異步安全錯誤處理器
 */
export async function safeAsyncErrorHandler<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Safe async error handler caught:', getErrorMessage(error));
    }
    return fallback;
  }
}
