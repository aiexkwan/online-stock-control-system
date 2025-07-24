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
  
  // 新Card系統統計類型配置
  [StatsType.PalletCount]: {
    type: StatsType.PalletCount,
    title: 'Pallet Count',
    description: 'Total number of pallets in system',
    icon: 'cube',
    refreshInterval: 60,
    color: 'blue',
  },
  [StatsType.QualityScore]: {
    type: StatsType.QualityScore,
    title: 'Quality Score',
    description: 'Overall quality performance score',
    icon: 'star',
    refreshInterval: 120,
    color: 'gold',
  },
  [StatsType.EfficiencyRate]: {
    type: StatsType.EfficiencyRate,
    title: 'Efficiency Rate',
    description: 'Operational efficiency percentage',
    icon: 'chart-bar',
    refreshInterval: 120,
    color: 'green',
  },
  [StatsType.TransferCount]: {
    type: StatsType.TransferCount,
    title: 'Transfer Count',
    description: 'Number of transfers processed',
    icon: 'truck',
    refreshInterval: 60,
    color: 'blue',
  },
  [StatsType.InventoryLevel]: {
    type: StatsType.InventoryLevel,
    title: 'Inventory Level',
    description: 'Current inventory levels',
    icon: 'archive',
    refreshInterval: 300,
    color: 'indigo',
  },
  [StatsType.PendingTasks]: {
    type: StatsType.PendingTasks,
    title: 'Pending Tasks',
    description: 'Tasks awaiting completion',
    icon: 'clock',
    refreshInterval: 60,
    color: 'orange',
  },
  [StatsType.ActiveUsers]: {
    type: StatsType.ActiveUsers,
    title: 'Active Users',
    description: 'Currently active system users',
    icon: 'user-group',
    refreshInterval: 300,
    color: 'green',
  },
  [StatsType.CompletionRate]: {
    type: StatsType.CompletionRate,
    title: 'Completion Rate',
    description: 'Task completion rate percentage',
    icon: 'check-circle',
    refreshInterval: 120,
    color: 'green',
  },
  [StatsType.ErrorRate]: {
    type: StatsType.ErrorRate,
    title: 'Error Rate',
    description: 'System error rate percentage',
    icon: 'exclamation-triangle',
    refreshInterval: 60,
    color: 'red',
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

    // 新Card系統統計類型實現
    case StatsType.PalletCount: {
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('count', { count: 'exact' });

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

    case StatsType.QualityScore: {
      // 模擬質量分數計算
      const score = Math.floor(Math.random() * 30) + 70; // 70-100分
      
      return {
        type,
        value: score,
        label: 'score',
        unit: '%',
        trend: {
          direction: TrendDirection.Increasing,
          value: 2.5,
          percentage: 3.6,
          label: '+2.5%',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
        optimized: true,
      };
    }

    case StatsType.EfficiencyRate: {
      // 模擬效率百分比
      const efficiency = Math.floor(Math.random() * 20) + 75; // 75-95%
      
      return {
        type,
        value: efficiency,
        label: 'efficiency',
        unit: '%',
        trend: {
          direction: TrendDirection.Stable,
          value: 0.8,
          percentage: 1.1,
          label: '+0.8%',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
        optimized: true,
      };
    }

    case StatsType.TransferCount: {
      const { data, error } = await supabase
        .from('record_pallet_transfer')
        .select('count', { count: 'exact' })
        .gte('created_at', range.start)
        .lte('created_at', range.end);

      const count = data?.[0]?.count || 0;

      return {
        type,
        value: count,
        label: 'transfers',
        unit: 'transfers',
        trend: undefined,
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    case StatsType.InventoryLevel: {
      const { data, error } = await supabase
        .from('record_inventory')
        .select('quantity')
        .gt('quantity', 0);

      const totalInventory = data?.reduce((sum: number, record: any) => 
        sum + (record.quantity || 0), 0) || 0;

      return {
        type,
        value: totalInventory,
        label: 'units',
        unit: 'units',
        trend: undefined,
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'supabase',
        optimized: true,
      };
    }

    case StatsType.PendingTasks: {
      // 模擬待處理任務數量
      const pendingCount = Math.floor(Math.random() * 50) + 5; // 5-55個
      
      return {
        type,
        value: pendingCount,
        label: 'tasks',
        unit: 'tasks',
        trend: {
          direction: TrendDirection.Decreasing,
          value: 3,
          percentage: 5.7,
          label: '-3',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
        optimized: true,
      };
    }

    case StatsType.ActiveUsers: {
      // 模擬活躍用戶數
      const activeUsers = Math.floor(Math.random() * 10) + 2; // 2-12個
      
      return {
        type,
        value: activeUsers,
        label: 'users',
        unit: 'users',
        trend: {
          direction: TrendDirection.Stable,
          value: 0,
          percentage: 0,
          label: '0',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
        optimized: true,
      };
    }

    case StatsType.CompletionRate: {
      // 模擬完成率
      const completionRate = Math.floor(Math.random() * 15) + 80; // 80-95%
      
      return {
        type,
        value: completionRate,
        label: 'completion',
        unit: '%',
        trend: {
          direction: TrendDirection.Increasing,
          value: 1.2,
          percentage: 1.5,
          label: '+1.2%',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
        optimized: true,
      };
    }

    case StatsType.ErrorRate: {
      // 模擬錯誤率
      const errorRate = Math.floor(Math.random() * 5) + 1; // 1-6%
      
      return {
        type,
        value: errorRate,
        label: 'error rate',
        unit: '%',
        trend: {
          direction: TrendDirection.Decreasing,
          value: 0.5,
          percentage: 8.3,
          label: '-0.5%',
        },
        comparison: undefined,
        lastUpdated: now.toISOString(),
        dataSource: 'calculated',
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
      try {
        console.log('[StatsResolver] statsCardData called with input:', input);
        
        const { supabase } = context;
        if (!supabase) {
          throw new Error('Supabase client not available in context');
        }
        
        const startTime = Date.now();
        
        // 創建 DataLoader 實例
        const statsLoader = createStatsLoader(supabase);
        
        // 批量加載所有統計數據
        const statsPromises = input.types.map(type => {
          console.log('[StatsResolver] Loading stat type:', type);
          return statsLoader.load(type);
        });
        
        const stats = await Promise.all(statsPromises);
        console.log('[StatsResolver] Loaded stats:', stats.length);
        
        // 獲取配置，確保過濾掉未定義的配置
        const configs = input.types.map(type => STATS_CONFIG_MAP[type]).filter(Boolean);
        console.log('[StatsResolver] Loaded configs:', configs.length);
        
        // 計算性能指標
        const endTime = Date.now();
        const performance = {
          totalQueries: input.types.length,
          cachedQueries: 0, // TODO: 實現緩存統計
          averageResponseTime: endTime - startTime,
          dataAge: 0, // TODO: 實現數據年齡計算
        };

        const result = {
          stats,
          configs,
          performance,
          lastUpdated: new Date().toISOString(),
          refreshInterval: 60,
          dataSource: 'supabase',
        };
        
        console.log('[StatsResolver] Returning result:', result);
        return result;
      } catch (error) {
        console.error('[StatsResolver] Error in statsCardData:', error);
        throw error;
      }
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