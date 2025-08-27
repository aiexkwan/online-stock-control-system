/**
 * useEnhancedErrorHandling Hook
 * 提供增強的錯誤處理和恢復機制，專為並行 PDF 生成優化
 */

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/types/error-handling';
import { systemLogger } from '@/lib/logger';

export interface ErrorDetails {
  id: string;
  type: 'pdf_generation' | 'upload' | 'database' | 'validation' | 'network' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'skip' | 'fallback' | 'manual';
  delay?: number;
  maxAttempts?: number;
  fallbackAction?: () => Promise<void>;
}

export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  enableAutoRecovery: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  toastNotifications: boolean;
  aggregateErrors: boolean;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoveredErrors: number;
  permanentFailures: number;
  averageRecoveryTime: number;
  errorRate: number;
}

interface UseEnhancedErrorHandlingReturn {
  errors: ErrorDetails[];
  errorStats: ErrorStatistics;
  handleError: (error: unknown, context?: Record<string, unknown>) => Promise<ErrorDetails>;
  retryError: (errorId: string) => Promise<boolean>;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  getRecoveryStrategy: (error: ErrorDetails) => ErrorRecoveryStrategy;
  isRetryable: (error: unknown) => boolean;
  categorizeError: (error: unknown) => { type: ErrorDetails['type']; severity: ErrorDetails['severity'] };
  exportErrorReport: () => string;
}

const DEFAULT_CONFIG: ErrorHandlingConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  enableAutoRecovery: true,
  logLevel: 'error',
  toastNotifications: true,
  aggregateErrors: true,
};

