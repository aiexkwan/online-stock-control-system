"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '../../../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import FloatingInstructions from '@/components/ui/floating-instructions';

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

  /* 卡片標題樣式 */
  .pallet-type-card h2,
  .package-type-card h2 {
    font-size: 1.25rem !important;
    white-space: nowrap;
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
          //console.log(`[GrnLabelForm] PDF 標籤屬性準備完成:`, pdfLabelProps);

          // 生成 PDF blob（不使用 generateAndUploadPdf）
          const { pdf } = await import('@react-pdf/renderer');
          const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');
          
          //console.log(`[GrnLabelForm] 開始生成 PDF blob...`);
          const pdfBlob = await pdf(<PrintLabelPdf {...pdfLabelProps} />).toBlob();
          
          if (!pdfBlob) {
            throw new Error('PDF generation failed to return a blob.');
          }
          
          //console.log(`[GrnLabelForm] PDF blob 生成成功:`, {
          //  blobSize: pdfBlob.size,
          //  blobType: pdfBlob.type
          //});

          // 轉換 blob 為 number array 以便傳遞給 server action
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
          const pdfNumberArray = Array.from(pdfUint8Array);

          // 使用 server action 上傳 PDF
          const fileName = `${palletNum.replace('/', '_')}.pdf`;
          //console.log(`[GrnLabelForm] 即將調用 uploadPdfToStorage...`, {
          //  fileName,
          //  arrayLength: pdfNumberArray.length
          //});

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
      
      <ResponsiveLayout>
        <ResponsiveContainer maxWidth="xl">
          <ResponsiveStack direction="responsive" spacing={8}>
            {/* Left Column */}
            <div className="flex-1 space-y-8">
              {/* GRN Detail Card */}
              <ResponsiveCard 
                title="GRN Detail" 
                headerAction={
                  <FloatingInstructions
                    title="GRN Label Instructions"
                    variant="hangover"
                    steps={[
                      {
                        title: "Fill In Details",
                        description: "Enter GRN Number, Material Supplier Code, and Product Code."
                      },
                      {
                        title: "Select Pallet & Package Types",
                        description: "Choose the appropriate pallet and package types, and enter quantity count for each type."
                      },
                      {
                        title: "Enter Gross Weight",
                        description: "Input the gross weight for each pallet."
                      },
                      {
                        title: "Print Labels",
                        description: "Click 'Print GRN Label(s)' button after confirming all information, then enter your clock number."
                      }
                    ]}
                  />
                }
              >
                <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={6}>
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-slate-300 group-focus-within:text-orange-400 transition-colors duration-200">
                      GRN Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.grnNumber}
                        onChange={e => handleFormChange('grnNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 focus:bg-slate-800/70 hover:border-orange-500/50 hover:bg-slate-800/60 backdrop-blur-sm"
                        placeholder="Please Enter..."
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-slate-300 group-focus-within:text-orange-400 transition-colors duration-200">
                      Material Supplier <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.materialSupplier}
                        onChange={e => handleFormChange('materialSupplier', e.target.value)}
                        onBlur={handleSupplierBlur}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 focus:bg-slate-800/70 hover:border-orange-500/50 hover:bg-slate-800/60 backdrop-blur-sm"
                        placeholder="Please Enter..."
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    {supplierError && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-xs flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {supplierError}
                        </p>
                      </div>
                    )}
                    {supplierInfo && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-xs flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {supplierInfo.supplier_name}
                        </p>
                      </div>
                    )}
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
                      <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-mono text-green-300">{productInfo.code}</span>
                          <span className="mx-2 text-green-500">-</span>
                          <span>{productInfo.description}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </ResponsiveGrid>
              </ResponsiveCard>

              {/* Pallet & Package Type Row */}
              <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={8}>
                {/* Pallet Type Card */}
                <ResponsiveCard title="Pallet Type" className="pallet-type-card">
                  <div className="space-y-3">
                    {Object.entries(palletType).map(([key, value]) => (
                      <div key={key} className="group flex justify-between items-center p-1 bg-slate-800/30 rounded-xl border border-slate-600/20 hover:border-orange-500/30 hover:bg-slate-800/50 transition-all duration-300">
                        <label className="text-xs text-slate-300 font-medium whitespace-nowrap -ml-4">
                          {key === 'whiteDry' ? 'White Dry' :
                           key === 'whiteWet' ? 'White Wet' :
                           key === 'chepDry' ? 'Chep Dry' :
                           key === 'chepWet' ? 'Chep Wet' :
                           key === 'euro' ? 'Euro' :
                           key === 'notIncluded' ? 'Not Included' : key}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={value}
                            onChange={e => handlePalletTypeChange(key as keyof PalletTypeData, e.target.value)}
                            className="w-14 px-2 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-center text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 hover:border-orange-500/50"
                            placeholder="Qty"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ResponsiveCard>

                {/* Package Type Card */}
                <ResponsiveCard title="Package Type" className="package-type-card">
                  <div className="space-y-4">
                    {Object.entries(packageType).map(([key, value]) => (
                      <div key={key} className="group flex justify-between items-center p-1 bg-slate-800/30 rounded-xl border border-slate-600/20 hover:border-orange-500/30 hover:bg-slate-800/50 transition-all duration-300">
                        <label className="text-xs text-slate-300 font-medium whitespace-nowrap -ml-4">
                          {key === 'still' ? 'Still' :
                           key === 'bag' ? 'Bag' :
                           key === 'tote' ? 'Tote' :
                           key === 'octo' ? 'Octo' :
                           key === 'notIncluded' ? 'Not Included' : key}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={value}
                            onChange={e => handlePackageTypeChange(key as keyof PackageTypeData, e.target.value)}
                            className="w-14 px-2 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-center text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 hover:border-orange-500/50"
                            placeholder="Qty"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ResponsiveCard>
              </ResponsiveGrid>
            </div>

            {/* Right Column */}
            <div className="flex-1 lg:max-w-md">
              <ResponsiveCard title="Weight Information" className="sticky top-8">
                {/* Summary Information */}
                <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Pallets:</span>
                      <span className="text-white font-semibold bg-orange-500/20 px-2 py-1 rounded-full">
                        {grossWeights.filter(w => w.trim() !== '').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Pallets:</span>
                      <span className="text-white font-semibold bg-slate-600/50 px-2 py-1 rounded-full">22</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                        isFormValid 
                          ? 'text-green-300 bg-green-500/20 border border-green-500/30' 
                          : 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                      }`}>
                        {isFormValid ? 'Ready to Print' : 'Incomplete Form'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weight Input Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                      Gross Weight / Qty
                    </h3>
                    <span className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
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
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                            hasValue 
                              ? 'bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600/50 hover:border-orange-500/50' 
                              : isLast 
                                ? 'bg-slate-800/30 border border-dashed border-slate-600/50 hover:border-orange-500/30' 
                                : 'bg-slate-800/20 border border-slate-700/30'
                          }`}
                        >
                          {/* Pallet Number Badge */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            hasValue 
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25' 
                              : isLast 
                                ? 'bg-slate-600/50 text-slate-300 border-2 border-dashed border-slate-500/50' 
                                : 'bg-slate-600/30 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Pallet Label and Net Weight */}
                          <div className="flex-1 min-w-0 flex items-center space-x-2">
                            <div className={`text-sm font-medium whitespace-nowrap ${hasValue ? 'text-white' : 'text-slate-400'}`}>
                              {getPalletLabel(idx)}
                            </div>
                            {hasValue && (
                              <div className="text-xs text-orange-300 bg-orange-500/10 px-2 py-1 rounded-full whitespace-nowrap">
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
                              className={`w-16 px-2 py-2 text-right text-sm rounded-lg border transition-all duration-300 ${
                                hasValue 
                                  ? 'bg-slate-700/50 border-slate-600/50 text-white focus:ring-orange-400/30 focus:border-orange-400/70' 
                                  : 'bg-slate-700/30 border-slate-600/30 text-slate-300 focus:ring-orange-400/30 focus:border-orange-400/70'
                              }`}
                              placeholder={isLast ? "Enter" : "0"}
                              min="0"
                              step="0.1"
                              maxLength={5}
                            />
                            <span className="text-xs text-slate-500">kg</span>
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
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs flex items-center justify-center transition-all duration-300 hover:scale-110"
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
                <div className="relative group">
                  <button
                    onClick={handlePrintClick}
                    disabled={!isFormValid || isProcessing}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ease-out flex items-center justify-center space-x-3 relative overflow-hidden ${
                      !isFormValid || isProcessing
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 cursor-not-allowed shadow-lg shadow-slate-900/20'
                        : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:via-orange-400 hover:to-amber-400 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-400/40 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {/* 按鈕內部光效 */}
                    {!isProcessing && isFormValid && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center space-x-3">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Processing Labels...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Print GRN Label(s)</span>
                          {grossWeights.filter(w => w.trim() !== '').length > 0 && (
                            <span className="bg-orange-600/80 px-2 py-1 rounded-full text-sm font-bold">
                              {grossWeights.filter(w => w.trim() !== '').length}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Progress Bar */}
                {pdfProgress.total > 0 && (
                  <div className="mt-6">
                    <EnhancedProgressBar
                      current={pdfProgress.current}
                      total={pdfProgress.total}
                      status={pdfProgress.status}
                      title="GRN Label Generation"
                      variant="compact"
                      showPercentage={true}
                      showItemDetails={true}
                    />
                  </div>
                )}
              </ResponsiveCard>
            </div>
          </ResponsiveStack>
        </ResponsiveContainer>
      </ResponsiveLayout>

      <ClockNumberConfirmDialog
        isOpen={isClockNumberDialogOpen}
        onOpenChange={setIsClockNumberDialogOpen}
        onConfirm={handleClockNumberConfirm}
        onCancel={() => setIsClockNumberDialogOpen(false)}
        title="Confirm Printing"
        description="Please enter your clock number to proceed with printing GRN labels."
        isLoading={isProcessing}
      />
    </>
  );
};

export default GrnLabelForm; 