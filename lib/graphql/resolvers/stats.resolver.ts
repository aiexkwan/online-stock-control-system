/**
 * Stats GraphQL Resolver
 * 處理統一的統計數據查詢
 */

import { createClient } from '@/app/utils/supabase/server';
import { 
  StatsType, 
  StatsData, 
  StatsCardData,
  StatsQueryInput,
  SingleStatQueryInput,
  TrendDirection,
  StatsConfig
} from '@/types/generated/graphql';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import DataLoader from 'dataloader';

// 統計配置映射
const STATS_CONFIG_MAP: Record<StatsType, StatsConfig> = {
  [StatsType.YesterdayTransferCount]: {
    type: StatsType.YesterdayTransferCount,
    title: 'Yesterday Transfers',
    description: 'Total transfers completed yesterday',
    icon: 'truck',
    refreshInterval: 60,
    color: 'blue',
  },
  [StatsType.AwaitLocationQty]: {
    type: StatsType.AwaitLocationQty,
    title: 'Await Location Qty',
    description: 'Total quantity in await locations',
    icon: 'cube',
    refreshInterval: 30,
    color: 'orange',
  },
  [StatsType.StillInAwait]: {
    type: StatsType.StillInAwait,
    title: 'Still In Await',
    description: 'Items still waiting to be processed',
    icon: 'clock',
    refreshInterval: 30,
    color: 'red',
  },
  [StatsType.StillInAwaitPercentage]: {
    type: StatsType.StillInAwaitPercentage,
    title: 'Await Percentage',
    description: 'Percentage of items in await',
    icon: 'chart-bar',
    refreshInterval: 30,
    color: 'purple',
  },
  [StatsType.ProductionStats]: {
    type: StatsType.ProductionStats,
    title: 'Production Stats',
    description: 'Overall production statistics',
    icon: 'beaker',
    refreshInterval: 60,
    color: 'green',
  },
  [StatsType.InjectionProductionStats]: {
    type: StatsType.InjectionProductionStats,
    title: 'Injection Production',
    description: 'Injection department production',
    icon: 'beaker',
    refreshInterval: 60,
    color: 'indigo',
  },
  [StatsType.StaffWorkload]: {
    type: StatsType.StaffWorkload,
    title: 'Staff Workload',
    description: 'Current staff workload',
    icon: 'user-group',
    refreshInterval: 120,
    color: 'blue',
  },
  [StatsType.WarehouseWorkLevel]: {
    type: StatsType.WarehouseWorkLevel,
    title: 'Warehouse Work Level',
    description: 'Current warehouse activity level',
    icon: 'building-office',
    refreshInterval: 60,
    color: 'green',
  },
  [StatsType.TransferTimeDistribution]: {
    type: StatsType.TransferTimeDistribution,
    title: 'Transfer Time',
    description: 'Average transfer processing time',
    icon: 'clock',
    refreshInterval: 300,
    color: 'purple',
  },
  [StatsType.StockLevelHistory]: {
    type: StatsType.StockLevelHistory,
    title: 'Stock Level',
    description: 'Current stock levels',
    icon: 'arrow-trending-up',
    refreshInterval: 300,
    color: 'indigo',
  },
};

// DataLoader for batch loading stats
const createStatsLoader = (supabase: any) => {
  return new DataLoader<StatsType, StatsData>(async (types) => {
    const results = await Promise.all(
      types.map(type => fetchStatData(supabase, type))
    );
    return results;
  });
};

