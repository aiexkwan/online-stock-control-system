/**
 * GraphQL DataLoader Implementation
 * Week 1.2b: High Priority Pagination and Performance Optimization
 * Date: 2025-07-03
 * 
 * This module implements DataLoader pattern to prevent N+1 query problems.
 */

import DataLoader from 'dataloader';
import { unifiedDataLayer } from './unified-data-layer';

// ================================
// 1. 產品 DataLoader (Product DataLoader)
// ================================

export const productLoader = new DataLoader<string, any>(
  async (productCodes: readonly string[]) => {
    try {
      // 批量查詢產品
      const products = await unifiedDataLayer.getProductsByCodes(Array.from(productCodes));
      
      // 建立 code -> product 映射
      const productMap = new Map(products.map(p => [p.code, p]));
      
      // 確保返回順序與輸入順序一致
      return productCodes.map(code => productMap.get(code) || null);
    } catch (error) {
      console.error('Product batch loading failed:', error);
      return productCodes.map(() => null);
    }
  },
  {
    // 配置選項
    batchScheduleFn: callback => setTimeout(callback, 10), // 10ms 延遲批處理
    maxBatchSize: 100, // 最大批處理大小
    cacheKeyFn: key => key, // 緩存鍵函數
    cache: true // 啟用緩存
  }
);

// ================================
// 2. 托盤 DataLoader (Pallet DataLoader)
// ================================

export const palletLoader = new DataLoader<string, any>(
  async (palletNumbers: readonly string[]) => {
    try {
      const pallets = await unifiedDataLayer.getPalletsByNumbers(Array.from(palletNumbers));
      const palletMap = new Map(pallets.map(p => [p.palletNumber, p]));
      
      return palletNumbers.map(number => palletMap.get(number) || null);
    } catch (error) {
      console.error('Pallet batch loading failed:', error);
      return palletNumbers.map(() => null);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 10),
    maxBatchSize: 100,
    cache: true
  }
);

// ================================
// 3. 庫存記錄 DataLoader (Inventory DataLoader)
// ================================

export const inventoryLoader = new DataLoader<string, any[]>(
  async (productCodes: readonly string[]) => {
    try {
      // 批量查詢庫存記錄
      const inventoryRecords = await unifiedDataLayer.getInventoryByProductCodes(Array.from(productCodes));
      
      // 按產品代碼分組
      const inventoryMap = new Map<string, any[]>();
      inventoryRecords.forEach(record => {
        const productCode = record.productCode;
        if (!inventoryMap.has(productCode)) {
          inventoryMap.set(productCode, []);
        }
        inventoryMap.get(productCode)!.push(record);
      });
      
      return productCodes.map(code => inventoryMap.get(code) || []);
    } catch (error) {
      console.error('Inventory batch loading failed:', error);
      return productCodes.map(() => []);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 15),
    maxBatchSize: 50, // 庫存查詢可能較重，減少批次大小
    cache: true
  }
);

// ================================
// 4. 移動記錄 DataLoader (Movement DataLoader)
// ================================

export const movementLoader = new DataLoader<string, any[]>(
  async (palletNumbers: readonly string[]) => {
    try {
      const movements = await unifiedDataLayer.getMovementsByPalletNumbers(Array.from(palletNumbers));
      
      // 按托盤號分組
      const movementMap = new Map<string, any[]>();
      movements.forEach(movement => {
        const palletNumber = movement.palletNumber;
        if (!movementMap.has(palletNumber)) {
          movementMap.set(palletNumber, []);
        }
        movementMap.get(palletNumber)!.push(movement);
      });
      
      return palletNumbers.map(number => movementMap.get(number) || []);
    } catch (error) {
      console.error('Movement batch loading failed:', error);
      return palletNumbers.map(() => []);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 20), // 移動記錄查詢可能更重
    maxBatchSize: 30,
    cache: true
  }
);

// ================================
// 5. GRN 記錄 DataLoader (GRN DataLoader)
// ================================

