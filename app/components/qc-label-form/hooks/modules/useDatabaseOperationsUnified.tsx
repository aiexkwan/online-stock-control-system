/**
 * useDatabaseOperationsUnified Hook
 * 使用統一的 QC Label RPC 函數 - process_qc_label_unified
 * 取代多個 RPC 調用，提升性能並保證原子性操作
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import type { ProductInfo } from '../../types';

interface UnifiedQcOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  clockNumber: string;
  formData: {
    acoOrderRef?: string;
    acoNewRef?: boolean;
    acoOrderDetails?: Array<{ code: string; qty: string }>;
    slateDetail?: {
      batchNumber: string;
    };
    operator?: string;
  };
  pdfUrls?: string[];
  sessionId?: string;
}

interface UnifiedDatabaseResult {
  success: boolean;
  error?: string;
  data?: {
    pallet_numbers: string[];
    series: string[];
    pallet_data: Array<{
      pallet_number: string;
      series: string;
      pdf_url?: string;
    }>;
    total_quantity: number;
    product_code: string;
    product_description: string;
    user_id: number;
    timestamp: string;
  };
  statistics?: {
    pallets_created: number;
    total_quantity: number;
    records_created: {
      palletinfo: number;
      history: number;
      inventory: number;
      slate: number;
    };
    updates_made: {
      stock_level: boolean;
      work_level: boolean;
    };
  };
}

interface UseDatabaseOperationsUnifiedReturn {
  processQcLabelsUnified: (options: UnifiedQcOptions) => Promise<UnifiedDatabaseResult>;
}

export const useDatabaseOperationsUnified = (): UseDatabaseOperationsUnifiedReturn => {
  const supabase = createClient();

  // 統一處理 QC 標籤的所有操作
  const processQcLabelsUnified = useCallback(async (options: UnifiedQcOptions): Promise<UnifiedDatabaseResult> => {
    const {
      productInfo,
      quantity,
      count,
      clockNumber,
      formData,
      pdfUrls,
      sessionId
    } = options;

    try {
      // 檢查必要參數
      if (!productInfo || !productInfo.code) {
        throw new Error('Product information is missing');
      }

      if (!clockNumber || clockNumber.trim() === '') {
        throw new Error('Clock number is required');
      }

      if (count <= 0 || count > 100) {
        throw new Error('Invalid count: must be between 1 and 100');
      }

      if (quantity <= 0) {
        throw new Error('Invalid quantity: must be greater than 0');
      }

      // 顯示處理中的提示
      const loadingToast = toast.loading(`Processing ${count} QC labels...`);

      // 準備 RPC 參數
      const pltRemark = productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
        ? `ACO Ref: ${formData.acoOrderRef.trim()}`
        : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber?.trim()
        ? `Batch: ${formData.slateDetail.batchNumber.trim()}`
        : 'QC Finished';

      const acoOrderRef = productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
        ? parseInt(formData.acoOrderRef.trim(), 10)
        : null;

      const acoQuantityUsed = productInfo.type === 'ACO' && acoOrderRef
        ? quantity * count
        : null;

      const slateBatchNumber = productInfo.type === 'Slate' && formData.slateDetail?.batchNumber?.trim()
        ? formData.slateDetail.batchNumber.trim()
        : null;

      // 調用統一 RPC 函數
      const { data: result, error: rpcError } = await supabase.rpc('process_qc_label_unified', {
        p_count: count,
        p_product_code: productInfo.code,
        p_product_qty: quantity,
        p_clock_number: clockNumber.trim(),
        p_plt_remark: pltRemark,
        p_session_id: sessionId || `qc-unified-${Date.now()}`,
        p_aco_order_ref: acoOrderRef,
        p_aco_quantity_used: acoQuantityUsed,
        p_slate_batch_number: slateBatchNumber,
        p_pdf_urls: pdfUrls || null
      });

      toast.dismiss(loadingToast);

      if (rpcError) {
        console.error('[UnifiedDB] RPC Error:', rpcError);
        toast.error(`Database error: ${rpcError.message}`);
        return {
          success: false,
          error: rpcError.message
        };
      }

      if (!result) {
        const errorMsg = 'No result returned from unified RPC';
        toast.error(errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      // 檢查 RPC 結果
      if (!result.success) {
        console.error('[UnifiedDB] RPC returned error:', result);
        toast.error(`Processing failed: ${result.message || result.error}`);
        return {
          success: false,
          error: result.message || result.error
        };
      }

      // 顯示成功消息
      const successMsg = `✅ ${result.message}`;
      toast.success(successMsg);

      // 顯示統計信息（可選）
      if (result.statistics) {
        console.log('[UnifiedDB] Processing statistics:', result.statistics);
        
        // 如果有警告，顯示它們
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning: string) => {
            toast.warning(warning);
          });
        }
      }

      console.log('[UnifiedDB] Success - Generated pallets:', result.data?.pallet_numbers);
      
      return {
        success: true,
        data: result.data,
        statistics: result.statistics
      };

    } catch (error: any) {
      console.error('[UnifiedDB] Unexpected error:', error);
      const errorMsg = `Unexpected error: ${error.message}`;
      toast.error(errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }, [supabase]);

  return {
    processQcLabelsUnified
  };
};

export default useDatabaseOperationsUnified; 