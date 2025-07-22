import type { Workbook, Worksheet, Style, BorderStyle } from './exceljs-dynamic';
import { getExcelJS } from './exceljs-dynamic';

/**
 * ExcelJS 遷移輔助函數
 * 提供從 xlsx 到 ExcelJS 嘅常用轉換功能
 */

export interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
  style?: Partial<Style>;
}

/**
 * 將數據陣列轉換為 ExcelJS 工作表
 */
export async function jsonToWorksheet(
  workbook: Workbook,
  data: Record<string, unknown>[],
  sheetName: string,
  columns?: ColumnConfig[]
): Promise<Worksheet> {
  const worksheet = workbook.addWorksheet(sheetName);

  if (columns) {
    // 設置列配置
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // 應用列樣式
    columns.forEach((col, index) => {
      if (col.style) {
        const column = worksheet.getColumn(index + 1);
        column.eachCell({ includeEmpty: false }, cell => {
          Object.assign(cell, col.style);
        });
      }
    });
  } else if (data.length > 0) {
    // 自動從數據生成列
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map(key => ({
      header: key,
      key: key,
      width: 15,
    }));
  }

  // 添加數據
  data.forEach(row => {
    worksheet.addRow(row);
  });

  return worksheet;
}

/**
 * 設置標題樣式
 */
export function setHeaderStyle(
  worksheet: Worksheet,
  options: {
    fontSize?: number;
    bold?: boolean;
    bgColor?: string;
    textColor?: string;
    height?: number;
  } = {}
): void {
  const headerRow = worksheet.getRow(1);

  headerRow.font = {
    size: options.fontSize || 12,
    bold: options.bold !== false,
    color: options.textColor ? { argb: options.textColor } : undefined,
  };

  headerRow.alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };

  if (options.bgColor) {
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: options.bgColor },
      };
    });
  }

  if (options.height) {
    headerRow.height = options.height;
  }
}

/**
 * 添加邊框到範圍
 */
export function addBorders(
  worksheet: Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  style: BorderStyle = 'thin'
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style },
        left: { style },
        bottom: { style },
        right: { style },
      };
    }
  }
}

/**
 * 合併儲存格
 */
export function mergeCells(
  worksheet: Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): void {
  worksheet.mergeCells(startRow, startCol, endRow, endCol);
}

/**
 * 自動調整列寬
 */
export function autoFitColumns(
  worksheet: Worksheet,
  minWidth: number = 10,
  maxWidth: number = 50
): void {
  worksheet.columns.forEach(column => {
    if (!column) return;

    let maxLength = 0;

    if (column?.eachCell) {
      column.eachCell({ includeEmpty: false }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });

      column.width = Math.max(minWidth, Math.min(maxLength + 2, maxWidth));
    }
  });
}

/**
 * 設置數字格式
 */
export function setNumberFormat(worksheet: Worksheet, columnIndex: number, format: string): void {
  const column = worksheet.getColumn(columnIndex);
  if (column) {
    column.numFmt = format;
  }
}

/**
 * 常用數字格式
 */
export const NumberFormats = {
  INTEGER: '0',
  DECIMAL_2: '0.00',
  PERCENTAGE: '0%',
  CURRENCY: '$#,##0.00',
  DATE: 'yyyy-mm-dd',
  DATETIME: 'yyyy-mm-dd hh:mm:ss',
};

/**
 * 創建帶樣式嘅報表
 */
export async function createStyledReport(
  data: Record<string, unknown>[],
  title: string,
  columns?: ColumnConfig[]
): Promise<Buffer> {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();

  // 設置工作簿屬性
  workbook.creator = 'NewPennine WMS';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = await jsonToWorksheet(workbook, data, title, columns);

  // 應用預設樣式
  setHeaderStyle(worksheet, {
    bold: true,
    bgColor: 'FFE0E0E0',
    height: 25,
  });

  // 添加邊框
  const rowCount = worksheet.rowCount;
  const colCount = worksheet.columnCount;
  if (rowCount > 0 && colCount > 0) {
    addBorders(worksheet, 1, 1, rowCount, colCount);
  }

  // 自動調整列寬
  autoFitColumns(worksheet);

  // 返回 buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 從 xlsx 列寬轉換到 ExcelJS 列寬
 * xlsx 使用字符寬度 (wch)，ExcelJS 使用像素寬度
 */
export function convertColumnWidth(xlsxWidth: number): number {
  // 大約轉換比例：1 字符寬度 ≈ 7 像素
  return Math.round(xlsxWidth * 7);
}

/**
 * 處理合併儲存格配置
 */
export function applyMerges(
  worksheet: Worksheet,
  merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>
): void {
  merges.forEach(merge => {
    worksheet.mergeCells(
      merge.s.r + 1, // ExcelJS 使用 1-based 索引
      merge.s.c + 1,
      merge.e.r + 1,
      merge.e.c + 1
    );
  });
}
