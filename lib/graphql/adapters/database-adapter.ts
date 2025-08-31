/**
 * Database Adapter Pattern
 * Provides clean abstraction between GraphQL resolvers and database queries
 */

import { GraphQLError } from 'graphql';
import { createClient } from '../../../app/utils/supabase/server';
import type { Database } from '../../database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FieldMapper } from '../config/field-mappings';

export interface QueryOptions {
  select?: string[];
  filters?: Record<string, unknown>;
  orderBy?: { field: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  productCodes?: string[];
  locations?: string[];
  actions?: string[];
  operatorIds?: number[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
  first?: number;
}

export interface SortOptions {
  field: string;
  ascending?: boolean;
  direction?: 'ASC' | 'DESC';
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

interface PalletInfoQueryResult {
  productCode: string;
  quantity: number;
  generateTime: string;
}

interface HistoryActivityQueryResult {
  timestamp: string;
  operatorId: number;
  action: string;
  palletNumber: string;
  remark?: string;
}

interface ProductStockItem {
  stock: string;
  stockLevel: number;
  updateTime: string;
  type: string;
}

// Type alias for table names
type TableName = keyof Database['public']['Tables'];

/**
 * Base Database Adapter
 */
export abstract class BaseDatabaseAdapter {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Executes a mapped query using field mappings
   */
  protected async executeMappedQuery<T>(
    tableName: string,
    graphqlFields: string[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      // Map GraphQL fields to database columns
      const dbColumns = FieldMapper.mapSelectFields(tableName, graphqlFields);

      // Build query - use any to bypass strict typing for dynamic table access
      let query = (this.supabase as any)
        .from(tableName)
        .select(dbColumns.join(', '), { count: 'exact' });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([field, value]) => {
          const dbField = this.mapFieldToColumn(tableName, field);
          if (Array.isArray(value)) {
            query = query.in(dbField, value);
          } else if (value !== null && value !== undefined) {
            query = query.eq(dbField, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        const dbField = this.mapFieldToColumn(tableName, options.orderBy.field);
        query = query.order(dbField, { ascending: options.orderBy.ascending });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new GraphQLError(`Database query failed: ${error.message}`, {
          extensions: { code: 'DATABASE_ERROR', table: tableName },
        });
      }

      // Transform results using field mappings
      const transformedData = (data || []).map((row: unknown) =>
        FieldMapper.transformResult(tableName, row as Record<string, unknown>)
      ) as T[];

      return {
        data: transformedData,
        total: count || 0,
        hasMore: options.limit ? (count || 0) > (options.offset || 0) + options.limit : false,
      };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;

      throw new GraphQLError(`Failed to execute query on ${tableName}`, {
        extensions: {
          code: 'ADAPTER_ERROR',
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Maps a GraphQL field to the corresponding database column
   */
  protected mapFieldToColumn(tableName: string, graphqlField: string): string {
    const dbColumns = FieldMapper.mapSelectFields(tableName, [graphqlField]);
    return dbColumns[0] || graphqlField; // Fallback to original field name
  }

  /**
   * Executes a single record query with field mapping
   */
  protected async findOne<T>(
    tableName: string,
    graphqlFields: string[],
    filters: Record<string, unknown>
  ): Promise<T | null> {
    const result = await this.executeMappedQuery<T>(tableName, graphqlFields, {
      filters,
      limit: 1,
    });

    return result.data[0] || null;
  }
}

/**
 * Department Data Adapter
 */
export class DepartmentDataAdapter extends BaseDatabaseAdapter {
  /**
   * Fetch department statistics with proper field mapping
   */
  async fetchDepartmentStats(
    departmentType: 'INJECTION' | 'PIPE' | 'WAREHOUSE',
    timeRange: { start: Date; end: Date }
  ) {
    if (departmentType === 'WAREHOUSE') {
      return this.fetchWarehouseStats(timeRange);
    } else {
      return this.fetchProductionStats(departmentType, timeRange);
    }
  }

  private async fetchWarehouseStats(timeRange: { start: Date; end: Date }) {
    const graphqlFields = ['transferDate', 'operatorId', 'palletNumber'];

    const todayResult = await this.executeMappedQuery('record_transfer', graphqlFields, {
      filters: { transferDate: timeRange.start },
      limit: 1000,
    });

    const past7DaysResult = await this.executeMappedQuery('record_transfer', graphqlFields, {
      filters: { transferDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      limit: 1000,
    });

    return {
      todayTransferred: todayResult.total,
      past7Days: past7DaysResult.total,
      past14Days: past7DaysResult.total, // Simplified for example
      lastUpdated: new Date(),
    };
  }

  private async fetchProductionStats(
    departmentType: 'INJECTION' | 'PIPE',
    timeRange: { start: Date; end: Date }
  ) {
    const graphqlFields = ['generateTime', 'productCode', 'quantity'];

    // This would include product type filtering based on department
    const result = await this.executeMappedQuery('record_palletinfo', graphqlFields, {
      filters: { generateTime: timeRange.start },
      limit: 1000,
    });

    return {
      todayFinished: result.total,
      past7Days: result.total,
      past14Days: result.total,
      lastUpdated: new Date(),
    };
  }

  /**
   * Fetch top stocks with field mapping
   */
  async fetchTopStocks(departmentType: 'INJECTION' | 'PIPE' | 'WAREHOUSE', limit: number = 10) {
    const graphqlFields = ['productCode', 'quantity', 'generateTime'];

    const result = await this.executeMappedQuery('record_palletinfo', graphqlFields, {
      orderBy: { field: 'quantity', ascending: false },
      limit,
    });

    return result.data.map((item: unknown): ProductStockItem => {
      const typedItem = item as PalletInfoQueryResult;
      return {
        stock: typedItem.productCode,
        stockLevel: typedItem.quantity,
        updateTime: typedItem.generateTime,
        type: 'PRODUCT', // This would be enriched with actual product type
      };
    });
  }

  /**
   * Fetch recent activities with proper error handling
   */
  async fetchRecentActivities(limit: number = 10) {
    try {
      const graphqlFields = ['timestamp', 'operatorId', 'action', 'palletNumber', 'remark'];

      const result = await this.executeMappedQuery('record_history', graphqlFields, {
        orderBy: { field: 'timestamp', ascending: false },
        limit,
      });

      return result.data.map((activity: unknown) => {
        const typedActivity = activity as HistoryActivityQueryResult;
        return {
          time: new Date(typedActivity.timestamp).toLocaleTimeString(),
          staff: 'Unknown', // Would be resolved through DataLoader
          action: typedActivity.action,
          detail: `${typedActivity.remark || ''} - ${typedActivity.palletNumber || ''}`,
        };
      });
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      return []; // Graceful degradation
    }
  }
}

/**
 * Stock History Adapter
 */
export class StockHistoryAdapter extends BaseDatabaseAdapter {
  /**
   * Fetch pallet history by product with proper field mapping
   */
  async fetchPalletHistoryByProduct(
    productCode: string,
    options: {
      filter?: FilterOptions;
      pagination?: PaginationOptions;
      sort?: SortOptions;
    }
  ) {
    const graphqlFields = ['timestamp', 'palletNumber', 'action', 'operatorId', 'remark'];

    // First, get pallet numbers for this product
    const palletResult = await this.executeMappedQuery('record_palletinfo', ['palletNumber'], {
      filters: { productCode },
    });

    if (palletResult.data.length === 0) {
      return {
        productCode,
        records: [],
        totalRecords: 0,
        pageInfo: {
          hasNextPage: false,
          totalCount: 0,
        },
      };
    }

    const palletNumbers = palletResult.data.map(
      (p: unknown) => (p as Record<string, unknown>).palletNumber as string
    );

    // Get history for these pallets
    const historyResult = await this.executeMappedQuery('record_history', graphqlFields, {
      filters: { palletNumber: palletNumbers },
      orderBy: options.sort
        ? { field: options.sort.field.toLowerCase(), ascending: options.sort.direction === 'ASC' }
        : { field: 'timestamp', ascending: false },
      limit: options.pagination?.first || 20,
      offset: options.pagination?.offset || 0,
    });

    return {
      productCode,
      records: historyResult.data,
      totalRecords: historyResult.total,
      pageInfo: {
        hasNextPage: historyResult.hasMore,
        totalCount: historyResult.total,
        totalPages: Math.ceil(historyResult.total / (options.pagination?.first || 20)),
      },
    };
  }
}

/**
 * Factory for creating adapters
 */
export class AdapterFactory {
  static async createDepartmentAdapter(): Promise<DepartmentDataAdapter> {
    const supabase = await createClient();
    return new DepartmentDataAdapter(supabase);
  }

  static async createStockHistoryAdapter(): Promise<StockHistoryAdapter> {
    const supabase = await createClient();
    return new StockHistoryAdapter(supabase);
  }
}
