/**
 * @fileoverview Server Actions 統一結果類型定義
 * @module types/actions/core/result
 *
 * Phase 2: Server Actions 類型統一架構
 * 提供標準化的 Server Actions 響應格式
 */

import { z } from 'zod';
import type { ApiError, ApiErrorCode } from '@/types/api/core';

/**
 * Server Action 執行上下文
 */
export interface ActionContext {
  /** 用戶 ID */
  userId?: string;
  /** 用戶角色 */
  userRole?: string;
  /** 請求 ID */
  requestId: string;
  /** 執行時間戳 */
  timestamp: string;
  /** 客戶端信息 */
  client?: {
    ip?: string;
    userAgent?: string;
  };
}

/**
 * 表單驗證錯誤
 */
export interface FormValidationError {
  /** 字段路徑（支持嵌套，如 'address.city'） */
  path: string;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤類型 */
  type: string;
  /** 期望的值（如適用） */
  expected?: unknown;
  /** 實際的值（如適用） */
  received?: unknown;
}

/**
 * Action 錯誤類型
 */
export interface ActionError extends Omit<ApiError, 'statusCode'> {
  /** 表單驗證錯誤（如適用） */
  validationErrors?: FormValidationError[];
  /** 是否可重試 */
  retryable?: boolean;
}

/**
 * Server Action 統一結果類型
 * @template T 成功時的數據類型
 */
export interface ActionResult<T = unknown> {
  /** 操作是否成功 */
  success: boolean;
  /** 成功時的數據 */
  data?: T;
  /** 失敗時的錯誤 */
  error?: ActionError;
  /** 執行上下文 */
  context?: ActionContext;
}

/**
 * 帶重定向的 Action 結果
 */
export interface ActionResultWithRedirect<T = unknown> extends ActionResult<T> {
  /** 重定向 URL */
  redirectTo?: string;
}

/**
 * 帶通知的 Action 結果
 */
export interface ActionResultWithNotification<T = unknown> extends ActionResult<T> {
  /** 通知訊息 */
  notification?: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  };
}

/**
 * 文件上傳 Action 結果
 */
export interface FileUploadActionResult
  extends ActionResult<{
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url?: string;
  }> {}

/**
 * 批量操作 Action 結果
 */
export interface BatchActionResult<T = unknown>
  extends ActionResult<{
    succeeded: T[];
    failed: Array<{ item: T; error: ActionError }>;
    summary: {
      total: number;
      succeeded: number;
      failed: number;
    };
  }> {}

// ============= 輔助函數 =============

/**
 * 創建成功的 Action 結果
 */
export function createActionSuccess<T>(data: T, context?: Partial<ActionContext>): ActionResult<T> {
  return {
    success: true,
    data,
    context: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...context,
    },
  };
}

/**
 * 創建失敗的 Action 結果
 */
export function createActionError(
  error: ActionError,
  context?: Partial<ActionContext>
): ActionResult<never> {
  return {
    success: false,
    error,
    context: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...context,
    },
  };
}

/**
 * 從 Zod 錯誤創建驗證錯誤結果
 */
export function createValidationError(
  zodError: z.ZodError,
  context?: Partial<ActionContext>
): ActionResult<never> {
  const validationErrors: FormValidationError[] = zodError.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    type: err.code,
    expected: (err as any).expected,
    received: (err as any).received,
  }));

  return createActionError(
    {
      code: 'VALIDATION_ERROR',
      message: 'Form validation failed',
      validationErrors,
    },
    context
  );
}

/**
 * 從異常創建錯誤結果
 */
export function createErrorFromException(
  error: unknown,
  context?: Partial<ActionContext>
): ActionResult<never> {
  if (error instanceof Error) {
    return createActionError(
      {
        code: 'SYSTEM_INTERNAL_ERROR',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      context
    );
  }

  return createActionError(
    {
      code: 'SYSTEM_INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    context
  );
}

/**
 * 帶重定向的成功結果
 */
export function createActionSuccessWithRedirect<T>(
  data: T,
  redirectTo: string,
  context?: Partial<ActionContext>
): ActionResultWithRedirect<T> {
  return {
    ...createActionSuccess(data, context),
    redirectTo,
  };
}

/**
 * 帶通知的成功結果
 */
export function createActionSuccessWithNotification<T>(
  data: T,
  notification: ActionResultWithNotification<T>['notification'],
  context?: Partial<ActionContext>
): ActionResultWithNotification<T> {
  return {
    ...createActionSuccess(data, context),
    notification,
  };
}

/**
 * 類型守衛：檢查是否為成功結果
 */
export function isActionSuccess<T>(
  result: ActionResult<T>
): result is ActionResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined;
}

/**
 * 類型守衛：檢查是否為錯誤結果
 */
export function isActionError<T>(
  result: ActionResult<T>
): result is ActionResult<T> & { success: false; error: ActionError } {
  return !result.success && result.error !== undefined;
}

/**
 * 類型守衛：檢查是否有驗證錯誤
 */
export function hasValidationErrors(
  result: ActionResult<unknown>
): result is ActionResult<never> & {
  error: ActionError & { validationErrors: FormValidationError[] };
} {
  return (
    isActionError(result) &&
    result.error.code === 'VALIDATION_ERROR' &&
    Array.isArray(result.error.validationErrors) &&
    result.error.validationErrors.length > 0
  );
}

/**
 * 安全執行 Server Action
 * 自動處理異常並返回標準化結果
 */
export async function safeActionExecute<T>(
  fn: () => Promise<T>,
  context?: Partial<ActionContext>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return createActionSuccess(data, context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationError(error, context);
    }
    return createErrorFromException(error, context);
  }
}
