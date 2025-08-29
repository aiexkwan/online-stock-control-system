/**
 * 統一 PDF 生成 Hook
 * 統一化 PDF 組件計劃 - 階段一任務3
 *
 * 作為前端組件與統一 PDF 服務之間的橋樑，提供完整的 PDF 生成功能
 * 包括進度追蹤、錯誤處理、批量處理等核心能力
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  unifiedPdfService,
  PdfType,
  type PdfConfig,
  type PdfGenerationResult,
  type BatchPdfResult,
} from '../lib/services/unified-pdf-service';
import {
  type QcLabelInputData,
  type GrnLabelInputData,
  validateQcLabelInput,
  validateGrnLabelInput,
} from '../lib/mappers/pdf-data-mappers';

// ============================================================================
// 類型定義
// ============================================================================

/**
 * Hook 狀態接口
 */
export interface UnifiedPdfGenerationState {
  /** 是否正在處理中 */
  isGenerating: boolean;
  /** 是否正在上傳中 */
  isUploading: boolean;
  /** 當前進度信息 */
  progress: {
    current: number;
    total: number;
    status: 'Processing' | 'Success' | 'Failed';
    message?: string;
  };
  /** 最後生成的結果 */
  lastResult: PdfGenerationResult | ExtendedBatchPdfResult | null;
  /** 錯誤信息 */
  error: string | null;
}

/**
 * 單個 PDF 生成選項
 */
export interface SinglePdfOptions {
  /** PDF 類型 */
  type: PdfType.QC_LABEL | PdfType.GRN_LABEL;
  /** 輸入數據 */
  data: QcLabelInputData | GrnLabelInputData;
  /** PDF 配置覆蓋 */
  config?: Partial<PdfConfig>;
  /** 是否顯示成功提示 */
  showSuccessToast?: boolean;
  /** 是否顯示錯誤提示 */
  showErrorToast?: boolean;
}

/**
 * 批量 PDF 生成選項
 */
export interface BatchPdfOptions {
  /** PDF 類型 */
  type: PdfType.QC_LABEL | PdfType.GRN_LABEL;
  /** 輸入數據陣列 */
  dataArray: Array<QcLabelInputData | GrnLabelInputData>;
  /** PDF 配置覆蓋 */
  config?: Partial<PdfConfig>;
  /** 進度回調函數 */
  onProgress?: (
    current: number,
    total: number,
    status: 'Processing' | 'Success' | 'Failed',
    message?: string
  ) => void;
  /** 是否顯示成功提示 */
  showSuccessToast?: boolean;
  /** 是否顯示錯誤提示 */
  showErrorToast?: boolean;
  /** 是否自動合併 PDF */
  autoMerge?: boolean;
}

/**
 * Hook 返回值接口
 */
export interface UseUnifiedPdfGenerationReturn {
  /** 當前狀態 */
  state: UnifiedPdfGenerationState;
  /** 生成單個 PDF */
  generateSingle: (options: SinglePdfOptions) => Promise<PdfGenerationResult>;
  /** 批量生成 PDF */
  generateBatch: (options: BatchPdfOptions) => Promise<ExtendedBatchPdfResult>;
  /** 合併 PDF 文件 */
  mergePdfs: (blobs: Blob[]) => Promise<Blob>;
  /** 重置狀態 */
  reset: () => void;
  /** 取消當前操作 */
  cancel: () => void;
  /** 驗證輸入數據 */
  validateInput: (type: PdfType, data: any) => { isValid: boolean; errors: string[] };
}

// ============================================================================
// 初始狀態
// ============================================================================

const initialState: UnifiedPdfGenerationState = {
  isGenerating: false,
  isUploading: false,
  progress: {
    current: 0,
    total: 0,
    status: 'Processing',
  },
  lastResult: null,
  error: null,
};

// ============================================================================
// 主要 Hook 實現
// ============================================================================

/**
 * 統一 PDF 生成 Hook
 *
 * 提供完整的 PDF 生成功能，包括：
 * - 單個 PDF 生成
 * - 批量 PDF 生成
 * - 進度追蹤
 * - 錯誤處理
 * - 數據驗證
 * - 狀態管理
 *
 * @returns Hook 返回值對象
 */
