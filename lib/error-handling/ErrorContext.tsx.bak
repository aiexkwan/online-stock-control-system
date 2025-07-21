/**
 * Error Context
 * 統一錯誤處理 Context
 *
 * 提供全局錯誤狀態管理、錯誤處理和恢復機制
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type {
  ErrorContextValue,
  ErrorState,
  ErrorReport,
  ErrorContext as ErrorContextType,
  ErrorHandlerOptions,
  ErrorCategory,
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

// Error Utilities
class ErrorUtils {
  /**
   * Determine error category from error object
   */
  static categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('connection')
    ) {
      return 'network';
    }

    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return 'auth';
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return 'validation';
    }

    if (message.includes('permission') || message.includes('access denied')) {
      return 'permission';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    if (stack.includes('render') || message.includes('render') || message.includes('component')) {
      return 'rendering';
    }

    if (message.includes('api') || message.includes('server') || message.includes('database')) {
      return 'api';
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  static determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (category === 'auth' && message.includes('token expired')) return 'critical';
    if (category === 'permission' && message.includes('access denied')) return 'critical';
    if (message.includes('system') || message.includes('fatal')) return 'critical';

    // High severity errors
    if (category === 'auth') return 'high';
    if (category === 'api' && message.includes('server error')) return 'high';
    if (category === 'rendering') return 'high';

    // Medium severity errors
    if (category === 'network') return 'medium';
    if (category === 'timeout') return 'medium';
    if (category === 'api') return 'medium';

    // Low severity errors
    if (category === 'validation') return 'low';

    return 'low';
  }

  /**
   * Generate user-friendly error message
   */
  static generateUserMessage(
    error: Error,
    context: ErrorContextType,
    category: ErrorCategory
  ): string {
    const message = error.message.toLowerCase();

    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';

      case 'auth':
        if (message.includes('token expired') || message.includes('unauthorized')) {
          return 'Your session has expired. Please log in again.';
        }
        return 'Authentication failed. Please try logging in again.';

      case 'permission':
        return 'You do not have permission to perform this action.';

      case 'validation':
        return 'Please check your input and try again.';

      case 'timeout':
        return 'The operation timed out. Please try again.';

      case 'api':
        if (message.includes('not found')) {
          return 'The requested information was not found.';
        }
        if (message.includes('server error')) {
          return 'Server error occurred. Please try again later.';
        }
        return 'An error occurred while processing your request.';

      case 'rendering':
        return 'There was an issue loading this component. Please try refreshing the page.';

      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Create default recovery strategy
   */
  static createRecoveryStrategy(category: ErrorCategory): ErrorRecoveryStrategy {
    switch (category) {
      case 'network':
        return {
          primaryAction: 'retry',
          secondaryActions: ['refresh'],
          autoRetry: {
            enabled: true,
            maxAttempts: 3,
            delayMs: 1000,
            backoffMultiplier: 2,
          },
        };

      case 'auth':
        return {
          primaryAction: 'logout',
          secondaryActions: ['refresh'],
          autoRetry: { enabled: false, maxAttempts: 0, delayMs: 0 },
        };

      case 'rendering':
        return {
          primaryAction: 'refresh',
          secondaryActions: ['retry'],
          autoRetry: {
            enabled: true,
            maxAttempts: 2,
            delayMs: 500,
          },
        };

      case 'timeout':
        return {
          primaryAction: 'retry',
          secondaryActions: ['refresh'],
          autoRetry: {
            enabled: true,
            maxAttempts: 2,
            delayMs: 2000,
          },
        };

      default:
        return {
          primaryAction: 'retry',
          secondaryActions: ['refresh'],
          autoRetry: { enabled: false, maxAttempts: 0, delayMs: 0 },
        };
    }
  }

  /**
   * Generate unique error ID
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

  // Handle Error
  const handleError = useCallback(
    (error: Error, context: ErrorContextType, options: ErrorHandlerOptions = {}) => {
      const category = context.category || ErrorUtils.categorizeError(error);
      const severity = context.severity || ErrorUtils.determineSeverity(error, category);
      const userMessage =
        options.userMessage || ErrorUtils.generateUserMessage(error, context, category);
      const recoveryStrategy = {
        ...ErrorUtils.createRecoveryStrategy(category),
        ...options.recoveryStrategy,
      };

      const errorReport: ErrorReport = {
        id: ErrorUtils.generateErrorId(),
        timestamp: new Date().toISOString(),
        context: { ...context, category, severity },
        error,
        severity,
        category,
        userMessage,
        technicalMessage: error.message,
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
