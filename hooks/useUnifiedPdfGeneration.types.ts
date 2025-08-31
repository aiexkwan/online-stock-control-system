/**
 * 統一 PDF 生成 Hook 類型聲明文件
 * 統一化 PDF 組件計劃 - 階段一任務3
 *
 * 定義 Hook 的完整類型系統，包括狀態、選項、返回值等
 * 確保類型安全和 IntelliSense 支援
 *
 * ## 主要類型分類
 * - **狀態類型**: `UnifiedPdfGenerationState`, `PdfGenerationProgress`
 * - **配置類型**: `SinglePdfOptions`, `BatchPdfOptions`, `PdfConfig`
 * - **數據類型**: `QcLabelInputData`, `GrnLabelInputData`
 * - **結果類型**: `PdfGenerationResult`, `ExtendedBatchPdfResult`
 * - **函數類型**: `GenerateSingleFunction`, `GenerateBatchFunction`
 *
 * ## 使用注意事項
 * - 所有類型都經過嚴格驗證以確保類型安全
 * - 支援泛型約束以提供更好的 IDE 支援
 * - 包含詳細的 JSDoc 註解以提供上下文幫助
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-08-31
 */

// ============================================================================
// 基礎列舉類型
// ============================================================================

/**
 * PDF 類型列舉
 *
 * 定義系統支援的所有 PDF 生成類型
 *
 * @example
 * ```typescript
 * // 使用 QC 標籤類型
 * const qcOptions = {
 *   type: PdfType.QC_LABEL,
 *   data: qcData
 * };
 *
 * // 使用 GRN 標籤類型
 * const grnOptions = {
 *   type: PdfType.GRN_LABEL,
 *   data: grnData
 * };
 * ```
 */
export enum PdfType {
  /** QC（品質控制）標籤 PDF */
  QC_LABEL = 'QC_LABEL',
  /** GRN（貨物收據）標籤 PDF */
  GRN_LABEL = 'GRN_LABEL',
  /** 報告類型 PDF（預留） */
  REPORT = 'REPORT',
  /** 自訂類型 PDF（預留） */
  CUSTOM = 'CUSTOM',
}

/**
 * PDF 配置接口
 *
 * 定義 PDF 生成的所有可配置選項，包括頁面設定、邊距和上傳行為
 *
 * @example
 * ```typescript
 * const config: PdfConfig = {
 *   type: PdfType.QC_LABEL,
 *   paperSize: 'A4',
 *   orientation: 'portrait',
 *   margin: {
 *     top: 20,
 *     right: 20,
 *     bottom: 20,
 *     left: 20
 *   },
 *   uploadEnabled: true
 * };
 * ```
 */
export interface PdfConfig {
  /** PDF 類型 */
  type: PdfType;
  /** 紙張大小（預設: A4） */
  paperSize?: 'A4' | 'A3' | 'Letter';
  /** 頁面方向（預設: portrait） */
  orientation?: 'portrait' | 'landscape';
  /** 頁面邊距設定（單位: 像素） */
  margin?: {
    /** 上邊距 */
    top?: number;
    /** 右邊距 */
    right?: number;
    /** 下邊距 */
    bottom?: number;
    /** 左邊距 */
    left?: number;
  };
  /** 是否啟用自動上傳（預設: false） */
  uploadEnabled?: boolean;
}

/**
 * PDF 生成結果接口
 *
 * 表示單個 PDF 生成操作的結果，包含成功狀態、生成的文件和可能的錯誤
 *
 * @example
 * ```typescript
 * const handleResult = (result: PdfGenerationResult) => {
 *   if (result.success) {
 *     console.log('生成成功');
 *     if (result.blob) {
 *       // 下載 PDF
 *       const url = URL.createObjectURL(result.blob);
 *       const a = document.createElement('a');
 *       a.href = url;
 *       a.download = 'label.pdf';
 *       a.click();
 *     }
 *     if (result.url) {
 *       // 顯示上傳後的 URL
 *       console.log('上傳 URL:', result.url);
 *     }
 *   } else {
 *     console.error('生成失敗:', result.error);
 *   }
 * };
 * ```
 */
