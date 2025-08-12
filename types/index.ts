/**
 * 統一類型導出文件
 * 統一管理整個應用的 TypeScript 類型定義
 * 使用具名導出避免重複定義衝突
 */

// 核心類型 - 優先導出避免循環依賴
export * from './core';

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
  isAlertLevel,
  isAlertCondition,
  safeAlertLevel,
  safeAlertCondition,
} from './database/helpers';

// AlertLevel 和 AlertCondition 從 @/lib/alerts/types 導入

// 認證類型
export type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  User,
  AuthResponse,
  ApiError,
  ValidationError,
  AuthError,
  Session,
  TokenPayload,
} from './auth/credentials';

// API 類型
export type {
  BaseResponse,
  ErrorResponse,
  ValidationErrorResponse,
  ProductResponse,
  OrderResponse,
  StockResponse,
  ReportResponse,
  PrintResponse,
  HealthCheckResponse,
  AcoOrderUpdateResponse,
  RpcResponse,
  MonitoringResponse,
  WarehouseWorkLevelResponse,
  WarehouseWorkLevelError,
  WarehouseWorkLevelResult,
} from './api/response';

// 業務邏輯類型
export type { VoidReason, VoidRecord, VoidReportFilters } from './business/schemas';

// 外部庫類型
export type {
  ResponsiveContainerProps,
  TooltipProps,
  ChartElementProps,
  BaseChartProps,
} from './external/recharts';

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
  AlertConfig,
  InventoryForecast,
} from './external/inventory-analysis';

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
} from './external/report-type-guards';

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
} from './external/unknown-handlers';

// API 響應處理器
export { ApiResponseHandler } from './api/handlers';

// 供應商類型和 RPC 響應類型
export type {
  SupplierInfo,
  DatabaseSupplierInfo,
  SupplierData,
  RpcSearchSupplierResponse,
  RpcSupplierMutationResponse,
} from './business/supplier';
export {
  convertDatabaseSupplierInfo,
  convertToDatabase,
  isValidSupplierInfoLegacy as isValidSupplierInfo,
  isRpcSearchSupplierResponse,
  isRpcSupplierMutationResponse,
  isSupplierData,
  assertRpcSearchSupplierResponse,
  assertRpcSupplierMutationResponse,
  getSupplierCode,
  getSupplierName,
  getSupplierAddress,
  createEmptySupplierInfo,
  isValidSupplierCode,
  normalizeSupplierCode,
} from './business/supplier';

// Context Types
export type { DialogType, DialogData, DialogContextType, DialogHookResult } from './contexts';

// Constants Types
export type {
  PalletWeights,
  PackageWeights,
  SystemLimits,
  LabelModes,
  PalletTypeOption,
  PackageTypeOption,
  PalletTypeKey,
  PackageTypeKey,
  LabelMode,
} from './constants';

// Configuration Types
export type {
  ActiveTheme,
  ThemeMapping,
  ThemeDisplayNames,
  ThemeDescriptions,
  ABTestingControls,
  DualRunControls,
  OptimizationControls,
  MigrationControls,
  RegistryControls,
  TestControlsUnion,
  TestCategory,
  TestConfig,
  TestCategoryConfig,
} from './config';

// Utility Types
// Note: Performance types temporarily disabled pending utils module completion
// export type {
//   PerformanceStatus,
//   PerformanceResult,
//   PerformanceSummary,
//   PerformanceReport,
//   PerformanceComparison,
// } from './utils';

// Hook Types
export type {
  AuthState,
  UserRole,
  PerformanceMetrics,
  ABTestConfiguration,
  PerformanceContext,
  RealtimeMetrics,
  UseWidgetPerformanceTrackingOptions,
  ErrorSeverity,
  ErrorType,
  ErrorMetrics,
  UseWidgetPerformanceTrackingResult,
  ReportType,
  ExportFormat,
  UsePerformanceReportsResult,
  UseRealtimePerformanceMonitorResult,
} from './hooks';

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
} from './business/schemas';

export type {
  ErrorState,
} from './core/common';

export type {
  SearchResult,
} from '../lib/types/index';
