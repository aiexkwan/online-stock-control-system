/**
 * 統一共用類型定義 (Unified Shared Type Definitions)
 *
 * 此文件定義了系統中廣泛使用的統一類型定義，確保類型一致性和可維護性。
 * 所有類型遵循 TypeScript 最佳實踐，使用 readonly 修飾符確保不可變性。
 *
 * @file /types/shared/index.ts
 * @author TypeScript Architecture Expert
 * @since 2025-09-02
 */

// ============================================================================
// 產品相關類型 (Product Related Types)
// ============================================================================

/**
 * 統一的產品資訊介面
 *
 * 此介面整合了系統中各處使用的產品資訊結構，提供統一的產品資料模型。
 * 所有字段都使用 readonly 修飾符以確保資料的不可變性。
 *
 * @example
 * ```typescript
 * const product: ProductInfo = {
 *   code: 'P001',
 *   description: '高品質零件',
 *   standard_qty: '100',
 *   type: 'COMPONENT',
 *   remark: '特殊處理要求'
 * };
 * ```
 */
export interface ProductInfo {
  /** 產品代碼，唯一識別符 */
  readonly code: string;

  /** 產品描述或名稱 */
  readonly description: string;

  /** 標準數量，以字符串格式儲存以支持小數和特殊格式 */
  readonly standard_qty: string;

  /** 產品類型或分類 */
  readonly type: string;

  /** 可選的備註資訊 */
  readonly remark?: string;
}

/**
 * 可變版本的 ProductInfo
 *
 * 用於需要修改產品資訊的場景，例如表單編輯或資料更新。
 *
 * @example
 * ```typescript
 * const editableProduct: MutableProductInfo = {
 *   code: 'P001',
 *   description: '可編輯的產品描述',
 *   standard_qty: '150',
 *   type: 'COMPONENT'
 * };
 * editableProduct.description = '更新後的描述';
 * ```
 */
export type MutableProductInfo = {
  -readonly [K in keyof ProductInfo]: ProductInfo[K];
};

/**
 * 擴展的產品資訊介面
 *
 * 包含更多產品相關的詳細資訊，用於完整的產品管理場景。
 */
export interface ExtendedProductInfo extends ProductInfo {
  /** 中文描述 */
  readonly chineseDescription?: string;

  /** 產品顏色 */
  readonly colour?: string;

  /** 標準數量（數字格式） */
  readonly standardQty?: number;

  /** 總棧板數 */
  readonly totalPallets?: number;

  /** 活動棧板數 */
  readonly activePallets?: number;
}

// ============================================================================
// 圖表資料類型 (Chart Data Types)
// ============================================================================

/**
 * 統一的圖表資料點介面
 *
 * 用於各種圖表組件的資料結構，確保圖表資料的一致性。
 *
 * @example
 * ```typescript
 * const chartData: ChartDataPoint[] = [
 *   {
 *     date: '2025-09-01',
 *     stockCode: 'P001',
 *     stockLevel: 150
 *   },
 *   {
 *     date: '2025-09-02',
 *     stockCode: 'P001',
 *     stockLevel: 120
 *   }
 * ];
 * ```
 */
export interface ChartDataPoint {
  /** 資料日期，ISO 字符串格式 */
  readonly date: string;

  /** 相關的庫存代碼或產品代碼 */
  readonly stockCode: string;

  /** 庫存水平或其他數值資料 */
  readonly stockLevel: number;
}

/**
 * 可變版本的 ChartDataPoint
 *
 * 用於圖表資料的動態更新場景。
 */
export type MutableChartDataPoint = {
  -readonly [K in keyof ChartDataPoint]: ChartDataPoint[K];
};

/**
 * 多系列圖表資料點
 *
 * 支援多個數據系列的圖表場景。
 */
export interface MultiSeriesChartDataPoint {
  /** 資料日期，ISO 字符串格式 */
  readonly date: string;

  /** 資料值映射，鍵為系列名稱，值為對應數值 */
  readonly [seriesName: string]: string | number;
}

// ============================================================================
// 表單資料類型 (Form Data Types)
// ============================================================================

/**
 * 基礎表單資料介面
 *
 * 定義所有表單共用的基本結構和驗證狀態。
 */
export interface BaseFormData {
  /** 表單是否正在提交 */
  readonly isSubmitting: boolean;

  /** 表單驗證錯誤 */
  readonly errors: Readonly<Record<string, string>>;

  /** 表單是否已修改 */
  readonly isDirty: boolean;

  /** 表單是否有效 */
  readonly isValid: boolean;
}

/**
 * 可變版本的基礎表單資料
 */
export type MutableBaseFormData = {
  -readonly [K in keyof BaseFormData]: BaseFormData[K] extends Readonly<infer U>
    ? U extends Record<string, string>
      ? Record<string, string>
      : BaseFormData[K]
    : BaseFormData[K];
};

/**
 * 登入表單資料介面
 *
 * 統一的使用者登入表單資料結構。
 */
export interface LoginFormData extends BaseFormData {
  /** 使用者名稱或電子郵件 */
  readonly username: string;

  /** 密碼 */
  readonly password: string;

  /** 記住我選項 */
  readonly rememberMe: boolean;
}

/**
 * 可變版本的登入表單資料
 */
export type MutableLoginFormData = {
  -readonly [K in keyof LoginFormData]: LoginFormData[K] extends Readonly<infer U>
    ? U extends Record<string, string>
      ? Record<string, string>
      : LoginFormData[K]
    : LoginFormData[K];
};

// ============================================================================
// API 響應類型 (API Response Types)
// ============================================================================

/**
 * 統一的 API 響應介面
 *
 * 所有 API 端點的標準響應格式，確保響應結構的一致性。
 *
 * @template T - 響應資料的類型
 */
