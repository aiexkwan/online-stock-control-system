/**
 * 簡化錯誤上下文
 *
 * 提供基本錯誤狀態管理，使用 Supabase Auth 標準錯誤訊息
 * 保持現有UI視覺效果
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { normalizeAuthError, categorizeError } from '../types/error-handling';
import type {
  ErrorContextValue,
  ErrorState,
  ErrorReport,
  ErrorContext as ErrorContextType,
  ErrorHandlerOptions,
  ErrorSeverity,
  ErrorRecoveryStrategy,
} from './types';

// Error Context
const ErrorContext = createContext<ErrorContextValue | null>(null);

// Error Actions
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: ErrorReport }
  | { type: 'RESOLVE_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'CLEAR_COMPONENT_ERRORS'; payload: string }
  | { type: 'UPDATE_ERROR'; payload: { id: string; updates: Partial<ErrorReport> } };

// Error Reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR': {
      const newErrors = new Map(state.errors);
      newErrors.set(action.payload.id, action.payload);

      return {
        ...state,
        errors: newErrors,
        errorCount: newErrors.size,
        hasCriticalError: Array.from(newErrors.values()).some(
          error => error.severity === 'critical'
        ),
        lastErrorTime: action.payload.timestamp,
      };
    }

    case 'RESOLVE_ERROR': {
      const newErrors = new Map(state.errors);
      const error = newErrors.get(action.payload);

      if (error) {
        newErrors.set(action.payload, { ...error, resolved: true });
      }

      return {
        ...state,
        errors: newErrors,
        hasCriticalError: Array.from(newErrors.values()).some(
          error => error.severity === 'critical' && !error.resolved
        ),
      };
    }

    case 'CLEAR_ALL_ERRORS': {
      return {
        ...state,
        errors: new Map(),
        errorCount: 0,
        hasCriticalError: false,
        lastErrorTime: undefined,
      };
    }

    case 'CLEAR_COMPONENT_ERRORS': {
      const newErrors = new Map(state.errors);
      const toDelete: string[] = [];

      newErrors.forEach((error, id) => {
        if (error.context.component === action.payload) {
          toDelete.push(id);
        }
      });

      toDelete.forEach(id => newErrors.delete(id));

      return {
        ...state,
        errors: newErrors,
        errorCount: newErrors.size,
        hasCriticalError: Array.from(newErrors.values()).some(
          error => error.severity === 'critical'
        ),
      };
    }

    case 'UPDATE_ERROR': {
      const newErrors = new Map(state.errors);
      const existingError = newErrors.get(action.payload.id);

      if (existingError) {
        newErrors.set(action.payload.id, { ...existingError, ...action.payload.updates });
      }

      return {
        ...state,
        errors: newErrors,
        hasCriticalError: Array.from(newErrors.values()).some(
          error => error.severity === 'critical' && !error.resolved
        ),
      };
    }

    default:
      return state;
  }
}

// 簡化錯誤工具類
class ErrorUtils {
  /**
   * 生成用戶友好的錯誤訊息 - 使用 Supabase 標準化
   */
  static generateUserMessage(error: Error, context: ErrorContextType): string {
    return normalizeAuthError(error);
  }

  /**
   * 創建默認恢復策略 - 簡化版本
   */
  static createRecoveryStrategy(severity: ErrorSeverity): ErrorRecoveryStrategy {
    if (severity === 'critical') {
      return {
        primaryAction: 'logout',
        autoRetry: { enabled: false, maxAttempts: 0, delayMs: 0 },
      };
    }

    return {
      primaryAction: 'retry',
      autoRetry: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
      },
    };
  }

  /**
   * 生成唯一錯誤ID
   */
  static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Error Provider Props
interface ErrorProviderProps {
  children: React.ReactNode;
  /** Maximum number of errors to keep in history */
  maxErrorHistory?: number;
  /** Enable auto-cleanup of resolved errors */
  enableAutoCleanup?: boolean;
  /** Auto-cleanup interval in ms */
  cleanupInterval?: number;
}

