/**
 * 倉庫緩存服務 - 智能緩存適配器整合
 * Phase 2.1 更新 - 支援 Redis → Memory 緩存切換
 * 專家優化：高性能倉庫數據管理
 */

import { createClient } from '@/app/utils/supabase/server';
import { getCacheAdapter } from '../cache/cache-factory';
import { cacheLogger } from '../logger';
import {
  isWarehouseSummaryResponse,
  isDashboardStatsResponse,
  isOptimizedInventoryResponse,
  safeNumber,
  safeString,
  safeArrayLength,
  type WarehouseSummaryRPCResponse,
  type DashboardStatsRPCResponse,
  type OptimizedInventoryRPCResponse,
} from '../types/warehouse-rpc-types';

export interface WarehouseSummaryData {
  location: string;
  totalQty: number;
  itemCount: number;
  uniqueProducts: number;
  lastUpdated: string;
}

export interface DashboardStatsData {
  totalPallets: number;
  activePallets: number;
  uniqueProducts: number;
  todayTransfers: number;
  pendingOrders: number;
  systemHealth: {
    dbResponseTime: number;
    cacheHitRate: number;
    lastUpdated: string;
  };
}

export interface InventoryQueryParams {
  location?: string;
  productCode?: string;
  minQty?: number;
  page?: number;
  limit?: number;
  includeStats?: boolean;
  timeRange?: string;
}

export class WarehouseCacheService {
  private cache = getCacheAdapter(); // Phase 2.1: 智能緩存切換
  private readonly DEFAULT_TTL = 300; // 5 分鐘
  private readonly WAREHOUSE_TTL = 600; // 10 分鐘
  private readonly DASHBOARD_TTL = 180; // 3 分鐘

