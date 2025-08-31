/**
 * 企業級品牌類型系統 (Enterprise Branded Types System)
 *
 * 此文件定義了系統中使用的品牌類型，用於在編譯時區分基礎類型，
 * 提升類型安全性和領域模型的精確性
 */

// 基礎品牌類型工具
declare const __brand: unique symbol;
type Brand<K, T> = K & { readonly [__brand]: T };

// ============================================================================
// 識別符品牌類型 (Identifier Branded Types)
// ============================================================================

/** 用戶ID品牌類型 */
export type UserId = Brand<string, 'UserId'>;

/** 產品代碼品牌類型 */
export type ProductCode = Brand<string, 'ProductCode'>;

/** 訂單ID品牌類型 */
export type OrderId = Brand<string, 'OrderId'>;

/** GRN編號品牌類型 */
export type GRNNumber = Brand<string, 'GRNNumber'>;

/** 供應商ID品牌類型 */
export type SupplierId = Brand<string, 'SupplierId'>;

/** 位置ID品牌類型 */
export type LocationId = Brand<string, 'LocationId'>;

/** 會話ID品牌類型 */
export type SessionId = Brand<string, 'SessionId'>;

// ============================================================================
// 數值品牌類型 (Numeric Branded Types)
// ============================================================================

/** 重量品牌類型 (公克) */
export type Weight = Brand<number, 'Weight'>;

/** 數量品牌類型 */
export type Quantity = Brand<number, 'Quantity'>;

/** 價格品牌類型 (分) */
export type Price = Brand<number, 'Price'>;

/** 百分比品牌類型 */
export type Percentage = Brand<number, 'Percentage'>;

/** 溫度品牌類型 (攝氏度) */
export type Temperature = Brand<number, 'Temperature'>;

// ============================================================================
// 時間品牌類型 (Temporal Branded Types)
// ============================================================================

/** ISO 時間戳品牌類型 */
export type ISOTimestamp = Brand<string, 'ISOTimestamp'>;

/** Unix 時間戳品牌類型 */
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;

/** 持續時間品牌類型 (毫秒) */
export type Duration = Brand<number, 'Duration'>;

// ============================================================================
// 安全相關品牌類型 (Security Branded Types)
// ============================================================================

/** 加密字符串品牌類型 */
export type EncryptedString = Brand<string, 'EncryptedString'>;

/** 哈希值品牌類型 */
export type Hash = Brand<string, 'Hash'>;

/** JWT Token 品牌類型 */
export type JWTToken = Brand<string, 'JWTToken'>;

/** API Key 品牌類型 */
export type APIKey = Brand<string, 'APIKey'>;

// ============================================================================
// 格式化字符串品牌類型 (Formatted String Branded Types)
// ============================================================================

/** 電子郵件品牌類型 */
export type Email = Brand<string, 'Email'>;

/** 電話號碼品牌類型 */
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

/** URL 品牌類型 */
export type URL = Brand<string, 'URL'>;

/** IP 地址品牌類型 */
export type IPAddress = Brand<string, 'IPAddress'>;

// ============================================================================
// 品牌類型工廠函數 (Branded Type Factory Functions)
// ============================================================================

/** 創建用戶ID */
export const createUserId = (id: string): UserId => {
  if (!id || id.length === 0) {
    throw new Error('UserId cannot be empty');
  }
  return id as UserId;
};

/** 創建產品代碼 */
export const createProductCode = (code: string): ProductCode => {
  if (!code || code.length === 0) {
    throw new Error('ProductCode cannot be empty');
  }
  return code as ProductCode;
};

/** 創建重量 */
export const createWeight = (weight: number): Weight => {
  if (weight < 0) {
    throw new Error('Weight cannot be negative');
  }
  return weight as Weight;
};

/** 創建數量 */
export const createQuantity = (quantity: number): Quantity => {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  return quantity as Quantity;
};

/** 創建價格 (分) */
export const createPrice = (price: number): Price => {
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }
  return price as Price;
};

/** 創建百分比 */
export const createPercentage = (percentage: number): Percentage => {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return percentage as Percentage;
};

/** 創建電子郵件 */
export const createEmail = (email: string): Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email as Email;
};

/** 創建ISO時間戳 */
export const createISOTimestamp = (timestamp?: string | Date): ISOTimestamp => {
  const isoString =
    timestamp instanceof Date ? timestamp.toISOString() : timestamp || new Date().toISOString();
  return isoString as ISOTimestamp;
};

/** 創建持續時間 */
export const createDuration = (milliseconds: number): Duration => {
  if (milliseconds < 0) {
    throw new Error('Duration cannot be negative');
  }
  return milliseconds as Duration;
};

// ============================================================================
// 類型守衛函數 (Type Guard Functions)
// ============================================================================

/** 檢查是否為有效的用戶ID */
export const isUserId = (value: unknown): value is UserId => {
  return typeof value === 'string' && value.length > 0;
};

