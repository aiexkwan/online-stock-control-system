/**
 * Error Boundary for Admin Dashboard
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { isDevelopment } from '@/lib/utils/env';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);

    // Special handling for common dynamic import errors
    if (
      (error as { message: string }).message.includes('originalFactory.call') ||
      (error as { message: string }).message.includes('Cannot read properties of undefined') ||
      (error as { message: string }).message.includes('undefined is not an object')
    ) {
      console.warn('Dynamic import error detected - likely a lazy loading issue');

      // 移除自動重新載入以防止無限循環
      // 用戶可以手動點擊 "Refresh Page" 按鈕
      console.warn('Auto-reload disabled to prevent infinite refresh loop');
    }
  }

  render() {
    if (this.state.hasError) {
      const isDynamicImportError =
        this.state.error &&
        ((this.state.error as { message: string }).message.includes('originalFactory.call') ||
          (this.state.error as { message: string }).message.includes(
            'Cannot read properties of undefined'
          ) ||
          (this.state.error as { message: string }).message.includes('undefined is not an object'));

      return (
        <div className='flex min-h-screen items-center justify-center bg-gray-900 p-8 text-white'>
          <div className='w-full max-w-md text-center'>
            <h1 className='mb-4 text-2xl font-bold text-red-500'>
              {isDynamicImportError ? 'Loading Error' : 'Something went wrong'}
            </h1>
            <p className='mb-6 text-gray-400'>
              {isDynamicImportError
                ? 'The page is having trouble loading components. This usually resolves after a refresh.'
                : 'The admin dashboard encountered an error. Please try refreshing the page.'}
            </p>
            {isDynamicImportError && (
              <div className='mb-4 text-sm text-yellow-400'>
                <p>Please click &quot;Refresh Page&quot; to reload the components.</p>
              </div>
            )}
            <div className='space-y-2'>
              <Button onClick={() => window.location.reload()} className='w-full'>
                Refresh Page
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false })}
                variant='outline'
                className='w-full'
              >
                Try Again
              </Button>
            </div>
            {isDevelopment() && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500'>Error Details</summary>
                <pre className='mt-2 whitespace-pre-wrap text-xs text-gray-400'>
                  {(this.state.error as { message: string }).message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}
