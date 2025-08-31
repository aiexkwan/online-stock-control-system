/**
 * QC 標籤表單組件的共享類型定義
 *
 * 本模組提供了 QC 標籤表單系統中所有組件共用的 TypeScript 類型定義，
 * 確保整個系統的類型安全性和一致性。
 *
 * @author TypeScript Architect
 * @version 1.0.0
 */

/**
 * 產品資訊接口
 *
 * 定義產品的基本資訊結構，用於 QC 標籤生成過程中的產品數據管理。
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
 * Slate 詳細資訊接口
 *
 * 用於管理 Slate 相關的批次資訊。
 */
export interface SlateDetail {
  /** 批次號碼，用於追蹤產品批次 */
  readonly batchNumber: string;
}

/**
 * ACO 訂單詳細資訊接口
 *
 * 定義 ACO (Automated Customs Operations) 訂單的基本資訊結構。
 */
export interface AcoOrderDetail {
  /** ACO 訂單產品代碼 */
  readonly code: string;

  /** 訂單數量，以字符串格式儲存 */
  readonly qty: string;
}

/**
 * 進度狀態聯合類型
 *
 * 定義系統中各種操作的進度狀態。
 */
export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

/**
 * PDF 生成進度追蹤接口
 *
 * 用於追蹤 PDF 標籤生成過程的進度和狀態。
 */
export interface PdfProgress {
  /** 當前已完成的項目數量 */
  readonly current: number;

  /** 總項目數量 */
  readonly total: number;

  /** 各項目的狀態陣列 */
  readonly status: readonly ProgressStatus[];
}

/**
 * 錯誤資訊接口
 *
 * 統一的錯誤處理結構，提供詳細的錯誤資訊和上下文。
 */
export interface ErrorInfo {
  /** 錯誤代碼，用於程序化處理 */
  readonly code: string;

  /** 用戶友好的錯誤訊息 */
  readonly message: string;

  /** 詳細的錯誤描述，用於偵錯 */
  readonly details?: string;

  /** 錯誤發生的時間戳 */
  readonly timestamp: Date;
}

/**
 * 表單數據接口
 *
 * QC 標籤表單的完整數據結構，包含所有必要的欄位和狀態管理。
 * 使用 readonly 修飾符確保數據不可變性，提升類型安全性。
 */
export interface FormData {
  // === 基本產品資訊 ===

  /** 產品代碼，主要識別符 */
  readonly productCode: string;

  /** 完整的產品資訊，可能為空 */
  readonly productInfo: ProductInfo | null;

  /** 數量字串 */
  readonly quantity: string;

  /** 計數字串 */
  readonly count: string;

  /** 操作員識別符 */
  readonly operator: string;

  /** 用戶ID */
  readonly userId: string;

  // === ACO 相關欄位 ===

  /** ACO 訂單參考號 */
  readonly acoOrderRef: string;

  /** ACO 訂單詳細資訊陣列 */
  readonly acoOrderDetails: readonly AcoOrderDetail[];

  /** 是否為新的 ACO 參考號 */
  readonly acoNewRef: boolean;

  /** 新的 ACO 產品代碼 */
  readonly acoNewProductCode: string;

  /** 新的 ACO 訂單數量 */
  readonly acoNewOrderQty: string;

  // === Slate 相關欄位 ===

  /** Slate 詳細資訊 */
  readonly slateDetail: SlateDetail;

  // === 進度追蹤 ===

  /** PDF 生成進度 */
  readonly pdfProgress: PdfProgress;

  // === 加載狀態 ===

  /** 主要加載狀態 */
  readonly isLoading: boolean;

  /** ACO 搜索加載狀態 */
  readonly acoSearchLoading: boolean;

  // === 錯誤狀態 ===

  /** 產品相關錯誤 */
  readonly productError: ErrorInfo | null;

  /** ACO 訂單詳細資訊錯誤陣列 */
  readonly acoOrderDetailErrors: readonly string[];

  // === 其他狀態 ===

  /** ACO 剩餘數量 */
  readonly acoRemain: string | null;

  /** 可用的 ACO 訂單參考號陣列 */
  readonly availableAcoOrderRefs: readonly number[];
}

/**
 * 表單驗證結果接口
 *
 * 提供完整的表單驗證資訊，包含整體驗證狀態和詳細的欄位錯誤。
 */
export interface FormValidation {
  /** 整體表單是否有效 */
  readonly isValid: boolean;

  /** 通用錯誤訊息陣列 */
  readonly errors: readonly ErrorInfo[];

  /** 欄位特定錯誤映射 */
  readonly fieldErrors: Readonly<Record<string, ErrorInfo>>;
}

/**
 * 品牌類型：產品代碼
 *
 * 使用品牌類型確保產品代碼的類型安全性，防止與普通字符串混淆。
 */
export type ProductCode = string & { readonly __brand: 'ProductCode' };

/**
 * 品牌類型：用戶ID
 *
 * 使用品牌類型確保用戶ID的類型安全性。
 */
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * 品牌類型：數量
 *
 * 使用品牌類型確保數量的類型安全性和業務邏輯正確性。
 */
export type Quantity = string & { readonly __brand: 'Quantity' };

/**
 * 類型守護：檢查是否為有效的產品資訊
 *
 * @param value 待檢查的值
 * @returns 如果是有效的 ProductInfo 則返回 true
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
 * 類型守護：檢查是否為有效的錯誤資訊
 *
 * @param value 待檢查的值
 * @returns 如果是有效的 ErrorInfo 則返回 true
 */
export function isErrorInfo(value: unknown): value is ErrorInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ErrorInfo).code === 'string' &&
    typeof (value as ErrorInfo).message === 'string' &&
    (value as ErrorInfo).timestamp instanceof Date
  );
}
