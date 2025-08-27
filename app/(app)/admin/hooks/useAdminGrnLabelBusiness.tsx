'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useResourceCleanup } from '@/lib/hooks/useResourceCleanup';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getOptimizedClient } from '@/app/utils/supabase/optimized-client';
import { getGrnDatabaseService } from '@/lib/database/grn-database-service';
// Moved to unified grn library import below
import { createGrnLogger } from '@/lib/security/grn-logger';
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
import type {
  GrnFormState,
  GrnFormAction,
} from '@/app/(app)/print-grnlabel/hooks/useGrnFormReducer';

// Import GRN modules from unified library
import { grnErrorHandler, useWeightCalculation, usePalletGenerationGrn } from '@/lib/grn';
import { confirmPalletUsage } from '@/app/utils/palletGeneration';
// Import generic PDF generation hook
import { usePdfGeneration } from './usePdfGeneration';
import { PrintType } from '@/lib/printing/types';

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
  cancelCurrentOperation: () => void;
}

/**
 * Core business logic hook for GRN Label Card (V3 版本 - 支援事務管理)
 * 管理 GRN 標籤的核心業務邏輯，包含完整的事務追蹤和回滾機制
 * Card 專用版本，使用修改過的打印集成
 */
export const useAdminGrnLabelBusiness = ({
  state,
  actions,
  currentUserId,
}: UseGrnLabelBusinessV3Props): UseGrnLabelBusinessV3Return => {
  // Initialize GRN logger for this hook
  const logger = useMemo(() => createGrnLogger('useAdminGrnLabelBusiness'), []);
  
  // Resource cleanup hook for managing async operations
  const resourceCleanup = useResourceCleanup('useAdminGrnLabelBusiness', false);
  
  // AbortController for cancelling async operations
  const currentOperationRef = useRef<AbortController | null>(null);

  // Use custom hooks
  const weightCalculation = useWeightCalculation({
    grossWeights: state.grossWeights,
    palletType: state.palletType,
    packageType: state.packageType,
  });
  const palletGeneration = usePalletGenerationGrn();

  // Use generic PDF generation hook
  const { printPdfs } = usePdfGeneration();

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing operations
      if (currentOperationRef.current && !currentOperationRef.current.signal.aborted) {
        currentOperationRef.current.abort('Component unmounting');
        currentOperationRef.current = null;
      }
      
      // Force cleanup all resources
      resourceCleanup.forceCleanup();
    };
  }, [resourceCleanup]);

  // Main processing function with enhanced cancellation support
  const processPrintRequest = useCallback(
    async (clockNumber: string) => {
      // Abort any previous operation
      if (currentOperationRef.current && !currentOperationRef.current.signal.aborted) {
        currentOperationRef.current.abort('New operation starting');
      }
      
      // Create new AbortController for this operation
      currentOperationRef.current = resourceCleanup.createAbortController('processPrintRequest');
      const abortSignal = currentOperationRef.current.signal;
      
      // Check if already aborted before starting
      if (abortSignal.aborted) {
        logger.warn('Operation aborted before starting');
        return;
      }
      
      actions.setProcessing(true);

      // Declare variables at outer scope for access in catch block
      let palletNumbers: string[] = [];
      let series: string[] = [];

      try {
        if (!state.productInfo || !state.supplierInfo) {
          const error = new Error('Product or supplier information is missing');
          grnErrorHandler.handleValidationError('form', error.message, {
            component: 'useGrnLabelBusinessV3ForCard',
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
            component: 'useGrnLabelBusinessV3ForCard',
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

        // Initialize progress with debounced updates
        const initialStatus = Array(numberOfPalletsToProcess).fill('Pending');
        actions.setProgress({
          current: 0,
          total: numberOfPalletsToProcess,
          status: initialStatus,
        });

        const collectedPdfBlobs: Blob[] = [];
        let anyFailure = false;

        // Pallet numbers will be generated by the RPC function
        // No need to pre-generate here to avoid duplication

        logger.debug('Processing pallets', {
          numberOfPalletsToProcess,
          palletCount: palletCountForGrnRecord,
          packageCount: packageCountForGrnRecord
        });

        // ===== 使用統一 RPC 批量處理 =====
        logger.debug('Using unified RPC batch processing for GRN labels');

        // 準備批量處理的數據
        const grossWeights = filledGrossWeights.map(gw => parseFloat(gw));
        const netWeights = grossWeights.map(gw => weightCalculation.getNetWeightForPallet(gw));
        const quantities = netWeights; // 對於 GRN，數量就是淨重

        try {
          // Check for abort signal before RPC call
          if (abortSignal.aborted) {
            logger.warn('Operation aborted during RPC preparation');
            return;
          }
          
          logger.debug('Calling RPC with data', {
            grnNumber: state.formData.grnNumber,
            productCode: state.productInfo.code,
            supplierCode: state.supplierInfo.code,
            grossWeightsCount: grossWeights.length,
            labelMode: state.labelMode,
          });

          // 調用統一批量處理 RPC with cancellation check
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
          
          // Check for abort signal after RPC call
          if (abortSignal.aborted) {
            logger.warn('Operation aborted after RPC call');
            return;
          }

          if (batchResult.success) {
            logger.debug('Unified RPC batch processing successful', {
              palletNumbersCount: Array.isArray(batchResult.data?.pallet_numbers) ? batchResult.data.pallet_numbers.length : 0,
              seriesCount: Array.isArray(batchResult.data?.series) ? batchResult.data.series.length : 0
            });

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
              // Generate PDFs with cancellation support
              for (let i = 0; i < numberOfPalletsToProcess; i++) {
                // Check for abort signal before each PDF generation
                if (abortSignal.aborted) {
                  logger.warn(`PDF generation aborted at index ${i}`);
                  return;
                }
                
                // Use batch progress update to reduce re-renders
                const newStatus = [...state.progress.status];
                newStatus[i] = 'Processing';
                
                actions.setProgress({
                  current: i + 1,
                  total: numberOfPalletsToProcess,
                  status: newStatus,
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
                logger.debug('PDF props prepared', { 
                  palletNum,
                  seriesNum,
                  hasProps: !!pdfProps 
                });

                if (pdfProps) {
                  let pdfBlob: Blob;
                  try {
                    // Check for abort signal before PDF generation
                    if (abortSignal.aborted) {
                      logger.warn(`PDF generation aborted before rendering PDF ${i}`);
                      return;
                    }
                    
                    const { renderReactPDFToBlob } = await import(
                      '@/lib/services/unified-pdf-service'
                    );
                    pdfBlob = await renderReactPDFToBlob(<PrintLabelPdf {...pdfProps} />);
                    
                    // Check for abort signal after PDF generation
                    if (abortSignal.aborted) {
                      logger.warn(`PDF generation aborted after rendering PDF ${i}`);
                      return;
                    }
                    logger.debug('PDF blob generated', {
                      size: pdfBlob.size,
                      type: pdfBlob.type,
                      palletNum,
                      seriesNum,
                    });

                    // Validate PDF blob
                    if (!pdfBlob || pdfBlob.size === 0) {
                      throw new Error('Generated PDF blob is empty');
                    }

                    collectedPdfBlobs.push(pdfBlob);
                    // Mark as success with critical flag for immediate update
                    actions.updateProgressStatus(i, 'Success');
                  } catch (error) {
                    logger.error('PDF generation error', error, {
                      palletNum,
                      seriesNum,
                      grnInputData,
                      pdfProps
                    });
                    // Mark as failed with critical flag for immediate update
                    actions.updateProgressStatus(i, 'Failed');
                    anyFailure = true;

                    // Show error toast for individual pallet failure
                    toast.error(
                      `Pallet ${i + 1} (${palletNum}) PDF generation failed: ${
                        error instanceof Error ? error.message : 'Unknown error'
                      }`
                    );
                  }
                } else {
                  // Mark as failed with critical flag for immediate update
                  actions.updateProgressStatus(i, 'Failed');
                  anyFailure = true;
                }
              }
            } else {
              logger.error('Unified RPC pallet count mismatch', null, {
                expected: numberOfPalletsToProcess,
                receivedPallets: palletNumbers.length,
                receivedSeries: series.length
              });
              throw new Error('統一 RPC 返回的棧板數量不匹配');
            }
          } else {
            logger.error('Unified RPC processing failed', new Error(batchResult.error || 'Unknown error'));
            throw new Error(batchResult.error || '統一 RPC 處理失敗');
          }

          // Process collected PDFs
          logger.info('Collected PDFs', { count: collectedPdfBlobs.length });
          if (collectedPdfBlobs.length > 0) {
            // PDF generation completed
            logger.info('All PDFs generated successfully');

            if (anyFailure) {
              const successCount = collectedPdfBlobs.length;
              const failedCount = numberOfPalletsToProcess - successCount;

              grnErrorHandler.handleWarning(
                `Processed ${successCount} of ${numberOfPalletsToProcess} labels successfully. ${failedCount} failed.`,
                {
                  component: 'useAdminGrnLabelBusiness',
                  action: 'unified_rpc_processing',
                  clockNumber,
                }
              );

              toast.warning(
                `${successCount} labels generated successfully, ${failedCount} failed.`
              );
            } else {
              logger.info('All labels generated successfully', { 
                count: collectedPdfBlobs.length 
              });
              toast.success(`All ${collectedPdfBlobs.length} GRN labels generated successfully!`);
            }

            // Final abort check before printing
            if (abortSignal.aborted) {
              logger.warn('Operation aborted before printing');
              return;
            }
            
            // Use generic printing service with GRN type
            logger.debug('Calling printPdfs with GRN type', {
              pdfCount: collectedPdfBlobs.length,
              pdfSizes: collectedPdfBlobs.map(blob => blob.size),
              metadata: {
                grnNumber: state.formData.grnNumber,
                supplierCode: state.supplierInfo.code,
                productCode: state.productInfo.code,
                palletNumbersCount: palletNumbers.length,
              },
            });

            // Call printPdfs with correct parameters for GRN
            await printPdfs(
              collectedPdfBlobs,
              state.productInfo.code,
              palletNumbers,
              series,
              undefined, // quantity not applicable for GRN
              clockNumber // operator
            );
            
            // Check for abort signal after printing
            if (abortSignal.aborted) {
              logger.warn('Operation aborted after printing');
              return;
            }

            // Processing completed successfully
            toast.success('GRN labels sent to print queue');

            // Reset form after successful print with managed timeout
            resourceCleanup.createTimeout(() => {
              // Only reset if still mounted and not aborted
              if (resourceCleanup.isMounted() && !abortSignal.aborted) {
                actions.resetProductAndWeights();
                actions.setProgress({ current: 0, total: 0, status: [] });
              }
            }, 2000, 'resetForm');

            return;
          } else {
            // No PDFs generated
            const error = new Error('No PDFs generated successfully');
            logger.error('No PDFs generated', error);
            toast.error('Failed to generate any PDF labels');
            throw error;
          }
        } catch (batchError) {
          logger.error('Unified RPC failed', batchError);

          const errorMessage =
            batchError instanceof Error ? batchError.message : 'RPC processing failed';
          toast.error(`Database operation failed: ${errorMessage}`);

          // 直接拋出錯誤
          throw batchError;
        }
      } catch (error) {
        // Check if error is due to abort
        if (abortSignal.aborted) {
          logger.info('Operation was cancelled');
          return;
        }
        
        logger.error('Processing error', error, {
          grnNumber: state.formData.grnNumber,
          palletCount: palletNumbers.length
        });

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
        // Only reset processing state if not aborted
        if (!abortSignal.aborted) {
          actions.setProcessing(false);
        }
        
        // Clean up the current operation reference
        if (currentOperationRef.current && currentOperationRef.current.signal === abortSignal) {
          currentOperationRef.current = null;
        }
      }
    },
    [state, actions, weightCalculation, printPdfs, logger, resourceCleanup]
  );

  // Cancel current operation method
  const cancelCurrentOperation = useCallback(() => {
    if (currentOperationRef.current && !currentOperationRef.current.signal.aborted) {
      logger.info('Cancelling current print operation');
      currentOperationRef.current.abort('User cancelled operation');
      actions.setProcessing(false);
    }
  }, [logger, actions]);

  return {
    weightCalculation,
    processPrintRequest,
    cancelCurrentOperation,
  };
};

export default useAdminGrnLabelBusiness;
