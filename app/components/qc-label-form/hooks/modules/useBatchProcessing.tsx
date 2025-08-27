/**
 * useBatchProcessing Hook
 * 處理批量 QC 標籤生成
 *
 * Phase 6.1 Week 1: QcLabelForm Data Structure Refactoring
 * Strategy 1: Zod schemas for type safety
 */

import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import type { ProductInfo } from '../../types';
import {
  BatchProcessingResult,
  BusinessSchemaValidator,
  BusinessTypeGuards,
} from '@/lib/types/business-schemas';

interface BatchItem {
  id: string;
  productCode: string;
  productInfo?: ProductInfo | null;
  quantity: string;
  count: string;
  operator?: string;
  acoOrderRef?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface BatchProcessingOptions {
  items: BatchItem[];
  clockNumber: string;
  onItemComplete?: (itemId: string, success: boolean, error?: string) => void;
  onProgress?: (completed: number, total: number) => void;
}

// 批量處理方法參數類型 (Strategy 2: DTO/自定義 type interface)
interface GeneratePdfsOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  palletNumbers: string[];
  series: string;
  formData: {
    operator?: string;
    acoOrderRef?: string;
  };
  clockNumber: string;
}

interface CreateQcRecordsOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  operatorClockNum: string;
  qcClockNum: string;
  palletNumbers: string[];
  series: string;
  acoOrderRef?: string;
}

interface UpdateStockOptions {
  productInfo: ProductInfo;
  totalQuantity: number;
  palletCount: number;
  clockNumber: string;
  acoOrderRef?: string;
}

interface ValidateFormOptions {
  productCode: string;
  quantity: string;
  count: string;
  operator?: string;
  acoOrderRef?: string;
}

// 批量處理方法返回類型
interface PalletGenerationResult {
  success: boolean;
  palletNumbers?: string[];
  series?: string;
  error?: string;
}

interface ProcessingResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// 批量處理方法類型 (Strategy 1: 強類型定義)
interface BatchProcessingMethods {
  generatePdfs: (options: GeneratePdfsOptions) => Promise<ProcessingResult>;
  generatePalletNumbers: (productCode: string, count: number) => Promise<PalletGenerationResult>;
  createQcRecords: (options: CreateQcRecordsOptions) => Promise<ProcessingResult>;
  updateStockAndWorkLevels: (options: UpdateStockOptions) => Promise<ProcessingResult>;
  validateForm: (options: ValidateFormOptions) => boolean;
}

interface UseBatchProcessingProps extends BatchProcessingMethods {
  // 繼承批量處理方法
}

