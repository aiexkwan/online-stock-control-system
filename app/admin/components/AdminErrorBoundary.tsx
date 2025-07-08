/**
 * Error Boundary for Admin Dashboard
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-gray-900 p-8 text-white'>
          <div className='w-full max-w-md text-center'>
            <h1 className='mb-4 text-2xl font-bold text-red-500'>Something went wrong</h1>
            <p className='mb-6 text-gray-400'>
              The admin dashboard encountered an error. Please try refreshing the page.
            </p>
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
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500'>Error Details</summary>
                <pre className='mt-2 overflow-auto rounded bg-black/50 p-2 text-xs'>
                  {this.state.error.toString()}
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
