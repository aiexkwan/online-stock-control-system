'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

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

    // 檢查是否是 originalFactory.call 錯誤
    const isOriginalFactoryError = this.isOriginalFactoryError(error);

    if (isOriginalFactoryError && this.state.retryCount < 3) {
      // 自動重試
      this.retryTimeout = setTimeout(
        () => {
          this.handleRetry();
        },
        1000 * (this.state.retryCount + 1)
      );
    }

    // 調用外部錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 記錄錯誤但不讓它污染控制台
    if (isOriginalFactoryError) {
      console.warn('[ErrorBoundary] Caught originalFactory.call error, attempting recovery...', {
        error: error.message,
        retryCount: this.state.retryCount,
      });
    } else {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private isOriginalFactoryError(error: Error): boolean {
    const message = error.message || '';
    const stack = error.stack || '';
    return (
      message.includes('originalFactory.call') ||
      message.includes('undefined is not an object') ||
      message.includes('Cannot read properties of undefined') ||
      stack.includes('originalFactory.call') ||
      stack.includes('webpack_require') ||
      stack.includes('__webpack_require__')
    );
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const isOriginalFactoryError = this.isOriginalFactoryError(this.state.error);

      // 使用自定義 fallback 組件
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // 對於 originalFactory.call 錯誤，顯示更友好的錯誤信息
      if (isOriginalFactoryError) {
        return (
          <div className='flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-6'>
            <AlertTriangle className='mb-4 h-12 w-12 text-yellow-500' />
            <h2 className='mb-2 text-xl font-semibold text-white'>Loading Error</h2>
            <p className='mb-4 max-w-md text-center text-slate-400'>
              There was an issue loading this component. This is usually temporary.
            </p>
            <div className='flex items-center gap-4'>
              <button
                onClick={this.handleRetry}
                className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
              >
                <RefreshCw className='h-4 w-4' />
                Retry ({this.state.retryCount}/3)
              </button>
              <button
                onClick={() => window.location.reload()}
                className='rounded-lg bg-slate-600 px-4 py-2 text-white transition-colors hover:bg-slate-700'
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // 對於其他錯誤，顯示詳細信息
      return (
        <div className='flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-500/50 bg-red-900/20 p-6'>
          <AlertTriangle className='mb-4 h-12 w-12 text-red-500' />
          <h2 className='mb-2 text-xl font-semibold text-white'>Something went wrong</h2>
          <p className='mb-4 text-center text-slate-400'>{this.state.error.message}</p>
          <button
            onClick={this.handleRetry}
            className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
          >
            <RefreshCw className='h-4 w-4' />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
