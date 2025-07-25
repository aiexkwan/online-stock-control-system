/**
 * CSV 報表生成器
 * 簡單的 CSV 格式輸出
 */

import {
  ReportGenerator,
  ProcessedReportData,
  ReportConfig,
  ReportFormat,
  ColumnConfig,
} from '../core/ReportConfig';

export class CsvGenerator implements ReportGenerator {
  format: ReportFormat = 'csv';

  // 策略2: DTO/自定義 type interface - 類型守衛函數
  private isColumnConfig(obj: unknown): obj is ColumnConfig {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'label' in obj &&
      typeof (obj as Record<string, unknown>).id === 'string' &&
      typeof (obj as Record<string, unknown>).label === 'string'
    );
  }

  // 策略2: 安全的列配置轉換
  private ensureColumnConfig(obj: unknown): ColumnConfig {
    if (this.isColumnConfig(obj)) {
      return obj;
    }
    // 回退到基本配置
    const record = obj as Record<string, unknown>;
    return {
      id: typeof record.id === 'string' ? record.id : 'unknown',
      label: typeof record.label === 'string' ? record.label : 'Unknown',
      type: typeof record.type === 'string' ? (record.type as ColumnConfig['type']) : 'text',
      exportOnly: typeof record.exportOnly === 'boolean' ? record.exportOnly : false,
      format: typeof record.format === 'string' ? record.format : undefined,
    };
  }

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

      // 策略2: 獲取列配置 - 統一類型處理
      const columns =
        section.config?.columns || this.inferColumns(sectionData[0] as Record<string, unknown>);

      // 確保所有列配置都是安全的 ColumnConfig 類型
      const safeColumns = columns.map(col => this.ensureColumnConfig(col));
      const headers = safeColumns
        .filter((col: ColumnConfig) => !col.exportOnly) // 排除僅導出列
        .map((col: ColumnConfig) => this.escapeCSV(col.label));
      csvLines.push(headers.join(','));

      // 策略2: 添加數據行 - 安全的類型轉換和屬性訪問
      sectionData.forEach(item => {
        const row = safeColumns
          .filter((col: ColumnConfig) => !col.exportOnly)
          .map((col: ColumnConfig) => {
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

  // 策略2: DTO/自定義 type interface - 推斷列配置
  private inferColumns(dataItem: Record<string, unknown>): ColumnConfig[] {
    return Object.keys(dataItem).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: typeof dataItem[key] === 'number' ? 'number' : 'text',
      exportOnly: false,
    }));
  }

  private formatValue(value: unknown, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (format) {
      case 'date':
        // 策略4: unknown + type narrowing - 安全的日期轉換
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        if (typeof value === 'string' || typeof value === 'number') {
          return new Date(value).toLocaleDateString();
        }
        return String(value);
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
