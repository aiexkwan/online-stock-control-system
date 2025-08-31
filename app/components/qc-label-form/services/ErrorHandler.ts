'use client';

// 使用動態導入避免編譯時的模組解析問題
const toast = (() => {
  if (typeof window !== 'undefined') {
    try {
      const { toast } = require('sonner');
      return toast;
    } catch {
      return {
        error: (message: string, options?: any) => console.error('[Toast]', message),
        success: (message: string, options?: any) => console.log('[Toast]', message),
        warning: (message: string, options?: any) => console.warn('[Toast]', message),
        info: (message: string, options?: any) => console.info('[Toast]', message),
      };
    }
  }
  return {
    error: (message: string, options?: any) => console.error('[Toast]', message),
    success: (message: string, options?: any) => console.log('[Toast]', message),
    warning: (message: string, options?: any) => console.warn('[Toast]', message),
    info: (message: string, options?: any) => console.info('[Toast]', message),
  };
})();

// 導入正確的 Supabase 類型
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/database/supabase';

// 定義正確的 Supabase 客戶端類型
type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * 錯誤上下文信息，用於追蹤錯誤發生的組件和操作
 */
export interface ErrorContext {
  /** 發生錯誤的組件名稱 */
  readonly component: string;
  /** 發生錯誤的操作名稱 */
  readonly action: string;
  /** 用戶ID，用於錯誤追蹤 */
  readonly userId?: string;
  /** 額外的上下文數據 */
  readonly additionalData?: Record<string, unknown>;
}

/**
 * 錯誤報告結構，包含完整的錯誤信息
 */
export interface ErrorReport {
  /** 唯一錯誤ID */
  readonly id: string;
  /** 錯誤發生時間戳 */
  readonly timestamp: string;
  /** 錯誤上下文 */
  readonly context: ErrorContext;
  /** 錯誤對象 */
  readonly error: Error;
  /** 錯誤嚴重程度 */
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  /** 用戶友好錯誤消息 */
  readonly userMessage: string;
  /** 技術錯誤消息 */
  readonly technicalMessage: string;
}

/**
 * 錯誤統計結構
 */
export interface ErrorStats {
  /** 總錯誤數 */
  readonly total: number;
  /** 按嚴重程度統計 */
  readonly bySeverity: Record<string, number>;
  /** 按組件統計 */
  readonly byComponent: Record<string, number>;
}

