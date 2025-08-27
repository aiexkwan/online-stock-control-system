/**
 * useStreamingPdfGeneration Hook
 * 實現串流 PDF 生成以提高性能和用戶體驗
 */

import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { toast } from 'sonner';
// Import moved to dynamic import in generatePdfStream function
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { prepareQcLabelData, type QcInputData } from '@/lib/pdfUtils';
import { uploadPdfToStorage, updatePalletPdfUrl } from '@/app/actions/qcActions';
import { getOrdinalSuffix, getAcoPalletCount } from '@/app/utils/qcLabelHelpers';
import { createClient } from '@/app/utils/supabase/client';
import { enhancedPdfParallelProcessor, type ParallelPdfTask, type ProgressUpdate } from '@/lib/performance/enhanced-pdf-parallel-processor';
import type { ProductInfo } from '../../types';

interface StreamingPdfGenerationOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  palletNumbers: string[];
  series: string[];
  formData: {
    operator?: string;
    acoOrderRef?: string;
    slateDetail?: {
      batchNumber: string;
    };
  };
  clockNumber: string;
  onProgress?: (current: number, status: 'Processing' | 'Success' | 'Failed') => void;
  onStreamComplete?: (blob: Blob, url: string, index: number) => void;
  batchSize?: number; // 每批處理的數量
}

interface StreamingStatus {
  isStreaming: boolean;
  completed: number;
  total: number;
  errors: string[];
}

interface UseStreamingPdfGenerationReturn {
  generatePdfsStream: (options: StreamingPdfGenerationOptions) => Promise<{
    success: boolean;
    pdfBlobs: Blob[];
    uploadedUrls: string[];
    errors: string[];
  }>;
  streamingStatus: StreamingStatus;
  cancelStreaming: () => void;
}

