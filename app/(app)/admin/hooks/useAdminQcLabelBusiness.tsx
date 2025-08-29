'use client';

import React, { useState, useCallback, useRef } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { MIN_ACO_ORDER_REF_LENGTH } from '../components/qc-label-constants';
// 導入表單驗證 hook
import { useAdminFormValidation } from './useAdminFormValidation';
// 使用統一的 PDF 生成 Hook
import { useUnifiedPdfGeneration, type BatchPdfOptions } from '@/hooks/useUnifiedPdfGeneration';
import { PdfType } from '@/lib/services/unified-pdf-service';
import type { QcLabelInputData } from '@/lib/mappers/pdf-data-mappers';
import type { ProductInfo, AdminFormData, SlateDetail } from '../types/adminQcTypes';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// RPC response type
interface RpcResponse {
  success: boolean;
  message: string;
  pallet_data?: Array<{
    pallet_number: string;
    series: string;
    pdf_url?: string;
  }>;
  failed_pallets?: Array<{
    index: number;
    error: string;
  }>;
}

interface UseAdminQcLabelBusinessProps {
  formData: AdminFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdminFormData>>;
  productInfo: ProductInfo | null;
  onProductInfoReset?: () => void;
  onShowError?: (message: string) => void;
  onShowWarning?: (message: string) => void;
}

