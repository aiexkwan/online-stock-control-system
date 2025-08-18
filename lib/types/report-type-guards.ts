/**
 * 報表類型守衛函數
 * 提供類型安全的報表數據驗證
 */

// 基本類型守衛
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// 報表相關類型守衛
export interface ReportData {
  id: string;
  type: string;
  title: string;
  data: unknown[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function isReportData(value: unknown): value is ReportData {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.type) &&
    isString(value.title) &&
    isArray(value.data) &&
    isString(value.createdAt) &&
    (value.metadata === undefined || isObject(value.metadata))
  );
}

// ACO 訂單報表類型守衛
export interface AcoOrderReportItem {
  order_ref: number;
  product_code: string;
  qty_per_lot: number;
  order_qty: number;
  order_comp_date?: string;
  supplier?: string;
}

export function isAcoOrderReportItem(value: unknown): value is AcoOrderReportItem {
  if (!isObject(value)) return false;

  return (
    isNumber(value.order_ref) &&
    isString(value.product_code) &&
    isNumber(value.qty_per_lot) &&
    isNumber(value.order_qty) &&
    (value.order_comp_date === undefined || isString(value.order_comp_date)) &&
    (value.supplier === undefined || isString(value.supplier))
  );
}

// GRN 報表類型守衛
export interface GrnReportItem {
  grn_ref: string;
  material_code: string;
  supplier: string;
  received_qty: number;
  received_date: string;
  batch?: string;
}

export function isGrnReportItem(value: unknown): value is GrnReportItem {
  if (!isObject(value)) return false;

  return (
    isString(value.grn_ref) &&
    isString(value.material_code) &&
    isString(value.supplier) &&
    isNumber(value.received_qty) &&
    isString(value.received_date) &&
    (value.batch === undefined || isString(value.batch))
  );
}

// 庫存報表類型守衛
export interface StockReportItem {
  product_code: string;
  location: string;
  quantity: number;
  reserved_qty?: number;
  available_qty?: number;
  last_updated: string;
}

export function isStockReportItem(value: unknown): value is StockReportItem {
  if (!isObject(value)) return false;

  return (
    isString(value.product_code) &&
    isString(value.location) &&
    isNumber(value.quantity) &&
    isString(value.last_updated) &&
    (value.reserved_qty === undefined || isNumber(value.reserved_qty)) &&
    (value.available_qty === undefined || isNumber(value.available_qty))
  );
}

// 交易記錄報表類型守衛
export interface TransactionReportItem {
  transaction_id: string;
  type: string;
  product_code: string;
  quantity: number;
  from_location?: string;
  to_location?: string;
  operator: string;
  timestamp: string;
}

export function isTransactionReportItem(value: unknown): value is TransactionReportItem {
  if (!isObject(value)) return false;

  return (
    isString(value.transaction_id) &&
    isString(value.type) &&
    isString(value.product_code) &&
    isNumber(value.quantity) &&
    isString(value.operator) &&
    isString(value.timestamp) &&
    (value.from_location === undefined || isString(value.from_location)) &&
    (value.to_location === undefined || isString(value.to_location))
  );
}

// 報表過濾器類型守衛
export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  value: string | number | boolean | (string | number)[];
}

export function isReportFilter(value: unknown): value is ReportFilter {
  if (!isObject(value)) return false;

  const validOperators = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'like'];

  return (
    isString(value.field) &&
    isString(value.operator) &&
    validOperators.includes(value.operator as string) &&
    (isString(value.value) ||
      isNumber(value.value) ||
      isBoolean(value.value) ||
      (isArray(value.value) && (value.value as unknown[]).every(v => isString(v) || isNumber(v))))
  );
}

// 報表配置類型守衛
export interface ReportConfig {
  type: string;
  title: string;
  description?: string;
  columns: ReportColumn[];
  filters?: ReportFilter[];
  sorting?: ReportSorting[];
  pagination?: ReportPagination;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  width?: number;
}

