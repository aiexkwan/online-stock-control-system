/**
 * PDF 相關類型定義
 */

// PDF 生成選項
export interface PdfGenerationOptions {
  format?: PdfFormat;
  orientation?: 'portrait' | 'landscape';
  width?: string | number;
  height?: string | number;
  margin?: PdfMargin;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  preferCSSPageSize?: boolean;
  scale?: number;
  quality?: number;
  omitBackground?: boolean;
}

export type PdfFormat =
  | 'A0'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Ledger';

export interface PdfMargin {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}

// PDF 標籤生成類型
export interface LabelPdfConfig {
  template: LabelTemplate;
  data: LabelData[];
  options?: PdfGenerationOptions;
}

export interface LabelTemplate {
  name: string;
  width: number;
  height: number;
  margin: PdfMargin;
  columns: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  horizontalGap: number;
  verticalGap: number;
}

export interface LabelData {
  productCode: string;
  productName?: string;
  barcode?: string;
  qrCode?: string;
  quantity?: number;
  unit?: string;
  date?: string;
  operator?: string;
  location?: string;
  customFields?: Record<string, string>;
}

// PDF 報表類型
export interface ReportPdfConfig {
  type: ReportType;
  title: string;
  subtitle?: string;
  author?: string;
  data: unknown;
  template?: string;
  options?: PdfGenerationOptions;
}

export enum ReportType {
  ACO_ORDER = 'aco_order',
  GRN = 'grn',
  TRANSACTION = 'transaction',
  STOCK_TAKE = 'stock_take',
  VOID_PALLET = 'void_pallet',
  CUSTOM = 'custom',
}

// PDF 樣式類型
export interface PdfStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify';
  lineHeight?: number;
  letterSpacing?: string;
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

// PDF 表格類型
export interface PdfTable {
  headers: string[];
  rows: (string | number)[][];
  style?: PdfTableStyle;
}

export interface PdfTableStyle {
  width?: string | number;
  border?: string;
  borderCollapse?: 'separate' | 'collapse';
  headerStyle?: PdfStyle;
  rowStyle?: PdfStyle;
  alternateRowStyle?: PdfStyle;
  cellPadding?: string | number;
  cellSpacing?: string | number;
}

// PDF 圖表類型
export interface PdfChart {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: ChartData[];
  width: number;
  height: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// PDF 二維碼/條碼類型
export interface BarcodeConfig {
  type: 'qr' | 'code128' | 'code39' | 'ean13' | 'ean8' | 'upc';
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
}

// PDF 生成結果
export interface PdfGenerationResult {
  success: boolean;
  buffer?: Buffer;
  base64?: string;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
  generatedAt: string;
}
