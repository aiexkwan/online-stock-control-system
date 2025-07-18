/**
 * Unified Error Handling Types
 * 統一錯誤處理類型定義
 * 
 * 提供完整的錯誤處理類型系統，支援錯誤分類、用戶友好訊息和恢復策略
 */

import { ReactNode } from 'react';

// Error Severity Levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error Categories
export type ErrorCategory = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'api'
  | 'permission'
  | 'timeout'
  | 'rendering'
  | 'unknown';

// Error Recovery Actions
export type ErrorRecoveryAction = 
  | 'retry'
  | 'refresh'
  | 'redirect'
  | 'clear_cache'
  | 'logout'
  | 'manual';

// Error Context Interface
export interface ErrorContext {
  /** Component name where error occurred */
  component: string;
  /** Action being performed when error occurred */
  action: string;
  /** User ID if available */
  userId?: string;
  /** Additional context data */
  additionalData?: Record<string, any>;
  /** Error category */
  category?: ErrorCategory;
  /** Error severity override */
  severity?: ErrorSeverity;
}

// Error Recovery Strategy
export interface ErrorRecoveryStrategy {
  /** Primary recovery action */
  primaryAction: ErrorRecoveryAction;
  /** Secondary recovery actions */
  secondaryActions?: ErrorRecoveryAction[];
  /** Auto retry settings */
  autoRetry?: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
  };
  /** Custom recovery function */
  customRecovery?: () => void | Promise<void>;
}

// Enhanced Error Report
export interface ErrorReport {
  /** Unique error ID */
  id: string;
  /** Timestamp */
  timestamp: string;
  /** Error context */
  context: ErrorContext;
  /** Original error */
  error: Error;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** User-friendly message */
  userMessage: string;
  /** Technical message */
  technicalMessage: string;
  /** Recovery strategy */
  recoveryStrategy: ErrorRecoveryStrategy;
  /** Retry count */
  retryCount: number;
  /** Whether error was resolved */
  resolved: boolean;
}

// Error State for Context
export interface ErrorState {
  /** Current errors */
  errors: Map<string, ErrorReport>;
  /** Global error count */
  errorCount: number;
  /** Whether any critical errors exist */
  hasCriticalError: boolean;
  /** Last error timestamp */
  lastErrorTime?: string;
}

// Error Handler Options
export interface ErrorHandlerOptions {
  /** Show toast notification */
  showToast?: boolean;
  /** Toast duration override */
  toastDuration?: number;
  /** Custom user message */
  userMessage?: string;
  /** Recovery strategy override */
  recoveryStrategy?: Partial<ErrorRecoveryStrategy>;
  /** Log to database */
  logToDatabase?: boolean;
  /** Silent mode (no UI feedback) */
  silent?: boolean;
}

// Error Boundary Props
export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext) => void;
  /** Recovery strategy */
  recoveryStrategy?: ErrorRecoveryStrategy;
  /** Isolation level */
  isolationLevel?: 'component' | 'widget' | 'page' | 'app';
  /** Custom context */
  context?: Partial<ErrorContext>;
}

// Error Fallback Props
export interface ErrorFallbackProps {
  /** Error object */
  error: Error;
  /** Error report */
  errorReport?: ErrorReport;
  /** Retry function */
  retry: () => void;
  /** Reset error boundary */
  reset: () => void;
  /** Recovery actions */
  recoveryActions?: ErrorRecoveryAction[];
  /** Custom actions */
  customActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
}

// Error Provider Context Value
export interface ErrorContextValue {
  /** Current error state */
  errorState: ErrorState;
  /** Handle error */
  handleError: (error: Error, context: ErrorContext, options?: ErrorHandlerOptions) => void;
  /** Handle success */
  handleSuccess: (message: string, context: ErrorContext, options?: { showToast?: boolean }) => void;
  /** Handle warning */
  handleWarning: (message: string, context: ErrorContext, options?: ErrorHandlerOptions) => void;
  /** Handle info */
  handleInfo: (message: string, context: ErrorContext, options?: ErrorHandlerOptions) => void;
  /** Resolve error */
  resolveError: (errorId: string) => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Clear errors by component */
  clearComponentErrors: (component: string) => void;
  /** Get error by ID */
  getError: (errorId: string) => ErrorReport | undefined;
  /** Get errors by component */
  getComponentErrors: (component: string) => ErrorReport[];
  /** Check if component has errors */
  hasComponentErrors: (component: string) => boolean;
}

// Error Notification Types
export type ErrorNotificationType = 'toast' | 'dialog' | 'banner' | 'inline';

export interface ErrorNotificationConfig {
  type: ErrorNotificationType;
  position?: 'top' | 'bottom' | 'center';
  duration?: number;
  persistent?: boolean;
  showDetails?: boolean;
  showRecoveryActions?: boolean;
}

// Error Analytics
export interface ErrorAnalytics {
  /** Error frequency by component */
  frequencyByComponent: Record<string, number>;
  /** Error frequency by category */
  frequencyByCategory: Record<ErrorCategory, number>;
  /** Error frequency by severity */
  frequencySeverity: Record<ErrorSeverity, number>;
  /** Average resolution time */
  averageResolutionTime: number;
  /** Most common errors */
  commonErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
}

// Error Configuration
export interface ErrorConfig {
  /** Global error settings */
  global: {
    /** Enable error reporting */
    enableReporting: boolean;
    /** Enable auto recovery */
    enableAutoRecovery: boolean;
    /** Max error history */
    maxErrorHistory: number;
    /** Default notification config */
    defaultNotification: ErrorNotificationConfig;
  };
  /** Category-specific settings */
  categorySettings: Partial<Record<ErrorCategory, {
    severity: ErrorSeverity;
    notification: ErrorNotificationConfig;
    recoveryStrategy: ErrorRecoveryStrategy;
  }>>;
  /** Component-specific settings */
  componentSettings: Record<string, {
    isolationLevel: 'component' | 'page' | 'app';
    recoveryStrategy?: ErrorRecoveryStrategy;
    notification?: ErrorNotificationConfig;
  }>;
}