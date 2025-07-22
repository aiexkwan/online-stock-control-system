'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-slate-900'>
          <div className='w-full max-w-md rounded-lg border border-red-500 bg-slate-800 p-8'>
            <h2 className='mb-4 text-xl font-bold text-red-500'>Something went wrong</h2>
            <p className='mb-4 text-gray-300'>
              The QR scanner encountered an error. Please try again or use manual input.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
