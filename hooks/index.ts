/**
 * 統一 PDF 生成 Hook 導出文件
 * 統一化 PDF 組件計劃 - 階段一任務3
 *
 * 統一導出所有相關的 Hook、類型和工具函數
 *
 * @author AI Assistant
 * @version 1.0.0
 */

// ============================================================================
// 主要 Hook 導出
// ============================================================================

export { useUnifiedPdfGeneration, type ExtendedBatchPdfResult } from './useUnifiedPdfGeneration';

// ============================================================================
// 類型定義導出
// ============================================================================

export type {
  // 狀態類型
  PdfGenerationStatus,
  PdfGenerationProgress,
  UnifiedPdfGenerationState,

  // 輸入數據類型
  PdfInputData,
  InputDataForType,

  // 選項類型
  BasePdfOptions,
  SinglePdfOptions,
  BatchPdfOptions,
  ProgressCallback,

  // 驗證類型
  ValidationResult,
  ValidateInputFunction,

  // 函數類型
  GenerateSingleFunction,
  GenerateBatchFunction,
  MergePdfsFunction,
  ResetFunction,
  CancelFunction,
  UseUnifiedPdfGenerationReturn,

  // 配置類型
  UnifiedPdfGenerationConfig,

  // 錯誤類型
  BatchOperationError,

  // 事件類型
  PdfGenerationEventType,
  PdfGenerationEvent,

  // 實用類型
  ExtractByType,
  PartialExcept,
  DeepPartial,

  // 重新導出的核心類型
  PdfType,
  PdfConfig,
  PdfGenerationResult,
  BatchPdfResult,
  QcLabelInputData,
  GrnLabelInputData,
  UnifiedPdfData,
} from './useUnifiedPdfGeneration.types';

// ============================================================================
// 錯誤類導出
// ============================================================================

export { PdfGenerationError } from './useUnifiedPdfGeneration.types';

// ============================================================================
// 常量導出
// ============================================================================

/**
 * 預設配置常量
 */
export const DEFAULT_PDF_GENERATION_CONFIG = {
  enableVerboseLogging: false,
  defaultShowSuccessToast: true,
  defaultShowErrorToast: true,
  operationTimeout: 30000, // 30 秒
} as const;

/**
 * PDF 生成狀態常量
 */
export const PDF_GENERATION_STATES = {
  PROCESSING: 'Processing' as const,
  SUCCESS: 'Success' as const,
  FAILED: 'Failed' as const,
};

/**
 * 支援的 PDF 類型常量
 */
export const SUPPORTED_PDF_TYPES = {
  QC_LABEL: 'QC_LABEL' as const,
  GRN_LABEL: 'GRN_LABEL' as const,
};

// ============================================================================
// 工具函數導出（如果需要的話）
// ============================================================================

/**
 * 創建空的進度狀態
 */
export const createEmptyProgress = () => ({
  current: 0,
  total: 0,
  status: PDF_GENERATION_STATES.PROCESSING,
});

/**
 * 創建初始狀態
 */
export const createInitialState = () => ({
  isGenerating: false,
  isUploading: false,
  progress: createEmptyProgress(),
  lastResult: null,
  error: null,
});

// ============================================================================
// 重新導出核心服務（便於訪問）
// ============================================================================

export { unifiedPdfService } from '../lib/services/unified-pdf-service';

export {
  validateQcLabelInput,
  validateGrnLabelInput,
  prepareQcLabelData,
  prepareGrnLabelData,
} from '../lib/mappers/pdf-data-mappers';

// ============================================================================
// 版本信息
// ============================================================================

export const HOOK_VERSION = '1.0.0';
export const LAST_UPDATED = '2025-08-28';
