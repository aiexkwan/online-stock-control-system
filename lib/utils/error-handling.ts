/**
 * Error handling utilities for GraphQL resolvers and system-wide error management
 */

/**
 * 快取條目的泛型接口
 * @template T 快取數據的類型
 */
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

/**
 * 錯誤代碼枚舉，確保錯誤代碼的一致性
 */
export enum ErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

/**
 * 快取實例，使用泛型接口確保類型安全
 */
const cache = new Map<string, CacheEntry>();

/**
 * 使用重試邏輯包裝函數，適用於可能暫時失敗的操作
 * @template T 函數返回值的類型
 * @param fn 要執行的異步函數
 * @param maxRetries 最大重試次數，默認為3次
 * @param delay 每次重試之間的延遲時間（毫秒），默認為1000ms
 * @returns 函數執行的結果
 * @throws 如果所有重試都失敗，拋出最後一次的錯誤
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise<void>(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * 使用快取包裝函數，避免重複的昂貴操作
 * @template T 函數返回值的類型
 * @param key 快取鍵值，應該唯一標識這個操作
 * @param fn 要執行的異步函數
 * @param ttlSeconds 快取過期時間（秒），默認為60秒
 * @returns 函數執行的結果或快取的結果
 */
export async function withCache<T>(key: string, fn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < ttlSeconds * 1000) {
    return cached.data as T;
  }

  const data = await fn();
  cache.set(key, { data: data as unknown, timestamp: now });

  // 清理過期的快取條目，避免內存洩漏
  if (cache.size > 100) {
    const entries = Array.from(cache.entries());
    const expired = entries.filter(([_, value]) => now - value.timestamp > ttlSeconds * 1000);
    expired.forEach(([expiredKey]) => cache.delete(expiredKey));
  }

  return data;
}

/**
 * 根據模式清理快取
 * @param pattern 可選的模式字符串，如果提供，只清理包含此模式的鍵
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

/**
 * 格式化錯誤響應接口
 */
export interface FormattedError {
  /** 錯誤訊息 */
  message: string;
  /** 錯誤代碼，來自 ErrorCode 枚舉 */
  code: ErrorCode;
  /** 可選的詳細信息，僅在開發環境中包含堆疊信息 */
  details?: string | Record<string, unknown>;
}

/**
 * 將各種類型的錯誤格式化為統一的錯誤響應格式
 * @param error 任何類型的錯誤對象
 * @returns 格式化的錯誤對象
 */
export function formatError(error: unknown): FormattedError {
  // 處理標準 Error 實例
  if (error instanceof Error) {
    // 根據錯誤訊息推斷錯誤類型
    let code = ErrorCode.INTERNAL_ERROR;

    if (error.message.toLowerCase().includes('validation')) {
      code = ErrorCode.VALIDATION_ERROR;
    } else if (error.message.toLowerCase().includes('auth')) {
      code = ErrorCode.AUTHENTICATION_ERROR;
    } else if (error.message.toLowerCase().includes('not found')) {
      code = ErrorCode.NOT_FOUND;
    } else if (error.message.toLowerCase().includes('network')) {
      code = ErrorCode.NETWORK_ERROR;
    } else if (error.message.toLowerCase().includes('database')) {
      code = ErrorCode.DATABASE_ERROR;
    }

    return {
      message: error.message,
      code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // 處理字符串錯誤
  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorCode.INTERNAL_ERROR,
      details: undefined,
    };
  }

  // 處理包含 message 屬性的對象
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: ErrorCode.INTERNAL_ERROR,
      details: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined,
    };
  }

  // 處理所有其他類型的錯誤
  return {
    message: 'An unknown error occurred',
    code: ErrorCode.UNKNOWN_ERROR,
    details: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined,
  };
}

/**
 * 檢查給定的錯誤是否為可重試的錯誤
 * @param error 要檢查的錯誤
 * @returns 如果錯誤可重試則返回 true
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }
  return false;
}