/**
 * 企業級錯誤處理器 - 單例模式
 *
 * 提供統一的錯誤處理、日誌記錄和用戶提示功能。
 * 支持多種錯誤類型和嚴重程度級別，確保系統穩定性和可觀測性。
 *
 * @example
 * ```typescript
 * const errorHandler = ErrorHandler.getInstance();
 * errorHandler.handleApiError(error, { component: 'ProductForm', action: 'save' });
 * ```
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private supabase: TypedSupabaseClient | null = null;
  private readonly errorReports: ErrorReport[] = [];

  private constructor() {}

  /**
   * 獲取 Supabase 客戶端實例
   * @returns Supabase 客戶端或 null
   */
  private getSupabase(): TypedSupabaseClient | null {
    if (!this.supabase && typeof window !== 'undefined') {
      try {
        // 動態導入以避免模塊解析問題
        // 使用動態 import() 而非 require() 以獲得更好的類型支援
        const createClientModule = require('@/app/utils/supabase/client');
        this.supabase = createClientModule.createClient() as TypedSupabaseClient;
      } catch (error) {
        console.warn('[ErrorHandler] Failed to initialize Supabase client:', error);
        return null;
      }
    }
    return this.supabase;
  }

  /**
   * 獲取錯誤處理器單例實例
   * @returns ErrorHandler 實例
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 處理表單驗證錯誤
   *
   * @param fieldName - 發生錯誤的字段名稱
   * @param error - 錯誤消息
   * @param context - 錯誤上下文
   *
   * @example
   * ```typescript
   * errorHandler.handleValidationError('productCode', 'Product code is required', {
   *   component: 'ProductForm',
   *   action: 'validation'
   * });
   * ```
   */
  public handleValidationError(fieldName: string, error: string, context: ErrorContext): void {
    console.warn(`[${context.component}] Validation error in ${fieldName}: ${error}`);

    // Don't show toast for validation errors as they're handled by the form UI
    // Just log for debugging purposes
    this.logError(
      new Error(`Validation: ${fieldName} - ${error}`),
      {
        ...context,
        action: 'validation',
        additionalData: { fieldName, validationError: error },
      },
      'low'
    );
  }

  /**
   * 處理 API/資料庫錯誤
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   * @param userFriendlyMessage - 自定義用戶友好錯誤消息
   *
   * @example
   * ```typescript
   * errorHandler.handleApiError(error, {
   *   component: 'ProductForm',
   *   action: 'save',
   *   userId: '123'
   * }, 'Failed to save product');
   * ```
   */
  public handleApiError(error: Error, context: ErrorContext, userFriendlyMessage?: string): void {
    const severity = this.determineSeverity(error);
    const userMessage = userFriendlyMessage || this.generateUserMessage(error, context);

    console.error(`[${context.component}] API Error in ${context.action}:`, error);

    // Show user-friendly toast
    toast.error(userMessage, {
      id: `${context.component}-${context.action}`,
      duration: severity === 'critical' ? 10000 : 5000,
    });

    // Log detailed error
    this.logError(error, context, severity);
  }

  /**
   * 處理網絡/連接錯誤
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   */
  public handleNetworkError(error: Error, context: ErrorContext): void {
    console.error(`[${context.component}] Network Error in ${context.action}:`, error);

    toast.error('Network connection issue. Please check your internet connection and try again.', {
      id: `network-${context.component}`,
      duration: 8000,
    });

    this.logError(error, context, 'medium');
  }

  /**
   * 處理認證錯誤
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   */
  public handleAuthError(error: Error, context: ErrorContext): void {
    console.error(`[${context.component}] Auth Error in ${context.action}:`, error);

    toast.error('Authentication failed. Please log in again.', {
      id: 'auth-error',
      duration: 6000,
    });

    this.logError(error, context, 'high');
  }

  /**
   * 處理 PDF 生成錯誤
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   * @param palletNumber - 可選的棧板號碼
   */
  public handlePdfError(error: Error, context: ErrorContext, palletNumber?: string): void {
    const userMessage = palletNumber
      ? `Failed to generate PDF for pallet ${palletNumber}. Please try again.`
      : 'PDF generation failed. Please try again.';

    console.error(`[${context.component}] PDF Error in ${context.action}:`, error);

    toast.error(userMessage, {
      id: `pdf-${palletNumber || 'unknown'}`,
      duration: 6000,
    });

    this.logError(
      error,
      {
        ...context,
        additionalData: { ...context.additionalData, palletNumber },
      },
      'medium'
    );
  }

  /**
   * 處理成功消息
   *
   * @param message - 成功消息
   * @param context - 錯誤上下文
   * @param details - 可選的詳細信息
   */
  public handleSuccess(message: string, context: ErrorContext, details?: string): void {
    console.log(`[${context.component}] Success in ${context.action}: ${message}`);

    toast.success(message, {
      id: `success-${context.component}-${context.action}`,
      duration: 3000,
    });

    // Log success for analytics
    this.logSuccess(message, context, details);
  }

  /**
   * 處理警告消息
   *
   * @param message - 警告消息
   * @param context - 錯誤上下文
   * @param showToast - 是否顯示吐司提示，默認為 true
   */
  public handleWarning(message: string, context: ErrorContext, showToast: boolean = true): void {
    console.warn(`[${context.component}] Warning in ${context.action}: ${message}`);

    if (showToast) {
      toast.warning(message, {
        id: `warning-${context.component}`,
        duration: 4000,
      });
    }
  }

  /**
   * 處理信息消息
   *
   * @param message - 信息消息
   * @param context - 錯誤上下文
   * @param showToast - 是否顯示吐司提示，默認為 true
   */
  public handleInfo(message: string, context: ErrorContext, showToast: boolean = true): void {
    console.info(`[${context.component}] Info in ${context.action}: ${message}`);

    if (showToast) {
      toast.info(message, {
        id: `info-${context.component}`,
        duration: 3000,
      });
    }
  }

  /**
   * 記錄錯誤到資料庫用於監控
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   * @param severity - 錯誤嚴重程度
   * @private
   */
  private async logError(
    error: Error,
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      context,
      error,
      severity,
      userMessage: this.generateUserMessage(error, context),
      technicalMessage: error.message,
    };

    // Store in memory for debugging
    // 使用類型斷言來避免 readonly 衝突
    (this.errorReports as ErrorReport[]).push(errorReport);

    // Log to database (optional, for production monitoring)
    try {
      const supabase = this.getSupabase();
      if (context.userId && supabase) {
        await supabase.from('record_history').insert({
          time: errorReport.timestamp,
          id: parseInt(context.userId, 10) || 0,
          plt_num: null,
          loc: null,
          action: `Error: ${context.component} - ${context.action}`,
          remark: `${severity.toUpperCase()}: ${error.message}`,
        });
      }
    } catch (dbError) {
      console.error('[ErrorHandler] Failed to log error to database:', dbError);
    }
  }

  /**
   * 記錄成功事件
   *
   * @param message - 成功消息
   * @param context - 錯誤上下文
   * @param details - 可選的詳細信息
   * @private
   */
  private async logSuccess(
    message: string,
    context: ErrorContext,
    details?: string
  ): Promise<void> {
    try {
      const supabase = this.getSupabase();
      if (context.userId && supabase) {
        await supabase.from('record_history').insert({
          time: new Date().toISOString(),
          id: parseInt(context.userId, 10) || 0,
          plt_num: null,
          loc: null,
          action: `Success: ${context.component} - ${context.action}`,
          remark: details || message,
        });
      }
    } catch (dbError) {
      console.error('[ErrorHandler] Failed to log success to database:', dbError);
    }
  }

  /**
   * 根據錯誤類型和上下文確定錯誤嚴重程度
   *
   * @param error - 錯誤對象
   * @returns 錯誤嚴重程度級別
   * @private
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'medium';
    }

    if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
      return 'high';
    }

    if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
      return 'high';
    }

    if (errorMessage.includes('pdf') || errorMessage.includes('generation')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 生成用戶友好的錯誤消息
   *
   * @param error - 錯誤對象
   * @param context - 錯誤上下文
   * @returns 用戶友好的錯誤消息
   * @private
   */
  private generateUserMessage(error: Error, context: ErrorContext): string {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
      return 'Authentication failed. Please log in again.';
    }

    if (errorMessage.includes('not found')) {
      return 'The requested information was not found. Please check your input and try again.';
    }

    if (errorMessage.includes('timeout')) {
      return 'The operation timed out. Please try again.';
    }

    if (context.action === 'product_search') {
      return 'Failed to search for product information. Please try again.';
    }

    if (context.action === 'pdf_generation') {
      return 'Failed to generate PDF. Please try again.';
    }

    if (context.action === 'form_submission') {
      return 'Failed to submit form. Please check your input and try again.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * 生成唯一錯誤ID
   *
   * @returns 唯一錯誤ID
   * @private
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 獲取錯誤報告用於調試
   *
   * @returns 錯誤報告副本
   */
  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * 清除錯誤報告
   */
  public clearErrorReports(): void {
    // 使用類型斷言來避免 readonly 衝突
    (this.errorReports as ErrorReport[]).length = 0;
  }

  /**
   * 獲取錯誤統計信息
   *
   * @returns 包含總數、按嚴重程度和組件統計的錯誤統計
   */
  public getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errorReports.length,
      bySeverity: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
    };

    this.errorReports.forEach(report => {
      // Count by severity
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;

      // Count by component
      stats.byComponent[report.context.component] =
        (stats.byComponent[report.context.component] || 0) + 1;
    });

    return stats;
  }
}

