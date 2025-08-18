/**
 * 未知類型處理器
 * 提供安全的未知類型處理和轉換工具
 * 從 lib/types/unknown-handlers.ts 遷移
 */

export class UnknownTypeHandler {
  /**
   * 安全的屬性訪問
   * @param obj 未知對象
   * @param path 屬性路徑 (支援 'a.b.c' 格式)
   * @param defaultValue 默認值
   * @returns 安全提取的值或默認值
   */
  static safeGet<T = unknown>(obj: unknown, path: string, defaultValue: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return defaultValue;
    }

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return defaultValue;
      }
    }

    return (current ?? defaultValue) as T;
  }

  /**
   * 批量數據轉換
   * @param data 未知數據
   * @param transformer 轉換函數
   * @returns 轉換後的有效數據陣列
   */
  static transformUnknownArray<T>(data: unknown, transformer: (item: unknown) => T | null): T[] {
    if (!Array.isArray(data)) return [];

    return data.map(transformer).filter((item): item is T => item !== null);
  }

  /**
   * 安全的數字轉換
   * @param value 未知值
   * @param defaultValue 默認值
   * @returns 數字或默認值
   */
  static toNumber(value: unknown, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  /**
   * 安全的字符串轉換
   * @param value 未知值
   * @param defaultValue 默認值
   * @returns 字符串或默認值
   */
  static toString(value: unknown, defaultValue: string = ''): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return defaultValue;
  }

  /**
   * 條件類型轉換
   * @param data 未知數據
   * @param condition 類型守衛條件
   * @param transform 轉換函數
   * @param fallback 回退值
   * @returns 轉換結果或回退值
   */
  static conditionalTransform<T, R>(
    data: unknown,
    condition: (data: unknown) => data is T,
    transform: (data: T) => R,
    fallback: R
  ): R {
    return condition(data) ? transform(data) : fallback;
  }

  /**
   * 安全的陣列轉換
   * @param value 未知值
   * @param itemGuard 項目類型守衛
   * @returns 類型安全的陣列
   */
  static toArray<T>(value: unknown, itemGuard: (item: unknown) => item is T): T[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(itemGuard);
  }

  /**
   * 安全的對象屬性提取
   * @param obj 未知對象
   * @param keys 要提取的鍵
   * @returns 安全的對象
   */
  static pickProperties<T extends Record<string, unknown>>(
    obj: unknown,
    keys: string[]
  ): Partial<T> {
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }

    const result: Partial<T> = {};
    const objRecord = obj as Record<string, unknown>;

    for (const key of keys) {
      if (key in objRecord) {
        (result as Record<string, unknown>)[key] = objRecord[key];
      }
    }

    return result;
  }

  /**
   * 深度安全克隆
   * @param obj 未知對象
   * @returns 安全克隆的對象
   */
  static safeClone<T>(obj: unknown): T | null {
    try {
      if (obj === null || obj === undefined) {
        return null;
      }

      if (typeof obj !== 'object') {
        return obj as T;
      }

      return JSON.parse(JSON.stringify(obj)) as T;
    } catch (error) {
      console.warn('Safe clone failed:', error);
      return null;
    }
  }

  /**
   * 類型斷言工具
   * @param value 未知值
   * @param predicate 斷言函數
   * @param errorMessage 錯誤訊息
   * @returns 斷言成功的值
   * @throws 斷言失敗時拋出錯誤
   */
  static assert<T>(
    value: unknown,
    predicate: (value: unknown) => value is T,
    errorMessage: string = 'Type assertion failed'
  ): T {
    if (!predicate(value)) {
      throw new Error(errorMessage);
    }
    return value;
  }

  /**
   * 批量類型檢查
   * @param items 未知項目陣列
   * @param guards 類型守衛陣列
   * @returns 分類後的結果
   */
  static categorizeItems<T extends Record<string, unknown>>(
    items: unknown[],
    guards: Record<keyof T, (item: unknown) => boolean>
  ): T {
    const result = {} as T;
    const guardKeys = Object.keys(guards) as Array<keyof T>;

    // 初始化結果對象
    for (const key of guardKeys) {
      (result[key] as unknown[]) = [];
    }

    // 分類項目
    for (const item of items) {
      for (const key of guardKeys) {
        if (guards[key](item)) {
          (result[key] as unknown[]).push(item);
          break; // 每個項目只分類到第一個匹配的類別
        }
      }
    }

    return result;
  }
}

// 基本類型檢查函數
export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  );
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

// 對象相關檢查
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // 檢查原型鏈
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function isEmptyObject(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return Object.keys(value).length === 0;
}

export function hasOwnProperty<K extends PropertyKey>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && Object.prototype.hasOwnProperty.call(obj, prop);
}

// 數組相關檢查
export function isNonEmptyArray(value: unknown): value is [unknown, ...unknown[]] {
  return Array.isArray(value) && value.length > 0;
}

export function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

// 安全轉換函數
export function toSafeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && !isNaN(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return fallback;

  try {
    return String(value);
  } catch {
    return fallback;
  }
}

export function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return fallback;
}

export function toSafeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'on', 'y'].includes(lower)) return true;
    if (['false', '0', 'no', 'off', 'n', ''].includes(lower)) return false;
  }
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
}

export function toSafeArray<T = unknown>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return fallback;
  return [value as T];
}

export function toSafeObject(
  value: unknown,
  fallback: Record<string, unknown> = {}
): Record<string, unknown> {
  if (isPlainObject(value)) return value;
  return fallback;
}

// 深度安全處理
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as T;
  }

  if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      cloned[key] = deepClone(val);
    }
    return cloned as T;
  }

  return value;
}

export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEquals(item, b[index]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => keysB.includes(key) && deepEquals(a[key], b[key]));
    }
  }

  return false;
}

// 錯誤處理
export function safeExecute<T>(fn: () => T, fallback: T, onError?: (error: unknown) => void): T {
  try {
    return fn();
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return fallback;
  }
}

export function safeAsync<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

// JSON 安全處理
export function safeJsonParse<T = unknown>(
  json: string,
  fallback: T,
  reviver?: (key: string, value: unknown) => unknown
): T {
  try {
    return JSON.parse(json, reviver) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback = '{}',
  replacer?: (key: string, value: unknown) => unknown,
  space?: string | number
): string {
  try {
    return JSON.stringify(value, replacer as any, space);
  } catch {
    return fallback;
  }
}

// 屬性訪問
export function safeGet<T = unknown>(
  obj: unknown,
  path: string | string[],
  fallback?: T
): T | undefined {
  if (obj === null || obj === undefined) {
    return fallback;
  }

  const keys = Array.isArray(path) ? path : path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }

    if (!hasOwnProperty(current, key)) {
      return fallback;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

export function safeSet<T extends Record<string, unknown>>(
  obj: T,
  path: string | string[],
  value: unknown
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!(key in current) || !isPlainObject(current[key])) {
      current[key] = {};
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return obj;
}

// 集合操作
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function groupBy<T>(array: T[], keyFn: (item: T) => string | number): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  for (const item of array) {
    const key = String(keyFn(item));
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
}

// 類型縮窄助手
export function assertIsString(value: unknown, message?: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message || `Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, message?: string): asserts value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(message || `Expected number, got ${typeof value}`);
  }
}

export function assertIsObject(
  value: unknown,
  message?: string
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(message || `Expected object, got ${typeof value}`);
  }
}

export function assertIsArray(value: unknown, message?: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(message || `Expected array, got ${typeof value}`);
  }
}
