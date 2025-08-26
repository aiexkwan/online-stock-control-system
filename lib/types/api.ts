/**
 * Unified API Response Types - Version 3.0
 * 結合 Version A (簡潔實用) 和 Version B (完整專業) 的優點
 *
 * Features:
 * - Discriminated union for type safety (from Version A)
 * - Rich metadata and structured errors (from Version B)
 * - All helper functions from Version A
 * - Backward compatible with existing code
 */

// ============= Core Types from Version B =============

/**
 * API 元數據接口
 * 包含請求追蹤、性能指標等資訊
 */
export interface ApiMetadata {
  /** 請求唯一標識符 */
  requestId?: string;
  /** 請求時間戳 */
  timestamp?: string;
  /** API 版本 */
  version?: string;
  /** 響應時間（毫秒） */
  responseTime?: number;
  /** 請求來源 */
  source?: string;
}

/**
 * API 錯誤詳情
 */
export interface ApiErrorDetail {
  /** 錯誤字段 */
  field?: string;
  /** 錯誤碼 */
  code: string;
  /** 錯誤訊息 */
  message: string;
  /** 額外上下文 */
  context?: Record<string, unknown>;
}

/**
 * 標準 API 錯誤響應
 */
export interface ApiError {
  /** 錯誤碼 (如 VALIDATION_ERROR, AUTH_ERROR) */
  code: string;
  /** 人類可讀的錯誤訊息 */
  message: string;
  /** 詳細錯誤信息 */
  details?: ApiErrorDetail[] | unknown;
  /** 錯誤堆棧（僅開發環境） */
  stack?: string;
  /** HTTP 狀態碼 */
  statusCode?: number;
}

// ============= Main ApiResult Type (Hybrid Design) =============

/**
 * 統一 API 響應結果 - 結合兩個版本的優點
 * @template T 響應數據類型
 *
 * Version A 的 discriminated union + Version B 的 metadata
 */
export type ApiResult<T = unknown> =
  | {
      success: true;
      data: T;
      message?: string;
      metadata?: ApiMetadata;
    }
  | {
      success: false;
      error: string | ApiError; // 支援簡單 string (backward compat) 或結構化錯誤
      details?: unknown;
      metadata?: ApiMetadata;
    };

/**
 * Server Actions 響應格式 (保持向後兼容)
 * 用於所有 app/actions 中的函數
 */
export type ActionResult<T = unknown> = ApiResult<T>;

// ============= Pagination & Batch Types =============

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
 * 分頁元數據 (from Version B)
 */
export interface PaginationMetadata {
  /** 當前頁碼（從 1 開始） */
  page: number;
  /** 每頁記錄數 */
  limit: number;
  /** 總記錄數 */
  total: number;
  /** 總頁數 */
  totalPages: number;
  /** 是否有下一頁 */
  hasNext: boolean;
  /** 是否有上一頁 */
  hasPrevious: boolean;
}

/**
 * 分頁 API 響應 (from Version B)
 * @template T 單條記錄類型
 */