/**
 * 錯誤處理器代理對象 - 避免 SSR 問題的惰性初始化
 *
 * 提供企業級錯誤處理的統一接口，支持多種錯誤類型和場景。
 * 使用單例模式確保全局唯一的錯誤處理實例。
 *
 * @example
 * ```typescript
 * import { errorHandler } from './services/ErrorHandler';
 *
 * // 處理 API 錯誤
 * errorHandler.handleApiError(error, {
 *   component: 'ProductForm',
 *   action: 'save',
 *   userId: '123'
 * });
 *
 * // 處理成功消息
 * errorHandler.handleSuccess('Product saved successfully', {
 *   component: 'ProductForm',
 *   action: 'save'
 * });
 * ```
 */
export const errorHandler = {
  /** 處理表單驗證錯誤 */
  handleValidationError: (...args: Parameters<ErrorHandler['handleValidationError']>) =>
    ErrorHandler.getInstance().handleValidationError(...args),
  /** 處理 API/資料庫錯誤 */
  handleApiError: (...args: Parameters<ErrorHandler['handleApiError']>) =>
    ErrorHandler.getInstance().handleApiError(...args),
  /** 處理網絡/連接錯誤 */
  handleNetworkError: (...args: Parameters<ErrorHandler['handleNetworkError']>) =>
    ErrorHandler.getInstance().handleNetworkError(...args),
  /** 處理認證錯誤 */
  handleAuthError: (...args: Parameters<ErrorHandler['handleAuthError']>) =>
    ErrorHandler.getInstance().handleAuthError(...args),
  /** 處理 PDF 生成錯誤 */
  handlePdfError: (...args: Parameters<ErrorHandler['handlePdfError']>) =>
    ErrorHandler.getInstance().handlePdfError(...args),
  /** 處理成功消息 */
  handleSuccess: (...args: Parameters<ErrorHandler['handleSuccess']>) =>
    ErrorHandler.getInstance().handleSuccess(...args),
  /** 處理警告消息 */
  handleWarning: (...args: Parameters<ErrorHandler['handleWarning']>) =>
    ErrorHandler.getInstance().handleWarning(...args),
  /** 處理信息消息 */
  handleInfo: (...args: Parameters<ErrorHandler['handleInfo']>) =>
    ErrorHandler.getInstance().handleInfo(...args),
  /** 獲取錯誤報告 */
  getErrorReports: () => ErrorHandler.getInstance().getErrorReports(),
  /** 清除錯誤報告 */
  clearErrorReports: () => ErrorHandler.getInstance().clearErrorReports(),
  /** 獲取錯誤統計 */
  getErrorStats: () => ErrorHandler.getInstance().getErrorStats(),
} as const;
