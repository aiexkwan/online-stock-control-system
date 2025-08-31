'use client';

import React, { ComponentType, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { DynamicImportHandler } from './dynamic-import-handler';

interface DynamicImportState<T> {
  component: ComponentType<T> | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

interface WithDynamicImportErrorHandlerOptions {
  retryCount?: number;
  retryDelay?: number;
  fallbackComponent?: ComponentType<Record<string, unknown>>;
  loadingComponent?: ComponentType<Record<string, unknown>>;
}

const DefaultLoadingComponent = () => (
  <div className='flex min-h-[200px] items-center justify-center'>
    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
  </div>
);

const DefaultErrorComponent = ({
  error,
  onRetry,
  retryCount,
}: {
  error: Error;
  onRetry: () => void;
  retryCount: number;
}) => (
  <div className='flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-6'>
    <AlertTriangle className='mb-4 h-12 w-12 text-yellow-500' />
    <h2 className='mb-2 text-xl font-semibold text-white'>Component Loading Error</h2>
    <p className='mb-4 max-w-md text-center text-slate-400'>
      Failed to load component: {error.message}
    </p>
    <div className='flex items-center gap-4'>
      <button
        onClick={onRetry}
        className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
      >
        <RefreshCw className='h-4 w-4' />
        Retry ({retryCount}/3)
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
          onError: error => {
            console.warn(`[DynamicImportWrapper] Import failed (attempt ${attempt + 1}):`, error);
          },
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

    return (
      <DefaultErrorComponent
        error={new Error('Component not loaded')}
        onRetry={handleRetry}
        retryCount={state.retryCount}
      />
    );
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
export function enhancedLazy<T extends Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: WithDynamicImportErrorHandlerOptions
): ComponentType<T> {
  const WrappedComponent = withDynamicImportErrorHandler(importFn, options);
  return WrappedComponent;
}
