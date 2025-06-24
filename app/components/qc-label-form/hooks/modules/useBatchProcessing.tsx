/**
 * useBatchProcessing Hook
 * 處理批量 QC 標籤生成
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import type { ProductInfo } from '../../types';

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

interface UseBatchProcessingProps {
  generatePdfs: (options: any) => Promise<any>;
  generatePalletNumbers: (productCode: string, count: number) => Promise<any>;
  createQcRecords: (options: any) => Promise<any>;
  updateStockAndWorkLevels: (options: any) => Promise<any>;
  validateForm: (options: any) => boolean;
}

export const useBatchProcessing = ({
  generatePdfs,
  generatePalletNumbers,
  createQcRecords,
  updateStockAndWorkLevels,
  validateForm
}: UseBatchProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<Map<string, BatchItem>>(new Map());
  const supabase = createClient();

  // 獲取產品信息
  const fetchProductInfo = async (productCode: string): Promise<ProductInfo | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_code, description, product_type, product_standard_qty')
        .eq('product_code', productCode)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        code: data.product_code,
        description: data.description,
        type: data.product_type,
        standard_qty: data.product_standard_qty?.toString() || '0'
      };
    } catch (error) {
      console.error('Error fetching product info:', error);
      return null;
    }
  };

  // 處理單個批量項目
  const processSingleItem = async (
    item: BatchItem,
    clockNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
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

      // 生成托盤號碼
      const palletResult = await generatePalletNumbers(productInfo.code, count);
      if (!palletResult.success) {
        return { success: false, error: 'Failed to generate pallet numbers' };
      }

      // 創建 QC 記錄
      const qcResult = await createQcRecords({
        productInfo,
        quantity,
        count,
        operatorClockNum: item.operator || '-',
        qcClockNum: clockNumber,
        palletNumbers: palletResult.palletNumbers,
        series: palletResult.series,
        acoOrderRef: item.acoOrderRef
      });

      if (!qcResult.success) {
        return { success: false, error: 'Failed to create QC records' };
      }

      // 生成 PDFs
      const pdfResult = await generatePdfs({
        productInfo,
        quantity,
        count,
        palletNumbers: palletResult.palletNumbers,
        series: palletResult.series,
        formData: {
          operator: item.operator,
          acoOrderRef: item.acoOrderRef
        },
        clockNumber
      });

      if (!pdfResult.success) {
        return { success: false, error: 'Failed to generate PDFs' };
      }

      // 更新庫存
      const totalQuantity = quantity * count;
      const stockResult = await updateStockAndWorkLevels({
        productInfo,
        totalQuantity,
        palletCount: count,
        clockNumber,
        acoOrderRef: item.acoOrderRef
      });

      if (!stockResult.success) {
        return { success: false, error: 'Failed to update stock levels' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error processing batch item:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  // 處理批量項目
  const processBatch = useCallback(async (options: BatchProcessingOptions) => {
    const { items, clockNumber, onItemComplete, onProgress } = options;
    
    setIsProcessing(true);
    setProcessedItems(new Map());
    
    let completed = 0;
    const total = items.length;
    const results = [];

    try {
      for (const item of items) {
        // 更新狀態為處理中
        const processingItem = { ...item, status: 'processing' as const };
        setProcessedItems(prev => new Map(prev).set(item.id, processingItem));

        // 處理項目
        const result = await processSingleItem(item, clockNumber);
        
        // 更新狀態
        const processedItem = {
          ...item,
          status: result.success ? 'completed' as const : 'failed' as const,
          error: result.error
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
      }

      // 顯示總結
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        toast.success(`Batch processing completed! All ${successCount} items processed successfully.`);
      } else {
        toast.warning(`Batch processing completed. Success: ${successCount}, Failed: ${failCount}`);
      }

      return {
        success: failCount === 0,
        results,
        successCount,
        failCount
      };
    } catch (error: any) {
      console.error('Batch processing error:', error);
      toast.error('Batch processing failed: ' + error.message);
      return {
        success: false,
        results,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, [processSingleItem]);

  // 導出批量結果為 CSV
  const exportResults = useCallback((items: BatchItem[]) => {
    const csv = [
      'ProductCode,Quantity,Count,Operator,AcoOrderRef,Status,Error',
      ...items.map(item => 
        `${item.productCode},${item.quantity},${item.count},${item.operator || ''},${item.acoOrderRef || ''},${item.status},${item.error || ''}`
      )
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
    exportResults
  };
};