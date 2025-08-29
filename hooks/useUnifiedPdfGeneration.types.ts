/**
 * 統一 PDF 生成 Hook 類型聲明文件
 * 統一化 PDF 組件計劃 - 階段一任務3
 *
 * 定義 Hook 的完整類型系統，包括狀態、選項、返回值等
 * 確保類型安全和 IntelliSense 支援
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import type {
  PdfType,
  PdfConfig,
  PdfGenerationResult,
  BatchPdfResult,
} from '../lib/services/unified-pdf-service';
import type { QcLabelInputData, GrnLabelInputData } from '../lib/mappers/pdf-data-mappers';

// ============================================================================
// 核心狀態類型
// ============================================================================

/**
 * PDF 生成進度狀態
 */
export type PdfGenerationStatus = 'Processing' | 'Success' | 'Failed';

/**
 * Hook 進度信息接口
 */
export interface PdfGenerationProgress {
  /** 當前進度 */
  current: number;
  /** 總數 */
  total: number;
  /** 當前狀態 */
  status: PdfGenerationStatus;
  /** 進度消息 */
  message?: string;
}

/**
 * Hook 狀態接口
 */
export interface UnifiedPdfGenerationState {
  /** 是否正在生成中 */
  isGenerating: boolean;
  /** 是否正在上傳中 */
  isUploading: boolean;
  /** 當前進度信息 */
  progress: PdfGenerationProgress;
  /** 最後生成的結果 */
  lastResult: PdfGenerationResult | ExtendedBatchPdfResult | null;
  /** 錯誤信息 */
  error: string | null;
}

// ============================================================================
// 擴展的結果類型
// ============================================================================

/**
 * 擴展的批量 PDF 生成結果
 * 添加合併 PDF 支援
 */
export interface ExtendedBatchPdfResult extends BatchPdfResult {
  /** 合併後的 PDF Blob（如果啟用自動合併） */
  mergedBlob?: Blob;
}

// ============================================================================
// 輸入數據聯合類型
// ============================================================================

/**
 * PDF 輸入數據聯合類型
 */
export type PdfInputData = QcLabelInputData | GrnLabelInputData;

/**
 * 根據 PDF 類型確定輸入數據類型的條件類型
 */
export type InputDataForType<T extends PdfType> = T extends PdfType.QC_LABEL
  ? QcLabelInputData
  : T extends PdfType.GRN_LABEL
    ? GrnLabelInputData
    : never;

// ============================================================================
// 選項接口
// ============================================================================

/**
 * 基礎 PDF 生成選項
 */
export interface BasePdfOptions {
  /** PDF 配置覆蓋 */
  config?: Partial<PdfConfig>;
  /** 是否顯示成功提示（預設: true） */
  showSuccessToast?: boolean;
  /** 是否顯示錯誤提示（預設: true） */
  showErrorToast?: boolean;
}

/**
 * 單個 PDF 生成選項
 */
export interface SinglePdfOptions<T extends PdfType = PdfType> extends BasePdfOptions {
  /** PDF 類型 */
  type: T;
  /** 輸入數據 */
  data: InputDataForType<T>;
}

/**
 * 進度回調函數類型
 */
export type ProgressCallback = (
  current: number,
  total: number,
  status: PdfGenerationStatus,
  message?: string
) => void;

/**
 * 批量 PDF 生成選項
 */
export interface BatchPdfOptions<T extends PdfType = PdfType> extends BasePdfOptions {
  /** PDF 類型 */
  type: T;
  /** 輸入數據陣列 */
  dataArray: Array<InputDataForType<T>>;
  /** 進度回調函數 */
  onProgress?: ProgressCallback;
  /** 是否自動合併 PDF（預設: false） */
  autoMerge?: boolean;
}

// ============================================================================
// 驗證相關類型
// ============================================================================

/**
 * 數據驗證結果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤消息陣列 */
  errors: string[];
}

/**
 * 驗證函數類型
 */
export type ValidateInputFunction = (type: PdfType, data: any) => ValidationResult;

// ============================================================================
// Hook 返回值類型
// ============================================================================

/**
 * 單個 PDF 生成函數類型
 */
