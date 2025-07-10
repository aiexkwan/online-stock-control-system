'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { performanceMonitor } from '@/lib/widgets/performance-monitor';
import { createClient } from '@/app/utils/supabase/client';
import type { 
  DashboardBatchQueryData, 
  DashboardBatchQueryError,
  DashboardBatchQueryOptions 
} from '@/app/admin/types/dashboard';

// 批量查詢配置
const BATCH_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 分鐘
  cacheTime: 1000 * 60 * 10, // 10 分鐘
  refetchOnWindowFocus: false,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Widget 查詢映射（可以根據實際 API 調整）
const WIDGET_QUERIES = {
  statsCard: '/api/admin/dashboard/stats',
  stockDistribution: '/api/admin/dashboard/stock-distribution',
  stockLevelHistory: '/api/admin/dashboard/stock-history',
  topProducts: '/api/admin/dashboard/top-products',
  acoOrderProgress: '/api/admin/dashboard/aco-progress',
  ordersList: '/api/admin/dashboard/orders',
  injectionProductionStats: '/api/admin/dashboard/injection-stats',
  productionDetails: '/api/admin/dashboard/production-details',
  staffWorkload: '/api/admin/dashboard/staff-workload',
  warehouseTransferList: '/api/admin/dashboard/warehouse-transfers',
  warehouseWorkLevel: '/api/admin/dashboard/warehouse-work-level',
  grnReport: '/api/admin/dashboard/grn-report',
  availableSoon: '/api/admin/dashboard/available-soon',
  awaitLocationQty: '/api/admin/dashboard/await-location',
  historyTree: '/api/admin/dashboard/history-tree',
};

interface UseDashboardBatchQueryReturn {
  data: DashboardBatchQueryData | null;
  loading: boolean;
  error: DashboardBatchQueryError | null;
  refetch: () => Promise<void>;
  refetchWidget: (widgetId: string) => Promise<void>;
  performanceMetrics?: {
    totalFetchTime: number;
    individualFetchTimes: Record<string, number>;
    batchCount: number;
    totalRequests: number;
    failedRequests: number;
    averageRequestTime: number;
  };
}

