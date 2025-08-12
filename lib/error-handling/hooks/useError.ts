/**
 * Error Handling Hooks
 * 錯誤處理 Hook 集合
 *
 * 提供便捷的錯誤處理、恢復和狀態管理 Hooks
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useError as useErrorContext } from '../ErrorContext';
import type {
  ErrorContext,
  ErrorHandlerOptions,
  ErrorReport,
  ErrorSeverity,
  ErrorCategory,
} from '../types';

// Main useError hook (re-export from context)
export { useError } from '../ErrorContext';

// Enhanced error handler hook with component context
export function useErrorHandler(componentName: string, defaultAction: string = 'unknown') {
  const { handleError, handleSuccess, handleWarning, handleInfo, clearComponentErrors } =
    useErrorContext();

  const createContext = useCallback(
    (action: string = defaultAction, additionalData?: Record<string, unknown>): ErrorContext => ({
      component: componentName,
      action,
      additionalData,
    }),
    [componentName, defaultAction]
  );

  const handleComponentError = useCallback(
    (error: Error, action: string = defaultAction, options?: ErrorHandlerOptions) => {
      const context = createContext(
        action,
        options?.userMessage ? { customMessage: options.userMessage } : undefined
      );
      handleError(error, context, options);
    },
    [handleError, createContext, defaultAction]
  );

  const handleComponentSuccess = useCallback(
    (message: string, action: string = defaultAction, options?: { showToast?: boolean }) => {
      const context = createContext(action);
      handleSuccess(message, context, options);
    },
    [handleSuccess, createContext, defaultAction]
  );

  const handleComponentWarning = useCallback(
    (message: string, action: string = defaultAction, options?: ErrorHandlerOptions) => {
      const context = createContext(action);
      handleWarning(message, context, options);
    },
    [handleWarning, createContext, defaultAction]
  );

  const handleComponentInfo = useCallback(
    (message: string, action: string = defaultAction, options?: ErrorHandlerOptions) => {
      const context = createContext(action);
      handleInfo(message, context, options);
    },
    [handleInfo, createContext, defaultAction]
  );

  const clearErrors = useCallback(() => {
    clearComponentErrors(componentName);
  }, [clearComponentErrors, componentName]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      clearComponentErrors(componentName);
    };
  }, [clearComponentErrors, componentName]);

  return {
    handleError: handleComponentError,
    handleSuccess: handleComponentSuccess,
    handleWarning: handleComponentWarning,
    handleInfo: handleComponentInfo,
    clearErrors,
    createContext,
  };
}

// Async operation error handler
export function useAsyncError() {
  const { handleError } = useErrorContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context: ErrorContext,
      options?: ErrorHandlerOptions
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
        handleError(error, context, options);
        return null;
      }
    },
    [handleError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeAsync,
    isLoading,
    error,
    clearError,
  };
}

// Error retry hook
export function useErrorRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const retry = useCallback(
    async (
      retryFn: () => Promise<void> | void,
      maxRetries: number = 3,
      delayMs: number = 1000,
      backoffMultiplier: number = 2
    ) => {
      if (retryCount >= maxRetries) {
        throw new Error(`Max retries (${maxRetries}) exceeded`);
      }

      setIsRetrying(true);

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, retryCount);

      return new Promise<void>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            await retryFn();
            setRetryCount(0);
            setIsRetrying(false);
            resolve();
          } catch (error) {
            setRetryCount(prev => prev + 1);
            setIsRetrying(false);
            reject(error);
          }
        }, delay);
      });
    },
    [retryCount]
  );

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    resetRetry,
    canRetry: retryCount < 3,
  };
}

// Error state hook for components
export function useComponentErrorState(componentName: string) {
  const { errorState, getComponentErrors, hasComponentErrors, resolveError } = useErrorContext();
  const [localErrors, setLocalErrors] = useState<ErrorReport[]>([]);

  // Update local errors when global state changes
  useEffect(() => {
    const componentErrors = getComponentErrors(componentName);
    setLocalErrors(componentErrors);
  }, [errorState, componentName, getComponentErrors]);

  const hasErrors = hasComponentErrors(componentName);
  const errorCount = localErrors.length;
  const criticalErrors = localErrors.filter(err => err.severity === 'critical');
  const hasCriticalErrors = criticalErrors.length > 0;

  const resolveComponentError = useCallback(
    (errorId: string) => {
      resolveError(errorId);
    },
    [resolveError]
  );

  const getErrorsBySeverity = useCallback(
    (severity: ErrorSeverity) => {
      return localErrors.filter(err => err.severity === severity);
    },
    [localErrors]
  );

  const getErrorsByCategory = useCallback(
    (category: ErrorCategory) => {
      return localErrors.filter(err => err.category === category);
    },
    [localErrors]
  );

  return {
    errors: localErrors,
    hasErrors,
    errorCount,
    criticalErrors,
    hasCriticalErrors,
    resolveError: resolveComponentError,
    getErrorsBySeverity,
    getErrorsByCategory,
  };
}

// Error analytics hook
export function useErrorAnalytics() {
  const { errorState } = useErrorContext();
  const [analytics, setAnalytics] = useState({
    totalErrors: 0,
    errorsByComponent: {} as Record<string, number>,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    recentErrors: [] as ErrorReport[],
  });

  useEffect(() => {
    const errors = Array.from(errorState.errors.values());

    const errorsByComponent: Record<string, number> = {};
    const errorsByCategory: Record<ErrorCategory, number> = {
      network: 0,
      auth: 0,
      validation: 0,
      api: 0,
      permission: 0,
      timeout: 0,
      rendering: 0,
      unknown: 0,
    };
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    errors.forEach(error => {
      // By component
      errorsByComponent[error.context.component] =
        (errorsByComponent[error.context.component] || 0) + 1;

      // By category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;

      // By severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    // Get recent errors (last 10)
    const recentErrors = errors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    setAnalytics({
      totalErrors: errors.length,
      errorsByComponent,
      errorsByCategory,
      errorsBySeverity,
      recentErrors,
    });
  }, [errorState.errors]);

  return analytics;
}

// Error recovery types
type RecoveryAction = 'retry' | 'refresh' | 'redirect' | 'clear_cache' | 'logout';

// Error recovery hook
export function useErrorRecovery() {
  const executeRecoveryAction = useCallback((action: RecoveryAction) => {
    switch (action) {
      case 'retry':
        // Handled by individual components
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'redirect':
        window.location.href = '/';
        break;
      case 'clear_cache':
        if (typeof window !== 'undefined' && window) {
          if ('caches' in window) {
            caches
              .keys()
              .then(names => {
                names.forEach(name => caches.delete(name));
              })
              .then(() => (window as Window).location.reload());
          } else {
            (window as Window).location.reload();
          }
        }
        break;
      case 'logout':
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        break;
      default:
        console.warn(`Unknown recovery action: ${action}`);
        break;
    }
  }, []);

  return {
    executeRecoveryAction,
  };
}

// Global error state hook
export function useGlobalErrorState() {
  const { errorState, clearAllErrors } = useErrorContext();

  const criticalErrors = Array.from(errorState.errors.values()).filter(
    err => err.severity === 'critical' && !err.resolved
  );

  const unresolvedErrors = Array.from(errorState.errors.values()).filter(err => !err.resolved);

  return {
    totalErrors: errorState.errorCount,
    hasCriticalError: errorState.hasCriticalError,
    criticalErrors,
    unresolvedErrors,
    lastErrorTime: errorState.lastErrorTime,
    clearAllErrors,
  };
}
