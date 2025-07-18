'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { MIN_ACO_ORDER_REF_LENGTH } from '../constants';
// 導入新的模組化 hooks
import { useUserId } from '@/app/hooks/useUserId';
import { useFormValidation } from './modules/useFormValidation';
import { useClockConfirmation } from './modules/useClockConfirmation';
import { useAcoManagement } from './modules/useAcoManagement';
import { useSlateManagement } from './modules/useSlateManagement';
import { usePdfGeneration } from './modules/usePdfGeneration';
import { useStreamingPdfGeneration } from './modules/useStreamingPdfGeneration';
// Using Server Actions for database operations
import { createQcDatabaseEntriesWithTransaction } from '@/app/actions/qcActions';
import { useStockUpdates } from './modules/useStockUpdates';
import { toast } from 'sonner';
import type { ProductInfo, FormData, SlateDetail } from '../types';
import { generatePalletNumbers, confirmPalletUsage, releasePalletReservation } from '@/app/utils/palletGeneration';
import { createClient } from '@/app/utils/supabase/client';

interface UseQcLabelBusinessProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productInfo: ProductInfo | null;
  onProductInfoReset?: () => void;
}

export const useQcLabelBusiness = ({
  formData,
  setFormData,
  productInfo,
  onProductInfoReset,
}: UseQcLabelBusinessProps) => {
  // Supabase client for v6 operations
  const supabase = createClient();

  // 使用統一的 useUserId hook
  const { userId, refreshUser } = useUserId();

  // 當 userId 改變時更新 formData
  useEffect(() => {
    if (userId) {
      setFormData(prev => ({ ...prev, userId }));
    }
  }, [userId, setFormData]);

  const {
    canSearchAco,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,
    isAcoOrderExcess,
    validateForm,
    validateAcoOrderDetails,
  } = useFormValidation({ formData, productInfo });

  const {
    isClockConfirmOpen,
    setIsClockConfirmOpen,
    printEventToProceed,
    setPrintEventToProceed,
    handleClockNumberCancel,
    checkCooldownPeriod,
    setCooldownTimer,
  } = useClockConfirmation();

  const {
    handleAcoSearch,
    handleAutoAcoConfirm,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess,
  } = useAcoManagement({ formData, setFormData, productInfo });

  const {
    handleSlateDetailChange,
    handleSlateBatchNumberChange,
    validateSlateDetails,
    clearSlateDetails,
  } = useSlateManagement({ formData, setFormData });

  const { generatePdfs, printPdfs } = usePdfGeneration();
  const { generatePdfsStream, streamingStatus, cancelStreaming } = useStreamingPdfGeneration();
  const { updateStockAndWorkLevels, updateAcoOrderStatus, clearCache } = useStockUpdates();

  // State for preventing duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);

  // Main print logic
  const handlePrintLabel = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Store the event and open clock number confirmation
      setPrintEventToProceed(e);
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
        toast.warning('Processing in progress. Please wait...');
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

      // 清除緩存
      await clearCache();

      // 驗證基本表單數據
      const { isValid, errors } = validateForm();
      if (!isValid) {
        const errorMessage = Object.values(errors).join(', ');
        toast.error(errorMessage);
        setIsProcessing(false);
        setPrintEventToProceed(null);
        return;
      }

      // 檢查 productInfo 是否存在
      if (!productInfo) {
        toast.error('Please select a valid product code');
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

        // Step 1: Generate pallet numbers and series
        const palletResult = await generatePalletNumbers({
          count,
          sessionId: `qc-${Date.now()}`
        });
        
        if (!palletResult.success) {
          toast.error(palletResult.error || 'Failed to generate pallet numbers');
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }

        sortedPalletNumbers = palletResult.palletNumbers;
        const sortedSeries = palletResult.series;

        console.log('[QC Label] Generated pallet numbers:', {
          pallets: sortedPalletNumbers,
          series: sortedSeries,
        });

        // Step 2: Create database entries
        const totalQuantity = quantity * count;
        const currentTime = new Date().toISOString();
        
        // Prepare database payloads
        for (let i = 0; i < count; i++) {
          const pltRemark =
            productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
              ? `ACO Ref: ${formData.acoOrderRef.trim()}`
              : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber?.trim()
                ? `Batch: ${formData.slateDetail.batchNumber.trim()}`
                : 'QC Finished';

          const dbPayload = {
            palletInfo: {
              plt_num: sortedPalletNumbers[i],
              series: sortedSeries[i],
              product_code: productInfo.code,
              product_qty: quantity,
              plt_remark: pltRemark,
            },
            historyRecord: {
              time: currentTime,
              id: clockNumber,
              action: 'Create new pallet',
              plt_num: sortedPalletNumbers[i],
              loc: 'AWAITING AREA',
              remark: `Created via QC Label - ${productInfo.code}`,
            },
            inventoryRecord: {
              product_code: productInfo.code,
              plt_num: sortedPalletNumbers[i],
              await: quantity,
            },
            // Handle Slate records if applicable
            slateRecords: productInfo.type === 'Slate' && formData.slateDetail?.batchNumber?.trim()
              ? [{
                  first_off: currentTime,
                  batch_num: formData.slateDetail.batchNumber.trim(),
                  setter: formData.operator || '',
                  material: '',
                  weight: 0,
                  t_thick: 0,
                  b_thick: 0,
                  length: 0,
                  width: 0,
                  centre_hole: 0,
                  colour: '',
                  shape: '',
                  flame_test: 0,
                  remark: '',
                  code: productInfo.code,
                  plt_num: sortedPalletNumbers[i],
                  mach_num: '',
                  uuid: '',
                }]
              : undefined,
          };

          // Don't update ACO in the loop - do it after successful printing
          const dbResult = await createQcDatabaseEntriesWithTransaction(
            dbPayload,
            clockNumber
            // Remove ACO update from here
          );

          if (dbResult.error) {
            toast.error(`Failed to create database entries: ${dbResult.error}`);
            // Release reserved pallet numbers on failure
            await releasePalletReservation(sortedPalletNumbers, supabase);
            setIsProcessing(false);
            setPrintEventToProceed(null);
            return;
          }
        }

        // Step 3: Update stock and work levels
        const stockUpdateResult = await updateStockAndWorkLevels({
          productInfo,
          totalQuantity,
          palletCount: count,
          clockNumber,
          acoOrderRef: formData.acoOrderRef,
          isNewAcoOrder: formData.acoNewRef,
        });

        if (!stockUpdateResult.success) {
          console.error('Failed to update stock levels:', stockUpdateResult.error);
          // Continue anyway as database entries are already created
          toast.warning('Database entries created but stock update failed');
        }

        // 生成 PDFs - 自動選擇模式：count > 1 使用串流模式
        let pdfResult;
        const shouldUseStreaming = count > 1;

        if (shouldUseStreaming) {
          // 多個標籤時自動使用串流模式
          console.log(`[QC Label] Auto-enabled streaming mode for ${count} labels`);
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
              console.log(`[QC Label] Label ${index + 1} completed in streaming mode`);
            },
            batchSize: 5, // 每批處理 5 個
          });
        } else {
          // 單個標籤使用傳統模式
          console.log(`[QC Label] Using normal mode for single label`);
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

          // 確認托盤編號已使用（v6 系統）
          const confirmResult = await confirmPalletUsage(sortedPalletNumbers, supabase);
          if (!confirmResult) {
            console.warn('[QC Label] Failed to confirm pallet usage for v6 system');
          }

          // 注意：統一 RPC 已經處理了所有庫存和工作記錄更新
          // 包括 stock_level, work_level, record_palletinfo, record_history, record_inventory
          // 因此不需要再次調用 updateStockAndWorkLevels 避免重複更新

          // 更新 ACO 訂單狀態
          if (productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef?.trim()) {
            const totalQuantity = quantity * count; // 計算總數量供 ACO 使用
            const orderRefNum = parseInt(formData.acoOrderRef.trim(), 10);
            await updateAcoOrderStatus({
              orderRef: orderRefNum,
              productCode: productInfo.code,
              quantityUsed: totalQuantity,
            });
          }
        } else {
          // 打印失敗，釋放托盤編號（v6 系統）
          const releaseResult = await releasePalletReservation(sortedPalletNumbers, supabase);
          if (!releaseResult) {
            console.warn('[QC Label] Failed to release pallet reservation for v6 system');
          }

          if (pdfResult.errors.length > 0) {
            toast.warning(
              'Processing finished. Some labels failed. No PDFs generated for printing.'
            );
          } else {
            toast.error('No valid labels to process. No PDF generated for printing.');
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
            acoOrderDetails: [],
            acoNewRef: false,
            acoNewProductCode: '',
            acoNewOrderQty: '',
            acoRemain: null,
            acoOrderDetailErrors: [],
            acoSearchLoading: false,
            availableAcoOrderRefs: [],
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
        // console.error('Error during print process:', error); // 保留錯誤日誌供生產環境調試
        toast.error(`Print process failed: ${getErrorMessage(error)}`);

        // 發生錯誤時釋放已保留的托盤編號（如果有的話）
        if (sortedPalletNumbers && sortedPalletNumbers.length > 0) {
          const releaseResult = await releasePalletReservation(sortedPalletNumbers, supabase);
          if (!releaseResult) {
            console.warn('[QC Label] Failed to release pallet reservation after error');
          }
        }
      } finally {
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
      checkCooldownPeriod,
      setCooldownTimer,
      clearCache,
      validateForm,
      generatePdfs,
      generatePdfsStream,
      printPdfs,
      updateStockAndWorkLevels,
      updateAcoOrderStatus,
      supabase,
    ]
  );

  return {
    // ACO handlers
    handleAcoSearch,
    handleAutoAcoConfirm,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess,

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
    canSearchAco,
    isAcoOrderExcess,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,

    // Streaming PDF generation
    streamingStatus,
    cancelStreaming,
  };
};