export const useUnifiedPdfGeneration = (): UseUnifiedPdfGenerationReturn => {
  // ============================================================================
  // 狀態管理
  // ============================================================================

  const [state, setState] = useState<UnifiedPdfGenerationState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // ============================================================================
  // 生命週期管理
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 取消任何進行中的操作
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounting');
        abortControllerRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // 輔助函數
  // ============================================================================

  /**
   * 安全更新狀態（檢查組件是否已卸載）
   */
  const safeSetState = useCallback(
    (
      updater:
        | Partial<UnifiedPdfGenerationState>
        | ((prevState: UnifiedPdfGenerationState) => UnifiedPdfGenerationState)
    ) => {
      if (isMountedRef.current) {
        if (typeof updater === 'function') {
          setState(updater);
        } else {
          setState(prevState => ({ ...prevState, ...updater }));
        }
      }
    },
    []
  );

  /**
   * 記錄操作日誌
   */
  const logOperation = useCallback((operation: string, data?: any) => {
    console.log(`[UnifiedPdfGeneration] ${operation}`, data || '');
  }, []);

  /**
   * 創建新的 AbortController
   */
  const createAbortController = useCallback(() => {
    // 取消之前的操作
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New operation starting');
    }

    // 創建新的控制器
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // ============================================================================
  // 數據驗證函數
  // ============================================================================

  /**
   * 驗證輸入數據
   */
  const validateInput = useCallback(
    (type: PdfType, data: any): { isValid: boolean; errors: string[] } => {
      switch (type) {
        case PdfType.QC_LABEL:
          return validateQcLabelInput(data);
        case PdfType.GRN_LABEL:
          return validateGrnLabelInput(data);
        default:
          return { isValid: false, errors: [`Unsupported PDF type: ${type}`] };
      }
    },
    []
  );

  // ============================================================================
  // 核心生成函數
  // ============================================================================

  /**
   * 生成單個 PDF
   */
  const generateSingle = useCallback(
    async (options: SinglePdfOptions): Promise<PdfGenerationResult> => {
      const { type, data, config, showSuccessToast = true, showErrorToast = true } = options;

      logOperation('Starting single PDF generation', { type });

      // 創建 AbortController
      const controller = createAbortController();
      const signal = controller.signal;

      try {
        // 重置狀態
        safeSetState({
          isGenerating: true,
          isUploading: false,
          progress: {
            current: 0,
            total: 1,
            status: 'Processing',
            message: 'Preparing PDF generation...',
          },
          error: null,
          lastResult: null,
        });

        // 檢查操作是否已被取消
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        // 驗證輸入數據
        const validation = validateInput(type, data);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // 更新進度：開始生成
        safeSetState({
          progress: { current: 0, total: 1, status: 'Processing', message: 'Generating PDF...' },
        });

        // 生成 PDF
        const result = await unifiedPdfService.generateSingle(type, data, config);

        // 檢查操作是否已被取消
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        // 更新狀態
        if (result.success) {
          safeSetState({
            isGenerating: false,
            progress: {
              current: 1,
              total: 1,
              status: 'Success',
              message: 'PDF generated successfully',
            },
            lastResult: result,
          });

          if (showSuccessToast) {
            const fileName = result.metadata?.fileName || 'PDF';
            const message = result.url
              ? `${fileName} generated and uploaded successfully`
              : `${fileName} generated successfully`;
            toast.success(message);
          }

          logOperation('Single PDF generation completed', { fileName: result.metadata?.fileName });
        } else {
          throw new Error(result.error || 'PDF generation failed');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        safeSetState({
          isGenerating: false,
          progress: { current: 0, total: 1, status: 'Failed', message: errorMessage },
          error: errorMessage,
        });

        if (showErrorToast && !errorMessage.includes('cancelled')) {
          toast.error(`PDF generation failed: ${errorMessage}`);
        }

        logOperation('Single PDF generation failed', { error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [safeSetState, logOperation, createAbortController, validateInput]
  );

  /**
   * 批量生成 PDF
   */
  const generateBatch = useCallback(
    async (options: BatchPdfOptions): Promise<ExtendedBatchPdfResult> => {
      const {
        type,
        dataArray,
        config,
        onProgress,
        showSuccessToast = true,
        showErrorToast = true,
        autoMerge = false,
      } = options;

      logOperation('Starting batch PDF generation', { type, count: dataArray.length, autoMerge });

      // 創建 AbortController
      const controller = createAbortController();
      const signal = controller.signal;

      try {
        // 重置狀態
        safeSetState({
          isGenerating: true,
          isUploading: false,
          progress: {
            current: 0,
            total: dataArray.length,
            status: 'Processing',
            message: 'Preparing batch generation...',
          },
          error: null,
          lastResult: null,
        });

        // 檢查操作是否已被取消
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        // 驗證所有輸入數據
        for (let i = 0; i < dataArray.length; i++) {
          const validation = validateInput(type, dataArray[i]);
          if (!validation.isValid) {
            throw new Error(`Validation failed for item ${i + 1}: ${validation.errors.join(', ')}`);
          }
        }

        // 進度回調包裝器
        const progressCallback = (
          current: number,
          total: number,
          status: 'Processing' | 'Success' | 'Failed'
        ) => {
          const message =
            status === 'Processing'
              ? `Processing PDF ${current}/${total}...`
              : status === 'Success'
                ? `PDF ${current} generated successfully`
                : `PDF ${current} generation failed`;

          safeSetState({
            progress: { current, total, status, message },
          });

          // 調用外部進度回調
          if (onProgress) {
            onProgress(current, total, status, message);
          }
        };

        // 批量生成 PDF
        const result = await unifiedPdfService.generateBatch(
          type,
          dataArray,
          config,
          progressCallback
        );

        // 檢查操作是否已被取消
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        // 自動合併 PDF（如果啟用且有多個 PDF）
        let mergedBlob: Blob | null = null;
        if (autoMerge && result.blobs.length > 1) {
          safeSetState({
            progress: {
              current: result.blobs.length,
              total: result.blobs.length,
              status: 'Processing',
              message: 'Merging PDFs...',
            },
          });

          try {
            mergedBlob = await unifiedPdfService.mergePdfs(result.blobs);
            logOperation('PDFs merged successfully', {
              count: result.blobs.length,
              size: mergedBlob.size,
            });
          } catch (mergeError) {
            logOperation('PDF merge failed', { error: mergeError });
            // 合併失敗不影響整體結果，只是不提供合併的 PDF
          }
        }

        // 更新最終狀態
        const finalResult: ExtendedBatchPdfResult = {
          ...result,
          ...(mergedBlob && { mergedBlob }), // 添加合併的 PDF（如果存在）
        };

        safeSetState({
          isGenerating: false,
          progress: {
            current: result.successful,
            total: dataArray.length,
            status: result.failed > 0 ? 'Failed' : 'Success',
            message:
              result.failed > 0
                ? `${result.successful} successful, ${result.failed} failed`
                : `All ${result.successful} PDFs generated successfully`,
          },
          lastResult: finalResult,
        });

        // 顯示結果提示
        if (showSuccessToast || showErrorToast) {
          if (result.successful > 0 && result.failed === 0) {
            if (showSuccessToast) {
              const message = mergedBlob
                ? `${result.successful} PDFs generated and merged successfully`
                : `${result.successful} PDFs generated successfully`;
              toast.success(message);
            }
          } else if (result.successful > 0 && result.failed > 0) {
            if (showErrorToast) {
              toast.warning(
                `${result.successful} PDFs generated successfully, ${result.failed} failed`
              );
            }
          } else if (result.failed > 0) {
            if (showErrorToast) {
              toast.error(`All ${result.failed} PDF generations failed`);
            }
          }
        }

        logOperation('Batch PDF generation completed', {
          successful: result.successful,
          failed: result.failed,
          merged: !!mergedBlob,
        });

        return finalResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        safeSetState({
          isGenerating: false,
          progress: {
            current: 0,
            total: dataArray.length,
            status: 'Failed',
            message: errorMessage,
          },
          error: errorMessage,
        });

        if (showErrorToast && !errorMessage.includes('cancelled')) {
          toast.error(`Batch PDF generation failed: ${errorMessage}`);
        }

        logOperation('Batch PDF generation failed', { error: errorMessage });

        return {
          successful: 0,
          failed: dataArray.length,
          results: [],
          blobs: [],
          uploadedUrls: [],
          errors: [errorMessage],
        };
      }
    },
    [safeSetState, logOperation, createAbortController, validateInput]
  );

  // ============================================================================
  // 輔助操作函數
  // ============================================================================

  /**
   * 合併多個 PDF 文件
   */
  const mergePdfs = useCallback(
    async (blobs: Blob[]): Promise<Blob> => {
      logOperation('Starting PDF merge', { count: blobs.length });

      try {
        safeSetState({
          progress: { current: 0, total: 1, status: 'Processing', message: 'Merging PDFs...' },
        });

        const mergedBlob = await unifiedPdfService.mergePdfs(blobs);

        safeSetState({
          progress: {
            current: 1,
            total: 1,
            status: 'Success',
            message: 'PDFs merged successfully',
          },
        });

        logOperation('PDF merge completed', { size: mergedBlob.size });
        return mergedBlob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Merge failed';

        safeSetState({
          progress: { current: 0, total: 1, status: 'Failed', message: errorMessage },
          error: errorMessage,
        });

        logOperation('PDF merge failed', { error: errorMessage });
        throw error;
      }
    },
    [safeSetState, logOperation]
  );

  /**
   * 重置狀態
   */
  const reset = useCallback(() => {
    logOperation('Resetting state');
    safeSetState(initialState);
  }, [safeSetState, logOperation]);

  /**
   * 取消當前操作
   */
  const cancel = useCallback(() => {
    logOperation('Cancelling current operation');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort('User cancelled operation');
      abortControllerRef.current = null;
    }

    safeSetState({
      isGenerating: false,
      isUploading: false,
      progress: { current: 0, total: 0, status: 'Failed', message: 'Operation cancelled' },
      error: 'Operation cancelled by user',
    });
  }, [safeSetState, logOperation]);

  // ============================================================================
  // 返回值
  // ============================================================================

  return {
    state,
    generateSingle,
    generateBatch,
    mergePdfs,
    reset,
    cancel,
    validateInput,
  };
};

// ============================================================================
// 默認導出
// ============================================================================

export default useUnifiedPdfGeneration;

// ============================================================================
// 擴展接口定義（合併後的批量結果）
// ============================================================================

/**
 * 擴展的批量 PDF 生成結果接口
 * 添加合併 PDF 支援
 */
export interface ExtendedBatchPdfResult extends BatchPdfResult {
  /** 合併後的 PDF（如果啟用自動合併） */
  mergedBlob?: Blob;
}
