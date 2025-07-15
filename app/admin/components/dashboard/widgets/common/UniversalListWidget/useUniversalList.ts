/**
 * Universal List Hook
 * 統一的列表數據獲取 hook，整合現有的 useGraphQLFallback 和 useInViewport
 */

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { simplePerformanceMonitor } from '@/lib/performance/SimplePerformanceMonitor';
import {
  UniversalListWidgetConfig,
  UseUniversalListReturn,
  PerformanceMetrics,
  FilterState,
  SortConfig,
} from './types';

/**
 * Universal List Hook - 統一的列表數據管理
 */
export function useUniversalList<T = any>(
  config: UniversalListWidgetConfig<T>,
  timeFrame?: { start: Date; end: Date },
  isEditMode: boolean = false
): UseUniversalListReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 視窗檢測 (Progressive Loading)
  const { isInViewport, hasBeenInViewport } = useInViewport(containerRef);
  
  // 本地狀態
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortConfig<T> | null>(null);
  
  // 構建查詢變數
  const variables = useMemo(() => {
    const baseVars = config.dataSource.variables || {};
    const filterVars = filters;
    const timeVars = timeFrame ? {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString(),
    } : {};
    
    return {
      ...baseVars,
      ...filterVars,
      ...timeVars,
      page,
      limit: config.pagination?.pageSize || 20,
      sortBy: sort?.field,
      sortDirection: sort?.direction,
    };
  }, [config.dataSource.variables, filters, timeFrame, page, sort, config.pagination?.pageSize]);

  // 核心數據獲取 (重用現有的 useGraphQLFallback)
  const {
    data: rawData,
    loading,
    error,
    refetch: originalRefetch,
    performanceMetrics: queryMetrics,
    mode,
  } = useGraphQLFallback({
    serverAction: config.dataSource.serverAction,
    extractFromContext: config.dataSource.extractFromContext,
    variables,
    skip: isEditMode || (config.performance?.progressiveLoading && !hasBeenInViewport),
    pollInterval: config.realtime?.pollInterval,
    fetchPolicy: 'cache-and-network',
    fallbackEnabled: true,
  });

  // 數據處理 (轉換、過濾、排序)
  const processedData = useMemo(() => {
    if (!rawData) return [];
    
    let result: T[] = rawData;
    
    // 應用數據轉換
    if (config.dataSource.transform) {
      result = config.dataSource.transform(result);
    }
    
    // 應用插件處理
    if (config.plugins) {
      result = config.plugins.reduce((data, plugin) => {
        try {
          return plugin.process(data, { filters, sort, timeFrame });
        } catch (error) {
          console.warn(`Plugin ${plugin.id} failed:`, error);
          return data;
        }
      }, result);
    }
    
    return result;
  }, [rawData, config.dataSource.transform, config.plugins, filters, sort, timeFrame]);

  // 分頁數據
  const paginatedData = useMemo(() => {
    if (config.pagination?.type === 'infinite') {
      // 無限滾動：累積所有頁面數據
      return processedData;
    } else {
      // 固定分頁：只顯示當前頁數據
      const pageSize = config.pagination?.pageSize || 20;
      const start = page * pageSize;
      return processedData.slice(0, start + pageSize);
    }
  }, [processedData, config.pagination, page]);

  // 性能指標
  const performanceMetrics: PerformanceMetrics = useMemo(() => {
    const metrics = {
      source: mode === 'context' ? 'Batch Query' : 'Server Action',
      optimized: mode === 'context',
      queryTime: queryMetrics?.queryTime,
    };
    
    // 記錄性能指標
    if (metrics.queryTime) {
      simplePerformanceMonitor.recordMetric(`list_widget_${config.display.title}`, metrics.queryTime, 'query');
    }
    
    return metrics;
  }, [mode, queryMetrics, config.display.title]);

  // 刷新功能
  const refresh = useCallback(() => {
    setPage(0);
    setLoadingMore(false);
    originalRefetch();
  }, [originalRefetch]);

  // 重新獲取數據
  const refetch = useCallback(() => {
    originalRefetch();
  }, [originalRefetch]);

  // 加載更多 (無限滾動)
  const loadMore = useCallback(async () => {
    if (config.pagination?.type !== 'infinite' || loadingMore) return;
    
    setLoadingMore(true);
    try {
      setPage(prev => prev + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [config.pagination?.type, loadingMore]);

  // 過濾操作
  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0); // 重置到第一頁
  }, []);

  // 排序操作
  const updateSort = useCallback((newSort: SortConfig<T> | null) => {
    setSort(newSort);
    setPage(0); // 重置到第一頁
  }, []);

  // 計算狀態
  const hasMore = useMemo(() => {
    if (config.pagination?.type !== 'infinite') return false;
    
    const pageSize = config.pagination?.pageSize || 20;
    const maxPages = config.pagination?.maxPages || 10;
    
    return (
      paginatedData.length >= (page + 1) * pageSize &&
      page < maxPages - 1 &&
      paginatedData.length < (processedData.length || 0)
    );
  }, [config.pagination, page, paginatedData.length, processedData.length]);

  const total = useMemo(() => {
    return processedData.length;
  }, [processedData.length]);

  // 數據源標識
  const source = useMemo(() => {
    switch (mode) {
      case 'context':
        return '🚀 Batch Query';
      default:
        return '🔄 Server Action';
    }
  }, [mode]);

  // 最後更新時間
  const lastUpdated = useMemo(() => {
    return new Date();
  }, [paginatedData]);

  return {
    // 數據狀態
    data: paginatedData,
    loading,
    error,
    total,
    hasMore,
    page,
    
    // 操作函數
    refetch,
    loadMore,
    refresh,
    
    // 過濾和排序 (擴展功能)
    updateFilters,
    updateSort,
    filters,
    sort,
    
    // 狀態信息
    mode,
    lastUpdated,
    source,
    performanceMetrics,
    
    // 視窗狀態 (用於 Progressive Loading)
    containerRef,
    isInViewport,
    hasBeenInViewport,
  } as UseUniversalListReturn<T> & {
    updateFilters: (filters: FilterState) => void;
    updateSort: (sort: SortConfig<T> | null) => void;
    filters: FilterState;
    sort: SortConfig<T> | null;
    containerRef: React.RefObject<HTMLDivElement>;
    isInViewport: boolean;
    hasBeenInViewport: boolean;
  };
}

