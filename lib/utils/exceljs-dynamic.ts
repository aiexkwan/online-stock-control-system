/**
 * ExcelJS 動態導入包裝器
 * 用於統一處理 ExcelJS 的動態載入
 */

// Cache the ExcelJS import to avoid multiple imports
let ExcelJSModule: typeof import('exceljs') | null = null;

export async function getExcelJS() {
  if (!ExcelJSModule) {
    ExcelJSModule = await import('exceljs');
  }
  return ExcelJSModule;
}

// Re-export commonly used types for TypeScript support
export type { Workbook, Worksheet, Column, Row, Cell, Style, BorderStyle, Alignment } from 'exceljs';