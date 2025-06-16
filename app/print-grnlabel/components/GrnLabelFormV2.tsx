"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { grnErrorHandler } from '../services/ErrorHandler';
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
import { ProductCodeInput } from '../../components/qc-label-form/ProductCodeInput';

// Import custom hooks
import { useGrnFormReducer } from '../hooks/useGrnFormReducer';
import { useGrnLabelBusinessV2 } from '../hooks/useGrnLabelBusinessV2';

// Types for GRN Label (simplified from QC Label ProductInfo)
interface GrnProductInfo {
  code: string;
  description: string;
  standard_qty?: string;  // GRN Label 不需要此欄位
  type?: string;          // GRN Label 不需要此欄位
}

export const GrnLabelFormV2: React.FC = () => {
  const supabase = createClient();
  
  // 使用統一的 state 管理
  const { state, actions } = useGrnFormReducer();
  
  // 當前用戶 ID
  const [currentUserId, setCurrentUserId] = React.useState<string>('');

  // Adapter function to convert QC Label ProductInfo to GRN ProductInfo
  const adaptProductInfo = useCallback((qcProductInfo: any): GrnProductInfo | null => {
    if (!qcProductInfo) {
      return null;
    }
    
    // For GRN Label, we only need code and description
    return {
      code: qcProductInfo.code,
      description: qcProductInfo.description,
    };
  }, []);

  // Use the business logic hook (V2 版本使用 reducer state)
  const {
    validateSupplier,
    weightCalculation,
    processPrintRequest
  } = useGrnLabelBusinessV2({
    state,
    actions,
    currentUserId,
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
          grnErrorHandler.handleDatabaseError(
            new Error('User session not found. Please log in again.'),
            {
              component: 'GrnLabelFormV2',
              action: 'auth_initialization'
            },
            'authentication'
          );
        }
      } catch (error) {
        console.error('[GrnLabelFormV2] Error getting user info:', error);
        grnErrorHandler.handleDatabaseError(
          error as Error,
          {
            component: 'GrnLabelFormV2',
            action: 'auth_initialization'
          },
          'authentication'
        );
      }
    };

    initializeUser();
  }, []);

  // Calculate pallet count for display purposes
  const palletCount = Math.min(22, Object.values(state.palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0) || 1);

  // 確保初始狀態有至少一個輸入框
  useEffect(() => {
    if (state.grossWeights.length === 0) {
      actions.setGrossWeights(['']);
    }
  }, []); // 只在組件掛載時執行一次

  // Form handlers
  const handleFormChange = useCallback((field: keyof typeof state.formData, value: string) => {
    actions.setFormField(field, value);
  }, [actions]);

  const handleSupplierBlur = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const supplier = await validateSupplier(inputValue);
    if (supplier) {
      // Update the form with the correct supplier code
      actions.setFormField('materialSupplier', supplier.supplier_code);
    }
  }, [validateSupplier, actions]);

  // Handle label mode change
  const handleLabelModeChange = useCallback((mode: LabelMode) => {
    actions.setLabelMode(mode);
    
    if (mode === 'qty') {
      // Set Not Included = 1 for both pallet and package types
      Object.keys(state.palletType).forEach(key => {
        actions.setPalletType(key as PalletTypeKey, key === 'notIncluded' ? '1' : '');
      });
      Object.keys(state.packageType).forEach(key => {
        actions.setPackageType(key as PackageTypeKey, key === 'notIncluded' ? '1' : '');
      });
    } else {
      // Reset both pallet and package types when switching to weight mode
      Object.keys(state.palletType).forEach(key => {
        actions.setPalletType(key as PalletTypeKey, '');
      });
      Object.keys(state.packageType).forEach(key => {
        actions.setPackageType(key as PackageTypeKey, '');
      });
    }
  }, [actions, state.palletType, state.packageType]);

  const handlePalletTypeChange = useCallback((key: PalletTypeKey, value: string) => {
    // 先清空所有托盤類型
    Object.keys(state.palletType).forEach(k => {
      actions.setPalletType(k as PalletTypeKey, '');
    });
    // 設置選中的托盤類型
    actions.setPalletType(key, value);
  }, [actions, state.palletType]);

  const handlePackageTypeChange = useCallback((key: PackageTypeKey, value: string) => {
    // 先清空所有包裝類型
    Object.keys(state.packageType).forEach(k => {
      actions.setPackageType(k as PackageTypeKey, '');
    });
    // 設置選中的包裝類型
    actions.setPackageType(key, value);
  }, [actions, state.packageType]);

  // 使用 ref 來避免閉包問題
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleGrossWeightChange = useCallback((idx: number, value: string) => {
    const currentState = stateRef.current;
    
    actions.setGrossWeight(idx, value);
    
    // 自動添加新行
    if (idx === currentState.grossWeights.length - 1 && value.trim() !== '' && currentState.grossWeights.length < 22) {
      setTimeout(() => {
        actions.addGrossWeight();
      }, 0);
    }
  }, [actions]);

  // Validation
  const isFormValid = 
    state.formData.grnNumber.trim() !== '' &&
    state.formData.materialSupplier.trim() !== '' &&
    state.formData.productCode.trim() !== '' &&
    (state.labelMode === 'qty' || (
      Object.values(state.palletType).some(v => v.trim() !== '') &&
      Object.values(state.packageType).some(v => v.trim() !== '')
    )) &&
    state.grossWeights.some(v => v.trim() !== '') &&
    state.productInfo &&
    state.supplierInfo;

  // Print handler
  const handlePrintClick = useCallback(() => {
    if (!isFormValid) {
      grnErrorHandler.handleValidationError(
        'form',
        'Please fill all required fields and ensure product/supplier details are loaded',
        {
          component: 'GrnLabelFormV2',
          action: 'form_validation',
          clockNumber: currentUserId
        }
      );
      return;
    }
    actions.toggleClockNumberDialog();
  }, [isFormValid, actions, currentUserId]);

  // Clock number confirmation
  const handleClockNumberConfirm = useCallback(async (clockNumber: string) => {
    actions.toggleClockNumberDialog();
    await processPrintRequest(clockNumber);
  }, [processPrintRequest, actions]);

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
                formData={state.formData}
                labelMode={state.labelMode}
                productInfo={state.productInfo}
                supplierInfo={state.supplierInfo}
                supplierError={state.ui.supplierError}
                currentUserId={currentUserId}
                onFormChange={handleFormChange}
                onSupplierBlur={handleSupplierBlur}
                onProductInfoChange={(qcProductInfo) => {
                  const adaptedInfo = adaptProductInfo(qcProductInfo);
                  actions.setProductInfo(adaptedInfo);
                }}
                onLabelModeChange={(mode) => handleLabelModeChange(mode)}
                disabled={state.ui.isProcessing}
              />

              {/* Pallet & Package Type Row - Only show in Weight mode */}
              {state.labelMode === 'weight' && (
                <ResponsiveGrid columns={{ sm: 1, md: 2 }} gap={8}>
                  <PalletTypeSelector
                    palletType={state.palletType}
                    onChange={handlePalletTypeChange}
                    disabled={state.ui.isProcessing}
                  />
                  <PackageTypeSelector
                    packageType={state.packageType}
                    onChange={handlePackageTypeChange}
                    disabled={state.ui.isProcessing}
                  />
                </ResponsiveGrid>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-1 lg:max-w-md">
              <ResponsiveCard 
                title={state.labelMode === 'qty' ? 'Quantity Information' : 'Weight Information'} 
                className="sticky top-8"
              >
                {/* Summary Information */}
                <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Pallets:</span>
                      <span className="text-white font-semibold bg-orange-500/20 px-2 py-1 rounded-full">
                        {state.grossWeights.filter(w => w.trim() !== '').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Pallets:</span>
                      <span className="text-white font-semibold bg-slate-600/50 px-2 py-1 rounded-full">22</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-slate-400">Mode:</span>
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                        state.labelMode === 'qty'
                          ? 'text-blue-300 bg-blue-500/20 border border-blue-500/30'
                          : 'text-purple-300 bg-purple-500/20 border border-purple-500/30'
                      }`}>
                        {state.labelMode === 'qty' ? '📦 Quantity' : '⚖️ Weight'}
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
                    grossWeights={state.grossWeights}
                    onChange={handleGrossWeightChange}
                    onRemove={(idx) => {
                      actions.removeGrossWeight(idx);
                      // 確保至少有一個輸入框
                      if (state.grossWeights.length === 1 || 
                          (state.grossWeights.length === 2 && state.grossWeights[state.grossWeights.length - 1].trim() !== '')) {
                        actions.addGrossWeight();
                      }
                    }}
                    labelMode={state.labelMode}
                    selectedPalletType={(Object.entries(state.palletType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded') as PalletTypeKey}
                    selectedPackageType={(Object.entries(state.packageType).find(([, value]) => (parseInt(value) || 0) > 0)?.[0] || 'notIncluded') as PackageTypeKey}
                    maxItems={22}
                    disabled={state.ui.isProcessing}
                  />
                </div>

                {/* Action Button */}
                <div className="relative group">
                  <button
                    onClick={handlePrintClick}
                    disabled={!isFormValid || state.ui.isProcessing}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ease-out flex items-center justify-center space-x-3 relative overflow-hidden ${
                      !isFormValid || state.ui.isProcessing
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 cursor-not-allowed shadow-lg shadow-slate-900/20'
                        : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:via-orange-400 hover:to-amber-400 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-400/40 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {/* 按鈕內部光效 */}
                    {!state.ui.isProcessing && isFormValid && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center space-x-3">
                      {state.ui.isProcessing ? (
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
                          {state.grossWeights.filter(w => w.trim() !== '').length > 0 && (
                            <span className="bg-orange-600/80 px-2 py-1 rounded-full text-sm font-bold">
                              {state.grossWeights.filter(w => w.trim() !== '').length}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Progress Bar */}
                {state.progress.total > 0 && (
                  <div className="mt-6">
                    <EnhancedProgressBar
                      current={state.progress.current}
                      total={state.progress.total}
                      status={state.progress.status}
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
        isOpen={state.ui.isClockNumberDialogOpen}
        onOpenChange={() => actions.toggleClockNumberDialog()}
        onConfirm={handleClockNumberConfirm}
        onCancel={() => actions.toggleClockNumberDialog()}
        title="Confirm Printing"
        description="Please enter your clock number to proceed with printing GRN labels."
        isLoading={state.ui.isProcessing}
      />
    </>
  );
};

export default GrnLabelFormV2;