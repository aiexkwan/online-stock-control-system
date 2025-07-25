/**
 * 數據庫表格類型定義
 * 基於實際業務邏輯的表格類型
 */

import { UserRole } from '@/types/core/enums';

// 通用記錄類型 (從 lib/types/database.ts 遷移)
export interface DatabaseRecord {
  [key: string]: unknown;
}

// 擴展類型，用於複雜查詢結果
export interface EnhancedDatabaseRecord extends DatabaseRecord {
  // 關聯查詢結果 - 可以根據實際需要擴展
  data_code?: any;
  data_supplier?: any;
  data_id?: any;
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

// === 安全屬性訪問工具 (從 lib/types/database-types.ts 遷移) ===

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

// === 數據轉換工具 (從 lib/types/database-types.ts 遷移) ===

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