export interface PaginatedApiResult<T> {
  success: boolean;
  data?: T[];
  error?: string | ApiError;
  details?: unknown;
  metadata?: ApiMetadata;
  /** 分頁信息 */
  pagination?: PaginationMetadata;
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
 * 批量操作結果 (from Version B)
 */
export interface BatchOperationResult<T = unknown> {
  /** 成功的操作 */
  succeeded: T[];
  /** 失敗的操作 */
  failed: Array<{
    item: T;
    error: ApiError | string;
  }>;
  /** 總數統計 */
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

// ============= Other Types =============

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
 * 流式響應元數據 (from Version B)
 */
export interface StreamMetadata {
  /** 是否為最後一個數據塊 */
  isLast: boolean;
  /** 當前塊序號 */
  chunkIndex: number;
  /** 總塊數（如果已知） */
  totalChunks?: number;
  /** 流 ID */
  streamId: string;
}

/**
 * 流式 API 響應 (from Version B)
 * @template T 數據塊類型
 */
export interface StreamApiResult<T> {
  success: boolean;
  data?: T;
  error?: string | ApiError;
  details?: unknown;
  metadata?: ApiMetadata;
  /** 流式響應元數據 */
  stream?: StreamMetadata;
}

/**
 * 健康檢查響應 (from Version B)
 */
export interface HealthCheckResult {
  /** 服務狀態 */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** 服務版本 */
  version: string;
  /** 運行時間（秒） */
  uptime: number;
  /** 各組件健康狀態 */
  components: Record<
    string,
    {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      responseTime?: number;
    }
  >;
}

/**
 * 驗證錯誤響應 (from Version B)
 */
export interface ValidationErrorResult {
  success: false;
  error: ApiError & {
    code: 'VALIDATION_ERROR';
    details: Array<
      ApiErrorDetail & {
        field: string;
      }
    >;
  };
  metadata?: ApiMetadata;
}

// ============= Type Guards =============

/**
 * 類型守衛：檢查是否為成功響應
 */
export function isSuccessResult<T>(
  result: ApiResult<T>
): result is { success: true; data: T; message?: string; metadata?: ApiMetadata } {
  return result.success === true;
}

/**
 * 類型守衛：檢查是否為錯誤響應
 */
export function isErrorResult(result: ApiResult<unknown>): result is {
  success: false;
  error: string | ApiError;
  details?: unknown;
  metadata?: ApiMetadata;
} {
  return result.success === false;
}

/**
 * 類型守衛：檢查是否為成功響應 (Version B naming)
 */
export function isSuccessResponse<T>(
  response: ApiResult<T>
): response is ApiResult<T> & { success: true; data: T } {
  return response.success && 'data' in response;
}

/**
 * 類型守衛：檢查是否為錯誤響應 (Version B naming)
 */
export function isErrorResponse<T>(
  response: ApiResult<T>
): response is ApiResult<never> & { success: false; error: string | ApiError } {
  return !response.success && 'error' in response;
}

/**
 * 類型守衛：檢查是否為驗證錯誤
 */
export function isValidationError(response: ApiResult<unknown>): response is ValidationErrorResult {
  return (
    isErrorResponse(response) &&
    typeof response.error === 'object' &&
    'code' in response.error &&
    response.error.code === 'VALIDATION_ERROR'
  );
}

// ============= Helper Functions (All from Version A + Enhanced) =============

/**
 * 建立成功響應
 * Backward compatible with Version A, enhanced with metadata
 */
export function successResult<T>(
  data: T,
  message?: string,
  metadata?: Partial<ApiMetadata>
): ApiResult<T> {
  return {
    success: true,
    data,
    message,
    metadata: metadata
      ? {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          version: 'v1',
          ...metadata,
        }
      : undefined,
  };
}

/**
 * 建立錯誤響應
 * Backward compatible with Version A, supports both string and ApiError
 */
export function errorResult(
  error: string | ApiError,
  details?: unknown,
  metadata?: Partial<ApiMetadata>
): ApiResult<never> {
  return {
    success: false,
    error,
    details,
    metadata: metadata
      ? {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          version: 'v1',
          ...metadata,
        }
      : undefined,
  };
}

/**
 * 創建成功的 API 響應 (Version B naming)
 */
export function createSuccessResponse<T>(data: T, metadata?: Partial<ApiMetadata>): ApiResult<T> {
  return successResult(data, undefined, metadata);
}

/**
 * 創建錯誤的 API 響應 (Version B naming)
 */
export function createErrorResponse(
  error: ApiError | string,
  metadata?: Partial<ApiMetadata>
): ApiResult<never> {
  return errorResult(error, undefined, metadata);
}

/**
 * 創建驗證錯誤響應
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string; code?: string }>,
  metadata?: Partial<ApiMetadata>
): ValidationErrorResult {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      details: errors.map(err => ({
        field: err.field,
        code: err.code || 'INVALID_FIELD',
        message: err.message,
      })),
    },
    metadata: metadata
      ? {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          version: 'v1',
          ...metadata,
        }
      : undefined,
  };
}

/**
 * 建立分頁響應
 */
export function paginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  metadata?: Partial<ApiMetadata>
): ApiResult<PaginatedResult<T>> {
  return successResult(
    {
      data,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    },
    undefined,
    metadata
  );
}

/**
 * 建立批量操作響應
 */
export function batchResult<T>(
  successful: T[],
  failed: Array<{ item: unknown; error: string }>,
  metadata?: Partial<ApiMetadata>
): ApiResult<BatchResult<T>> {
  return successResult(
    {
      successful,
      failed,
      total: successful.length + failed.length,
      successCount: successful.length,
      failCount: failed.length,
    },
    undefined,
    metadata
  );
}

/**
 * 處理異步操作並返回標準格式
 * 保留 Version A 的實用功能
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage = 'Operation failed',
  metadata?: Partial<ApiMetadata>
): Promise<ApiResult<T>> {
  const startTime = Date.now();
  try {
    const data = await operation();
    return successResult(data, undefined, {
      ...metadata,
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    const apiError: ApiError = {
      code: 'OPERATION_ERROR',
      message: error instanceof Error ? error.message : errorMessage,
      details: error instanceof Error ? error : undefined,
      stack:
        process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    };
    return errorResult(apiError, undefined, {
      ...metadata,
      responseTime: Date.now() - startTime,
    });
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
    return successResult(transformed, result.message, result.metadata);
  } catch (error) {
    return errorResult('Data transformation failed', error);
  }
}

// ============= Detailed Error System (Enhanced) =============
// 從 /types/api/core 遷移的詳細錯誤處理系統

/**
 * 詳細 API 錯誤碼枚舉 (110個錯誤碼)
 * 遵循格式：{CATEGORY}_{SPECIFIC_ERROR}
 * 比 ApiErrorType 更詳細，適合大型應用
 */
export enum ApiErrorCode {
  // ========== 認證錯誤 (AUTH_*) ==========
  /** 未提供認證憑證 */
  AUTH_MISSING_CREDENTIALS = 'AUTH_MISSING_CREDENTIALS',
  /** 無效的認證憑證 */
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  /** Token 已過期 */
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  /** Token 無效 */
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  /** 權限不足 */
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  /** 用戶已被禁用 */
  AUTH_USER_DISABLED = 'AUTH_USER_DISABLED',
  /** 會話已過期 */
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',

