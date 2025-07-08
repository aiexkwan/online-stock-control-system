'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
          <div className='w-full max-w-md space-y-8'>
            <div>
              <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                Something went wrong
              </h2>
              <p className='mt-2 text-center text-sm text-gray-600'>
                We&apos;re working to fix this issue. Please try again later.
              </p>
              {this.state.error && (
                <pre className='mt-4 overflow-auto rounded-md bg-red-50 p-4 text-sm text-red-600'>
                  {this.state.error.toString()}
                </pre>
              )}
              <div className='mt-6 text-center'>
                <button
                  onClick={() => window.location.reload()}
                  className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
