/**
 * GRN Database Service
 * Optimized database operations for GRN Label Card with connection pooling,
 * batch processing, and performance monitoring
 */

import { getSupabaseClient } from './supabase-client-manager';
import type { Database } from '@/types/database/supabase';
import { createGrnLogger } from '@/lib/security/grn-logger';
import {
  DatabaseError,
  DatabaseQueryResult,
  GrnDatabaseRecord,
  GrnQueryFilters,
} from '@/lib/types/database-operations';

// Type definitions for GRN operations
type Tables = Database['public']['Tables'];
type GrnPalletInfo = Tables['grn_pallet_info']['Row'];
type GrnRecord = Tables['grn_record']['Row'];
type ProductSupplier = Tables['product_supplier']['Row'];
type DataCode = Tables['data_code']['Row'];

// GRN operation types
export interface GrnQueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  retryCount?: number;
  timeout?: number;
}

export interface GrnBatchOptions extends GrnQueryOptions {
  batchSize?: number;
  parallel?: boolean;
}

// Performance monitoring for GRN operations
export interface GrnOperationMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  recordCount?: number;
  error?: string;
}

/**
 * GRN Database Service Class
 * Provides optimized database operations for GRN Label Card
 */
export class GrnDatabaseService {
  private clientManager: ReturnType<typeof getSupabaseClient>;
  private logger: ReturnType<typeof createGrnLogger>;
  private operationMetrics: Map<string, GrnOperationMetrics[]>;
  private readonly MAX_BATCH_SIZE = 100;
  private readonly DEFAULT_CACHE_TTL = 60000; // 1 minute

  constructor() {
    // Initialize with optimized configuration for GRN operations
    this.clientManager = getSupabaseClient(
      {
        maxRetries: 3,
        retryDelayMs: 500,
        healthCheckIntervalMs: 30000,
        connectionTimeoutMs: 10000,
        enableAutoReconnect: true,
        enableQueryMetrics: true,
        enableQueryCache: true,
      },
      {
        enabled: true,
        ttlMs: 60000,
        maxSize: 50,
        strategy: 'lru',
      }
    );

    this.logger = createGrnLogger('GrnDatabaseService');
    this.operationMetrics = new Map();
  }