// Error Provider Component
export function ErrorProvider({
  children,
  maxErrorHistory = 100,
  enableAutoCleanup = true,
  cleanupInterval = 300000, // 5 minutes
}: ErrorProviderProps) {
  const [errorState, dispatch] = useReducer(errorReducer, {
    errors: new Map(),
    errorCount: 0,
    hasCriticalError: false,
  });

  // Auto-cleanup resolved errors
  React.useEffect(() => {
    if (!enableAutoCleanup) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      errorState.errors.forEach((error, id) => {
        if (error.resolved && now - new Date(error.timestamp).getTime() > cleanupInterval) {
          toDelete.push(id);
        }
      });

      toDelete.forEach(id => {
        dispatch({ type: 'RESOLVE_ERROR', payload: id });
      });
    }, cleanupInterval);

    return () => clearInterval(interval);
  }, [enableAutoCleanup, cleanupInterval, errorState.errors]);

  // Handle Error - 簡化版本
  const handleError = useCallback(
    (error: Error, context: ErrorContextType, options: ErrorHandlerOptions = {}) => {
      const { severity, retryable } = categorizeError(error);
      const userMessage = options.userMessage || ErrorUtils.generateUserMessage(error, context);
      const recoveryStrategy = {
        ...ErrorUtils.createRecoveryStrategy(severity),
        ...options.recoveryStrategy,
      };

      const errorReport: ErrorReport = {
        id: ErrorUtils.generateErrorId(),
        timestamp: new Date().toISOString(),
        context,
        error,
        severity,
        userMessage,
        recoveryStrategy,
        retryCount: 0,
        resolved: false,
      };

      dispatch({ type: 'ADD_ERROR', payload: errorReport });

      // Log to console
      console.error(
        `[ErrorProvider] ${severity.toUpperCase()} error in ${context.component}:`,
        error
      );

      // Handle notifications and recovery based on options
      if (!options.silent) {
        // This will be handled by ErrorNotificationManager
      }
    },
    []
  );

  // Handle Success
  const handleSuccess = useCallback(
    (message: string, context: ErrorContextType, options: { showToast?: boolean } = {}) => {
      console.log(`[ErrorProvider] Success in ${context.component}: ${message}`);

      // Clear component errors on success
      dispatch({ type: 'CLEAR_COMPONENT_ERRORS', payload: context.component });
    },
    []
  );

  // Handle Warning
  const handleWarning = useCallback(
    (message: string, context: ErrorContextType, options: ErrorHandlerOptions = {}) => {
      console.warn(`[ErrorProvider] Warning in ${context.component}: ${message}`);
    },
    []
  );

  // Handle Info
  const handleInfo = useCallback(
    (message: string, context: ErrorContextType, options: ErrorHandlerOptions = {}) => {
      console.info(`[ErrorProvider] Info in ${context.component}: ${message}`);
    },
    []
  );

  // Resolve Error
  const resolveError = useCallback((errorId: string) => {
    dispatch({ type: 'RESOLVE_ERROR', payload: errorId });
  }, []);

  // Clear All Errors
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  // Clear Component Errors
  const clearComponentErrors = useCallback((component: string) => {
    dispatch({ type: 'CLEAR_COMPONENT_ERRORS', payload: component });
  }, []);

  // Get Error
  const getError = useCallback(
    (errorId: string) => {
      return errorState.errors.get(errorId);
    },
    [errorState.errors]
  );

  // Get Component Errors
  const getComponentErrors = useCallback(
    (component: string) => {
      return Array.from(errorState.errors.values()).filter(
        error => error.context.component === component && !error.resolved
      );
    },
    [errorState.errors]
  );

  // Has Component Errors
  const hasComponentErrors = useCallback(
    (component: string) => {
      return Array.from(errorState.errors.values()).some(
        error => error.context.component === component && !error.resolved
      );
    },
    [errorState.errors]
  );

  // Context Value
  const contextValue: ErrorContextValue = useMemo(
    () => ({
      errorState,
      handleError,
      handleSuccess,
      handleWarning,
      handleInfo,
      resolveError,
      clearAllErrors,
      clearComponentErrors,
      getError,
      getComponentErrors,
      hasComponentErrors,
    }),
    [
      errorState,
      handleError,
      handleSuccess,
      handleWarning,
      handleInfo,
      resolveError,
      clearAllErrors,
      clearComponentErrors,
      getError,
      getComponentErrors,
      hasComponentErrors,
    ]
  );

  return <ErrorContext.Provider value={contextValue}>{children}</ErrorContext.Provider>;
}

// useError Hook
export function useError(): ErrorContextValue {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }

  return context;
}

// Export context for testing
export { ErrorContext };
