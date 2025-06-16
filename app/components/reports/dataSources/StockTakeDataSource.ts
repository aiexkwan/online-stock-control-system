/**
 * Stock Take Report 數據源
 * 從現有的 stock-take/report 頁面遷移
 */

import { ReportDataSource, FilterValues } from '../core/ReportConfig';
import { createClientSupabase } from './createClientDataSource';

// Stock Take Summary 數據源
export class StockTakeSummaryDataSource implements ReportDataSource {
  id = 'stockTakeSummary';
  
  async fetch(filters: FilterValues) {
    const supabase = createClientSupabase();
    const stockTakeDate = filters.stockTakeDate;
    
    if (!stockTakeDate) {
      throw new Error('Stock take date is required');
    }
    
    // 獲取當日的所有盤點記錄
    const { data: stockTakeData, error: stockTakeError } = await supabase
      .from('record_stocktake')
      .select('*')
      .gte('count_time', stockTakeDate)
      .lt('count_time', `${stockTakeDate}T23:59:59`);
    
    if (stockTakeError) {
      throw new Error(`Failed to fetch stock take data: ${stockTakeError.message}`);
    }
    
    // 獲取所有產品的系統庫存
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level, description');
    
    if (stockError) {
      throw new Error(`Failed to fetch stock levels: ${stockError.message}`);
    }
    
    return { stockTakeData, stockLevels };
  }
  
  transform(data: any) {
    const { stockTakeData, stockLevels } = data;
    
    // 按產品分組盤點數據
    const productGroups = this.groupByProduct(stockTakeData);
    
    // 創建庫存映射
    const stockMap = new Map(
      stockLevels.map((item: any) => [item.stock, item])
    );
    
    let totalProducts = stockMap.size;
    let countedProducts = 0;
    let totalVariance = 0;
    let highVarianceCount = 0;
    
    // 計算統計
    productGroups.forEach((items, productCode) => {
      const stockInfo = stockMap.get(productCode) as any;
      const systemStock = stockInfo?.stock_level || 0;
      const countedQty = this.calculateTotalQty(items);
      const variance = countedQty - systemStock;
      const variancePercentage = systemStock > 0 ? Math.abs(variance / systemStock) : 0;
      
      if (countedQty > 0) {
        countedProducts++;
      }
      
      totalVariance += variance;
      
      if (variancePercentage > 0.1) { // 10% 差異
        highVarianceCount++;
      }
    });
    
    const completionRate = totalProducts > 0 ? countedProducts / totalProducts : 0;
    
    return {
      totalProducts,
      countedProducts,
      completionRate,
      completionPercentage: completionRate,
      totalVariance,
      highVarianceCount
    };
  }
  
  private groupByProduct(stockTakeData: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    stockTakeData.forEach(item => {
      const productCode = item.product_code;
      if (!groups.has(productCode)) {
        groups.set(productCode, []);
      }
      groups.get(productCode)!.push(item);
    });
    
    return groups;
  }
  
  private calculateTotalQty(items: any[]): number {
    return items.reduce((sum, item) => {
      // 處理初始記錄（無托盤號）
      if (!item.plt_num || item.plt_num === '') {
        return sum + (parseInt(item.system_qty || '0') || 0);
      }
      return sum + (parseInt(item.counted_qty || '0') || 0);
    }, 0);
  }
}

// Stock Take Details 數據源
export class StockTakeDetailsDataSource implements ReportDataSource {
  id = 'stockTakeDetails';
  
  async fetch(filters: FilterValues) {
    const summarySource = new StockTakeSummaryDataSource();
    return await summarySource.fetch(filters);
  }
  