export function useDashboardBatchQuery(
  options: DashboardBatchQueryOptions & { enabled?: boolean }
): UseDashboardBatchQueryReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<DashboardBatchQueryError | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<UseDashboardBatchQueryReturn['performanceMetrics']>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 批量獲取數據的主函數
  const fetchBatchData = useCallback(async (): Promise<DashboardBatchQueryData> => {
    // 開始性能監控
    const batchStartTime = performance.now();
    const individualFetchTimes: Record<string, number> = {};
    let totalRequests = 0;
    let failedRequests = 0;
    
    // 取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const { dateRange, enabledWidgets = Object.keys(WIDGET_QUERIES), batchSize = 5 } = options;
    
    // 構建查詢參數
    const params = new URLSearchParams();
    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate.toISOString());
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate.toISOString());
    }

    // 分批處理 widgets
    const results: DashboardBatchQueryData = {};
    const errors: Array<{ widgetId: string; error: Error }> = [];

    // 將 widgets 分批
    const batches: string[][] = [];
    for (let i = 0; i < enabledWidgets.length; i += batchSize) {
      batches.push(enabledWidgets.slice(i, i + batchSize));
    }

    // 並行處理每批
    for (const batch of batches) {
      if (signal.aborted) break;

      const batchPromises = batch.map(async (widgetId) => {
        const widgetStartTime = performance.now();
        totalRequests++;
        
        try {
          // 記錄 widget 開始加載
          performanceMonitor.recordMetric({
            widgetId,
            metricType: 'dataFetch',
            value: 0,
            timestamp: Date.now(),
          });
          
          const endpoint = WIDGET_QUERIES[widgetId as keyof typeof WIDGET_QUERIES];
          if (!endpoint) {
            console.warn(`No endpoint defined for widget: ${widgetId}`);
            failedRequests++;
            return { widgetId, data: null };
          }

          const response = await fetch(`${endpoint}?${params.toString()}`, {
            signal,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch ${widgetId}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // 記錄成功的 fetch 時間
          const fetchTime = performance.now() - widgetStartTime;
          individualFetchTimes[widgetId] = fetchTime;
          
          performanceMonitor.recordMetric({
            widgetId,
            metricType: 'dataFetch',
            value: fetchTime,
            timestamp: Date.now(),
          });
          
          return { widgetId, data };
        } catch (err) {
          failedRequests++;
          const fetchTime = performance.now() - widgetStartTime;
          individualFetchTimes[widgetId] = fetchTime;
          
          if (err instanceof Error && err.name === 'AbortError') {
            return { widgetId, data: null };
          }
          errors.push({ widgetId, error: err as Error });
          return { widgetId, data: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // 合併結果
      batchResults.forEach(({ widgetId, data }) => {
        if (data !== null) {
          results[widgetId] = data;
        }
      });
    }

    // 如果有錯誤，設置錯誤狀態
    if (errors.length > 0) {
      setError({
        type: 'batch',
        message: `Failed to fetch ${errors.length} widget(s)`,
        details: errors,
        timestamp: new Date(),
      });
    } else {
      setError(null);
    }

    // 計算並設置性能指標
    const totalFetchTime = performance.now() - batchStartTime;
    const averageRequestTime = totalRequests > 0 
      ? Object.values(individualFetchTimes).reduce((sum, time) => sum + time, 0) / totalRequests 
      : 0;
    
    const metrics: UseDashboardBatchQueryReturn['performanceMetrics'] = {
      totalFetchTime,
      individualFetchTimes,
      batchCount: batches.length,
      totalRequests,
      failedRequests,
      averageRequestTime,
    };
    
    setPerformanceMetrics(metrics);
    
    // 記錄批量查詢總體性能
    performanceMonitor.recordMetric({
      widgetId: 'dashboard-batch',
      metricType: 'batchQuery',
      value: totalFetchTime,
      timestamp: Date.now(),
      metadata: {
        totalWidgets: enabledWidgets.length,
        successfulWidgets: totalRequests - failedRequests,
        failedWidgets: failedRequests,
        batchSize,
      },
    });

    return results;
  }, [options]);

  // 使用 React Query 管理查詢
  const query = useQuery({
    queryKey: ['dashboard-batch', options.dateRange, options.enabledWidgets],
    queryFn: fetchBatchData,
    enabled: options.enabled !== false, // 默認啟用，除非明確禁用
    ...BATCH_QUERY_CONFIG,
  });

  // 重新獲取所有數據
  const refetch = useCallback(async () => {
    setError(null);
    await query.refetch();
  }, [query]);

  // 重新獲取單個 widget 數據
  const refetchWidget = useCallback(async (widgetId: string) => {
    try {
      const endpoint = WIDGET_QUERIES[widgetId as keyof typeof WIDGET_QUERIES];
      if (!endpoint) {
        throw new Error(`No endpoint defined for widget: ${widgetId}`);
      }

      const params = new URLSearchParams();
      if (options.dateRange.startDate) {
        params.append('startDate', options.dateRange.startDate.toISOString());
      }
      if (options.dateRange.endDate) {
        params.append('endDate', options.dateRange.endDate.toISOString());
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${widgetId}: ${response.statusText}`);
      }

      const data = await response.json();

      // 更新查詢緩存中的特定 widget 數據
      queryClient.setQueryData(
        ['dashboard-batch', options.dateRange, options.enabledWidgets],
        (oldData: DashboardBatchQueryData | undefined) => ({
          ...oldData,
          [widgetId]: data,
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
  }, [options, queryClient]);

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
      type: 'batch',
      message: query.error.message,
      timestamp: new Date(),
    } : null),
    refetch,
    refetchWidget,
    performanceMetrics,
  };
}

// ============================================================================
// Server-Side Data Prefetching Functions for SSR
// ============================================================================

interface ServerPrefetchOptions {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  enabledWidgets?: string[];
  criticalOnly?: boolean; // 只預取 critical widgets 數據
}

/**
 * Server-side batch data prefetching for Critical Widgets SSR
 * 在服務器端預取 Critical Path Widgets 的數據
 */
export async function prefetchCriticalWidgetsData(
  options: ServerPrefetchOptions
): Promise<DashboardBatchQueryData> {
  const { dateRange, criticalOnly = true } = options;
  
  // Critical Path Widgets (基於 Week 2 Day 2 規劃)
  const criticalWidgets = [
    'total_pallets', // StatsCardWidget
    'awaitLocationQty', // AwaitLocationQtyWidget  
    'yesterdayTransferCount', // YesterdayTransferCountWidget
  ];
  
  const enabledWidgets = criticalOnly ? criticalWidgets : (options.enabledWidgets || Object.keys(WIDGET_QUERIES));
  
  try {
    // 注意：此函數應該在 server 端調用，這裡只是提供介面
    // 實際的 server 端邏輯應該在 server actions 或 API routes 中實現
    console.warn('[SSR] Client-side prefetch called - should be server-side only');
    return {};
    
  } catch (error) {
    console.error('[SSR] Critical widgets prefetch failed:', error);
    return {}; // 返回空數據，讓客戶端 fallback 到正常查詢
  }
}

/**
 * Server-side single widget data prefetching
 * 服務器端單個 widget 數據預取
 */
async function prefetchWidgetDataServer(
  supabase: any,
  widgetId: string,
  dateRange: { startDate: Date | null; endDate: Date | null }
): Promise<any> {
  
  switch (widgetId) {
    case 'total_pallets':
      // StatsCardWidget - 總棧板統計
      const { count: totalPallets } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true });
      
      return {
        value: totalPallets || 0,
        label: 'Total Pallets',
        trend: 0, // 可以後續添加趨勢計算
      };
      
    case 'awaitLocationQty':
      // AwaitLocationQtyWidget - Await Location 庫存統計
      const { data: awaitData } = await supabase
        .rpc('rpc_get_await_location_count');
      
      return {
        totalAwaitingQty: awaitData || 0,
        locations: [], // 簡化版本，後續可擴展
      };
      
    case 'yesterdayTransferCount':
      // YesterdayTransferCountWidget - 昨日轉移統計
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: transferCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', yesterday.toISOString())
        .lt('tran_date', today.toISOString());
      
      return {
        count: transferCount || 0,
        trend: 0, // 可以後續添加與前一天的比較
        dateRange: {
          start: yesterday.toISOString(),
          end: today.toISOString(),
        },
        optimized: true, // SSR 優化標記
      };
      
    default:
      console.warn(`[SSR] No server prefetch implementation for widget: ${widgetId}`);
      return null;
  }
}

/**
 * Generate static props for SSR dashboard pages
 * 為 SSR 儀表板頁面生成靜態 props
 */
export async function generateDashboardStaticProps(theme: string, dateRange?: {
  startDate: Date | null;
  endDate: Date | null;
}) {
  const defaultDateRange = dateRange || {
    startDate: null,
    endDate: null,
  };
  
  try {
    // 預取 critical widgets 數據
    const prefetchedData = await prefetchCriticalWidgetsData({
      dateRange: defaultDateRange,
      criticalOnly: true,
    });
    
    return {
      props: {
        theme,
        prefetchedData,
        dateRange: defaultDateRange,
        generatedAt: new Date().toISOString(),
      },
      // ISR - 每 5 分鐘重新生成一次
      revalidate: 300,
    };
  } catch (error) {
    console.error('[SSR] Failed to generate static props:', error);
    
    // Fallback to client-side rendering
    return {
      props: {
        theme,
        prefetchedData: {},
        dateRange: defaultDateRange,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}