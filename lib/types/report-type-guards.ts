/**
 * 報表系統類型守衛 - 重新導出版本
 * 策略 4: Unknown + Type Narrowing
 * 
 * 此檔案現在重新導出 types/external/report-type-guards.ts 的所有功能
 * 以保持向後相容性並避免重複代碼
 */

// 重新導出基本類型守衛
export {
  isString,
  isNumber,
  isBoolean,
  isDate,
  isArray,
  isObject,
} from '../../types/external/report-type-guards';

// 重新導出報表相關類型和守衛
export type {
  ReportData,
  AcoOrderReportItem,
  GrnReportItem,
  StockReportItem,
  TransactionReportItem,
  ReportFilter,
  ReportConfig,
  ReportColumn,
  ReportSorting,
  ReportPagination,
} from '../../types/external/report-type-guards';

export {
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
} from '../../types/external/report-type-guards';

// 重新導出數據驗證助手函數
export {
  validateReportData,
  safeParseNumber,
  safeParseDate,
  safeParseString,
} from '../../types/external/report-type-guards';

// 重新導出增強的安全轉換函數
export {
  toSafeString,
  toSafeNumber,
  toSafeBoolean,
} from '../../types/external/report-type-guards';

// 重新導出專門的安全類型介面和轉換函數
export type {
  SafeOrderData,
  SafeDetailData,
  SafeUserData,
  SafeProductData,
  SafeReportData,
  SafePageData,
} from '../../types/external/report-type-guards';

export {
  toSafeOrderData,
  toSafeDetailData,
  toSafeUserData,
  toSafeProductData,
  toSafeReportData,
  toSafePageData,
} from '../../types/external/report-type-guards';

// 重新導出泛型類型守衛和增強的屬性訪問
export {
  withTypeGuard,
  safeGet,
} from '../../types/external/report-type-guards';