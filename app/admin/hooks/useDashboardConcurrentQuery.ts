'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { simplePerformanceMonitor } from '@/lib/performance/SimplePerformanceMonitor';
import type { 
  DashboardBatchQueryData, 
  DashboardBatchQueryError,
  DashboardBatchQueryOptions 
} from '@/app/admin/types/dashboard';

// 並發查詢配置 - 簡化版
const CONCURRENT_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: 1,
  retryDelay: 2000,
};

// Widget ID 映射
const WIDGET_IDS = {
  statsCard: 'total_pallets',
  stockDistribution: 'stock_distribution_chart', 
  stockLevelHistory: 'stock_level_history',
  topProducts: 'top_products',
  acoOrderProgress: 'aco_order_progress',
  ordersList: 'order_state_list',
  injectionProductionStats: 'production_stats',
  productionDetails: 'production_details',
  staffWorkload: 'staff_workload',
  warehouseTransferList: 'warehouse_transfer_list',
  warehouseWorkLevel: 'warehouse_work_level',
  grnReport: 'grn_report_data',
  availableSoon: 'await_location_count',
  awaitLocationQty: 'await_location_count_by_timeframe',
  historyTree: 'history_tree',
};

interface UseDashboardConcurrentQueryReturn {
  data: DashboardBatchQueryData | null;
  loading: boolean;
  error: DashboardBatchQueryError | null;
  refetch: () => Promise<void>;
  refetchWidget: (widgetId: string) => Promise<void>;
  performanceMetrics?: {
    totalFetchTime: number;
    totalRequests: number;
    failedRequests: number;
  };
}