/** 檢查是否為有效的產品代碼 */
export const isProductCode = (value: unknown): value is ProductCode => {
  return typeof value === 'string' && value.length > 0;
};

/** 檢查是否為有效的重量 */
export const isWeight = (value: unknown): value is Weight => {
  return typeof value === 'number' && value >= 0;
};

/** 檢查是否為有效的數量 */
export const isQuantity = (value: unknown): value is Quantity => {
  return typeof value === 'number' && value >= 0;
};

/** 檢查是否為有效的價格 */
export const isPrice = (value: unknown): value is Price => {
  return typeof value === 'number' && value >= 0;
};

/** 檢查是否為有效的電子郵件 */
export const isEmail = (value: unknown): value is Email => {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// ============================================================================
// 類型轉換工具 (Type Conversion Utilities)
// ============================================================================

/** 安全地將字符串轉換為用戶ID */
export const toUserId = (value: string | null | undefined): UserId | null => {
  if (!value) return null;
  try {
    return createUserId(value);
  } catch {
    return null;
  }
};

/** 安全地將字符串轉換為產品代碼 */
export const toProductCode = (value: string | null | undefined): ProductCode | null => {
  if (!value) return null;
  try {
    return createProductCode(value);
  } catch {
    return null;
  }
};

/** 安全地將數字轉換為重量 */
export const toWeight = (value: number | null | undefined): Weight | null => {
  if (value === null || value === undefined) return null;
  try {
    return createWeight(value);
  } catch {
    return null;
  }
};

/** 安全地將數字轉換為數量 */
export const toQuantity = (value: number | null | undefined): Quantity | null => {
  if (value === null || value === undefined) return null;
  try {
    return createQuantity(value);
  } catch {
    return null;
  }
};

// ============================================================================
// 運行時驗證和強化 (Runtime Validation and Enhancement)
// ============================================================================

/**
 * 品牌類型驗證配置
 */
export interface BrandedTypeValidationConfig {
  enableRuntimeValidation: boolean;
  throwOnValidationError: boolean;
  logValidationErrors: boolean;
}

/** 默認驗證配置 */
export const DEFAULT_VALIDATION_CONFIG: BrandedTypeValidationConfig = {
  enableRuntimeValidation: true,
  throwOnValidationError: true,
  logValidationErrors: process.env.NODE_ENV === 'development',
};

/**
 * 品牌類型運行時驗證器
 */
export class BrandedTypeValidator {
  constructor(private config: BrandedTypeValidationConfig = DEFAULT_VALIDATION_CONFIG) {}

  /**
   * 驗證並創建品牌類型
   */
  validate<T extends Brand<unknown, unknown>>(
    value: unknown,
    guard: (value: unknown) => value is T,
    typeName: string
  ): T | null {
    if (!this.config.enableRuntimeValidation) {
      return value as T;
    }

    if (guard(value)) {
      return value;
    }

    const error = new Error(`Invalid ${typeName}: ${String(value)}`);

    if (this.config.logValidationErrors) {
      console.warn(`[BrandedTypeValidator] ${error.message}`);
    }

    if (this.config.throwOnValidationError) {
      throw error;
    }

    return null;
  }
}

/** 全局驗證器實例 */
export const brandedTypeValidator = new BrandedTypeValidator();

// ============================================================================
// 類型操作工具 (Type Operation Utilities)
// ============================================================================

/** 從品牌類型中提取原始值 */
export const unwrap = <T, B>(branded: Brand<T, B>): T => branded as unknown as T;

/** 品牌類型比較函數 */
export const equals = <T extends Brand<unknown, unknown>>(a: T, b: T): boolean => {
  return (
    (unwrap as <U, V>(branded: Brand<U, V>) => U)(a) ===
    (unwrap as <U, V>(branded: Brand<U, V>) => U)(b)
  );
};

/** 品牌類型排序函數 */
export const compare = <T extends Brand<string | number, unknown>>(a: T, b: T): number => {
  const aVal = (unwrap as <U extends string | number, V>(branded: Brand<U, V>) => U)(a);
  const bVal = (unwrap as <U extends string | number, V>(branded: Brand<U, V>) => U)(b);

  if (aVal < bVal) return -1;
  if (aVal > bVal) return 1;
  return 0;
};

// ============================================================================
// 類型組合器 (Type Combinators)
// ============================================================================

/** 可空品牌類型 */
export type Nullable<T extends Brand<unknown, unknown>> = T | null;

/** 可選品牌類型 */
export type Optional<T extends Brand<unknown, unknown>> = T | undefined;

/** 品牌類型數組 */
export type BrandedArray<T extends Brand<unknown, unknown>> = T[];

/** 品牌類型映射 */
export type BrandedMap<K extends string, V> = Map<K, V>;

/** 品牌類型記錄 */
export type BrandedRecord<K extends string, V> = Record<K, V>;
