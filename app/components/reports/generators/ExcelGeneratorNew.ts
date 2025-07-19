/**
 * Excel 報表生成器 (ExcelJS 版本)
 * 替代原有 xlsx 版本，提供更豐富嘅功能同更好嘅安全性
 */

import { getExcelJS } from '@/lib/utils/exceljs-dynamic';
import { DatabaseRecord } from '@/lib/types/database';
import type { Workbook, Worksheet } from '@/lib/utils/exceljs-dynamic';
import {
  ReportGenerator,
  ProcessedReportData,
  ReportConfig,
  ReportFormat,
} from '../core/ReportConfig';
import {
  jsonToWorksheet,
  setHeaderStyle,
  addBorders,
  autoFitColumns,
  NumberFormats,
  setNumberFormat,
} from '@/lib/utils/exceljs-migration-helper';
import {
  validateAndParseReportConfig,
  validateAndParseProcessedData,
  validateColumnConfig,
  validateSectionConfig,
  type ValidatedColumnConfig,
  type ValidatedSectionConfig,
  type ValidatedReportConfig,
  type ValidatedProcessedReportData,
} from '../schemas/ExcelGeneratorSchemas';

export class ExcelGeneratorNew implements ReportGenerator {
  format: ReportFormat = 'excel';
  supportLegacyMode = true;

  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // Strategy 1: Zod validation for runtime safety
    const validatedData = validateAndParseProcessedData(data);
    const validatedConfig = validateAndParseReportConfig(config);
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();

