'use client';

import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  clockNumber?: string;
  transactionId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  context: ErrorContext;
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalMessage: string;
}

export class GrnErrorHandler {
  private static instance: GrnErrorHandler;
  private supabase: ReturnType<typeof createClient> | null = null;
  private errorReports: ErrorReport[] = [];

  private constructor() {}

  private getSupabase() {
    if (!this.supabase && typeof window !== 'undefined') {
      this.supabase = createClient();
    }
    return this.supabase;
  }

  public static getInstance(): GrnErrorHandler {
    if (!GrnErrorHandler.instance) {
      GrnErrorHandler.instance = new GrnErrorHandler();
    }
    return GrnErrorHandler.instance;
  }

  /**
   * 處理表單驗證錯誤
   */
  public handleValidationError(fieldName: string, error: string, context: ErrorContext): void {
    console.warn(`[${context.component}] Validation error in ${fieldName}: ${error}`);

    // 不顯示 toast，因為驗證錯誤由表單 UI 處理
    // 只記錄用於調試
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
   * 處理供應商驗證錯誤
   */
  public handleSupplierError(
    error: Error | string,
    supplierCode: string,
    context: ErrorContext
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const severity = this.determineSupplierErrorSeverity(errorMessage);

    console.error(`[${context.component}] Supplier Error for ${supplierCode}:`, error);

    // 根據錯誤類型顯示不同的用戶消息
    let userMessage = 'Supplier validation failed. Please check the supplier code.';
    if (errorMessage.includes('not found')) {
      userMessage = `Supplier code "${supplierCode}" not found. Please verify the code.`;
    } else if (errorMessage.includes('inactive')) {
      userMessage = `Supplier "${supplierCode}" is inactive. Please contact admin.`;
    } else if (errorMessage.includes('network')) {
      userMessage = 'Network error while validating supplier. Please try again.';
    }

    toast.error(userMessage, {
      id: `supplier-${supplierCode}`,
      duration: severity === 'high' ? 8000 : 5000,
    });

    this.logError(
      typeof error === 'string' ? new Error(error) : error,
      {
        ...context,
        additionalData: { ...context.additionalData, supplierCode },
      },
      severity
    );
  }

  /**
   * 處理托盤號生成錯誤
   */
  public handlePalletGenerationError(error: Error, context: ErrorContext, count?: number): void {
    const severity = this.determinePalletErrorSeverity(error);
    const userMessage = this.generatePalletErrorMessage(error, count);

    console.error(`[${context.component}] Pallet Generation Error:`, error);

    toast.error(userMessage, {
      id: 'pallet-generation',
      duration: severity === 'critical' ? 10000 : 6000,
    });

    this.logError(
      error,
      {
        ...context,
        additionalData: { ...context.additionalData, requestedCount: count },
      },
      severity
    );
  }

  /**
   * 處理數據庫錯誤
   */
  public handleDatabaseError(
    error: Error | string,
    context: ErrorContext,
    operation?: string
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const severity = this.determineDatabaseErrorSeverity(errorMessage);

    console.error(`[${context.component}] Database Error in ${operation}:`, error);

    let userMessage = 'Database operation failed. Please try again.';
    if (errorMessage.includes('already exists')) {
      userMessage = 'This record already exists in the system.';
    } else if (errorMessage.includes('foreign key')) {
      userMessage = 'Invalid reference data. Please check your input.';
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'Database operation timed out. Please try again.';
    }

    toast.error(userMessage, {
      id: `db-${operation || 'unknown'}`,
      duration: severity === 'high' ? 8000 : 5000,
    });

    this.logError(
      typeof error === 'string' ? new Error(error) : error,
      {
        ...context,
        additionalData: { ...context.additionalData, operation },
      },
      severity
    );
  }

  /**
   * 處理 PDF 生成錯誤
   */
  public handlePdfError(
    error: Error,
    context: ErrorContext,
    palletNumber?: string,
    grnNumber?: string
  ): void {
    const userMessage = palletNumber
      ? `Failed to generate PDF for pallet ${palletNumber}. Please try again.`
      : 'PDF generation failed. Please try again.';

    console.error(`[${context.component}] PDF Error:`, error);

    toast.error(userMessage, {
      id: `pdf-${palletNumber || 'unknown'}`,
      duration: 6000,
    });

    this.logError(
      error,
      {
        ...context,
        additionalData: {
          ...context.additionalData,
          palletNumber,
          grnNumber,
        },
      },
      'medium'
    );
  }

  /**
   * 處理重量計算錯誤
   */
  public handleWeightError(
    error: string,
    palletIndex: number,
    weight: string,
    context: ErrorContext
  ): void {
    console.warn(`[${context.component}] Weight Error for pallet ${palletIndex + 1}: ${error}`);

    toast.error(error, {
      id: `weight-${palletIndex}`,
      duration: 4000,
    });

    this.logError(
      new Error(error),
      {
        ...context,
        additionalData: {
          ...context.additionalData,
          palletIndex,
          weight,
        },
      },
      'low'
    );
  }

  /**
   * 處理成功消息
   */
  public handleSuccess(message: string, context: ErrorContext, details?: string): void {
    console.log(`[${context.component}] Success in ${context.action}: ${message}`);

    toast.success(message, {
      id: `success-${context.component}-${context.action}`,
      duration: 3000,
    });

    this.logSuccess(message, context, details);
  }

  /**
   * 處理警告消息
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
   * 記錄錯誤到數據庫
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

    // 儲存在內存中用於調試
    this.errorReports.push(errorReport);

    // 記錄到數據庫（可選，用於生產監控）
    try {
      if (context.clockNumber) {
        const supabase = this.getSupabase();
        if (supabase) {
          await supabase.from('record_history').insert({
          time: errorReport.timestamp,
          id: parseInt(context.clockNumber, 10) || 0,
          plt_num: null,
          loc: null,
          action: `GRN Error: ${context.component} - ${context.action}`,
          remark: `${severity.toUpperCase()}: ${error.message}`,
        });
        }
      }
    } catch (dbError) {
      console.error('[GrnErrorHandler] Failed to log error to database:', dbError);
    }
  }

  /**
   * 記錄成功事件
   */
  private async logSuccess(
    message: string,
    context: ErrorContext,
    details?: string
  ): Promise<void> {
    try {
      if (context.clockNumber) {
        const supabase = this.getSupabase();
        if (supabase) {
          await supabase.from('record_history').insert({
          time: new Date().toISOString(),
          id: parseInt(context.clockNumber, 10) || 0,
          plt_num: null,
          loc: null,
          action: `GRN Success: ${context.component} - ${context.action}`,
          remark: details || message,
        });
        }
      }
    } catch (dbError) {
      console.error('[GrnErrorHandler] Failed to log success to database:', dbError);
    }
  }

  /**
   * 確定供應商錯誤嚴重性
   */
  private determineSupplierErrorSeverity(
    errorMessage: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = errorMessage.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }

    if (message.includes('not found') || message.includes('invalid')) {
      return 'low';
    }

    if (message.includes('database') || message.includes('supabase')) {
      return 'high';
    }

    return 'low';
  }

