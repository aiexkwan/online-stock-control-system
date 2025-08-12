'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createClient } from '@/app/utils/supabase/client';
import { grnErrorHandler } from '../services/ErrorHandler';
import {
  createGrnDatabaseEntries,
  createGrnDatabaseEntriesBatch,
  type GrnPalletInfoPayload,
  type GrnRecordPayload,
} from '@/app/actions/grnActions';
import { PALLET_TYPE_OPTIONS, PACKAGE_TYPE_OPTIONS } from '@/app/constants/grnConstants';
import {
  prepareGrnLabelData,
  GrnInputData,
  mergeAndPrintPdfs as pdfUtilsMergeAndPrintPdfs,
} from '@/lib/pdfUtils';
// Transaction types removed - no longer needed
// Import moved to dynamic import where needed
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import {
  PALLET_WEIGHTS,
  PACKAGE_WEIGHTS,
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';

// Import reducer types
import type { GrnFormState, GrnFormAction } from '@/app/(app)/print-grnlabel/hooks/useGrnFormReducer';

// Import custom hooks
import { useWeightCalculation } from '@/app/(app)/print-grnlabel/hooks/useWeightCalculation';
import { usePalletGenerationGrn } from '@/app/(app)/print-grnlabel/hooks/usePalletGenerationGrn';
import { confirmPalletUsage } from '@/app/utils/palletGeneration';
// Import print integration hook
import { usePrintIntegration } from './usePrintIntegration';

interface UseGrnLabelBusinessV3Props {
  state: GrnFormState;
  actions: {
    setSupplierInfo: (supplierInfo: GrnFormState['supplierInfo']) => void;
    setSupplierError: (error: string | null) => void;
    setProcessing: (isProcessing: boolean) => void;
    setProgress: (progress: GrnFormState['progress']) => void;
    updateProgressStatus: (
      index: number,
      status: GrnFormState['progress']['status'][number]
    ) => void;
    resetProductAndWeights: () => void;
  };
  currentUserId: string;
}

interface UseGrnLabelBusinessV3Return {
  weightCalculation: ReturnType<typeof useWeightCalculation>;
  processPrintRequest: (clockNumber: string) => Promise<void>;
}

/**
 * Core business logic hook for GRN Label (V3 版本 - 簡化版)
 * 管理 GRN 標籤的核心業務邏輯，使用 RPC 內建的 ACID 事務處理
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
    packageType: state.packageType,
  });
  const palletGeneration = usePalletGenerationGrn();
  
  // Use print integration hook
  const { printGrnLabels } = usePrintIntegration();

  // Main processing function with transaction support
  const processPrintRequest = useCallback(
    async (clockNumber: string) => {
      actions.setProcessing(true);

      // Declare variables at outer scope for access in catch block
      let palletNumbers: string[] = [];
      let series: string[] = [];

      try {
        if (!state.productInfo || !state.supplierInfo) {
          const error = new Error('Product or supplier information is missing');
          grnErrorHandler.handleValidationError('form', error.message, {
            component: 'useGrnLabelBusinessV3',
            action: 'form_submission',
            clockNumber,
          });
          toast.error('Product or supplier information is missing');
          return;
        }

        const filledGrossWeights = state.grossWeights.map(gw => gw.trim()).filter(gw => gw !== '');
        if (filledGrossWeights.length === 0) {
          const error = new Error('Please enter at least one gross weight');
          grnErrorHandler.handleValidationError('grossWeights', error.message, {
            component: 'useGrnLabelBusinessV3',
            action: 'form_submission',
            clockNumber,
          });
          toast.error('Please enter at least one gross weight');
          return;
        }

        const numberOfPalletsToProcess = filledGrossWeights.length;
        const palletCountForGrnRecord = Object.values(state.palletType).reduce(
          (sum, v) => sum + (parseInt(v) || 0),
          0
        );
        const packageCountForGrnRecord = Object.values(state.packageType).reduce(
          (sum, v) => sum + (parseInt(v) || 0),
          0
        );

        // 將 key 轉換為顯示標籤
        const selectedPalletTypeOption = PALLET_TYPE_OPTIONS.find(
          opt => opt.key === weightCalculation.selectedPalletType
        );
        const selectedPalletTypeString = selectedPalletTypeOption?.label || 'Not Included';

        const selectedPackageTypeOption = PACKAGE_TYPE_OPTIONS.find(
          opt => opt.key === weightCalculation.selectedPackageType
        );
        const selectedPackageTypeString = selectedPackageTypeOption?.label || 'Not Included';

        actions.setProgress({
          current: 0,
          total: numberOfPalletsToProcess,
          status: Array(numberOfPalletsToProcess).fill('Pending'),
        });

        const collectedPdfBlobs: Blob[] = [];
        let anyFailure = false;

        // Pallet numbers will be generated by the RPC function
        // No need to pre-generate here to avoid duplication

        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[useGrnLabelBusinessV3] Processing pallets:', numberOfPalletsToProcess);

        // ===== 使用統一 RPC 批量處理 =====
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[useGrnLabelBusinessV3] 使用統一 RPC 批量處理 GRN 標籤...');

        // 準備批量處理的數據
        const grossWeights = filledGrossWeights.map(gw => parseFloat(gw));
        const netWeights = grossWeights.map(gw => weightCalculation.getNetWeightForPallet(gw));
        const quantities = netWeights; // 對於 GRN，數量就是淨重

        try {
          console.log('[useGrnLabelBusinessV3ForCard] Calling RPC with data:', {
            grnNumber: state.formData.grnNumber,
            productCode: state.productInfo.code,
            supplierCode: state.supplierInfo.code,
            grossWeights,
            netWeights,
            labelMode: state.labelMode
          });
          
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
            (process.env.NODE_ENV as string) !== 'production' &&
              console.log('[useGrnLabelBusinessV3ForCard] 統一 RPC 批量處理成功:', batchResult);

            // Database records created successfully via RPC

            // 從統一 RPC 結果中獲取棧板號碼和系列號
            // 策略4: unknown + type narrowing - 安全的陣列類型轉換
            palletNumbers = Array.isArray(batchResult.data?.pallet_numbers)
              ? batchResult.data.pallet_numbers.filter(
                  (item): item is string => typeof item === 'string'
                )
              : [];
            series = Array.isArray(batchResult.data?.series)
              ? batchResult.data.series.filter((item): item is string => typeof item === 'string')
              : [];

            // Pallet allocation completed

            if (
              palletNumbers.length === numberOfPalletsToProcess &&
              series.length === numberOfPalletsToProcess
            ) {
              // 現在只需要生成 PDF 並上傳
              for (let i = 0; i < numberOfPalletsToProcess; i++) {
                actions.setProgress({
                  current: i + 1,
                  total: numberOfPalletsToProcess,
                  status: state.progress.status.map((s, idx) =>
                    idx === i ? ('Processing' as const) : s
                  ),
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
                console.log('[useGrnLabelBusinessV3ForCard] PDF props:', pdfProps);

                if (pdfProps) {
                  let pdfBlob: Blob;
                  try {
                    const { renderReactPDFToBlob } = await import(
                      '@/lib/services/unified-pdf-service'
                    );
                    pdfBlob = await renderReactPDFToBlob(<PrintLabelPdf {...pdfProps} />);
                    console.log('[useGrnLabelBusinessV3ForCard] PDF blob generated:', {
                      size: pdfBlob.size,
                      type: pdfBlob.type,
                      palletNum,
                      seriesNum
                    });
                    
                    // Validate PDF blob
                    if (!pdfBlob || pdfBlob.size === 0) {
                      throw new Error('Generated PDF blob is empty');
                    }
                    
                    collectedPdfBlobs.push(pdfBlob);
                    actions.updateProgressStatus(i, 'Success');
                  } catch (error) {
                    console.error('[useGrnLabelBusinessV3ForCard] PDF generation error:', error);
                    console.error('[useGrnLabelBusinessV3ForCard] Error details:', {
                      palletNum,
                      seriesNum,
                      grnInputData,
                      pdfProps,
                      errorMessage: error instanceof Error ? error.message : 'Unknown error',
                      errorStack: error instanceof Error ? error.stack : undefined
                    });
                    actions.updateProgressStatus(i, 'Failed');
                    anyFailure = true;
                    
                    // Show error toast for individual pallet failure
                    toast.error(`Pallet ${i + 1} (${palletNum}) PDF generation failed: ${
                      error instanceof Error ? error.message : 'Unknown error'
                    }`);
                  }
                } else {
                  actions.updateProgressStatus(i, 'Failed');
                  anyFailure = true;
                }
              }
            } else {
              console.error('[useGrnLabelBusinessV3ForCard] 統一 RPC 返回的棧板數量不匹配');
              throw new Error('統一 RPC 返回的棧板數量不匹配');
            }
          } else {
            console.error('[useGrnLabelBusinessV3ForCard] 統一 RPC 處理失敗:', batchResult.error);
            throw new Error(batchResult.error || '統一 RPC 處理失敗');
          }

          // Process collected PDFs
          console.log('[useGrnLabelBusinessV3ForCard] Collected PDFs:', collectedPdfBlobs.length);
          if (collectedPdfBlobs.length > 0) {
            // PDF generation completed
            console.log('[useGrnLabelBusinessV3ForCard] All PDFs generated successfully');

            if (anyFailure) {
              const successCount = collectedPdfBlobs.length;
              const failedCount = numberOfPalletsToProcess - successCount;
              
              grnErrorHandler.handleWarning(
                `Processed ${successCount} of ${numberOfPalletsToProcess} labels successfully. ${failedCount} failed.`,
                {
                  component: 'useGrnLabelBusinessV3',
                  action: 'unified_rpc_processing',
                  clockNumber,
                }
              );
              
              toast.warning(`${successCount} labels generated successfully, ${failedCount} failed.`);
            } else {
              console.log(
                `[useGrnLabelBusinessV3ForCard] 統一 RPC: All ${collectedPdfBlobs.length} labels generated successfully!`
              );
              toast.success(`All ${collectedPdfBlobs.length} GRN labels generated successfully!`);
            }

            // Use generic printing service with GRN type
            console.log('[useGrnLabelBusinessV3ForCard] Calling printPdfs with GRN type:', {
              pdfCount: collectedPdfBlobs.length,
              pdfSizes: collectedPdfBlobs.map(blob => blob.size),
              metadata: {
                grnNumber: state.formData.grnNumber,
                supplierCode: state.supplierInfo.code,
                productCode: state.productInfo.code,
                palletNumbers,
              }
            });
            
            // Use unified printing service
            await printGrnLabels(collectedPdfBlobs, {
              grnNumber: state.formData.grnNumber,
              supplierCode: state.supplierInfo.code,
              productCode: state.productInfo.code,
              palletNumbers,
              series,
              userId: clockNumber,
              clockNumber,
            });

            // Processing completed successfully
            toast.success('GRN labels sent to print queue');

            // Reset form after successful print
            setTimeout(() => {
              actions.resetProductAndWeights();
              actions.setProgress({ current: 0, total: 0, status: [] });
            }, 2000);

            return;
          } else {
            // No PDFs generated
            const error = new Error('No PDFs generated successfully');
            console.error('[useGrnLabelBusinessV3ForCard] No PDFs generated');
            toast.error('Failed to generate any PDF labels');
            throw error;
          }
        } catch (batchError) {
          console.error('[useGrnLabelBusinessV3ForCard] 統一 RPC 失敗:', batchError);
          
          const errorMessage = batchError instanceof Error ? batchError.message : 'RPC processing failed';
          toast.error(`Database operation failed: ${errorMessage}`);

          // 直接拋出錯誤
          throw batchError;
        }
      } catch (error) {
        console.error('[useGrnLabelBusinessV3ForCard] Processing error:', error);

        grnErrorHandler.handleDatabaseError(
          error as Error,
          {
            component: 'useGrnLabelBusinessV3ForCard',
            action: 'form_submission',
            clockNumber,
            additionalData: {
              grnNumber: state.formData.grnNumber,
              palletCount: palletNumbers.length,
            },
          },
          'processPrintRequest'
        );
      } finally {
        actions.setProcessing(false);
      }
    },
    [state, actions, weightCalculation, printGrnLabels]
  );

  return {
    weightCalculation,
    processPrintRequest,
  };
};

export default useGrnLabelBusinessV3;