export type GenerateSingleFunction = <T extends PdfType>(
  options: SinglePdfOptions<T>
) => Promise<PdfGenerationResult>;

/**
 * 批量 PDF 生成函數類型
 */
export type GenerateBatchFunction = <T extends PdfType>(
  options: BatchPdfOptions<T>
) => Promise<ExtendedBatchPdfResult>;

/**
 * PDF 合併函數類型
 */
export type MergePdfsFunction = (blobs: Blob[]) => Promise<Blob>;

/**
 * 重置函數類型
 */
export type ResetFunction = () => void;

/**
 * 取消函數類型
 */
export type CancelFunction = () => void;

/**
 * Hook 返回值接口
 */
export interface UseUnifiedPdfGenerationReturn {
  /** 當前狀態 */
  state: UnifiedPdfGenerationState;
  /** 生成單個 PDF */
  generateSingle: GenerateSingleFunction;
  /** 批量生成 PDF */
  generateBatch: GenerateBatchFunction;
  /** 合併 PDF 文件 */
  mergePdfs: MergePdfsFunction;
  /** 重置狀態 */
  reset: ResetFunction;
  /** 取消當前操作 */
  cancel: CancelFunction;
  /** 驗證輸入數據 */
  validateInput: ValidateInputFunction;
}

// ============================================================================
// 配置類型
// ============================================================================

/**
 * Hook 配置選項
 */
export interface UnifiedPdfGenerationConfig {
  /** 是否啟用詳細日誌（預設: false） */
  enableVerboseLogging?: boolean;
  /** 預設成功提示設定（預設: true） */
  defaultShowSuccessToast?: boolean;
  /** 預設錯誤提示設定（預設: true） */
  defaultShowErrorToast?: boolean;
  /** 預設 PDF 配置 */
  defaultPdfConfig?: Partial<PdfConfig>;
  /** 操作超時時間（毫秒，預設: 30000） */
  operationTimeout?: number;
}

// ============================================================================
// 錯誤類型
// ============================================================================

/**
 * PDF 生成錯誤類型
 */
export class PdfGenerationError extends Error {
  constructor(
    message: string,
    public readonly type: 'validation' | 'generation' | 'upload' | 'merge' | 'cancelled',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

/**
 * 批量操作錯誤詳情
 */
export interface BatchOperationError {
  /** 錯誤發生的索引 */
  index: number;
  /** 錯誤消息 */
  message: string;
  /** 原始錯誤 */
  originalError?: Error;
  /** 相關的輸入數據 */
  inputData?: PdfInputData;
}

// ============================================================================
// 事件類型
// ============================================================================

/**
 * PDF 生成事件類型
 */
export type PdfGenerationEventType =
  | 'generation_started'
  | 'generation_progress'
  | 'generation_completed'
  | 'generation_failed'
  | 'generation_cancelled'
  | 'upload_started'
  | 'upload_completed'
  | 'upload_failed'
  | 'merge_started'
  | 'merge_completed'
  | 'merge_failed';

/**
 * PDF 生成事件數據
 */
export interface PdfGenerationEvent {
  /** 事件類型 */
  type: PdfGenerationEventType;
  /** 事件時間戳 */
  timestamp: Date;
  /** 相關的 PDF 類型 */
  pdfType?: PdfType;
  /** 事件數據 */
  data?: any;
  /** 錯誤信息（如果適用） */
  error?: Error;
}

// ============================================================================
// 實用類型
// ============================================================================

/**
 * 從聯合類型中提取特定類型的工具類型
 */
export type ExtractByType<T, U> = T extends { type: U } ? T : never;

/**
 * 可選化除特定鍵外的所有屬性
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * 深度部分類型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// 導出所有類型
// ============================================================================

export type {
  // 核心類型重新導出
  PdfType,
  PdfConfig,
  PdfGenerationResult,
  BatchPdfResult,
} from '../lib/services/unified-pdf-service';

export type {
  // 映射器類型重新導出
  QcLabelInputData,
  GrnLabelInputData,
  UnifiedPdfData,
} from '../lib/mappers/pdf-data-mappers';
