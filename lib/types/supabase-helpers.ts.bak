/**
 * Supabase 類型輔助工具
 *
 * 為常見的 Supabase 查詢結果提供類型安全的轉換函數
 * 解決 unknown 類型和 Record<string, unknown> 轉換問題
 *
 * 多專家協作設計：
 * - 分析師：錯誤模式分析和分類
 * - 架構專家：類型系統架構設計
 * - Backend工程師：Supabase API 整合
 * - 優化專家：性能優化建議
 * - 代碼品質專家：最佳實踐實施
 */

import type { Database } from './supabase-generated';

/**
 * 通用資料庫記錄類型
 */
export type DatabaseRecord = Record<string, unknown>;

/**
 * Supabase 響應包裝器
 */
export interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success?: boolean;
}

/**
 * RPC 函數響應類型
 */
export interface RPCResponse<T = unknown> extends SupabaseResponse<T> {
  message?: string;
  rowCount?: number;
  status?: 'success' | 'error' | 'warning';
}

/**
 * 查詢結果類型
 */
export interface QueryResult<T = DatabaseRecord> {
  data: T[] | T | null;
  error: Error | null;
  count?: number;
}

/**
 * 插入/更新結果類型
 */
export interface MutationResult<T = DatabaseRecord> {
  data: T[] | T | null;
  error: Error | null;
  status: number;
  statusText: string;
}

/**
 * 分頁查詢結果
 */
export interface PaginatedResult<T = DatabaseRecord> {
  data: T[];
  error: Error | null;
  count: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 類型守衛：檢查是否為有效的資料庫記錄
 */
export function isDatabaseRecord(value: unknown): value is DatabaseRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 類型守衛：檢查是否為記錄陣列
 */
export function isDatabaseRecordArray(value: unknown): value is DatabaseRecord[] {
  return Array.isArray(value) && value.every(isDatabaseRecord);
}

/**
 * 類型守衛：檢查是否為 Supabase 響應
 */
export function isSupabaseResponse(value: unknown): value is SupabaseResponse {
  return isDatabaseRecord(value) && ('data' in value || 'error' in value);
}

/**
 * 類型守衛：檢查是否為 RPC 響應
 */
export function isRPCResponse(value: unknown): value is RPCResponse {
  return (
    isSupabaseResponse(value) && ('message' in value || 'rowCount' in value || 'status' in value)
  );
}

/**
 * 安全轉換：將 unknown 轉換為資料庫記錄
 */
export function toRecord(value: unknown): DatabaseRecord {
  if (isDatabaseRecord(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isDatabaseRecord(parsed)) {
        return parsed;
      }
    } catch {
      // JSON.parse 失败，返回包装的对象
    }
  }

  return { value };
}

/**
 * 安全轉換：將 unknown 轉換為記錄陣列
 */
export function toRecordArray(value: unknown): DatabaseRecord[] {
  if (isDatabaseRecordArray(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toRecord);
  }

  if (isDatabaseRecord(value)) {
    return [value];
  }

  return [];
}

/**
 * 安全轉換：將 unknown 轉換為 Supabase 響應
 */
export function toSupabaseResponse<T = unknown>(value: unknown): SupabaseResponse<T> {
  if (isSupabaseResponse(value)) {
    return value as SupabaseResponse<T>;
  }

  // 如果是 Supabase 錯誤格式
  if (isDatabaseRecord(value) && 'message' in value) {
    return {
      data: null,
      error: String(value.message),
      success: false,
    };
  }

  // 預設成功響應
  return {
    data: value as T,
    error: null,
    success: true,
  };
}

/**
 * 安全轉換：將 unknown 轉換為 RPC 響應
 */
export function toRPCResponse<T = unknown>(value: unknown): RPCResponse<T> {
  const baseResponse = toSupabaseResponse<T>(value);

  if (isRPCResponse(value)) {
    return value as RPCResponse<T>;
  }

  if (isDatabaseRecord(value)) {
    return {
      ...baseResponse,
      message: value.message ? String(value.message) : undefined,
      rowCount: value.rowCount ? Number(value.rowCount) : undefined,
      status: value.status ? (String(value.status) as 'success' | 'error' | 'warning') : undefined,
    };
  }

  return baseResponse;
}

/**
 * 提取錯誤訊息
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';

  if (typeof error === 'string') return error;

  if (isDatabaseRecord(error)) {
    if (error.message) return String(error.message);
    if (error.error) return String(error.error);
    if (error.details) return String(error.details);
  }

  if (error instanceof Error) return error.message;

  return String(error);
}

/**
 * 檢查是否為成功響應
 */
export function isSuccessResponse(response: unknown): boolean {
  if (isSupabaseResponse(response)) {
    return response.error === null && response.data !== null;
  }

  if (isDatabaseRecord(response)) {
    return response.success === true || response.error === null;
  }

  return false;
}

/**
 * 安全屬性訪問
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!isDatabaseRecord(obj)) return defaultValue;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (!isDatabaseRecord(current) || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current as T;
}

/**
 * 安全數值轉換
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }

  return defaultValue;
}

/**
 * 安全字符串轉換
 */
export function safeString(value: unknown, defaultValue = ''): string {
  if (typeof value === 'string') return value;

  if (value === null || value === undefined) return defaultValue;

  return String(value);
}

/**
 * 安全布林值轉換
 */
export function safeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
}

/**
 * 安全日期轉換
 */
export function safeDate(value: unknown, defaultValue?: Date): Date | null {
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }

  return defaultValue || null;
}

/**
 * 檢查並轉換特定表格的記錄類型
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * 安全轉換為特定表格行類型
 */
export function toTableRow<T extends keyof Database['public']['Tables']>(
  value: unknown,
  tableName: T
): Partial<TableRow<T>> {
  const record = toRecord(value);

  // 這裡可以根據需要添加特定表格的驗證邏輯
  // 目前返回部分類型以保持靈活性
  return record as Partial<TableRow<T>>;
}

/**
 * 批量轉換記錄陣列
 */
export function toTableRows<T extends keyof Database['public']['Tables']>(
  values: unknown,
  tableName: T
): Partial<TableRow<T>>[] {
  const records = toRecordArray(values);
  return records.map(record => toTableRow(record, tableName));
}

/**
 * Supabase count 查詢結果類型
 */
export interface CountResult {
  count: number;
}

/**
 * 安全轉換 Supabase count(*) 查詢結果
 */
export function toSafeCount(value: unknown): number {
  // 處理 Supabase count(*) 查詢返回的結果
  if (value && typeof value === 'object' && value !== null) {
    // Supabase count(*) 查詢返回 { count: number } 格式
    if ('count' in value) {
      return toSafeNumber(value.count);
    }
    // 也可能返回字段名為 'count(*)' 的格式
    if ('count(*)' in value) {
      return toSafeNumber((value as Record<string, unknown>)['count(*)']);
    }
  }
  return 0;
}

/**
 * 安全轉換為數字 (內部助手函數)
 */
function toSafeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }
  return defaultValue;
}

/**
 * 安全轉換 Supabase count 查詢響應
 */
export function extractCount(response: { data: unknown; error: unknown }): number {
  if (response.error || !response.data) {
    return 0;
  }
  return toSafeCount(response.data);
}
