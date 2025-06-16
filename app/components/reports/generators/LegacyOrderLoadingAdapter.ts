/**
 * 適配器：將統一框架數據轉換為舊版 Order Loading PDF 生成器格式
 */

import { ProcessedReportData, ReportConfig } from '../core/ReportConfig';
import { LegacyOrderLoadingPdfGenerator } from '../core/LegacyOrderLoadingPdfGenerator';

export class LegacyOrderLoadingAdapter {
  /**
   * 將統一框架數據轉換為舊版格式並生成 PDF
   */
  static async generatePdf(
    data: ProcessedReportData, 
    config: ReportConfig
  ): Promise<Blob> {
    // 從 metadata 中提取日期範圍和過濾器
    const dateRange = this.extractDateRange(data.metadata.filters);
    const filters = this.extractFilters(data.metadata.filters);
    
    // 轉換各區段數據
    const summary = data.sections.summary || data.summary || {};
    const orderProgress = data.sections.orderProgress || [];
    const loadingDetails = data.sections.loadingDetails || [];
    const userPerformance = data.sections.userPerformance || [];
    
    // 使用舊版生成器
    const generator = new LegacyOrderLoadingPdfGenerator();
    return generator.generate({
      dateRange,
      filters,
      summary: {
        totalOrders: summary.totalOrders || 0,
        completedOrders: summary.completedOrders || 0,
        totalItemsLoaded: summary.totalItemsLoaded || 0,
        avgCompletionRate: summary.avgCompletionRate || 0
      },
      orderProgress: this.transformOrderProgress(orderProgress),
      loadingDetails: this.transformLoadingDetails(loadingDetails),
      userPerformance: this.transformUserPerformance(userPerformance)
    });
  }
  
  private static extractDateRange(filters: any): { start: string; end: string } {
    // 處理 dateRange 過濾器
    if (filters.dateRange && filters.dateRange.includes('|')) {
      const [start, end] = filters.dateRange.split('|');
      return { start, end };
    }
    
    // 處理單獨的日期
    return {
      start: filters.startDate || '',
      end: filters.endDate || ''
    };
  }
  
  private static extractFilters(filters: any): any {
    return {
      orderNumber: filters.orderNumber || undefined,
      productCode: filters.productCode || undefined,
      userId: filters.userId || undefined,
      status: filters.status || undefined
    };
  }
  
  private static transformOrderProgress(data: any[]): any[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      order_number: item.order_number || '',
      order_date: item.order_date || '',
      total_items: item.total_items || 0,
      loaded_items: item.loaded_items || 0,
      completion_rate: item.completion_rate || 0,
      status: item.status || 'Pending'
    }));
  }
  
  private static transformLoadingDetails(data: any[]): any[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      timestamp: item.timestamp || item.created_at || '',
      order_number: item.order_number || '',
      product_code: item.product_code || '',
      product_description: item.product_description || '',
      loaded_qty: item.loaded_qty || 0,
      user_name: item.user_name || '',
      action: item.action || 'Load'
    }));
  }
  
  private static transformUserPerformance(data: any[]): any[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      user_id: item.user_id || '',
      user_name: item.user_name || '',
      total_loads: item.total_loads || 0,
      total_quantity: item.total_quantity || 0,
      avg_load_time: item.avg_load_time || 'N/A'
    }));
  }
}