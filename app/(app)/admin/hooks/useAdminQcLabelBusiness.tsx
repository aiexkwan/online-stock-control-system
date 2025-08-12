'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '@/types/core/error';
import { MIN_ACO_ORDER_REF_LENGTH } from '../components/qc-label-constants';
// 導入新的模組化 hooks
import { useUserId } from '@/app/hooks/useUserId';
import { useAdminFormValidation } from './useAdminFormValidation';
import { useClockConfirmation, type PrintEvent } from '@/app/components/qc-label-form/hooks/modules/useClockConfirmation';
import { usePdfGeneration } from './usePdfGeneration';
import { useStreamingPdfGeneration } from '@/app/components/qc-label-form/hooks/modules/useStreamingPdfGeneration';
import type { ProductInfo, AdminFormData, SlateDetail } from '../types/adminQcTypes';
import { createClient } from '@/app/utils/supabase/client';

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
  // Supabase client for v6 operations
  const supabase = createClient();

  // 使用統一的 useUserId hook
  const { userId, refreshUser } = useUserId();

  // 當 userId 改變時更新 formData
  useEffect(() => {
    if (userId && formData.userId !== userId) {
      setFormData(prev => ({ ...prev, userId }));
    }
  }, [userId, formData.userId, setFormData]);

  const {
    validateForm,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,
    isAcoOrderExcess,
    canSearchAco,
    validateAcoOrderDetails,
  } = useAdminFormValidation({ formData, productInfo });

  const {
    isClockConfirmOpen,
    setIsClockConfirmOpen,
    printEventToProceed,
    setPrintEventToProceed,
    handleClockNumberCancel,
    checkCooldownPeriod,
    setCooldownTimer,
  } = useClockConfirmation();

  // Simple ACO management for admin - no complex hooks
  const handleAutoAcoConfirm = useCallback(async (selectedOrderRef: string) => {
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
          acoSearchLoading: false 
        }));
      } else {
        setFormData(prev => ({ ...prev, acoSearchLoading: false }));
      }
    } catch (error) {
      console.error('Error in handleAutoAcoConfirm:', error);
      setFormData(prev => ({ ...prev, acoSearchLoading: false }));
    }
  }, [productInfo?.code, supabase, setFormData]);

  // Simple slate management for admin
  const handleSlateDetailChange = useCallback((detail: SlateDetail) => {
    setFormData(prev => ({ ...prev, slateDetail: detail }));
  }, [setFormData]);

  const { generatePdfs, printPdfs } = usePdfGeneration();
  const { generatePdfsStream, streamingStatus, cancelStreaming } = useStreamingPdfGeneration();

  // State for preventing duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);

  // Main print logic
  const handlePrintLabel = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 策略 2: DTO/自定義 type interface - 將 FormEvent 轉換為 PrintEvent
      const printEvent: PrintEvent = {
        type: 'form_submit',
        data: {
          timeStamp: e.timeStamp,
          currentTarget: e.currentTarget,
        },
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      };

      // Store the event and open clock number confirmation
      setPrintEventToProceed(printEvent);
      setIsClockConfirmOpen(true);
    },
    [setIsClockConfirmOpen, setPrintEventToProceed]
  );

  // Handle clock number confirmation
  const handleClockNumberConfirm = useCallback(
    async (clockNumber: string) => {
      setIsClockConfirmOpen(false);

      // Prevent duplicate submissions
      if (isProcessing) {
        onShowWarning?.('Processing in progress. Please wait...');
        setPrintEventToProceed(null);
        return;
      }

      // 檢查冷卻期
      if (checkCooldownPeriod()) {
        setPrintEventToProceed(null);
        return;
      }

      // Set processing state
      setIsProcessing(true);
      setCooldownTimer();

      // 驗證基本表單數據
      const { isValid, errors } = validateForm();
      if (!isValid) {
        const errorMessage = errors && typeof errors === 'object' 
          ? Object.values(errors).join(', ')
          : 'Validation failed';
        onShowError?.(errorMessage);
        setIsProcessing(false);
        setPrintEventToProceed(null);
        return;
      }

      // 檢查 productInfo 是否存在
      if (!productInfo) {
        onShowError?.('Please select a valid product code');
        setIsProcessing(false);
        setPrintEventToProceed(null);
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

        console.log('[Admin QC Label] Calling RPC handle_qc_label_print_fixed...');
        console.log('[Admin QC Label] Product info:', {
          code: productInfo.code,
          type: productInfo.type,
          description: productInfo.description
        });

        // Log RPC parameters for debugging
        const rpcParams = {
          p_product_code: productInfo.code,
          p_quantity: quantity,
          p_count: count,
          p_user_id: parseInt(clockNumber, 10),  // QC 員工編號
          p_aco_order_ref: productInfo.type === 'ACO' && formData.acoOrderRef?.trim() 
            ? formData.acoOrderRef.trim() 
            : null,
          p_batch_number: productInfo.type?.toLowerCase().includes('slate') && formData.slateDetail?.batchNumber?.trim()
            ? formData.slateDetail.batchNumber.trim()
            : null,
          p_operator_clock: formData.operator?.trim() || null  // 生產員工編號
        };
        
        console.log('[Admin QC Label] RPC parameters:', rpcParams);

        // Step 1: Call RPC to handle all database operations
        // TODO: In future phase, migrate ACO order update to use GraphQL updateAcoOrder mutation
        // Currently ACO order updates are handled within the RPC function
        const rpcResult = await supabase.rpc('handle_qc_label_print', rpcParams);

        console.log('[Admin QC Label] Raw RPC result:', rpcResult);

        if (rpcResult.error) {
          console.error('[Admin QC Label] RPC error:', rpcResult.error);
          onShowError?.(`Failed to process QC label: ${rpcResult.error.message}`);
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }

        // Check if RPC returned null or undefined
        if (!rpcResult.data) {
          console.error('[Admin QC Label] RPC returned null/undefined data');
          onShowError?.('Server returned empty response. Please try again.');
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }

        const rpcData = rpcResult.data as RpcResponse;
        console.log('[Admin QC Label] RPC data after cast:', rpcData);
        
        // Check if rpcData has the expected structure
        if (typeof rpcData !== 'object' || !('success' in rpcData)) {
          console.error('[Admin QC Label] RPC data has unexpected structure:', rpcData);
          onShowError?.('Server returned invalid response format.');
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }
        
        if (!rpcData.success) {
          console.error('[Admin QC Label] RPC failed:', rpcData.message);
          // 特別處理產品找不到的錯誤
          if (rpcData.message.includes('Product code not found')) {
            onShowError?.(`Product code "${productInfo.code}" not found in database. Please verify the product exists.`);
          } else {
            onShowError?.(`Processing failed: ${rpcData.message}`);
          }
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }

        console.log('[Admin QC Label] RPC completed successfully:', {
          pallet_data: rpcData.pallet_data?.length || 0,
          message: rpcData.message
        });

        // Extract pallet numbers and series from RPC result
        if (!rpcData.pallet_data || rpcData.pallet_data.length === 0) {
          console.error('[Admin QC Label] No pallet data in RPC response:', rpcData);
          
          // Check if there are failed pallets to provide more specific error message
          if (rpcData.failed_pallets && rpcData.failed_pallets.length > 0) {
            const firstError = rpcData.failed_pallets[0];
            console.error('[Admin QC Label] Failed pallet details:', firstError);
            
            if (firstError.error.includes('duplicate key value violates unique constraint')) {
              onShowError?.('Database constraint error: A pallet record already exists with this combination. This may indicate data synchronization issues. Please contact system administrator.');
            } else {
              onShowError?.(`Processing failed: ${firstError.error}`);
            }
          } else {
            onShowError?.('No data returned from server. Please check product code exists in database.');
          }
          
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }

        // Handle array of pallet data objects
        sortedPalletNumbers = rpcData.pallet_data.map((p) => p.pallet_number);
        sortedSeries = rpcData.pallet_data.map((p) => p.series);

        // Log any failed pallets
        if (rpcData.failed_pallets && rpcData.failed_pallets.length > 0) {
          console.warn('[Admin QC Label] Some pallets failed:', rpcData.failed_pallets);
          const successCount = rpcData.pallet_data.length;
          onShowWarning?.(`${successCount} of ${count} pallets processed successfully`);
        }

        // 生成 PDFs - 自動選擇模式：count > 1 使用串流模式
        console.log('[Admin QC Label] Starting PDF generation...');
        let pdfResult;
        const shouldUseStreaming = count > 1;

        if (shouldUseStreaming) {
          // 多個標籤時自動使用串流模式
          console.log(`[Admin QC Label] Auto-enabled streaming mode for ${count} labels`);
          pdfResult = await generatePdfsStream({
            productInfo,
            quantity,
            count,
            palletNumbers: sortedPalletNumbers,
            series: sortedSeries,
            formData,
            clockNumber,
            onProgress: (current, status) => {
              setFormData(prev => ({
                ...prev,
                pdfProgress: {
                  ...prev.pdfProgress,
                  current,
                  status: prev.pdfProgress.status.map((s, idx) =>
                    idx === current - 1 ? status : s
                  ),
                },
              }));
            },
            onStreamComplete: (blob, url, index) => {
              // 可以在這裡處理單個 PDF 完成的邏輯
              console.log(`[Admin QC Label] Label ${index + 1} completed in streaming mode`);
            },
            batchSize: 5, // 每批處理 5 個
          });
        } else {
          // 單個標籤使用傳統模式
          console.log(`[Admin QC Label] Using normal mode for single label`);
          pdfResult = await generatePdfs({
            productInfo,
            quantity,
            count,
            palletNumbers: sortedPalletNumbers,
            series: sortedSeries,
            formData,
            clockNumber,
            onProgress: (current, status) => {
              setFormData(prev => ({
                ...prev,
                pdfProgress: {
                  ...prev.pdfProgress,
                  current,
                  status: prev.pdfProgress.status.map((s, idx) =>
                    idx === current - 1 ? status : s
                  ),
                },
              }));
            },
          });
        }

        // 打印 PDFs
        if (pdfResult.success && pdfResult.pdfBlobs.length > 0) {
          await printPdfs(
            pdfResult.pdfBlobs,
            productInfo.code,
            sortedPalletNumbers,
            sortedSeries,
            quantity,
            clockNumber
          );

          // Note: RPC has already handled all database operations including:
          // - Pallet number confirmation
          // - Stock level updates
          // - Work level updates
          // - ACO order updates
          // So no additional database operations are needed here
        } else {
          if (pdfResult.errors.length > 0) {
            onShowWarning?.(
              'Processing finished. Some labels failed. No PDFs generated for printing.'
            );
          } else {
            onShowError?.('No valid labels to process. No PDF generated for printing.');
          }
        }

        // 重置表單
        if (pdfResult.success && pdfResult.pdfBlobs.length > 0) {
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
        setPrintEventToProceed(null);
      }
    },
    [
      isProcessing,
      setIsClockConfirmOpen,
      setPrintEventToProceed,
      productInfo,
      formData,
      setFormData,
      onProductInfoReset,
      onShowError,
      onShowWarning,
      checkCooldownPeriod,
      setCooldownTimer,
      validateForm,
      generatePdfs,
      generatePdfsStream,
      printPdfs,
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
    handleClockNumberCancel,

    // Clock number confirmation state
    isClockConfirmOpen,

    // Processing state
    isProcessing,

    // Computed values
    isAcoOrderExcess,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,

    // Streaming PDF generation
    streamingStatus,
    cancelStreaming,
  };
};