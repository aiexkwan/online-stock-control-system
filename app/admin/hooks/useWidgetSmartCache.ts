/**
 * React Hook for Widget Smart Cache System
 * 
 * Integrates intelligent caching with widgets:
 * - Date range aware caching
 * - Stale-while-revalidate support
 * - Predictive preloading
 * - Smart TTL management
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  type WidgetCacheConfig,
  type CacheEntry,
  type CacheKeyParams,
  createWidgetCacheConfig,
  SmartTTLManager,
  predictivePreloader,
  cachePerformanceTracker,
} from '@/lib/widgets/smart-cache-strategy';
import { type WidgetDataSource, type WidgetPriority } from '@/lib/widgets/unified-config';
import { type WidgetDataMode } from '@/lib/widgets/widget-data-classification';

export interface UseWidgetSmartCacheOptions<T> {
  widgetId: string;
  dataSource: WidgetDataSource;
  dataMode: WidgetDataMode;
  priority: WidgetPriority;
  fetchFn: (params: any) => Promise<T>;
  params?: {
    dateRange?: {
      from: Date;
      to: Date;
    };
    filters?: Record<string, any>;
  };
  enabled?: boolean;
  customCacheConfig?: Partial<WidgetCacheConfig>;
  onDataUpdate?: (data: T) => void;
  predictiveConfig?: {
    enabled: boolean;
    predictor: () => { probability: number; timeUntilNeeded: number };
  };
}

export interface UseWidgetSmartCacheResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  isFetching: boolean;
  refetch: () => void;
  invalidate: () => void;
  cacheMetrics: {
    hitRate: number;
    avgLoadTime: number;
    lastUpdated: Date | null;
  };
}

/**
 * Smart cache hook for widgets
 */
