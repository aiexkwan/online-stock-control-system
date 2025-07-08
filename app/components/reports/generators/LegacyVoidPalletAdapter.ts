/**
 * 適配器：將統一框架數據轉換為舊版 PDF 生成器格式
 * 確保新框架能夠生成與現有完全一致的報表
 */

import { ProcessedReportData, ReportConfig } from '../core/ReportConfig';
import { LegacyVoidPalletPdfGenerator } from '../core/LegacyPdfGenerator';

export class LegacyVoidPalletAdapter {
  /**
   * 將統一框架數據轉換為舊版格式並生成 PDF
   */
  static async generatePdf(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 從 metadata 中提取日期範圍
    const dateRange = this.extractDateRange(data.metadata.filters);

    // 轉換摘要數據
    const summary = this.transformSummary(data);

    // 轉換各區段數據
    const byReason = this.transformReasonStats(data.sections.reasonBreakdown || []);
    const details = this.transformDetails(data.sections.details || []);
    const byProduct = this.transformProductStats(data.sections.productAnalysis || []);

    // 使用舊版生成器
    const generator = new LegacyVoidPalletPdfGenerator();
    return generator.generate({
      dateRange,
      summary,
      byReason,
      details,
      byProduct,
    });
  }

  private static extractDateRange(filters: any): { start: string; end: string } {
    // 處理 dateRange 過濾器
    if (filters.dateRange && filters.dateRange.includes('|')) {
      const [start, end] = filters.dateRange.split('|');
      return { start, end };
    }

    // 處理單獨的 startDate 和 endDate
    return {
      start: filters.startDate || filters.start_date || '',
      end: filters.endDate || filters.end_date || '',
    };
  }

  private static transformSummary(data: ProcessedReportData): any {
    const summaryData = data.sections.summary || data.summary || {};

    // 計算平均每天
    const dateRange = this.extractDateRange(data.metadata.filters);
    const daysDiff = this.calculateDaysDifference(dateRange.start, dateRange.end);
    const totalVoided = summaryData.totalVoided || 0;
    const averagePerDay = daysDiff > 0 ? totalVoided / daysDiff : 0;

    return {
      totalVoided: summaryData.totalVoided || 0,
      totalQuantity: summaryData.totalQuantity || 0,
      uniqueProducts: summaryData.uniqueProducts || 0,
      averagePerDay: averagePerDay,
    };
  }

  private static transformReasonStats(reasonData: any[]): any[] {
    if (!Array.isArray(reasonData)) return [];

    return reasonData.map(item => ({
      reason: item.void_reason || item.reason || 'Unknown',
      count: item.count || 0,
      quantity: item.total_quantity || item.quantity || 0,
      percentage: item.percentage || 0,
    }));
  }

  private static transformDetails(detailsData: any[]): any[] {
    if (!Array.isArray(detailsData)) return [];

    return detailsData.map(item => ({
      date: item.void_date || item.date || item.time,
      pltNum: item.plt_num || item.palletNum || '',
      productCode: item.product_code || item.productCode || '',
      description: item.product_description || item.description || '',
      quantity: item.quantity || item.qty || 0,
      reason: item.void_reason || item.reason || 'Unknown',
      operator: item.operator_name || item.operator || `ID: ${item.operator_id || ''}`,
      remark: item.remark || '',
    }));
  }

  private static transformProductStats(productData: any[]): any[] {
    if (!Array.isArray(productData)) return [];

    return productData.map(item => ({
      productCode: item.product_code || item.productCode || '',
      description: item.product_description || item.description || '',
      voidCount: item.void_count || item.count || 0,
      totalQuantity: item.total_quantity || item.totalQuantity || 0,
      avgQuantity: item.avg_quantity || item.avgQuantity || 0,
    }));
  }

  private static calculateDaysDifference(startDate: string, endDate: string): number {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1; // 至少返回 1 天
    } catch {
      return 1;
    }
  }
}
