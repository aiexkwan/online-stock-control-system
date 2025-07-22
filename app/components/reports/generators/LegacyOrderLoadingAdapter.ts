/**
 * 適配器：將統一框架數據轉換為舊版 Order Loading PDF 生成器格式
 */

import { ProcessedReportData, ReportConfig } from '../core/ReportConfig';
import { LegacyOrderLoadingPdfGenerator } from '../core/LegacyOrderLoadingPdfGenerator';
import { safeGet, safeString, safeNumber, toRecordArray } from '@/types/database/helpers';

export class LegacyOrderLoadingAdapter {
  /**
   * 將統一框架數據轉換為舊版格式並生成 PDF
   */
  static async generatePdf(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 從 metadata 中提取日期範圍和過濾器
    const dateRange = this.extractDateRange(data.metadata.filters);
    const filters = this.extractFilters(data.metadata.filters);

    // 轉換各區段數據 - 使用策略4: unknown + type narrowing
    const summaryData = data.sections.summary ?? data.summary;
    const orderProgressData = data.sections.orderProgress ?? [];
    const loadingDetailsData = data.sections.loadingDetails ?? [];
    const userPerformanceData = data.sections.userPerformance ?? [];

    // 使用舊版生成器
    const generator = new LegacyOrderLoadingPdfGenerator();
    return generator.generate({
      dateRange,
      filters,
      summary: {
        totalOrders: safeNumber(safeGet(summaryData, 'totalOrders'), 0),
        completedOrders: safeNumber(safeGet(summaryData, 'completedOrders'), 0),
        totalItemsLoaded: safeNumber(safeGet(summaryData, 'totalItemsLoaded'), 0),
        avgCompletionRate: safeNumber(safeGet(summaryData, 'avgCompletionRate'), 0),
      },
      orderProgress: this.transformOrderProgress(orderProgressData),
      loadingDetails: this.transformLoadingDetails(loadingDetailsData),
      userPerformance: this.transformUserPerformance(userPerformanceData),
    });
  }

  private static extractDateRange(filters: Record<string, unknown>): {
    start: string;
    end: string;
  } {
    // 處理 dateRange 過濾器
    const dateRange = filters.dateRange;
    if (typeof dateRange === 'string' && dateRange.includes('|')) {
      const [start, end] = dateRange.split('|');
      return { start, end };
    }

    // 處理單獨的日期
    return {
      start: typeof filters.startDate === 'string' ? filters.startDate : '',
      end: typeof filters.endDate === 'string' ? filters.endDate : '',
    };
  }

  private static extractFilters(filters: Record<string, unknown>): Record<string, unknown> {
    return {
      orderNumber: filters.orderNumber || undefined,
      productCode: filters.productCode || undefined,
      userId: filters.userId || undefined,
      status: filters.status || undefined,
    };
  }

  private static transformOrderProgress(data: unknown): {
    order_number: string;
    order_date: string;
    total_items: number;
    loaded_items: number;
    completion_rate: number;
    status: string;
  }[] {
    if (!Array.isArray(data)) return [];

    return toRecordArray(data)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          order_number: safeString(safeGet(item, 'order_number'), ''),
          order_date: safeString(safeGet(item, 'order_date'), ''),
          total_items: safeNumber(safeGet(item, 'total_items'), 0),
          loaded_items: safeNumber(safeGet(item, 'loaded_items'), 0),
          completion_rate: safeNumber(safeGet(item, 'completion_rate'), 0),
          status: safeString(safeGet(item, 'status'), 'Pending'),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private static transformLoadingDetails(data: unknown): {
    timestamp: string;
    order_number: string;
    product_code: string;
    product_description: string;
    loaded_qty: number;
    user_name: string;
    action: string;
  }[] {
    if (!Array.isArray(data)) return [];

    return toRecordArray(data)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          timestamp: safeString(safeGet(item, 'timestamp') || safeGet(item, 'created_at'), ''),
          order_number: safeString(safeGet(item, 'order_number'), ''),
          product_code: safeString(safeGet(item, 'product_code'), ''),
          product_description: safeString(safeGet(item, 'product_description'), ''),
          loaded_qty: safeNumber(safeGet(item, 'loaded_qty'), 0),
          user_name: safeString(safeGet(item, 'user_name'), ''),
          action: safeString(safeGet(item, 'action'), 'Load'),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private static transformUserPerformance(data: unknown): {
    user_id: string;
    user_name: string;
    total_loads: number;
    total_quantity: number;
    avg_load_time: string;
  }[] {
    if (!Array.isArray(data)) return [];

    return toRecordArray(data)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          user_id: safeString(safeGet(item, 'user_id'), ''),
          user_name: safeString(safeGet(item, 'user_name'), ''),
          total_loads: safeNumber(safeGet(item, 'total_loads'), 0),
          total_quantity: safeNumber(safeGet(item, 'total_quantity'), 0),
          avg_load_time: safeString(safeGet(item, 'avg_load_time'), 'N/A'),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}
