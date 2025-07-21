/**
 * Excel 報表生成器
 * 使用 ExcelJS 實現，已完全移除 xlsx 依賴
 */

import {
  ReportGenerator,
  ProcessedReportData,
  ReportConfig,
  ReportFormat,
} from '../core/ReportConfig';

export class ExcelGenerator implements ReportGenerator {
  format: ReportFormat = 'excel';
  supportLegacyMode = true;
  private implementation?: ReportGenerator;

  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 延遲加載 ExcelJS 實現
    if (!this.implementation) {
      const { ExcelGeneratorNew } = await import('./ExcelGeneratorNew');
      this.implementation = new ExcelGeneratorNew();
    }

    return this.implementation.generate(data, config);
  }
}