  /**
   * 確定托盤錯誤嚴重性
   */
  private determinePalletErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    if (message.includes('exhausted') || message.includes('no available')) {
      return 'critical';
    }

    if (message.includes('timeout') || message.includes('network')) {
      return 'high';
    }

    if (message.includes('rollback') || message.includes('cleanup')) {
      return 'medium';
    }

    return 'medium';
  }

  /**
   * 確定數據庫錯誤嚴重性
   */
  private determineDatabaseErrorSeverity(
    errorMessage: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = errorMessage.toLowerCase();

    if (message.includes('connection') || message.includes('unavailable')) {
      return 'critical';
    }

    if (message.includes('timeout') || message.includes('deadlock')) {
      return 'high';
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * 生成托盤錯誤消息
   */
  private generatePalletErrorMessage(error: Error, count?: number): string {
    const message = error.message.toLowerCase();

    if (message.includes('exhausted') || message.includes('no available')) {
      return 'No available pallet numbers. Please wait or contact admin.';
    }

    if (message.includes('timeout')) {
      return 'Pallet generation timed out. Please try again.';
    }

    if (message.includes('network')) {
      return 'Network error during pallet generation. Please check connection.';
    }

    if (count) {
      return `Failed to generate ${count} pallet number${count > 1 ? 's' : ''}. Please try again.`;
    }

    return 'Failed to generate pallet numbers. Please try again.';
  }

  /**
   * 生成用戶友好的錯誤消息
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

    if (context.action === 'supplier_validation') {
      return 'Failed to validate supplier information. Please try again.';
    }

    if (context.action === 'pallet_generation') {
      return 'Failed to generate pallet numbers. Please try again.';
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
   * 生成唯一錯誤 ID
   */
  private generateErrorId(): string {
    return `grn_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取錯誤報告用於調試
   */
  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * 清除錯誤報告
   */
  public clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * 獲取錯誤統計
   */
  public getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byComponent: Record<string, number>;
    byAction: Record<string, number>;
  } {
    const stats = {
      total: this.errorReports.length,
      bySeverity: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    };

    this.errorReports.forEach(report => {
      // 按嚴重性統計
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;

      // 按組件統計
      stats.byComponent[report.context.component] =
        (stats.byComponent[report.context.component] || 0) + 1;

      // 按動作統計
      stats.byAction[report.context.action] = (stats.byAction[report.context.action] || 0) + 1;
    });

    return stats;
  }
}

// 導出單例實例 - lazy initialization to avoid SSR issues
export const grnErrorHandler = {
  handleValidationError: (...args: Parameters<GrnErrorHandler['handleValidationError']>) => 
    GrnErrorHandler.getInstance().handleValidationError(...args),
  handleSupplierError: (...args: Parameters<GrnErrorHandler['handleSupplierError']>) => 
    GrnErrorHandler.getInstance().handleSupplierError(...args),
  handlePalletGenerationError: (...args: Parameters<GrnErrorHandler['handlePalletGenerationError']>) => 
    GrnErrorHandler.getInstance().handlePalletGenerationError(...args),
  handleDatabaseError: (...args: Parameters<GrnErrorHandler['handleDatabaseError']>) => 
    GrnErrorHandler.getInstance().handleDatabaseError(...args),
  handlePdfError: (...args: Parameters<GrnErrorHandler['handlePdfError']>) => 
    GrnErrorHandler.getInstance().handlePdfError(...args),
  handleWeightError: (...args: Parameters<GrnErrorHandler['handleWeightError']>) => 
    GrnErrorHandler.getInstance().handleWeightError(...args),
  handleSuccess: (...args: Parameters<GrnErrorHandler['handleSuccess']>) => 
    GrnErrorHandler.getInstance().handleSuccess(...args),
  handleWarning: (...args: Parameters<GrnErrorHandler['handleWarning']>) => 
    GrnErrorHandler.getInstance().handleWarning(...args),
  handleInfo: (...args: Parameters<GrnErrorHandler['handleInfo']>) => 
    GrnErrorHandler.getInstance().handleInfo(...args),
  getErrorReports: () => GrnErrorHandler.getInstance().getErrorReports(),
  clearErrorReports: () => GrnErrorHandler.getInstance().clearErrorReports(),
  getErrorStats: () => GrnErrorHandler.getInstance().getErrorStats(),
};
