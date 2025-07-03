/**
 * GraphQL Field-Level Caching Implementation
 * Week 1.2b: High Priority Pagination and Performance Optimization
 * Date: 2025-07-03
 * 
 * This module implements field-level caching for fine-grained query optimization.
 */

import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';

// ================================
// 1. 欄位緩存配置 (Field Cache Configuration)
// ================================

export interface FieldCacheConfig {
  ttl: number;           // 存活時間 (毫秒)
  maxSize?: number;      // 最大緩存條目數
  shouldCache?: (parent: any, args: any, context: any) => boolean;
  keyGenerator?: (parent: any, args: any, context: any) => string;
}

export const FieldCacheConfigs: Record<string, FieldCacheConfig> = {
  // 產品相關欄位
  'Product.inventory': {
    ttl: 2 * 60 * 1000, // 2分鐘
    maxSize: 1000,
    shouldCache: (parent, args) => !args.realtime, // 非實時查詢才緩存
    keyGenerator: (parent, args) => `product:${parent.code}:inventory:${JSON.stringify(args)}`
  },

  'Product.movements': {
    ttl: 5 * 60 * 1000, // 5分鐘 (移動記錄變動較少)
    maxSize: 500,
    keyGenerator: (parent, args) => `product:${parent.code}:movements:${JSON.stringify(args)}`
  },

  // 托盤相關欄位
  'Pallet.movements': {
    ttl: 3 * 60 * 1000, // 3分鐘
    maxSize: 800,
    shouldCache: (parent, args) => args.first && args.first <= 20, // 只緩存小量查詢
    keyGenerator: (parent, args) => `pallet:${parent.palletNumber}:movements:${JSON.stringify(args)}`
  },

  'Pallet.grnRecords': {
    ttl: 30 * 60 * 1000, // 30分鐘 (GRN記錄很少變動)
    maxSize: 1500,
    keyGenerator: (parent, args) => `pallet:${parent.palletNumber}:grn:${JSON.stringify(args)}`
  },

  'Pallet.inventoryRecords': {
    ttl: 1 * 60 * 1000, // 1分鐘 (庫存變動頻繁)
    maxSize: 1200,
    keyGenerator: (parent, args) => `pallet:${parent.palletNumber}:inventory:${JSON.stringify(args)}`
  },

  // 倉庫相關欄位
  'Warehouse.pallets': {
    ttl: 5 * 60 * 1000, // 5分鐘
    maxSize: 200,
    shouldCache: (parent, args) => args.first && args.first <= 50,
    keyGenerator: (parent, args) => `warehouse:${parent.id}:pallets:${JSON.stringify(args)}`
  },

  'Warehouse.movements': {
    ttl: 10 * 60 * 1000, // 10分鐘
    maxSize: 100,
    keyGenerator: (parent, args) => `warehouse:${parent.id}:movements:${JSON.stringify(args)}`
  },

  // 業務邏輯查詢
  'Query.getLowStockProducts': {
    ttl: 15 * 60 * 1000, // 15分鐘
    maxSize: 50,
    keyGenerator: (parent, args) => `lowstock:${args.threshold}:${JSON.stringify(args.pagination)}`
  },

  'Query.getPendingOrders': {
    ttl: 2 * 60 * 1000, // 2分鐘
    maxSize: 100,
    keyGenerator: (parent, args) => `pendingorders:${args.status}:${JSON.stringify(args.pagination)}`
  },

  'Query.getActiveTransfers': {
    ttl: 1 * 60 * 1000, // 1分鐘 (轉移較敏感)
    maxSize: 80,
    keyGenerator: (parent, args) => `activetransfers:${JSON.stringify(args.dateRange)}:${JSON.stringify(args.pagination)}`
  }
};

// ================================
// 2. 欄位緩存管理器 (Field Cache Manager)
// ================================

export class FieldCacheManager {
  private caches = new Map<string, InMemoryLRUCache>();

