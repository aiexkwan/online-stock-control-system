/**
 * ExcelJS 動態導入包裝器
 * 用於統一處理 ExcelJS 的動態載入
 */

// Cache the ExcelJS import to avoid multiple imports
let ExcelJSModule: typeof import('exceljs') | null = null;

export async function getExcelJS(): Promise<typeof import('exceljs')> {
  if (!ExcelJSModule) {
    ExcelJSModule = await import('exceljs');
  }
  return ExcelJSModule;
}

// 創建一個更安全的工廠函數，直接返回 Workbook 實例
export async function createWorkbook(): Promise<import('exceljs').Workbook> {
  const ExcelJS = await getExcelJS();
  return new ExcelJS.Workbook();
}

// 創建一個工廠函數來獲取 ExcelJS 類別
export async function getExcelJSClasses() {
  const ExcelJS = await getExcelJS();
  return {
    Workbook: ExcelJS.Workbook,
    ExcelJS,
  };
}

// Re-export commonly used types for TypeScript support
export type {
  Workbook,
  Worksheet,
  Column,
  Row,
  Cell,
  Style,
  BorderStyle,
  Alignment,
  CellValue,
  FillPattern,
  Font,
  Border,
} from 'exceljs';
