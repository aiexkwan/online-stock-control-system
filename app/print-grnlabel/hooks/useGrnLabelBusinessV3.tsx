'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createClient } from '@/app/utils/supabase/client';
import { grnErrorHandler } from '../services/ErrorHandler';
import { 
  createGrnDatabaseEntries,
  createGrnDatabaseEntriesBatch,
  uploadPdfToStorage as grnActionsUploadPdfToStorage,
  updatePalletPdfUrl,
  type GrnPalletInfoPayload, 
  type GrnRecordPayload 
} from '@/app/actions/grnActions';
import { PALLET_TYPE_OPTIONS, PACKAGE_TYPE_OPTIONS } from '@/app/constants/grnConstants';
import { 
  prepareGrnLabelData, 
  GrnInputData, 
  mergeAndPrintPdfs as pdfUtilsMergeAndPrintPdfs,
  generatePalletPdfFileName
} from '@/lib/pdfUtils';
import { 
  TransactionLogService,
  TransactionSource,
  TransactionOperation 
} from '@/app/services/transactionLog.service';
import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { 
  PALLET_WEIGHTS, 
  PACKAGE_WEIGHTS,
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode 
} from '@/app/constants/grnConstants';

// Import reducer types
import type { GrnFormState, GrnFormAction } from './useGrnFormReducer';

// Import custom hooks
import { useWeightCalculation } from './useWeightCalculation';
import { usePalletGenerationGrn } from './usePalletGenerationGrn';
import { confirmPalletUsage } from '@/app/utils/palletGeneration';
import { usePrintIntegration } from './usePrintIntegration';

interface UseGrnLabelBusinessV3Props {
  state: GrnFormState;
  actions: {
    setSupplierInfo: (supplierInfo: GrnFormState['supplierInfo']) => void;
    setSupplierError: (error: string | null) => void;
    setProcessing: (isProcessing: boolean) => void;
    setProgress: (progress: GrnFormState['progress']) => void;
    updateProgressStatus: (index: number, status: GrnFormState['progress']['status'][number]) => void;
    resetProductAndWeights: () => void;
  };
  currentUserId: string;
}

interface UseGrnLabelBusinessV3Return {
  weightCalculation: ReturnType<typeof useWeightCalculation>;
  processPrintRequest: (clockNumber: string) => Promise<void>;
}

/**
 * Core business logic hook for GRN Label (V3 版本 - 支援事務管理)
 * 管理 GRN 標籤的核心業務邏輯，包含完整的事務追蹤和回滾機制
 */