export const useAdminQcLabelBusiness = ({
  formData,
  setFormData,
  productInfo,
  onProductInfoReset,
  onShowError,
  onShowWarning,
}: UseAdminQcLabelBusinessProps) => {
  // 使用 logger（已包含 sanitizer）

  // Supabase client for v6 operations
  const supabase = createClient();

  // User ID will be provided by UserIdVerificationDialog when needed

  // 使用統一的 PDF 生成 Hook
  const {
    state: pdfState,
    generateBatch,
    reset: resetPdfState,
    cancel: cancelPdfGeneration,
  } = useUnifiedPdfGeneration();

  // User ID will be set when UserIdVerificationDialog completes verification

  const {
    validateForm,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,
    isAcoOrderExcess,
    canSearchAco,
    validateAcoOrderDetails,
  } = useAdminFormValidation({ formData, productInfo });

  // 冷卻期管理
  const lastConfirmationTimeRef = useRef<number | null>(null);
  const COOLDOWN_PERIOD = 10000; // 10 seconds

  // 檢查冷卻期
  const checkCooldownPeriod = useCallback((): boolean => {
    if (!lastConfirmationTimeRef.current) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastConfirmation = now - lastConfirmationTimeRef.current;
    const isInCooldown = timeSinceLastConfirmation < COOLDOWN_PERIOD;

    if (isInCooldown) {
      const remainingTime = Math.ceil((COOLDOWN_PERIOD - timeSinceLastConfirmation) / 1000);
      toast.warning(`Please wait ${remainingTime} seconds before generating another label`);
    }

    return isInCooldown;
  }, []);

  // 設置冷卻期
  const setCooldownTimer = useCallback(() => {
    lastConfirmationTimeRef.current = Date.now();
  }, []);

  // Simple ACO management for admin - no complex hooks
  const handleAutoAcoConfirm = useCallback(
    async (selectedOrderRef: string) => {
      if (!selectedOrderRef || !productInfo?.code) return;

      setFormData(prev => ({ ...prev, acoSearchLoading: true }));

      try {
        const { data, error } = await supabase
          .from('record_aco')
          .select('required_qty, finished_qty')
          .eq('code', productInfo.code)
          .eq('order_ref', parseInt(selectedOrderRef));

        if (error) {
          console.error('Error fetching ACO order:', error);
          setFormData(prev => ({ ...prev, acoSearchLoading: false }));
          return;
        }

        if (data && data.length > 0) {
          // Sum up quantities if multiple records exist
          const totalRequired = data.reduce((sum, item) => sum + (item.required_qty || 0), 0);
          const totalFinished = data.reduce((sum, item) => sum + (item.finished_qty || 0), 0);
          const remainQty = totalRequired - totalFinished;

          setFormData(prev => ({
            ...prev,
            acoRemain: remainQty,
            acoSearchLoading: false,
          }));
        } else {
          setFormData(prev => ({ ...prev, acoSearchLoading: false }));
        }
      } catch (error) {
        console.error('Error in handleAutoAcoConfirm:', error);
        setFormData(prev => ({ ...prev, acoSearchLoading: false }));
      }
    },
    [productInfo?.code, supabase, setFormData]
  );

  // Simple slate management for admin
  const handleSlateDetailChange = useCallback(
    (detail: SlateDetail) => {
      setFormData(prev => ({ ...prev, slateDetail: detail }));
    },
    [setFormData]
  );

  // 移除舊的 PDF 生成 hooks，改用統一的 PDF 生成

  // State for preventing duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);

  // This function is no longer used as QCLabelCard handles verification directly
  const handlePrintLabel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(
      '[useAdminQcLabelBusiness] handlePrintLabel deprecated - use handleClockNumberConfirm directly'
    );
  }, []);

  // Handle clock number confirmation with verified user ID
  const handleClockNumberConfirm = useCallback(
    async (verifiedUserId: string) => {
      console.log(
        '[useAdminQcLabelBusiness] handleClockNumberConfirm called with verified user ID'
      );

      // Update formData with verified user ID
      setFormData(prev => ({ ...prev, userId: verifiedUserId }));

      // Prevent duplicate submissions
      if (isProcessing) {
        onShowWarning?.('Processing in progress. Please wait...');
        return;
      }

      // 檢查冷卻期
      if (checkCooldownPeriod()) {
        return;
      }

      // Set processing state
      setIsProcessing(true);
      setCooldownTimer();

      // 驗證基本表單數據
      const { isValid, errors } = validateForm();
      if (!isValid) {
        const errorMessage =
          errors && typeof errors === 'object'
            ? Object.values(errors).join(', ')
            : 'Validation failed';
        onShowError?.(errorMessage);
        setIsProcessing(false);
        return;
      }

      // 檢查 productInfo 是否存在
      if (!productInfo) {
        onShowError?.('Please select a valid product code');
        setIsProcessing(false);
        return;
      }

      // 安全處理字符串轉換
      const quantityStr = String(formData.quantity || '');
      const countStr = String(formData.count || '');
      const quantity = parseInt(quantityStr.trim(), 10);
      const count = parseInt(countStr.trim(), 10);

      // 聲明在 try 外面以便 catch 中可以訪問
      let sortedPalletNumbers: string[] = [];
      let sortedSeries: string[] = [];

      try {
        // Initialize progress
        setFormData(prev => ({
          ...prev,
          pdfProgress: {
            current: 0,
            total: count,
            status: Array(count).fill('Pending'),
          },
        }));

        console.log('[Admin QC Label] Calling RPC process_qc_label_unified...');
        console.log('[Admin QC Label] Product info:', {
          code: productInfo.code,
          type: productInfo.type,
          description: productInfo.description,
        });

        // Prepare RPC parameters matching the fixed function signature
        const rpcParams = {
          p_count: count,
          p_product_code: productInfo.code,
          p_product_qty: quantity,
          p_clock_number: verifiedUserId, // 使用已驗證的 user ID
          p_plt_remark: formData.operator?.trim() || null, // Operator as remark
          p_session_id: null,
          p_aco_order_ref:
            productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
              ? formData.acoOrderRef.trim()
              : null,
          p_aco_quantity_used:
            productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
              ? quantity * count // Total quantity for ACO
              : null,
          p_slate_batch_number:
            productInfo.type?.toLowerCase().includes('slate') &&
            formData.slateDetail?.batchNumber?.trim()
              ? formData.slateDetail.batchNumber.trim()
              : null,
          p_pdf_urls: null, // PDFs will be handled separately
        };

        console.log('[Admin QC Label] RPC parameters:', rpcParams);

        // Step 1: Call RPC to handle all database operations
        // This RPC now handles:
        // - Getting pallet numbers from buffer
        // - Writing to record_palletinfo, record_inventory, record_history
        // - Updating stock_level and work_level
        // - Updating ACO orders if applicable
        const rpcResult = await supabase.rpc('process_qc_label_unified', rpcParams);

        console.log('[Admin QC Label] Raw RPC result:', rpcResult);

        if (rpcResult.error) {
          console.error('[Admin QC Label] RPC error:', rpcResult.error);
          onShowError?.(`Failed to process QC label: ${rpcResult.error.message}`);
          setIsProcessing(false);
          return;
        }

        // Check if RPC returned null or undefined
        if (!rpcResult.data) {
          console.error('[Admin QC Label] RPC returned null/undefined data');
          onShowError?.('Server returned empty response. Please try again.');
          setIsProcessing(false);
          return;
        }

        const rpcData = rpcResult.data as RpcResponse;
        console.log('[Admin QC Label] RPC data after cast:', rpcData);

        // Check if rpcData has the expected structure
        if (typeof rpcData !== 'object' || !('success' in rpcData)) {
          console.error('[Admin QC Label] RPC data has unexpected structure:', rpcData);
          onShowError?.('Server returned invalid response format.');
          setIsProcessing(false);
          return;
        }

        if (!rpcData.success) {
          console.error('[Admin QC Label] RPC failed:', rpcData.message);
          // 特別處理產品找不到的錯誤
          if (rpcData.message.includes('Product code not found')) {
            onShowError?.(
              `Product code "${productInfo.code}" not found in database. Please verify the product exists.`
            );
          } else {
            onShowError?.(`Processing failed: ${rpcData.message}`);
          }
          setIsProcessing(false);
          return;
        }

        console.log('[Admin QC Label] RPC completed successfully:', {
          pallet_data: rpcData.pallet_data?.length || 0,
          message: rpcData.message,
        });

        // Extract pallet numbers and series from RPC result
        if (!rpcData.pallet_data || rpcData.pallet_data.length === 0) {
          console.error('[Admin QC Label] No pallet data in RPC response:', rpcData);

          // Check if there are failed pallets to provide more specific error message
          if (rpcData.failed_pallets && rpcData.failed_pallets.length > 0) {
            const firstError = rpcData.failed_pallets[0];
            console.error('[Admin QC Label] Failed pallet details:', firstError);

            if (firstError.error.includes('duplicate key value violates unique constraint')) {
              onShowError?.(
                'Database constraint error: A pallet record already exists with this combination. This may indicate data synchronization issues. Please contact system administrator.'
              );
            } else {
              onShowError?.(`Processing failed: ${firstError.error}`);
            }
          } else {
            onShowError?.(
              'No data returned from server. Please check product code exists in database.'
            );
          }

          setIsProcessing(false);
          return;
        }

        // Handle array of pallet data objects
        sortedPalletNumbers = rpcData.pallet_data.map(p => p.pallet_number);
        sortedSeries = rpcData.pallet_data.map(p => p.series);

        // Log any failed pallets
        if (rpcData.failed_pallets && rpcData.failed_pallets.length > 0) {
          console.warn('[Admin QC Label] Some pallets failed:', rpcData.failed_pallets);
          const successCount = rpcData.pallet_data.length;
          onShowWarning?.(`${successCount} of ${count} pallets processed successfully`);
        }

        // 使用統一的 PDF 生成 Hook
        logger.info('[Admin QC Label] Starting unified PDF generation...');

        // 準備 QC Label 數據陣列
        const qcLabelDataArray: QcLabelInputData[] = sortedPalletNumbers.map(
          (palletNumber, index) => ({
            productCode: productInfo.code,
            productDescription: productInfo.description,
            quantity,
            series: sortedSeries[index],
            palletNum: palletNumber,
            operatorClockNum: formData.operator || verifiedUserId,
            qcClockNum: verifiedUserId,
            workOrderNumber: formData.acoOrderRef || undefined,
            workOrderName: productInfo.type === 'ACO' ? formData.acoOrderRef : undefined,
            productType: productInfo.type || undefined,
          })
        );

        // 使用統一 PDF 生成批量功能
        const pdfResult = await generateBatch({
          type: PdfType.QC_LABEL,
          dataArray: qcLabelDataArray,
          onProgress: (current, total, status, message) => {
            setFormData(prev => ({
              ...prev,
              pdfProgress: {
                current,
                total,
                status: Array(total)
                  .fill('Pending')
                  .map((_, idx) =>
                    idx < current ? (status === 'Success' ? 'Success' : 'Failed') : 'Pending'
                  ),
              },
            }));

            // 使用 LoggerSanitizer 記錄進度
            logger.debug({
              msg: '[PDF Progress]',
              current,
              total,
              status,
              message,
            });
          },
          showSuccessToast: false, // 我們會自定義提示
          showErrorToast: false,
          autoMerge: false, // 不需要合併，需要單獨打印
        });

        // 處理 PDF 生成結果
        if (pdfResult.successful > 0) {
          logger.info({
            msg: '[Admin QC Label] PDF generation completed',
            successful: pdfResult.successful,
            failed: pdfResult.failed,
            totalBlobs: pdfResult.blobs.length,
          });

          // 打印 PDFs - 使用統一的打印服務
          if (pdfResult.blobs.length > 0) {
            try {
              // 動態導入打印服務
              const { unifiedPrintService } = await import('@/lib/services/unified-print-service');

              await unifiedPrintService.printBatch(pdfResult.blobs, {
                productCode: productInfo.code,
                palletNumbers: sortedPalletNumbers.slice(0, pdfResult.successful),
                series: sortedSeries.slice(0, pdfResult.successful),
                quantity,
                operator: verifiedUserId,
              });

              logger.info('[Admin QC Label] PDFs sent to print queue');
              toast.success(`Successfully printed ${pdfResult.successful} QC labels`);
            } catch (printError) {
              logger.error('[Admin QC Label] Print error');
              onShowError?.('Failed to send PDFs to print queue');
            }
          }

          // Note: RPC has already handled all database operations
        } else {
          onShowError?.('Failed to generate any PDF labels');
        }

        // 重置表單
        if (pdfResult.successful > 0) {
          setFormData(prev => ({
            ...prev,
            productCode: '',
            quantity: '',
            count: '',
            operator: '',
            acoOrderRef: '',
            acoRemain: null,
            acoSearchLoading: false,
            productError: null,
            isLoading: false,
            pdfProgress: {
              current: 0,
              total: 0,
              status: [],
            },
            slateDetail: {
              batchNumber: '',
            },
          }));

          // Reset productInfo in parent component
          if (onProductInfoReset) {
            onProductInfoReset();
          }
        }
      } catch (error: unknown) {
        console.error('[Admin QC Label] Error during print process:', error);
        onShowError?.(`Print process failed: ${getErrorMessage(error)}`);
        // Note: No need to release pallet numbers as RPC handles transaction rollback
      } finally {
        console.log('[Admin QC Label] Cleaning up...');
        setIsProcessing(false);
      }
    },
    [
      isProcessing,
      productInfo,
      formData,
      setFormData,
      onProductInfoReset,
      onShowError,
      onShowWarning,
      checkCooldownPeriod,
      setCooldownTimer,
      validateForm,
      generateBatch,
      supabase,
    ]
  );

  return {
    // ACO handlers
    handleAutoAcoConfirm,

    // Slate handlers
    handleSlateDetailChange,

    // Print handlers
    handlePrintLabel,
    handleClockNumberConfirm,

    // Processing state
    isProcessing,

    // Computed values
    isAcoOrderExcess,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,

    // PDF generation state from unified hook
    pdfState,
    cancelPdfGeneration,
  };
};
