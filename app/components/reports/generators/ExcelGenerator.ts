/**
 * Excel 報表生成器
 * 保持與現有 Excel 報表格式兼容
 * 
 * 注意：此檔案正在從 xlsx 遷移到 ExcelJS
 * 使用 USE_EXCELJS 環境變數或功能旗標控制
 */

import { 
  ReportGenerator, 
  ProcessedReportData, 
  ReportConfig,
  ReportFormat 
} from '../core/ReportConfig';

// 動態導入以避免打包問題
const USE_EXCELJS = process.env.USE_EXCELJS === 'true' || process.env.NODE_ENV === 'development';

export class ExcelGenerator implements ReportGenerator {
  format: ReportFormat = 'excel';
  supportLegacyMode = true;
  private implementation?: ReportGenerator;
  
  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 延遲加載實現
    if (!this.implementation) {
      if (USE_EXCELJS) {
        // 使用新的 ExcelJS 實現
        const { ExcelGeneratorNew } = await import('./ExcelGeneratorNew');
        this.implementation = new ExcelGeneratorNew();
      } else {
        // 使用舊的 xlsx 實現
        const { ExcelGeneratorLegacy } = await import('./ExcelGeneratorLegacy');
        this.implementation = new ExcelGeneratorLegacy();
      }
    }
    
    return this.implementation.generate(data, config);
  }
}