    // 設置工作簿屬性
    workbook.creator = 'NewPennine WMS';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // 添加摘要工作表
    if (data.summary && Object.keys(data.summary).length > 0) {
      await this.addSummarySheet(workbook, data.summary, config);
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
        await this.addDataSheet(workbook, section, sectionData, config);
      }
    }

    // 添加元數據工作表
    await this.addMetadataSheet(workbook, data.metadata, config);

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  private async addSummarySheet(
    workbook: Workbook,
    summary: Record<string, unknown>,
    config: ReportConfig
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Summary');

    // 標題
    const titleRow = worksheet.addRow(['Summary Statistics']);
    titleRow.font = { size: 16, bold: true };
    titleRow.height = 30;
    worksheet.mergeCells('A1:B1');
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // 空行
    worksheet.addRow([]);

    // 標題行
    const headerRow = worksheet.addRow(['Metric', 'Value']);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 從配置中獲取摘要欄位定義
    const summarySection = config.sections.find(s => s.type === 'summary');
    const summaryFields = summarySection?.config?.summaryFields || [];

    for (const field of summaryFields) {
      const value = summary[field.id];
      if (value !== undefined) {
        const row = worksheet.addRow([field.label, this.formatValue(value, field.format)]);

        // 應用數字格式
        if (field.format === 'currency') {
          row.getCell(2).numFmt = NumberFormats.CURRENCY;
        } else if (field.format === 'percentage') {
          row.getCell(2).numFmt = NumberFormats.PERCENTAGE;
        } else if (field.format === 'decimal:2') {
          row.getCell(2).numFmt = NumberFormats.DECIMAL_2;
        }
      }
    }

    // 設置列寬
    worksheet.columns = [
      { width: 30 }, // Metric column
      { width: 20 }, // Value column
    ];

    // 添加邊框
    const lastRow = worksheet.lastRow?.number || 1;
    addBorders(worksheet, 3, 1, lastRow, 2);
  }

  private async addDataSheet(
    workbook: Workbook,
    section: ValidatedSectionConfig,
    data: Record<string, unknown>[],
    config: ReportConfig
  ): Promise<void> {
    // 使用簡短的工作表名稱（Excel 限制 31 字符）
    const sheetName =
      section.title.length > 31 ? section.title.substring(0, 28) + '...' : section.title;

    const worksheet = workbook.addWorksheet(sheetName);

    if (!data || data.length === 0) {
      // 添加空數據提示
      const titleRow = worksheet.addRow([section.title]);
      titleRow.font = { size: 14, bold: true };
      worksheet.addRow([]);
      worksheet.addRow(['No data available']);
      return;
    }

    const columns = section.config?.columns ? 
      section.config.columns.map(col => validateColumnConfig(col)) : 
      this.inferColumns(data[0]);

    // 標題行
    const titleRow = worksheet.addRow([section.title]);
    titleRow.font = { size: 14, bold: true };
    titleRow.height = 25;
    worksheet.mergeCells(`A1:${String.fromCharCode(65 + columns.length - 1)}1`);
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // 空行
    worksheet.addRow([]);

    // 設置列配置
    worksheet.columns = columns.map((col: Record<string, unknown>) => ({
      header: col.label,
      key: col.id,
      width: col.width ? col.width / 7 : 15, // 轉換為 ExcelJS 寬度
    }));

    // 數據行
    data.forEach(item => {
      const rowData: DatabaseRecord = {};
      columns.forEach((col: any) => {
        rowData[col.id] = this.formatValue(item[col.id], col.format || col.type);
      });
      worksheet.addRow(rowData);
    });

    // 添加統計行（如果需要）
    if (section.config?.showTotals) {
      worksheet.addRow([]); // 空行
      const totalsRow = this.calculateTotals(data, columns);
      const totalRowNum = worksheet.addRow(totalsRow);
      totalRowNum.font = { bold: true };
      totalRowNum.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' },
        };
      });
    }

    // 應用樣式
    this.applyStyles(worksheet, columns, config);

    // 設置標題行樣式
    const headerRowNum = 3; // 標題在第3行
    const headerRow = worksheet.getRow(headerRowNum);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 25;

    // 添加邊框
    const lastRow = worksheet.lastRow?.number || 1;
    const lastCol = columns.length;
    addBorders(worksheet, headerRowNum, 1, lastRow, lastCol);
  }

  private async addMetadataSheet(
    workbook: Workbook,
    metadata: { generatedAt: string; filters: Record<string, unknown>; recordCount: number },
    config: ReportConfig
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Info');

    // 標題
    const titleRow = worksheet.addRow(['Report Information']);
    titleRow.font = { size: 16, bold: true };
    titleRow.height = 30;
    worksheet.mergeCells('A1:B1');
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);

    // 基本信息
    worksheet.addRow(['Report Name', config.name]);
    worksheet.addRow(['Report ID', config.id]);
    worksheet.addRow(['Generated At', new Date(metadata.generatedAt).toLocaleString()]);
    worksheet.addRow(['Total Records', metadata.recordCount]);

    worksheet.addRow([]);

    // 過濾器信息
    const filterHeaderRow = worksheet.addRow(['Applied Filters']);
    filterHeaderRow.font = { size: 14, bold: true };
    worksheet.mergeCells(`A${filterHeaderRow.number}:B${filterHeaderRow.number}`);

    const filterTitleRow = worksheet.addRow(['Filter', 'Value']);
    filterTitleRow.font = { bold: true };
    filterTitleRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    });

    // 添加過濾器值
    for (const [key, value] of Object.entries(metadata.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const filterConfig = config.filters.find(f => f.id === key);
        const label = filterConfig?.label || key;
        worksheet.addRow([label, String(value)]);
      }
    }

    // 設置列寬
    worksheet.columns = [{ width: 20 }, { width: 40 }];

    // 添加邊框到過濾器部分
    const lastRow = worksheet.lastRow?.number || 1;
    const filterStartRow = filterTitleRow.number;
    addBorders(worksheet, filterStartRow, 1, lastRow, 2);
  }

  private applyStyles(worksheet: Worksheet, columns: ValidatedColumnConfig[], config: ValidatedReportConfig): void {
    // 應用列格式
    columns.forEach((col: ValidatedColumnConfig, index: number) => {
      const colNum = index + 1;

      if (col.format === 'currency' || col.type === 'currency') {
        setNumberFormat(worksheet, colNum, NumberFormats.CURRENCY);
      } else if (col.format === 'percentage') {
        setNumberFormat(worksheet, colNum, NumberFormats.PERCENTAGE);
      } else if (col.format === 'decimal:2') {
        setNumberFormat(worksheet, colNum, NumberFormats.DECIMAL_2);
      } else if (col.format === 'date' || col.type === 'date') {
        setNumberFormat(worksheet, colNum, NumberFormats.DATE);
      }
    });

    // 應用自定義樣式（如果配置中有）
    const styleConfig = config.styleOverrides?.excel;
    if (styleConfig) {
      // 可以根據配置應用更多樣式
    }
  }

  private inferColumns(dataItem: Record<string, unknown>): ValidatedColumnConfig[] {
    return Object.keys(dataItem).map(key => validateColumnConfig({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: typeof dataItem[key] === 'number' ? 'number' : 'text',
    }));
  }

  private formatValue(value: unknown, format?: string): string | number | Date {
    if (value === null || value === undefined) {
      return '';
    }

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
      case 'percentage':
      case 'number':
        return Number(value);
      case 'decimal:2':
        return Math.round(Number(value) * 100) / 100;
      default:
        return value;
    }
  }

  private calculateTotals(data: Record<string, unknown>[], columns: ValidatedColumnConfig[]): (string | number | unknown)[] {
    const totals: DatabaseRecord = { [columns[0].id]: 'Total' };

    for (let i = 1; i < columns.length; i++) {
      const col = columns[i];
      if (col.type === 'number' || col.type === 'currency') {
        const sum = data.reduce((acc, item) => acc + (Number(item[col.id]) || 0), 0);
        totals[col.id] = sum;
      } else {
        totals[col.id] = '';
      }
    }

    // 轉換為數組格式
    return columns.map(col => totals[col.id]);
  }
}
