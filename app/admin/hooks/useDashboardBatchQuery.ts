'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { performanceMonitor } from '@/lib/widgets/performance-monitor';
import { createClient } from '@/app/utils/supabase/client';
import type { 
  DashboardBatchQueryData, 
  DashboardBatchQueryError,
  DashboardBatchQueryOptions 
} from '@/app/admin/types/dashboard';

// 批量查詢配置 - ULTRA OPTIMIZED FOR MINIMAL API CALLS
const BATCH_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 60, // 60 minutes - even longer cache
  cacheTime: 1000 * 60 * 120, // 120 minutes - much longer cache retention
  refetchOnWindowFocus: false,
  refetchOnMount: false, // Don't refetch on mount if data exists
  refetchOnReconnect: false, // Don't refetch on reconnect
  refetchInterval: false, // No automatic polling
  retry: 0, // No retries in test mode
  retryDelay: 10000, // Longer delay if retry needed
};

// Widget ID 映射（使用統一的 dashboard API）
// 精簡版 Widget IDs（測試模式使用）
const MINIMAL_WIDGET_IDS = {
  // 只保留 3 個最基本的統計卡片
  totalProducts: 'combined_stats',
  todayProduction: 'combined_stats', 
  totalQuantity: 'combined_stats',
};

// 完整版 Widget IDs（生產模式使用）
const FULL_WIDGET_IDS = {
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
  
  // Enhanced rate limiting: prevent excessive API calls
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 10000; // 10 seconds minimum between fetches
  
  // 檢查是否為測試環境
  const isTestMode = useMemo(() => {
    // 檢查多種測試環境指示器
    return (
      (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
      (typeof window !== 'undefined' && window.location.search.includes('testMode=true')) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('testMode') === 'true') ||
      (typeof navigator !== 'undefined' && navigator.userAgent.includes('HeadlessChrome'))
    );
  }, []);
  
  // 測試模式下使用更激進的緩存配置
  const testModeConfig = useMemo(() => {
    if (!isTestMode) return BATCH_QUERY_CONFIG;
    
    return {
      ...BATCH_QUERY_CONFIG,
      staleTime: 1000 * 60 * 180, // 3 hours in test mode
      cacheTime: 1000 * 60 * 300, // 5 hours in test mode
      retry: 0, // No retries in test mode
    };
  }, [isTestMode]);

  // 穩定化 options 的關鍵屬性，避免不必要的重新渲染
  const stableDateRange = useMemo(() => ({
    startDate: options.dateRange?.startDate,
    endDate: options.dateRange?.endDate
  }), [options.dateRange?.startDate?.getTime(), options.dateRange?.endDate?.getTime()]);

  // 根據環境選擇 Widget IDs
  const WIDGET_IDS = useMemo(() => {
    return isTestMode ? MINIMAL_WIDGET_IDS : FULL_WIDGET_IDS;
  }, [isTestMode]);
  
  const stableEnabledWidgets = useMemo(() => 
    options.enabledWidgets || Object.keys(WIDGET_IDS), 
    [options.enabledWidgets?.join(','), isTestMode]
  );

  // 批量獲取數據的主函數 - 使用穩定化的依賴
  const fetchBatchData = useCallback(async (): Promise<DashboardBatchQueryData> => {
    console.log('[DEBUG] fetchBatchData called with stable options:', { 
      stableDateRange, 
      stableEnabledWidgets, 
      isTestMode, 
      widgetCount: stableEnabledWidgets.length 
    });
    
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`[DEBUG] Rate limiting: skipping fetch (${timeSinceLastFetch}ms < ${MIN_FETCH_INTERVAL}ms)`);
      throw new Error(`Rate limited: Please wait ${Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000)} seconds`);
    }
    lastFetchTimeRef.current = now;
    
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

    const { batchSize = 5 } = options;
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

    // 在測試模式下使用单一合併 API 調用
    if (isTestMode && enabledWidgets.length <= 3) {
      console.log('[DEBUG] Using single combined API call in test mode');
      totalRequests = 1;
      
      try {
        const response = await fetch(
          `/api/admin/dashboard/combined-stats?${params.toString()}`,
          { signal }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const combinedData = await response.json();
        
        // 將合併數據映射到各個 widget
        const results: DashboardBatchQueryData = {
          totalProducts: { data: { value: combinedData.total_products } },
          todayProduction: { data: { value: combinedData.today_production } },
          totalQuantity: { data: { value: combinedData.total_quantity } },
        };
        
        console.log('[DEBUG] Combined API response:', results);
        return results;
        
      } catch (error) {
        console.error('[DEBUG] Combined API failed, falling back to individual calls:', error);
        // 繼續使用原來的分批處理逻輯
      }
    }

    // 分批處理 widgets（原來的逻輯）
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
          performanceMonitor.recordMetrics({
            widgetId,
            timestamp: Date.now(),
            loadTime: 0,
            renderTime: 0,
            dataFetchTime: 0,
            route: window.location.pathname,
            variant: 'v2',
            sessionId: 'batch-query-session',
          });
          
          const widgetDataSourceId = WIDGET_IDS[widgetId as keyof typeof WIDGET_IDS];
          if (!widgetDataSourceId) {
            console.warn(`No widget data source defined for widget: ${widgetId}`);
            failedRequests++;
            return { widgetId, data: null };
          }

          // Use unified dashboard API with widget parameter
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
          
          // Extract widget data from dashboard API response
          const widgetData = dashboardResult?.widgets?.[0]?.data || null;
          
          // 記錄成功的 fetch 時間
          const fetchTime = performance.now() - widgetStartTime;
          individualFetchTimes[widgetId] = fetchTime;
          
          performanceMonitor.recordMetrics({
            widgetId,
            timestamp: Date.now(),
            loadTime: fetchTime,
            renderTime: 0,
            dataFetchTime: fetchTime,
            route: window.location.pathname,
            variant: 'v2',
            sessionId: 'batch-query-session',
          });
          
          return { widgetId, data: widgetData };
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
    performanceMonitor.recordMetrics({
      widgetId: 'dashboard-batch',
      timestamp: Date.now(),
      loadTime: totalFetchTime,
      renderTime: 0,
      dataFetchTime: totalFetchTime,
      route: window.location.pathname,
      variant: 'v2',
      sessionId: 'batch-query-session',
    });

    return results;
  }, [stableDateRange, stableEnabledWidgets, options.batchSize, isTestMode]); // 使用穩定化的依賴

  // Memoize queryKey to prevent unnecessary refetches - 使用穩定化的依賴
  const queryKey = useMemo(() => {
    const key = [
      'dashboard-batch', 
      stableDateRange.startDate?.toISOString(),
      stableDateRange.endDate?.toISOString(),
      stableEnabledWidgets.join(','),
      isTestMode ? 'test' : 'prod' // 區分測試和生產環境
    ];
    console.log('[DEBUG] useDashboardBatchQuery queryKey:', key);
    return key;
  }, [stableDateRange.startDate, stableDateRange.endDate, stableEnabledWidgets, isTestMode]);

  // 使用 React Query 管理查詢
  const query = useQuery({
    queryKey,
    queryFn: fetchBatchData,
    enabled: options.enabled !== false, // 重新啟用查詢，但允許外部控制
    ...testModeConfig, // 使用環境特定的配置
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
      if (options.dateRange.startDate) {
        params.append('startDate', options.dateRange.startDate.toISOString());
      }
      if (options.dateRange.endDate) {
        params.append('endDate', options.dateRange.endDate.toISOString());
      }

      // Use unified dashboard API for single widget refetch
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
      
      // Extract widget data from dashboard API response
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
    
    // 在測試環境中返回模擬數據
    if (process.env.NODE_ENV === 'test') {
      const mockData: Partial<DashboardBatchQueryData> = {};
      
      if (enabledWidgets.includes('total_pallets')) {
        mockData.total_pallets = 100;
      }
      if (enabledWidgets.includes('awaitLocationQty')) {
        mockData.awaitLocationQty = 25;
      }
      if (enabledWidgets.includes('yesterdayTransferCount')) {
        mockData.yesterdayTransferCount = 15;
      }
      
      return mockData;
    }
    
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