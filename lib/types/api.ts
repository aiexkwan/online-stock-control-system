/**
 * Phase 2: 統一 API 響應類型定義
 * 標準化所有 API 和 Server Actions 的返回格式
 */

/**
 * 標準 API 響應格式
 * 用於所有 REST API endpoints
 */
export type ApiResult<T = unknown> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

/**
 * Server Actions 響應格式
 * 用於所有 app/actions 中的函數
 */
export type ActionResult<T = unknown> = ApiResult<T>;

/**
 * 分頁響應格式
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 批量操作響應格式
 */
export interface BatchResult<T = unknown> {
  successful: T[];
  failed: Array<{ item: unknown; error: string }>;
  total: number;
  successCount: number;
  failCount: number;
}

/**
 * 文件上傳響應格式
 */
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

/**
 * 驗證錯誤格式
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API 錯誤類型枚舉
 */
export enum ApiErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * 詳細錯誤響應
 */
export interface DetailedError {
  type: ApiErrorType;
  message: string;
  timestamp: string;
  path?: string;
  validationErrors?: ValidationError[];
  stack?: string; // 只在開發環境
}

/**
 * 類型守衛：檢查是否為成功響應
 */
export function isSuccessResult<T>(result: ApiResult<T>): result is { success: true; data: T; message?: string } {
  return result.success === true;
}

/**
 * 類型守衛：檢查是否為錯誤響應
 */
export function isErrorResult(result: ApiResult<unknown>): result is { success: false; error: string; details?: unknown } {
  return result.success === false;
}

/**
 * 建立成功響應
 */
export function successResult<T>(data: T, message?: string): ApiResult<T> {
  return { success: true, data, message };
}

/**
 * 建立錯誤響應
 */
export function errorResult(error: string, details?: unknown): ApiResult<never> {
  return { success: false, error, details };
}

/**
 * 建立分頁響應
 */
export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResult<PaginatedResult<T>> {
  return successResult({
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
}

/**
 * 建立批量操作響應
 */
export function batchResult<T>(
  successful: T[],
  failed: Array<{ item: unknown; error: string }>
): ApiResult<BatchResult<T>> {
  return successResult({
    successful,
    failed,
    total: successful.length + failed.length,
    successCount: successful.length,
    failCount: failed.length,
  });
}

/**
 * 處理異步操作並返回標準格式
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<ApiResult<T>> {
  try {
    const data = await operation();
    return successResult(data);
  } catch (error) {
    if (error instanceof Error) {
      return errorResult(error.message || errorMessage, error);
    }
    return errorResult(errorMessage, error);
  }
}

/**
 * 驗證並轉換響應
 */
export function validateAndTransform<T, R>(
  result: ApiResult<T>,
  validator: (data: T) => boolean,
  transformer: (data: T) => R
): ApiResult<R> {
  if (!isSuccessResult(result)) {
    return result;
  }

  if (!validator(result.data)) {
    return errorResult('Data validation failed');
  }

  try {
    const transformed = transformer(result.data);
    return successResult(transformed, result.message);
  } catch (error) {
    return errorResult('Data transformation failed', error);
  }
}