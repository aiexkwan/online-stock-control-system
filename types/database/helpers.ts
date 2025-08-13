/**
 * Supabase 數據庫輔助類型和工具函數
 * 從 lib/types/supabase-helpers.ts 遷移
 */

import type { Database } from './supabase';

/**
 * Supabase 響應包裝器
 */
export interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success?: boolean;
}

/**
 * Supabase 查詢選項
 */
export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  order?: string;
  filter?: Record<string, unknown>;
}

/**
 * 類型安全的數據轉換工具函數
 */

// 安全獲取值
export function safeGet<T = unknown>(obj: any, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    return obj[key] as T;
  }
  return undefined;
}

// 安全字符串轉換
export function safeString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

// 安全數字轉換
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

// 安全布爾轉換
export function safeBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

// 安全日期轉換
export function safeDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// 轉換為記錄類型
export function toRecord(data: unknown): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}

// 類型守衛函數
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function hasProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return isRecord(obj) && prop in obj;
}

/**
 * Supabase 錯誤處理器
 */
export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Database operation failed';
}

/**
 * 批量數據處理工具
 */
export function batchProcess<T, R>(items: T[], processor: (item: T) => R, batchSize = 100): R[] {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...batch.map(processor));
  }
  return results;
}

/**
 * 數據驗證工具
 */
export function validateRequired<T>(
  data: Record<string, unknown>,
  fields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of fields) {
    const key = String(field);
    if (!(key in data) || data[key] === null || data[key] === undefined) {
      missingFields.push(key);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * 新增缺失的函數 - 解決 TypeScript 錯誤
 */

// 轉換為記錄數組
export function toRecordArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  if (isRecord(data)) {
    return [data];
  }
  return [];
}

// 轉換 Supabase 響應格式
export function toSupabaseResponse<T>(data: T | null, error: unknown = null): SupabaseResponse<T> {
  return {
    data,
    error: error ? handleSupabaseError(error) : null,
    success: !error && data !== null,
  };
}

// 提取計數值
export function extractCount(response: unknown): number {
  if (isRecord(response) && 'count' in response) {
    return safeNumber(response.count, 0);
  }
  if (Array.isArray(response)) {
    return response.length;
  }
  return 0;
}

/**
 * Deprecated alert-related functions removed during cleanup (2025-08-13)
 * Alert system has been permanently removed for security reasons.
 */
