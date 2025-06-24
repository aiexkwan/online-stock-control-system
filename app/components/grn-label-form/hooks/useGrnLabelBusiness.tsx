import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useDatabaseOperationsV2 } from './useDatabaseOperationsV2';
import { usePdfGeneration } from './usePdfGeneration';
import { useFormPersistence } from './useFormPersistence';
import { GrnInputData } from '@/lib/pdfUtils';
import { 
  type GrnPalletInfoPayload, 
  type GrnRecordPayload 
} from '@/app/actions/grnActions';
import { confirmPalletUsage, releasePalletReservation } from '@/app/utils/optimizedPalletGenerationV6';
import { createClient } from '@/lib/supabase';

// Constants for weight calculations
const PALLET_WEIGHT: Record<string, number> = {
  whiteDry: 25,
  whiteWet: 35,
  chepDry: 35,
  chepWet: 45,
  euro: 25,
  notIncluded: 0,
};

const PACKAGE_WEIGHT: Record<string, number> = {
  still: 7,
  bag: 1,
  tote: 70,
  octo: 10,
  notIncluded: 0,
};

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
  labelMode: 'qty' | 'weight';
  palletType: {
    whiteDry: string;
    whiteWet: string;
    chepDry: string;
    chepWet: string;
    euro: string;
    notIncluded: string;
  };
  packageType: {
    still: string;
    bag: string;
    tote: string;
    octo: string;
    notIncluded: string;
  };
  grossWeights: string[];
}

interface ProductInfo {
  code: string;
  description: string;
  type?: string;
}

interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

interface ProcessOptions {
  clockNumber: string;
  batchProcessing?: boolean;
  persistFormData?: boolean;
}

