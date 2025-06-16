'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createClient } from '@/app/utils/supabase/client';
import { 
  createGrnDatabaseEntries,
  uploadPdfToStorage as grnActionsUploadPdfToStorage,
  type GrnPalletInfoPayload, 
  type GrnRecordPayload 
} from '@/app/actions/grnActions';
import { 
  prepareGrnLabelData, 
  GrnInputData, 
  mergeAndPrintPdfs as pdfUtilsMergeAndPrintPdfs
} from '@/lib/pdfUtils';
import { 
  PALLET_WEIGHTS, 
  PACKAGE_WEIGHTS,
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode 
} from '@/app/constants/grnConstants';
import { type ProgressStatus } from '@/app/components/qc-label-form';

// Import custom hooks
import { useSupplierValidation } from './useSupplierValidation';
import { useWeightCalculation } from './useWeightCalculation';
import { usePalletGenerationGrn } from './usePalletGenerationGrn';

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
}

interface ProductInfo {
  code: string;
  description: string;
  type?: string;
}

interface UseGrnLabelBusinessProps {
  formData: FormData;
  productInfo: ProductInfo | null;
  labelMode: LabelMode;
  palletType: Record<PalletTypeKey, string>;
  packageType: Record<PackageTypeKey, string>;
  grossWeights: string[];
  currentUserId: string;
  onFormReset?: () => void;
}

interface UseGrnLabelBusinessReturn {
  // From supplier validation
  supplierInfo: ReturnType<typeof useSupplierValidation>['supplierInfo'];
  supplierError: ReturnType<typeof useSupplierValidation>['supplierError'];
  validateSupplier: ReturnType<typeof useSupplierValidation>['validateSupplier'];
  
  // From weight calculation
  weightCalculation: ReturnType<typeof useWeightCalculation>;
  
  // From pallet generation
  isGeneratingPallets: ReturnType<typeof usePalletGenerationGrn>['isGenerating'];
  
  // Processing state
  isProcessing: boolean;
  pdfProgress: {
    current: number;
    total: number;
    status: ProgressStatus[];
  };
  
  // Main function
  processPrintRequest: (clockNumber: string) => Promise<void>;
}

/**
 * Core business logic hook for GRN Label
 * 管理 GRN 標籤的核心業務邏輯
 */
