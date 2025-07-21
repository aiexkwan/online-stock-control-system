/**
 * @fileoverview API 核心類型統一導出
 * @module types/api/core
 * 
 * Phase 2: API 類型統一 - 核心模塊
 */

// Response types
export * from './response';
export * from './error-codes';

// Re-export specific types for convenience
export type {
  ApiResult,
  ApiError,
  ApiMetadata,
  PaginatedApiResult,
  BatchOperationResult,
  StreamApiResult,
  HealthCheckResult,
  ValidationErrorResult,
} from './response';

export {
  ApiErrorCode,
  ERROR_CODE_TO_HTTP_STATUS,
  ERROR_CODE_MESSAGES,
  getHttpStatusFromErrorCode,
  getDefaultErrorMessage,
  isAuthError,
  isValidationError,
  isSystemError,
} from './error-codes';

// Utility functions
export {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  isErrorResponse,
  isSuccessResponse,
} from './response';