export const useEnhancedErrorHandling = (
  config: Partial<ErrorHandlingConfig> = {}
): UseEnhancedErrorHandlingReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [errors, setErrors] = useState<ErrorDetails[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStatistics>({
    totalErrors: 0,
    errorsByType: {},
    errorsBySeverity: {},
    recoveredErrors: 0,
    permanentFailures: 0,
    averageRecoveryTime: 0,
    errorRate: 0,
  });

  const recoveryTimeTracker = useRef<Map<string, number>>(new Map());
  const errorStartTime = useRef<number>(Date.now());

  /**
   * 錯誤分類邏輯
   */
  const categorizeError = useCallback((error: unknown): { type: ErrorDetails['type']; severity: ErrorDetails['severity'] } => {
    const message = getErrorMessage(error).toLowerCase();
    
    // PDF 生成錯誤
    if (message.includes('pdf') || message.includes('blob') || message.includes('render')) {
      return {
        type: 'pdf_generation',
        severity: message.includes('memory') || message.includes('timeout') ? 'high' : 'medium'
      };
    }
    
    // 上傳錯誤
    if (message.includes('upload') || message.includes('storage') || message.includes('bucket')) {
      return {
        type: 'upload',
        severity: message.includes('quota') || message.includes('permission') ? 'high' : 'medium'
      };
    }
    
    // 數據庫錯誤
    if (message.includes('database') || message.includes('sql') || message.includes('supabase')) {
      return {
        type: 'database',
        severity: message.includes('connection') || message.includes('timeout') ? 'high' : 'medium'
      };
    }
    
    // 驗證錯誤
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'validation',
        severity: 'low'
      };
    }
    
    // 網路錯誤
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        severity: message.includes('timeout') ? 'high' : 'medium'
      };
    }
    
    // 未知錯誤
    return {
      type: 'unknown',
      severity: 'medium'
    };
  }, []);

  /**
   * 判斷錯誤是否可重試
   */
  const isRetryable = useCallback((error: unknown): boolean => {
    const message = getErrorMessage(error).toLowerCase();
    
    // 不可重試的錯誤類型
    const nonRetryablePatterns = [
      'validation',
      'invalid',
      'required',
      'unauthorized',
      'forbidden',
      'not found',
      'cancelled',
      'aborted'
    ];
    
    return !nonRetryablePatterns.some(pattern => message.includes(pattern));
  }, []);

  /**
   * 獲取錯誤恢復策略
   */
  const getRecoveryStrategy = useCallback((error: ErrorDetails): ErrorRecoveryStrategy => {
    switch (error.type) {
      case 'network':
      case 'upload':
        return {
          type: 'retry',
          delay: finalConfig.retryDelayMs * Math.pow(finalConfig.backoffMultiplier, error.retryCount),
          maxAttempts: finalConfig.maxRetries,
        };
      
      case 'pdf_generation':
        if (error.severity === 'high') {
          return {
            type: 'fallback',
            fallbackAction: async () => {
              // 可以實現降級策略，如減少 PDF 品質或使用不同的生成器
              systemLogger.info('Implementing PDF generation fallback strategy');
            },
          };
        }
        return {
          type: 'retry',
          delay: finalConfig.retryDelayMs,
          maxAttempts: 2,
        };
      
      case 'validation':
        return {
          type: 'manual',
        };
      
      case 'database':
        return {
          type: 'retry',
          delay: finalConfig.retryDelayMs * 2,
          maxAttempts: finalConfig.maxRetries,
        };
      
      default:
        return error.retryable ? {
          type: 'retry',
          delay: finalConfig.retryDelayMs,
          maxAttempts: finalConfig.maxRetries,
        } : {
          type: 'manual',
        };
    }
  }, [finalConfig]);

  /**
   * 處理錯誤
   */
  const handleError = useCallback(async (error: unknown, context?: Record<string, unknown>): Promise<ErrorDetails> => {
    const { type, severity } = categorizeError(error);
    const retryable = isRetryable(error);
    
    const errorDetails: ErrorDetails = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message: getErrorMessage(error),
      context,
      timestamp: Date.now(),
      retryable,
      retryCount: 0,
      maxRetries: retryable ? finalConfig.maxRetries : 0,
    };

    // 記錄錯誤
    systemLogger.error(
      {
        errorId: errorDetails.id,
        type: errorDetails.type,
        severity: errorDetails.severity,
        message: errorDetails.message,
        context,
      },
      '[Enhanced Error Handling] Error occurred'
    );

    // 更新狀態
    setErrors(prev => [...prev, errorDetails]);
    
    // 更新統計
    setErrorStats(prev => {
      const newStats = { ...prev };
      newStats.totalErrors++;
      newStats.errorsByType[type] = (newStats.errorsByType[type] || 0) + 1;
      newStats.errorsBySeverity[severity] = (newStats.errorsBySeverity[severity] || 0) + 1;
      
      // 計算錯誤率
      const timeElapsed = (Date.now() - errorStartTime.current) / 1000 / 60; // 分鐘
      newStats.errorRate = timeElapsed > 0 ? newStats.totalErrors / timeElapsed : 0;
      
      return newStats;
    });

    // 顯示通知
    if (finalConfig.toastNotifications) {
      if (severity === 'critical' || severity === 'high') {
        toast.error(`Critical Error: ${errorDetails.message.substring(0, 100)}${errorDetails.message.length > 100 ? '...' : ''}`);
      } else if (severity === 'medium') {
        toast.warning(`Warning: ${errorDetails.message.substring(0, 80)}${errorDetails.message.length > 80 ? '...' : ''}`);
      }
    }

    // 自動恢復
    if (finalConfig.enableAutoRecovery && retryable && errorDetails.retryCount < errorDetails.maxRetries) {
      const strategy = getRecoveryStrategy(errorDetails);
      if (strategy.type === 'retry' && strategy.delay) {
        recoveryTimeTracker.current.set(errorDetails.id, Date.now());
        
        setTimeout(async () => {
          await retryError(errorDetails.id);
        }, strategy.delay);
      }
    }

    return errorDetails;
  }, [categorizeError, isRetryable, finalConfig, getRecoveryStrategy]);

  /**
   * 重試錯誤
   */
  const retryError = useCallback(async (errorId: string): Promise<boolean> => {
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.retryable || error.retryCount >= error.maxRetries) {
      return false;
    }

    try {
      // 更新重試計數
      setErrors(prev => 
        prev.map(e => 
          e.id === errorId 
            ? { ...e, retryCount: e.retryCount + 1 }
            : e
        )
      );

      // 記錄重試
      systemLogger.info(
        {
          errorId,
          retryCount: error.retryCount + 1,
          maxRetries: error.maxRetries,
        },
        '[Enhanced Error Handling] Retrying error'
      );

      // 這裡應該實際執行重試邏輯
      // 由於這是一個通用的錯誤處理 hook，具體的重試邏輯需要在使用方實現
      
      return true;
    } catch (retryError) {
      systemLogger.error(
        {
          errorId,
          retryError: getErrorMessage(retryError),
        },
        '[Enhanced Error Handling] Retry failed'
      );
      return false;
    }
  }, [errors]);

  /**
   * 清除單個錯誤
   */
  const clearError = useCallback((errorId: string) => {
    const startTime = recoveryTimeTracker.current.get(errorId);
    
    setErrors(prev => prev.filter(e => e.id !== errorId));
    
    if (startTime) {
      const recoveryTime = Date.now() - startTime;
      recoveryTimeTracker.current.delete(errorId);
      
      setErrorStats(prev => {
        const newStats = { ...prev };
        newStats.recoveredErrors++;
        
        // 更新平均恢復時間
        const totalRecoveryTime = (newStats.averageRecoveryTime * (newStats.recoveredErrors - 1)) + recoveryTime;
        newStats.averageRecoveryTime = totalRecoveryTime / newStats.recoveredErrors;
        
        return newStats;
      });
    }
  }, []);

  /**
   * 清除所有錯誤
   */
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    recoveryTimeTracker.current.clear();
    setErrorStats({
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoveredErrors: 0,
      permanentFailures: 0,
      averageRecoveryTime: 0,
      errorRate: 0,
    });
    errorStartTime.current = Date.now();
  }, []);

  /**
   * 導出錯誤報告
   */
  const exportErrorReport = useCallback((): string => {
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: errorStats,
      errors: errors.map(error => ({
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        retryCount: error.retryCount,
        context: error.context,
      })),
    };

    return JSON.stringify(report, null, 2);
  }, [errors, errorStats]);

  return {
    errors,
    errorStats,
    handleError,
    retryError,
    clearError,
    clearAllErrors,
    getRecoveryStrategy,
    isRetryable,
    categorizeError,
    exportErrorReport,
  };
};