export const useGrnLabelBusiness = ({
  formData,
  productInfo,
  labelMode,
  palletType,
  packageType,
  grossWeights,
  currentUserId,
  onFormReset
}: UseGrnLabelBusinessProps): UseGrnLabelBusinessReturn => {
  
  // Use custom hooks
  const supplierValidation = useSupplierValidation();
  const weightCalculation = useWeightCalculation({ grossWeights, palletType, packageType });
  const palletGeneration = usePalletGenerationGrn();
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{
    current: number;
    total: number;
    status: ProgressStatus[];
  }>({ current: 0, total: 0, status: [] });

  // Main processing function
  const processPrintRequest = useCallback(async (clockNumber: string) => {
    setIsProcessing(true);
    
    // Declare variables at outer scope for access in catch block
    let palletNumbers: string[] = [];
    let series: string[] = [];

    try {
      if (!productInfo || !supplierValidation.supplierInfo) {
        toast.error('Product or supplier information is missing.');
        return;
      }

      const filledGrossWeights = grossWeights.map(gw => gw.trim()).filter(gw => gw !== '');
      if (filledGrossWeights.length === 0) {
        toast.error('Please enter at least one gross weight.');
        return;
      }

      const numberOfPalletsToProcess = filledGrossWeights.length;
      const palletCountForGrnRecord = Object.values(palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      const packageCountForGrnRecord = Object.values(packageType).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      const selectedPalletTypeString = weightCalculation.selectedPalletType;
      const selectedPackageTypeString = weightCalculation.selectedPackageType;

      setPdfProgress({ 
        current: 0, 
        total: numberOfPalletsToProcess, 
        status: Array(numberOfPalletsToProcess).fill('Pending') 
      });

      const collectedPdfBlobs: Blob[] = [];
      let anyFailure = false;

      // Generate pallet numbers
      const result = await palletGeneration.generatePalletNumbers(numberOfPalletsToProcess);
      palletNumbers = result.palletNumbers;
      series = result.series;
      const { success } = result;
      
      if (!success) {
        return;
      }

      console.log('[useGrnLabelBusiness] Processing pallets:', numberOfPalletsToProcess);

      // Process each pallet
      for (let i = 0; i < numberOfPalletsToProcess; i++) {
        setPdfProgress(prev => ({ 
          ...prev, 
          current: i + 1, 
          status: prev.status.map((s, idx) => idx === i ? 'Processing' : s) 
        }));

        const currentGrossWeightStr = filledGrossWeights[i];
        const currentGrossWeight = parseFloat(currentGrossWeightStr);
        
        if (isNaN(currentGrossWeight) || currentGrossWeight <= 0) {
          toast.error(`Pallet ${i + 1} GW Error: ${currentGrossWeightStr}. Skipping.`);
          setPdfProgress(prev => ({ 
            ...prev, 
            status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
          }));
          anyFailure = true;
          continue;
        }

        const netWeight = weightCalculation.getNetWeightForPallet(currentGrossWeight);

        if (netWeight <= 0) {
          toast.error(`Pallet ${i + 1} NW Error: ${netWeight}kg. Skipping.`);
          setPdfProgress(prev => ({ 
            ...prev, 
            status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
          }));
          anyFailure = true;
          continue;
        }

        const palletNum = palletNumbers[i];
        const seriesNum = series[i];

        // Create database entries
        const palletInfoData: GrnPalletInfoPayload = {
          plt_num: palletNum,
          series: seriesNum,
          product_code: productInfo.code,
          product_qty: Math.round(netWeight),
          plt_remark: `Material GRN- ${formData.grnNumber}`,
        };

        const grnRecordData: GrnRecordPayload = {
          grn_ref: formData.grnNumber,
          material_code: productInfo.code,
          sup_code: supplierValidation.supplierInfo.supplier_code,
          plt_num: palletNum,
          gross_weight: currentGrossWeight,
          net_weight: netWeight,
          pallet_count: palletCountForGrnRecord,
          package_count: packageCountForGrnRecord,
          pallet: selectedPalletTypeString,
          package: selectedPackageTypeString,
        };

        try {
          const actionResult = await createGrnDatabaseEntries({
            palletInfo: palletInfoData,
            grnRecord: grnRecordData
          }, clockNumber, labelMode);

          if (actionResult.error) {
            toast.error(`Pallet ${i + 1} DB Error: ${actionResult.error}. Skipping PDF.`);
            setPdfProgress(prev => ({ 
              ...prev, 
              status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
            }));
            anyFailure = true;
            continue;
          }

          if (actionResult.warning) {
            console.warn(`[useGrnLabelBusiness] Pallet ${i + 1} GRN workflow warning:`, actionResult.warning);
            toast.warning(`Pallet ${i + 1}: ${actionResult.warning}`);
          }

          // Generate PDF
          const grnInput: GrnInputData = {
            grnNumber: formData.grnNumber,
            materialSupplier: supplierValidation.supplierInfo.supplier_code,
            productCode: productInfo.code,
            productDescription: productInfo.description,
            productType: productInfo.type || null,
            netWeight: netWeight,
            series: seriesNum,
            palletNum: palletNum,
            receivedBy: clockNumber,
            labelMode: labelMode,
          };

          const pdfLabelProps = await prepareGrnLabelData(grnInput);
          
          // Generate PDF blob
          const { pdf } = await import('@react-pdf/renderer');
          const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');
          
          const pdfBlob = await pdf(<PrintLabelPdf {...pdfLabelProps} />).toBlob();
          
          if (!pdfBlob) {
            throw new Error('PDF generation failed to return a blob.');
          }

          // Upload PDF
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
          const pdfNumberArray = Array.from(pdfUint8Array);
          
          const fileName = `${palletNum.replace('/', '_')}.pdf`;
          const uploadResult = await grnActionsUploadPdfToStorage(pdfNumberArray, fileName, 'grn-labels');

          if (uploadResult.error) {
            throw new Error(`PDF upload failed: ${uploadResult.error}`);
          }

          if (uploadResult.publicUrl) {
            collectedPdfBlobs.push(pdfBlob);
            setPdfProgress(prev => ({ 
              ...prev, 
              status: prev.status.map((s, idx) => idx === i ? 'Success' : s) 
            }));
          } else {
            throw new Error('PDF upload succeeded but no public URL returned.');
          }
        } catch (error: any) {
          toast.error(`Pallet ${i + 1} Error: ${error.message}. Skipping.`);
          setPdfProgress(prev => ({ 
            ...prev, 
            status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
          }));
          anyFailure = true;
        }
      }

      // Print collected PDFs
      if (collectedPdfBlobs.length > 0) {
        const pdfArrayBuffers = await Promise.all(collectedPdfBlobs.map(blob => blob.arrayBuffer()));
        const printFileName = collectedPdfBlobs.length === 1
          ? `GRNLabel_${formData.grnNumber}_${palletNumbers[0]?.replace('/', '_')}_${series[0]}.pdf`
          : `GRNLabels_Merged_${formData.grnNumber}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;

        try {
          await pdfUtilsMergeAndPrintPdfs(pdfArrayBuffers, printFileName);
          toast.success(`${collectedPdfBlobs.length} GRN label(s) printed successfully`);
          
          // Confirm pallet usage after successful printing
          // 打印成功後確認托盤使用
          const confirmResult = await palletGeneration.confirmUsage(palletNumbers);
          if (!confirmResult) {
            console.warn('[useGrnLabelBusiness] Failed to confirm pallet usage');
            toast.warning('Note: Failed to update pallet status. Please contact admin if issues persist.');
          } else {
            console.log('[useGrnLabelBusiness] Pallet usage confirmed successfully');
          }
        } catch (printError: any) {
          toast.error(`PDF Printing Error: ${printError.message}`);
          
          // Release pallet reservation if printing failed
          // 打印失敗時釋放托盤預留
          const releaseResult = await palletGeneration.releaseReservation(palletNumbers);
          if (!releaseResult) {
            console.warn('[useGrnLabelBusiness] Failed to release pallet reservation');
          }
        }
      } else {
        toast.warning('No PDFs were generated for printing.');
        
        // Release any reserved pallet numbers if no PDFs were generated
        // 如果冇生成 PDF，釋放所有預留嘅托盤號碼
        if (palletNumbers.length > 0) {
          const releaseResult = await palletGeneration.releaseReservation(palletNumbers);
          if (!releaseResult) {
            console.warn('[useGrnLabelBusiness] Failed to release pallet reservation');
          }
        }
      }

      // Reset form if provided
      if (onFormReset && !anyFailure) {
        onFormReset();
      }

    } catch (error) {
      console.error('[useGrnLabelBusiness] Error during print process:', error);
      toast.error('An error occurred during printing');
      
      // Release any reserved pallet numbers if there was an error
      // 如果有錯誤發生，釋放所有預留嘅托盤號碼
      if (palletNumbers.length > 0) {
        try {
          const releaseResult = await palletGeneration.releaseReservation(palletNumbers);
          if (!releaseResult) {
            console.warn('[useGrnLabelBusiness] Failed to release pallet reservation after error');
          }
        } catch (releaseError) {
          console.error('[useGrnLabelBusiness] Error releasing pallet reservation:', releaseError);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    formData,
    productInfo,
    labelMode,
    palletType,
    packageType,
    grossWeights,
    supplierValidation.supplierInfo,
    weightCalculation,
    palletGeneration,
    onFormReset
  ]);

  return {
    // From supplier validation
    supplierInfo: supplierValidation.supplierInfo,
    supplierError: supplierValidation.supplierError,
    validateSupplier: supplierValidation.validateSupplier,
    
    // From weight calculation
    weightCalculation,
    
    // From pallet generation
    isGeneratingPallets: palletGeneration.isGenerating,
    
    // Processing state
    isProcessing,
    pdfProgress,
    
    // Main function
    processPrintRequest
  };
};

export default useGrnLabelBusiness;