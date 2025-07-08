'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);

    // 發送錯誤報告（如果有錯誤追蹤服務）
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // 重新加載導航
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className='fixed inset-x-0 bottom-[1%] z-50 mx-auto w-fit rounded-2xl border border-red-500/20 bg-black/80 p-4 shadow-2xl backdrop-blur-xl'>
          <div className='flex items-center gap-4'>
            <AlertCircle className='h-5 w-5 text-red-500' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-white'>Navigation Error</p>
              <p className='text-xs text-white/60'>Something went wrong with the navigation</p>
            </div>
            <Button
              size='sm'
              variant='ghost'
              onClick={this.handleReset}
              className='text-white hover:bg-white/20 hover:text-white'
            >
              <RefreshCw className='mr-1 h-4 w-4' />
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useNavigationError() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Navigation error captured:', error);
  }, []);

  return { error, resetError, captureError };
}
