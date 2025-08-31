'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

// Generic function type for callbacks
type CallbackFunction = (...args: unknown[]) => unknown;

// Debounced callback hook (策略 2: DTO/自定義 type interface)
export const useDebouncedCallback = <T extends CallbackFunction>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps]
  ) as T;

  return debouncedCallback;
};

// Throttled callback hook
export const useThrottledCallback = <T extends CallbackFunction>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      if (timeSinceLastCall >= delay) {
        lastCallTime.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps]
  ) as T;

  return throttledCallback;
};

// Stable callback hook - prevents unnecessary re-renders
export const useStableCallback = <T extends CallbackFunction>(callback: T): T => {
  const callbackRef = useRef<T>(callback);

  // Update the ref when callback changes
  callbackRef.current = callback;

  // Return a stable function that calls the current callback
  const stableCallback = useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;

  return stableCallback;
};

// Memoized event handler hook
export const useMemoizedEventHandler = <T extends CallbackFunction>(
  handler: T,
  _deps: React.DependencyList
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(handler, [handler]) as T;
};

// Optimized form change handler
export const useOptimizedFormHandler = <T extends Record<string, unknown>>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  debounceDelay: number = 0
) => {
  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      setState(prev => ({ ...prev, [field]: value }));
    },
    [setState]
  );

  const debouncedHandleChange = useDebouncedCallback(
    handleChange as CallbackFunction,
    debounceDelay,
    [setState]
  ) as typeof handleChange;

  return debounceDelay > 0 ? debouncedHandleChange : handleChange;
};

// Batch update hook for multiple state changes
export const useBatchedUpdates = <T extends Record<string, unknown>>(
  setState: React.Dispatch<React.SetStateAction<T>>
) => {
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback(
    (updates: Partial<T>, delay: number = 0) => {
      // Merge with pending updates
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (delay === 0) {
        // Apply immediately
        setState(prev => ({ ...prev, ...pendingUpdates.current }));
        pendingUpdates.current = {};
      } else {
        // Apply after delay
        timeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, ...pendingUpdates.current }));
          pendingUpdates.current = {};
        }, delay);
      }
    },
    [setState]
  );

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (Object.keys(pendingUpdates.current).length > 0) {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }
  }, [setState]);

  return { batchUpdate, flushUpdates };
};

// Type for async callback functions
type AsyncCallbackFunction = (...args: unknown[]) => Promise<unknown>;

// Optimized async callback with loading state
export const useAsyncCallback = <T extends AsyncCallbackFunction>(
  asyncCallback: T,
  deps: React.DependencyList = []
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await asyncCallback(...args);

        if (mountedRef.current) {
          setIsLoading(false);
        }

        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asyncCallback, ...deps]
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { execute, isLoading, error };
};

const OptimizedCallbacks = {
  useDebouncedCallback,
  useThrottledCallback,
  useStableCallback,
  useMemoizedEventHandler,
  useOptimizedFormHandler,
  useBatchedUpdates,
  useAsyncCallback,
};

export default OptimizedCallbacks;
