'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MIN_ACO_ORDER_REF_LENGTH } from '../constants';
// 導入新的模組化 hooks
import { useAuth } from './modules/useAuth';
import { useFormValidation } from './modules/useFormValidation';
import { useClockConfirmation } from './modules/useClockConfirmation';
import { useAcoManagement } from './modules/useAcoManagement';
import { useSlateManagement } from './modules/useSlateManagement';
import { usePdfGeneration } from './modules/usePdfGeneration';
import { useStreamingPdfGeneration } from './modules/useStreamingPdfGeneration';
// Removed unused import - using useDatabaseOperationsV2 instead
import { useDatabaseOperationsV2 } from './modules/useDatabaseOperationsV2';
import { useStockUpdates } from './modules/useStockUpdates';
import { useFormPersistence } from './modules/useFormPersistence';
import { toast } from 'sonner';
import type { ProductInfo, FormData, SlateDetail } from '../types';
import { confirmPalletUsage, releasePalletReservation } from '@/app/utils/optimizedPalletGenerationV6';
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
  onProductInfoReset
}: UseQcLabelBusinessProps) => {
  // Supabase client for v6 operations
  const supabase = createClient();

  // 使用模組化的 hooks
  const { refreshAuth } = useAuth({ 
    setUserId: (userId) => setFormData(prev => ({ ...prev, userId })) 
  });
  
  const { 
    canSearchAco,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,
    isAcoOrderExcess,
    validateForm,
    validateAcoOrderDetails
  } = useFormValidation({ formData, productInfo });
  
  const {
    isClockConfirmOpen,
    setIsClockConfirmOpen,
    printEventToProceed,
    setPrintEventToProceed,
    handleClockNumberCancel,
    checkCooldownPeriod,
    setCooldownTimer
  } = useClockConfirmation();
  
  const {
    handleAcoSearch,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess
  } = useAcoManagement({ formData, setFormData, productInfo });
  
  const {
    handleSlateDetailChange,
    handleSlateBatchNumberChange,
    validateSlateDetails,
    clearSlateDetails
  } = useSlateManagement({ formData, setFormData });
  
  const { generatePdfs, printPdfs } = usePdfGeneration();
  const { generatePdfsStream, streamingStatus, cancelStreaming } = useStreamingPdfGeneration();
  // 使用優化版本的數據庫操作（如果需要回退，改回 useDatabaseOperations）
  const { generatePalletNumbers, createQcRecords, warmupBuffer } = useDatabaseOperationsV2();
  const { updateStockAndWorkLevels, updateAcoOrderStatus, clearCache } = useStockUpdates();
  
  // 表單持久化
  const {
    lastSaved,
    clearSavedData,
    hasSavedData
  } = useFormPersistence({
    formData,
    setFormData,
    isEnabled: true,
    autoSaveDelay: 1000
  });

  // State for preventing duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);
  

  // Main print logic
  const handlePrintLabel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store the event and open clock number confirmation
    setPrintEventToProceed(e);
    setIsClockConfirmOpen(true);
  }, [setIsClockConfirmOpen, setPrintEventToProceed]);

  // Handle clock number confirmation
  const handleClockNumberConfirm = useCallback(async (clockNumber: string) => {
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
    let generationResult: any = null;
    let sortedPalletNumbers: string[] = [];

    try {
      // Initialize progress
      setFormData(prev => ({
        ...prev,
        pdfProgress: {
          current: 0,
          total: count,
          status: Array(count).fill('Pending')
        }
      }));

      // 生成托盤編號和系列號
      generationResult = await generatePalletNumbers(count);
      
      if (generationResult.error || !generationResult.palletNumbers || !generationResult.series) {
        toast.error(generationResult.error || 'Failed to generate pallet numbers');
        setIsProcessing(false);
        setPrintEventToProceed(null);
        return;
      }
      
      const { palletNumbers: generatedPalletNumbers, series: generatedSeries } = generationResult;
      
      // 再次確保排序正確（防禦性編程）
      const sortedData = generatedPalletNumbers.map((pallet: string, index: number) => ({
        pallet,
        series: generatedSeries[index]
      })).sort((a: any, b: any) => {
        const numA = parseInt(a.pallet.split('/')[1]);
        const numB = parseInt(b.pallet.split('/')[1]);
        return numA - numB;
      });
      
      sortedPalletNumbers = sortedData.map((item: any) => item.pallet);
      const sortedSeries = sortedData.map((item: any) => item.series);
      
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[QC Label] Sorted pallet numbers for processing:', sortedPalletNumbers);

      // 處理每個托盤 - 先創建數據庫記錄，再生成 PDF
      for (let i = 0; i < count; i++) {
        const palletNum = sortedPalletNumbers[i];
        const series = sortedSeries[i];
        
        // 創建數據庫記錄
        const dbResult = await createQcRecords({
          productInfo,
          quantity,
          count,
          clockNumber,
          formData,
          palletNum,
          series,
          palletIndex: i
        });
        
        if (!dbResult.success) {
          if (dbResult.error === 'DUPLICATE_PALLET') {
            // 停止處理並重置表單
            setFormData(prev => ({
              ...prev,
              pdfProgress: {
                current: 0,
                total: 0,
                status: []
              }
            }));
            setIsProcessing(false);
            setPrintEventToProceed(null);
            return;
          }
          
          // 更新進度為失敗並繼續下一個
          setFormData(prev => ({
            ...prev,
            pdfProgress: {
              ...prev.pdfProgress,
              status: prev.pdfProgress.status.map((s, idx) => idx === i ? 'Failed' : s)
            }
          }));
          continue;
        }
      }
      
      // 生成 PDFs - 自動選擇模式：count > 1 使用串流模式
      let pdfResult;
      const shouldUseStreaming = count > 1;
      
      if (shouldUseStreaming) {
        // 多個標籤時自動使用串流模式
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[QC Label] Auto-enabled streaming mode for ${count} labels`);
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
                )
              }
            }));
          },
          onStreamComplete: (blob, url, index) => {
            // 可以在這裡處理單個 PDF 完成的邏輯
            process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[QC Label] Label ${index + 1} completed in streaming mode`);
          },
          batchSize: 5 // 每批處理 5 個
        });
      } else {
        // 單個標籤使用傳統模式
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[QC Label] Using normal mode for single label`);
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
                )
              }
            }));
          }
        });
      }

      // 打印 PDFs
      if (pdfResult.success && pdfResult.pdfBlobs.length > 0) {
        await printPdfs(
          pdfResult.pdfBlobs,
          productInfo.code,
          sortedPalletNumbers,
          sortedSeries
        );
        
        // 確認托盤編號已使用（v6 系統）
        const confirmResult = await confirmPalletUsage(sortedPalletNumbers, supabase);
        if (!confirmResult) {
          process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[QC Label] Failed to confirm pallet usage for v6 system');
        }
        
        // 更新庫存和工作記錄
        const totalQuantity = quantity * count;
        const stockUpdateResult = await updateStockAndWorkLevels({
          productInfo,
          totalQuantity,
          palletCount: count,
          clockNumber,
          acoOrderRef: formData.acoOrderRef,
          isNewAcoOrder: formData.acoNewRef
        });
        
        if (!stockUpdateResult.success) {
          toast.warning(`Print successful, but failed to update records: ${stockUpdateResult.error}`);
        }
        
        // 更新 ACO 訂單狀態
        if (productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef?.trim()) {
          const orderRefNum = parseInt(formData.acoOrderRef.trim(), 10);
          await updateAcoOrderStatus({
            orderRef: orderRefNum,
            productCode: productInfo.code,
            quantityUsed: totalQuantity
          });
        }
      } else {
        // 打印失敗，釋放托盤編號（v6 系統）
        const releaseResult = await releasePalletReservation(sortedPalletNumbers, supabase);
        if (!releaseResult) {
          process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[QC Label] Failed to release pallet reservation for v6 system');
        }
        
        if (pdfResult.errors.length > 0) {
          toast.warning('Processing finished. Some labels failed. No PDFs generated for printing.');
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
            status: []
          },
          slateDetail: {
            batchNumber: ''
          }
        }));
        
        // Reset productInfo in parent component
        if (onProductInfoReset) {
          onProductInfoReset();
        }
        
        // 清除已保存的表單數據
        clearSavedData();
      }

    } catch (error: any) {
      // console.error('Error during print process:', error); // 保留錯誤日誌供生產環境調試
      toast.error(`Print process failed: ${error.message}`);
      
      // 發生錯誤時釋放已保留的托盤編號（如果有的話）
      if (sortedPalletNumbers && sortedPalletNumbers.length > 0) {
        const releaseResult = await releasePalletReservation(sortedPalletNumbers, supabase);
        if (!releaseResult) {
          process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[QC Label] Failed to release pallet reservation after error');
        }
      }
    } finally {
      setIsProcessing(false);
      setPrintEventToProceed(null);
    }
  }, [
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
    generatePalletNumbers,
    createQcRecords,
    generatePdfs,
    generatePdfsStream,
    printPdfs,
    updateStockAndWorkLevels,
    updateAcoOrderStatus,
    clearSavedData,
    supabase
  ]);



  return {
    // ACO handlers
    handleAcoSearch,
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
    
    // Form persistence
    lastSaved,
    clearSavedData,
    hasSavedData,
    
    // Streaming PDF generation
    streamingStatus,
    cancelStreaming
  };
};