  /**
   * 獲取倉庫摘要 - 帶緩存優化
   */
  async getWarehouseSummary(timeRange?: string): Promise<WarehouseSummaryData[]> {
    const cacheKey = `warehouse:summary:${timeRange || 'default'}`;
    const startTime = Date.now();

    try {
      // 嘗試從緩存獲取
      const cached = await this.cache.get<WarehouseSummaryData[]>(cacheKey);
      if (cached) {
        cacheLogger.info(
          {
            operation: 'getWarehouseSummary',
            source: 'cache',
            responseTime: Date.now() - startTime,
          },
          'Warehouse summary from cache'
        );

        return cached;
      }

      // 緩存未命中，使用優化的 RPC 函數
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('get_warehouse_summary', {
        p_time_period: timeRange || '30 days',
      });

      if (error) {
        cacheLogger.error(
          {
            operation: 'getWarehouseSummary',
            error: error.message,
          },
          'RPC function error'
        );
        throw error;
      }

      // 安全類型轉換 - 替代 any 類型
      const dataObj = data as unknown;

      // Debug logging to identify the actual response structure
      cacheLogger.info(
        {
          operation: 'getWarehouseSummary',
          responseType: typeof dataObj,
          isArray: Array.isArray(dataObj),
          dataStructure:
            dataObj !== null && typeof dataObj === 'object' ? Object.keys(dataObj) : 'not-object',
          sampleData: JSON.stringify(dataObj).substring(0, 200),
        },
        'RPC response structure'
      );

      // Handle the new RPC response format
      if (
        dataObj &&
        typeof dataObj === 'object' &&
        'summary' in dataObj &&
        !Array.isArray(dataObj.summary)
      ) {
        // New format: { success: true, summary: { total_pallets, ... }, ... }
        const summaryObj = dataObj.summary as Record<string, unknown>;
        const summary: WarehouseSummaryData[] = [
          {
            location: 'ALL', // Aggregate data for all locations
            totalQty: safeNumber(summaryObj.total_inventory),
            itemCount: safeNumber(summaryObj.total_pallets),
            uniqueProducts: safeNumber(summaryObj.total_products),
            lastUpdated: new Date().toISOString(),
          },
        ];

        // If location_distribution is available, add individual locations
        if ('location_distribution' in dataObj && Array.isArray(dataObj.location_distribution)) {
          const locations = dataObj.location_distribution as Array<Record<string, unknown>>;
          locations.forEach(loc => {
            summary.push({
              location: safeString(loc.location),
              totalQty: safeNumber(loc.total_quantity),
              itemCount: safeNumber(loc.pallet_count),
              uniqueProducts: safeNumber(loc.unique_products),
              lastUpdated: new Date().toISOString(),
            });
          });
        }

        // Store in cache
        await this.cache.set(cacheKey, summary, this.WAREHOUSE_TTL);

        cacheLogger.info(
          {
            operation: 'getWarehouseSummary',
            source: 'database',
            recordCount: summary.length,
            responseTime: Date.now() - startTime,
          },
          'Warehouse summary fetched from RPC (new format)'
        );

        return summary;
      }

      if (!isWarehouseSummaryResponse(dataObj)) {
        throw new Error('Invalid warehouse summary response structure');
      }

      const summary: WarehouseSummaryData[] =
        dataObj.summary?.map(item => ({
          location: safeString(item.location),
          totalQty: safeNumber(item.total_qty),
          itemCount: safeNumber(item.item_count),
          uniqueProducts: safeNumber(item.unique_products),
          lastUpdated: new Date().toISOString(),
        })) || [];

      // 存入緩存
      await this.cache.set(cacheKey, summary, this.WAREHOUSE_TTL);

      cacheLogger.info(
        {
          operation: 'getWarehouseSummary',
          source: 'database',
          recordCount: summary.length,
          responseTime: Date.now() - startTime,
        },
        'Warehouse summary from database'
      );

      return summary;
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'getWarehouseSummary',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        },
        'Failed to get warehouse summary'
      );
      throw error;
    }
  }

  /**
   * 獲取儀表板統計 - 高性能實現
   */
  async getDashboardStats(useEstimated: boolean = true): Promise<DashboardStatsData> {
    const cacheKey = `dashboard:stats:${useEstimated ? 'estimated' : 'exact'}`;
    const startTime = Date.now();

    try {
      // 嘗試從緩存獲取
      const cached = await this.cache.get<DashboardStatsData>(cacheKey);
      if (cached) {
        cacheLogger.info(
          {
            operation: 'getDashboardStats',
            source: 'cache',
            responseTime: Date.now() - startTime,
          },
          'Dashboard stats from cache'
        );

        return cached;
      }

      // 使用優化的 RPC 函數
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_use_estimated_count: useEstimated,
        p_include_detailed_stats: true,
      });

      if (error) {
        cacheLogger.error(
          {
            operation: 'getDashboardStats',
            error: error.message,
          },
          'Dashboard stats RPC error'
        );
        throw error;
      }

      // 獲取緩存統計用於健康監控
      const cacheStats = await this.cache.getStats();

      // 安全類型轉換 - 替代 any 類型
      const dataObj = data as unknown;
      if (!isDashboardStatsResponse(dataObj)) {
        throw new Error('Invalid dashboard stats response structure');
      }

      const stats: DashboardStatsData = {
        totalPallets: safeNumber(dataObj.total_pallets),
        activePallets: safeNumber(dataObj.active_pallets),
        uniqueProducts: safeNumber(dataObj.unique_products),
        todayTransfers: safeNumber(dataObj.today_transfers),
        pendingOrders: safeNumber(dataObj.pending_orders),
        systemHealth: {
          dbResponseTime: safeNumber(dataObj.execution_time_ms),
          cacheHitRate: Number(cacheStats.hitRate) || 0,
          lastUpdated: new Date().toISOString(),
        },
      };

      // 存入緩存，較短的 TTL 因為數據更新頻繁
      await this.cache.set(cacheKey, stats, this.DASHBOARD_TTL);

      cacheLogger.info(
        {
          operation: 'getDashboardStats',
          source: 'database',
          useEstimated,
          dbResponseTime: dataObj.execution_time_ms,
          responseTime: Date.now() - startTime,
        },
        'Dashboard stats from database'
      );

      return stats;
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'getDashboardStats',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        },
        'Failed to get dashboard stats'
      );
      throw error;
    }
  }

  /**
   * 獲取優化的庫存數據
   */
  async getOptimizedInventory(params: InventoryQueryParams = {}) {
    const {
      location,
      productCode,
      minQty = 0,
      page = 1,
      limit = 50,
      includeStats = false,
      timeRange = '30 days',
    } = params;

    const cacheKey = `inventory:optimized:${JSON.stringify(params)}`;
    const startTime = Date.now();

    try {
      // 嘗試從緩存獲取
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        cacheLogger.info(
          {
            operation: 'getOptimizedInventory',
            source: 'cache',
            params,
            responseTime: Date.now() - startTime,
          },
          'Optimized inventory from cache'
        );

        return cached;
      }

      // 使用優化的 RPC 函數
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('get_optimized_inventory_data', {
        p_location: location,
        p_limit: limit,
        p_offset: (page - 1) * limit,
        p_sort_by: 'product_code',
      });

      if (error) {
        cacheLogger.error(
          {
            operation: 'getOptimizedInventory',
            error: error.message,
          },
          'Optimized inventory RPC error'
        );
        throw error;
      }

      // 根據數據更新頻率動態調整 TTL
      const dynamicTTL = location ? this.DEFAULT_TTL : this.WAREHOUSE_TTL;
      await this.cache.set(cacheKey, data, dynamicTTL);

      cacheLogger.info(
        {
          operation: 'getOptimizedInventory',
          source: 'database',
          recordCount: (() => {
            const inventoryData = data as unknown;
            if (!isOptimizedInventoryResponse(inventoryData)) {
              return 0;
            }
            return safeArrayLength(inventoryData.inventory);
          })(),
          hasStats: (() => {
            const inventoryData = data as unknown;
            if (!isOptimizedInventoryResponse(inventoryData)) {
              return false;
            }
            return inventoryData.stats !== null && inventoryData.stats !== undefined;
          })(),
          responseTime: Date.now() - startTime,
        },
        'Optimized inventory from database'
      );

      return data;
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'getOptimizedInventory',
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
          responseTime: Date.now() - startTime,
        },
        'Failed to get optimized inventory'
      );
      throw error;
    }
  }

  /**
   * 失效相關緩存
   */
  async invalidateWarehouseCache(
    type?: 'summary' | 'dashboard' | 'inventory' | 'all'
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let invalidatedCount = 0;

      switch (type) {
        case 'summary':
          invalidatedCount = await this.cache.invalidatePattern('warehouse:summary:*');
          break;
        case 'dashboard':
          invalidatedCount = await this.cache.invalidatePattern('dashboard:stats:*');
          break;
        case 'inventory':
          invalidatedCount = await this.cache.invalidatePattern('inventory:optimized:*');
          break;
        case 'all':
        default:
          const summaryCount = await this.cache.invalidatePattern('warehouse:summary:*');
          const dashboardCount = await this.cache.invalidatePattern('dashboard:stats:*');
          const inventoryCount = await this.cache.invalidatePattern('inventory:optimized:*');
          invalidatedCount = summaryCount + dashboardCount + inventoryCount;
          break;
      }

      cacheLogger.info(
        {
          operation: 'invalidateWarehouseCache',
          type: type || 'all',
          invalidatedCount,
          responseTime: Date.now() - startTime,
        },
        'Cache invalidation completed'
      );
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'invalidateWarehouseCache',
          error: error instanceof Error ? error.message : 'Unknown error',
          type,
          responseTime: Date.now() - startTime,
        },
        'Failed to invalidate cache'
      );
      throw error;
    }
  }

  /**
   * 預熱關鍵緩存
   */
  async preWarmCache(): Promise<void> {
    const startTime = Date.now();

    try {
      cacheLogger.info('Starting cache pre-warming...');

      // 並行預熱關鍵數據
      await Promise.all([
        this.getWarehouseSummary(), // 預熱倉庫摘要
        this.getDashboardStats(true), // 預熱儀表板統計
        this.getOptimizedInventory({ limit: 20, includeStats: true }), // 預熱庫存數據
      ]);

      cacheLogger.info(
        {
          operation: 'preWarmCache',
          responseTime: Date.now() - startTime,
        },
        'Cache pre-warming completed'
      );
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'preWarmCache',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        },
        'Cache pre-warming failed'
      );
      // 不拋出錯誤，預熱失敗不應影響正常流程
    }
  }

  /**
   * 獲取緩存統計和性能指標
   */
  async getCacheMetrics() {
    try {
      const cacheStats = await this.cache.getStats();
      const metrics = this.cache.getMetrics();

      return {
        cache: cacheStats,
        performance: metrics,
        health: {
          isConnected: await this.cache.ping(),
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'getCacheMetrics',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Failed to get cache metrics'
      );
      return null;
    }
  }
}

// 單例實例
let warehouseCacheServiceInstance: WarehouseCacheService | null = null;

/**
 * 獲取倉庫緩存服務實例
 */
export function getWarehouseCacheService(): WarehouseCacheService {
  if (!warehouseCacheServiceInstance) {
    warehouseCacheServiceInstance = new WarehouseCacheService();
  }
  return warehouseCacheServiceInstance;
}

// 預設匯出
export default WarehouseCacheService;