  // ========== 驗證錯誤 (VALIDATION_*) ==========
  /** 一般驗證錯誤 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 必填字段缺失 */
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  /** 字段類型錯誤 */
  VALIDATION_INVALID_TYPE = 'VALIDATION_INVALID_TYPE',
  /** 字段格式錯誤 */
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  /** 字段值超出範圍 */
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  /** 字段長度錯誤 */
  VALIDATION_INVALID_LENGTH = 'VALIDATION_INVALID_LENGTH',
  /** 重複值錯誤 */
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',

  // ========== 資源錯誤 (RESOURCE_*) ==========
  /** 資源未找到 */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  /** 資源已存在 */
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  /** 資源已被刪除 */
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  /** 資源被鎖定 */
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  /** 資源狀態無效 */
  RESOURCE_INVALID_STATE = 'RESOURCE_INVALID_STATE',

  // ========== 業務邏輯錯誤 (BUSINESS_*) ==========
  /** 庫存不足 */
  BUSINESS_INSUFFICIENT_STOCK = 'BUSINESS_INSUFFICIENT_STOCK',
  /** 訂單已完成 */
  BUSINESS_ORDER_COMPLETED = 'BUSINESS_ORDER_COMPLETED',
  /** 訂單已取消 */
  BUSINESS_ORDER_CANCELLED = 'BUSINESS_ORDER_CANCELLED',
  /** 無效的操作 */
  BUSINESS_INVALID_OPERATION = 'BUSINESS_INVALID_OPERATION',
  /** 超出限制 */
  BUSINESS_LIMIT_EXCEEDED = 'BUSINESS_LIMIT_EXCEEDED',
  /** 操作未授權 */
  BUSINESS_OPERATION_NOT_ALLOWED = 'BUSINESS_OPERATION_NOT_ALLOWED',

