/**
 * 數據庫數據類型定義
 *
 * 多專家協作設計：
 * - 架構專家：類型系統架構
 * - 分析師：數據模式分析
 * - 代碼品質專家：類型安全保證
 */

// 基礎數據庫記錄類型
export interface DatabaseRecord {
  [key: string]: unknown;
}

// 庫存分佈數據
export interface StockDistributionItem extends DatabaseRecord {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color?: string;
  fill?: string;
  description?: string;
  type?: string;
  stock?: string;
  stock_level?: number;
  injection?: number;
  pipeline?: number;
  prebook?: number;
  await?: number;
  fold?: number;
  bulk?: number;
}

// 產品數據
export interface ProductItem extends DatabaseRecord {
  product_code: string;
  product_desc?: string;
  product_qty?: number;
  description?: string;
  name?: string;
  weight?: number;
  unit_price?: number;
}

// 訂單數據
export interface OrderItem extends DatabaseRecord {
  order_ref: string;
  account_num?: string;
  delivery_add?: string;
  invoice_to?: string;
  customer_ref?: string;
  product_code?: string;
  product_desc?: string;
  product_qty?: number;
}

// 報告數據
export interface ReportItem extends DatabaseRecord {
  plt_num: string;
  product_code?: string;
  product_qty?: number;
  generate_time?: string;
  void_date?: string;
  quantity?: number;
  operator_name?: string;
  remark?: string;
}

// Void 記錄
export interface VoidItem extends DatabaseRecord {
  uuid: string;
  plt_num: string;
  time: string;
  reason: string;
  damage_qty?: number;
  product_code?: string;
  product_qty?: number;
  plt_loc?: string;
  user_name?: string;
  user_id?: string;
  void_qty?: number;
}

// 搜尋歷史
export interface SearchHistoryItem extends DatabaseRecord {
  id: string;
  value: string;
  type: string;
  timestamp: Date;
}

// 泛型數據映射工具類型
export type DataMapper<T extends DatabaseRecord> = T;

// 類型守衛函數
export function isStockDistributionItem(item: unknown): item is StockDistributionItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'name' in item &&
    typeof (item as Record<string, unknown>).name === 'string'
  );
}

export function isProductItem(item: unknown): item is ProductItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'product_code' in item &&
    typeof (item as Record<string, unknown>).product_code === 'string'
  );
}

export function isOrderItem(item: unknown): item is OrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'order_ref' in item &&
    typeof (item as Record<string, unknown>).order_ref === 'string'
  );
}

export function isReportItem(item: unknown): item is ReportItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'plt_num' in item &&
    typeof (item as Record<string, unknown>).plt_num === 'string'
  );
}

export function isVoidItem(item: unknown): item is VoidItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'uuid' in item &&
    typeof (item as Record<string, unknown>).uuid === 'string'
  );
}

export function isSearchHistoryItem(item: unknown): item is SearchHistoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    typeof (item as Record<string, unknown>).id === 'string'
  );
}

// 安全屬性訪問工具
export function safeGetProperty<T>(obj: DatabaseRecord, key: string, defaultValue: T): T {
  const value = obj[key];
  return value !== undefined && value !== null ? (value as T) : defaultValue;
}

export function safeGetString(obj: DatabaseRecord, key: string, defaultValue = ''): string {
  const value = obj[key];
  return typeof value === 'string' ? value : defaultValue;
}

export function safeGetNumber(obj: DatabaseRecord, key: string, defaultValue = 0): number {
  const value = obj[key];
  return typeof value === 'number' ? value : defaultValue;
}

export function safeGetBoolean(obj: DatabaseRecord, key: string, defaultValue = false): boolean {
  const value = obj[key];
  return typeof value === 'boolean' ? value : defaultValue;
}

// 數據轉換工具
export function convertToStockDistributionItem(item: DatabaseRecord): StockDistributionItem {
  return {
    ...item,
    name: safeGetString(item, 'name'),
    size: safeGetNumber(item, 'size'),
    value: safeGetNumber(item, 'value'),
    percentage: safeGetNumber(item, 'percentage'),
    color: safeGetString(item, 'color'),
    fill: safeGetString(item, 'fill'),
    description: safeGetString(item, 'description'),
    type: safeGetString(item, 'type'),
    stock: safeGetString(item, 'stock'),
    stock_level: safeGetNumber(item, 'stock_level'),
    injection: safeGetNumber(item, 'injection'),
    pipeline: safeGetNumber(item, 'pipeline'),
    prebook: safeGetNumber(item, 'prebook'),
    await: safeGetNumber(item, 'await'),
    fold: safeGetNumber(item, 'fold'),
    bulk: safeGetNumber(item, 'bulk'),
  };
}

export function convertToProductItem(item: DatabaseRecord): ProductItem {
  return {
    ...item,
    product_code: safeGetString(item, 'product_code'),
    product_desc: safeGetString(item, 'product_desc'),
    product_qty: safeGetNumber(item, 'product_qty'),
    description: safeGetString(item, 'description'),
    name: safeGetString(item, 'name'),
    weight: safeGetNumber(item, 'weight'),
    unit_price: safeGetNumber(item, 'unit_price'),
  };
}

export function convertToOrderItem(item: DatabaseRecord): OrderItem {
  return {
    ...item,
    order_ref: safeGetString(item, 'order_ref'),
    account_num: safeGetString(item, 'account_num'),
    delivery_add: safeGetString(item, 'delivery_add'),
    invoice_to: safeGetString(item, 'invoice_to'),
    customer_ref: safeGetString(item, 'customer_ref'),
    product_code: safeGetString(item, 'product_code'),
    product_desc: safeGetString(item, 'product_desc'),
    product_qty: safeGetNumber(item, 'product_qty'),
  };
}

export function convertToReportItem(item: DatabaseRecord): ReportItem {
  return {
    ...item,
    plt_num: safeGetString(item, 'plt_num'),
    product_code: safeGetString(item, 'product_code'),
    product_qty: safeGetNumber(item, 'product_qty'),
    generate_time: safeGetString(item, 'generate_time'),
    void_date: safeGetString(item, 'void_date'),
    quantity: safeGetNumber(item, 'quantity'),
    operator_name: safeGetString(item, 'operator_name'),
    remark: safeGetString(item, 'remark'),
  };
}

export function convertToVoidItem(item: DatabaseRecord): VoidItem {
  return {
    ...item,
    uuid: safeGetString(item, 'uuid'),
    plt_num: safeGetString(item, 'plt_num'),
    time: safeGetString(item, 'time'),
    reason: safeGetString(item, 'reason'),
    damage_qty: safeGetNumber(item, 'damage_qty'),
    product_code: safeGetString(item, 'product_code'),
    product_qty: safeGetNumber(item, 'product_qty'),
    plt_loc: safeGetString(item, 'plt_loc'),
    user_name: safeGetString(item, 'user_name'),
    user_id: safeGetString(item, 'user_id'),
    void_qty: safeGetNumber(item, 'void_qty'),
  };
}

export function convertToSearchHistoryItem(item: DatabaseRecord): SearchHistoryItem {
  const timestamp = item.timestamp;
  return {
    ...item,
    id: safeGetString(item, 'id'),
    value: safeGetString(item, 'value'),
    type: safeGetString(item, 'type'),
    timestamp: timestamp instanceof Date ? timestamp : new Date(String(timestamp)),
  };
}
