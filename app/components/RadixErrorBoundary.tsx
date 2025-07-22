'use client';

import React from 'react';

interface RadixErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

interface RadixErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

const DefaultFallback = ({ error }: { error?: Error }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Loading Error</h1>
      <p className="text-slate-300 mb-4">
        There was an error loading the application components.
      </p>
      {error && (
        <details className="text-left text-sm text-slate-400 max-w-md">
          <summary className="cursor-pointer mb-2">Error Details</summary>
          <pre className="whitespace-pre-wrap">{error.message}</pre>
        </details>
      )}
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export class RadixErrorBoundary extends React.Component<
  RadixErrorBoundaryProps,
  RadixErrorBoundaryState
> {
  constructor(props: RadixErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RadixErrorBoundaryState {
    // 檢查是否係 Radix UI 或 webpack 相關錯誤
    const isRadixError = error.message.includes('Radix') || 
                        error.message.includes('originalFactory') ||
                        error.message.includes('call of undefined');
    
    if (isRadixError) {
      console.warn('Radix UI or webpack module error caught:', error);
    }

    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RadixErrorBoundary caught an error:', error, errorInfo);
    
    // 嘗試清理可能損壞嘅緩存
    if (typeof window !== 'undefined') {
      try {
        // 清理 localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('radix') || key.includes('ui-state')) {
            localStorage.removeItem(key);
          }
        });
        
        // 清理 sessionStorage  
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('radix') || key.includes('ui-state')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (cleanupError) {
        console.warn('Failed to cleanup storage:', cleanupError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return <FallbackComponent error={new Error(this.state.errorMessage)} />;
    }

    return this.props.children;
  }
}

export default RadixErrorBoundary;