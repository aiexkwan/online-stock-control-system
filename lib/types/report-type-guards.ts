/**
 * 報表系統類型守衛 - Strategy 4: Unknown + Type Narrowing
 * 提供類型安全的數據轉換函數
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

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// 安全轉換函數
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

// 安全的屬性訪問
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