export const grnRecordLoader = new DataLoader<string, any[]>(
  async (palletNumbers: readonly string[]) => {
    try {
      const grnRecords = await unifiedDataLayer.getGRNRecordsByPalletNumbers(Array.from(palletNumbers));
      
      const grnMap = new Map<string, any[]>();
      grnRecords.forEach(grn => {
        const palletNumber = grn.palletNumber;
        if (!grnMap.has(palletNumber)) {
          grnMap.set(palletNumber, []);
        }
        grnMap.get(palletNumber)!.push(grn);
      });
      
      return palletNumbers.map(number => grnMap.get(number) || []);
    } catch (error) {
      console.error('GRN batch loading failed:', error);
      return palletNumbers.map(() => []);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 10),
    maxBatchSize: 80,
    cache: true
  }
);

// ================================
// 6. 訂單 DataLoader (Order DataLoader)
// ================================

export const orderLoader = new DataLoader<number, any>(
  async (orderRefs: readonly number[]) => {
    try {
      const orders = await unifiedDataLayer.getOrdersByRefs(Array.from(orderRefs));
      const orderMap = new Map(orders.map(o => [o.orderRef, o]));
      
      return orderRefs.map(ref => orderMap.get(ref) || null);
    } catch (error) {
      console.error('Order batch loading failed:', error);
      return orderRefs.map(() => null);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 10),
    maxBatchSize: 100,
    cache: true
  }
);

// ================================
// 7. 用戶 DataLoader (User DataLoader)
// ================================

export const userLoader = new DataLoader<number, any>(
  async (userIds: readonly number[]) => {
    try {
      const users = await unifiedDataLayer.getUsersByIds(Array.from(userIds));
      const userMap = new Map(users.map(u => [u.id, u]));
      
      return userIds.map(id => userMap.get(id) || null);
    } catch (error) {
      console.error('User batch loading failed:', error);
      return userIds.map(() => null);
    }
  },
  {
    batchScheduleFn: callback => setTimeout(callback, 5), // 用戶數據快速加載
    maxBatchSize: 200,
    cache: true,
    cacheMap: new Map() // 自定義緩存，用戶數據可長時間緩存
  }
);

// ================================
// 8. DataLoader 上下文管理 (DataLoader Context Management)
// ================================

export interface DataLoaderContext {
  productLoader: DataLoader<string, any>;
  palletLoader: DataLoader<string, any>;
  inventoryLoader: DataLoader<string, any[]>;
  movementLoader: DataLoader<string, any[]>;
  grnRecordLoader: DataLoader<string, any[]>;
  orderLoader: DataLoader<number, any>;
  userLoader: DataLoader<number, any>;
}

// 創建 DataLoader 上下文
export function createDataLoaderContext(): DataLoaderContext {
  return {
    productLoader: new DataLoader(productLoader._batchLoadFn, productLoader._options),
    palletLoader: new DataLoader(palletLoader._batchLoadFn, palletLoader._options),
    inventoryLoader: new DataLoader(inventoryLoader._batchLoadFn, inventoryLoader._options),
    movementLoader: new DataLoader(movementLoader._batchLoadFn, movementLoader._options),
    grnRecordLoader: new DataLoader(grnRecordLoader._batchLoadFn, grnRecordLoader._options),
    orderLoader: new DataLoader(orderLoader._batchLoadFn, orderLoader._options),
    userLoader: new DataLoader(userLoader._batchLoadFn, userLoader._options)
  };
}

// ================================
// 9. DataLoader 性能監控 (Performance Monitoring)
// ================================

export class DataLoaderMonitor {
  private static stats = new Map<string, {
    totalLoads: number;
    batchLoads: number;
    cacheHits: number;
    totalTime: number;
    maxTime: number;
  }>();

