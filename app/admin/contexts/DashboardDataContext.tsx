'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useDashboardBatchQuery } from '@/app/admin/hooks/useDashboardBatchQuery';
import type { 
  DashboardBatchQueryData, 
  DashboardBatchQueryError,
  DashboardDateRange 
} from '@/app/admin/types';

interface DashboardDataContextValue {
  // 數據
  data: DashboardBatchQueryData | null;
  
  // 狀態
  loading: boolean;
  error: DashboardBatchQueryError | null;
  
  // 日期範圍
  dateRange: DashboardDateRange;
  setDateRange: (range: DashboardDateRange) => void;
  
  // 操作方法
  refetch: () => Promise<void>;
  refetchWidget: (widgetId: string) => Promise<void>;
  
  // 工具方法
  getWidgetData: <T = any>(widgetId: string) => T | null;
  isWidgetLoading: (widgetId: string) => boolean;
  getWidgetError: (widgetId: string) => Error | null;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

interface DashboardDataProviderProps {
  children: React.ReactNode;
  initialDateRange?: DashboardDateRange;
  autoRefreshInterval?: number; // 自動刷新間隔（毫秒）
  prefetchedData?: DashboardBatchQueryData | null; // SSR 預取數據
  ssrMode?: boolean; // 是否為 SSR 模式
}

export function DashboardDataProvider({ 
  children, 
  initialDateRange = { startDate: null, endDate: null },
  autoRefreshInterval,
  prefetchedData = null,
  ssrMode = false
}: DashboardDataProviderProps) {
  const [dateRange, setDateRange] = useState<DashboardDateRange>(initialDateRange);
  const [isRefetching, setIsRefetching] = useState(false);
  const [hybridData, setHybridData] = useState<DashboardBatchQueryData | null>(prefetchedData);
  
  const {
    data: queryData,
    loading: queryLoading,
    error,
    refetch: queryRefetch,
    refetchWidget: queryRefetchWidget
  } = useDashboardBatchQuery({ 
    dateRange,
    // 在 SSR 模式下，如果有預取數據，則禁用初始查詢
    enabled: ssrMode ? !prefetchedData : true
  });

  // 合併數據：優先使用客戶端數據，fallback 到預取數據
  const data = useMemo(() => {
    if (queryData) {
      // 客戶端查詢成功，合併預取數據和查詢數據
      return {
        ...hybridData,
        ...queryData,
      };
    }
    // 如果客戶端查詢還沒完成，使用預取數據
    return hybridData;
  }, [queryData, hybridData]);

  // 更新 hybridData 當預取數據改變
  useEffect(() => {
    if (prefetchedData && !queryData) {
      setHybridData(prefetchedData);
    }
  }, [prefetchedData, queryData]);

  // 合併 loading 狀態：SSR 模式下，如果有預取數據，則不顯示 loading
  const loading = useMemo(() => {
    if (ssrMode && prefetchedData) {
      // SSR 模式且有預取數據，只在 refetching 時顯示 loading
      return isRefetching;
    }
    return queryLoading || isRefetching;
  }, [ssrMode, prefetchedData, queryLoading, isRefetching]);

  // 手動 refetch 包裝
  const refetch = useCallback(async () => {
    try {
      setIsRefetching(true);
      await queryRefetch();
    } finally {
      setIsRefetching(false);
    }
  }, [queryRefetch]);

  // 單個 widget refetch 包裝
  const refetchWidget = useCallback(async (widgetId: string) => {
    try {
      setIsRefetching(true);
      await queryRefetchWidget(widgetId);
    } finally {
      setIsRefetching(false);
    }
  }, [queryRefetchWidget]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetch]);

  // 工具方法：獲取特定 widget 數據
  const getWidgetData = useCallback(<T = any>(widgetId: string): T | null => {
    if (!data) return null;
    return (data as any)[widgetId] || null;
  }, [data]);

  // 工具方法：檢查特定 widget 是否正在加載
  const isWidgetLoading = useCallback((widgetId: string): boolean => {
    // 如果整體正在加載，所有 widget 都在加載
    if (loading) return true;
    
    // 可以擴展為支持單個 widget 的加載狀態
    return false;
  }, [loading]);

  // 工具方法：獲取特定 widget 的錯誤
  const getWidgetError = useCallback((widgetId: string): Error | null => {
    if (!error) return null;
    
    // 如果是批量錯誤，返回整體錯誤
    if (error.type === 'batch') return error;
    
    // 如果是特定 widget 錯誤
    if (error.type === 'widget' && error.widgetId === widgetId) {
      return error;
    }
    
    return null;
  }, [error]);

  // 當日期範圍改變時自動重新獲取數據
  useEffect(() => {
    // 在 SSR 模式下且有預取數據時，不自動 refetch
    if (ssrMode && prefetchedData && !queryData) {
      return;
    }
    refetch();
  }, [dateRange, refetch, ssrMode, prefetchedData, queryData]);

  const contextValue = useMemo<DashboardDataContextValue>(() => ({
    data,
    loading,
    error,
    dateRange,
    setDateRange,
    refetch,
    refetchWidget,
    getWidgetData,
    isWidgetLoading,
    getWidgetError
  }), [
    data,
    loading,
    error,
    dateRange,
    refetch,
    refetchWidget,
    getWidgetData,
    isWidgetLoading,
    getWidgetError
  ]);

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  );
}

// Custom hook 使用 context
export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  
  return context;
}

// 專門用於單個 widget 的 hook
export function useWidgetData<T = any>(widgetId: string) {
  const { getWidgetData, isWidgetLoading, getWidgetError, refetchWidget } = useDashboardData();
  
  return useMemo(() => ({
    data: getWidgetData<T>(widgetId),
    loading: isWidgetLoading(widgetId),
    error: getWidgetError(widgetId),
    refetch: () => refetchWidget(widgetId)
  }), [widgetId, getWidgetData, isWidgetLoading, getWidgetError, refetchWidget]);
}

// 導出 context 本身（用於測試或高級用法）
export { DashboardDataContext };