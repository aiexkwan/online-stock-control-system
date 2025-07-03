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

interface UseGrnLabelBusinessV2Props {
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

interface UseGrnLabelBusinessV2Return {
  weightCalculation: ReturnType<typeof useWeightCalculation>;
  processPrintRequest: (clockNumber: string) => Promise<void>;
}

/**
 * Core business logic hook for GRN Label (V2 版本使用 reducer)
 * 管理 GRN 標籤的核心業務邏輯
 */
export const useGrnLabelBusinessV2 = ({
  state,
  actions,
  currentUserId,
}: UseGrnLabelBusinessV2Props): UseGrnLabelBusinessV2Return => {
  
  // Use custom hooks
  const weightCalculation = useWeightCalculation({ 
    grossWeights: state.grossWeights, 
    palletType: state.palletType, 
    packageType: state.packageType 
  });
  const palletGeneration = usePalletGenerationGrn();

  // Main processing function
  const processPrintRequest = useCallback(async (clockNumber: string) => {
    actions.setProcessing(true);
    
    // Declare variables at outer scope for access in catch block
    let palletNumbers: string[] = [];
    let series: string[] = [];

    try {
      if (!state.productInfo || !state.supplierInfo) {
        grnErrorHandler.handleValidationError(
          'form',
          'Product or supplier information is missing',
          {
            component: 'useGrnLabelBusinessV2',
            action: 'form_submission',
            clockNumber
          }
        );
        return;
      }

      const filledGrossWeights = state.grossWeights.map(gw => gw.trim()).filter(gw => gw !== '');
      if (filledGrossWeights.length === 0) {
        grnErrorHandler.handleValidationError(
          'grossWeights',
          'Please enter at least one gross weight',
          {
            component: 'useGrnLabelBusinessV2',
            action: 'form_submission',
            clockNumber
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
        return;
      }

      process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] Processing pallets:', numberOfPalletsToProcess);

      // ===== 使用統一 RPC 批量處理 =====
      process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] 使用統一 RPC 批量處理 GRN 標籤...');
      
      // 準備批量處理的數據
      const grossWeights = filledGrossWeights.map(gw => parseFloat(gw));
      const netWeights = grossWeights.map(gw => weightCalculation.getNetWeightForPallet(gw));
      const quantities = netWeights; // 對於 GRN，數量就是淨重
      
      try {
        // 調用統一批量處理 RPC
        console.log('[useGrnLabelBusinessV2] 調用 createGrnDatabaseEntriesBatch...');
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
          process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] 統一 RPC 批量處理成功:', batchResult);
          
          // 從統一 RPC 結果中獲取棧板號碼和系列號
          // 檢查多個可能嘅數據位置
          const rpcPalletNumbers = batchResult.data?.pallet_numbers || batchResult.palletNumbers || [];
          const rpcSeries = batchResult.data?.series || batchResult.series || [];
          
          // 添加詳細的調試信息
          console.log('[useGrnLabelBusinessV2] RPC 返回數據:', {
            expectedCount: numberOfPalletsToProcess,
            actualPalletCount: rpcPalletNumbers.length,
            actualSeriesCount: rpcSeries.length,
            palletNumbers: rpcPalletNumbers,
            series: rpcSeries,
            fullData: batchResult.data,
            fullResult: batchResult, // 查看完整的返回結構
            dataKeys: Object.keys(batchResult || {}), // 顯示所有頂層鍵
            dataDataKeys: batchResult.data ? Object.keys(batchResult.data) : [] // 顯示 data 對象的鍵
          });
          
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
                  console.error('[useGrnLabelBusinessV2] PDF generation error:', error);
                  actions.updateProgressStatus(i, 'Failed');
                  anyFailure = true;
                }
              } else {
                actions.updateProgressStatus(i, 'Failed');
                anyFailure = true;
                             }
             }
             
             // 統一 RPC 處理成功，跳到最後的 PDF 處理步驟
             // 不需要確認棧板使用，因為統一 RPC 已經處理了
             
           } else {
             console.error('[useGrnLabelBusinessV2] 統一 RPC 返回的棧板數量不匹配', {
               expected: numberOfPalletsToProcess,
               receivedPallets: rpcPalletNumbers.length,
               receivedSeries: rpcSeries.length
             });
             throw new Error(`統一 RPC 返回的棧板數量不匹配: 預期 ${numberOfPalletsToProcess}, 實際收到 ${rpcPalletNumbers.length}`);
           }
         } else {
           console.error('[useGrnLabelBusinessV2] 統一 RPC 處理失敗:', batchResult.error);
           throw new Error(batchResult.error || '統一 RPC 處理失敗');
         }
         
         // 統一 RPC 處理成功，跳到最後的處理步驟
         // Process collected PDFs (統一 RPC 成功路徑)
         if (collectedPdfBlobs.length > 0) {
           if (anyFailure) {
             grnErrorHandler.handleWarning(
               `Processed ${collectedPdfBlobs.length} of ${numberOfPalletsToProcess} labels successfully using unified RPC.`,
               {
                 component: 'useGrnLabelBusinessV2',
                 action: 'unified_rpc_processing',
                 clockNumber
               }
             );
           } else {
             console.log(`[useGrnLabelBusinessV2] 統一 RPC: All ${collectedPdfBlobs.length} labels generated successfully!`);
           }
   
           // Convert Blobs to ArrayBuffers for merging
           const pdfArrayBuffers = await Promise.all(
             collectedPdfBlobs.map(blob => blob.arrayBuffer())
           );
           
           // Print merged PDF
           await pdfUtilsMergeAndPrintPdfs(pdfArrayBuffers);
           
           // Reset form after successful print
           setTimeout(() => {
             actions.resetProductAndWeights();
             actions.setProgress({ current: 0, total: 0, status: [] });
           }, 2000);
           
           return; // 退出函數，不執行後續的逐個處理代碼
         }
         
       } catch (batchError) {
         console.error('[useGrnLabelBusinessV2] 統一 RPC 失敗，回退到逐個處理:', batchError);
         
         // 回退到原來的逐個處理方式
       }
       
       // ===== 回退處理：逐個處理 (舊方式) =====
       process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] 使用舊方式逐個處理...');
       
       // Process each pallet (fallback method)
       for (let i = 0; i < numberOfPalletsToProcess; i++) {
        actions.setProgress({ 
          current: i + 1,
          total: numberOfPalletsToProcess,
          status: state.progress.status.map((s, idx) => idx === i ? 'Processing' : s)
        });

        const currentGrossWeightStr = filledGrossWeights[i];
        const currentGrossWeight = parseFloat(currentGrossWeightStr);
        
        if (isNaN(currentGrossWeight) || currentGrossWeight <= 0) {
          grnErrorHandler.handleWeightError(
            `Pallet ${i + 1} GW Error: ${currentGrossWeightStr}. Skipping.`,
            i,
            currentGrossWeightStr,
            {
              component: 'useGrnLabelBusinessV2',
              action: 'weight_validation',
              clockNumber
            }
          );
          actions.updateProgressStatus(i, 'Failed');
          anyFailure = true;
          continue;
        }

        const netWeight = weightCalculation.getNetWeightForPallet(currentGrossWeight);

        if (netWeight <= 0) {
          grnErrorHandler.handleWeightError(
            `Pallet ${i + 1} NW Error: ${netWeight}kg. Skipping.`,
            i,
            currentGrossWeightStr,
            {
              component: 'useGrnLabelBusinessV2',
              action: 'weight_calculation',
              clockNumber,
              additionalData: { netWeight }
            }
          );
          actions.updateProgressStatus(i, 'Failed');
          anyFailure = true;
          continue;
        }

        const palletNum = palletNumbers[i];
        const seriesNum = series[i];

        // Create database entries - 注意 GrnRecordPayload 的正確字段名稱
        const palletInfoData: GrnPalletInfoPayload = {
          plt_num: palletNum,
          series: seriesNum,
          product_code: state.productInfo.code,
          product_qty: Math.round(netWeight),
          plt_remark: `Material GRN- ${state.formData.grnNumber}`,
        };

        const grnRecordData: GrnRecordPayload = {
          grn_ref: state.formData.grnNumber,  // 注意：改為 grn_ref
          material_code: state.productInfo.code,  // 注意：改為 material_code
          sup_code: state.supplierInfo.code,  // 注意：改為 sup_code
          plt_num: palletNum,
          gross_weight: currentGrossWeight,
          net_weight: netWeight,
          pallet_count: palletCountForGrnRecord,
          package_count: packageCountForGrnRecord,
          pallet: selectedPalletTypeString,  // 注意：改為 pallet
          package: selectedPackageTypeString,  // 注意：改為 package
        };

        // 使用正確的函數簽名調用
        const dbResult = await createGrnDatabaseEntries(
          {
            palletInfo: palletInfoData,
            grnRecord: grnRecordData
          },
          clockNumber,  // operatorClockNumberStr - 使用用戶輸入的 clock number
          state.labelMode  // labelMode
        );

        if (dbResult.error) {
          console.error(`[useGrnLabelBusinessV2] DB error for pallet ${i + 1}:`, dbResult.error);
          
          grnErrorHandler.handleDatabaseError(
            dbResult.error,
            {
              component: 'useGrnLabelBusinessV2',
              action: 'database_insert',
              clockNumber,
              additionalData: { palletNum, palletIndex: i }
            },
            'createGrnDatabaseEntries'
          );
          
          actions.updateProgressStatus(i, 'Failed');
          anyFailure = true;
          continue;
        }

        // Generate PDF - 使用正確的 GrnInputData 結構
        const grnInputData: GrnInputData = {
          grnNumber: state.formData.grnNumber,
          materialSupplier: state.supplierInfo.code,  // 只傳遞供應商代碼，不包含名稱
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
          // Generate actual PDF blob using @react-pdf/renderer
          let pdfBlob: Blob;
          try {
            pdfBlob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
            process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] PDF generated:', {
              size: pdfBlob.size,
              type: pdfBlob.type
            });
          } catch (error) {
            console.error('[useGrnLabelBusinessV2] PDF generation error:', error);
            grnErrorHandler.handlePdfError(
              error as Error,
              {
                component: 'useGrnLabelBusinessV2',
                action: 'pdf_generation',
                clockNumber,
                additionalData: { palletIndex: i }
              },
              palletNum,
              state.formData.grnNumber
            );
            actions.updateProgressStatus(i, 'Failed');
            anyFailure = true;
            continue;
          }
          
          // Convert Blob to ArrayBuffer for Server Action
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Generate filename like print-label page
          const fileName = generatePalletPdfFileName(palletNum);
          
          // Upload PDF to storage
          const uploadResult = await grnActionsUploadPdfToStorage(
            Array.from(uint8Array), // Convert to regular array for serialization
            fileName,
            'pallet-label-pdf' // 使用相同的 bucket
          );

          if (uploadResult.error) {
            console.error(`[useGrnLabelBusinessV2] Upload error for pallet ${i + 1}:`, uploadResult.error);
            grnErrorHandler.handleDatabaseError(
              uploadResult.error,
              {
                component: 'useGrnLabelBusinessV2',
                action: 'pdf_upload',
                clockNumber,
                additionalData: { palletNum, palletIndex: i }
              },
              'uploadPdfToStorage'
            );
            actions.updateProgressStatus(i, 'Failed');
            anyFailure = true;
            continue;
          }

          // Update PDF URL in database
          if (uploadResult.publicUrl) {
            const updateResult = await updatePalletPdfUrl(palletNum, uploadResult.publicUrl);
            if (updateResult.error) {
              console.error(`[useGrnLabelBusinessV2] Failed to update PDF URL for pallet ${i + 1}:`, updateResult.error);
              // Don't fail the entire operation, just log the error
              grnErrorHandler.handleWarning(
                `PDF uploaded but URL not saved for pallet ${palletNum}`,
                {
                  component: 'useGrnLabelBusinessV2',
                  action: 'pdf_url_update',
                  clockNumber,
                  additionalData: { palletNum, palletIndex: i }
                }
              );
            }
          }

          collectedPdfBlobs.push(pdfBlob);
          actions.updateProgressStatus(i, 'Success');
        } else {
          console.error(`[useGrnLabelBusinessV2] PDF generation failed for pallet ${i + 1}`);
          grnErrorHandler.handlePdfError(
            new Error('PDF props generation failed'),
            {
              component: 'useGrnLabelBusinessV2',
              action: 'pdf_preparation',
              clockNumber,
              additionalData: { palletIndex: i }
            },
            palletNum,
            state.formData.grnNumber
          );
          actions.updateProgressStatus(i, 'Failed');
          anyFailure = true;
          continue;
        }
      }

      // Process collected PDFs
      if (collectedPdfBlobs.length > 0) {
        if (anyFailure) {
          grnErrorHandler.handleWarning(
            `Processed ${collectedPdfBlobs.length} of ${numberOfPalletsToProcess} labels successfully.`,
            {
              component: 'useGrnLabelBusinessV2',
              action: 'batch_processing',
              clockNumber
            }
          );
        } else {
          // Success message removed - no need to log batch processing success to record_history
          console.log(`[useGrnLabelBusinessV2] All ${collectedPdfBlobs.length} labels generated successfully!`);
        }

        // Confirm pallet usage to update status from "Holded" to "True"
        try {
          process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] Confirming pallet usage for:', palletNumbers);
          const confirmSuccess = await confirmPalletUsage(palletNumbers);
          if (!confirmSuccess) {
            console.error('[useGrnLabelBusinessV2] Failed to confirm pallet usage');
          }
        } catch (confirmError) {
          console.error('[useGrnLabelBusinessV2] Error confirming pallet usage:', confirmError);
        }

        // Convert Blobs to ArrayBuffers for merging
        const pdfArrayBuffers = await Promise.all(
          collectedPdfBlobs.map(blob => blob.arrayBuffer())
        );
        
        // Print merged PDF
        await pdfUtilsMergeAndPrintPdfs(pdfArrayBuffers);
        
        // Reset form after successful print
        setTimeout(() => {
          actions.resetProductAndWeights();
          actions.setProgress({ current: 0, total: 0, status: [] });
        }, 2000);
      } else {
        grnErrorHandler.handleValidationError(
          'pdfGeneration',
          'No labels were generated successfully',
          {
            component: 'useGrnLabelBusinessV2',
            action: 'batch_processing',
            clockNumber
          }
        );
      }

    } catch (error) {
      console.error('[useGrnLabelBusinessV2] Processing error:', error);
      
      // Rollback pallet numbers if any were generated
      if (palletNumbers.length > 0 && series.length > 0) {
        try {
          await palletGeneration.rollbackPalletNumbers(palletNumbers, series);
          process.env.NODE_ENV !== "production" && console.log('[useGrnLabelBusinessV2] Successfully rolled back pallet numbers');
        } catch (rollbackError) {
          console.error('[useGrnLabelBusinessV2] Failed to rollback pallet numbers:', rollbackError);
        }
      }
      
      grnErrorHandler.handleDatabaseError(
        error as Error,
        {
          component: 'useGrnLabelBusinessV2',
          action: 'form_submission',
          clockNumber,
          additionalData: { 
            grnNumber: state.formData.grnNumber,
            palletCount: palletNumbers.length 
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
    palletGeneration
  ]);

  return {
    weightCalculation,
    processPrintRequest
  };
};