export interface PdfGenerationResult {
  /** 操作是否成功 */
  success: boolean;
  /** 生成的 PDF Blob（如果成功且未上傳） */
  blob?: Blob;
  /** 上傳後的 PDF URL（如果啟用上傳且成功） */
  url?: string;
  /** 錯誤訊息（如果失敗） */
  error?: string;
  /** 額外的元數據信息 */
  metadata?: {
    /** 文件名稱 */
    fileName?: string;
    /** 文件大小（字節） */
    fileSize?: number;
    /** 生成耗時（毫秒） */
    generationTime?: number;
  };
}

export interface BatchPdfResult {
  success: boolean;
  results: PdfGenerationResult[];
  blobs: Blob[];
  uploadedUrls: string[];
  errors: string[];
}

// ============================================================================
// 輸入數據類型定義
// ============================================================================

/**
 * QC 標籤輸入數據接口
 *
 * 定義 QC（品質控制）標籤 PDF 生成所需的所有數據字段
 *
 * @example
 * ```typescript
 * const qcData: QcLabelInputData = {
 *   productCode: 'P001',
 *   productDescription: '產品描述',
 *   quantity: 100,
 *   series: 'S001',
 *   palletNum: 'PAL001',
 *   operatorClockNum: 'OP001',
 *   qcClockNum: 'QC001',
 *   workOrderNumber: 'WO001', // 可選
 *   workOrderName: '工作訂單名稱', // 可選
 *   productType: '產品類型' // 可選
 * };
 * ```
 */
export interface QcLabelInputData {
  /** 產品代碼（必須） */
  productCode: string;
  /** 產品描述（必須） */
  productDescription: string;
  /** 數量（必須） */
  quantity: number;
  /** 批次號（必須） */
  series: string;
  /** 托盤編號（必須） */
  palletNum: string;
  /** 操作員工號（必須） */
  operatorClockNum: string;
  /** QC 員工號（必須） */
  qcClockNum: string;
  /** 工作訂單號（可選） */
  workOrderNumber?: string;
  /** 工作訂單名稱（可選） */
  workOrderName?: string;
  /** 產品類型（可選） */
  productType?: string | null;
}

/**
 * GRN 標籤輸入數據接口
 *
 * 定義 GRN（貨物收據通知）標籤 PDF 生成所需的所有數據字段
 *
 * @example
 * ```typescript
 * const grnData: GrnLabelInputData = {
 *   grnNumber: 'GRN001',
 *   materialSupplier: '供應商A',
 *   productCode: 'P001',
 *   productDescription: '產品1',
 *   netWeight: 50.5,
 *   series: 'S001',
 *   palletNum: 'PAL001',
 *   receivedBy: 'USER001',
 *   productType: '原材料', // 可選
 *   labelMode: 'weight' // 可選，預設為 'qty'
 * };
 * ```
 */
export interface GrnLabelInputData {
  /** GRN 編號（必須） */
  grnNumber: string;
  /** 物料供應商（必須） */
  materialSupplier: string;
  /** 產品代碼（必須） */
  productCode: string;
  /** 產品描述（必須） */
  productDescription: string;
  /** 產品類型（可選） */
  productType?: string | null;
  /** 淨重量（必須） */
  netWeight: number;
  /** 批次號（必須） */
  series: string;
  /** 托盤編號（必須） */
  palletNum: string;
  /** 收貨人（必須） */
  receivedBy: string;
  /** 標籤模式：數量或重量（可選，預設: 'qty'） */
  labelMode?: 'qty' | 'weight';
}

// ============================================================================
// 核心狀態類型
// ============================================================================

