/**
 * 數據庫表格類型定義
 * 基於實際業務邏輯的表格類型
 * 重構：使用 Zod schema 替換 unknown 類型
 */

// UserRole enum - migrated from core/enums.ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

import {
  DatabaseValue,
  RelationResult,
  safeParseDatabaseValue,
  safeCastToDatabaseRecord,
  safeCastToEnhancedDatabaseRecord,
} from '../../lib/validation/zod-schemas';

// ===== 改進的通用記錄類型系統 =====

// 主要 DatabaseRecord 類型 - 支援嵌套物件和陣列
export interface DatabaseRecord {
  [key: string]: DatabaseValue;
}

// Legacy 類型（向後相容）
export interface LegacyDatabaseRecord {
  [key: string]: unknown;
}

// 增強的 DatabaseRecord - 支援常見的關聯查詢結果
export interface EnhancedDatabaseRecord {
  // 關聯查詢結果 - 支援嵌套物件
  data_code?: RelationResult;
  data_supplier?: RelationResult;
  data_id?: RelationResult;
  users?: RelationResult;
  error?: {
    message: string;
    code?: string;
    details?: DatabaseValue;
  };
  // 保持靈活性，允許其他欄位
  [key: string]: DatabaseValue;
}

// Legacy Enhanced (向後相容)
export interface LegacyEnhancedDatabaseRecord extends LegacyDatabaseRecord {
  data_code?: unknown;
  data_supplier?: unknown;
  data_id?: unknown;
}

