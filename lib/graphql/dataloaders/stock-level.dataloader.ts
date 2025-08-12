/**
 * Stock Level DataLoader
 * Optimized DataLoader for stock_level table queries
 * Solves N+1 problems for real-time stock level data
 */

import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';

// Types for stock level data
export interface StockLevelRecord {
  uuid: string;
  stock: string;
  description: string;
  stock_level: number;
  update_time: string;
}

interface DatabaseStockLevelRecord {
  uuid: string;
  stock: string;
  description: string | null;
  stock_level: number;
  update_time: string;
}

export interface StockLevelFilter {
  stockCodePattern?: string;
  descriptionPattern?: string;
  minLevel?: number;
  maxLevel?: number;
  updatedAfter?: string;
  updatedBefore?: string;
}

export interface StockLevelSort {
  field: 'stock' | 'description' | 'stock_level' | 'update_time';
  direction: 'asc' | 'desc';
}

export interface StockLevelQuery {
  filter?: StockLevelFilter;
  sort?: StockLevelSort;
  limit?: number;
  offset?: number;
}

export interface StockLevelConnection {
  nodes: StockLevelRecord[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Batch function for loading stock levels by stock codes
 */
async function batchStockLevelsByCode(
  supabase: SupabaseClient,
  stockCodes: readonly string[]
): Promise<(StockLevelRecord | Error)[]> {
  if (stockCodes.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('stock_level')
      .select('*')
      .in('stock', [...stockCodes]);

    if (error) {
      console.error('[StockLevelDataLoader] Error loading stock levels:', error);
      return stockCodes.map(() => new Error(`Failed to load stock level: ${error.message}`));
    }

    interface DatabaseStockLevelRecord {
      uuid: string;
      stock: string;
      description?: string | null;
      stock_level: number;
      update_time: string;
    }
    
    // Create a map for O(1) lookup
    const stockMap = new Map<string, StockLevelRecord>();
    data?.forEach((record: DatabaseStockLevelRecord) => {
      stockMap.set(record.stock, {
        uuid: record.uuid,
        stock: record.stock,
        description: record.description || '',
        stock_level: record.stock_level,
        update_time: record.update_time,
      });
    });

    // Return in the same order as requested, with null for missing records
    return stockCodes.map(code => {
      const record = stockMap.get(code);
      return record || new Error(`Stock level not found for code: ${code}`);
    });
  } catch (error) {
    console.error('[StockLevelDataLoader] Unexpected error:', error);
    return stockCodes.map(() => new Error('Unexpected error loading stock level'));
  }
}

/**
 * Batch function for loading multiple stock levels with filtering
 */
async function batchStockLevelsWithFilter(
  supabase: SupabaseClient,
  queries: readonly StockLevelQuery[]
): Promise<(StockLevelConnection | Error)[]> {
  if (queries.length === 0) return [];

  // For now, handle each query individually due to complex filtering
  // In a real production system, you might want to optimize similar queries
  const results = await Promise.all(
    queries.map(async (query) => {
      try {
        let supabaseQuery = supabase
          .from('stock_level')
          .select('*', { count: 'exact' });

        // Apply filters
        if (query.filter) {
          const { filter } = query;
          
          if (filter.stockCodePattern) {
            supabaseQuery = supabaseQuery.ilike('stock', `%${filter.stockCodePattern}%`);
          }
          
          if (filter.descriptionPattern) {
            supabaseQuery = supabaseQuery.ilike('description', `%${filter.descriptionPattern}%`);
          }
          
          if (filter.minLevel !== undefined) {
            supabaseQuery = supabaseQuery.gte('stock_level', filter.minLevel);
          }
          
          if (filter.maxLevel !== undefined) {
            supabaseQuery = supabaseQuery.lte('stock_level', filter.maxLevel);
          }
          
          if (filter.updatedAfter) {
            supabaseQuery = supabaseQuery.gte('update_time', filter.updatedAfter);
          }
          
          if (filter.updatedBefore) {
            supabaseQuery = supabaseQuery.lte('update_time', filter.updatedBefore);
          }
        }

        // Apply sorting
        if (query.sort) {
          supabaseQuery = supabaseQuery.order(
            query.sort.field, 
            { ascending: query.sort.direction === 'asc' }
          );
        } else {
          // Default sort by stock_level descending
          supabaseQuery = supabaseQuery.order('stock_level', { ascending: false });
        }

        // Apply pagination
        if (query.limit) {
          supabaseQuery = supabaseQuery.limit(query.limit);
        }
        
        if (query.offset) {
          supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 10)) - 1);
        }

        const { data, error, count } = await supabaseQuery;

        if (error) {
          return new Error(`Failed to load stock levels: ${error.message}`);
        }

        const nodes: StockLevelRecord[] = (data || []).map((record: DatabaseStockLevelRecord) => ({
          uuid: record.uuid,
          stock: record.stock,
          description: record.description || '',
          stock_level: record.stock_level,
          update_time: record.update_time,
        }));

        const totalCount = count || 0;
        const limit = query.limit || 10;
        const offset = query.offset || 0;

        return {
          nodes,
          totalCount,
          hasNextPage: (offset + limit) < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: nodes.length > 0 ? btoa(`${nodes[0].uuid}`) : undefined,
          endCursor: nodes.length > 0 ? btoa(`${nodes[nodes.length - 1].uuid}`) : undefined,
        };

      } catch (error) {
        console.error('[StockLevelDataLoader] Unexpected error in batch query:', error);
        return new Error('Unexpected error loading stock levels');
      }
    })
  );

  return results;
}