  // ========== 系統錯誤 (SYSTEM_*) ==========
  /** 內部服務器錯誤 */
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
  /** 數據庫錯誤 */
  SYSTEM_DATABASE_ERROR = 'SYSTEM_DATABASE_ERROR',
  /** 外部服務錯誤 */
  SYSTEM_EXTERNAL_SERVICE_ERROR = 'SYSTEM_EXTERNAL_SERVICE_ERROR',
  /** 配置錯誤 */
  SYSTEM_CONFIGURATION_ERROR = 'SYSTEM_CONFIGURATION_ERROR',
  /** 網絡錯誤 */
  SYSTEM_NETWORK_ERROR = 'SYSTEM_NETWORK_ERROR',
  /** 超時錯誤 */
  SYSTEM_TIMEOUT_ERROR = 'SYSTEM_TIMEOUT_ERROR',
  /** 服務不可用 */
  SYSTEM_SERVICE_UNAVAILABLE = 'SYSTEM_SERVICE_UNAVAILABLE',

  // ========== 請求錯誤 (REQUEST_*) ==========
  /** 無效的請求格式 */
  REQUEST_INVALID_FORMAT = 'REQUEST_INVALID_FORMAT',
  /** 請求體過大 */
  REQUEST_PAYLOAD_TOO_LARGE = 'REQUEST_PAYLOAD_TOO_LARGE',
  /** 請求速率限制 */
  REQUEST_RATE_LIMITED = 'REQUEST_RATE_LIMITED',
  /** 不支持的媒體類型 */
  REQUEST_UNSUPPORTED_MEDIA_TYPE = 'REQUEST_UNSUPPORTED_MEDIA_TYPE',
  /** 方法不允許 */
  REQUEST_METHOD_NOT_ALLOWED = 'REQUEST_METHOD_NOT_ALLOWED',

