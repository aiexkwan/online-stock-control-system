/**
 * Universal Stats Data Hook
 * 統一的數據獲取邏輯，支援多種數據源
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { useDashboardData } from '@/app/admin/contexts/DashboardDataContext';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { gql } from '@apollo/client';
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
  const [source, setSource] = useState<'cache' | 'graphql' | 'server' | 'fallback'>();

  // Dashboard batch data context
  const dashboardData = useDashboardData();

  // GraphQL fallback 配置
  const graphqlConfig = useMemo(() => {
    if (dataSourceConfig.type !== 'graphql' || !dataSourceConfig.query) {
      return null;
    }

    return {
      graphqlQuery: gql(dataSourceConfig.query),
      serverAction: dataSourceConfig.serverAction,
      variables: {
        ...dataSourceConfig.variables,
        ...(timeFrame && {
          startDate: timeFrame.start.toISOString(),
          endDate: timeFrame.end.toISOString(),
        }),
      },
      skip: isEditMode,
      fallbackEnabled: performanceConfig?.enableFallback ?? true,
      widgetId: dataSourceConfig.widgetId || 'universal-stats',
    };
  }, [dataSourceConfig, timeFrame, isEditMode, performanceConfig?.enableFallback]);

  // GraphQL fallback hook
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: graphqlRefetch,
    mode: graphqlMode,
  } = useGraphQLFallback<any, any>(
    graphqlConfig || {
      graphqlQuery: gql`query EmptyQuery { __typename }`,
      serverAction: async () => null,
      variables: {},
      skip: true,
      fallbackEnabled: false,
      widgetId: 'empty',
    }
  );

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
    [dataSourceConfig.transform]
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

        case 'graphql':
          rawData = graphqlData;
          dataSource = graphqlMode as typeof source;
          break;

        case 'server':
          rawData = await getServerData();
          dataSource = 'server';
          break;

        default:
          throw new Error(`Unsupported data source type: ${dataSourceConfig.type}`);
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
    graphqlData,
    graphqlMode,
    getServerData,
    transformData,
    performanceConfig?.fallbackData,
  ]);

  // 刷新函數
  const refetch = useCallback(async () => {
    if (dataSourceConfig.type === 'graphql' && graphqlRefetch) {
      await graphqlRefetch();
    } else {
      await fetchData();
    }
  }, [dataSourceConfig.type, graphqlRefetch, fetchData]);

  // 初始化和依賴更新
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // GraphQL 數據更新
  useEffect(() => {
    if (dataSourceConfig.type === 'graphql' && graphqlData) {
      const transformedData = transformData(graphqlData);
      if (transformedData) {
        setData(transformedData);
        setLastUpdated(new Date());
        setSource(graphqlMode as typeof source);
      }
    }
  }, [dataSourceConfig.type, graphqlData, graphqlMode, transformData]);

  // 錯誤處理
  useEffect(() => {
    if (dataSourceConfig.type === 'graphql' && graphqlError) {
      setError(graphqlError);
    }
  }, [dataSourceConfig.type, graphqlError]);

  // 載入狀態
  const isLoading = useMemo(() => {
    if (isEditMode) return false;
    
    switch (dataSourceConfig.type) {
      case 'graphql':
        return graphqlLoading;
      case 'batch':
        return false; // 批量數據應該立即可用
      case 'server':
        return loading;
      default:
        return false;
    }
  }, [dataSourceConfig.type, graphqlLoading, loading, isEditMode]);

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
      type: 'graphql' as const,
      query: `
        query GetProductionStats($startDate: timestamptz!, $endDate: timestamptz!) {
          record_palletinfoCollection(
            filter: { generated_datetime: { gte: $startDate, lte: $endDate } }
          ) {
            edges {
              node {
                pallet_id
                generated_datetime
              }
            }
          }
        }
      `,
      transform: (data: any) => ({
        value: data?.record_palletinfoCollection?.edges?.length || 0,
        label: 'Production Pallets',
      }),
    },
    percentage: {
      type: 'graphql' as const,
      query: `
        query GetAwaitPercentage($startDate: timestamptz!, $endDate: timestamptz!) {
          record_palletinfoCollection(
            filter: { generated_datetime: { gte: $startDate, lte: $endDate } }
          ) {
            edges {
              node {
                pallet_id
                record_inventoryCollection(
                  filter: { await: { gt: 0 } }
                  first: 1
                ) {
                  edges {
                    node {
                      await
                    }
                  }
                }
              }
            }
          }
        }
      `,
      transform: (data: any) => {
        const edges = data?.record_palletinfoCollection?.edges || [];
        const total = edges.length;
        const awaitCount = edges.filter((edge: any) => 
          edge.node.record_inventoryCollection?.edges?.length > 0
        ).length;
        
        const percentage = total > 0 ? Math.round((awaitCount / total) * 100) : 0;
        
        return {
          value: percentage,
          label: 'Still in Await',
          progress: {
            current: awaitCount,
            total,
            percentage,
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