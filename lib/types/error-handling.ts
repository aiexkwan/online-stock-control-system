/**
 * 簡化錯誤處理類型定義
 *
 * 移除複雜分類，使用 Supabase Auth 標準錯誤訊息
 * 保持簡單的成功/失敗狀態管理
 */

/**
 * 簡化錯誤類型 - 基於標準 Error
 */
export interface SimpleError {
  message: string;
  code?: string;
  stack?: string;
  name?: string;
}

/**
 * 應用錯誤類型 - 統一處理
 */
export type AppError = Error | SimpleError;

/**
 * 簡化錯誤類型守衛函數
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

/**
 * 錯誤消息提取函數 - 使用 Supabase 標準格式
 */
export function getErrorMessage(error: unknown): string {
  // Handle Supabase Auth errors
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * 錯誤轉換函數 - 簡化版本
 */
export function toSimpleError(error: unknown): SimpleError {
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
      name: 'Error',
    };
  }

  return {
    message: String(error),
    name: 'Error',
  };
}

/**
 * 簡化安全錯誤處理包裝器
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
 * 簡化錯誤記錄函數
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
 * 簡化錯誤分類器 - 只返回基本信息
 */
export function categorizeError(error: unknown): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
} {
  const message = getErrorMessage(error).toLowerCase();

  // Critical errors
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return { severity: 'critical', retryable: false };
  }

  // High severity errors
  if (
    message.includes('server error') ||
    message.includes('network') ||
    message.includes('timeout')
  ) {
    return { severity: 'high', retryable: true };
  }

  // Medium severity (default)
  return { severity: 'medium', retryable: true };
}

/**
 * Supabase Auth 錯誤訊息標準化
 */
export function normalizeAuthError(error: unknown): string {
  const message = getErrorMessage(error);

  // Common Supabase Auth error patterns
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }

  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address';
  }

  if (message.includes('JWT expired')) {
    return 'Your session has expired. Please log in again';
  }

  if (message.includes('refresh_token_not_found')) {
    return 'Session expired. Please log in again';
  }

  // Return original message if no pattern matches
  return message;
}

/**
 * 成功/失敗狀態類型
 */
export type OperationResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * 創建成功結果
 */
export function createSuccess<T>(data?: T): OperationResult<T> {
  return { success: true, data };
}

/**
 * 創建失敗結果
 */
export function createError(error: unknown): OperationResult {
  return {
    success: false,
    error: normalizeAuthError(error),
  };
}
