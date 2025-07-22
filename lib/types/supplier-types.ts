/**
 * 統一的供應商類型定義
 * 解決 SupplierInfo 接口衝突問題
 */

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