export const useStreamingPdfGeneration = (): UseStreamingPdfGenerationReturn => {
  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>({
    isStreaming: false,
    completed: 0,
    total: 0,
    errors: [],
  });

  // 取消串流處理
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingStatus(prev => ({ ...prev, isStreaming: false }));
  }, []);

  // 生成單個 PDF (支援取消)
  const generateSinglePdf = useCallback(
    async (
      productInfo: ProductInfo,
      quantity: number,
      palletNum: string,
      series: string,
      operatorClockNum: string,
      qcClockNum: string,
      acoDisplayText?: string,
      signal?: AbortSignal
    ): Promise<{ blob: Blob | null; url: string | null; error: string | null }> => {
      try {
        // 檢查是否已取消
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // 準備 QC 標籤數據
        const qcInput: QcInputData = {
          productCode: productInfo.code,
          productDescription: productInfo.description,
          quantity: quantity,
          series: series,
          palletNum: palletNum,
          operatorClockNum: operatorClockNum,
          qcClockNum: qcClockNum,
          workOrderNumber: acoDisplayText || undefined,
          workOrderName: productInfo.type === 'ACO' ? 'ACO Order' : undefined,
          productType: productInfo.type,
        };

        const pdfLabelProps = await prepareQcLabelData(qcInput);

        // 檢查是否已取消
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // 生成 PDF blob - 使用串流方式
        const { renderReactPDFToBlob } = await import('@/lib/services/unified-pdf-service');
        const pdfElement = <PrintLabelPdf {...pdfLabelProps} />;

        // 使用統一 PDF 服務生成 blob
        const pdfBlob = await renderReactPDFToBlob(pdfElement);

        if (!pdfBlob) {
          throw new Error('PDF generation failed to return a blob.');
        }

        // 檢查是否已取消
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // 轉換 blob 為 ArrayBuffer 然後為 number array
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
        const pdfNumberArray = Array.from(pdfUint8Array);

        // 上傳 PDF
        const fileName = `${palletNum.replace('/', '_')}.pdf`;
        const uploadResult = await uploadPdfToStorage(pdfNumberArray, fileName, 'qc-labels');

        if (uploadResult.error) {
          throw new Error(`PDF upload failed: ${uploadResult.error}`);
        }

        if (!uploadResult.publicUrl) {
          throw new Error('PDF upload succeeded but no public URL returned.');
        }

        // Update PDF URL in database
        const updateResult = await updatePalletPdfUrl(palletNum, uploadResult.publicUrl);
        if (updateResult.error) {
          console.error(
            `[useStreamingPdfGeneration] Failed to update PDF URL for pallet ${palletNum}:`,
            updateResult.error
          );
          // Don't fail the entire operation, just log the error
        }

        return { blob: pdfBlob, url: uploadResult.publicUrl, error: null };
      } catch (error: unknown) {
        if (getErrorMessage(error) === 'Operation cancelled') {
          return { blob: null, url: null, error: 'Cancelled' };
        }
        console.error(`Error generating PDF for pallet ${palletNum}:`, error);
        return { blob: null, url: null, error: getErrorMessage(error) };
      }
    },
    []
  );

  // 批量串流生成 PDFs - 優化使用新的並行處理器
  const generatePdfsStream = useCallback(
    async (options: StreamingPdfGenerationOptions) => {
      const {
        productInfo,
        quantity,
        count,
        palletNumbers,
        series,
        formData,
        clockNumber,
        onProgress,
        onStreamComplete,
        batchSize = 3, // 預設每批處理 3 個 (已被並行處理器取代)
      } = options;

      // 檢查必要參數
      if (!productInfo || !productInfo.code) {
        throw new Error('Product information is missing');
      }

      // 初始化狀態
      setStreamingStatus({
        isStreaming: true,
        completed: 0,
        total: count,
        errors: [],
      });

      // 創建新的 AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const pdfBlobs: Blob[] = [];
      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      try {
        // 對於 ACO 訂單，獲取初始托盤計數
        let initialAcoPalletCount = 0;
        if (productInfo.type === 'ACO' && formData.acoOrderRef?.trim()) {
          initialAcoPalletCount = await getAcoPalletCount(supabase, formData.acoOrderRef.trim());
        }

        // 準備並行任務
        const tasks: ParallelPdfTask[] = [];
        for (let i = 0; i < count; i++) {
          if (signal.aborted) break;

          const palletNum = palletNumbers[i];
          const seriesNum = series[i];

          // 計算 ACO 托盤計數
          let acoDisplayText = '';
          if (productInfo.type === 'ACO' && formData.acoOrderRef?.trim()) {
            const acoPalletCount = initialAcoPalletCount + i;
            acoDisplayText = `${formData.acoOrderRef.trim()} - ${getOrdinalSuffix(acoPalletCount)} Pallet`;
          }

          tasks.push({
            id: `pdf-task-${i}`,
            productInfo,
            quantity,
            palletNum,
            series: seriesNum,
            operatorClockNum: formData.operator || '-',
            qcClockNum: clockNumber,
            acoDisplayText,
            priority: 'normal',
            timestamp: Date.now(),
          });
        }

        // 設置進度監聽器
        const progressHandler = (progressUpdate: ProgressUpdate) => {
          setStreamingStatus(prev => ({
            ...prev,
            completed: progressUpdate.completed,
            errors: progressUpdate.errors,
          }));

          // 調用外部進度回調
          if (onProgress) {
            const status = progressUpdate.phase === 'completed' ? 'Success' : 
                          progressUpdate.errors.length > 0 ? 'Failed' : 'Processing';
            onProgress(progressUpdate.completed, status);
          }
        };

        // 註冊進度監聽器
        enhancedPdfParallelProcessor.on('progress', progressHandler);

        try {
          // 使用增強的並行處理器處理所有任務
          const result = await enhancedPdfParallelProcessor.processParallel(tasks);

          // 處理結果
          result.results.forEach((taskResult, index) => {
            if (taskResult.success && taskResult.blob && taskResult.uploadUrl) {
              pdfBlobs.push(taskResult.blob);
              uploadedUrls.push(taskResult.uploadUrl);
              
              // 通知單個 PDF 完成
              if (onStreamComplete) {
                onStreamComplete(taskResult.blob, taskResult.uploadUrl, index);
              }
            }
          });

          // 收集錯誤
          errors.push(...result.errors);

          // 完成串流
          setStreamingStatus(prev => ({ 
            ...prev, 
            isStreaming: false,
            completed: result.results.filter(r => r.success).length,
            errors: result.errors,
          }));

          console.log('[useStreamingPdfGeneration] Processing completed:', {
            totalTasks: result.metrics.totalTasks,
            completedTasks: result.metrics.completedTasks,
            failedTasks: result.metrics.failedTasks,
            successRate: result.metrics.successRate,
            averageProcessingTime: result.metrics.averageProcessingTime,
            throughputPerSecond: result.metrics.throughputPerSecond,
          });

          return {
            success: result.success,
            pdfBlobs,
            uploadedUrls,
            errors: result.errors,
            metrics: result.metrics, // 新增性能指標
          };
        } finally {
          // 移除進度監聽器
          enhancedPdfParallelProcessor.off('progress', progressHandler);
        }
      } catch (error: unknown) {
        console.error('Streaming PDF generation error:', error);
        setStreamingStatus(prev => ({
          ...prev,
          isStreaming: false,
          errors: [...prev.errors, getErrorMessage(error)],
        }));
        return {
          success: false,
          pdfBlobs,
          uploadedUrls,
          errors: [...errors, getErrorMessage(error)],
        };
      } finally {
        abortControllerRef.current = null;
      }
    },
    [supabase]
  );

  return {
    generatePdfsStream,
    streamingStatus,
    cancelStreaming,
  };
};
