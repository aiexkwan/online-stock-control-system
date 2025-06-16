"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ResponsiveLayout, ResponsiveContainer, ResponsiveCard, ResponsiveStack, ResponsiveGrid } from '../../components/qc-label-form/ResponsiveLayout';
import { EnhancedProgressBar } from '../../components/qc-label-form/EnhancedProgressBar';
import ClockNumberConfirmDialog from '../../components/qc-label-form/ClockNumberConfirmDialog';

// Import new modular components
import { GrnDetailCard } from './GrnDetailCard';
import { PalletTypeSelector } from './PalletTypeSelector';
import { PackageTypeSelector } from './PackageTypeSelector';
import { WeightInputList } from './WeightInputList';

// Import constants
import { 
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode 
} from '../../constants/grnConstants';

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
  type ProgressStatus
} from '../../components/qc-label-form';
import { ProductCodeInput } from '../../components/qc-label-form/ProductCodeInput';

// Import custom business logic hook
import { useGrnLabelBusiness } from '../hooks/useGrnLabelBusiness';

// Types for GRN Label (simplified from QC Label ProductInfo)
interface GrnProductInfo {
  code: string;
  description: string;
  standard_qty?: string;  // GRN Label 不需要此欄位
  type?: string;          // GRN Label 不需要此欄位
}

// Note: We use ProductCodeInput from QC Label but adapt its ProductInfo to our simplified GrnProductInfo

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

export const GrnLabelForm: React.FC = () => {
  const supabase = createClient();

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

  // Add label mode state
  const [labelMode, setLabelMode] = useState<LabelMode>(LABEL_MODES.WEIGHT);

  // Product and supplier info
  const [productInfo, setProductInfo] = useState<GrnProductInfo | null>(null);

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

  // Clock number confirmation dialog
  const [isClockNumberDialogOpen, setIsClockNumberDialogOpen] = useState(false);

  // User info
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Use the business logic hook
  const {
    supplierInfo,
    supplierError,
    validateSupplier,
    weightCalculation,
    isProcessing,
    pdfProgress,
    processPrintRequest
  } = useGrnLabelBusiness({
    formData,
    productInfo,
    labelMode,
    palletType,
    packageType,
    grossWeights,
    currentUserId,
    onFormReset: () => {
      setGrossWeights(['']);
      setFormData(prev => ({ ...prev, productCode: '' }));
      setProductInfo(null);
      setLabelMode(LABEL_MODES.WEIGHT);
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
    }
  });

  // Initialize user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Extract clock number from email (format: clocknumber@pennine.com)
          const clockNumber = user.email.split('@')[0];
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


  // Form handlers
  const handleFormChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSupplierBlur = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const supplier = await validateSupplier(inputValue);
    if (supplier) {
      // Update the form with the correct supplier code
      setFormData(prev => ({ ...prev, materialSupplier: supplier.supplier_code }));
    }
  }, [validateSupplier]);

  // Handle label mode change
  const handleLabelModeChange = useCallback((mode: LabelMode) => {
    setLabelMode(mode);
    
    if (mode === 'qty') {
      // Set Not Included = 1 for both pallet and package types
      setPalletType({
        whiteDry: '',
        whiteWet: '',
        chepDry: '',
        chepWet: '',
        euro: '',
        notIncluded: '1',
      });
      setPackageType({
        still: '',
        bag: '',
        tote: '',
        octo: '',
        notIncluded: '1',
      });
    } else {
      // Reset both pallet and package types when switching to weight mode
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
    }
  }, []);

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
    (labelMode === 'qty' || (
      Object.values(palletType).some(v => v.trim() !== '') &&
      Object.values(packageType).some(v => v.trim() !== '')
    )) &&
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
    await processPrintRequest(clockNumber);
  }, [processPrintRequest]);



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
              <GrnDetailCard
                formData={formData}
                labelMode={labelMode}
                productInfo={productInfo}
                supplierInfo={supplierInfo ? {
                  code: supplierInfo.supplier_code,
                  name: supplierInfo.supplier_name
                } : null}
                supplierError={supplierError}
                currentUserId={currentUserId}
                onFormChange={handleFormChange}
                onSupplierBlur={handleSupplierBlur}
                onProductInfoChange={(qcProductInfo) => {
                  const adaptedInfo = adaptProductInfo(qcProductInfo);
                  setProductInfo(adaptedInfo);
                }}
                onLabelModeChange={(mode) => handleLabelModeChange(mode)}
                disabled={isProcessing}
              />

              {/* Pallet & Package Type Row - Only show in Weight mode */}
              {labelMode === 'weight' && (
                <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={8}>
                  <PalletTypeSelector
                    palletType={palletType}
                    onChange={handlePalletTypeChange}
                    disabled={isProcessing}
                  />
                  <PackageTypeSelector
                    packageType={packageType}
                    onChange={handlePackageTypeChange}
                    disabled={isProcessing}
                  />
                </ResponsiveGrid>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-1 lg:max-w-md">
              <ResponsiveCard 
                title={labelMode === 'qty' ? 'Quantity Information' : 'Weight Information'} 
                className="sticky top-8"
              >
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
                      <span className="text-slate-400">Mode:</span>
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                        labelMode === 'qty'
                          ? 'text-blue-300 bg-blue-500/20 border border-blue-500/30'
                          : 'text-purple-300 bg-purple-500/20 border border-purple-500/30'
                      }`}>
                        {labelMode === 'qty' ? '📦 Quantity' : '⚖️ Weight'}
                      </span>
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

                {/* Weight/Quantity Input Section */}
                <div className="mb-6">
                  <WeightInputList
                    grossWeights={grossWeights}
                    onChange={handleGrossWeightChange}
                    onRemove={(idx) => {
                      const newWeights = grossWeights.filter((_, i) => i !== idx);
                      if (newWeights.length === 0 || newWeights[newWeights.length - 1].trim() !== '') {
                        newWeights.push('');
                      }
                      setGrossWeights(newWeights);
                    }}
                    labelMode={labelMode}
                    selectedPalletType={(Object.entries(palletType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded') as PalletTypeKey}
                    selectedPackageType={(Object.entries(packageType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded') as PackageTypeKey}
                    maxItems={22}
                    disabled={isProcessing}
                  />
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