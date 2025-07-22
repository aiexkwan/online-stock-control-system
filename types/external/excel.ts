/**
 * Excel 相關類型定義 (ExcelJS)
 */

// Excel 對齊類型
export interface ExcelAlignment {
  horizontal?:
    | 'left'
    | 'center'
    | 'right'
    | 'fill'
    | 'justify'
    | 'centerContinuous'
    | 'distributed';
  vertical?: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
  wrapText?: boolean;
  shrinkToFit?: boolean;
  indent?: number;
  readingOrder?: 'rtl' | 'ltr';
  textRotation?: number;
}

// Excel 邊框類型
export interface ExcelBorder {
  top?: ExcelBorderStyle;
  left?: ExcelBorderStyle;
  bottom?: ExcelBorderStyle;
  right?: ExcelBorderStyle;
  diagonal?: ExcelBorderStyle;
}

export interface ExcelBorderStyle {
  style:
    | 'thin'
    | 'medium'
    | 'thick'
    | 'dotted'
    | 'hair'
    | 'dashed'
    | 'mediumDashed'
    | 'dashDot'
    | 'mediumDashDot'
    | 'dashDotDot'
    | 'mediumDashDotDot'
    | 'slantDashDot'
    | 'double';
  color?: ExcelColor;
}

// Excel 字體類型
export interface ExcelFont {
  name?: string;
  family?: number;
  scheme?: 'minor' | 'major' | 'none';
  charset?: number;
  size?: number;
  color?: ExcelColor;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
  strike?: boolean;
  outline?: boolean;
  vertAlign?: 'superscript' | 'subscript';
}

// Excel 填充類型
export interface ExcelFill {
  type: 'pattern' | 'gradient';
  pattern?:
    | 'none'
    | 'solid'
    | 'darkGray'
    | 'mediumGray'
    | 'lightGray'
    | 'gray125'
    | 'gray0625'
    | 'darkHorizontal'
    | 'darkVertical'
    | 'darkDown'
    | 'darkUp'
    | 'darkGrid'
    | 'darkTrellis'
    | 'lightHorizontal'
    | 'lightVertical'
    | 'lightDown'
    | 'lightUp'
    | 'lightGrid'
    | 'lightTrellis';
  fgColor?: ExcelColor;
  bgColor?: ExcelColor;
  gradient?: 'angle' | 'path';
  degree?: number;
  center?: ExcelPosition;
  stops?: ExcelGradientStop[];
}

export interface ExcelColor {
  argb?: string;
  rgb?: string;
  theme?: number;
  tint?: number;
  index?: number;
}

export interface ExcelPosition {
  x: number;
  y: number;
}

export interface ExcelGradientStop {
  position: number;
  color: ExcelColor;
}

// Excel 頁面設置
export interface ExcelPageSetup {
  margins?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    header?: number;
    footer?: number;
  };
  orientation?: 'portrait' | 'landscape';
  paperSize?: number;
  scale?: number;
  fitToPage?: boolean;
  fitToWidth?: number;
  fitToHeight?: number;
  printArea?: string;
  printTitlesRow?: string;
  printTitlesColumn?: string;
  showRowColHeaders?: boolean;
  showGridLines?: boolean;
  firstPageNumber?: number;
  horizontalDpi?: number;
  verticalDpi?: number;
  blackAndWhite?: boolean;
  draft?: boolean;
  cellComments?: 'none' | 'asDisplayed' | 'atEnd';
  errors?: 'displayed' | 'blank' | 'dash' | 'NA';
  horizontalCentered?: boolean;
  verticalCentered?: boolean;
}

// Excel 工作表保護
export interface ExcelWorksheetProtection {
  password?: string;
  sheet?: boolean;
  objects?: boolean;
  scenarios?: boolean;
  selectLockedCells?: boolean;
  selectUnlockedCells?: boolean;
  formatCells?: boolean;
  formatColumns?: boolean;
  formatRows?: boolean;
  insertColumns?: boolean;
  insertRows?: boolean;
  insertHyperlinks?: boolean;
  deleteColumns?: boolean;
  deleteRows?: boolean;
  sort?: boolean;
  autoFilter?: boolean;
  pivotTables?: boolean;
}

// Excel 列定義
export interface ExcelColumn {
  header?: string;
  key?: string;
  width?: number;
  style?: ExcelCellStyle;
  hidden?: boolean;
  outlineLevel?: number;
}

export interface ExcelCellStyle {
  numFmt?: string;
  font?: ExcelFont;
  alignment?: ExcelAlignment;
  border?: ExcelBorder;
  fill?: ExcelFill;
  protection?: {
    locked?: boolean;
    hidden?: boolean;
  };
}

// Excel 數據驗證
export interface ExcelDataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'time' | 'textLength' | 'custom';
  operator?:
    | 'between'
    | 'notBetween'
    | 'equal'
    | 'notEqual'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual';
  formula1?: string;
  formula2?: string;
  showErrorMessage?: boolean;
  errorStyle?: 'stop' | 'warning' | 'information';
  errorTitle?: string;
  error?: string;
  showInputMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
}

// 報表生成配置
export interface ReportConfig {
  title: string;
  filename: string;
  author?: string;
  subject?: string;
  keywords?: string;
  category?: string;
  description?: string;
  created?: Date;
  modified?: Date;
  lastModifiedBy?: string;
  company?: string;
  manager?: string;
}
