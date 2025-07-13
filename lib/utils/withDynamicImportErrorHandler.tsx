'use client';

import React, { ComponentType, useEffect, useState } from 'react';
import { DynamicImportHandler } from './dynamic-import-handler';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DynamicImportState<T> {
  component: ComponentType<T> | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

interface WithDynamicImportErrorHandlerOptions {
  retryCount?: number;
  retryDelay?: number;
  fallbackComponent?: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
}

const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

const DefaultErrorComponent = ({ error, onRetry, retryCount }: { 
  error: Error; 
  onRetry: () => void; 
  retryCount: number; 
}) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-slate-900/50 rounded-lg border border-slate-700">
    <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
    <h2 className="text-xl font-semibold text-white mb-2">Component Loading Error</h2>
    <p className="text-slate-400 text-center mb-4 max-w-md">
      Failed to load component: {error.message}
    </p>
    <div className="flex items-center gap-4">
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry ({retryCount}/3)
      </button>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export function withDynamicImportErrorHandler<T extends {}>(
  importFn: () => Promise<{ default: ComponentType<T> } | ComponentType<T>>,
  options: WithDynamicImportErrorHandlerOptions = {}
) {
  const {
    retryCount = 3,
    retryDelay = 1000,
    fallbackComponent,
    loadingComponent: LoadingComponent = DefaultLoadingComponent,
  } = options;

  return function DynamicImportWrapper(props: T) {
    const [state, setState] = useState<DynamicImportState<T>>({
      component: null,
      loading: true,
      error: null,
      retryCount: 0,
    });

    const loadComponent = async (attempt: number = 0) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await DynamicImportHandler.safeImport(importFn, {
          retryCount,
          retryDelay,
          onError: (error) => {
            console.warn(`[DynamicImportWrapper] Import failed (attempt ${attempt + 1}):`, error);
          }
        });

        // Handle both { default: Component } and Component exports
        let Component: ComponentType<T>;
        if (result && typeof result === 'object' && 'default' in result) {
          Component = result.default;
        } else {
          Component = result as ComponentType<T>;
        }

        setState({
          component: Component,
          loading: false,
          error: null,
          retryCount: attempt,
        });
      } catch (error) {
        const err = error as Error;
        console.error(`[DynamicImportWrapper] Final import failure:`, err);
        
        setState({
          component: null,
          loading: false,
          error: err,
          retryCount: attempt,
        });
      }
    };

    useEffect(() => {
      loadComponent();
    }, []);

    const handleRetry = () => {
      if (state.retryCount < retryCount) {
        loadComponent(state.retryCount + 1);
      }
    };

    if (state.loading) {
      return <LoadingComponent />;
    }

    if (state.error) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <DefaultErrorComponent 
          error={state.error} 
          onRetry={handleRetry} 
          retryCount={state.retryCount}
        />
      );
    }

    if (state.component) {
      const Component = state.component;
      return <Component {...props} />;
    }

    return <DefaultErrorComponent 
      error={new Error('Component not loaded')} 
      onRetry={handleRetry} 
      retryCount={state.retryCount}
    />;
  };
}

// 便捷函數用於創建動態導入組件
export function createDynamicComponent<T extends {}>(
  importFn: () => Promise<{ default: ComponentType<T> } | ComponentType<T>>,
  options?: WithDynamicImportErrorHandlerOptions
) {
  return withDynamicImportErrorHandler(importFn, options);
}

// React.lazy 的增強版本
export function enhancedLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: WithDynamicImportErrorHandlerOptions
): T {
  const WrappedComponent = withDynamicImportErrorHandler(importFn, options);
  return WrappedComponent as T;
} 