export function useGrnLabelBusiness() {
  const [isProcessing, setIsProcessing] = useState(false);
  // Supabase client for v6 operations
  const supabase = createClient();
  
  const { generatePalletNumbersAndSeries, createDatabaseEntries, uploadPdf } = useDatabaseOperationsV2();
  const { generateMultiplePdfs, generateSinglePdf, printPdfs, generationProgress, resetProgress } = usePdfGeneration();
  const { saveFormData, clearFormData } = useFormPersistence();
  
  // Process GRN labels
  const processGrnLabels = useCallback(async (
    formData: FormData,
    productInfo: ProductInfo,
    supplierInfo: SupplierInfo,
    options: ProcessOptions
  ) => {
    const { clockNumber, batchProcessing = true, persistFormData = true } = options;
    
    if (isProcessing) {
      toast.error('Processing is already in progress');
      return { success: false };
    }
    
    setIsProcessing(true);
    resetProgress();
    
    // Declare variables for catch block access
    let palletNumbers: string[] = [];
    
    try {
      // Filter and validate gross weights
      const filledGrossWeights = formData.grossWeights.filter(w => w && w.trim() !== '');
      const numberOfPalletsToProcess = filledGrossWeights.length;
      
      if (numberOfPalletsToProcess === 0) {
        toast.error('Please enter at least one gross weight');
        return { success: false };
      }
      
      // Calculate pallet and package counts
      const selectedPalletType = Object.entries(formData.palletType)
        .find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded';
      const selectedPackageType = Object.entries(formData.packageType)
        .find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded';
      
      const palletCount = parseInt(formData.palletType[selectedPalletType as keyof typeof formData.palletType] || '0');
      const packageCount = parseInt(formData.packageType[selectedPackageType as keyof typeof formData.packageType] || '0');
      
      // Generate pallet numbers and series with V2 optimization
      console.log('[GRN useGrnLabelBusiness] Generating pallet numbers using V2 optimization');
      const generationResult = await generatePalletNumbersAndSeries(numberOfPalletsToProcess);
      
      if (generationResult.error) {
        toast.error(`Failed to generate pallet numbers: ${generationResult.error}`);
        return { success: false };
      }
      
      palletNumbers = generationResult.palletNumbers;
      const series = generationResult.series;
      
      // Prepare data for processing
      const processingData: Array<{
        pdfData: GrnInputData;
        palletInfo: GrnPalletInfoPayload;
        grnRecord: GrnRecordPayload;
      }> = [];
      
      for (let i = 0; i < numberOfPalletsToProcess; i++) {
        const grossWeight = parseFloat(filledGrossWeights[i]);
        
        if (isNaN(grossWeight) || grossWeight <= 0) {
          toast.error(`Invalid gross weight for pallet ${i + 1}`);
          continue;
        }
        
        const palletWeight = PALLET_WEIGHT[selectedPalletType] || 0;
        const packageWeight = PACKAGE_WEIGHT[selectedPackageType] || 0;
        const netWeight = grossWeight - palletWeight - packageWeight;
        
        if (netWeight <= 0) {
          toast.error(`Invalid net weight for pallet ${i + 1}: ${netWeight}kg`);
          continue;
        }
        
        const palletNum = palletNumbers[i];
        const seriesNum = series[i];
        
        // Prepare data structures
        const pdfData: GrnInputData = {
          grnNumber: formData.grnNumber,
          materialSupplier: supplierInfo.supplier_code,
          productCode: productInfo.code,
          productDescription: productInfo.description,
          productType: productInfo.type || null,
          netWeight,
          series: seriesNum,
          palletNum,
          receivedBy: clockNumber,
          labelMode: formData.labelMode,
        };
        
        const palletInfo: GrnPalletInfoPayload = {
          plt_num: palletNum,
          series: seriesNum,
          product_code: productInfo.code,
          product_qty: Math.round(netWeight),
          plt_remark: `Material GRN- ${formData.grnNumber}`,
        };
        
        const grnRecord: GrnRecordPayload = {
          grn_ref: formData.grnNumber,
          material_code: productInfo.code,
          sup_code: supplierInfo.supplier_code,
          plt_num: palletNum,
          gross_weight: grossWeight,
          net_weight: netWeight,
          pallet_count: palletCount,
          package_count: packageCount,
          pallet: selectedPalletType,
          package: selectedPackageType,
        };
        
        processingData.push({ pdfData, palletInfo, grnRecord });
      }
      
      if (processingData.length === 0) {
        toast.error('No valid pallets to process');
        return { success: false };
      }
      
      // Process database entries and generate PDFs
      const successfulPdfs: Blob[] = [];
      const successfulPalletNumbers: string[] = [];
      const successfulSeries: string[] = [];
      
      // Process in batches for better performance
      const batchSize = batchProcessing ? 5 : 1;
      
      for (let i = 0; i < processingData.length; i += batchSize) {
        const batch = processingData.slice(i, Math.min(i + batchSize, processingData.length));
        
        await Promise.all(batch.map(async (data, batchIndex) => {
          const index = i + batchIndex;
          
          try {
            // Create database entries
            const dbResult = await createDatabaseEntries(
              { palletInfo: data.palletInfo, grnRecord: data.grnRecord },
              clockNumber,
              formData.labelMode
            );
            
            if (!dbResult.success) {
              throw new Error(dbResult.error || 'Database operation failed');
            }
            
            // Generate PDF
            const pdfBlob = await generateSinglePdf(data.pdfData);
            
            if (!pdfBlob) {
              throw new Error('PDF generation failed');
            }
            
            // Upload PDF
            const fileName = `${data.palletInfo.plt_num.replace('/', '_')}.pdf`;
            const uploadResult = await uploadPdf(pdfBlob, fileName, 'grn-labels');
            
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'PDF upload failed');
            }
            
            successfulPdfs.push(pdfBlob);
            successfulPalletNumbers.push(data.palletInfo.plt_num);
            successfulSeries.push(data.palletInfo.series);
          } catch (error: any) {
            console.error(`[GRN useGrnLabelBusiness] Error processing pallet ${index + 1}:`, error);
            toast.error(`Pallet ${index + 1}: ${error.message}`);
          }
        }));
      }
      
      // Print collected PDFs
      if (successfulPdfs.length > 0) {
        const printResult = await printPdfs(
          successfulPdfs,
          formData.grnNumber,
          successfulPalletNumbers,
          successfulSeries
        );
        
        if (printResult.success) {
          toast.success(`${successfulPdfs.length} GRN label(s) printed successfully`);
          
          // Confirm pallet usage in V6 system
          const confirmResult = await confirmPalletUsage(palletNumbers, supabase);
          if (!confirmResult) {
            console.warn('[GRN] Failed to confirm pallet usage for v6 system');
          }
        } else {
          toast.error(`Print failed: ${printResult.error}`);
          
          // Release pallet reservation in V6 system on print failure
          const releaseResult = await releasePalletReservation(palletNumbers, supabase);
          if (!releaseResult) {
            console.warn('[GRN] Failed to release pallet reservation for v6 system');
          }
        }
      } else {
        toast.warning('No PDFs were generated for printing');
        
        // Release all pallet numbers if nothing was generated
        const releaseResult = await releasePalletReservation(palletNumbers, supabase);
        if (!releaseResult) {
          console.warn('[GRN] Failed to release pallet reservation for v6 system');
        }
      }
      
      // Clear form data after successful processing
      if (persistFormData && successfulPdfs.length > 0) {
        clearFormData();
      }
      
      return {
        success: successfulPdfs.length > 0,
        processedCount: successfulPdfs.length,
        totalCount: processingData.length
      };
    } catch (error: any) {
      console.error('[GRN useGrnLabelBusiness] Processing error:', error);
      toast.error(`Processing failed: ${error.message}`);
      
      // Release pallet reservation in V6 system on error
      if (palletNumbers && palletNumbers.length > 0) {
        const releaseResult = await releasePalletReservation(palletNumbers, supabase);
        if (!releaseResult) {
          console.warn('[GRN] Failed to release pallet reservation after error');
        }
      }
      
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    generatePalletNumbersAndSeries,
    createDatabaseEntries,
    uploadPdf,
    generateSinglePdf,
    printPdfs,
    resetProgress,
    clearFormData,
    supabase
  ]);
  
  // Save form state
  const persistForm = useCallback((data: Partial<FormData>) => {
    saveFormData(data);
  }, [saveFormData]);
  
  return {
    processGrnLabels,
    persistForm,
    isProcessing,
    generationProgress
  };
}