/**
 * PDF 生成進度狀態
 *
 * 描述當前 PDF 生成操作的狀態
 *
 * @example
 * ```typescript
 * const handleProgressChange = (status: PdfGenerationStatus) => {
 *   switch (status) {
 *     case 'Processing':
 *       setProgressMessage('正在生成中...');
 *       break;
 *     case 'Success':
 *       setProgressMessage('生成成功！');
 *       break;
 *     case 'Failed':
 *       setProgressMessage('生成失敗');
 *       break;
 *   }
 * };
 * ```
 */
export type PdfGenerationStatus =
  /** 正在處理中 */
  | 'Processing'
  /** 處理成功 */
  | 'Success'
  /** 處理失敗 */
  | 'Failed';

/**
 * Hook 進度信息接口
 *
 * 提供詳細的 PDF 生成進度資訊，適用於單個和批量操作
 *
 * @example
 * ```typescript
 * const DisplayProgress = ({ progress }: { progress: PdfGenerationProgress }) => {
 *   const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
 *
 *   return (
 *     <div>
 *       <div>狀態: {progress.status}</div>
 *       <div>進度: {progress.current}/{progress.total} ({percentage.toFixed(1)}%)</div>
 *       {progress.message && <div>消息: {progress.message}</div>}
 *     </div>
 *   );
 * };
 * ```
 */
export interface PdfGenerationProgress {
  /** 當前已完成數量 */
  current: number;
  /** 總數量 */
  total: number;
  /** 當前狀態 */
  status: PdfGenerationStatus;
  /** 進度描述消息（可選） */
  message?: string;
}

/**
 * Hook 狀態接口
 *
 * 包含 PDF 生成 Hook 的完整狀態信息
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const { state } = useUnifiedPdfGeneration();
 *
 *   // 根據狀態渲染 UI
 *   if (state.isGenerating) {
 *     return (
 *       <div>
 *         <div>正在生成 PDF...</div>
 *         <progress
 *           value={state.progress.current}
 *           max={state.progress.total}
 *         />
 *         {state.progress.message && <div>{state.progress.message}</div>}
 *       </div>
 *     );
 *   }
 *
 *   if (state.error) {
 *     return <div>錯誤: {state.error}</div>;
 *   }
 *
 *   return <div>準備生成 PDF</div>;
 * };
 * ```
 */
export interface UnifiedPdfGenerationState {
  /** 是否正在生成 PDF */
  isGenerating: boolean;
  /** 是否正在上傳文件 */
  isUploading: boolean;
  /** 當前操作的進度信息 */
  progress: PdfGenerationProgress;
  /** 最後一次操作的結果 */
  lastResult: PdfGenerationResult | ExtendedBatchPdfResult | null;
  /** 最後發生的錯誤信息 */
  error: string | null;
}

// ============================================================================
// 擴展的結果類型
// ============================================================================

/**
 * 擴展的批量 PDF 生成結果
 *
 * 在基礎批量結果上添加合併 PDF 支援和詳細統計信息
 *
 * @example
 * ```typescript
 * const handleBatchResult = (result: ExtendedBatchPdfResult) => {
 *   console.log(`成功: ${result.successful}, 失敗: ${result.failed}`);
 *
 *   if (result.mergedBlob) {
 *     // 下載合併的 PDF
 *     const url = URL.createObjectURL(result.mergedBlob);
 *     const a = document.createElement('a');
 *     a.href = url;
 *     a.download = `batch-labels-${Date.now()}.pdf`;
 *     a.click();
 *     URL.revokeObjectURL(url);
 *   } else {
 *     // 逐個處理生成的 PDF
 *     result.blobs.forEach((blob, index) => {
 *       const url = URL.createObjectURL(blob);
 *       const a = document.createElement('a');
 *       a.href = url;
 *       a.download = `label-${index + 1}.pdf`;
 *       a.click();
 *       URL.revokeObjectURL(url);
 *     });
 *   }
 * };
 * ```
 */
