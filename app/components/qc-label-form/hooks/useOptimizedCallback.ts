'use client';

import { useCallback, useRef, useMemo, useState, useEffect } from 'react';

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
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
    [callback, delay, ...deps]
  ) as T;

  return debouncedCallback;
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
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
    [callback, delay, ...deps]
  ) as T;

  return throttledCallback;
};

// Stable callback hook - prevents unnecessary re-renders
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref when callback changes
  callbackRef.current = callback;

  // Return a stable function that calls the current callback
  const stableCallback = useCallback(
    (...args: Parameters<T>) => {
      return callbackRef.current(...args);
    },
    []
  ) as T;

  return stableCallback;
};

// Memoized event handler hook
export const useMemoizedEventHandler = <T extends (...args: any[]) => any>(
  handler: T,
  deps: React.DependencyList
): T => {
  return useCallback(handler, deps) as T;
};

// Optimized form change handler
export const useOptimizedFormHandler = <T extends Record<string, any>>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  debounceDelay: number = 0
) => {
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setState(prev => ({ ...prev, [field]: value }));
    },
    [setState]
  );

  const debouncedHandleChange = useDebouncedCallback(
    handleChange,
    debounceDelay,
    [setState]
  );

  return debounceDelay > 0 ? debouncedHandleChange : handleChange;
};

// Batch update hook for multiple state changes
export const useBatchedUpdates = <T extends Record<string, any>>(
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

// Optimized async callback with loading state
export const useAsyncCallback = <T extends (...args: any[]) => Promise<any>>(
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
    [asyncCallback, ...deps]
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { execute, isLoading, error };
};

export default {
  useDebouncedCallback,
  useThrottledCallback,
  useStableCallback,
  useMemoizedEventHandler,
  useOptimizedFormHandler,
  useBatchedUpdates,
  useAsyncCallback
}; 