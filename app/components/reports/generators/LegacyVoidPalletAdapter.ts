/**
 * 適配器：將統一框架數據轉換為舊版 PDF 生成器格式
 * 確保新框架能夠生成與現有完全一致的報表
 */

import { ProcessedReportData, ReportConfig } from '../core/ReportConfig';
import { LegacyVoidPalletPdfGenerator } from '../core/LegacyPdfGenerator';
import { safeGet, safeString, safeNumber, toRecordArray } from '../../../../types/database/helpers';

export class LegacyVoidPalletAdapter {
  /**
   * 將統一框架數據轉換為舊版格式並生成 PDF
   */
  static async generatePdf(data: ProcessedReportData, _config: ReportConfig): Promise<Blob> {
    // 從 metadata 中提取日期範圍
    const dateRange = this.extractDateRange(data.metadata.filters);

    // 轉換摘要數據
    const summary = this.transformSummary(data);

    // 轉換各區段數據 - 使用策略4: unknown + type narrowing
    const byReason = this.transformReasonStats(data.sections.reasonBreakdown ?? []);
    const details = this.transformDetails(data.sections.details ?? []);
    const byProduct = this.transformProductStats(data.sections.productAnalysis ?? []);

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

    // 處理單獨的 startDate 和 endDate
    return {
      start:
        typeof filters.startDate === 'string'
          ? filters.startDate
          : typeof filters.start_date === 'string'
            ? filters.start_date
            : '',
      end:
        typeof filters.endDate === 'string'
          ? filters.endDate
          : typeof filters.end_date === 'string'
            ? filters.end_date
            : '',
    };
  }

  private static transformSummary(data: ProcessedReportData): {
    totalVoided: number;
    totalQuantity: number;
    uniqueProducts: number;
    averagePerDay: number;
  } {
    const summaryData = data.sections.summary ?? data.summary;

    // 計算平均每天
    const dateRange = this.extractDateRange(data.metadata.filters);
    const daysDiff = this.calculateDaysDifference(dateRange.start, dateRange.end);
    const totalVoided = safeNumber(safeGet(summaryData, 'totalVoided'), 0);
    const averagePerDay = daysDiff > 0 ? totalVoided / daysDiff : 0;

    return {
      totalVoided,
      totalQuantity: safeNumber(safeGet(summaryData, 'totalQuantity'), 0),
      uniqueProducts: safeNumber(safeGet(summaryData, 'uniqueProducts'), 0),
      averagePerDay,
    };
  }

  private static transformReasonStats(
    reasonData: unknown
  ): { reason: string; count: number; quantity: number; percentage: number }[] {
    if (!Array.isArray(reasonData)) return [];

    return toRecordArray(reasonData)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          reason: safeString(safeGet(item, 'void_reason') || safeGet(item, 'reason'), 'Unknown'),
          count: safeNumber(safeGet(item, 'count'), 0),
          quantity: safeNumber(safeGet(item, 'total_quantity') || safeGet(item, 'quantity'), 0),
          percentage: safeNumber(safeGet(item, 'percentage'), 0),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private static transformDetails(detailsData: unknown): {
    date: string;
    pltNum: string;
    productCode: string;
    description: string;
    quantity: number;
    reason: string;
    operator: string;
    remark: string;
  }[] {
    if (!Array.isArray(detailsData)) return [];

    return toRecordArray(detailsData)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          date: safeString(
            safeGet(item, 'void_date') || safeGet(item, 'date') || safeGet(item, 'time'),
            ''
          ),
          pltNum: safeString(safeGet(item, 'plt_num') || safeGet(item, 'palletNum'), ''),
          productCode: safeString(
            safeGet(item, 'product_code') || safeGet(item, 'productCode'),
            ''
          ),
          description: safeString(
            safeGet(item, 'product_description') || safeGet(item, 'description'),
            ''
          ),
          quantity: safeNumber(safeGet(item, 'quantity') || safeGet(item, 'qty'), 0),
          reason: safeString(safeGet(item, 'void_reason') || safeGet(item, 'reason'), 'Unknown'),
          operator: safeString(
            safeGet(item, 'operator_name') ||
              safeGet(item, 'operator') ||
              `ID: ${safeGet(item, 'operator_id')}`,
            ''
          ),
          remark: safeString(safeGet(item, 'remark'), ''),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private static transformProductStats(productData: unknown): {
    productCode: string;
    description: string;
    voidCount: number;
    totalQuantity: number;
    avgQuantity: number;
  }[] {
    if (!Array.isArray(productData)) return [];

    return toRecordArray(productData)
      .map((item: Record<string, unknown>) => {
        if (typeof item !== 'object' || item === null) return null;

        return {
          productCode: safeString(
            safeGet(item, 'product_code') || safeGet(item, 'productCode'),
            ''
          ),
          description: safeString(
            safeGet(item, 'product_description') || safeGet(item, 'description'),
            ''
          ),
          voidCount: safeNumber(safeGet(item, 'void_count') || safeGet(item, 'count'), 0),
          totalQuantity: safeNumber(
            safeGet(item, 'total_quantity') || safeGet(item, 'totalQuantity'),
            0
          ),
          avgQuantity: safeNumber(safeGet(item, 'avg_quantity') || safeGet(item, 'avgQuantity'), 0),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
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
