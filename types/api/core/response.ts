/**
 * @fileoverview 統一 API 響應類型定義
 * @module types/api/core/response
 *
 * Phase 2: API 類型統一架構
 * 提供標準化的 API 響應格式，確保前後端類型一致性
 */

import type { UserRole } from '@/types/core/enums';

/**
 * API 元數據接口
 * 包含請求追蹤、性能指標等資訊
 */
export interface ApiMetadata {
  /** 請求唯一標識符 */
  requestId: string;
  /** 請求時間戳 */
  timestamp: string;
  /** API 版本 */
  version: string;
  /** 響應時間（毫秒） */
  responseTime?: number;
  /** 請求來源 */
  source?: string;
  /** 用戶角色 */
  userRole?: UserRole;
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
  details?: ApiErrorDetail[];
  /** 錯誤堆棧（僅開發環境） */
  stack?: string;
  /** HTTP 狀態碼 */
  statusCode?: number;
}

/**
 * 統一 API 響應結果
 * @template T 響應數據類型
 */
export interface ApiResult<T = unknown> {
  /** 請求是否成功 */
  success: boolean;
  /** 響應數據（成功時） */
  data?: T;
  /** 錯誤信息（失敗時） */
  error?: ApiError;
  /** 響應元數據 */
  metadata: ApiMetadata;
}

/**
 * 分頁元數據
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
 * 分頁 API 響應
 * @template T 單條記錄類型
 */
export interface PaginatedApiResult<T> extends ApiResult<T[]> {
  /** 分頁信息 */
  pagination: PaginationMetadata;
}

/**
 * 批量操作結果
 */
export interface BatchOperationResult<T = unknown> {
  /** 成功的操作 */
  succeeded: T[];
  /** 失敗的操作 */
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  /** 總數統計 */
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * 流式響應元數據
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
 * 流式 API 響應
 * @template T 數據塊類型
 */
export interface StreamApiResult<T> extends ApiResult<T> {
  /** 流式響應元數據 */
  stream: StreamMetadata;
}

/**
 * 健康檢查響應
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
 * 驗證錯誤響應
 */
export interface ValidationErrorResult extends ApiResult<never> {
  success: false;
  error: ApiError & {
    code: 'VALIDATION_ERROR';
    details: Array<
      ApiErrorDetail & {
        field: string;
      }
    >;
  };
}

// ============= 輔助函數 =============

/**
 * 創建成功的 API 響應
 */
export function createSuccessResponse<T>(data: T, metadata?: Partial<ApiMetadata>): ApiResult<T> {
  return {
    success: true,
    data,
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...metadata,
    },
  };
}

/**
 * 創建錯誤的 API 響應
 */
export function createErrorResponse(
  error: ApiError,
  metadata?: Partial<ApiMetadata>
): ApiResult<never> {
  return {
    success: false,
    error,
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...metadata,
    },
  };
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
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...metadata,
    },
  };
}

/**
 * 類型守衛：檢查是否為錯誤響應
 */
export function isErrorResponse<T>(
  response: ApiResult<T>
): response is ApiResult<never> & { error: ApiError } {
  return !response.success && !!response.error;
}

/**
 * 類型守衛：檢查是否為成功響應
 */
export function isSuccessResponse<T>(
  response: ApiResult<T>
): response is ApiResult<T> & { data: T } {
  return response.success && response.data !== undefined;
}

/**
 * 類型守衛：檢查是否為驗證錯誤
 */
export function isValidationError(response: ApiResult<unknown>): response is ValidationErrorResult {
  return isErrorResponse(response) && response.error.code === 'VALIDATION_ERROR';
}
