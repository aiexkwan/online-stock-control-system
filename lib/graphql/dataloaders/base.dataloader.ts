/**
 * Base DataLoader utilities
 * Provides common DataLoader patterns for GraphQL resolvers
 */

import DataLoader from 'dataloader';
import { createClient } from '@/app/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Product,
  Supplier,
  Pallet,
  User,
  Location,
  Order,
  Transfer,
  Customer,
  Inventory,
  UnifiedOperationsKey,
  UnifiedOperationsData,
  StockLevelKey,
  StockLevelData,
  WorkLevelKey,
  WorkLevelData,
  GRNAnalyticsKey,
  GRNAnalyticsData,
  PerformanceMetricsKey,
  PerformanceMetricsData,
  InventoryOrderedAnalysisKey,
  InventoryOrderedAnalysisData,
  HistoryTreeKey,
  HistoryTreeData,
  TopProductsKey,
  TopProductsData,
  StockDistributionKey,
  StockDistributionData,
  DatabaseEntity,
} from '@/lib/types/dataloaders';

// Import Record History types
import type { RecordHistoryKey, RecordHistoryData } from './record-history.dataloader';

// Dashboard Stats DataLoader types
export interface DashboardStatsKey {
  useEstimatedCount: boolean;
  includeDetailedStats: boolean;
}

export interface DashboardStatsData {
  totalPallets: number;
  activePallets: number;
  uniqueProducts: number;
  todayTransfers: number;
  pendingOrders: number;
  dailyDonePallets?: number;
  dailyTransferredPallets?: number;
  yesterdayDonePallets?: number;
  yesterdayTransferredPallets?: number;
  past3DaysGenerated?: number;
  past3DaysTransferredPallets?: number;
  past7DaysGenerated?: number;
  past7DaysTransferredPallets?: number;
  executionTimeMs: number;
  lastUpdated: string;
}

export interface DataLoaderContext {
  supabase: SupabaseClient;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  loaders: {
    product: DataLoader<string, Product>;
    pallet: DataLoader<string, Pallet>;
    inventory: DataLoader<string, Inventory>;
    user: DataLoader<string, User>;
    location: DataLoader<string, Location>;
    order: DataLoader<string, Order>;
    transfer: DataLoader<string, Transfer>;
    customer: DataLoader<string, Customer>;
    supplier: DataLoader<string, Supplier>;
    // Pallet specific loaders
    palletByPlateSeries?: DataLoader<string, Pallet>;
    userByName?: DataLoader<string, User>;
    // Complex loaders
    unifiedOperations?: DataLoader<UnifiedOperationsKey, UnifiedOperationsData>;
    stockLevels?: DataLoader<StockLevelKey, StockLevelData>;
    workLevel?: DataLoader<WorkLevelKey, WorkLevelData>;
    grnAnalytics?: DataLoader<GRNAnalyticsKey, GRNAnalyticsData>;
    performanceMetrics?: DataLoader<PerformanceMetricsKey, PerformanceMetricsData>;
    inventoryOrderedAnalysis?: DataLoader<
      InventoryOrderedAnalysisKey,
      InventoryOrderedAnalysisData
    >;
    historyTree?: DataLoader<HistoryTreeKey, HistoryTreeData>;
    topProducts?: DataLoader<TopProductsKey, TopProductsData>;
    stockDistribution?: DataLoader<StockDistributionKey, StockDistributionData>;
    // Dashboard Stats
    dashboardStats?: DataLoader<DashboardStatsKey, DashboardStatsData>;
    // Record History
    recordHistory?: DataLoader<RecordHistoryKey, RecordHistoryData>;
  };
}

/**
 * Create a batch loading function with error handling
 */
export function createBatchLoader<K, V>(
  batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>,
  options?: DataLoader.Options<K, V>
): DataLoader<K, V> {
  return new DataLoader<K, V>(batchFn, {
    cache: true,
    maxBatchSize: 100,
    batchScheduleFn: callback => setTimeout(callback, 10), // 10ms delay for batching
    ...options,
  });
}