  static trackLoad(loaderName: string, isBatch: boolean, cacheHit: boolean, time: number) {
    const stats = this.stats.get(loaderName) || {
      totalLoads: 0,
      batchLoads: 0,
      cacheHits: 0,
      totalTime: 0,
      maxTime: 0
    };

    stats.totalLoads++;
    if (isBatch) stats.batchLoads++;
    if (cacheHit) stats.cacheHits++;
    stats.totalTime += time;
    stats.maxTime = Math.max(stats.maxTime, time);

    this.stats.set(loaderName, stats);
  }

  static getReport() {
    const report = Array.from(this.stats.entries()).map(([loader, stats]) => ({
      loader,
      totalLoads: stats.totalLoads,
      batchLoads: stats.batchLoads,
      cacheHits: stats.cacheHits,
      cacheHitRate: stats.cacheHits / stats.totalLoads,
      batchEfficiency: stats.batchLoads / stats.totalLoads,
      avgTime: stats.totalTime / stats.totalLoads,
      maxTime: stats.maxTime
    }));

    return {
      loaders: report,
      summary: {
        totalDataLoads: report.reduce((sum, r) => sum + r.totalLoads, 0),
        overallCacheHitRate: report.reduce((sum, r) => sum + r.cacheHitRate, 0) / report.length,
        overallBatchEfficiency: report.reduce((sum, r) => sum + r.batchEfficiency, 0) / report.length
      }
    };
  }

  static resetStats() {
    this.stats.clear();
  }
}

// ================================
// 10. DataLoader 配置優化 (Configuration Optimization)
// ================================

export const DataLoaderConfig = {
  // 生產環境配置
  production: {
    batchScheduleFn: (callback: () => void) => setTimeout(callback, 5), // 更快的批處理
    maxBatchSize: 200, // 更大的批次
    cache: true,
    cacheMap: new Map() // 使用共享緩存
  },

  // 開發環境配置
  development: {
    batchScheduleFn: (callback: () => void) => setTimeout(callback, 10),
    maxBatchSize: 50,
    cache: true,
    cacheMap: new Map()
  },

  // 測試環境配置
  test: {
    batchScheduleFn: (callback: () => void) => setImmediate(callback), // 立即執行
    maxBatchSize: 10,
    cache: false // 測試時禁用緩存
  }
};

// ================================
// 11. GraphQL 解析器整合 (GraphQL Resolver Integration)
// ================================

export const resolverHelpers = {
  // 產品解析器輔助函數
  async resolveProduct(parent: any, context: DataLoaderContext) {
    if (parent.productCode) {
      return context.productLoader.load(parent.productCode);
    }
    return null;
  },

  // 托盤解析器輔助函數
  async resolvePallet(parent: any, context: DataLoaderContext) {
    if (parent.palletNumber) {
      return context.palletLoader.load(parent.palletNumber);
    }
    return null;
  },

  // 移動記錄解析器輔助函數
  async resolveMovements(parent: any, args: any, context: DataLoaderContext) {
    const movements = await context.movementLoader.load(parent.palletNumber || parent.id);
    
    // 應用分頁
    if (args.first) {
      return {
        edges: movements.slice(0, args.first).map((movement, index) => ({
          node: movement,
          cursor: Buffer.from(`${index}`).toString('base64')
        })),
        pageInfo: {
          hasNextPage: movements.length > args.first,
          hasPreviousPage: false,
          startCursor: movements.length > 0 ? Buffer.from('0').toString('base64') : null,
          endCursor: movements.length > 0 ? Buffer.from(`${Math.min(args.first - 1, movements.length - 1)}`).toString('base64') : null
        },
        totalCount: movements.length
      };
    }

    return movements;
  }
};

const dataLoaders = {
  productLoader,
  palletLoader,
  inventoryLoader,
  movementLoader,
  grnRecordLoader,
  orderLoader,
  userLoader,
  createDataLoaderContext,
  DataLoaderMonitor,
  DataLoaderConfig,
  resolverHelpers
};

export default dataLoaders; 