import { DatabaseRecord } from '@/types/database/tables';

/**
 * 統一報表框架配置介面
 * 注意：此框架僅用於報表生成，不包括標籤生成（QC/GRN labels）
 * 標籤生成保持現有獨立實現以確保格式不變
 */

// 報表配置主介面
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'inventory' | 'financial' | 'quality';
  formats: ReportFormat[];
  defaultFormat: ReportFormat;
  filters: FilterConfig[];
  sections: SectionConfig[];
  permissions?: string[];
  // 報表特定的樣式配置，確保向後兼容
  styleOverrides?: ReportStyleOverrides;
}

// 支援的報表格式
export type ReportFormat = 'pdf' | 'excel' | 'csv';

// 過濾器配置
export interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text' | 'number';
  required: boolean;
  defaultValue?: string | number | boolean | string[];
  placeholder?: string;
  options?: SelectOption[];
  // 動態數據源（如從數據庫獲取選項）
  dataSource?: {
    type: 'rpc' | 'table';
    name: string;
    params?: Record<string, string | number | boolean>;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 選項介面
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// 報表區段配置
export interface SectionConfig {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'custom';
  dataSource: string;
  // 在某些格式中隱藏此區段
  hideInFormats?: ReportFormat[];
  // 區段特定配置
  config?: {
    columns?: ColumnConfig[];
    summaryFields?: SummaryFieldConfig[];
    chartConfig?: ChartConfig;
    customComponent?: string;
    // 保持現有報表的樣式
    legacyStyles?: boolean;
  };
}

// 表格列配置
export interface ColumnConfig {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string; // 格式化模板
  sortable?: boolean;
  exportOnly?: boolean; // 只在導出時顯示
}

// 摘要欄位配置
export interface SummaryFieldConfig {
  id: string;
  label: string;
  type: 'count' | 'sum' | 'average' | 'min' | 'max' | 'custom';
  field?: string;
  format?: string;
  customCalculation?: string;
}

// 圖表配置
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  xAxis: string;
  yAxis: string | string[];
  options?: Record<string, unknown>;
}

// ExcelJS 樣式接口定義
export interface ExcelCellStyle {
  font?: {
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: { argb?: string; rgb?: string };
    name?: string;
  };
  fill?: {
    type: 'pattern';
    pattern: 'solid' | 'darkGray' | 'mediumGray' | 'lightGray';
    fgColor?: { argb?: string; rgb?: string };
    bgColor?: { argb?: string; rgb?: string };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
  };
  border?: {
    top?: { style: 'thin' | 'medium' | 'thick'; color?: { argb?: string } };
    left?: { style: 'thin' | 'medium' | 'thick'; color?: { argb?: string } };
    bottom?: { style: 'thin' | 'medium' | 'thick'; color?: { argb?: string } };
    right?: { style: 'thin' | 'medium' | 'thick'; color?: { argb?: string } };
  };
  numFmt?: string;
}

// 樣式覆蓋配置（確保現有報表外觀不變）
export interface ReportStyleOverrides {
  pdf?: {
    fontSize?: number;
    fontFamily?: string;
    margins?: { top: number; right: number; bottom: number; left: number };
    headerHeight?: number;
    footerHeight?: number;
    // 保留原有報表的特定樣式
    useLegacyStyles?: boolean;
  };
  excel?: {
    headerStyle?: ExcelCellStyle;
    dataStyle?: ExcelCellStyle;
    summaryStyle?: ExcelCellStyle;
  };
}

// 過濾器值
export type FilterValues = Record<string, string | number | boolean | string[] | Date>;

// 處理後的數據結構
export interface ProcessedReportData {
  metadata: {
    generatedAt: string;
    filters: FilterValues;
    recordCount: number;
  };
  sections: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

// 數據源介面
export interface ReportDataSource {
  id: string;
  fetch(filters: FilterValues): Promise<DatabaseRecord[]>;
  transform?(data: DatabaseRecord[]): unknown;
  validate?(data: DatabaseRecord[]): boolean;
}

// 報表生成器介面
export interface ReportGenerator {
  format: ReportFormat;
  generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob>;
  // 確保與現有報表兼容
  supportLegacyMode?: boolean;
}

// 報表註冊資訊
export interface RegisteredReport {
  config: ReportConfig;
  dataSources: Map<string, ReportDataSource>;
  generators?: Map<ReportFormat, ReportGenerator>;
}
