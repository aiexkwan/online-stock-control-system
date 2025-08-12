/**
 * Enhanced Error Boundary
 * 增強型錯誤邊界組件
 *
 * 提供多層級錯誤捕獲、自動恢復和用戶友好的錯誤處理
 */

'use client';

import React, { Component, ReactNode } from 'react';
import type {
  ErrorBoundaryProps,
  ErrorFallbackProps,
  ErrorContext as ErrorContextType,
  ErrorRecoveryAction,
} from '../types';
import { useError } from '../ErrorContext';
import { ErrorFallback } from './ErrorFallback';

// Error Boundary State
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

// Enhanced Error Boundary Class Component
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private errorHandler?: ReturnType<typeof useError>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Create error context
    const errorContext: ErrorContextType = {
      component: this.props.context?.component || 'UnknownComponent',
      action: this.props.context?.action || 'render',
      ...this.props.context,
      category: 'rendering',
    };

    // Handle auto-retry for certain error types
    if (this.shouldAutoRetry(error) && this.state.retryCount < 3) {
      this.scheduleAutoRetry();
    }

    // Call external error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorContext);
    }

    // Log error
    console.error('[ErrorBoundary] Caught error:', {
      error,
      errorInfo,
      context: errorContext,
      retryCount: this.state.retryCount,
    });
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Auto-retry for webpack/module loading errors
    return (
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('loading module') ||
      stack.includes('webpack') ||
      stack.includes('__webpack_require__') ||
      message.includes('network error')
    );
  }

  private scheduleAutoRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const delay = 1000 * Math.pow(2, this.state.retryCount); // Exponential backoff

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private executeRecoveryAction = (action: ErrorRecoveryAction) => {
    switch (action) {
      case 'retry':
        this.handleRetry();
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'clear_cache':
        if (typeof window !== 'undefined') {
          if ('caches' in window) {
            caches
              .keys()
              .then(names => {
                names.forEach(name => caches.delete(name));
              })
              .then(() => window.location.reload());
          } else {
            (window as { location: { reload: () => void } }).location.reload();
          }
        }
        break;
      case 'redirect':
        window.location.href = '/';
        break;
      case 'logout':
        // This would need to be implemented based on your auth system
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        break;
      default:
        this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;

      const recoveryActions = this.props.recoveryStrategy?.secondaryActions || ['retry', 'refresh'];

      const fallbackProps: ErrorFallbackProps = {
        error: this.state.error,
        retry: this.handleRetry,
        reset: this.handleReset,
        recoveryActions,
        customActions: [
          {
            label: `Retry (${this.state.retryCount}/3)`,
            action: this.handleRetry,
            variant: 'primary',
          },
          {
            label: 'Refresh Page',
            action: () => this.executeRecoveryAction('refresh'),
            variant: 'secondary',
          },
        ],
      };

      return <FallbackComponent {...fallbackProps} />;
    }

    return this.props.children;
  }
}

// Wrapper component to provide hook access
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specialized error boundaries for different contexts
export function CardErrorBoundary({
  children,
  cardName,
  ...props
}: ErrorBoundaryProps & { cardName: string }) {
  return (
    <ErrorBoundary
      {...props}
      context={{
        component: `Card.${cardName}`,
        action: 'render',
        ...props.context,
      }}
      isolationLevel='component'
    >
      {children}
    </ErrorBoundary>
  );
}

export function PageErrorBoundary({
  children,
  pageName,
  ...props
}: ErrorBoundaryProps & { pageName: string }) {
  return (
    <ErrorBoundary
      {...props}
      context={{
        component: `Page.${pageName}`,
        action: 'render',
        ...props.context,
      }}
      isolationLevel='page'
    >
      {children}
    </ErrorBoundary>
  );
}

export function AppErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  return (
    <ErrorBoundary
      {...props}
      context={{
        component: 'App',
        action: 'render',
        ...props.context,
      }}
      isolationLevel='app'
    >
      {children}
    </ErrorBoundary>
  );
}
