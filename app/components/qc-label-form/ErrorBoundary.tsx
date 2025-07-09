'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorContext } from './services/ErrorHandler';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { isDevelopment } from '@/lib/utils/env';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: Partial<ErrorContext>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `boundary_${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: this.props.context?.component || 'ErrorBoundary',
      action: 'component_render',
      userId: this.props.context?.userId,
      additionalData: {
        ...this.props.context?.additionalData,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    };

    // Log the error using our error handler
    errorHandler.handleApiError(
      error,
      context,
      'A component error occurred. Please refresh the page.'
    );

    console.error('[ErrorBoundary] Component error caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='flex min-h-[200px] items-center justify-center p-6'>
          <div className='w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center'>
            <ExclamationTriangleIcon className='mx-auto mb-4 h-12 w-12 text-red-500' />

            <h3 className='mb-2 text-lg font-semibold text-red-800'>Something went wrong</h3>

            <p className='mb-4 text-sm text-red-600'>
              A component error occurred. This has been logged and will be investigated.
            </p>

            {this.state.errorId && (
              <p className='mb-4 font-mono text-xs text-red-500'>Error ID: {this.state.errorId}</p>
            )}

            <div className='flex justify-center gap-3'>
              <button
                type='button'
                onClick={this.handleRetry}
                className='flex items-center rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700'
              >
                <ArrowPathIcon className='mr-2 h-4 w-4' />
                Try Again
              </button>

              <button
                type='button'
                onClick={this.handleRefresh}
                className='flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700'
              >
                Refresh Page
              </button>
            </div>

            {isDevelopment() && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-xs text-red-600'>
                  Technical Details (Development)
                </summary>
                <pre className='mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-700'>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
