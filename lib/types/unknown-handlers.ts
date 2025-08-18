/**
 * Phase 6.1 Week 3: Unknown 類型處理模式 - 重新導出
 * 策略 4: unknown + type narrowing - 安全的未知類型處理
 * 
 * 此檔案現在重新導出 types/external/unknown-handlers.ts 的所有功能
 * 以保持向後相容性並避免重複代碼
 */

// 重新導出所有功能
export { UnknownTypeHandler } from '../../types/external/unknown-handlers';

// 重新導出基本類型檢查函數
export {
  isNull,
  isUndefined,
  isNullish,
  isPrimitive,
  isFunction,
  isSymbol,
  isBigInt,
  isPlainObject,
  isEmptyObject,
  hasOwnProperty,
  isNonEmptyArray,
  isArrayOf,
} from '../../types/external/unknown-handlers';

// 重新導出安全轉換函數
export {
  toSafeString,
  toSafeNumber,
  toSafeBoolean,
  toSafeArray,
  toSafeObject,
} from '../../types/external/unknown-handlers';

// 重新導出深度處理函數
export {
  deepClone,
  deepEquals,
  safeExecute,
  safeAsync,
} from '../../types/external/unknown-handlers';

// 重新導出 JSON 處理函數
export {
  safeJsonParse,
  safeJsonStringify,
} from '../../types/external/unknown-handlers';

// 重新導出屬性訪問函數
export {
  safeGet,
  safeSet,
} from '../../types/external/unknown-handlers';

// 重新導出集合操作
export {
  unique,
  groupBy,
} from '../../types/external/unknown-handlers';

// 重新導出類型斷言函數
export {
  assertIsString,
  assertIsNumber,
  assertIsObject,
  assertIsArray,
} from '../../types/external/unknown-handlers';