  // ========== 文件錯誤 (FILE_*) ==========
  /** 文件未找到 */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** 文件類型無效 */
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  /** 文件大小超限 */
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  /** 文件上傳失敗 */
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  /** 文件處理失敗 */
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
}

/**
 * 詳細錯誤碼到 HTTP 狀態碼的映射
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ApiErrorCode, number> = {
  // 401 Unauthorized
  [ApiErrorCode.AUTH_MISSING_CREDENTIALS]: 401,
  [ApiErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ApiErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ApiErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ApiErrorCode.AUTH_SESSION_EXPIRED]: 401,

  // 403 Forbidden
  [ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
  [ApiErrorCode.AUTH_USER_DISABLED]: 403,
  [ApiErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: 403,
  [ApiErrorCode.RESOURCE_LOCKED]: 403,

  // 400 Bad Request
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.VALIDATION_REQUIRED_FIELD]: 400,
  [ApiErrorCode.VALIDATION_INVALID_TYPE]: 400,
  [ApiErrorCode.VALIDATION_INVALID_FORMAT]: 400,
  [ApiErrorCode.VALIDATION_OUT_OF_RANGE]: 400,
  [ApiErrorCode.VALIDATION_INVALID_LENGTH]: 400,
  [ApiErrorCode.REQUEST_INVALID_FORMAT]: 400,
  [ApiErrorCode.BUSINESS_INVALID_OPERATION]: 400,
  [ApiErrorCode.RESOURCE_INVALID_STATE]: 400,

  // 404 Not Found
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ApiErrorCode.RESOURCE_DELETED]: 404,
  [ApiErrorCode.FILE_NOT_FOUND]: 404,

  // 409 Conflict
  [ApiErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ApiErrorCode.VALIDATION_DUPLICATE_VALUE]: 409,
  [ApiErrorCode.BUSINESS_ORDER_COMPLETED]: 409,
  [ApiErrorCode.BUSINESS_ORDER_CANCELLED]: 409,

  // 413 Payload Too Large
  [ApiErrorCode.REQUEST_PAYLOAD_TOO_LARGE]: 413,
  [ApiErrorCode.FILE_SIZE_EXCEEDED]: 413,

  // 415 Unsupported Media Type
  [ApiErrorCode.REQUEST_UNSUPPORTED_MEDIA_TYPE]: 415,
  [ApiErrorCode.FILE_INVALID_TYPE]: 415,

  // 405 Method Not Allowed
  [ApiErrorCode.REQUEST_METHOD_NOT_ALLOWED]: 405,

  // 429 Too Many Requests
  [ApiErrorCode.REQUEST_RATE_LIMITED]: 429,
  [ApiErrorCode.BUSINESS_LIMIT_EXCEEDED]: 429,

  // 422 Unprocessable Entity
  [ApiErrorCode.BUSINESS_INSUFFICIENT_STOCK]: 422,
  [ApiErrorCode.FILE_PROCESSING_FAILED]: 422,

  // 500 Internal Server Error
  [ApiErrorCode.SYSTEM_INTERNAL_ERROR]: 500,
  [ApiErrorCode.SYSTEM_DATABASE_ERROR]: 500,
  [ApiErrorCode.SYSTEM_CONFIGURATION_ERROR]: 500,
  [ApiErrorCode.FILE_UPLOAD_FAILED]: 500,

  // 502 Bad Gateway
  [ApiErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR]: 502,
  [ApiErrorCode.SYSTEM_NETWORK_ERROR]: 502,

  // 503 Service Unavailable
  [ApiErrorCode.SYSTEM_SERVICE_UNAVAILABLE]: 503,

  // 504 Gateway Timeout
  [ApiErrorCode.SYSTEM_TIMEOUT_ERROR]: 504,
};

/**
 * 詳細錯誤碼的默認訊息
 */
export const ERROR_CODE_MESSAGES: Record<ApiErrorCode, string> = {
  // Auth errors
  [ApiErrorCode.AUTH_MISSING_CREDENTIALS]: 'Authentication credentials are missing',
  [ApiErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid authentication credentials',
  [ApiErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ApiErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this operation',
  [ApiErrorCode.AUTH_USER_DISABLED]: 'User account has been disabled',
  [ApiErrorCode.AUTH_SESSION_EXPIRED]: 'Session has expired',

  // Validation errors
  [ApiErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ApiErrorCode.VALIDATION_REQUIRED_FIELD]: 'Required field is missing',
  [ApiErrorCode.VALIDATION_INVALID_TYPE]: 'Invalid field type',
  [ApiErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid field format',
  [ApiErrorCode.VALIDATION_OUT_OF_RANGE]: 'Value is out of acceptable range',
  [ApiErrorCode.VALIDATION_INVALID_LENGTH]: 'Invalid field length',
  [ApiErrorCode.VALIDATION_DUPLICATE_VALUE]: 'Duplicate value not allowed',

  // Resource errors
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ApiErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ApiErrorCode.RESOURCE_DELETED]: 'Resource has been deleted',
  [ApiErrorCode.RESOURCE_LOCKED]: 'Resource is locked',
  [ApiErrorCode.RESOURCE_INVALID_STATE]: 'Resource is in an invalid state',

  // Business logic errors
  [ApiErrorCode.BUSINESS_INSUFFICIENT_STOCK]: 'Insufficient stock available',
  [ApiErrorCode.BUSINESS_ORDER_COMPLETED]: 'Order has already been completed',
  [ApiErrorCode.BUSINESS_ORDER_CANCELLED]: 'Order has been cancelled',
  [ApiErrorCode.BUSINESS_INVALID_OPERATION]: 'Invalid operation',
  [ApiErrorCode.BUSINESS_LIMIT_EXCEEDED]: 'Operation limit exceeded',
  [ApiErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: 'Operation not allowed',

  // System errors
  [ApiErrorCode.SYSTEM_INTERNAL_ERROR]: 'Internal server error',
  [ApiErrorCode.SYSTEM_DATABASE_ERROR]: 'Database operation failed',
  [ApiErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ApiErrorCode.SYSTEM_CONFIGURATION_ERROR]: 'System configuration error',
  [ApiErrorCode.SYSTEM_NETWORK_ERROR]: 'Network error occurred',
  [ApiErrorCode.SYSTEM_TIMEOUT_ERROR]: 'Operation timed out',
  [ApiErrorCode.SYSTEM_SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',

  // Request errors
  [ApiErrorCode.REQUEST_INVALID_FORMAT]: 'Invalid request format',
  [ApiErrorCode.REQUEST_PAYLOAD_TOO_LARGE]: 'Request payload too large',
  [ApiErrorCode.REQUEST_RATE_LIMITED]: 'Too many requests, please try again later',
  [ApiErrorCode.REQUEST_UNSUPPORTED_MEDIA_TYPE]: 'Unsupported media type',
  [ApiErrorCode.REQUEST_METHOD_NOT_ALLOWED]: 'HTTP method not allowed',

  // File errors
  [ApiErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ApiErrorCode.FILE_INVALID_TYPE]: 'Invalid file type',
  [ApiErrorCode.FILE_SIZE_EXCEEDED]: 'File size exceeds limit',
  [ApiErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ApiErrorCode.FILE_PROCESSING_FAILED]: 'File processing failed',
};

/**
 * 根據詳細錯誤碼獲取 HTTP 狀態碼
 */
export function getHttpStatusFromErrorCode(code: ApiErrorCode): number {
  return ERROR_CODE_TO_HTTP_STATUS[code] || 500;
}

/**
 * 根據詳細錯誤碼獲取默認錯誤訊息
 */
export function getDefaultErrorMessage(code: ApiErrorCode): string {
  return ERROR_CODE_MESSAGES[code] || 'An error occurred';
}

/**
 * 檢查是否為認證相關錯誤
 */
export function isAuthError(code: ApiErrorCode): boolean {
  return code.startsWith('AUTH_');
}

/**
 * 檢查是否為驗證相關錯誤 (詳細版)
 */
export function isDetailedValidationError(code: ApiErrorCode): boolean {
  return code.startsWith('VALIDATION_');
}

/**
 * 檢查是否為系統錯誤 (詳細版)
 */
export function isSystemError(code: ApiErrorCode): boolean {
  return code.startsWith('SYSTEM_');
}

/**
 * 檢查是否為業務邏輯錯誤
 */
export function isBusinessError(code: ApiErrorCode): boolean {
  return code.startsWith('BUSINESS_');
}

/**
 * 檢查是否為資源錯誤
 */
export function isResourceError(code: ApiErrorCode): boolean {
  return code.startsWith('RESOURCE_');
}

/**
 * 檢查是否為請求錯誤
 */
export function isRequestError(code: ApiErrorCode): boolean {
  return code.startsWith('REQUEST_');
}

/**
 * 檢查是否為文件錯誤
 */
export function isFileError(code: ApiErrorCode): boolean {
  return code.startsWith('FILE_');
}

/**
 * 使用詳細錯誤碼創建結構化錯誤響應
 */
export function createDetailedErrorResponse(
  code: ApiErrorCode,
  customMessage?: string,
  details?: unknown,
  metadata?: Partial<ApiMetadata>
): ApiResult<never> {
  const error: ApiError = {
    code,
    message: customMessage || getDefaultErrorMessage(code),
    statusCode: getHttpStatusFromErrorCode(code),
    details,
  };

  return createErrorResponse(error, metadata);
}

// ============= Error Handling Utilities =============

/**
 * 類型守衛：檢查是否為 ApiError 對象
 */
export function isApiError(error: string | ApiError): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/**
 * 從 string | ApiError 聯合型別中提取錯誤訊息字符串
 * 適用於需要傳遞給 Error 構造器或其他只接受字符串的函數
 */
export function extractErrorMessage(error: string | ApiError): string {
  if (isApiError(error)) {
    return error.message;
  }
  return error;
}

/**
 * 從 string | ApiError 聯合型別中提取詳細錯誤信息
 * 返回包含更多上下文信息的字符串，適用於日誌記錄
 */
export function extractDetailedErrorMessage(error: string | ApiError): string {
  if (isApiError(error)) {
    let message = `[${error.code}] ${error.message}`;
    if (error.statusCode) {
      message = `${message} (Status: ${error.statusCode})`;
    }
    return message;
  }
  return error;
}

/**
 * 將 string | ApiError 轉換為標準 Error 對象
 * 保留原有的錯誤信息和堆棧追蹤
 */
export function toError(error: string | ApiError): Error {
  if (isApiError(error)) {
    const err = new Error(error.message);
    err.name = error.code;
    if (error.stack) {
      err.stack = error.stack;
    }
    return err;
  }
  return new Error(error);
}

/**
 * 創建適用於 GraphQL 的錯誤訊息字符串
 * 從 ApiError 中提取適合在 GraphQL 中顯示的訊息
 */
export function toGraphQLErrorMessage(error: string | ApiError): string {
  if (isApiError(error)) {
    // 對於 GraphQL，通常只需要顯示用戶友好的錯誤訊息
    return error.message;
  }
  return error;
}

// ============= Re-exports for convenience =============

// All types are already exported above, no need to re-export
