/**
 * 統一類型導出文件
 * 統一管理整個應用的 TypeScript 類型定義
 * 使用具名導出避免重複定義衝突
 */

// 核心類型 - 移除不存在的 core 導出

// 數據庫類型
export type { Database } from './database/supabase';
export type { SupabaseResponse, QueryOptions } from './database/helpers';
export {
  safeGet,
  safeString,
  safeNumber,
  safeBoolean,
  safeDate,
  toRecord,
  isRecord,
  hasProperty,
  handleSupabaseError,
  batchProcess,
  validateRequired,
  toRecordArray,
  toSupabaseResponse,
  extractCount,
} from './database/helpers';

// Alert types removed during cleanup (2025-08-13) - system deprecated for security

// 認證類型 - 已遷移到其他模塊

// API 類型 - 基礎類型已刪除，請使用 lib/types/api
// export type {
//   BaseResponse,
//   ErrorResponse,
//   ValidationErrorResponse,
// } from './api/response'; // 已刪除

// 暫時保留的業務響應類型
export type {
  ProductResponse,
  OrderResponse,
  StockResponse,
  ReportResponse,
} from '@/lib/types/api-legacy';

// 從新位置導出
export type { AcoOrderUpdateResponse } from '@/lib/types/aco-order';
export type {
  WarehouseWorkLevelResponse,
  WarehouseWorkLevelError,
  WarehouseWorkLevelResult,
} from '@/lib/types/warehouse-work-level';

// 業務邏輯類型 - 從 lib/types 導入
export type { VoidReason, VoidRecord, VoidReportFilters } from '@/lib/types/business-schemas';
// SupplierInfo 和 DatabaseSupplierInfo 在下方統一導出

// 外部庫類型 - recharts types temporarily disabled (file missing)
// export type {
//   ResponsiveContainerProps,
//   TooltipProps,
//   ChartElementProps,
//   BaseChartProps,
// } from './external/recharts';

// 庫存分析類型
export type {
  InventoryItem,
  InventoryAnalysis,
  CategoryAnalysis,
  LocationAnalysis,
  TopProduct,
  LowStockItem,
  ExpiringItem,
  DeadStockItem,
  TurnoverRate,
  InventoryMovement,
  StockLevel,
  InventoryReport,
  ABC_Analysis,
  ABCProduct,
  InventoryFilters,
  InventoryAlertConfig,
  InventoryForecast,
} from '../lib/types/inventory-analysis';

// Excel 類型
export type {
  ExcelAlignment,
  ExcelBorder,
  ExcelBorderStyle,
  ExcelFont,
  ExcelFill,
  ExcelColor,
  ExcelPosition,
  ExcelGradientStop,
  ExcelPageSetup,
  ExcelWorksheetProtection,
  ExcelColumn,
  ExcelCellStyle,
  ExcelDataValidation,
  ReportConfig,
} from '../lib/types/excel';

// PDF 類型
export type {
  PdfGenerationOptions,
  PdfFormat,
  PdfMargin,
  LabelPdfConfig,
  LabelTemplate,
  LabelData,
  ReportPdfConfig,
  ReportType,
  PdfStyle,
  PdfTable,
  PdfTableStyle,
  PdfChart,
  ChartData,
  BarcodeConfig,
  PdfGenerationResult,
} from '../lib/types/pdf';

// 報表類型守衛 - 重新命名避免衝突
export {
  isString as isStringType,
  isNumber as isNumberType,
  isBoolean as isBooleanType,
  isDate as isDateType,
  isArray as isArrayType,
  isObject as isObjectType,
  isReportData,
  isAcoOrderReportItem,
  isGrnReportItem,
  isStockReportItem,
  isTransactionReportItem,
  isReportFilter,
  isReportColumn,
  isReportSorting,
  isReportPagination,
  isReportConfig,
  validateReportData,
  safeParseNumber,
  safeParseDate,
  safeParseString,
} from '../lib/types/report-type-guards';

// 未知類型處理器 - 重新命名避免衝突
export {
  isNull,
  isUndefined,
  isNullish,
  isPrimitive,
  isFunction,
  isSymbol,
  isBigInt,
  isPlainObject,
  isEmptyObject,
  hasOwnProperty as hasOwnPropertySafe,
  isNonEmptyArray,
  isArrayOf,
  toSafeString,
  toSafeNumber,
  toSafeBoolean,
  toSafeArray,
  toSafeObject,
  deepClone,
  deepEquals,
  safeExecute,
  safeAsync,
  safeJsonParse,
  safeJsonStringify,
  safeGet as safeGetProperty,
  safeSet,
  unique,
  groupBy,
  assertIsString,
  assertIsNumber,
  assertIsObject,
  assertIsArray,
} from '../lib/types/unknown-handlers';

// API 響應處理器 - 現在從 lib/types 導入
export { ApiResponseHandler } from '@/lib/types/api-response-handlers';

// 供應商類型和 RPC 響應類型 - 從 lib/types 導入
export type {
  SupplierInfo,
  DatabaseSupplierInfo,
} from '@/lib/types/supplier-types';
export {
  convertDatabaseSupplierInfo,
} from '@/lib/types/supplier-types';

// Context Types - Migrated to /lib/dialog-system
// Legacy exports for backward compatibility (deprecated)
export type { 
  BusinessDialogType as DialogType, 
  BusinessDialogData as DialogData, 
  BusinessDialogContextType as DialogContextType, 
  BusinessDialogHookResult as DialogHookResult 
} from '@/lib/dialog-system/business/types';

// Constants Types - Migrated to /lib/types/grn.ts
// GRN-related types are now imported directly from @/lib/types/grn

// Configuration Types - REMOVED (types/config directory cleaned up)
// Previously exported unused types: ActiveTheme, ThemeMapping, TestConfig, etc.
// These types were not used anywhere in the codebase and have been safely removed.

// Utility Types
// Note: Performance types temporarily disabled pending utils module completion
// export type {
//   PerformanceStatus,
//   PerformanceResult,
//   PerformanceSummary,
//   PerformanceReport,
//   PerformanceComparison,
// } from './utils';

// Hook Types - Now imported from lib/types
export type {
  AuthState,
  UserRole,
} from '@/lib/types/auth';

// Domain Types - Only export types that actually exist
export type {
  SearchType,
  ErrorType as VoidErrorType,
} from './domains';

// Import types from correct locations
export type {
  PalletInfo,
  VoidParams,
  VoidResult,
} from '../app/(app)/admin/types/data-management';

export type {
  HistoryRecord,
} from '@/lib/types/business-schemas';

export type {
  ErrorState,
} from '../lib/error-handling/types';

// SearchResult export removed - type not found in lib/types
// export type {
//   SearchResult,
// } from '@/lib/types';