/**
 * 創建 List 配置的輔助函數
 */
export function createListConfig<T>(
  baseConfig: UniversalListWidgetConfig<T>
): UniversalListWidgetConfig<T> {
  return {
    // 默認性能配置
    performance: {
      progressiveLoading: true,
      memoization: true,
      caching: {
        enabled: true,
        duration: 5 * 60 * 1000, // 5分鐘
      },
      ...baseConfig.performance,
    },
    
    // 默認實時配置
    realtime: {
      enabled: true,
      pollInterval: 30000, // 30秒
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      ...baseConfig.realtime,
    },
    
    // 默認分頁配置
    pagination: {
      type: 'infinite',
      pageSize: 20,
      maxPages: 10,
      ...baseConfig.pagination,
    },
    
    // 默認交互配置
    interaction: {
      refreshable: true,
      editMode: {
        enabled: true,
        placeholder: 'Edit Mode - Mock Data',
      },
      ...baseConfig.interaction,
    },
    
    // 合併其他配置
    ...baseConfig,
  };
}

/**
 * 性能優化的資料處理工具
 */
export class ListDataProcessor<T> {
  private cache = new Map<string, T[]>();
  
  process(
    data: T[],
    config: UniversalListWidgetConfig<T>,
    options: {
      filters?: FilterState;
      sort?: SortConfig<T> | null;
      timeFrame?: { start: Date; end: Date };
    } = {}
  ): T[] {
    const cacheKey = this.generateCacheKey(data, config, options);
    
    // 檢查緩存
    if (config.performance?.caching?.enabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    let result = [...data];
    
    // 應用時間範圍過濾
    if (options.timeFrame && config.filters?.enabled) {
      result = this.applyTimeFilter(result, options.timeFrame);
    }
    
    // 應用其他過濾器
    if (options.filters && Object.keys(options.filters).length > 0) {
      result = this.applyFilters(result, options.filters, config);
    }
    
    // 應用排序
    if (options.sort) {
      result = this.applySort(result, options.sort);
    }
    
    // 緩存結果
    if (config.performance?.caching?.enabled) {
      this.cache.set(cacheKey, result);
      
      // 清理過期緩存
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, config.performance.caching.duration || 5 * 60 * 1000);
    }
    
    return result;
  }
  
  private generateCacheKey(
    data: T[],
    config: UniversalListWidgetConfig<T>,
    options: any
  ): string {
    return JSON.stringify({
      dataLength: data.length,
      configId: config.display.title,
      options,
    });
  }
  
  private applyTimeFilter(data: T[], timeFrame: { start: Date; end: Date }): T[] {
    // 實現時間範圍過濾邏輯
    return data.filter((item: any) => {
      const itemDate = new Date(item.date || item.createdAt || item.updatedAt);
      return itemDate >= timeFrame.start && itemDate <= timeFrame.end;
    });
  }
  
  private applyFilters(data: T[], filters: FilterState, config: UniversalListWidgetConfig<T>): T[] {
    return data.filter((item: any) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        const filterConfig = config.filters?.filters.find(f => f.id === key);
        if (!filterConfig) return true;
        
        switch (filterConfig.type) {
          case 'text':
            return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
          case 'select':
            return item[key] === value;
          case 'date':
            return new Date(item[key]).toDateString() === new Date(value).toDateString();
          default:
            return true;
        }
      });
    });
  }
  
  private applySort(data: T[], sort: SortConfig<T>): T[] {
    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// 全局數據處理器實例
export const listDataProcessor = new ListDataProcessor();