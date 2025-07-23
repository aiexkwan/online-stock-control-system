/**
 * Base DataLoader utilities
 * Provides common DataLoader patterns for GraphQL resolvers
 */

import DataLoader from 'dataloader';
import { createClient } from '@/app/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface DataLoaderContext {
  supabase: SupabaseClient;
  loaders: {
    product: DataLoader<string, any>;
    pallet: DataLoader<string, any>;
    inventory: DataLoader<string, any>;
    user: DataLoader<string, any>;
    location: DataLoader<string, any>;
    order: DataLoader<string, any>;
    transfer: DataLoader<string, any>;
    customer: DataLoader<string, any>;
    supplier: DataLoader<string, any>;
    // Complex loaders
    unifiedOperations?: DataLoader<any, any>;
    stockLevels?: DataLoader<any, any>;
    workLevel?: DataLoader<any, any>;
    grnAnalytics?: DataLoader<any, any>;
    performanceMetrics?: DataLoader<any, any>;
    inventoryOrderedAnalysis?: DataLoader<any, any>;
    historyTree?: DataLoader<any, any>;
    topProducts?: DataLoader<any, any>;
    stockDistribution?: DataLoader<any, any>;
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
    batchScheduleFn: (callback) => setTimeout(callback, 10), // 10ms delay for batching
    ...options,
  });
}

/**
 * Generic batch function for Supabase queries
 */
export async function batchQuery<T>(
  supabase: SupabaseClient,
  table: string,
  column: string,
  keys: readonly string[]
): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .in(column, keys as string[]);

  if (error) {
    console.error(`[DataLoader] Error loading ${table}:`, error);
    return keys.map(() => null);
  }

  // Create a map for O(1) lookup
  const dataMap = new Map(
    data.map((item: any) => [item[column], item])
  );

  // Return in the same order as keys
  return keys.map(key => dataMap.get(key) || null);
}

/**
 * Create a loader for a simple table lookup
 */
export function createSimpleLoader<T>(
  supabase: SupabaseClient,
  table: string,
  keyColumn: string = 'id'
): DataLoader<string, T> {
  return createBatchLoader<string, T>(
    async (keys) => batchQuery<T>(supabase, table, keyColumn, keys) as Promise<(T | Error)[]>
  );
}

/**
 * Create a loader for related entities (one-to-many)
 */
export function createRelatedLoader<T>(
  supabase: SupabaseClient,
  table: string,
  foreignKeyColumn: string,
  orderBy?: { column: string; ascending?: boolean }
): DataLoader<string, T[]> {
  return createBatchLoader<string, T[]>(
    async (keys) => {
      if (keys.length === 0) return [];

      let query = supabase
        .from(table)
        .select('*')
        .in(foreignKeyColumn, keys as string[]);

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

      data.forEach((item: any) => {
        const key = item[foreignKeyColumn];
        const group = groupedData.get(key) || [];
        group.push(item);
        groupedData.set(key, group);
      });

      return keys.map(key => groupedData.get(key) || []);
    }
  );
}

/**
 * Create a loader for aggregated data
 */
export function createAggregateLoader<T>(
  supabase: SupabaseClient,
  query: (keys: readonly string[]) => any
): DataLoader<string, T> {
  return createBatchLoader<string, T>(
    async (keys) => {
      if (keys.length === 0) return [];

      const { data, error } = await query(keys);

      if (error) {
        console.error('[DataLoader] Error loading aggregate data:', error);
        return keys.map(() => null as any);
      }

      // Assume query returns data keyed by the input keys
      const dataMap = new Map(data);
      return keys.map(key => dataMap.get(key) || null);
    }
  );
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
export function primeCache<K, V>(
  loader: DataLoader<K, V>,
  key: K,
  value: V
): void {
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
    createStockDistributionLoader
  } = await import('./complex.dataloader');

  return {
    supabase,
    loaders: {
      product: createSimpleLoader(supabase, 'data_code', 'code'),
      pallet: createSimpleLoader(supabase, 'record_palletinfo', 'plt_num'),
      inventory: createSimpleLoader(supabase, 'record_inventory', 'product_code'),
      user: createSimpleLoader(supabase, 'data_id', 'id'),
      location: createSimpleLoader(supabase, 'locations', 'code'),
      order: createSimpleLoader(supabase, 'data_order', 'order_number'),
      transfer: createSimpleLoader(supabase, 'record_transfer', 'id'),
      customer: createSimpleLoader(supabase, 'customers', 'code'),
      supplier: createSimpleLoader(supabase, 'data_supplier', 'code'),
      // Complex loaders for handling JOINs
      unifiedOperations: createUnifiedOperationsLoader(supabase),
      stockLevels: createStockLevelsLoader(supabase),
      workLevel: createWorkLevelLoader(supabase),
      grnAnalytics: createGRNAnalyticsLoader(supabase),
      performanceMetrics: createPerformanceMetricsLoader(supabase),
      inventoryOrderedAnalysis: createInventoryOrderedAnalysisLoader(supabase),
      historyTree: createHistoryTreeLoader(supabase),
      topProducts: createTopProductsLoader(supabase),
      stockDistribution: createStockDistributionLoader(supabase),
    },
  };
}