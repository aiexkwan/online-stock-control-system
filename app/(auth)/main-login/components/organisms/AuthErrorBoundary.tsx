'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '../atoms';
import { AlertCircle } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Authentication Error Boundary
 * Specialized error boundary for auth components
 */
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };

    if (props.resetKeys) {
      this.previousResetKeys = [...props.resetKeys];
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after 10 seconds for transient errors
    if (this.state.errorCount < 3) {
      this.scheduleReset(10000);
    }
  }

  componentDidUpdate(prevProps: AuthErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (resetOnPropsChange && hasError && prevProps !== this.props) {
      this.resetErrorBoundary();
    }

    // Reset if resetKeys changed
    if (resetKeys && hasError) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        this.previousResetKeys = [...resetKeys];
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  scheduleReset = (delay: number) => {
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className={`${isolate ? 'isolated-error' : ''} rounded-lg bg-white p-6 shadow-lg`}>
          <div className='mb-4 flex items-center'>
            <AlertCircle className='mr-2 h-6 w-6 text-red-500' />
            <h2 className='text-xl font-semibold text-gray-900'>Authentication Error</h2>
          </div>

          <div className='mb-4'>
            <p className='text-gray-600'>
              We encountered an error with the authentication component.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className='mt-2'>
                <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                  Error Details
                </summary>
                <pre className='mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs'>
                  {error.message}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className='flex gap-2'>
            <Button variant='primary' onClick={this.resetErrorBoundary} disabled={errorCount >= 3}>
              {errorCount >= 3 ? 'Maximum retries reached' : 'Try Again'}
            </Button>

            <Button variant='ghost' onClick={() => (window.location.href = '/main-login')}>
              Return to Login
            </Button>
          </div>

          {errorCount >= 3 && (
            <p className='mt-3 text-sm text-red-600'>
              Please refresh the page or contact support if the issue persists.
            </p>
          )}
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to wrap components with AuthErrorBoundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AuthErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