  transform(data: any) {
    const { stockTakeData, stockLevels } = data;
    
    // 按產品分組
    const productGroups = this.groupByProduct(stockTakeData);
    
    // 創建庫存映射
    const stockMap = new Map(
      stockLevels.map((item: any) => [item.stock, item])
    );
    
    const results: any[] = [];
    
    // 處理每個產品
    productGroups.forEach((items, productCode) => {
      const stockInfo = stockMap.get(productCode) as any;
      const systemStock = stockInfo?.stock_level || 0;
      const countedQty = this.calculateTotalQty(items);
      const variance = countedQty - systemStock;
      const variancePercentage = systemStock > 0 ? (variance / systemStock) * 100 : 0;
      
      // 過濾條件
      if (this.shouldInclude(productCode, variance, variancePercentage, countedQty, data.filters)) {
        results.push({
          product_code: productCode,
          description: stockInfo?.description || '',
          system_stock: systemStock,
          counted_qty: countedQty,
          variance: variance,
          variance_percentage: variancePercentage,
          pallet_count: items.filter(item => item.plt_num && item.plt_num !== '').length,
          status: countedQty > 0 ? 'Counted' : 'Not Counted',
          last_updated: items[0]?.count_time || null
        });
      }
    });
    
    // 添加未盤點的產品（如果需要）
    if (!data.filters?.countStatus || data.filters.countStatus === '' || data.filters.countStatus === 'not_counted') {
      stockLevels.forEach((stockItem: any) => {
        if (!productGroups.has(stockItem.stock) && stockItem.stock_level > 0) {
          if (this.shouldInclude(stockItem.stock, -stockItem.stock_level, -100, 0, data.filters)) {
            results.push({
              product_code: stockItem.stock,
              description: stockItem.description || '',
              system_stock: stockItem.stock_level,
              counted_qty: 0,
              variance: -stockItem.stock_level,
              variance_percentage: -100,
              pallet_count: 0,
              status: 'Not Counted',
              last_updated: null
            });
          }
        }
      });
    }
    
    // 排序：差異百分比降序
    return results.sort((a, b) => Math.abs(b.variance_percentage) - Math.abs(a.variance_percentage));
  }
  
  private groupByProduct(stockTakeData: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    stockTakeData.forEach(item => {
      const productCode = item.product_code;
      if (!groups.has(productCode)) {
        groups.set(productCode, []);
      }
      groups.get(productCode)!.push(item);
    });
    
    return groups;
  }
  
  private calculateTotalQty(items: any[]): number {
    return items.reduce((sum, item) => {
      if (!item.plt_num || item.plt_num === '') {
        return sum + (parseInt(item.system_qty || '0') || 0);
      }
      return sum + (parseInt(item.counted_qty || '0') || 0);
    }, 0);
  }
  
  private shouldInclude(
    productCode: string,
    variance: number,
    variancePercentage: number,
    countedQty: number,
    filters?: any
  ): boolean {
    // 產品代碼過濾
    if (filters?.productCode && !productCode.includes(filters.productCode)) {
      return false;
    }
    
    // 差異百分比過濾
    if (filters?.minVariance && Math.abs(variancePercentage) < filters.minVariance) {
      return false;
    }
    
    // 計數狀態過濾
    if (filters?.countStatus) {
      switch (filters.countStatus) {
        case 'counted':
          return countedQty > 0;
        case 'not_counted':
          return countedQty === 0;
        case 'high_variance':
          return Math.abs(variancePercentage) > 10;
      }
    }
    
    return true;
  }
}

// Not Counted Items 數據源
export class NotCountedItemsDataSource implements ReportDataSource {
  id = 'notCountedItems';
  
  async fetch(filters: FilterValues) {
    const summarySource = new StockTakeSummaryDataSource();
    return await summarySource.fetch(filters);
  }
  
  transform(data: any) {
    const { stockTakeData, stockLevels } = data;
    
    // 獲取已盤點的產品
    const countedProducts = new Set(
      stockTakeData.map((item: any) => item.product_code)
    );
    
    // 找出未盤點的產品
    const notCountedItems = stockLevels
      .filter((item: any) => 
        !countedProducts.has(item.stock) && 
        item.stock_level > 0
      )
      .map((item: any) => ({
        product_code: item.stock,
        description: item.description || '',
        system_stock: item.stock_level
      }))
      .sort((a: any, b: any) => b.system_stock - a.system_stock);
    
    return notCountedItems;
  }
}

// 導出所有數據源
export const stockTakeDataSources = new Map<string, ReportDataSource>([
  ['stockTakeSummary', new StockTakeSummaryDataSource()],
  ['stockTakeDetails', new StockTakeDetailsDataSource()],
  ['notCountedItems', new NotCountedItemsDataSource()]
]);