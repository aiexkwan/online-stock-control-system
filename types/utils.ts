/**
 * 通用工具類型定義
 * 架構專家 - 全域類型工具集合
 */

/**
 * 深度部分類型 - 讓對象所有屬性都變成可選的
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必需類型 - 讓對象所有屬性都變成必需的
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 提取對象值的聯合類型
 */
export type ValueOf<T> = T[keyof T];

/**
 * 條件類型 - 根據條件選擇類型
 */
export type Conditional<T, U, V> = T extends U ? V : never;

/**
 * 非空類型 - 排除null和undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 函數參數類型提取
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never;

/**
 * 函數返回類型提取
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : any;

/**
 * 陣列元素類型提取
 */
export type ArrayElement<T extends ReadonlyArray<any>> =
  T extends ReadonlyArray<infer E> ? E : never;

/**
 * Promise解析類型提取
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

/**
 * 鍵值對映射類型
 */
export type KeyValuePair<K extends string | number | symbol, V> = {
  [P in K]: V;
};

/**
 * 擴展工具類型 - 合併兩個類型
 */
export type Extend<T, U> = T & U;

/**
 * 覆蓋工具類型 - U的屬性覆蓋T的屬性
 */
export type Override<T, U> = Omit<T, keyof U> & U;