export function useDashboardConcurrentQuery(
  options: DashboardBatchQueryOptions & { enabled?: boolean }
): UseDashboardConcurrentQueryReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<DashboardBatchQueryError | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<UseDashboardConcurrentQueryReturn['performanceMetrics']>();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 簡化的率限制
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds

  // 穩定化 options 的關鍵屬性
  const stableDateRange = useMemo(() => ({
    startDate: options.dateRange?.startDate,
    endDate: options.dateRange?.endDate
  }), [options.dateRange?.startDate?.getTime(), options.dateRange?.endDate?.getTime()]);
  
  const stableEnabledWidgets = useMemo(() => 
    options.enabledWidgets || Object.keys(WIDGET_IDS), 
    [options.enabledWidgets?.join(',')]
  );

  // 並發查詢主函數 - 簡化版
  const fetchConcurrentData = useCallback(async (): Promise<DashboardBatchQueryData> => {
    console.log('[DEBUG] fetchConcurrentData called:', { 
      dateRange: stableDateRange, 
      widgetCount: stableEnabledWidgets.length 
    });
    
    // 簡化的率限制檢查
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`[DEBUG] Rate limiting: skipping fetch`);
      throw new Error(`Rate limited: Please wait ${Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000)} seconds`);
    }
    lastFetchTimeRef.current = now;

    // 簡化的性能監控
    const startTime = performance.now();
    let totalRequests = 0;
    let failedRequests = 0;
    
    // 取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const enabledWidgets = stableEnabledWidgets;
    const dateRange = stableDateRange;
    
    // 構建查詢參數
    const params = new URLSearchParams();
    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate.toISOString());
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate.toISOString());
    }

    // 並發執行所有查詢
    const results: DashboardBatchQueryData = {};
    const errors: Array<{ widgetId: string; error: Error }> = [];

    const widgetPromises = enabledWidgets.map(async (widgetId) => {
      totalRequests++;
      
      try {
        const widgetDataSourceId = WIDGET_IDS[widgetId as keyof typeof WIDGET_IDS];
        if (!widgetDataSourceId) {
          console.warn(`No widget data source defined for widget: ${widgetId}`);
          failedRequests++;
          return { widgetId, data: null };
        }

        // 使用統一的 dashboard API
        const dashboardParams = new URLSearchParams(params);
        dashboardParams.append('widgets', widgetDataSourceId);
        
        const response = await fetch(`/api/admin/dashboard?${dashboardParams.toString()}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${widgetId}: ${response.statusText}`);
        }

        const dashboardResult = await response.json();
        const widgetData = dashboardResult?.widgets?.[0]?.data || null;
        
        return { widgetId, data: widgetData };
      } catch (err) {
        failedRequests++;
        
        if (err instanceof Error && err.name === 'AbortError') {
          return { widgetId, data: null };
        }
        errors.push({ widgetId, error: err as Error });
        return { widgetId, data: null };
      }
    });

    // 等待所有查詢完成
    const widgetResults = await Promise.all(widgetPromises);
    
    // 合併結果
    widgetResults.forEach(({ widgetId, data }) => {
      if (data !== null) {
        results[widgetId] = data;
      }
    });

    // 處理錯誤
    if (errors.length > 0) {
      setError({
        type: 'concurrent',
        message: `Failed to fetch ${errors.length} widget(s)`,
        details: errors,
        timestamp: new Date(),
      });
    } else {
      setError(null);
    }

    // 計算性能指標
    const totalFetchTime = performance.now() - startTime;
    const metrics: UseDashboardConcurrentQueryReturn['performanceMetrics'] = {
      totalFetchTime,
      totalRequests,
      failedRequests,
    };
    
    setPerformanceMetrics(metrics);
    
    // 記錄總體性能
    simplePerformanceMonitor.recordMetric('dashboard-concurrent_totalFetchTime', totalFetchTime, 'performance');
    simplePerformanceMonitor.recordMetric('dashboard-concurrent_totalRequests', totalRequests, 'performance');
    simplePerformanceMonitor.recordMetric('dashboard-concurrent_failedRequests', failedRequests, 'performance');
    simplePerformanceMonitor.recordMetric('dashboard-concurrent_successRate', successRate, 'performance');

    return results;
  }, [stableDateRange, stableEnabledWidgets]);

  // 查詢鍵
  const queryKey = useMemo(() => {
    const key = [
      'dashboard-concurrent', 
      stableDateRange.startDate?.toISOString(),
      stableDateRange.endDate?.toISOString(),
      stableEnabledWidgets.join(','),
    ];
    console.log('[DEBUG] useDashboardConcurrentQuery queryKey:', key);
    return key;
  }, [stableDateRange.startDate, stableDateRange.endDate, stableEnabledWidgets]);

  // 使用 React Query 管理查詢
  const query = useQuery({
    queryKey,
    queryFn: fetchConcurrentData,
    enabled: options.enabled !== false,
    ...CONCURRENT_QUERY_CONFIG,
  });

  // 重新獲取所有數據
  const refetch = useCallback(async () => {
    setError(null);
    await query.refetch();
  }, [query]);

  // 重新獲取單個 widget 數據
  const refetchWidget = useCallback(async (widgetId: string) => {
    try {
      const widgetDataSourceId = WIDGET_IDS[widgetId as keyof typeof WIDGET_IDS];
      if (!widgetDataSourceId) {
        throw new Error(`No widget data source defined for widget: ${widgetId}`);
      }

      const params = new URLSearchParams();
      if (options.dateRange?.startDate) {
        params.append('startDate', options.dateRange.startDate.toISOString());
      }
      if (options.dateRange?.endDate) {
        params.append('endDate', options.dateRange.endDate.toISOString());
      }

      const dashboardParams = new URLSearchParams(params);
      dashboardParams.append('widgets', widgetDataSourceId);
      
      const response = await fetch(`/api/admin/dashboard?${dashboardParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${widgetId}: ${response.statusText}`);
      }

      const dashboardResult = await response.json();
      const widgetData = dashboardResult?.widgets?.[0]?.data || null;

      // 更新查詢緩存中的特定 widget 數據
      queryClient.setQueryData(
        queryKey,
        (oldData: DashboardBatchQueryData | undefined) => ({
          ...oldData,
          [widgetId]: widgetData,
        })
      );

      setError(null);
    } catch (err) {
      setError({
        type: 'widget',
        widgetId,
        message: `Failed to refresh ${widgetId}`,
        details: err,
        timestamp: new Date(),
      });
    }
  }, [queryKey, queryClient, options.dateRange?.startDate, options.dateRange?.endDate]);

  // 清理 abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: query.data || null,
    loading: query.isLoading,
    error: error || (query.error ? {
      type: 'concurrent',
      message: query.error.message,
      timestamp: new Date(),
    } : null),
    refetch,
    refetchWidget,
    performanceMetrics,
  };
}

// 保持向後兼容性
export const useDashboardBatchQuery = useDashboardConcurrentQuery;