/**
 * Generic batch function for Supabase queries
 */
export async function batchQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  column: string,
  keys: readonly string[]
): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .in(column, [...keys] as unknown[]);

  if (error) {
    console.error(`[DataLoader] Error loading ${table}:`, error);
    return keys.map(() => null);
  }

  // Create a map for O(1) lookup - handle both string and number keys
  const dataMap = new Map(data?.map((item: unknown) => {
    const keyValue = (item as Record<string, unknown>)[column];
    // Convert both number and string keys to string for consistent lookup
    const normalizedKey = String(keyValue);
    return [normalizedKey, item as T];
  }) || []);

  // Return in the same order as keys - ensure keys are strings for lookup
  return keys.map(key => dataMap.get(String(key)) || null);
}

/**
 * Dashboard Stats DataLoader batch function
 */
export async function batchDashboardStats(
  supabase: SupabaseClient,
  keys: readonly DashboardStatsKey[]
): Promise<(DashboardStatsData | Error)[]> {
  if (keys.length === 0) return [];

  // 由於 Dashboard Stats 通常參數相似，我們可以做一些優化
  const results: (DashboardStatsData | Error)[] = [];

  for (const key of keys) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_use_estimated_count: key.useEstimatedCount,
        p_include_detailed_stats: key.includeDetailedStats,
      });

      if (error) {
        results.push(new Error(`Dashboard stats RPC error: ${error.message}`));
        continue;
      }

      const executionTime = Date.now() - startTime;
      
      // Map RPC response to DataLoader format
      const basicStats = data?.basic_stats || {};
      const inventoryStats = data?.inventory_stats || {};
      const activityStats = data?.activity_stats || {};
      const performanceStats = data?.performance || {};
      
      const statsData: DashboardStatsData = {
        // 基本統計
        totalPallets: basicStats.total_pallets || 0,
        activePallets: inventoryStats.active_records || basicStats.total_pallets || 0,
        uniqueProducts: basicStats.total_products || 0,
        todayTransfers: activityStats?.totals?.today || 0,
        pendingOrders: 0, // TODO: 需要在RPC中添加pending orders統計
        
        // 詳細統計 (條件性返回)
        ...(key.includeDetailedStats && {
          dailyDonePallets: activityStats?.totals?.today || 0,
          dailyTransferredPallets: activityStats?.totals?.today || 0,
          yesterdayDonePallets: Math.max(0, (activityStats?.totals?.this_week || 0) - (activityStats?.totals?.today || 0)),
          yesterdayTransferredPallets: Math.max(0, (activityStats?.totals?.this_week || 0) - (activityStats?.totals?.today || 0)),
          past3DaysGenerated: Math.floor((activityStats?.totals?.this_week || 0) * 0.6),
          past3DaysTransferredPallets: Math.floor((activityStats?.totals?.this_week || 0) * 0.6),
          past7DaysGenerated: activityStats?.totals?.this_week || 0,
          past7DaysTransferredPallets: activityStats?.totals?.this_week || 0,
        }),
        
        executionTimeMs: parseFloat(performanceStats.calculation_time?.replace('ms', '') || '0') || executionTime,
        lastUpdated: data?.generated_at || new Date().toISOString(),
      };

      results.push(statsData);
    } catch (error) {
      results.push(error instanceof Error ? error : new Error('Unknown dashboard stats error'));
    }
  }

  return results;
}

/**
 * Create Dashboard Stats DataLoader
 */
export function createDashboardStatsLoader(supabase: SupabaseClient): DataLoader<DashboardStatsKey, DashboardStatsData> {
  return new DataLoader<DashboardStatsKey, DashboardStatsData>(
    (keys: readonly DashboardStatsKey[]) => batchDashboardStats(supabase, keys),
    {
      maxBatchSize: 10, // 限制批次大小，因為 dashboard stats 查詢相對昂貴
      cache: true,
    }
  );
}

/**
 * Create a loader for pallet lookup by plate series
 */