export const useBatchProcessing = ({
  generatePdfs,
  generatePalletNumbers,
  createQcRecords,
  updateStockAndWorkLevels,
  validateForm,
}: UseBatchProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<Map<string, BatchItem>>(new Map());
  const supabase = createClient();

  // 獲取產品信息
  const fetchProductInfo = useCallback(
    async (productCode: string): Promise<ProductInfo | null> => {
      try {
        const { data, error } = await supabase
          .from('data_code')
          .select('code, description, type, standard_qty')
          .eq('code', productCode)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          code: data.code,
          description: data.description,
          type: data.type,
          standard_qty: data.standard_qty?.toString() || '0',
        };
      } catch (error) {
        console.error('Error fetching product info:', error);
        return null;
      }
    },
    [supabase]
  );

  // 處理單個批量項目
  const processSingleItem = useCallback(
    async (item: BatchItem, clockNumber: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // 獲取產品信息
        const productInfo = await fetchProductInfo(item.productCode);
        if (!productInfo) {
          return { success: false, error: 'Product not found' };
        }

        // 驗證數據
        const validationErrors = [];
        if (!item.quantity || parseInt(item.quantity) <= 0) {
          validationErrors.push('Invalid quantity');
        }
        if (!item.count || parseInt(item.count) <= 0) {
          validationErrors.push('Invalid count');
        }
        if (productInfo.type === 'ACO' && !item.acoOrderRef) {
          validationErrors.push('ACO order reference required');
        }

        if (validationErrors.length > 0) {
          return { success: false, error: validationErrors.join(', ') };
        }

        const quantity = parseInt(item.quantity);
        const count = parseInt(item.count);

        // 生成托盤號碼 (Strategy 4: unknown + type narrowing)
        const palletResult = await generatePalletNumbers(productInfo.code, count);
        if (!palletResult.success || !palletResult.palletNumbers || !palletResult.series) {
          return {
            success: false,
            error: palletResult.error || 'Failed to generate pallet numbers',
          };
        }

        // 創建 QC 記錄 (Strategy 1: 強類型驗證)
        const qcOptions: CreateQcRecordsOptions = {
          productInfo,
          quantity,
          count,
          operatorClockNum: item.operator || '-',
          qcClockNum: clockNumber,
          palletNumbers: palletResult.palletNumbers,
          series: palletResult.series,
          acoOrderRef: item.acoOrderRef,
        };

        const qcResult = await createQcRecords(qcOptions);
        if (!qcResult.success) {
          return { success: false, error: qcResult.error || 'Failed to create QC records' };
        }

        // 生成 PDFs (Strategy 1: 強類型驗證)
        const pdfOptions: GeneratePdfsOptions = {
          productInfo,
          quantity,
          count,
          palletNumbers: palletResult.palletNumbers,
          series: palletResult.series,
          formData: {
            operator: item.operator,
            acoOrderRef: item.acoOrderRef,
          },
          clockNumber,
        };

        const pdfResult = await generatePdfs(pdfOptions);
        if (!pdfResult.success) {
          return { success: false, error: pdfResult.error || 'Failed to generate PDFs' };
        }

        // 更新庫存 (Strategy 1: 強類型驗證)
        const totalQuantity = quantity * count;
        const stockOptions: UpdateStockOptions = {
          productInfo,
          totalQuantity,
          palletCount: count,
          clockNumber,
          acoOrderRef: item.acoOrderRef,
        };

        const stockResult = await updateStockAndWorkLevels(stockOptions);
        if (!stockResult.success) {
          return { success: false, error: stockResult.error || 'Failed to update stock levels' };
        }

        return { success: true };
      } catch (error: unknown) {
        console.error('Error processing batch item:', error);
        return { success: false, error: getErrorMessage(error) || 'Unknown error' };
      }
    },
    [
      fetchProductInfo,
      generatePalletNumbers,
      createQcRecords,
      generatePdfs,
      updateStockAndWorkLevels,
    ]
  );

  // 處理批量項目 - 優化為並行處理
  const processBatch = useCallback(
    async (options: BatchProcessingOptions) => {
      const { items, clockNumber, onItemComplete, onProgress } = options;

      setIsProcessing(true);
      setProcessedItems(new Map());

      let completed = 0;
      const total = items.length;
      const results: Array<{ itemId: string; success: boolean; error?: string }> = [];

      try {
        // 將項目標記為處理中
        items.forEach(item => {
          const processingItem = { ...item, status: 'processing' as const };
          setProcessedItems(prev => new Map(prev).set(item.id, processingItem));
        });

        // 使用 Promise.allSettled 並行處理所有項目
        const processingPromises = items.map(async (item, index) => {
          try {
            const result = await processSingleItem(item, clockNumber);
            return { item, result, index };
          } catch (error) {
            return { 
              item, 
              result: { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              }, 
              index 
            };
          }
        });

        // 等待所有處理完成
        const settledResults = await Promise.allSettled(processingPromises);

        // 處理結果
        settledResults.forEach((settledResult, index) => {
          const item = items[index];
          
          if (settledResult.status === 'fulfilled') {
            const { result } = settledResult.value;
            
            // 更新狀態
            const processedItem = {
              ...item,
              status: result.success ? ('completed' as const) : ('failed' as const),
              error: result.error,
            };
            setProcessedItems(prev => new Map(prev).set(item.id, processedItem));

            completed++;
            results.push({ itemId: item.id, ...result });

            // 回調
            if (onItemComplete) {
              onItemComplete(item.id, result.success, result.error);
            }
            if (onProgress) {
              onProgress(completed, total);
            }

            // 顯示進度
            if (result.success) {
              toast.success(`Processed ${item.productCode} (${completed}/${total})`);
            } else {
              toast.error(`Failed: ${item.productCode} - ${result.error}`);
            }
          } else {
            // 處理 Promise 失敗的情況
            const error = settledResult.reason instanceof Error ? settledResult.reason.message : 'Processing failed';
            
            const processedItem = {
              ...item,
              status: 'failed' as const,
              error,
            };
            setProcessedItems(prev => new Map(prev).set(item.id, processedItem));

            completed++;
            results.push({ itemId: item.id, success: false, error });

            if (onItemComplete) {
              onItemComplete(item.id, false, error);
            }
            if (onProgress) {
              onProgress(completed, total);
            }

            toast.error(`Failed: ${item.productCode} - ${error}`);
          }
        });

        // 顯示總結
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        if (failCount === 0) {
          toast.success(
            `Batch processing completed! All ${successCount} items processed successfully.`
          );
        } else {
          toast.warning(
            `Batch processing completed. Success: ${successCount}, Failed: ${failCount}`
          );
        }

        return {
          success: failCount === 0,
          results,
          successCount,
          failCount,
        };
      } catch (error: unknown) {
        console.error('Batch processing error:', error);
        toast.error('Batch processing failed: ' + getErrorMessage(error));
        return {
          success: false,
          results,
          error: getErrorMessage(error),
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [processSingleItem]
  );

  // 導出批量結果為 CSV
  const exportResults = useCallback((items: BatchItem[]) => {
    const csv = [
      'ProductCode,Quantity,Count,Operator,AcoOrderRef,Status,Error',
      ...items.map(
        item =>
          `${item.productCode},${item.quantity},${item.count},${item.operator || ''},${item.acoOrderRef || ''},${item.status},${item.error || ''}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    isProcessing,
    processedItems,
    processBatch,
    exportResults,
  };
};