export interface ReportSorting {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ReportPagination {
  page: number;
  limit: number;
  total?: number;
}

export function isReportColumn(value: unknown): value is ReportColumn {
  if (!isObject(value)) return false;

  const validTypes = ['string', 'number', 'date', 'boolean'];

  return (
    isString(value.key) &&
    isString(value.label) &&
    isString(value.type) &&
    validTypes.includes(value.type as string) &&
    (value.format === undefined || isString(value.format)) &&
    (value.width === undefined || isNumber(value.width))
  );
}

export function isReportSorting(value: unknown): value is ReportSorting {
  if (!isObject(value)) return false;

  return (
    isString(value.column) &&
    isString(value.direction) &&
    ['asc', 'desc'].includes(value.direction as string)
  );
}

export function isReportPagination(value: unknown): value is ReportPagination {
  if (!isObject(value)) return false;

  return (
    isNumber(value.page) &&
    isNumber(value.limit) &&
    value.page >= 1 &&
    value.limit > 0 &&
    (value.total === undefined || isNumber(value.total))
  );
}

export function isReportConfig(value: unknown): value is ReportConfig {
  if (!isObject(value)) return false;

  return (
    isString(value.type) &&
    isString(value.title) &&
    isArray(value.columns) &&
    (value.columns as unknown[]).every(isReportColumn) &&
    (value.description === undefined || isString(value.description)) &&
    (value.filters === undefined ||
      (isArray(value.filters) && (value.filters as unknown[]).every(isReportFilter))) &&
    (value.sorting === undefined ||
      (isArray(value.sorting) && (value.sorting as unknown[]).every(isReportSorting))) &&
    (value.pagination === undefined || isReportPagination(value.pagination))
  );
}

// 數據驗證助手函數
export function validateReportData<T>(
  data: unknown[],
  validator: (item: unknown) => item is T
): { valid: T[]; invalid: unknown[] } {
  const valid: T[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid };
}

// 安全類型轉換
export function safeParseNumber(value: unknown): number | null {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function safeParseDate(value: unknown): Date | null {
  if (isDate(value)) return value;
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function safeParseString(value: unknown): string | null {
  if (isString(value)) return value;
  if (isNumber(value) || isBoolean(value)) return String(value);
  return null;
}

// ========== lib/types 版本的獨有功能 ==========

// 增強的安全轉換函數
export function toSafeString(value: unknown, defaultValue = ''): string {
  if (isString(value)) return value;
  if (isNumber(value)) return value.toString();
  if (isBoolean(value)) return value.toString();
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

export function toSafeNumber(value: unknown, defaultValue = 0): number {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function toSafeBoolean(value: unknown, defaultValue = false): boolean {
  if (isBoolean(value)) return value;
  if (isString(value)) return value.toLowerCase() === 'true';
  if (isNumber(value)) return value !== 0;
  return defaultValue;
}

// 報表特定類型守衛
export interface SafeOrderData {
  order_id: string;
  total_items: number;
  loaded_items: number;
  completion_rate: number;
  [key: string]: unknown;
}

export function toSafeOrderData(data: unknown): SafeOrderData {
  if (!isObject(data)) {
    return {
      order_id: '',
      total_items: 0,
      loaded_items: 0,
      completion_rate: 0,
    };
  }

  return {
    order_id: toSafeString(data.order_id),
    total_items: toSafeNumber(data.total_items),
    loaded_items: toSafeNumber(data.loaded_items),
    completion_rate: toSafeNumber(data.completion_rate),
    ...data,
  };
}

export interface SafeDetailData {
  product_code: string;
  loaded_qty: number;
  [key: string]: unknown;
}

export function toSafeDetailData(data: unknown): SafeDetailData {
  if (!isObject(data)) {
    return {
      product_code: '',
      loaded_qty: 0,
    };
  }

  return {
    product_code: toSafeString(data.product_code),
    loaded_qty: toSafeNumber(data.loaded_qty),
    ...data,
  };
}

export interface SafeUserData {
  user_name: string;
  total_loads: number;
  total_quantity: number;
  [key: string]: unknown;
}

export function toSafeUserData(data: unknown): SafeUserData {
  if (!isObject(data)) {
    return {
      user_name: '',
      total_loads: 0,
      total_quantity: 0,
    };
  }

  return {
    user_name: toSafeString(data.user_name),
    total_loads: toSafeNumber(data.total_loads),
    total_quantity: toSafeNumber(data.total_quantity),
    ...data,
  };
}

export interface SafeProductData {
  productCode: string;
  description: string;
  voidCount: number;
  totalQuantity: number;
  avgQuantity: number;
  [key: string]: unknown;
}

export function toSafeProductData(data: unknown): SafeProductData {
  if (!isObject(data)) {
    return {
      productCode: '',
      description: '',
      voidCount: 0,
      totalQuantity: 0,
      avgQuantity: 0,
    };
  }

  return {
    productCode: toSafeString(data.productCode),
    description: toSafeString(data.description),
    voidCount: toSafeNumber(data.voidCount),
    totalQuantity: toSafeNumber(data.totalQuantity),
    avgQuantity: toSafeNumber(data.avgQuantity),
    ...data,
  };
}

export interface SafeReportData {
  count: number;
  quantity: number;
  percentage: number;
  [key: string]: unknown;
}

export function toSafeReportData(data: unknown): SafeReportData {
  if (!isObject(data)) {
    return {
      count: 0,
      quantity: 0,
      percentage: 0,
    };
  }

  return {
    count: toSafeNumber(data.count),
    quantity: toSafeNumber(data.quantity),
    percentage: toSafeNumber(data.percentage),
    ...data,
  };
}

export interface SafePageData {
  pageNumber: number;
  [key: string]: unknown;
}

export function toSafePageData(data: unknown): SafePageData {
  if (!isObject(data)) {
    return {
      pageNumber: 1,
    };
  }

  return {
    pageNumber: toSafeNumber(data.pageNumber, 1),
    ...data,
  };
}

// 泛型類型守衛
export function withTypeGuard<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  return guard(value) ? value : defaultValue;
}

// 增強的安全屬性訪問
export function safeGet<T>(
  obj: unknown,
  key: string,
  defaultValue: T,
  transformer?: (value: unknown) => T
): T {
  if (!isObject(obj) || !(key in obj)) {
    return defaultValue;
  }

  const value = obj[key];
  if (transformer) {
    try {
      return transformer(value);
    } catch {
      return defaultValue;
    }
  }

  return value as T;
}