// 獲取單個統計數據
async function fetchStatData(
  supabase: any, 
  type: StatsType,
  dateRange?: { start: string; end: string }
): Promise<StatsData> {
  const now = new Date();
  const yesterday = subDays(now, 1);
  
  // 默認日期範圍
  const defaultDateRange = {
    start: startOfDay(yesterday).toISOString(),
    end: endOfDay(yesterday).toISOString(),
  };
  
  const range = dateRange || defaultDateRange;

  switch (type) {
    case StatsType.YesterdayTransferCount: {
      const { data, error } = await supabase
        .from('record_pallet_transfer')
        .select('count', { count: 'exact' })
        .gte('transferdone', range.start)
        .lte('transferdone', range.end)
        .eq('status', 'COMPLETED');

      const count = data?.[0]?.count || 0;
      
      // 獲取前一天數據進行比較
      const previousRange = {
        start: startOfDay(subDays(yesterday, 1)).toISOString(),
        end: endOfDay(subDays(yesterday, 1)).toISOString(),
      };
      
      const { data: previousData } = await supabase
        .from('record_pallet_transfer')
        .select('count', { count: 'exact' })
        .gte('transferdone', previousRange.start)
        .lte('transferdone', previousRange.end)
        .eq('status', 'COMPLETED');
      
      const previousCount = previousData?.[0]?.count || 0;
      const change = count - previousCount;
      const changePercentage = previousCount > 0 ? (change / previousCount) * 100 : 0;

      return {
        type,
        value: count,
        label: 'transfers',
        unit: 'transfers',
        trend: {
          direction: change > 0 ? TrendDirection.Increasing : 
                    change < 0 ? TrendDirection.Decreasing : 
                    TrendDirection.Stable,
          value: Math.abs(change),
          percentage: Math.abs(changePercentage),
          label: `${change >= 0 ? '+' : ''}${change}`,
        },
        comparison: {
          previousValue: previousCount,
          previousLabel: format(subDays(yesterday, 1), 'MMM dd'),
          change,
          changePercentage,
        },
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    case StatsType.AwaitLocationQty: {
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('quantity')
        .eq('location', 'AWAIT');

      const totalQty = data?.reduce((sum: number, record: any) => 
        sum + (record.quantity || 0), 0) || 0;

      return {
        type,
        value: totalQty,
        label: 'units',
        unit: 'units',
        trend: undefined, // Could implement historical comparison
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    case StatsType.StillInAwait: {
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('count', { count: 'exact' })
        .eq('location', 'AWAIT')
        .gte('created_at', range.start);

      const count = data?.[0]?.count || 0;

      return {
        type,
        value: count,
        label: 'pallets',
        unit: 'pallets',
        trend: undefined,
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    case StatsType.StillInAwaitPercentage: {
      // 獲取總數
      const { data: totalData } = await supabase
        .from('record_palletinfo')
        .select('count', { count: 'exact' });
      
      const total = totalData?.[0]?.count || 1; // 避免除零

      // 獲取等待數量
      const { data: awaitData } = await supabase
        .from('record_palletinfo')
        .select('count', { count: 'exact' })
        .eq('location', 'AWAIT');
      
      const awaitCount = awaitData?.[0]?.count || 0;
      const percentage = (awaitCount / total) * 100;

      return {
        type,
        value: percentage,
        label: '%',
        unit: '%',
        trend: undefined,
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    // 其他統計類型的實現...
    default:
      return {
        type,
        value: 0,
        label: 'N/A',
        unit: '',
        trend: undefined,
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: false,
      };
  }
}

// GraphQL Resolvers
export const statsResolvers = {
  Query: {
    // 批量獲取統計數據
    statsCardData: async (
      _: any,
      { input }: { input: StatsQueryInput },
      context: any
    ): Promise<StatsCardData> => {
      const { supabase } = context;
      const startTime = Date.now();
      
      // 創建 DataLoader 實例
      const statsLoader = createStatsLoader(supabase);
      
      // 批量加載所有統計數據
      const statsPromises = input.types.map(type => 
        statsLoader.load(type)
      );
      
      const stats = await Promise.all(statsPromises);
      
      // 獲取配置
      const configs = input.types.map(type => STATS_CONFIG_MAP[type]);
      
      // 計算性能指標
      const endTime = Date.now();
      const performance = {
        totalQueries: input.types.length,
        cachedQueries: 0, // TODO: 實現緩存統計
        averageResponseTime: endTime - startTime,
        dataAge: 0, // TODO: 實現數據年齡計算
      };

      return {
        stats,
        configs,
        performance,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 60,
        dataSource: 'supabase',
      };
    },

    // 獲取單個統計數據
    statData: async (
      _: any,
      { input }: { input: SingleStatQueryInput },
      context: any
    ): Promise<StatsData> => {
      const { supabase } = context;
      return fetchStatData(
        supabase, 
        input.type,
        input.dateRange ? {
          start: input.dateRange.start,
          end: input.dateRange.end,
        } : undefined
      );
    },

    // 獲取可用的統計配置
    availableStats: async (
      _: any,
      { category, includeDisabled }: { category?: string; includeDisabled?: boolean }
    ): Promise<StatsConfig[]> => {
      // 返回所有配置（可以根據 category 過濾）
      return Object.values(STATS_CONFIG_MAP);
    },
  },

  Subscription: {
    // 訂閱統計數據更新
    statsUpdated: {
      subscribe: async function* (
        _: any,
        { types }: { types: StatsType[] }
      ) {
        // TODO: 實現實時訂閱邏輯
        // 這裡可以使用 Supabase Realtime 或其他實時數據源
      },
    },
  },
};