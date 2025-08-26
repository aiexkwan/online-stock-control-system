/**
 * GraphQL 類型安全工具函數
 * 代碼品質專家 - 統一Maybe<T>處理策略
 */

// 導入GraphQL生成的類型
import type { Maybe, InputMaybe } from '@/types/generated/graphql';

/**
 * 安全轉換Maybe<string>到string
 * @param value Maybe<string>類型的值
 * @param defaultValue 預設值，默認為空字符串
 * @returns string
 */
export function ensureString(value: Maybe<string>, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

/**
 * 安全轉換Maybe<number>到number
 * @param value Maybe<number>類型的值
 * @param defaultValue 預設值，默認為0
 * @returns number
 */
export function ensureNumber(value: Maybe<number>, defaultValue: number = 0): number {
  return value ?? defaultValue;
}

/**
 * 安全轉換Maybe<boolean>到boolean
 * @param value Maybe<boolean>類型的值
 * @param defaultValue 預設值，默認為false
 * @returns boolean
 */
export function ensureBoolean(value: Maybe<boolean>, defaultValue: boolean = false): boolean {
  return value ?? defaultValue;
}

/**
 * 安全轉換Maybe<T[]>到T[]
 * @param value Maybe<T[]>類型的值
 * @param defaultValue 預設值，默認為空陣列
 * @returns T[]
 */
export function ensureArray<T>(value: Maybe<T[]>, defaultValue: T[] = []): T[] {
  return value ?? defaultValue;
}

/**
 * 安全轉換InputMaybe<T>到T
 * @param value InputMaybe<T>類型的值
 * @param defaultValue 預設值
 * @returns T
 */
export function ensureInputValue<T>(value: InputMaybe<T>, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * 檢查Maybe值是否有效（非null且非undefined）
 * @param value Maybe<T>類型的值
 * @returns boolean
 */
export function isValidMaybe<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}

/**
 * 安全轉換Maybe<object>到object，支援深度合併
 * @param value Maybe<object>類型的值
 * @param defaultValue 預設對象
 * @returns object
 */
export function ensureObject<T extends Record<string, unknown>>(
  value: Maybe<T>,
  defaultValue: T
): T {
  return value ?? defaultValue;
}

/**
 * 批次處理Maybe值的映射函數
 * @param values Maybe<T>[]數組
 * @param mapper 映射函數
 * @returns U[]
 */
export function mapMaybeValues<T, U>(values: Maybe<T>[], mapper: (value: T) => U): U[] {
  return values.filter(isValidMaybe).map(mapper);
}

// 常用的GraphQL類型預設值
export const DEFAULT_PAGINATION = {
  limit: 50,
  offset: 0,
};

export const DEFAULT_FILTERS = {
  stringFilters: [],
  numberFilters: [],
  dateFilters: [],
  booleanFilters: [],
};

export const DEFAULT_SORT = {
  field: 'id',
  direction: 'ASC' as const,
};