export const useGrnLabelBusinessV3 = ({
  state,
  actions,
  currentUserId,
}: UseGrnLabelBusinessV3Props): UseGrnLabelBusinessV3Return => {
  
  // Use custom hooks
  const weightCalculation = useWeightCalculation({ 
    grossWeights: state.grossWeights, 
    palletType: state.palletType, 
    packageType: state.packageType 
  });
  const palletGeneration = usePalletGenerationGrn();
  const { printGrnLabels } = usePrintIntegration();

  // Main processing function with transaction support
  const processPrintRequest = useCallback(async (clockNumber: string) => {
    actions.setProcessing(true);
    
    // Initialize transaction logging
    const transactionLog = new TransactionLogService();
    const transactionId = transactionLog.generateTransactionId();
    
    // Declare variables at outer scope for access in catch block
    let palletNumbers: string[] = [];
    let series: string[] = [];
    let stepSequence = 0;

    try {
      // Start transaction logging
      await transactionLog.startTransaction({
        transactionId,
        sourceModule: TransactionSource.GRN_LABEL,
        sourcePage: '/print-grnlabel',
        sourceAction: 'bulk_print',
        operationType: TransactionOperation.PRINT_LABEL,
        userId: currentUserId,
        userClockNumber: clockNumber,
        metadata: {
          grnNumber: state.formData.grnNumber,
          materialCode: state.productInfo?.code,
          supplierCode: state.supplierInfo?.code,
          labelMode: state.labelMode,
          palletCount: state.grossWeights.filter(gw => gw.trim() !== '').length
        }
      }, {
        formData: state.formData,
        productInfo: state.productInfo,
        supplierInfo: state.supplierInfo,
        grossWeights: state.grossWeights,
        palletType: state.palletType,
        packageType: state.packageType
      });

      if (!state.productInfo || !state.supplierInfo) {
        const error = new Error('Product or supplier information is missing');
        await transactionLog.recordError(transactionId, error, 'VALIDATION_ERROR');
        grnErrorHandler.handleValidationError(
          'form',
          error.message,
          {
            component: 'useGrnLabelBusinessV3',
            action: 'form_submission',
            clockNumber,
            transactionId
          }
        );
        return;
      }

      const filledGrossWeights = state.grossWeights.map(gw => gw.trim()).filter(gw => gw !== '');
      if (filledGrossWeights.length === 0) {
        const error = new Error('Please enter at least one gross weight');
        await transactionLog.recordError(transactionId, error, 'VALIDATION_ERROR');
        grnErrorHandler.handleValidationError(
          'grossWeights',
          error.message,
          {
            component: 'useGrnLabelBusinessV3',
            action: 'form_submission',
            clockNumber,
            transactionId
          }
        );
        return;
      }

      const numberOfPalletsToProcess = filledGrossWeights.length;
      const palletCountForGrnRecord = Object.values(state.palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      const packageCountForGrnRecord = Object.values(state.packageType).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      
      // 將 key 轉換為顯示標籤
      const selectedPalletTypeOption = PALLET_TYPE_OPTIONS.find(opt => opt.key === weightCalculation.selectedPalletType);
      const selectedPalletTypeString = selectedPalletTypeOption?.label || 'Not Included';
      
      const selectedPackageTypeOption = PACKAGE_TYPE_OPTIONS.find(opt => opt.key === weightCalculation.selectedPackageType);
      const selectedPackageTypeString = selectedPackageTypeOption?.label || 'Not Included';

      actions.setProgress({ 
        current: 0, 
        total: numberOfPalletsToProcess, 
        status: Array(numberOfPalletsToProcess).fill('Pending') 
      });

      const collectedPdfBlobs: Blob[] = [];
      let anyFailure = false;

      // Generate pallet numbers
      const result = await palletGeneration.generatePalletNumbers(numberOfPalletsToProcess, clockNumber);
      palletNumbers = result.palletNumbers;
      series = result.series;
      const { success } = result;
      
      if (!success) {
        await transactionLog.recordError(
          transactionId,
          new Error('Failed to generate pallet numbers'),
          'PALLET_GENERATION_ERROR'
        );
        return;
      }
      
      // Record pallet allocation step
      await transactionLog.recordStep(transactionId, {
        name: 'pallet_allocation',
        sequence: ++stepSequence,
        data: { 
          palletNumbers, 
          series,
          count: numberOfPalletsToProcess 
        }
      });

      process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV3] Processing pallets:', numberOfPalletsToProcess);

      // ===== 使用統一 RPC 批量處理 =====
      process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV3] 使用統一 RPC 批量處理 GRN 標籤...');
      
      // 準備批量處理的數據
      const grossWeights = filledGrossWeights.map(gw => parseFloat(gw));
      const netWeights = grossWeights.map(gw => weightCalculation.getNetWeightForPallet(gw));
      const quantities = netWeights; // 對於 GRN，數量就是淨重
      
      try {
        // 調用統一批量處理 RPC
        const batchResult = await createGrnDatabaseEntriesBatch(
          state.formData.grnNumber,
          state.productInfo.code,
          state.supplierInfo.code,
          clockNumber,
          state.labelMode,
          grossWeights,
          netWeights,
          quantities,
          palletCountForGrnRecord,
          packageCountForGrnRecord,
          selectedPalletTypeString,
          selectedPackageTypeString,
          [] // pdfUrls - 將在後續處理中填入
        );
        
        if (batchResult.success) {
          process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV3] 統一 RPC 批量處理成功:', batchResult);
          
          // Record database creation step
          await transactionLog.recordStep(transactionId, {
            name: 'database_records',
            sequence: ++stepSequence,
            data: {
              method: 'unified_rpc',
              recordCount: numberOfPalletsToProcess,
              palletNumbers: batchResult.data?.pallet_numbers || batchResult.palletNumbers,
              transactionData: batchResult.data
            }
          });
          
          // 從統一 RPC 結果中獲取棧板號碼和系列號
          const rpcPalletNumbers = batchResult.data?.pallet_numbers || [];
          const rpcSeries = batchResult.data?.series || [];
          
          if (rpcPalletNumbers.length === numberOfPalletsToProcess && rpcSeries.length === numberOfPalletsToProcess) {
            // 更新本地變數
            palletNumbers = rpcPalletNumbers;
            series = rpcSeries;
            
            // 現在只需要生成 PDF 並上傳
            for (let i = 0; i < numberOfPalletsToProcess; i++) {
              actions.setProgress({ 
                current: i + 1,
                total: numberOfPalletsToProcess,
                status: state.progress.status.map((s, idx) => idx === i ? 'Processing PDF' : s)
              });
              
              const currentGrossWeight = grossWeights[i];
              const netWeight = netWeights[i];
              const palletNum = palletNumbers[i];
              const seriesNum = series[i];
              
              // 生成 PDF
              const grnInputData: GrnInputData = {
                grnNumber: state.formData.grnNumber,
                materialSupplier: state.supplierInfo.code,
                productCode: state.productInfo.code,
                productDescription: state.productInfo.description,
                productType: null,
                netWeight: netWeight,
                series: seriesNum,
                palletNum: palletNum,
                receivedBy: clockNumber,
                labelMode: state.labelMode,
              };

              const pdfProps = await prepareGrnLabelData(grnInputData);
              
              if (pdfProps) {
                let pdfBlob: Blob;
                try {
                  pdfBlob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
                  collectedPdfBlobs.push(pdfBlob);
                  actions.updateProgressStatus(i, 'Completed');
                } catch (error) {
                  console.error('[useGrnLabelBusinessV3] PDF generation error:', error);
                  actions.updateProgressStatus(i, 'Failed');
                  anyFailure = true;
                }
              } else {
                actions.updateProgressStatus(i, 'Failed');
                anyFailure = true;
              }
            }
          } else {
            console.error('[useGrnLabelBusinessV3] 統一 RPC 返回的棧板數量不匹配');
            throw new Error('統一 RPC 返回的棧板數量不匹配');
          }
        } else {
          console.error('[useGrnLabelBusinessV3] 統一 RPC 處理失敗:', batchResult.error);
          throw new Error(batchResult.error || '統一 RPC 處理失敗');
        }
        
        // Process collected PDFs
        if (collectedPdfBlobs.length > 0) {
          // Record PDF generation step
          await transactionLog.recordStep(transactionId, {
            name: 'pdf_generation',
            sequence: ++stepSequence,
            data: {
              pdfCount: collectedPdfBlobs.length,
              totalSize: collectedPdfBlobs.reduce((sum, blob) => sum + blob.size, 0),
              hasFailures: anyFailure
            }
          });
          
          if (anyFailure) {
            grnErrorHandler.handleWarning(
              `Processed ${collectedPdfBlobs.length} of ${numberOfPalletsToProcess} labels successfully using unified RPC.`,
              {
                component: 'useGrnLabelBusinessV3',
                action: 'unified_rpc_processing',
                clockNumber,
                transactionId
              }
            );
          } else {
            console.log(`[useGrnLabelBusinessV3] 統一 RPC: All ${collectedPdfBlobs.length} labels generated successfully!`);
          }
  
          // Use unified printing service
          await printGrnLabels(collectedPdfBlobs, {
            grnNumber: state.formData.grnNumber,
            supplierCode: state.supplierInfo.code,
            productCode: state.productInfo.code,
            palletNumbers,
            series,
            userId: clockNumber, // Use clockNumber as userId for operatorClockNum
            clockNumber
          });
          
          // Complete transaction
          await transactionLog.completeTransaction(
            transactionId,
            {
              completedAt: new Date().toISOString(),
              palletCount: collectedPdfBlobs.length,
              method: 'unified_rpc',
              hasWarnings: anyFailure
            },
            {
              palletNumbers,
              grnNumber: state.formData.grnNumber,
              pdfCount: collectedPdfBlobs.length
            }
          );
          
          // Reset form after successful print
          setTimeout(() => {
            actions.resetProductAndWeights();
            actions.setProgress({ current: 0, total: 0, status: [] });
          }, 2000);
          
          return;
        }
        
      } catch (batchError) {
        console.error('[useGrnLabelBusinessV3] 統一 RPC 失敗:', batchError);
        
        // Record the batch processing failure
        await transactionLog.recordStep(transactionId, {
          name: 'batch_processing_failed',
          sequence: ++stepSequence,
          data: {
            error: batchError instanceof Error ? batchError.message : 'Unknown error',
            method: 'unified_rpc'
          }
        });
        
        // 這裡可以選擇是否回退到逐個處理方式
        // 目前直接拋出錯誤
        throw batchError;
      }

    } catch (error) {
      console.error('[useGrnLabelBusinessV3] Processing error:', error);
      
      // Record error in transaction log
      const errorLogId = await transactionLog.recordError(
        transactionId,
        error as Error,
        'GRN_PROCESSING_ERROR',
        {
          grnNumber: state.formData.grnNumber,
          palletCount: palletNumbers.length,
          stepSequence,
          lastStep: stepSequence > 0 ? `Step ${stepSequence}` : 'Initialization'
        }
      );
      
      // Execute rollback through transaction service
      try {
        const rollbackResult = await transactionLog.executeRollback(
          transactionId,
          clockNumber,
          `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        
        console.log('[useGrnLabelBusinessV3] Rollback result:', rollbackResult);
        
        if (!rollbackResult.success) {
          console.error('[useGrnLabelBusinessV3] Rollback had errors:', rollbackResult);
          
          // If automatic rollback failed, try manual pallet rollback
          if (palletNumbers.length > 0 && series.length > 0) {
            try {
              await palletGeneration.rollbackPalletNumbers(palletNumbers, series);
              process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV3] Manual pallet rollback successful');
            } catch (manualRollbackError) {
              console.error('[useGrnLabelBusinessV3] Manual pallet rollback failed:', manualRollbackError);
            }
          }
        }
      } catch (rollbackError) {
        console.error('[useGrnLabelBusinessV3] Failed to execute rollback:', rollbackError);
        
        // Last resort: try manual pallet rollback
        if (palletNumbers.length > 0 && series.length > 0) {
          try {
            await palletGeneration.rollbackPalletNumbers(palletNumbers, series);
            console.warn('[useGrnLabelBusinessV3] Fallback pallet rollback executed');
          } catch (fallbackError) {
            console.error('[useGrnLabelBusinessV3] All rollback attempts failed');
          }
        }
      }
      
      grnErrorHandler.handleDatabaseError(
        error as Error,
        {
          component: 'useGrnLabelBusinessV3',
          action: 'form_submission',
          clockNumber,
          additionalData: { 
            grnNumber: state.formData.grnNumber,
            palletCount: palletNumbers.length,
            transactionId,
            errorLogId
          }
        },
        'processPrintRequest'
      );
    } finally {
      actions.setProcessing(false);
    }
  }, [
    state,
    actions,
    weightCalculation,
    palletGeneration,
    currentUserId,
    printGrnLabels
  ]);

  return {
    weightCalculation,
    processPrintRequest
  };
};

export default useGrnLabelBusinessV3;