/**
 * RPC Supplier Types
 *
 * 定義供應商相關 RPC 函數的返回類型
 * 用於替代 TypeScript any 類型斷言，提升類型安全性
 */

import type { Json } from './supabase-generated';

// 重用現有的 SupplierData 接口
export interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

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

/**
 * 類型守衛函數 - 驗證 RPC 搜索響應結構
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @returns 是否為有效的搜索響應結構
 */
export function isRpcSearchSupplierResponse(data: Json): data is RpcSearchSupplierResponse {
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
export function isRpcSupplierMutationResponse(data: Json): data is RpcSupplierMutationResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean'
  );
}

/**
 * 斷言函數 - 強制類型轉換 (零運行時成本)
 *
 * @param data - Supabase RPC 返回的 Json 數據
 * @throws 如果數據結構不符合預期
 */
export function assertRpcSearchSupplierResponse(
  data: Json
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
  data: Json
): asserts data is RpcSupplierMutationResponse {
  if (!isRpcSupplierMutationResponse(data)) {
    throw new Error('Invalid RPC supplier mutation response structure');
  }
}