export interface ApiResponse<T = unknown> {
  /** 請求是否成功 */
  readonly success: boolean;

  /** 響應資料 */
  readonly data: T;

  /** 錯誤訊息（如果有的話） */
  readonly message?: string;

  /** 錯誤代碼（如果有的話） */
  readonly errorCode?: string;

  /** 請求的時間戳記 */
  readonly timestamp: string;
}

/**
 * 分頁響應資料介面
 *
 * 用於包含分頁資訊的 API 響應。
 *
 * @template T - 分頁項目的類型
 */
export interface PaginatedResponse<T = unknown> {
  /** 當前頁面的項目 */
  readonly items: readonly T[];

  /** 總項目數 */
  readonly totalCount: number;

  /** 當前頁碼（從 1 開始） */
  readonly currentPage: number;

  /** 每頁項目數 */
  readonly pageSize: number;

  /** 總頁數 */
  readonly totalPages: number;

  /** 是否有下一頁 */
  readonly hasNextPage: boolean;

  /** 是否有上一頁 */
  readonly hasPreviousPage: boolean;
}

// ============================================================================
// 錯誤處理類型 (Error Handling Types)
// ============================================================================

/**
 * 統一的錯誤介面
 *
 * 系統中所有錯誤的標準結構。
 */
export interface SystemError {
  /** 錯誤代碼 */
  readonly code: string;

  /** 錯誤訊息 */
  readonly message: string;

  /** 錯誤詳細資訊 */
  readonly details?: string;

  /** 錯誤發生的時間戳記 */
  readonly timestamp: string;

  /** 錯誤嚴重性級別 */
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * 驗證錯誤介面
 *
 * 專門用於表單或資料驗證的錯誤。
 */
export interface ValidationError extends SystemError {
  /** 驗證失敗的欄位名稱 */
  readonly field: string;

  /** 驗證規則 */
  readonly rule: string;

  /** 實際值 */
  readonly actualValue?: unknown;

  /** 期望值或格式 */
  readonly expectedValue?: unknown;
}

// ============================================================================
// 工具類型 (Utility Types)
// ============================================================================

/**
 * 深度 Readonly 類型
 *
 * 遞迴地將物件的所有屬性設為 readonly。
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度可變類型
 *
 * 遞迴地移除物件的所有 readonly 修飾符。
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

/**
 * 選擇性深度 Partial 類型
 *
 * 遞迴地將物件的所有屬性設為可選。
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 非空值類型
 *
 * 從類型中排除 null 和 undefined。
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 提取陣列元素類型
 *
 * 從陣列類型中提取元素類型。
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// ============================================================================
// 狀態管理類型 (State Management Types)
// ============================================================================

/**
 * 異步狀態介面
 *
 * 用於管理異步操作的狀態，如 API 請求。
 *
 * @template T - 資料類型
 * @template E - 錯誤類型
 */
export interface AsyncState<T = unknown, E = SystemError> {
  /** 資料 */
  readonly data: T | null;

  /** 載入狀態 */
  readonly loading: boolean;

  /** 錯誤資訊 */
  readonly error: E | null;

  /** 最後更新時間 */
  readonly lastUpdated: string | null;
}

/**
 * 可變版本的異步狀態
 */
export type MutableAsyncState<T = unknown, E = SystemError> = {
  -readonly [K in keyof AsyncState<T, E>]: AsyncState<T, E>[K];
};

// ============================================================================
// 事件類型 (Event Types)
// ============================================================================

/**
 * 系統事件介面
 *
 * 用於系統內部事件的統一結構。
 */
export interface SystemEvent<T = unknown> {
  /** 事件類型 */
  readonly type: string;

  /** 事件資料 */
  readonly payload: T;

  /** 事件時間戳記 */
  readonly timestamp: string;

  /** 事件來源 */
  readonly source: string;

  /** 事件 ID */
  readonly id: string;
}

// ============================================================================
// 類型守衛函數 (Type Guard Functions)
// ============================================================================

/**
 * 檢查值是否為 ProductInfo
 */
export function isProductInfo(value: unknown): value is ProductInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ProductInfo).code === 'string' &&
    typeof (value as ProductInfo).description === 'string' &&
    typeof (value as ProductInfo).standard_qty === 'string' &&
    typeof (value as ProductInfo).type === 'string'
  );
}

/**
 * 檢查值是否為 ChartDataPoint
 */
export function isChartDataPoint(value: unknown): value is ChartDataPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ChartDataPoint).date === 'string' &&
    typeof (value as ChartDataPoint).stockCode === 'string' &&
    typeof (value as ChartDataPoint).stockLevel === 'number'
  );
}

/**
 * 檢查 API 響應是否成功
 */
export function isSuccessfulApiResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

// ============================================================================
// 工廠函數 (Factory Functions)
// ============================================================================

/**
 * 創建空的異步狀態
 */
export function createEmptyAsyncState<T = unknown, E = SystemError>(): AsyncState<T, E> {
  return {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  };
}

/**
 * 創建載入中的異步狀態
 */
export function createLoadingAsyncState<T = unknown, E = SystemError>(): AsyncState<T, E> {
  return {
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  };
}

/**
 * 創建成功的異步狀態
 */
export function createSuccessAsyncState<T = unknown, E = SystemError>(data: T): AsyncState<T, E> {
  return {
    data,
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 創建錯誤的異步狀態
 */
export function createErrorAsyncState<T = unknown, E = SystemError>(error: E): AsyncState<T, E> {
  return {
    data: null,
    loading: false,
    error,
    lastUpdated: new Date().toISOString(),
  };
}
