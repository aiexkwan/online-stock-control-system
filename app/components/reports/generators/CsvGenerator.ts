/**
 * CSV 報表生成器
 * 簡單的 CSV 格式輸出
 */

import {
  ReportGenerator,
  ProcessedReportData,
  ReportConfig,
  ReportFormat,
} from '../core/ReportConfig';

export class CsvGenerator implements ReportGenerator {
  format: ReportFormat = 'csv';

  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    const csvLines: string[] = [];

    // 添加報表標題
    csvLines.push(`"${config.name}"`);
    csvLines.push(`"Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}"`);
    csvLines.push(''); // 空行

    // 添加過濾器信息
    const activeFilters = Object.entries(data.metadata.filters).filter(
      ([_, value]) => value !== undefined && value !== null && value !== ''
    );

    if (activeFilters.length > 0) {
      csvLines.push('"Applied Filters:"');
      activeFilters.forEach(([key, value]) => {
        const filterConfig = config.filters.find(f => f.id === key);
        const label = filterConfig?.label || key;
        csvLines.push(`"${label}","${value}"`);
      });
      csvLines.push(''); // 空行
    }

    // 處理每個表格區段
    for (const section of config.sections) {
      // 檢查是否在 CSV 中隱藏此區段
      if (section.hideInFormats?.includes('csv')) {
        continue;
      }

      const sectionData = data.sections[section.id];
      if (!sectionData || section.type !== 'table' || !Array.isArray(sectionData)) {
        continue;
      }

      if (sectionData.length === 0) {
        continue;
      }

      // 添加區段標題
      csvLines.push(`"${section.title}"`);

      // 獲取列配置
      const columns = section.config?.columns || this.inferColumns(sectionData[0]);

      // 添加列標題
      const headers = columns
        .filter((col: any) => !col.exportOnly) // 排除僅導出列
        .map((col: any) => this.escapeCSV(col.label));
      csvLines.push(headers.join(','));

      // 添加數據行
      sectionData.forEach(item => {
        const row = columns
          .filter((col: any) => !col.exportOnly)
          .map((col: any) => {
            const value = item[col.id];
            const formatted = this.formatValue(value, col.format || col.type);
            return this.escapeCSV(formatted);
          });
        csvLines.push(row.join(','));
      });

      csvLines.push(''); // 區段之間的空行
    }

    // 生成 CSV Blob
    const csvContent = csvLines.join('\n');

    // 添加 BOM 以支援 Excel 正確顯示 UTF-8
    const BOM = '\uFEFF';
    return new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8',
    });
  }

  private inferColumns(dataItem: any): any[] {
    return Object.keys(dataItem).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: typeof dataItem[key] === 'number' ? 'number' : 'text',
    }));
  }

  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      case 'number':
        return Number(value).toString();
      case 'decimal:2':
        return Number(value).toFixed(2);
      default:
        return String(value);
    }
  }

  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // 檢查是否需要引號
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // 轉義引號並用引號包圍
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }
}
