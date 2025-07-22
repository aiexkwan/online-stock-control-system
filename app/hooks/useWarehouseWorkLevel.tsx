'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import {
  WarehouseWorkLevelParams,
  WarehouseWorkLevelResult,
  WarehouseWorkLevelResponse,
  isWarehouseWorkLevelError,
  formatDateForRPC,
  getDefaultDateRange,
} from '@/types/api/response';

interface UseWarehouseWorkLevelOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: WarehouseWorkLevelResponse) => void;
}

interface UseWarehouseWorkLevelReturn {
  data: WarehouseWorkLevelResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: (params?: WarehouseWorkLevelParams) => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Hook for warehouse work level data fetching
 * 倉庫工作水平數據獲取 Hook
 *
 * @deprecated This hook is deprecated. Please use Server Actions from '@/app/actions/reportActions' instead.
 * For caching functionality, consider using React Query/SWR with Server Actions.
 *
 * @example
 * ```typescript
 * // OLD (deprecated)
 * const { data, loading, error } = useWarehouseWorkLevel(params, options);
 *
 * // NEW (recommended)
 * import { getWarehouseWorkLevel } from '@/app/actions/reportActions';
 *
 * const result = await getWarehouseWorkLevel(params);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export function useWarehouseWorkLevel(
  initialParams?: WarehouseWorkLevelParams,
  options?: UseWarehouseWorkLevelOptions
): UseWarehouseWorkLevelReturn {
  const [data, setData] = useState<WarehouseWorkLevelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(
    async (params?: WarehouseWorkLevelParams) => {
      try {
        // Set loading state
        if (!data) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        // Prepare parameters
        const defaultRange = getDefaultDateRange();
        const startDate = params?.startDate || initialParams?.startDate || defaultRange.startDate;
        const endDate = params?.endDate || initialParams?.endDate || defaultRange.endDate;
        const department = params?.department || initialParams?.department || 'Warehouse';

        // Call RPC function
        const { data: result, error: rpcError } = await supabase.rpc(
          'rpc_get_warehouse_work_level',
          {
            p_start_date: formatDateForRPC(startDate),
            p_end_date: formatDateForRPC(endDate),
            p_department: department,
          }
        );

        if (rpcError) {
          throw new Error(`RPC Error: ${rpcError.message}`);
        }

        const typedResult = result as unknown as WarehouseWorkLevelResult;

        // Check if result is an error
        if (isWarehouseWorkLevelError(typedResult)) {
          throw new Error(typedResult.message);
        }

        // Update state
        setData(typedResult);

        // Call success callback
        if (options?.onSuccess) {
          options.onSuccess(typedResult);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);

        // Call error callback
        if (options?.onError) {
          options.onError(error);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [supabase, data, initialParams, options]
  );

  // Initial fetch
  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options?.autoFetch]);

  // Set up refresh interval
  useEffect(() => {
    if (options?.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, options.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [options?.refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isRefreshing,
  };
}

// Convenience hooks for common time periods
export function useWarehouseWorkLevelToday(options?: UseWarehouseWorkLevelOptions) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useWarehouseWorkLevel(
    {
      startDate: today,
      endDate: tomorrow,
    },
    options
  );
}

export function useWarehouseWorkLevelThisWeek(options?: UseWarehouseWorkLevelOptions) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return useWarehouseWorkLevel(
    {
      startDate: startOfWeek,
      endDate: now,
    },
    options
  );
}

export function useWarehouseWorkLevelThisMonth(options?: UseWarehouseWorkLevelOptions) {
  const now = new Date();
  const startOfMonth = new Date();

  return useWarehouseWorkLevel(
    {
      startDate: startOfMonth,
      endDate: now,
    },
    options
  );
}

// Hook with caching support
export function useWarehouseWorkLevelWithCache(
  initialParams?: WarehouseWorkLevelParams,
  options?: UseWarehouseWorkLevelOptions & { cacheKey?: string; cacheDuration?: number }
) {
  const [cachedData, setCachedData] = useState<WarehouseWorkLevelResponse | null>(null);

  // Check cache on mount
  useEffect(() => {
    if (options?.cacheKey) {
      const cached = localStorage.getItem(options.cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          const maxAge = options.cacheDuration || 5 * 60 * 1000; // 5 minutes default

          if (age < maxAge) {
            setCachedData(data);
          }
        } catch (err) {
          console.error('Failed to parse cached data:', err);
        }
      }
    }
  }, [options?.cacheKey, options?.cacheDuration]);

  const { data, ...rest } = useWarehouseWorkLevel(initialParams, {
    ...options,
    autoFetch: !cachedData,
    onSuccess: data => {
      // Update cache
      if (options?.cacheKey) {
        try {
          localStorage.setItem(
            options.cacheKey,
            JSON.stringify({
              data,
              timestamp: Date.now(),
            })
          );
        } catch (err) {
          console.error('Failed to cache data:', err);
        }
      }

      // Call original success callback
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
  });

  return {
    data: data || cachedData,
    ...rest,
  };
}