export function createPalletBySeriesLoader(supabase: SupabaseClient): DataLoader<string, Pallet> {
  return createBatchLoader<string, Pallet>(async keys => {
    const results = await batchQuery<Pallet>(supabase, 'record_palletinfo', 'series', keys);
    return results.map(result =>
      result === null ? new Error(`Pallet not found for series`) : result
    ) as (Pallet | Error)[];
  });
}

/**
 * Create a loader for user lookup by name
 */
export function createUserByNameLoader(supabase: SupabaseClient): DataLoader<string, User> {
  return createBatchLoader<string, User>(async keys => {
    const results = await batchQuery<User>(supabase, 'data_id', 'name', keys);
    return results.map(result =>
      result === null ? new Error(`User not found by name`) : result
    ) as (User | Error)[];
  });
}

/**
 * Create a loader for a simple table lookup
 */
export function createSimpleLoader<T extends Record<string, unknown> = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  keyColumn: string = 'id',
  useIlike: boolean = false
): DataLoader<string, T> {
  return createBatchLoader<string, T>(async keys => {
    if (keys.length === 0) return [];

    // Handle case-insensitive queries for certain tables
    if (useIlike) {
      // For case-insensitive search, we need individual queries
      const results = await Promise.all(
        keys.map(async key => {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .ilike(keyColumn, key)
            .maybeSingle();
          
          if (error) {
            console.error(`[DataLoader] Error loading from ${table}:`, error);
            return null;
          }
          return data;
        })
      );
      return results.map(result =>
        result === null ? new Error(`Not found in ${table}`) : result as T
      ) as (T | Error)[];
    } else {
      // Use batch query for exact matches
      const results = await batchQuery<T>(supabase, table, keyColumn, keys);
      return results.map(result =>
        result === null ? new Error(`Not found in ${table}`) : result
      ) as (T | Error)[];
    }
  });
}

/**
 * Create a loader for related entities (one-to-many)
 */
