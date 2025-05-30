"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '../../../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Add custom CSS for scrollbar styling
const customStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6B7280;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
  }
  
  .bg-gray-750 {
    background-color: #3a3f4b;
  }
`;

// Import reusable components from QC Label
import {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveStack,
  ResponsiveGrid,
  ProductCodeInput,
  EnhancedProgressBar,
  ClockNumberConfirmDialog,
  type ProgressStatus
} from '../../components/qc-label-form';

// Import GRN specific utilities
import { 
  prepareGrnLabelData, 
  GrnInputData, 
  mergeAndPrintPdfs
} from '../../../lib/pdfUtils';
import { 
  createGrnDatabaseEntries, 
  generateGrnPalletNumbersAndSeries,
  uploadPdfToStorage,
  type GrnPalletInfoPayload, 
  type GrnRecordPayload 
} from '../../actions/grnActions';

// Types for GRN Label (simplified from QC Label ProductInfo)
interface GrnProductInfo {
  code: string;
  description: string;
  standard_qty?: string;  // GRN Label 不需要此欄位
  type?: string;          // GRN Label 不需要此欄位
}

// Note: We use ProductCodeInput from QC Label but adapt its ProductInfo to our simplified GrnProductInfo

interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
}

interface PalletTypeData {
  whiteDry: string;
  whiteWet: string;
  chepDry: string;
  chepWet: string;
  euro: string;
  notIncluded: string;
}

interface PackageTypeData {
  still: string;
  bag: string;
  tote: string;
  octo: string;
  notIncluded: string;
}

// Constants
const PALLET_WEIGHT: Record<string, number> = {
  whiteDry: 14,
  whiteWet: 18,
  chepDry: 26,
  chepWet: 38,
  euro: 22,
  notIncluded: 0,
};

const PACKAGE_WEIGHT: Record<string, number> = {
  still: 50,
  bag: 1,
  tote: 10,
  octo: 20,
  notIncluded: 0,
};

export const GrnLabelForm: React.FC = () => {
  // 移除模塊級別的客戶端實例，改為在需要時創建服務端客戶端
  // const supabase = createClient();

  // Adapter function to convert QC Label ProductInfo to GRN ProductInfo
  const adaptProductInfo = useCallback((qcProductInfo: any): GrnProductInfo | null => {
    if (!qcProductInfo) {
      return null;
    }
    
    // For GRN Label, we only need code and description
    return {
      code: qcProductInfo.code,
      description: qcProductInfo.description,
      // standard_qty and type are optional and not needed for GRN
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    grnNumber: '',
    materialSupplier: '',
    productCode: '',
  });

  // Product and supplier info
  const [productInfo, setProductInfo] = useState<GrnProductInfo | null>(null);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  // Pallet and package types
  const [palletType, setPalletType] = useState<PalletTypeData>({
    whiteDry: '',
    whiteWet: '',
    chepDry: '',
    chepWet: '',
    euro: '',
    notIncluded: '',
  });

  const [packageType, setPackageType] = useState<PackageTypeData>({
    still: '',
    bag: '',
    tote: '',
    octo: '',
    notIncluded: '',
  });

  // Gross weights
  const [grossWeights, setGrossWeights] = useState<string[]>(['']);

  // Progress tracking
  const [pdfProgress, setPdfProgress] = useState<{
    current: number;
    total: number;
    status: ProgressStatus[];
  }>({ current: 0, total: 0, status: [] });

  // Clock number confirmation dialog
  const [isClockNumberDialogOpen, setIsClockNumberDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // User info
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Instructions panel state
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  // Initialize user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { AuthUtils } = await import('../../utils/auth-utils');
        const clockNumber = await AuthUtils.getCurrentUserClockNumber();
        if (clockNumber) {
          setCurrentUserId(clockNumber);
        } else {
          toast.error('User session not found. Please log in again.');
        }
      } catch (error) {
        console.error('[GrnLabelForm] Error getting user info:', error);
        toast.error('Authentication error. Please log in again.');
      }
    };

    initializeUser();
  }, []);



  // Calculate pallet count
  const palletCount = Math.min(22, Object.values(palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0) || 1);

  // Adjust gross weights array based on pallet count
  useEffect(() => {
    setGrossWeights(prev => {
      let currentGrossWeights = [...prev];
      if (palletCount < currentGrossWeights.length) {
        currentGrossWeights = currentGrossWeights.slice(0, palletCount);
      }
      if (currentGrossWeights.length === 0 && palletCount >= 1) {
        return [''];
      }
      return currentGrossWeights;
    });
  }, [palletCount]);

  // Supplier validation - 使用服務端客戶端
  const validateSupplier = useCallback(async (supplierCode: string) => {
    if (!supplierCode.trim()) {
      setSupplierInfo(null);
      setSupplierError(null);
      return;
    }

    try {
      const supabaseAdmin = createClient();
      const { data, error } = await supabaseAdmin
        .from('data_supplier')
        .select('supplier_code, supplier_name')
        .eq('supplier_code', supplierCode.toUpperCase())
        .single();

      if (error || !data) {
        setSupplierInfo(null);
        setSupplierError('Supplier Code Not Found');
      } else {
        setSupplierInfo(data);
        setSupplierError(null);
        setFormData(prev => ({ ...prev, materialSupplier: data.supplier_code }));
      }
    } catch (error) {
      console.error('[GrnLabelForm] Error validating supplier:', error);
      setSupplierInfo(null);
      setSupplierError('Error validating supplier');
    }
  }, []);

  // Form handlers
  const handleFormChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSupplierBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    validateSupplier(e.target.value);
  }, [validateSupplier]);

  const handlePalletTypeChange = useCallback((key: keyof PalletTypeData, value: string) => {
    setPalletType({
      whiteDry: '',
      whiteWet: '',
      chepDry: '',
      chepWet: '',
      euro: '',
      notIncluded: '',
      [key]: value,
    });
  }, []);

  const handlePackageTypeChange = useCallback((key: keyof PackageTypeData, value: string) => {
    setPackageType({
      still: '',
      bag: '',
      tote: '',
      octo: '',
      notIncluded: '',
      [key]: value,
    });
  }, []);

  const handleGrossWeightChange = useCallback((idx: number, value: string) => {
    setGrossWeights(prev => {
      const next = prev.map((v, i) => (i === idx ? value : v));
      if (idx === prev.length - 1 && value.trim() !== '' && prev.length < 22) {
        return [...next, ''];
      }
      return next;
    });
  }, []);

  // Validation
  const isFormValid = 
    formData.grnNumber.trim() !== '' &&
    formData.materialSupplier.trim() !== '' &&
    formData.productCode.trim() !== '' &&
    Object.values(palletType).some(v => v.trim() !== '') &&
    Object.values(packageType).some(v => v.trim() !== '') &&
    grossWeights.some(v => v.trim() !== '') &&
    productInfo &&
    supplierInfo;

  // Print handler
  const handlePrintClick = useCallback(() => {
    if (!isFormValid) {
      toast.error('Please fill all required fields and ensure product/supplier details are loaded.');
      return;
    }
    setIsClockNumberDialogOpen(true);
  }, [isFormValid]);

  // Clock number confirmation
  const handleClockNumberConfirm = useCallback(async (clockNumber: string) => {
    setIsClockNumberDialogOpen(false);
    setIsProcessing(true);

    try {
      if (!productInfo || !supplierInfo) {
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
      const selectedPalletTypeString = Object.entries(palletType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded';
      const selectedPackageTypeString = Object.entries(packageType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded';

      setPdfProgress({ 
        current: 0, 
        total: numberOfPalletsToProcess, 
        status: Array(numberOfPalletsToProcess).fill('Pending') 
      });

      const collectedPdfBlobs: Blob[] = [];
      let anyFailure = false;

      // 使用服務端 action 生成棧板號碼和系列號
      const generationResult = await generateGrnPalletNumbersAndSeries(numberOfPalletsToProcess);
      
      if (generationResult.error) {
        toast.error(`Failed to generate pallet numbers: ${generationResult.error}`);
        return;
      }
      
      const { palletNumbers: generatedPalletNumbersList, series: uniqueSeriesNumbersList } = generationResult;

      if (generatedPalletNumbersList.length !== numberOfPalletsToProcess || 
          uniqueSeriesNumbersList.length !== numberOfPalletsToProcess) {
        toast.error('Failed to generate unique pallet numbers or series. Please try again.');
        return;
      }

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

        const palletWeight = PALLET_WEIGHT[selectedPalletTypeString] || 0;
        const packageWeight = PACKAGE_WEIGHT[selectedPackageTypeString] || 0;
        const netWeight = currentGrossWeight - palletWeight - packageWeight;

        if (netWeight <= 0) {
          toast.error(`Pallet ${i + 1} NW Error: ${netWeight}kg. Skipping.`);
          setPdfProgress(prev => ({ 
            ...prev, 
            status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
          }));
          anyFailure = true;
          continue;
        }

        const palletNum = generatedPalletNumbersList[i];
        const series = uniqueSeriesNumbersList[i];

        if (!palletNum || !series) {
          toast.error(`Pallet ${i + 1} ID Error. Skipping.`);
          setPdfProgress(prev => ({ 
            ...prev, 
            status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
          }));
          anyFailure = true;
          continue;
        }

        // Create database entries
        const palletInfoData: GrnPalletInfoPayload = {
          plt_num: palletNum,
          series: series,
          product_code: productInfo.code,
          product_qty: Math.round(netWeight),
          plt_remark: `Material GRN- ${formData.grnNumber}`,
        };

        const grnRecordData: GrnRecordPayload = {
          grn_ref: formData.grnNumber,
          material_code: productInfo.code,
          sup_code: supplierInfo.supplier_code,
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
          }, clockNumber);

          if (actionResult.error) {
            toast.error(`Pallet ${i + 1} DB Error: ${actionResult.error}. Skipping PDF.`);
            setPdfProgress(prev => ({ 
              ...prev, 
              status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) 
            }));
            anyFailure = true;
            continue;
          }

          // Generate PDF using admin client
          const grnInput: GrnInputData = {
            grnNumber: formData.grnNumber,
            materialSupplier: supplierInfo.supplier_code,
            productCode: productInfo.code,
            productDescription: productInfo.description,
            productType: productInfo.type || null, // Optional for GRN Label
            netWeight: netWeight,
            series: series,
            palletNum: palletNum,
            receivedBy: clockNumber,
          };

          console.log(`[GrnLabelForm] 準備生成 PDF ${i + 1}/${numberOfPalletsToProcess}`, {
            palletNum,
            series,
            netWeight,
            grnInput
          });

          const pdfLabelProps = await prepareGrnLabelData(grnInput);
          console.log(`[GrnLabelForm] PDF 標籤屬性準備完成:`, pdfLabelProps);

          // 生成 PDF blob（不使用 generateAndUploadPdf）
          const { pdf } = await import('@react-pdf/renderer');
          const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');
          
          console.log(`[GrnLabelForm] 開始生成 PDF blob...`);
          const pdfBlob = await pdf(<PrintLabelPdf {...pdfLabelProps} />).toBlob();
          
          if (!pdfBlob) {
            throw new Error('PDF generation failed to return a blob.');
          }
          
          console.log(`[GrnLabelForm] PDF blob 生成成功:`, {
            blobSize: pdfBlob.size,
            blobType: pdfBlob.type
          });

          // 轉換 blob 為 number array 以便傳遞給 server action
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
          const pdfNumberArray = Array.from(pdfUint8Array);

          // 使用 server action 上傳 PDF
          const fileName = `${palletNum.replace('/', '_')}.pdf`;
          console.log(`[GrnLabelForm] 即將調用 uploadPdfToStorage...`, {
            fileName,
            arrayLength: pdfNumberArray.length
          });

          const uploadResult = await uploadPdfToStorage(pdfNumberArray, fileName, 'grn-labels');

          console.log(`[GrnLabelForm] uploadPdfToStorage 完成:`, {
            success: !!uploadResult.publicUrl,
            error: uploadResult.error,
            publicUrl: uploadResult.publicUrl?.substring(0, 50) + '...'
          });

          if (uploadResult.error) {
            throw new Error(`PDF upload failed: ${uploadResult.error}`);
          }

          if (uploadResult.publicUrl) {
            collectedPdfBlobs.push(pdfBlob);
            setPdfProgress(prev => ({ 
              ...prev, 
              status: prev.status.map((s, idx) => idx === i ? 'Success' : s) 
            }));
            console.log(`[GrnLabelForm] PDF ${i + 1} 成功添加到收集列表`);
          } else {
            console.error(`[GrnLabelForm] PDF ${i + 1} 上傳失敗: uploadResult 沒有 publicUrl`);
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
          ? `GRNLabel_${formData.grnNumber}_${generatedPalletNumbersList[0]?.replace('/', '_')}_${uniqueSeriesNumbersList[0]}.pdf`
          : `GRNLabels_Merged_${formData.grnNumber}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;

        try {
          await mergeAndPrintPdfs(pdfArrayBuffers, printFileName);
          toast.success(`Successfully printed ${collectedPdfBlobs.length} GRN label(s)`);
        } catch (printError: any) {
          toast.error(`PDF Printing Error: ${printError.message}`);
        }
      } else {
        toast.warning('No PDFs were generated for printing.');
      }

      // Reset form
      setGrossWeights(['']);
      setFormData(prev => ({ ...prev, productCode: '' }));
      setProductInfo(null);
      setPalletType({
        whiteDry: '',
        whiteWet: '',
        chepDry: '',
        chepWet: '',
        euro: '',
        notIncluded: '',
      });
      setPackageType({
        still: '',
        bag: '',
        tote: '',
        octo: '',
        notIncluded: '',
      });

    } catch (error) {
      console.error('[GrnLabelForm] Error during print process:', error);
      toast.error('An error occurred during printing');
    } finally {
      setIsProcessing(false);
    }
  }, [productInfo, supplierInfo, formData, palletType, packageType, grossWeights]);



  // Reset form
  const resetForm = useCallback(() => {
    setGrossWeights(['']);
    setFormData(prev => ({ ...prev, productCode: '' }));
    setProductInfo(null);
    setPalletType({
      whiteDry: '',
      whiteWet: '',
      chepDry: '',
      chepWet: '',
      euro: '',
      notIncluded: '',
    });
    setPackageType({
      still: '',
      bag: '',
      tote: '',
      octo: '',
      notIncluded: '',
    });
  }, []);

  // Get pallet label
  const getPalletLabel = (idx: number) => {
    const n = idx + 1;
    if (n === 1) return '1st Pallet';
    if (n === 2) return '2nd Pallet';
    if (n === 3) return '3rd Pallet';
    if (n === 21) return '21st Pallet';
    if (n === 22) return '22nd Pallet';
    return `${n}th Pallet`;
  };

  return (
    <>
      {/* Inject custom styles */}
      <style jsx global>{customStyles}</style>
      
      <ClockNumberConfirmDialog
        isOpen={isClockNumberDialogOpen}
        onOpenChange={setIsClockNumberDialogOpen}
        onConfirm={handleClockNumberConfirm}
        onCancel={() => setIsClockNumberDialogOpen(false)}
        title="Confirm Printing"
        description="Please enter your clock number to proceed with printing GRN labels."
        isLoading={isProcessing}
      />

      <ResponsiveLayout className="bg-gray-900 text-white">
        <ResponsiveContainer maxWidth="xl">
          <div className="text-center mb-8">
            {/* <h1 className="text-3xl font-bold text-orange-500">Material Receiving</h1> */}
          </div>

          {/* Collapsible Instructions Card */}
          <div className="mb-8 bg-blue-900/30 border border-blue-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-blue-900/40 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-blue-300">Instructions</h3>
              </div>
              <div className="flex-shrink-0">
                <svg 
                  className={`w-5 h-5 text-blue-300 transition-transform duration-200 ${isInstructionsExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isInstructionsExpanded && (
              <div className="px-4 pb-4 border-t border-blue-700/30">
                <div className="pt-3 text-xs text-blue-200 space-y-2">
                  <p>• <strong>Fill GRN Details:</strong> Enter GRN Number, Material Supplier Code, and Product Code</p>
                  <p>• <strong>System Validate:</strong> System will auto-validate material supplier Code and product code</p>
                  <p>• <strong>Select Pallet & Package Types:</strong> Put in count of pallet and package, based on their type</p>
                  <p>• <strong>Enter Gross Weight :</strong> Input gross weight for each pallet</p>
                  <p>• <strong>Print Labels:</strong> Click print button after confirm all information is correct and enter password for confirmation</p>
                  <p>• <strong>Enter Clock Number:</strong> Enter your clock number to proceed</p>
                </div>
              </div>
            )}
          </div>

          <ResponsiveStack direction="responsive" spacing={8}>
            {/* Left Column */}
            <div className="flex-1 space-y-8">
              {/* GRN Detail Card */}
              <ResponsiveCard title="GRN Detail" className="bg-gray-800">
                <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={6}>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      GRN Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.grnNumber}
                      onChange={e => handleFormChange('grnNumber', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-white"
                      placeholder="Please Enter..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Material Supplier <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.materialSupplier}
                      onChange={e => handleFormChange('materialSupplier', e.target.value)}
                      onBlur={handleSupplierBlur}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-white"
                      placeholder="Please Enter..."
                      required
                    />
                    {supplierError && <p className="text-red-500 text-xs mt-1">{supplierError}</p>}
                    {supplierInfo && <p className="text-green-400 text-xs mt-1">{supplierInfo.supplier_name}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <ProductCodeInput
                      value={formData.productCode}
                      onChange={(value) => handleFormChange('productCode', value)}
                      onProductInfoChange={(qcProductInfo) => {
                        const adaptedInfo = adaptProductInfo(qcProductInfo);
                        setProductInfo(adaptedInfo);
                      }}
                      required
                      userId={currentUserId}
                    />
                    {productInfo && (
                      <p className="text-green-400 text-xs mt-1">
                        {productInfo.code} - {productInfo.description}
                      </p>
                    )}
                  </div>
                </ResponsiveGrid>
              </ResponsiveCard>

              {/* Pallet & Package Type Row */}
              <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={8}>
                {/* Pallet Type Card */}
                <ResponsiveCard title="Pallet Type" className="bg-gray-800">
                  <div className="space-y-3">
                    {Object.entries(palletType).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <label className="text-sm text-gray-300">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={e => handlePalletTypeChange(key as keyof PalletTypeData, e.target.value)}
                          className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-center text-white"
                          placeholder="Qty"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </ResponsiveCard>

                {/* Package Type Card */}
                <ResponsiveCard title="Package Type" className="bg-gray-800">
                  <div className="space-y-3">
                    {Object.entries(packageType).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <label className="text-sm text-gray-300">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={e => handlePackageTypeChange(key as keyof PackageTypeData, e.target.value)}
                          className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-center text-white"
                          placeholder="Qty"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </ResponsiveCard>
              </ResponsiveGrid>
            </div>

            {/* Right Column */}
            <div className="flex-1 lg:max-w-md">
              <ResponsiveCard title="Weight Information" className="bg-gray-800 sticky top-8">
                {/* Summary Information */}
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Pallets:</span>
                      <span className="ml-2 text-white font-semibold">{grossWeights.filter(w => w.trim() !== '').length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Pallets:</span>
                      <span className="ml-2 text-white font-semibold">22</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 font-semibold ${isFormValid ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isFormValid ? 'Ready to Print' : 'Incomplete Form'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weight Input Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-300">Gross Weight / Qty</h3>
                    <span className="text-xs text-gray-400">
                      {grossWeights.filter(w => w.trim() !== '').length} / 22 pallets
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {grossWeights.map((weight, idx) => {
                      const hasValue = weight.trim() !== '';
                      const isLast = idx === grossWeights.length - 1;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                            hasValue 
                              ? 'bg-gray-700 border border-gray-600' 
                              : isLast 
                                ? 'bg-gray-750 border border-dashed border-gray-600' 
                                : 'bg-gray-800 border border-gray-700'
                          }`}
                        >
                          {/* Pallet Number Badge */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            hasValue 
                              ? 'bg-orange-600 text-white' 
                              : isLast 
                                ? 'bg-gray-600 text-gray-300 border-2 border-dashed border-gray-500' 
                                : 'bg-gray-600 text-gray-400'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Pallet Label and Net Weight */}
                          <div className="flex-1 min-w-0 flex items-center space-x-2">
                            <div className={`text-sm font-medium ${hasValue ? 'text-white' : 'text-gray-400'}`}>
                              {getPalletLabel(idx)}
                            </div>
                            {hasValue && (
                              <div className="text-xs text-gray-400">
                                Net: {(parseFloat(weight) - 
                                  (PALLET_WEIGHT[Object.entries(palletType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded'] || 0) - 
                                  (PACKAGE_WEIGHT[Object.entries(packageType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded'] || 0)
                                ).toFixed(1)}kg
                              </div>
                            )}
                          </div>
                          
                          {/* Weight Input */}
                          <div className="flex-shrink-0 flex items-center space-x-1">
                            <input
                              type="number"
                              value={weight}
                              onChange={e => handleGrossWeightChange(idx, e.target.value)}
                              className={`w-16 p-2 text-right text-sm rounded-md border transition-all duration-200 ${
                                hasValue 
                                  ? 'bg-gray-600 border-gray-500 text-white focus:ring-orange-500 focus:border-orange-500' 
                                  : 'bg-gray-700 border-gray-600 text-gray-300 focus:ring-orange-500 focus:border-orange-500'
                              }`}
                              placeholder={isLast ? "Enter" : "0"}
                              min="0"
                              step="0.1"
                              maxLength={5}
                            />
                            <span className="text-xs text-gray-500">kg</span>
                          </div>
                          
                          {/* Remove Button for filled entries */}
                          {hasValue && !isLast && (
                            <button
                              onClick={() => {
                                const newWeights = grossWeights.filter((_, i) => i !== idx);
                                if (newWeights.length === 0 || newWeights[newWeights.length - 1].trim() !== '') {
                                  newWeights.push('');
                                }
                                setGrossWeights(newWeights);
                              }}
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs flex items-center justify-center transition-colors duration-200"
                              title="Remove this pallet"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handlePrintClick}
                  disabled={!isFormValid || isProcessing}
                  className={`w-full p-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    !isFormValid || isProcessing
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing Labels...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Print GRN Label(s)</span>
                      {grossWeights.filter(w => w.trim() !== '').length > 0 && (
                        <span className="bg-orange-700 px-2 py-1 rounded-full text-sm">
                          {grossWeights.filter(w => w.trim() !== '').length}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Progress Bar */}
                {pdfProgress.total > 0 && (
                  <div className="mt-4">
                    <EnhancedProgressBar
                      current={pdfProgress.current}
                      total={pdfProgress.total}
                      status={pdfProgress.status}
                      title="GRN Label Generation"
                      variant="compact"
                      showPercentage={true}
                      showItemDetails={true}
                      className="bg-gray-700 p-4 rounded-lg"
                    />
                  </div>
                )}
              </ResponsiveCard>
            </div>
          </ResponsiveStack>
        </ResponsiveContainer>
      </ResponsiveLayout>
    </>
  );
};

export default GrnLabelForm; 