export function useWidgetSmartCache<T>({
  widgetId,
  dataSource,
  dataMode,
  priority,
  fetchFn,
  params,
  enabled = true,
  customCacheConfig,
  onDataUpdate,
  predictiveConfig,
}: UseWidgetSmartCacheOptions<T>): UseWidgetSmartCacheResult<T> {
  const [isStale, setIsStale] = useState(false);
  const lastUpdateRef = useRef<Date | null>(null);
  const accessCountRef = useRef(0);
  const errorRateRef = useRef(0);
  const totalFetchesRef = useRef(0);
  
  // Create cache configuration
  const cacheConfig = useMemo(
    () =>
      createWidgetCacheConfig(widgetId, {
        dataSource,
        dataMode,
        priority,
        customStrategy: customCacheConfig,
      }),
    [widgetId, dataSource, dataMode, priority, customCacheConfig]
  );
  
  // Generate cache key
  const cacheKey = useMemo(() => {
    const keyParams: CacheKeyParams = {
      widgetId,
      dateRange: params?.dateRange,
      filters: params?.filters,
    };
    return cacheConfig.generateKey(keyParams);
  }, [widgetId, params, cacheConfig]);
  
  // Calculate dynamic TTL
  const dynamicTTL = useMemo(() => {
    const ttlParams = {
      baseTTL: cacheConfig.baseTTL,
      dataSource,
      priority,
      dateRange: params?.dateRange,
      lastAccessTime: lastUpdateRef.current?.getTime(),
      accessFrequency: accessCountRef.current,
      errorRate: errorRateRef.current / Math.max(1, totalFetchesRef.current),
    };
    return SmartTTLManager.calculateTTL(ttlParams);
  }, [cacheConfig.baseTTL, dataSource, priority, params?.dateRange]);
  
  // Enhanced fetch function with caching logic
  const enhancedFetchFn = useCallback(async () => {
    const startTime = Date.now();
    totalFetchesRef.current++;
    
    try {
      // Record cache miss
      cachePerformanceTracker.recordMiss(widgetId);
      
      // Fetch data
      const data = await fetchFn(params);
      
      // Update metrics
      lastUpdateRef.current = new Date();
      accessCountRef.current++;
      cachePerformanceTracker.recordLoadTime(widgetId, Date.now() - startTime);
      
      // Call update callback if provided
      if (onDataUpdate) {
        onDataUpdate(data);
      }
      
      // Reset stale state
      setIsStale(false);
      
      return data;
    } catch (error) {
      errorRateRef.current++;
      cachePerformanceTracker.recordError(widgetId);
      throw error;
    }
  }, [widgetId, fetchFn, params, onDataUpdate]);
  
  // Configure React Query
  const queryOptions: UseQueryOptions<T, Error, T, readonly unknown[]> = {
    queryKey: [cacheKey] as readonly unknown[],
    queryFn: enhancedFetchFn,
    enabled: enabled,
    staleTime: dynamicTTL * 1000, // Convert to milliseconds
    gcTime: cacheConfig.enableSWR
      ? (dynamicTTL + (cacheConfig.swrWindow || 60)) * 1000
      : dynamicTTL * 1000,
    refetchOnWindowFocus: priority === 'critical',
    refetchOnReconnect: true,
    retry: dataMode === 'real-time' ? false : 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  };
  
  const query = useQuery(queryOptions);
  
  // Track cache hits
  useEffect(() => {
    if (query.data && !query.isFetching) {
      cachePerformanceTracker.recordHit(widgetId, isStale);
    }
  }, [widgetId, query.data, query.isFetching, isStale]);
  
  // Handle stale-while-revalidate
  useEffect(() => {
    if (cacheConfig.enableSWR && query.isStale && !query.isFetching) {
      setIsStale(true);
      // Trigger background refetch
      query.refetch();
    }
  }, [cacheConfig.enableSWR, query.isStale, query.isFetching, query]);
  
  // Setup predictive preloading
  useEffect(() => {
    if (predictiveConfig?.enabled && cacheConfig.enablePreload) {
      const checkPreload = () => {
        const prediction = predictiveConfig.predictor();
        
        if (prediction.probability > 0) {
          predictivePreloader.schedulePreload(
            widgetId,
            () => query.refetch(),
            {
              ...prediction,
              priority,
            }
          );
          cachePerformanceTracker.recordPreload(widgetId);
        }
      };
      
      // Check periodically
      const interval = setInterval(checkPreload, 30000); // Every 30 seconds
      checkPreload(); // Initial check
      
      return () => {
        clearInterval(interval);
        predictivePreloader.cancelPreload(widgetId);
      };
    }
  }, [widgetId, predictiveConfig, cacheConfig.enablePreload, priority, query]);
  
  // Calculate cache metrics
  const cacheMetrics = useMemo(() => {
    const metrics = cachePerformanceTracker.getMetrics(widgetId);
    if (!metrics) {
      return {
        hitRate: 0,
        avgLoadTime: 0,
        lastUpdated: lastUpdateRef.current,
      };
    }
    
    const totalRequests = metrics.hits + metrics.misses;
    return {
      hitRate: totalRequests > 0 ? metrics.hits / totalRequests : 0,
      avgLoadTime: metrics.avgLoadTime,
      lastUpdated: lastUpdateRef.current,
    };
  }, [widgetId]);
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: isStale || query.isStale,
    isFetching: query.isFetching,
    refetch: () => query.refetch(),
    invalidate: () => query.refetch(),
    cacheMetrics,
  };
}

/**
 * Hook for batch cache invalidation by date range
 */
export function useWidgetCacheInvalidation() {
  const invalidateByDateRange = useCallback(
    async (dateRange: { from: Date; to: Date }, widgetIds?: string[]) => {
      // This would integrate with React Query's invalidation
      // Implementation depends on your query client setup
      console.log('Invalidating cache for date range:', dateRange, 'widgets:', widgetIds);
    },
    []
  );
  
  const invalidateAll = useCallback(async () => {
    // Invalidate all widget caches
    console.log('Invalidating all widget caches');
  }, []);
  
  return {
    invalidateByDateRange,
    invalidateAll,
  };
}

/**
 * Hook to monitor overall cache performance
 */
export function useCachePerformanceMonitor() {
  const [metrics, setMetrics] = useState<Map<string, any>>(new Map());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(new Map(cachePerformanceTracker.getAllMetrics()));
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const overallStats = useMemo(() => {
    let totalHits = 0;
    let totalMisses = 0;
    let totalErrors = 0;
    let totalPreloads = 0;
    let avgLoadTime = 0;
    let count = 0;
    
    for (const metric of metrics.values()) {
      totalHits += metric.hits;
      totalMisses += metric.misses;
      totalErrors += metric.errors;
      totalPreloads += metric.preloads;
      avgLoadTime += metric.avgLoadTime;
      count++;
    }
    
    return {
      totalHits,
      totalMisses,
      totalErrors,
      totalPreloads,
      overallHitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
      avgLoadTime: count > 0 ? avgLoadTime / count : 0,
      widgetCount: count,
    };
  }, [metrics]);
  
  return {
    widgetMetrics: metrics,
    overallStats,
  };
}