export function createRelatedLoader<T extends Record<string, unknown> = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  foreignKeyColumn: string,
  orderBy?: { column: string; ascending?: boolean }
): DataLoader<string, T[]> {
  return createBatchLoader<string, T[]>(async keys => {
    if (keys.length === 0) return [];

    let query = supabase
      .from(table)
      .select('*')
      .in(foreignKeyColumn, [...keys] as unknown[]);

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[DataLoader] Error loading related ${table}:`, error);
      return keys.map(() => []);
    }

    // Group by foreign key
    const groupedData = new Map<string, T[]>();
    keys.forEach(key => groupedData.set(key, []));

    data?.forEach((item: unknown) => {
      const typedItem = item as T;
      const key = typedItem[foreignKeyColumn] as string;
      const group = groupedData.get(key) || [];
      group.push(typedItem);
      groupedData.set(key, group);
    });

    return keys.map(key => groupedData.get(key) || []);
  });
}

// Type for aggregate query functions
type AggregateQuery<K extends string | number | symbol, T> = (keys: readonly K[]) => Promise<{
  data: Map<K, T> | [K, T][];
  error?: Error | null;
}>;

/**
 * Create a loader for aggregated data
 */
export function createAggregateLoader<K extends string | number | symbol = string, T = unknown>(
  supabase: SupabaseClient,
  query: AggregateQuery<K, T>
): DataLoader<K, T> {
  return createBatchLoader<K, T>(async keys => {
    if (keys.length === 0) return [];

    const { data, error } = await query(keys);

    if (error) {
      console.error('[DataLoader] Error loading aggregate data:', error);
      return keys.map(() => null as T | Error);
    }

    // Handle both Map and array of tuples
    const dataMap = data instanceof Map ? data : new Map(data);
    return keys.map(key => dataMap.get(key) || null) as (T | Error)[];
  });
}

/**
 * Clear all DataLoader caches
 */
export function clearAllCaches(context: DataLoaderContext): void {
  Object.values(context.loaders).forEach(loader => {
    if (loader && typeof loader.clearAll === 'function') {
      loader.clearAll();
    }
  });
}

/**
 * Prime DataLoader cache with known data
 */
export function primeCache<K, V>(loader: DataLoader<K, V>, key: K, value: V): void {
  loader.prime(key, value);
}

/**
 * Create DataLoader context for a request
 */
export async function createDataLoaderContext(): Promise<DataLoaderContext> {
  const supabase = await createClient();

  // Lazy import complex loaders to avoid circular dependencies
  const {
    createUnifiedOperationsLoader,
    createStockLevelsLoader,
    createWorkLevelLoader,
    createGRNAnalyticsLoader,
    createPerformanceMetricsLoader,
    createInventoryOrderedAnalysisLoader,
    createHistoryTreeLoader,
    createTopProductsLoader,
    createStockDistributionLoader,
  } = await import('./complex.dataloader');
  
  const { createRecordHistoryDataLoader } = await import('./record-history.dataloader');

  return {
    supabase,
    loaders: {
      product: createSimpleLoader<Product>(supabase, 'data_code', 'code', true), // Use case-insensitive search
      pallet: createSimpleLoader<Pallet>(supabase, 'record_palletinfo', 'plt_num'),
      inventory: createSimpleLoader<Inventory>(supabase, 'record_inventory', 'product_code'),
      user: createSimpleLoader<User>(supabase, 'data_id', 'id'),
      location: createSimpleLoader<Location>(supabase, 'work_level', 'id'), // 修正：work_level 表用 id 欄位
      order: createSimpleLoader<Order>(supabase, 'data_order', 'order_ref'), // 修正：使用 order_ref 而不是 order_number  
      transfer: createSimpleLoader<Transfer>(supabase, 'record_transfer', 'uuid'), // 修正：使用 uuid 而不是 id
      customer: createSimpleLoader<Customer>(supabase, 'data_order', 'customer_ref'), // 修正：使用 customer_ref
      supplier: createSimpleLoader<Supplier>(supabase, 'data_supplier', 'supplier_code'), // 修正：使用正確的欄位名
      // Pallet specific loaders
      palletByPlateSeries: createPalletBySeriesLoader(supabase),
      userByName: createUserByNameLoader(supabase),
      // Complex loaders for handling JOINs
      unifiedOperations: createUnifiedOperationsLoader(supabase) as unknown as DataLoader<UnifiedOperationsKey, UnifiedOperationsData>,
      stockLevels: createStockLevelsLoader(supabase) as unknown as DataLoader<StockLevelKey, StockLevelData>,
      workLevel: createWorkLevelLoader(supabase) as unknown as DataLoader<WorkLevelKey, WorkLevelData>,
      grnAnalytics: createGRNAnalyticsLoader(supabase) as unknown as DataLoader<GRNAnalyticsKey, GRNAnalyticsData>,
      performanceMetrics: createPerformanceMetricsLoader(supabase) as unknown as DataLoader<PerformanceMetricsKey, PerformanceMetricsData>,
      inventoryOrderedAnalysis: createInventoryOrderedAnalysisLoader(supabase) as unknown as DataLoader<InventoryOrderedAnalysisKey, InventoryOrderedAnalysisData>,
      historyTree: createHistoryTreeLoader(supabase) as unknown as DataLoader<HistoryTreeKey, HistoryTreeData>,
      topProducts: createTopProductsLoader(supabase) as unknown as DataLoader<TopProductsKey, TopProductsData>,
      stockDistribution: createStockDistributionLoader(supabase) as unknown as DataLoader<StockDistributionKey, StockDistributionData>,
      // Record History DataLoader
      recordHistory: new DataLoader<RecordHistoryKey, RecordHistoryData>(
        async (keys: readonly RecordHistoryKey[]) => {
          const loader = createRecordHistoryDataLoader(supabase);
          const stringKeys = keys.map(key => JSON.stringify(key));
          const results = await loader.recordHistoryLoader.loadMany(stringKeys);
          return results.map(result => result instanceof Error ? result : result);
        }
      ),
    },
  };
}
