/**
 * Excel 報表生成器 (舊版 xlsx 實現)
 * 保留作為向後兼容，將逐步遷移到 ExcelJS
 */

import { 
  ReportGenerator, 
  ProcessedReportData, 
  ReportConfig,
  ReportFormat 
} from '../core/ReportConfig';

export class ExcelGeneratorLegacy implements ReportGenerator {
  format: ReportFormat = 'excel';
  supportLegacyMode = true;
  
  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 動態導入 xlsx 以避免在使用 ExcelJS 時加載
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // 添加摘要工作表
    if (data.summary && Object.keys(data.summary).length > 0) {
      this.addSummarySheet(workbook, data.summary, config, XLSX);
    }
    
    // 添加各區段工作表
    for (const section of config.sections) {
      // 檢查是否在 Excel 中隱藏此區段
      if (section.hideInFormats?.includes('excel')) {
        continue;
      }
      
      const sectionData = data.sections[section.id];
      if (!sectionData) continue;
      
      if (section.type === 'table' && Array.isArray(sectionData)) {
        this.addDataSheet(workbook, section, sectionData, config, XLSX);
      }
    }
    
    // 添加元數據工作表
    this.addMetadataSheet(workbook, data.metadata, config, XLSX);
    
    // 生成 Excel 文件
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: true,
      compression: true
    });
    
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
  
  private addSummarySheet(
    workbook: any, 
    summary: Record<string, any>, 
    config: ReportConfig,
    XLSX: any
  ): void {
    const summaryData: any[][] = [
      ['Summary Statistics'],
      [''],
      ['Metric', 'Value']
    ];
    
    // 從配置中獲取摘要欄位定義
    const summarySection = config.sections.find(s => s.type === 'summary');
    const summaryFields = summarySection?.config?.summaryFields || [];
    
    for (const field of summaryFields) {
      const value = summary[field.id];
      if (value !== undefined) {
        summaryData.push([field.label, this.formatValue(value, field.format)]);
      }
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // 設置列寬
    worksheet['!cols'] = [
      { wch: 30 }, // Metric column
      { wch: 20 }  // Value column
    ];
    
    // 應用樣式（如果支援）
    this.applyStyles(worksheet, config);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  }
  
  private addDataSheet(
    workbook: any,
    section: any,
    data: any[],
    config: ReportConfig,
    XLSX: any
  ): void {
    if (!data || data.length === 0) {
      // 添加空工作表
      const worksheet = XLSX.utils.aoa_to_sheet([
        [section.title],
        [''],
        ['No data available']
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, section.title);
      return;
    }
    
    const columns = section.config?.columns || this.inferColumns(data[0]);
    
    // 構建表格數據
    const sheetData: any[][] = [];
    
    // 標題行
    sheetData.push([section.title]);
    sheetData.push([]); // 空行
    
    // 列標題
    const headers = columns.map((col: any) => col.label);
    sheetData.push(headers);
    
    // 數據行
    data.forEach(item => {
      const row = columns.map((col: any) => {
        const value = item[col.id];
        return this.formatValue(value, col.format || col.type);
      });
      sheetData.push(row);
    });
    
    // 添加統計行（如果需要）
    if (section.config?.showTotals) {
      const totalsRow = this.calculateTotals(data, columns);
      sheetData.push([]); // 空行
      sheetData.push(totalsRow);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // 設置列寬
    const colWidths = columns.map((col: any) => ({ 
      wch: col.width ? col.width / 7 : 15 // 轉換為字符寬度
    }));
    worksheet['!cols'] = colWidths;
    
    // 應用樣式
    this.applyStyles(worksheet, config);
    
    // 使用簡短的工作表名稱（Excel 限制 31 字符）
    const sheetName = section.title.length > 31 
      ? section.title.substring(0, 28) + '...' 
      : section.title;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  
  private addMetadataSheet(
    workbook: any,
    metadata: any,
    config: ReportConfig,
    XLSX: any
  ): void {
    const metadataRows: any[][] = [
      ['Report Information'],
      [''],
      ['Report Name', config.name],
      ['Report ID', config.id],
      ['Generated At', new Date(metadata.generatedAt).toLocaleString()],
      ['Total Records', metadata.recordCount],
      [''],
      ['Applied Filters'],
      ['Filter', 'Value']
    ];
    
    // 添加過濾器值
    for (const [key, value] of Object.entries(metadata.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const filterConfig = config.filters.find(f => f.id === key);
        const label = filterConfig?.label || key;
        metadataRows.push([label, String(value)]);
      }
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(metadataRows);
    
    // 設置列寬
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 40 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Info');
  }
  
  private applyStyles(worksheet: any, config: ReportConfig): void {
    // 注意：xlsx 庫的社區版不支援樣式
    // 如果需要樣式，可以使用 xlsx-style 或 exceljs
    // 這裡保留介面以便將來擴展
    
    const styleConfig = config.styleOverrides?.excel;
    if (!styleConfig) return;
    
    // 樣式應用邏輯（需要支援樣式的庫）
  }
  
  private inferColumns(dataItem: any): any[] {
    return Object.keys(dataItem).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: typeof dataItem[key] === 'number' ? 'number' : 'text'
    }));
  }
  
  private formatValue(value: any, format?: string): any {
    if (value === null || value === undefined) {
      return '';
    }
    
    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return Number(value);
      case 'percentage':
        return Number(value);
      case 'number':
        return Number(value);
      case 'decimal:2':
        return Math.round(Number(value) * 100) / 100;
      default:
        return value;
    }
  }
  
  private calculateTotals(data: any[], columns: any[]): any[] {
    const totals: any[] = ['Total'];
    
    for (let i = 1; i < columns.length; i++) {
      const col = columns[i];
      if (col.type === 'number' || col.type === 'currency') {
        const sum = data.reduce((acc, item) => 
          acc + (Number(item[col.id]) || 0), 0
        );
        totals.push(sum);
      } else {
        totals.push('');
      }
    }
    
    return totals;
  }
}