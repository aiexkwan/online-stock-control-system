'use client';

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class StockCountErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StockCount Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex h-full items-center justify-center p-6'>
          <div className='text-center'>
            <ExclamationTriangleIcon className='mx-auto mb-4 h-12 w-12 text-red-400' />
            <h3 className='mb-2 text-lg font-semibold text-white'>Something went wrong</h3>
            <p className='mb-4 text-sm text-slate-400'>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
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
