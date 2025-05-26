'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorContext } from './services/ErrorHandler';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
      errorId: `boundary_${Date.now()}`
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
        errorBoundary: true
      }
    };

    // Log the error using our error handler
    errorHandler.handleApiError(error, context, 'A component error occurred. Please refresh the page.');

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
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-red-600 mb-4">
              A component error occurred. This has been logged and will be investigated.
            </p>
            
            {this.state.errorId && (
              <p className="text-xs text-red-500 mb-4 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                type="button"
                onClick={this.handleRefresh}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-red-600 cursor-pointer">
                  Technical Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
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