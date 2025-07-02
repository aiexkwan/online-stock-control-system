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
        <div className="fixed inset-x-0 mx-auto w-fit bottom-[1%] bg-black/80 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl p-4 z-50">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Navigation Error</p>
              <p className="text-xs text-white/60">Something went wrong with the navigation</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={this.handleReset}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
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