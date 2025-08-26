/**
 * 簡化錯誤處理類型定義
 *
 * 移除複雜分類，保持基本成功/失敗狀態管理
 * 維持現有UI視覺效果
 */

import { ReactNode } from 'react';

// Error Severity Levels - 簡化但保持UI兼容性
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error Recovery Actions - 簡化
export type ErrorRecoveryAction = 'retry' | 'refresh' | 'logout';

// 簡化錯誤上下文
export interface ErrorContext {
  /** Component name where error occurred */
  component: string;
  /** Action being performed when error occurred */
  action: string;
  /** Additional context data */
  additionalData?: Record<string, unknown>;
}

// 簡化恢復策略
export interface ErrorRecoveryStrategy {
  /** Primary recovery action */
  primaryAction: ErrorRecoveryAction;
  /** Auto retry settings */
  autoRetry?: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
  };
}

// 簡化錯誤報告
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
  /** User-friendly message */
  userMessage: string;
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

// 簡化錯誤處理選項
export interface ErrorHandlerOptions {
  /** Show toast notification */
  showToast?: boolean;
  /** Custom user message */
  userMessage?: string;
  /** Recovery strategy override */
  recoveryStrategy?: Partial<ErrorRecoveryStrategy>;
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
  isolationLevel?: 'component' | 'card' | 'page' | 'app';
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

// 簡化錯誤上下文值
export interface ErrorContextValue {
  /** Current error state */
  errorState: ErrorState;
  /** Handle error */
  handleError: (error: Error, context: ErrorContext, options?: ErrorHandlerOptions) => void;
  /** Handle success */
  handleSuccess: (
    message: string,
    context: ErrorContext,
    options?: { showToast?: boolean }
  ) => void;
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

// 保持最小必要的通知類型以維持UI兼容性
export type ErrorNotificationType = 'toast' | 'banner';

export interface ErrorNotificationConfig {
  type: ErrorNotificationType;
  duration?: number;
  persistent?: boolean;
}
