/**
 * 供應商類型定義 - 統一管理
 * 從 lib/types/supplier-types.ts 和 lib/types/rpc-supplier-types.ts 遷移
 */

import type { Json } from '@/types/database/supabase';

// ========== 基本供應商類型 ==========

/**
 * 標準供應商信息接口
 */
export interface SupplierInfo {
  code: string;
  name: string;
  address?: string;
  supplier_code?: string; // 向後兼容字段
  supplier_name?: string; // 向後兼容字段
}

/**
 * 數據庫查詢結果的供應商接口
 */
export interface DatabaseSupplierInfo {
  supplier_code: string;
  supplier_name: string;
  supplier_address?: string;
}

/**
 * 基本供應商數據 (用於 RPC 回應)
 */
export interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

// ========== RPC 響應類型 ==========

/**
 * rpc_search_supplier 函數返回類型
 *
 * SQL 返回結構:
 * - exists: true -> {exists: true, supplier: {supplier_code, supplier_name}}
 * - exists: false -> {exists: false, normalized_code: string}
 */
export interface RpcSearchSupplierResponse {
  exists: boolean;
  supplier?: SupplierData;
  normalized_code?: string;
}

/**
 * rpc_create_supplier 和 rpc_update_supplier 函數返回類型
 *
 * SQL 返回結構:
 * - success: true -> {success: true, supplier: {supplier_code, supplier_name}}
 * - success: false -> {success: false, error: string}
 */
export interface RpcSupplierMutationResponse {
  success: boolean;
  supplier?: SupplierData;
  error?: string;
}

// ========== 轉換函數 ==========

/**
 * 轉換數據庫供應商信息為標準格式
 */
export function convertDatabaseSupplierInfo(dbSupplier: DatabaseSupplierInfo): SupplierInfo {
  return {
    code: dbSupplier.supplier_code,
    name: dbSupplier.supplier_name,
    address: dbSupplier.supplier_address,
    supplier_code: dbSupplier.supplier_code, // 保持向後兼容
    supplier_name: dbSupplier.supplier_name, // 保持向後兼容
  };
}

/**
 * 轉換標準供應商信息為數據庫格式
 */
export function convertToDatabase(supplier: SupplierInfo): DatabaseSupplierInfo {
  return {
    supplier_code: supplier.supplier_code || supplier.code,
    supplier_name: supplier.supplier_name || supplier.name,
    supplier_address: supplier.address,
  };
}

// ========== 類型守衛函數 ==========

/**
 * 類型守衛：檢查是否為有效的供應商信息
 */
export function isValidSupplierInfo(value: unknown): value is SupplierInfo {
  return (
    value !== null &&
    typeof value === 'object' &&
    (('code' in value &&
      typeof value.code === 'string' &&
      'name' in value &&
      typeof value.name === 'string') ||
      ('supplier_code' in value &&
        typeof value.supplier_code === 'string' &&
        'supplier_name' in value &&
        typeof value.supplier_name === 'string'))
  );
}

/**
 * 類型守衛函數 - 驗證 RPC 搜索響應結構
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @returns 是否為有效的搜索響應結構
 */
export function isRpcSearchSupplierResponse(data: any): data is RpcSearchSupplierResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exists' in data &&
    typeof (data as Record<string, unknown>).exists === 'boolean'
  );
}

/**
 * 類型守衛函數 - 驗證 RPC 變更響應結構
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @returns 是否為有效的變更響應結構
 */
export function isRpcSupplierMutationResponse(data: any): data is RpcSupplierMutationResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean'
  );
}

/**
 * 類型守衛：檢查是否為供應商數據
 */
export function isSupplierData(value: unknown): value is SupplierData {
  return (
    value !== null &&
    typeof value === 'object' &&
    'supplier_code' in value &&
    typeof (value as Record<string, unknown>).supplier_code === 'string' &&
    'supplier_name' in value &&
    typeof (value as Record<string, unknown>).supplier_name === 'string'
  );
}

// ========== 斷言函數 ==========

/**
 * 斷言函數 - 強制類型轉換 (零運行時成本)
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @throws 如果數據結構不符合預期
 */
export function assertRpcSearchSupplierResponse(
  data: any
): asserts data is RpcSearchSupplierResponse {
  if (!isRpcSearchSupplierResponse(data)) {
    throw new Error('Invalid RPC search supplier response structure');
  }
}

/**
 * 斷言函數 - 強制類型轉換 (零運行時成本)
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @throws 如果數據結構不符合預期
 */
export function assertRpcSupplierMutationResponse(
  data: any
): asserts data is RpcSupplierMutationResponse {
  if (!isRpcSupplierMutationResponse(data)) {
    throw new Error('Invalid RPC supplier mutation response structure');
  }
}

// ========== 輔助函數 ==========

/**
 * 安全取得供應商代碼
 */
export function getSupplierCode(supplier: SupplierInfo | null): string {
  if (!supplier) return '';
  return supplier.code || supplier.supplier_code || '';
}

/**
 * 安全取得供應商名稱
 */
export function getSupplierName(supplier: SupplierInfo | null): string {
  if (!supplier) return '';
  return supplier.name || supplier.supplier_name || '';
}

/**
 * 安全取得供應商地址
 */
export function getSupplierAddress(supplier: SupplierInfo | null): string {
  if (!supplier) return '';
  return supplier.address || '';
}

/**
 * 創建空白供應商信息
 */
export function createEmptySupplierInfo(): SupplierInfo {
  return {
    code: '',
    name: '',
    address: '',
    supplier_code: '',
    supplier_name: '',
  };
}

/**
 * 驗證供應商代碼格式
 */
export function isValidSupplierCode(code: string): boolean {
  // 供應商代碼應該是非空字符串
  return typeof code === 'string' && code.trim().length > 0;
}

/**
 * 標準化供應商代碼 (去除空格、轉大寫等)
 */
export function normalizeSupplierCode(code: string): string {
  return code.trim().toUpperCase();
}
