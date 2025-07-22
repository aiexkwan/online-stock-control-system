/**
 * 通用類型守衛 - 統一管理
 * 從 lib/types/type-guards.ts 遷移
 */

import { z } from 'zod';
import {
  VoidRecordSchema,
  InventoryTransactionSchema,
  BatchProcessingResultSchema,
  type VoidRecord,
  type InventoryTransaction,
  type BatchProcessingResult,
} from '../business/schemas';

/**
 * 通用類型守衛類
 */
export class UniversalTypeGuards {
  /**
   * 檢查是否為非空對象
   */
  static isNonNullObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * 檢查是否為字符串陣列
   */
  static isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
  }

  /**
   * 檢查是否為數字陣列
   */
  static isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every(item => typeof item === 'number' && !isNaN(item));
  }

  /**
   * 檢查是否為有效的日期字符串
   */
  static isDateString(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 檢查是否為 UUID 格式字符串
   */
  static isUUID(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 檢查是否為有效的電子郵件
   */
  static isEmail(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 檢查是否為 URL
   */
  static isURL(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查對象是否包含指定屬性
   */
  static hasProperties<T extends Record<string, unknown>>(
    obj: unknown,
    properties: (keyof T)[]
  ): obj is T {
    if (!this.isNonNullObject(obj)) return false;
    return properties.every(prop => prop in obj);
  }

  /**
   * 檢查對象是否有索引簽名
   */
  static hasIndexSignature(value: unknown): value is Record<string, unknown> {
    return this.isNonNullObject(value);
  }

  /**
   * 通用陣列類型守衛
   */
  static isArrayOf<T>(array: unknown, guard: (item: unknown) => item is T): array is T[] {
    return Array.isArray(array) && array.every(guard);
  }

  /**
   * 安全類型轉換
   */
  static safeConvert<T>(data: unknown, guard: (data: unknown) => data is T, fallback: T): T {
    return guard(data) ? data : fallback;
  }

  /**
   * 條件類型守衛
   */
  static conditionalGuard<T, U>(
    value: unknown,
    condition: boolean,
    guardTrue: (value: unknown) => value is T,
    guardFalse: (value: unknown) => value is U
  ): value is T | U {
    return condition ? guardTrue(value) : guardFalse(value);
  }
}

/**
 * 擴展的業務類型守衛 (基於 Zod schemas)
 */
export class ExtendedBusinessTypeGuards {
  /**
   * VoidRecord 類型守衛
   */
  static isVoidRecord(data: unknown): data is VoidRecord {
    try {
      VoidRecordSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * InventoryTransaction 類型守衛
   */
  static isInventoryTransaction(data: unknown): data is InventoryTransaction {
    try {
      InventoryTransactionSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * BatchProcessingResult 類型守衛
   */
  static isBatchProcessingResult(data: unknown): data is BatchProcessingResult {
    try {
      BatchProcessingResultSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查是否為有效的產品代碼
   */
  static isProductCode(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && /^[A-Z0-9-_]+$/i.test(value);
  }

  /**
   * 檢查是否為有效的棧板號碼
   */
  static isPalletNumber(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && /^PLT[0-9]+$/i.test(value);
  }

  /**
   * 檢查是否為數量值 (正數)
   */
  static isQuantity(value: unknown): value is number {
    return typeof value === 'number' && value > 0 && Number.isInteger(value);
  }

  /**
   * 檢查是否為有效的用戶 ID
   */
  static isUserId(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      (UniversalTypeGuards.isUUID(value) || /^[a-zA-Z0-9_-]+$/.test(value))
    );
  }
}

/**
 * API 響應類型守衛
 */
export class ApiResponseTypeGuards {
  /**
   * 檢查是否為 Supabase 錯誤響應
   */
  static isSupabaseError(value: unknown): value is { message: string; code?: string } {
    return UniversalTypeGuards.isNonNullObject(value) && typeof value.message === 'string';
  }

  /**
   * 檢查是否為分頁響應
   */
  static isPaginatedResponse<T>(
    value: unknown,
    itemGuard: (item: unknown) => item is T
  ): value is { data: T[]; total: number; page: number; limit: number } {
    return (
      UniversalTypeGuards.isNonNullObject(value) &&
      Array.isArray(value.data) &&
      value.data.every(itemGuard) &&
      typeof value.total === 'number' &&
      typeof value.page === 'number' &&
      typeof value.limit === 'number'
    );
  }

  /**
   * 檢查是否為成功的 API 響應
   */
  static isSuccessResponse<T>(
    value: unknown,
    dataGuard: (data: unknown) => data is T
  ): value is { success: true; data: T } {
    return (
      UniversalTypeGuards.isNonNullObject(value) && value.success === true && dataGuard(value.data)
    );
  }

  /**
   * 檢查是否為錯誤響應
   */
  static isErrorResponse(value: unknown): value is { success: false; error: string } {
    return (
      UniversalTypeGuards.isNonNullObject(value) &&
      value.success === false &&
      typeof value.error === 'string'
    );
  }
}

/**
 * 表單數據類型守衛
 */
export class FormDataTypeGuards {
  /**
   * 檢查是否為有效的表單輸入值
   */
  static isFormValue(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  /**
   * 檢查是否為表單數據對象
   */
  static isFormData(value: unknown): value is Record<string, string | number | boolean> {
    if (!UniversalTypeGuards.isNonNullObject(value)) return false;
    return Object.values(value).every(this.isFormValue);
  }

  /**
   * 檢查是否為檔案對象
   */
  static isFile(value: unknown): value is File {
    return value instanceof File;
  }

  /**
   * 檢查是否為 Blob 對象
   */
  static isBlob(value: unknown): value is Blob {
    return value instanceof Blob;
  }
}

/**
 * 組合類型守衛工具
 */
export class CompositeTypeGuards {
  /**
   * 建立組合類型守衛
   */
  static createComposite<T extends Record<string, unknown>>(guards: {
    [K in keyof T]: (value: unknown) => value is T[K];
  }) {
    return (value: unknown): value is T => {
      if (!UniversalTypeGuards.isNonNullObject(value)) return false;

      return Object.keys(guards).every(key => {
        const guard = guards[key as keyof T];
        return guard((value as Record<string, unknown>)[key]);
      });
    };
  }

  /**
   * 建立可選屬性類型守衛
   */
  static createOptional<T>(guard: (value: unknown) => value is T) {
    return (value: unknown): value is T | undefined => {
      return value === undefined || guard(value);
    };
  }

  /**
   * 建立聯合類型守衛
   */
  static createUnion<T, U>(
    guardA: (value: unknown) => value is T,
    guardB: (value: unknown) => value is U
  ) {
    return (value: unknown): value is T | U => {
      return guardA(value) || guardB(value);
    };
  }
}

/**
 * 簡單的安全類型轉換函數 (用於報告系統)
 */
export function safeString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

export function safeOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  return String(value);
}

export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function safeOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function safeCountStatus(
  value: unknown
): 'counted' | 'not_counted' | 'high_variance' | '' | null | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    if (['counted', 'not_counted', 'high_variance', ''].includes(value)) {
      return value as 'counted' | 'not_counted' | 'high_variance' | '';
    }
  }
  return undefined;
}
