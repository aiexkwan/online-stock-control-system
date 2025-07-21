/**
 * Dynamic Import Error Handler
 * 統一處理動態導入錯誤，特別是 originalFactory.call 相關問題
 */

import React from 'react';

export interface DynamicImportOptions {
  retryCount?: number;
  retryDelay?: number;
  fallbackDelay?: number;
  onError?: (error: Error) => void;
}

export class DynamicImportHandler {
  private static isOriginalFactoryError(error: Error): boolean {
    const message = error.message || '';
    const stack = error.stack || '';
    return (
      message.includes('originalFactory.call') ||
      message.includes('undefined is not an object') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('Cannot read property') ||
      message.includes('is not a function') ||
      stack.includes('originalFactory.call') ||
      stack.includes('webpack_require') ||
      stack.includes('__webpack_require__')
    );
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async safeImport<T>(
    importFn: () => Promise<T>,
    options: DynamicImportOptions = {}
  ): Promise<T> {
    const { retryCount = 3, retryDelay = 1000, fallbackDelay = 2000, onError } = options;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        const err = error as Error;

        // Log the error for debugging
        console.error(`Dynamic import attempt ${attempt + 1} failed:`, err);

        // Call custom error handler if provided
        if (onError) {
          onError(err);
        }

        // Special handling for originalFactory.call errors
        if (this.isOriginalFactoryError(err)) {
          console.log('Detected originalFactory.call error, applying special recovery...');

          // For originalFactory errors, wait longer before retry
          if (attempt < retryCount) {
            await this.delay(fallbackDelay);
            continue;
          }
        }

        // Regular retry logic
        if (attempt < retryCount) {
          await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }

        // If all retries failed, throw the last error
        throw err;
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected error in dynamic import handler');
  }

  static createReactImportHook<T>(importFn: () => Promise<T>, options: DynamicImportOptions = {}) {
    return {
      useState: <S>(initialState: S | (() => S)) => {
        const [state, setState] = React.useState(initialState);
        return [state, setState] as const;
      },
      useEffect: (effect: React.EffectCallback, deps?: React.DependencyList) => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        React.useEffect(effect, deps);
      },
      importWithErrorHandling: () => this.safeImport(importFn, options),
    };
  }
}

// React hook for safe dynamic imports
export function useSafeDynamicImport<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const performImport = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await DynamicImportHandler.safeImport(importFn, {
        ...options,
        onError: err => {
          setError(err);
          options.onError?.(err);
        },
      });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [importFn, options]);

  const retry = React.useCallback(() => {
    setError(null);
    performImport();
  }, [performImport]);

  React.useEffect(() => {
    performImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performImport]);

  return { data, loading, error, retry };
}