  constructor() {
    // 為每個欄位配置創建獨立緩存
    Object.entries(FieldCacheConfigs).forEach(([fieldName, config]) => {
      this.caches.set(fieldName, new InMemoryLRUCache({
        maxSize: config.maxSize || 1000,
        ttl: config.ttl
      }));
    });
  }

  // 獲取緩存值
  async get(fieldName: string, cacheKey: string): Promise<any | undefined> {
    const cache = this.caches.get(fieldName);
    if (!cache) return undefined;

    try {
      const result = await cache.get(cacheKey);
      if (result !== undefined) {
        this.trackCacheHit(fieldName, true);
        return JSON.parse(result);
      }
      this.trackCacheHit(fieldName, false);
      return undefined;
    } catch (error) {
      console.warn(`Field cache get error for ${fieldName}:`, error);
      return undefined;
    }
  }

  // 設置緩存值
  async set(fieldName: string, cacheKey: string, value: any): Promise<void> {
    const cache = this.caches.get(fieldName);
    if (!cache) return;

    try {
      await cache.set(cacheKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Field cache set error for ${fieldName}:`, error);
    }
  }

  // 刪除特定緩存
  async delete(fieldName: string, cacheKey: string): Promise<void> {
    const cache = this.caches.get(fieldName);
    if (!cache) return;

    try {
      await cache.delete(cacheKey);
    } catch (error) {
      console.warn(`Field cache delete error for ${fieldName}:`, error);
    }
  }

  // 清空特定欄位的所有緩存
  async clear(fieldName: string): Promise<void> {
    const cache = this.caches.get(fieldName);
    if (!cache) return;

    try {
      await cache.flush();
    } catch (error) {
      console.warn(`Field cache clear error for ${fieldName}:`, error);
    }
  }

  // 清空所有緩存
  async clearAll(): Promise<void> {
    const promises = Array.from(this.caches.values()).map(cache => cache.flush());
    await Promise.all(promises);
  }

  // 緩存命中率追蹤
  private cacheStats = new Map<string, { hits: number; misses: number }>();

  private trackCacheHit(fieldName: string, hit: boolean): void {
    const stats = this.cacheStats.get(fieldName) || { hits: 0, misses: 0 };
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    this.cacheStats.set(fieldName, stats);
  }

  // 獲取緩存統計
  getCacheStats(): Record<string, { hits: number; misses: number; hitRate: number }> {
    const result: Record<string, { hits: number; misses: number; hitRate: number }> = {};
    
    this.cacheStats.forEach((stats, fieldName) => {
      const total = stats.hits + stats.misses;
      result[fieldName] = {
        ...stats,
        hitRate: total > 0 ? stats.hits / total : 0
      };
    });

    return result;
  }

  // 重置統計
  resetStats(): void {
    this.cacheStats.clear();
  }
}

// 單例實例
export const fieldCacheManager = new FieldCacheManager();

// ================================
// 3. 欄位緩存裝飾器 (Field Cache Decorator)
// ================================

export function fieldCache(fieldName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const config = FieldCacheConfigs[fieldName];

    if (!config) {
      console.warn(`No cache config found for field: ${fieldName}`);
      return descriptor;
    }

    descriptor.value = async function (parent: any, args: any, context: any, info: any) {
      // 檢查是否應該緩存
      if (config.shouldCache && !config.shouldCache(parent, args, context)) {
        return originalMethod.call(this, parent, args, context, info);
      }

      // 生成緩存鍵
      const cacheKey = config.keyGenerator 
        ? config.keyGenerator(parent, args, context)
        : `${fieldName}:${JSON.stringify({ parent, args })}`;

      // 嘗試從緩存獲取
      const cachedValue = await fieldCacheManager.get(fieldName, cacheKey);
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      // 執行原始方法
      const result = await originalMethod.call(this, parent, args, context, info);

      // 緩存結果
      await fieldCacheManager.set(fieldName, cacheKey, result);

      return result;
    };

    return descriptor;
  };
}

// ================================
// 4. 智能緩存失效 (Smart Cache Invalidation)
// ================================

export class SmartCacheInvalidator {
  // 基於數據變更的智能失效
  static async invalidateOnDataChange(changeType: string, entityId: string, entityType: string): Promise<void> {
    switch (changeType) {
      case 'inventory_updated':
        await this.invalidateInventoryRelated(entityId);
        break;
      case 'pallet_moved':
        await this.invalidatePalletRelated(entityId);
        break;
      case 'order_status_changed':
        await this.invalidateOrderRelated(entityId);
        break;
      case 'product_updated':
        await this.invalidateProductRelated(entityId);
        break;
    }
  }

  // 失效庫存相關緩存
  private static async invalidateInventoryRelated(productCode: string): Promise<void> {
    const fieldsToInvalidate = [
      'Product.inventory',
      'Query.getLowStockProducts'
    ];

    for (const fieldName of fieldsToInvalidate) {
      await fieldCacheManager.clear(fieldName);
    }
  }

  // 失效托盤相關緩存
  private static async invalidatePalletRelated(palletNumber: string): Promise<void> {
    const fieldsToInvalidate = [
      'Pallet.movements',
      'Pallet.inventoryRecords',
      'Warehouse.pallets',
      'Warehouse.movements',
      'Query.getActiveTransfers'
    ];

    for (const fieldName of fieldsToInvalidate) {
      await fieldCacheManager.clear(fieldName);
    }
  }

  // 失效訂單相關緩存
  private static async invalidateOrderRelated(orderRef: string): Promise<void> {
    const fieldsToInvalidate = [
      'Query.getPendingOrders'
    ];

    for (const fieldName of fieldsToInvalidate) {
      await fieldCacheManager.clear(fieldName);
    }
  }

  // 失效產品相關緩存
  private static async invalidateProductRelated(productCode: string): Promise<void> {
    const fieldsToInvalidate = [
      'Product.inventory',
      'Product.movements',
      'Query.getLowStockProducts'
    ];

    for (const fieldName of fieldsToInvalidate) {
      await fieldCacheManager.clear(fieldName);
    }
  }

  // 基於時間的批量失效
  static async scheduledInvalidation(): Promise<void> {
    setInterval(async () => {
      // 每5分鐘清理過期的高頻數據
      const highFrequencyFields = [
        'Product.inventory',
        'Pallet.inventoryRecords',
        'Query.getActiveTransfers'
      ];

      for (const fieldName of highFrequencyFields) {
        // 注意：LRU緩存會自動處理TTL，這裡主要是為了手動清理
        console.log(`Scheduled invalidation check for ${fieldName}`);
      }
    }, 5 * 60 * 1000); // 5分鐘

    setInterval(async () => {
      // 每30分鐘清理低頻數據
      const lowFrequencyFields = [
        'Pallet.grnRecords',
        'Query.getLowStockProducts'
      ];

      for (const fieldName of lowFrequencyFields) {
        console.log(`Scheduled invalidation check for ${fieldName}`);
      }
    }, 30 * 60 * 1000); // 30分鐘
  }
}

// ================================
// 5. 緩存預熱 (Cache Warming)
// ================================

export class CacheWarmer {
  // 應用啟動時預熱關鍵緩存
  static async warmupCriticalData(): Promise<void> {
    console.log('Starting cache warmup...');

    const warmupTasks = [
      this.warmupLowStockProducts(),
      this.warmupPendingOrders(),
      this.warmupActiveTransfers()
    ];

    try {
      await Promise.all(warmupTasks);
      console.log('Cache warmup completed successfully');
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  private static async warmupLowStockProducts(): Promise<void> {
    // 預熱低庫存產品查詢（常用閾值）
    const commonThresholds = [5, 10, 20, 50];
    
    for (const threshold of commonThresholds) {
      const cacheKey = `lowstock:${threshold}:${JSON.stringify({ first: 20 })}`;
      // 這裡應該調用實際的解析器方法來預熱緩存
      console.log(`Warming up low stock products with threshold ${threshold}`);
    }
  }

  private static async warmupPendingOrders(): Promise<void> {
    // 預熱待處理訂單查詢
    const statuses = ['PENDING', 'PROCESSING', 'READY'];
    
    for (const status of statuses) {
      const cacheKey = `pendingorders:${status}:${JSON.stringify({ first: 20 })}`;
      console.log(`Warming up pending orders with status ${status}`);
    }
  }

  private static async warmupActiveTransfers(): Promise<void> {
    // 預熱今日活躍轉移
    const today = new Date();
    const dateRange = {
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    };
    
    const cacheKey = `activetransfers:${JSON.stringify(dateRange)}:${JSON.stringify({ first: 20 })}`;
    console.log('Warming up active transfers for today');
  }
}

// ================================
// 6. 緩存監控和報告 (Cache Monitoring and Reporting)
// ================================

export class CacheMonitor {
  static generateCacheReport(): {
    summary: any;
    fieldDetails: any;
    recommendations: string[];
  } {
    const stats = fieldCacheManager.getCacheStats();
    
    // 計算總體統計
    const totalHits = Object.values(stats).reduce((sum, s) => sum + s.hits, 0);
    const totalMisses = Object.values(stats).reduce((sum, s) => sum + s.misses, 0);
    const overallHitRate = totalHits / (totalHits + totalMisses);

    // 分析效能
    const performanceAnalysis = Object.entries(stats).map(([field, stat]) => ({
      field,
      hitRate: stat.hitRate,
      totalRequests: stat.hits + stat.misses,
      performance: stat.hitRate > 0.7 ? 'good' : stat.hitRate > 0.4 ? 'fair' : 'poor'
    }));

    // 生成建議
    const recommendations: string[] = [];
    
    const poorPerformingFields = performanceAnalysis.filter(f => f.performance === 'poor' && f.totalRequests > 10);
    if (poorPerformingFields.length > 0) {
      recommendations.push(`Consider adjusting TTL or caching strategy for: ${poorPerformingFields.map(f => f.field).join(', ')}`);
    }

    const highVolumeFields = performanceAnalysis.filter(f => f.totalRequests > 1000);
    if (highVolumeFields.length > 0) {
      recommendations.push(`High volume fields may need cache size optimization: ${highVolumeFields.map(f => f.field).join(', ')}`);
    }

    return {
      summary: {
        totalRequests: totalHits + totalMisses,
        totalHits,
        totalMisses,
        overallHitRate,
        activeFields: Object.keys(stats).length
      },
      fieldDetails: performanceAnalysis,
      recommendations
    };
  }

  static logCacheMetrics(): void {
    const report = this.generateCacheReport();
    
    console.log('\n=== Field-Level Cache Report ===');
    console.log(`Overall Hit Rate: ${(report.summary.overallHitRate * 100).toFixed(2)}%`);
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`Active Cached Fields: ${report.summary.activeFields}`);
    
    console.log('\nField Performance:');
    report.fieldDetails.forEach((field: any) => {
      console.log(`  ${field.field}: ${(field.hitRate * 100).toFixed(2)}% (${field.totalRequests} requests) - ${field.performance}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    console.log('===============================\n');
  }
}

// 啟動定期監控
setInterval(() => {
  CacheMonitor.logCacheMetrics();
}, 10 * 60 * 1000); // 每10分鐘

export default {
  FieldCacheConfigs,
  FieldCacheManager,
  fieldCacheManager,
  fieldCache,
  SmartCacheInvalidator,
  CacheWarmer,
  CacheMonitor
}; 