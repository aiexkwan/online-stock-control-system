/**
 * Stats GraphQL Resolver
 * 處理統一的統計數據查詢
 */

import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  StatsType,
  StatsData,
  StatsCardData,
  StatsQueryInput,
  SingleStatQueryInput,
  TrendDirection,
  StatsConfig,
} from '../../../types/generated/graphql';
// import { createClient } from '@/app/utils/supabase/server'; // Unused import
import { Database } from '../../database.types';

// 定義 Supabase client 類型
type SupabaseClientType = SupabaseClient<Database>;

// 定義資料庫查詢結果類型
type _PalletInfoRow = Database['public']['Tables']['record_palletinfo']['Row'];
type _InventoryRow = Database['public']['Tables']['record_inventory']['Row'];
type TransferRow = Database['public']['Tables']['record_transfer']['Row'];

// 為 record_pallet_transfer 定義 fallback 類型（如果表不存在）
type _PalletTransferRow = TransferRow & {
  transferdone?: string;
  status?: string;
  count?: number;
};

// 定義 GraphQL Context 類型
interface StatsResolverContext {
  supabase: SupabaseClientType;
  user?: { id: string; email: string; role: string };
}

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
const createStatsLoader = (supabase: SupabaseClientType) => {
  return new DataLoader<StatsType, StatsData>(async types => {
    const results = await Promise.all(types.map(type => fetchStatData(supabase, type)));
    return results;
  });
};

// 獲取單個統計數據
async function fetchStatData(
  supabase: SupabaseClientType,
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
      const result = await (supabase as any)
        .from('record_transfer')
        .select('*', { count: 'exact' })
        .gte('tran_date', range.start)
        .lte('tran_date', range.end);
      const { data: _data, error: _error, count } = result;

      const transferCount = count || 0;

      // 獲取前一天數據進行比較
      const previousRange = {
        start: startOfDay(subDays(yesterday, 1)).toISOString(),
        end: endOfDay(subDays(yesterday, 1)).toISOString(),
      };

      const previousResult = await (supabase as any)
        .from('record_transfer')
        .select('*', { count: 'exact' })
        .gte('tran_date', previousRange.start)
        .lte('tran_date', previousRange.end);
      const { data: _previousData, count: previousCount } = previousResult;

      const prevTransferCount = previousCount || 0;
      const change = transferCount - prevTransferCount;
      const changePercentage = prevTransferCount > 0 ? (change / prevTransferCount) * 100 : 0;

      return {
        type,
        value: transferCount,
        label: 'transfers',
        unit: 'transfers',
        trend: {
          direction:
            change > 0
              ? TrendDirection.Increasing
              : change < 0
                ? TrendDirection.Decreasing
                : TrendDirection.Stable,
          value: Math.abs(change),
          percentage: Math.abs(changePercentage),
          label: `${change >= 0 ? '+' : ''}${change}`,
        },
        comparison: {
          previousValue: prevTransferCount,
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
      const result = await (supabase as any)
        .from('record_palletinfo')
        .select('product_qty')
        .eq('location', 'AWAIT');
      const { data: _data, error: _error } = result;

      // 注意：此處查詢的 'quantity' 欄位在 record_palletinfo 表中不存在
      // 應該使用 'product_qty' 或從其他表查詢
      type RecordPalletInfo = { product_qty?: number };
      const records = _data as RecordPalletInfo[] | null;
      const totalQty = records
        ? records.reduce(
            (sum: number, record: RecordPalletInfo) => sum + (record.product_qty || 0),
            0
          )
        : 0;

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
      const {
        data: _data,
        error: _error,
        count,
      } = await (supabase as any)
        .from('record_palletinfo')
        .select('*', { count: 'exact' })
        .eq('location', 'AWAIT')
        .gte('created_at', range.start);

      const recordCount = count || 0;

      return {
        type,
        value: recordCount,
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
      const { data: _totalData, count: totalCount } = await (supabase as any)
        .from('record_palletinfo')
        .select('*', { count: 'exact' });

      const total = totalCount || 1; // 避免除零

      // 獲取等待數量
      const { data: _awaitData, count: awaitCount } = await (supabase as any)
        .from('record_palletinfo')
        .select('*', { count: 'exact' })
        .eq('location', 'AWAIT');

      const awaitRecordCount = awaitCount || 0;
      const percentage = (awaitRecordCount / total) * 100;

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
      const {
        data: _data,
        error: _error,
        count,
      } = await (supabase as any).from('record_palletinfo').select('*', { count: 'exact' });

      const palletCount = count || 0;

      return {
        type,
        value: palletCount,
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
      const {
        data: _data,
        error: _error,
        count,
      } = await (supabase as any)
        .from('record_transfer')
        .select('*', { count: 'exact' })
        .gte('tran_date', range.start)
        .lte('tran_date', range.end);

      const transferCount = count || 0;

      return {
        type,
        value: transferCount,
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
      const result = await (supabase as any)
        .from('record_inventory')
        .select('await, backcarpark, bulk, damage, fold, injection, pipeline, prebook');
      const { data: _data, error: _error } = result;

      // 注意：此處查詢的 'quantity' 欄位在 record_inventory 表中不存在
      // 應該使用具體的庫存字段總和
      type RecordInventory = {
        await?: number;
        backcarpark?: number;
        bulk?: number;
        damage?: number;
        fold?: number;
        injection?: number;
        pipeline?: number;
        prebook?: number;
      };
      const inventoryRecords = _data as RecordInventory[] | null;
      const totalInventory = inventoryRecords
        ? inventoryRecords.reduce((sum: number, record: RecordInventory) => {
            // 計算所有庫存位置的總和
            const quantity =
              (record.await || 0) +
              (record.backcarpark || 0) +
              (record.bulk || 0) +
              (record.damage || 0) +
              (record.fold || 0) +
              (record.injection || 0) +
              (record.pipeline || 0) +
              (record.prebook || 0);
            return sum + quantity;
          }, 0)
        : 0;

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
      _: unknown,
      { input }: { input: StatsQueryInput },
      context: StatsResolverContext
    ): Promise<StatsCardData> => {
      try {
        console.log('[StatsResolver] statsCardData called with _input:', input);

        const { supabase } = context;
        if (!supabase) {
          throw new Error('Supabase client not available in context');
        }

        const _startTime = Date.now();

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
        const _endTime = Date.now();
        const performance = {
          totalQueries: input.types.length,
          cachedQueries: 0, // TODO: 實現緩存統計
          averageResponseTime: _endTime - _startTime,
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
      _: unknown,
      { input }: { input: SingleStatQueryInput },
      context: StatsResolverContext
    ): Promise<StatsData> => {
      const { supabase } = context;
      return fetchStatData(
        supabase,
        input.type,
        input.dateRange
          ? {
              start: input.dateRange.start,
              end: input.dateRange.end,
            }
          : undefined
      );
    },

    // 獲取可用的統計配置
    availableStats: async (
      _: unknown,
      { category, includeDisabled }: { category?: string; includeDisabled?: boolean }
    ): Promise<StatsConfig[]> => {
      // 返回所有配置（可以根據 category 過濾）
      return Object.values(STATS_CONFIG_MAP);
    },
  },

  Subscription: {
    // 訂閱統計數據更新
    statsUpdated: {
      subscribe: async function* (_: unknown, { _types }: { _types: StatsType[] }) {
        // TODO: 實現實時訂閱邏輯
        // 這裡可以使用 Supabase Realtime 或其他實時數據源
      },
    },
  },
};
