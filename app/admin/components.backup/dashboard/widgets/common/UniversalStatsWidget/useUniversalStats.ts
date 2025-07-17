/**
 * Universal Stats Data Hook
 * 統一的數據獲取邏輯，支援多種數據源
 * GraphQL removed - using REST API only
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboardData } from '@/app/admin/contexts/DashboardDataContext';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
// GraphQL imports removed - using REST API only
import {
  StatsDataSourceConfig,
  StatsData,
  UseUniversalStatsResult,
  StatsPerformanceConfig,
} from './types';

/**
 * 統一的 Stats 數據獲取 Hook
 */
export function useUniversalStats(
  dataSourceConfig: StatsDataSourceConfig,
  performanceConfig?: StatsPerformanceConfig,
  timeFrame?: { start: Date; end: Date },
  isEditMode?: boolean
): UseUniversalStatsResult {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [source, setSource] = useState<'cache' | 'server' | 'fallback'>();

  // Dashboard batch data context
  const dashboardData = useDashboardData();

  // GraphQL configuration removed - using REST API only

  // GraphQL fallback hook removed - using REST API only

  // 批量數據獲取
  const getBatchData = useCallback(() => {
    if (dataSourceConfig.type !== 'batch' || !dataSourceConfig.widgetId || !dashboardData) {
      return null;
    }

    const widgetData = dashboardData.getWidgetData(dataSourceConfig.widgetId);
    return widgetData;
  }, [dataSourceConfig, dashboardData]);

  // Server Action 數據獲取
  const getServerData = useCallback(async () => {
    if (dataSourceConfig.type !== 'server' || !dataSourceConfig.serverAction) {
      return null;
    }

    try {
      setLoading(true);
      const result = await dataSourceConfig.serverAction(
        dataSourceConfig.variables,
        timeFrame
      );
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [dataSourceConfig, timeFrame]);

  // 數據轉換
  const transformData = useCallback(
    (rawData: any): StatsData | null => {
      if (!rawData) return null;

      try {
        if (dataSourceConfig.transform) {
          return dataSourceConfig.transform(rawData);
        }

        // 默認轉換邏輯
        if (typeof rawData === 'object' && rawData.value !== undefined) {
          return rawData as StatsData;
        }

        if (typeof rawData === 'number' || typeof rawData === 'string') {
          return { value: rawData };
        }

        return { value: rawData };
      } catch (err) {
        console.error('Data transformation error:', err);
        setError(err as Error);
        return null;
      }
    },
    [dataSourceConfig]
  );

  // 統一的數據獲取邏輯
  const fetchData = useCallback(async () => {
    if (isEditMode) {
      // 編輯模式使用模擬數據
      setData({
        value: '--',
        label: 'Edit Mode',
      });
      setSource('fallback');
      return;
    }

    try {
      setError(null);
      let rawData = null;
      let dataSource: typeof source = 'server';

      switch (dataSourceConfig.type) {
        case 'batch':
          rawData = getBatchData();
          dataSource = 'cache';
          break;

        case 'server':
          rawData = await getServerData();
          dataSource = 'server';
          break;

        default:
          throw new Error(`Unsupported data source type: ${dataSourceConfig.type}. Only 'batch' and 'server' are supported.`);
      }

      const transformedData = transformData(rawData);
      if (transformedData) {
        setData(transformedData);
        setLastUpdated(new Date());
        setSource(dataSource);
      }
    } catch (err) {
      setError(err as Error);
      
      // 使用 fallback 數據
      if (performanceConfig?.fallbackData) {
        setData(performanceConfig.fallbackData);
        setSource('fallback');
      }
    }
  }, [
    isEditMode,
    dataSourceConfig.type,
    getBatchData,
    getServerData,
    transformData,
    performanceConfig?.fallbackData,
  ]);

  // 刷新函數
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // 初始化和依賴更新
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // GraphQL data update and error handling removed - using REST API only

  // 載入狀態
  const isLoading = useMemo(() => {
    if (isEditMode) return false;
    
    switch (dataSourceConfig.type) {
      case 'batch':
        return false; // 批量數據應該立即可用
      case 'server':
        return loading;
      default:
        return false;
    }
  }, [dataSourceConfig.type, loading, isEditMode]);

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    lastUpdated,
    source,
  };
}

/**
 * 預設配置生成器
 */
export function createStatsConfig(
  widgetId: string,
  type: 'await' | 'transfer' | 'production' | 'percentage',
  customConfig?: Partial<StatsDataSourceConfig>
): StatsDataSourceConfig {
  const baseConfigs = {
    await: {
      type: 'batch' as const,
      widgetId: 'await_location_qty',
      transform: (data: any) => ({
        value: data?.value || 0,
        label: 'Await Location',
      }),
    },
    transfer: {
      type: 'batch' as const,
      widgetId: 'yesterday_transfer_count',
      transform: (data: any) => ({
        value: data?.value || 0,
        label: 'Transfers',
        trend: data?.trend && {
          value: data.trend.value,
          direction: data.trend.direction,
          percentage: data.trend.percentage,
        },
      }),
    },
    production: {
      type: 'server' as const,
      serverAction: async (variables: any, timeFrame?: { start: Date; end: Date }) => {
        // TODO: Replace with actual Server Action for production stats
        console.warn('Production stats GraphQL query removed - implement Server Action');
        return { value: 0, label: 'Production Pallets' };
      },
      transform: (data: any) => ({
        value: data?.value || 0,
        label: 'Production Pallets',
      }),
    },
    percentage: {
      type: 'server' as const,
      serverAction: async (variables: any, timeFrame?: { start: Date; end: Date }) => {
        // TODO: Replace with actual Server Action for await percentage
        console.warn('Await percentage GraphQL query removed - implement Server Action');
        return { value: 0, label: 'Still in Await' };
      },
      transform: (data: any) => {
        return {
          value: data?.value || 0,
          label: 'Still in Await',
          progress: data?.progress || {
            current: 0,
            total: 0,
            percentage: 0,
          },
        };
      },
    },
  };

  return {
    ...baseConfigs[type],
    ...customConfig,
  };
}