export interface ExtendedBatchPdfResult extends BatchPdfResult {
  /** 合併後的 PDF Blob（啟用 autoMerge 時提供） */
  mergedBlob?: Blob;
  /** 成功生成的數量 */
  successful: number;
  /** 生成失敗的數量 */
  failed: number;
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
 *
 * 表示輸入數據驗證的結果，包含有效性狀態和詳細錯誤信息
 *
 * @example
 * ```typescript
 * const { validateInput } = useUnifiedPdfGeneration();
 *
 * const handleValidation = (data: QcLabelInputData) => {
 *   const validation = validateInput(PdfType.QC_LABEL, data);
 *
 *   if (!validation.isValid) {
 *     // 顯示驗證錯誤
 *     validation.errors.forEach(error => {
 *       console.error('驗證錯誤:', error);
 *     });
 *     return false;
 *   }
 *
 *   return true;
 * };
 * ```
 */
export interface ValidationResult {
  /** 數據是否通過驗證 */
  isValid: boolean;
  /** 驗證失敗的詳細錯誤信息陣列 */
  errors: string[];
}

/**
 * 驗證函數類型
 */
export type ValidateInputFunction = (
  type: PdfType,
  data: QcLabelInputData | GrnLabelInputData | Record<string, unknown>
) => ValidationResult;

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
 *
 * 定義 Hook 的全域配置選項，用於自訂預設行為
 *
 * @example
 * ```typescript
 * const config: UnifiedPdfGenerationConfig = {
 *   enableVerboseLogging: process.env.NODE_ENV === 'development',
 *   defaultShowSuccessToast: true,
 *   defaultShowErrorToast: true,
 *   defaultPdfConfig: {
 *     paperSize: 'A4',
 *     orientation: 'portrait',
 *     uploadEnabled: false
 *   },
 *   operationTimeout: 60000 // 60 秒
 * };
 * ```
 */
export interface UnifiedPdfGenerationConfig {
  /** 是否啟用詳細控制台日誌（預設: false） */
  enableVerboseLogging?: boolean;
  /** 預設是否顯示成功提示（預設: true） */
  defaultShowSuccessToast?: boolean;
  /** 預設是否顯示錯誤提示（預設: true） */
  defaultShowErrorToast?: boolean;
  /** 預設 PDF 配置選項 */
  defaultPdfConfig?: Partial<PdfConfig>;
  /** 操作超時時間（毫秒，預設: 30000） */
  operationTimeout?: number;
}

// ============================================================================
// 錯誤類型
// ============================================================================

/**
 * PDF 生成錯誤類型
 *
 * 自訂錯誤類型，用於分類不同類型的 PDF 生成錯誤
 *
 * @example
 * ```typescript
 * try {
 *   await generateSingle(options);
 * } catch (error) {
 *   if (error instanceof PdfGenerationError) {
 *     switch (error.type) {
 *       case 'validation':
 *         console.error('數據驗證失敗:', error.message);
 *         break;
 *       case 'generation':
 *         console.error('PDF 生成失敗:', error.message);
 *         break;
 *       case 'upload':
 *         console.error('文件上傳失敗:', error.message);
 *         break;
 *       case 'merge':
 *         console.error('PDF 合併失敗:', error.message);
 *         break;
 *       case 'cancelled':
 *         console.log('操作已取消');
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export class PdfGenerationError extends Error {
  constructor(
    message: string,
    /** 錯誤類型分類 */
    public readonly type: 'validation' | 'generation' | 'upload' | 'merge' | 'cancelled',
    /** 原始錯誤對象（如果有） */
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
  data?: Record<string, unknown>;
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
// 額外通用類型與導出
// ============================================================================

// 額外通用類型
export interface UnifiedPdfData {
  type: PdfType;
  data: QcLabelInputData | GrnLabelInputData;
  config?: Partial<PdfConfig>;
}

// 所有核心類型已在文件頂部直接定義，無需重複導出
