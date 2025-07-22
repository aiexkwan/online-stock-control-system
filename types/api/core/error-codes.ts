/**
 * @fileoverview 統一 API 錯誤碼定義
 * @module types/api/core/error-codes
 * 
 * 標準化的錯誤碼系統，便於前後端統一處理
 */

/**
 * API 錯誤碼枚舉
 * 遵循格式：{CATEGORY}_{SPECIFIC_ERROR}
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
 * 錯誤碼到 HTTP 狀態碼的映射
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
 * 錯誤碼的默認訊息
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
 * 根據錯誤碼獲取 HTTP 狀態碼
 */
export function getHttpStatusFromErrorCode(code: ApiErrorCode): number {
  return ERROR_CODE_TO_HTTP_STATUS[code] || 500;
}

/**
 * 根據錯誤碼獲取默認錯誤訊息
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
 * 檢查是否為驗證相關錯誤
 */
export function isValidationError(code: ApiErrorCode): boolean {
  return code.startsWith('VALIDATION_');
}

/**
 * 檢查是否為系統錯誤
 */
export function isSystemError(code: ApiErrorCode): boolean {
  return code.startsWith('SYSTEM_');
}