  /**
   * Get product information with supplier details
   */
  public async getProductWithSupplier(
    productCode: string,
    options: GrnQueryOptions = {}
  ): Promise<{
    product: DataCode | null;
    supplier: ProductSupplier | null;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('getProductWithSupplier');
    const cacheKey = `grn_product_${productCode}`;

    try {
      // Execute query with caching
      const result = await this.clientManager.executeQuery(
        (async (client: any) => {
          // First get product info
          const productQuery = await client
            .from('data_code')
            .select('*')
            .eq('stock', productCode)
            .single();

          if (productQuery.error || !productQuery.data) {
            return { data: null, error: productQuery.error };
          }

          // Then get supplier info
          const supplierQuery = await client
            .from('product_supplier')
            .select('*')
            .eq('stock', productCode)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            data: {
              product: productQuery.data,
              supplier: supplierQuery.data || null,
            },
            error: null,
          };
        }) as any,
        options.useCache !== false ? cacheKey : undefined,
        {
          skipCache: options.useCache === false,
          ttl: options.cacheTTL || this.DEFAULT_CACHE_TTL,
          retries: options.retryCount,
        }
      );

      this.completeOperation(operation, !result.error, result.data ? 1 : 0);

      if (result.error) {
        this.logger.error('Failed to get product with supplier', {
          productCode,
          error: result.error,
        });
        return { product: null, supplier: null, error: result.error };
      }

      return {
        product: (result.data as any)?.product || null,
        supplier: (result.data as any)?.supplier || null,
        error: null,
      };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error getting product with supplier', { productCode, error });
      return { product: null, supplier: null, error: error as any };
    }
  }

  /**
   * Create GRN records in batch with transaction support
   */
  public async createGrnRecordsBatch(
    records: Partial<GrnRecord>[],
    options: GrnBatchOptions = {}
  ): Promise<{
    data: GrnRecord[] | null;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('createGrnRecordsBatch');
    const batchSize = options.batchSize || this.MAX_BATCH_SIZE;

    try {
      const batches = this.createBatches(records, batchSize);
      const results: GrnRecord[] = [];

      for (const batch of batches) {
        const batchResult = await this.clientManager.executeQuery(
          (async (client: any) => {
            return await client.from('grn_record').insert(batch).select();
          }) as any,
          undefined,
          {
            skipCache: true,
            retries: options.retryCount,
          }
        );

        if (batchResult.error) {
          this.completeOperation(operation, false, results.length, String(batchResult.error));
          return { data: null, error: batchResult.error };
        }

        if (batchResult.data && Array.isArray(batchResult.data)) {
          results.push(...batchResult.data);
        }
      }

      this.completeOperation(operation, true, results.length);
      return { data: results, error: null };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error creating GRN records batch', { error, recordCount: records.length });
      return { data: null, error: error as any };
    }
  }

  /**
   * Create GRN pallet info records in batch
   */
  public async createGrnPalletInfoBatch(
    palletInfos: Partial<GrnPalletInfo>[],
    options: GrnBatchOptions = {}
  ): Promise<{
    data: GrnPalletInfo[] | null;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('createGrnPalletInfoBatch');
    const batchSize = options.batchSize || this.MAX_BATCH_SIZE;

    try {
      const batches = this.createBatches(palletInfos, batchSize);
      const results: GrnPalletInfo[] = [];

      // Process batches in parallel if specified
      if (options.parallel) {
        const batchPromises = batches.map(batch =>
          this.clientManager.executeQuery(
            (async (client: any) => {
              return await client.from('grn_pallet_info').insert(batch).select();
            }) as any,
            undefined,
            {
              skipCache: true,
              retries: options.retryCount,
            }
          )
        );

        const batchResults = await Promise.all(batchPromises);

        for (const batchResult of batchResults) {
          if (batchResult.error) {
            this.completeOperation(operation, false, results.length, String(batchResult.error));
            return { data: null, error: batchResult.error };
          }
          if (batchResult.data && Array.isArray(batchResult.data)) {
            results.push(...batchResult.data);
          }
        }
      } else {
        // Process batches sequentially
        for (const batch of batches) {
          const batchResult = await this.clientManager.executeQuery(
            (async (client: any) => {
              return await client.from('grn_pallet_info').insert(batch).select();
            }) as any,
            undefined,
            {
              skipCache: true,
              retries: options.retryCount,
            }
          );

          if (batchResult.error) {
            this.completeOperation(operation, false, results.length, String(batchResult.error));
            return { data: null, error: batchResult.error };
          }

          if (batchResult.data && Array.isArray(batchResult.data)) {
            results.push(...batchResult.data);
          }
        }
      }

      this.completeOperation(operation, true, results.length);
      return { data: results, error: null };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error creating GRN pallet info batch', {
        error,
        recordCount: palletInfos.length,
      });
      return { data: null, error: error as any };
    }
  }

  /**
   * Get recent GRN records with pagination
   */
  public async getRecentGrnRecords(
    limit: number = 10,
    offset: number = 0,
    options: GrnQueryOptions = {}
  ): Promise<{
    data: GrnRecord[] | null;
    count: number | null;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('getRecentGrnRecords');
    const cacheKey = `grn_recent_${limit}_${offset}`;

    try {
      const result = await this.clientManager.executeQuery(
        (async (client: any) => {
          const query = client
            .from('grn_record')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          return await query;
        }) as any,
        options.useCache !== false ? cacheKey : undefined,
        {
          skipCache: options.useCache === false,
          ttl: options.cacheTTL || 30000, // 30 seconds cache for recent records
          retries: options.retryCount,
        }
      );

      const recordCount = result.data && Array.isArray(result.data) ? result.data.length : 0;
      this.completeOperation(operation, !result.error, recordCount);

      return {
        data: result.data as any,
        count: (result as DatabaseQueryResult<unknown> & { count?: number }).count || null,
        error: result.error,
      };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error getting recent GRN records', { error });
      return { data: null, count: null, error: error as any };
    }
  }

  /**
   * Search GRN records by various criteria
   */
  public async searchGrnRecords(
    criteria: {
      grnNumber?: string;
      productCode?: string;
      supplierCode?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    options: GrnQueryOptions = {}
  ): Promise<{
    data: GrnRecord[] | null;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('searchGrnRecords');
    const cacheKey = `grn_search_${JSON.stringify(criteria)}`;

    try {
      const result = await this.clientManager.executeQuery(
        (async (client: any) => {
          let query = client.from('grn_record').select('*');

          if (criteria.grnNumber) {
            query = query.eq('grn_no', criteria.grnNumber);
          }
          if (criteria.productCode) {
            query = query.eq('stock', criteria.productCode);
          }
          if (criteria.supplierCode) {
            query = query.eq('supplier_code', criteria.supplierCode);
          }
          if (criteria.dateFrom) {
            query = query.gte('created_at', criteria.dateFrom);
          }
          if (criteria.dateTo) {
            query = query.lte('created_at', criteria.dateTo);
          }

          return await query.order('created_at', { ascending: false });
        }) as any,
        options.useCache !== false ? cacheKey : undefined,
        {
          skipCache: options.useCache === false,
          ttl: options.cacheTTL || this.DEFAULT_CACHE_TTL,
          retries: options.retryCount,
        }
      );

      const recordCount = result.data && Array.isArray(result.data) ? result.data.length : 0;
      this.completeOperation(operation, !result.error, recordCount);

      return { data: result.data as any, error: result.error };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error searching GRN records', { error, criteria });
      return { data: null, error: error as any };
    }
  }

  /**
   * Validate GRN number uniqueness
   */
  public async validateGrnNumber(
    grnNumber: string,
    options: GrnQueryOptions = {}
  ): Promise<{
    isValid: boolean;
    exists: boolean;
    error: DatabaseError | null;
  }> {
    const operation = this.startOperation('validateGrnNumber');

    try {
      const result = await this.clientManager.executeQuery(
        (async (client: any) => {
          return await client
            .from('grn_record')
            .select('grn_no')
            .eq('grn_no', grnNumber)
            .limit(1)
            .single();
        }) as any,
        undefined,
        {
          skipCache: true,
          retries: options.retryCount,
        }
      );

      const exists = result.data !== null && !result.error;
      this.completeOperation(operation, true, 1);

      return {
        isValid: !exists,
        exists,
        error: result.error && result.error.code !== 'PGRST116' ? result.error : null,
      };
    } catch (error) {
      this.completeOperation(operation, false, 0, String(error));
      this.logger.error('Error validating GRN number', { error, grnNumber });
      return { isValid: false, exists: false, error: error as any };
    }
  }

  /**
   * Clear GRN-specific cache entries
   */
  public clearGrnCache(): void {
    this.clientManager.clearCacheByPattern(/^grn_/);
    this.logger.info('GRN cache cleared');
  }

  /**
   * Get performance metrics for GRN operations
   */
  public getOperationMetrics(operation?: string): GrnOperationMetrics[] {
    if (operation) {
      return this.operationMetrics.get(operation) || [];
    }

    const allMetrics: GrnOperationMetrics[] = [];
    for (const metrics of this.operationMetrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  /**
   * Get aggregated performance statistics
   */
  public getPerformanceStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    totalRecordsProcessed: number;
    operationBreakdown: Map<
      string,
      {
        count: number;
        avgDuration: number;
        successRate: number;
      }
    >;
  } {
    const stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageDuration: 0,
      totalRecordsProcessed: 0,
      operationBreakdown: new Map<string, any>(),
    };

    let totalDuration = 0;

    for (const [operationName, metrics] of this.operationMetrics.entries()) {
      const opStats = {
        count: metrics.length,
        avgDuration: 0,
        successRate: 0,
      };

      let opDuration = 0;
      let successCount = 0;
      let recordCount = 0;

      for (const metric of metrics) {
        stats.totalOperations++;
        if (metric.success) {
          stats.successfulOperations++;
          successCount++;
        } else {
          stats.failedOperations++;
        }

        if (metric.duration) {
          opDuration += metric.duration;
          totalDuration += metric.duration;
        }

        if (metric.recordCount) {
          recordCount += metric.recordCount;
        }
      }

      opStats.avgDuration = metrics.length > 0 ? opDuration / metrics.length : 0;
      opStats.successRate = metrics.length > 0 ? (successCount / metrics.length) * 100 : 0;

      stats.operationBreakdown.set(operationName, opStats);
      stats.totalRecordsProcessed += recordCount;
    }

    stats.averageDuration = stats.totalOperations > 0 ? totalDuration / stats.totalOperations : 0;

    return stats;
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.operationMetrics.clear();
    this.clientManager.resetMetrics();
    this.logger.info('Performance metrics reset');
  }

  // Private helper methods

  private startOperation(name: string): GrnOperationMetrics {
    const operation: GrnOperationMetrics = {
      operation: name,
      startTime: performance.now(),
      success: false,
    };

    if (!this.operationMetrics.has(name)) {
      this.operationMetrics.set(name, []);
    }

    return operation;
  }

  private completeOperation(
    operation: GrnOperationMetrics,
    success: boolean,
    recordCount?: number,
    error?: string
  ): void {
    operation.endTime = performance.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.success = success;
    operation.recordCount = recordCount;
    operation.error = error;

    const metrics = this.operationMetrics.get(operation.operation);
    if (metrics) {
      metrics.push(operation);

      // Keep only last 100 metrics per operation to prevent memory bloat
      if (metrics.length > 100) {
        metrics.shift();
      }
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Dispose of the service
   */
  public dispose(): void {
    this.clientManager.dispose();
    this.operationMetrics.clear();
    this.logger.info('GRN Database Service disposed');
  }
}

// Export singleton instance
let grnDatabaseService: GrnDatabaseService | null = null;

export const getGrnDatabaseService = (): GrnDatabaseService => {
  if (!grnDatabaseService) {
    grnDatabaseService = new GrnDatabaseService();
  }
  return grnDatabaseService;
};

// Export default instance
export default getGrnDatabaseService();