// 產品相關
export interface Product {
  code: string;
  description: string;
  type: string;
  unit?: string;
  weight?: number;
  category?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 供應商相關
export interface Supplier {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 訂單相關
export interface AcoOrder {
  id: number;
  orderRef: string;
  customerRef?: string;
  accountNum?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  totalWeight?: number;
  totalQty?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GrnOrder {
  id: number;
  grnRef: string;
  supplierCode: string;
  materialCode: string;
  deliveryDate?: string;
  totalWeight?: number;
  totalQty?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 棧板相關
export interface Pallet {
  pltNum: string;
  productCode: string;
  productQty: number;
  location: string;
  status: PalletStatus;
  operatorId?: number;
  generateTime: string;
  qcDate?: string;
  notes?: string;
}

export enum PalletStatus {
  PENDING = 'pending',
  IN_PRODUCTION = 'in_production',
  QC_PASS = 'qc_pass',
  QC_FAIL = 'qc_fail',
  SHIPPED = 'shipped',
  VOID = 'void',
}

// 庫存相關
export interface Inventory {
  id: number;
  productCode: string;
  location: string;
  quantity: number;
  reservedQty?: number;
  availableQty: number;
  lastUpdated: string;
  lastCountDate?: string;
}

export enum InventoryLocation {
  WAREHOUSE = 'warehouse',
  PRODUCTION = 'production',
  QC = 'qc',
  SHIPPING = 'shipping',
  AWAIT = 'await',
  AWAIT_GRN = 'await_grn',
  PIPELINE = 'pipeline',
}

// 轉移記錄
export interface Transfer {
  id: number;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  productCode: string;
  quantity: number;
  operatorId: number;
  transferDate: string;
  reason?: string;
  notes?: string;
}

// 歷史記錄
export interface HistoryRecord {
  id?: number;
  time: string;
  action: string;
  pltNum?: string;
  location?: string;
  remark: string;
  uuid: string;
  operatorId?: number;
}

// 用戶相關
export interface User {
  id: number;
  email: string;
  name?: string;
  department?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// @types-migration:todo(phase1) [P0] UserRole 已遷移到 core/enums.ts - Completed: 2025-07
// 已從 types/index.ts 統一導出

// === 向後兼容的數據項類型 (從 lib/types/database-types.ts 遷移) ===

// 庫存分佈數據 - 使用安全類型
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

// 產品數據 - 使用安全類型
export interface ProductItem extends DatabaseRecord {
  product_code: string;
  product_desc?: string;
  product_qty?: number;
  description?: string;
  name?: string;
  weight?: number;
  unit_price?: number;
}

// 訂單數據 - 使用安全類型
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

// 報告數據 - 使用安全類型
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

// Void 記錄 - 使用安全類型
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

// 搜尋歷史 - 使用安全類型
export interface SearchHistoryItem extends DatabaseRecord {
  id: string;
  value: string;
  type: string;
  timestamp: Date;
}

// === 安全屬性訪問工具 (從 lib/types/database-types.ts 遷移) ===

// ===== 改進的安全屬性訪問工具 =====

// 通用安全屬性訪問 - 支援嵌套值
export function safeGetProperty<T extends DatabaseValue>(
  obj: DatabaseRecord,
  key: string,
  defaultValue: T
): T {
  const value = obj[key];
  if (value !== undefined && value !== null) {
    // 嘗試解析為指定類型
    const parsed = safeParseDatabaseValue(value);
    return parsed !== null ? (parsed as T) : defaultValue;
  }
  return defaultValue;
}

// 安全獲取關聯物件
export function safeGetRelation(obj: DatabaseRecord, key: string): RelationResult | null {
  const value = obj[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as RelationResult;
  }
  return null;
}

// Legacy 版本（向後相容）
export function safeGetPropertyLegacy<T>(
  obj: LegacyDatabaseRecord,
  key: string,
  defaultValue: T
): T {
  const value = obj[key];
  return value !== undefined && value !== null ? (value as T) : defaultValue;
}

// 基礎類型安全訪問（更新版）
export function safeGetString(obj: DatabaseRecord, key: string, defaultValue = ''): string {
  const value = obj[key];
  if (typeof value === 'string') return value;
  if (value !== undefined && value !== null) {
    return String(value);
  }
  return defaultValue;
}

export function safeGetNumber(obj: DatabaseRecord, key: string, defaultValue = 0): number {
  const value = obj[key];
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

export function safeGetBoolean(obj: DatabaseRecord, key: string, defaultValue = false): boolean {
  const value = obj[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return defaultValue;
}

// 安全獲取陣列
export function safeGetArray<T = DatabaseValue>(
  obj: DatabaseRecord,
  key: string,
  defaultValue: T[] = []
): T[] {
  const value = obj[key];
  if (Array.isArray(value)) {
    return value as T[];
  }
  return defaultValue;
}

// ===== 改進的數據轉換工具 - 支援嵌套結構 =====

export function convertToStockDistributionItem(item: DatabaseRecord): StockDistributionItem {
  // 處理關聯數據 (如 data_code)
  const dataCode = safeGetRelation(item, 'data_code');

  return {
    ...item,
    name:
      safeGetString(item, 'name') ||
      dataCode?.description ||
      safeGetString(item, 'product_code', ''),
    size: safeGetNumber(item, 'size'),
    value: safeGetNumber(item, 'value'),
    percentage: safeGetNumber(item, 'percentage'),
    color: safeGetString(item, 'color') || dataCode?.colour || '#000000',
    fill: safeGetString(item, 'fill') || dataCode?.colour || '#000000',
    description: safeGetString(item, 'description') || dataCode?.description || '',
    type: safeGetString(item, 'type') || dataCode?.type || '',
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
  const dataCode = safeGetRelation(item, 'data_code');

  return {
    ...item,
    product_code: safeGetString(item, 'product_code') || safeGetString(item, 'code', ''),
    product_desc: safeGetString(item, 'product_desc') || dataCode?.description || '',
    product_qty: safeGetNumber(item, 'product_qty') || safeGetNumber(item, 'quantity'),
    description: safeGetString(item, 'description') || dataCode?.description || '',
    name: safeGetString(item, 'name') || dataCode?.name || '',
    weight: safeGetNumber(item, 'weight'),
    unit_price: safeGetNumber(item, 'unit_price'),
  };
}

export function convertToOrderItem(item: DatabaseRecord): OrderItem {
  const dataCode = safeGetRelation(item, 'data_code');

  return {
    ...item,
    order_ref: safeGetString(item, 'order_ref'),
    account_num: safeGetString(item, 'account_num'),
    delivery_add: safeGetString(item, 'delivery_add'),
    invoice_to: safeGetString(item, 'invoice_to'),
    customer_ref: safeGetString(item, 'customer_ref'),
    product_code: safeGetString(item, 'product_code') || safeGetString(item, 'code', ''),
    product_desc: safeGetString(item, 'product_desc') || dataCode?.description || '',
    product_qty: safeGetNumber(item, 'product_qty') || safeGetNumber(item, 'quantity'),
  };
}

export function convertToReportItem(item: DatabaseRecord): ReportItem {
  const users = safeGetRelation(item, 'users');

  return {
    ...item,
    plt_num: safeGetString(item, 'plt_num'),
    product_code: safeGetString(item, 'product_code'),
    product_qty: safeGetNumber(item, 'product_qty') || safeGetNumber(item, 'quantity'),
    generate_time: safeGetString(item, 'generate_time'),
    void_date: safeGetString(item, 'void_date') || safeGetString(item, 'void_time', ''),
    quantity: safeGetNumber(item, 'quantity') || safeGetNumber(item, 'product_qty'),
    operator_name: safeGetString(item, 'operator_name') || users?.name || '',
    remark: safeGetString(item, 'remark'),
  };
}

export function convertToVoidItem(item: DatabaseRecord): VoidItem {
  const users = safeGetRelation(item, 'users');

  return {
    ...item,
    uuid: safeGetString(item, 'uuid'),
    plt_num: safeGetString(item, 'plt_num'),
    time: safeGetString(item, 'time') || safeGetString(item, 'void_time', ''),
    reason: safeGetString(item, 'reason') || safeGetString(item, 'void_reason', ''),
    damage_qty: safeGetNumber(item, 'damage_qty'),
    product_code: safeGetString(item, 'product_code'),
    product_qty: safeGetNumber(item, 'product_qty'),
    plt_loc: safeGetString(item, 'plt_loc') || safeGetString(item, 'location', ''),
    user_name: safeGetString(item, 'user_name') || users?.name || '',
    user_id: safeGetString(item, 'user_id') || users?.id?.toString() || '',
    void_qty: safeGetNumber(item, 'void_qty') || safeGetNumber(item, 'damage_qty'),
  };
}

export function convertToSearchHistoryItem(item: DatabaseRecord): SearchHistoryItem {
  const timestampValue = item.timestamp;
  let timestamp: Date;

  if (timestampValue instanceof Date) {
    timestamp = timestampValue;
  } else if (typeof timestampValue === 'string') {
    timestamp = new Date(timestampValue);
  } else {
    timestamp = new Date();
  }

  return {
    ...item,
    id: safeGetString(item, 'id'),
    value: safeGetString(item, 'value'),
    type: safeGetString(item, 'type'),
    timestamp,
  };
}

// === 類型守衛函數 (使用 Zod) ===

// ===== 改進的類型守衛函數 =====

/**
 * 檢查是否為有效的資料庫記錄（更寬鬆）
 */
export function isDatabaseRecord(value: unknown): value is DatabaseRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 檢查是否為增強的資料庫記錄
 */
export function isEnhancedDatabaseRecord(value: unknown): value is EnhancedDatabaseRecord {
  if (!isDatabaseRecord(value)) return false;

  // 檢查是否有常見的關聯欄位
  const record = value as Record<string, unknown>;
  return 'data_code' in record || 'data_supplier' in record || 'data_id' in record;
}

// ===== 改進的轉換工具 =====

/**
 * 安全轉換任意資料為 DatabaseRecord
 */
export function toDatabaseRecord(data: unknown): DatabaseRecord {
  if (!isDatabaseRecord(data)) {
    console.warn('Invalid data provided to toDatabaseRecord:', data);
    return {};
  }
  return safeCastToDatabaseRecord(data);
}

/**
 * 安全轉換任意資料為 EnhancedDatabaseRecord
 */
export function toEnhancedDatabaseRecord(data: unknown): EnhancedDatabaseRecord {
  if (!isDatabaseRecord(data)) {
    console.warn('Invalid data provided to toEnhancedDatabaseRecord:', data);
    return {};
  }
  const result = safeCastToEnhancedDatabaseRecord(data);

  // 使用類型斷言來滿足 exactOptionalPropertyTypes
  return result as EnhancedDatabaseRecord;
}

/**
 * 驗證並轉換資料庫記錄（更新版）
 */
export function validateAndConvertDatabaseRecord(
  data: unknown
): { success: true; data: DatabaseRecord } | { success: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data: not an object' };
  }

  try {
    const converted = toDatabaseRecord(data);
    return { success: true, data: converted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    };
  }
}

/**
 * 批次轉換資料庫記錄陣列
 */
export function convertDatabaseRecordArray(data: unknown[]): DatabaseRecord[] {
  return data.map(item => toDatabaseRecord(item)).filter(record => Object.keys(record).length > 0);
}

/**
 * 批次轉換增強資料庫記錄陣列
 */
export function convertEnhancedDatabaseRecordArray(data: unknown[]): EnhancedDatabaseRecord[] {
  return data
    .map(item => toEnhancedDatabaseRecord(item))
    .filter(record => Object.keys(record).length > 0);
}
