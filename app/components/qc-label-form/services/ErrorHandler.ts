'use client';

import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
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

export class ErrorHandler {
  private static instance: ErrorHandler;
  private supabase = createClient();
  private errorReports: ErrorReport[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle form validation errors
   */
  public handleValidationError(
    fieldName: string,
    error: string,
    context: ErrorContext
  ): void {
    console.warn(`[${context.component}] Validation error in ${fieldName}: ${error}`);
    
    // Don't show toast for validation errors as they're handled by the form UI
    // Just log for debugging purposes
    this.logError(new Error(`Validation: ${fieldName} - ${error}`), {
      ...context,
      action: 'validation',
      additionalData: { fieldName, validationError: error }
    }, 'low');
  }

  /**
   * Handle API/Database errors
   */
  public handleApiError(
    error: Error,
    context: ErrorContext,
    userFriendlyMessage?: string
  ): void {
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
   * Handle network/connection errors
   */
  public handleNetworkError(
    error: Error,
    context: ErrorContext
  ): void {
    console.error(`[${context.component}] Network Error in ${context.action}:`, error);
    
    toast.error('Network connection issue. Please check your internet connection and try again.', {
      id: `network-${context.component}`,
      duration: 8000,
    });

    this.logError(error, context, 'medium');
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(
    error: Error,
    context: ErrorContext
  ): void {
    console.error(`[${context.component}] Auth Error in ${context.action}:`, error);
    
    toast.error('Authentication failed. Please log in again.', {
      id: 'auth-error',
      duration: 6000,
    });

    this.logError(error, context, 'high');
  }

  /**
   * Handle PDF generation errors
   */
  public handlePdfError(
    error: Error,
    context: ErrorContext,
    palletNumber?: string
  ): void {
    const userMessage = palletNumber 
      ? `Failed to generate PDF for pallet ${palletNumber}. Please try again.`
      : 'PDF generation failed. Please try again.';
    
    console.error(`[${context.component}] PDF Error in ${context.action}:`, error);
    
    toast.error(userMessage, {
      id: `pdf-${palletNumber || 'unknown'}`,
      duration: 6000,
    });

    this.logError(error, {
      ...context,
      additionalData: { ...context.additionalData, palletNumber }
    }, 'medium');
  }

  /**
   * Handle success messages
   */
  public handleSuccess(
    message: string,
    context: ErrorContext,
    details?: string
  ): void {
    console.log(`[${context.component}] Success in ${context.action}: ${message}`);
    
    toast.success(message, {
      id: `success-${context.component}-${context.action}`,
      duration: 3000,
    });

    // Log success for analytics
    this.logSuccess(message, context, details);
  }

  /**
   * Handle warning messages
   */
  public handleWarning(
    message: string,
    context: ErrorContext,
    showToast: boolean = true
  ): void {
    console.warn(`[${context.component}] Warning in ${context.action}: ${message}`);
    
    if (showToast) {
      toast.warning(message, {
        id: `warning-${context.component}`,
        duration: 4000,
      });
    }
  }

  /**
   * Handle info messages
   */
  public handleInfo(
    message: string,
    context: ErrorContext,
    showToast: boolean = true
  ): void {
    console.info(`[${context.component}] Info in ${context.action}: ${message}`);
    
    if (showToast) {
      toast.info(message, {
        id: `info-${context.component}`,
        duration: 3000,
      });
    }
  }

  /**
   * Log error to database for monitoring
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
      technicalMessage: error.message
    };

    // Store in memory for debugging
    this.errorReports.push(errorReport);

    // Log to database (optional, for production monitoring)
    try {
      if (context.userId) {
        await this.supabase.from('record_history').insert({
          time: errorReport.timestamp,
          id: parseInt(context.userId, 10) || 0,
          plt_num: null,
          loc: null,
          action: `Error: ${context.component} - ${context.action}`,
          remark: `${severity.toUpperCase()}: ${error.message}`
        });
      }
    } catch (dbError) {
      console.error('[ErrorHandler] Failed to log error to database:', dbError);
    }
  }

  /**
   * Log success events
   */
  private async logSuccess(
    message: string,
    context: ErrorContext,
    details?: string
  ): Promise<void> {
    try {
      if (context.userId) {
        await this.supabase.from('record_history').insert({
          time: new Date().toISOString(),
          id: parseInt(context.userId, 10) || 0,
          plt_num: null,
          loc: null,
          action: `Success: ${context.component} - ${context.action}`,
          remark: details || message
        });
      }
    } catch (dbError) {
      console.error('[ErrorHandler] Failed to log success to database:', dbError);
    }
  }

  /**
   * Determine error severity based on error type and context
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
   * Generate user-friendly error messages
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
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error reports for debugging
   */
  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * Clear error reports
   */
  public clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.errorReports.length,
      bySeverity: {} as Record<string, number>,
      byComponent: {} as Record<string, number>
    };

    this.errorReports.forEach(report => {
      // Count by severity
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
      
      // Count by component
      stats.byComponent[report.context.component] = (stats.byComponent[report.context.component] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance(); 