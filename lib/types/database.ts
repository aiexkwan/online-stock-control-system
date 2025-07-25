/**
 * 數據庫類型統一導出
 * 整合 Supabase 生成類型和自定義類型
 */

// 導入生成的 Supabase 類型
import { Database } from './supabase-generated';

// 導出主要類型
export type { Database };
export type DatabaseRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type DatabaseInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type DatabaseUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// 常用表格類型別名
export type DataCodeRow = DatabaseRow<'data_code'>;
export type DataIdRow = DatabaseRow<'data_id'>;
export type DataOrderRow = DatabaseRow<'data_order'>;
export type DataSupplierRow = DatabaseRow<'data_supplier'>;
export type RecordAcoRow = DatabaseRow<'record_aco'>;
export type RecordGrnRow = DatabaseRow<'record_grn'>;
export type RecordHistoryRow = DatabaseRow<'record_history'>;
export type RecordInventoryRow = DatabaseRow<'record_inventory'>;
export type RecordPalletinfoRow = DatabaseRow<'record_palletinfo'>;
export type RecordTransferRow = DatabaseRow<'record_transfer'>;

// Insert 類型別名
export type DataCodeInsert = DatabaseInsert<'data_code'>;
export type DataIdInsert = DatabaseInsert<'data_id'>;
export type DataOrderInsert = DatabaseInsert<'data_order'>;
export type DataSupplierInsert = DatabaseInsert<'data_supplier'>;
export type RecordAcoInsert = DatabaseInsert<'record_aco'>;
export type RecordGrnInsert = DatabaseInsert<'record_grn'>;
export type RecordHistoryInsert = DatabaseInsert<'record_history'>;
export type RecordInventoryInsert = DatabaseInsert<'record_inventory'>;
export type RecordPalletinfoInsert = DatabaseInsert<'record_palletinfo'>;
export type RecordTransferInsert = DatabaseInsert<'record_transfer'>;

// Update 類型別名
export type DataCodeUpdate = DatabaseUpdate<'data_code'>;
export type DataIdUpdate = DatabaseUpdate<'data_id'>;
export type DataOrderUpdate = DatabaseUpdate<'data_order'>;
export type DataSupplierUpdate = DatabaseUpdate<'data_supplier'>;
export type RecordAcoUpdate = DatabaseUpdate<'record_aco'>;
export type RecordGrnUpdate = DatabaseUpdate<'record_grn'>;
export type RecordHistoryUpdate = DatabaseUpdate<'record_history'>;
export type RecordInventoryUpdate = DatabaseUpdate<'record_inventory'>;
export type RecordPalletinfoUpdate = DatabaseUpdate<'record_palletinfo'>;
export type RecordTransferUpdate = DatabaseUpdate<'record_transfer'>;

// 通用記錄類型 (保持向後兼容)
export interface DatabaseRecord {
  [key: string]: unknown;
}

// 擴展類型，用於複雜查詢結果
export interface EnhancedDatabaseRecord extends DatabaseRecord {
  // 關聯查詢結果
  data_code?: DataCodeRow;
  data_supplier?: DataSupplierRow;
  data_id?: DataIdRow;
}

// 庫存分佈數據類型
export interface StockDistributionData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
  description?: string;
  type?: string;
}

// 產品項目類型
export interface ProductItem {
  product_code: string;
  product_desc?: string;
  product_qty?: number;
  description?: string;
  name?: string;
  weight?: number;
  unit_price?: number;
}

// 訂單項目類型
export interface OrderItem {
  order_ref: string;
  account_num?: string;
  delivery_add?: string;
  customer_ref?: string;
  delivery_date?: string;
  total_weight?: number;
  total_qty?: number;
}

// 報表數據類型
export interface ReportItem {
  product_code: string;
  product_desc: string;
  product_qty: number;
  [key: string]: unknown;
}

// 類型守衛函數
export function isDataCodeRow(obj: unknown): obj is DataCodeRow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'description' in obj &&
    'type' in obj
  );
}

export function isRecordInventoryRow(obj: unknown): obj is RecordInventoryRow {
  return typeof obj === 'object' && obj !== null && 'product_code' in obj && 'injection' in obj;
}

export function isRecordPalletinfoRow(obj: unknown): obj is RecordPalletinfoRow {
  return typeof obj === 'object' && obj !== null && 'plt_num' in obj && 'product_code' in obj;
}

// 工具函數：安全的類型轉換
export function safeConvertToDataCodeRow(obj: unknown): DataCodeRow | null {
  if (isDataCodeRow(obj)) {
    return obj;
  }
  return null;
}

export function safeConvertToRecordInventoryRow(obj: unknown): RecordInventoryRow | null {
  if (isRecordInventoryRow(obj)) {
    return obj;
  }
  return null;
}

export function safeConvertToRecordPalletinfoRow(obj: unknown): RecordPalletinfoRow | null {
  if (isRecordPalletinfoRow(obj)) {
    return obj;
  }
  return null;
}