/**
 * Batch function for aggregated stock level data by product types
 */
async function batchStockLevelsByProductType(
  supabase: SupabaseClient,
  productTypes: readonly string[]
): Promise<(StockLevelRecord[] | Error)[]> {
  if (productTypes.length === 0) return [];

  try {
    // Join with data_code to filter by product type
    const { data, error } = await supabase
      .from('stock_level')
      .select(`
        *,
        data_code!inner(type)
      `)
      .in('data_code.type', [...productTypes]);

    if (error) {
      console.error('[StockLevelDataLoader] Error loading by product type:', error);
      return productTypes.map(() => new Error(`Failed to load stock levels by type: ${error.message}`));
    }

    // Group by product type
    const typeGroups = new Map<string, StockLevelRecord[]>();
    productTypes.forEach(type => typeGroups.set(type, []));

    data?.forEach((record: DatabaseStockLevelRecord & { data_code?: { type?: string } }) => {
      const productType = record.data_code?.type;
      if (productType && typeGroups.has(productType)) {
        const group = typeGroups.get(productType) || [];
        group.push({
          uuid: record.uuid,
          stock: record.stock,
          description: record.description || '',
          stock_level: record.stock_level,
          update_time: record.update_time,
        });
        typeGroups.set(productType, group);
      }
    });

    return productTypes.map(type => typeGroups.get(type) || []);
  } catch (error) {
    console.error('[StockLevelDataLoader] Unexpected error loading by type:', error);
    return productTypes.map(() => new Error('Unexpected error loading stock levels by type'));
  }
}

/**
 * Create DataLoader for stock levels by stock code
 */
export function createStockLevelByCodeLoader(supabase: SupabaseClient): DataLoader<string, StockLevelRecord> {
  return new DataLoader<string, StockLevelRecord>(
    (stockCodes: readonly string[]) => batchStockLevelsByCode(supabase, stockCodes),
    {
      maxBatchSize: 100,
      cache: true,
      cacheKeyFn: (key: string) => key.toLowerCase(), // Case-insensitive caching
    }
  );
}

/**
 * Create DataLoader for stock levels with filtering and pagination
 */
export function createStockLevelQueryLoader(supabase: SupabaseClient): DataLoader<StockLevelQuery, StockLevelConnection> {
  return new DataLoader<StockLevelQuery, StockLevelConnection>(
    (queries: readonly StockLevelQuery[]) => batchStockLevelsWithFilter(supabase, queries),
    {
      maxBatchSize: 10, // Limit batch size for complex queries
      cache: true,
      cacheKeyFn: (query: StockLevelQuery) => query, // Use query as cache key
    }
  );
}

/**
 * Create DataLoader for stock levels by product type
 */
export function createStockLevelByTypeLoader(supabase: SupabaseClient): DataLoader<string, StockLevelRecord[]> {
  return new DataLoader<string, StockLevelRecord[]>(
    (productTypes: readonly string[]) => batchStockLevelsByProductType(supabase, productTypes),
    {
      maxBatchSize: 20,
      cache: true,
      cacheKeyFn: (key: string) => key.toLowerCase(),
    }
  );
}

/**
 * Create comprehensive stock level DataLoader context
 */
export interface StockLevelDataLoaders {
  byCode: DataLoader<string, StockLevelRecord>;
  byQuery: DataLoader<StockLevelQuery, StockLevelConnection>;
  byType: DataLoader<string, StockLevelRecord[]>;
}

export function createStockLevelDataLoaders(supabase: SupabaseClient): StockLevelDataLoaders {
  return {
    byCode: createStockLevelByCodeLoader(supabase),
    byQuery: createStockLevelQueryLoader(supabase),
    byType: createStockLevelByTypeLoader(supabase),
  };
}

/**
 * Helper function to convert cursor to offset for pagination
 */
export function cursorToOffset(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const decoded = atob(cursor);
    return parseInt(decoded, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Helper function to convert offset to cursor for pagination
 */
export function offsetToCursor(offset: number): string {
  return btoa(offset.toString());
}