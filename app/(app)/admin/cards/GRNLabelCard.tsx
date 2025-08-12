'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { grnErrorHandler } from '@/app/(app)/print-grnlabel/services/ErrorHandler';
import { EnhancedProgressBar } from '../components/EnhancedProgressBar';
import ClockNumberConfirmDialog from '../components/ClockNumberConfirmDialog';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { Package } from 'lucide-react';

// Import new modular components from print-grnlabel
import { GrnDetailCard } from '@/app/(app)/print-grnlabel/components/GrnDetailCard';
import { WeightInputList } from '@/app/(app)/print-grnlabel/components/WeightInputList';

// Import constants
import {
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';

// Import custom hooks
import { useGrnFormReducer } from '@/app/(app)/print-grnlabel/hooks/useGrnFormReducer';
import { useAdminGrnLabelBusiness } from '../hooks/useAdminGrnLabelBusiness';

// Type definitions
interface GrnProductInfo {
  code: string;
  description: string;
  weight: string;
  supplier: string;
}

export interface GRNLabelCardProps {
  className?: string;
}

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

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

export const GRNLabelCard: React.FC<GRNLabelCardProps> = ({ className }) => {
  // Lazy initialize Supabase client only on client side
  const [supabase] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return createClient();
    }
    return null;
  });

  // 使用統一的 state 管理
  const { state, actions } = useGrnFormReducer();

  // 當前用戶 ID
  const [currentUserId, setCurrentUserId] = React.useState<string>('');

  // Adapter function to convert QC Label ProductInfo to GRN ProductInfo
  const adaptProductInfo = useCallback((qcProductInfo: unknown): { code: string; description: string } | null => {
    if (!qcProductInfo || typeof qcProductInfo !== 'object') {
      return null;
    }

    const productObj = qcProductInfo as Record<string, unknown>;

    return {
      code: typeof productObj.code === 'string' ? productObj.code : '',
      description: typeof productObj.description === 'string' ? productObj.description : '',
    };
  }, []);

  // Use the business logic hook
  const { weightCalculation, processPrintRequest } = useAdminGrnLabelBusiness({
    state,
    actions,
    currentUserId,
  });

  // Initialize user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          const clockNumber = user.email.split('@')[0];
          setCurrentUserId(clockNumber);
        } else {
          grnErrorHandler.handleDatabaseError(
            new Error('User session not found. Please log in again.'),
            {
              component: 'GRNLabelCard',
              action: 'auth_initialization',
            },
            'authentication'
          );
        }
      } catch (error) {
        console.error('[GRNLabelCard] Error getting user info:', error);
        grnErrorHandler.handleDatabaseError(
          error as Error,
          {
            component: 'GRNLabelCard',
            action: 'auth_initialization',
          },
          'authentication'
        );
      }
    };

    initializeUser();
  }, [supabase]);

  // 確保初始狀態有至少一個輸入框
  useEffect(() => {
    if (state.grossWeights.length === 0) {
      actions.setGrossWeights(['']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form handlers
  const handleFormChange = useCallback(
    (field: keyof typeof state.formData, value: string) => {
      actions.setFormField(field, value);
    },
    [actions, state]
  );

  const handleSupplierInfoChange = useCallback(
    (supplierInfo: unknown) => {
      if (supplierInfo && typeof supplierInfo === 'object') {
        const supplierObj = supplierInfo as Record<string, unknown>;
        actions.setSupplierInfo({
          code: typeof supplierObj.supplier_code === 'string' ? supplierObj.supplier_code : '',
          name: typeof supplierObj.supplier_name === 'string' ? supplierObj.supplier_name : '',
        });
        actions.setSupplierError(null);
      }
    },
    [actions]
  );

  // Handle label mode change
  const handleLabelModeChange = useCallback(
    (mode: LabelMode) => {
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
    },
    [actions, state.palletType, state.packageType]
  );

  const handlePalletTypeChange = useCallback(
    (key: PalletTypeKey, value: string) => {
      // 先清空所有托盤類型
      Object.keys(state.palletType).forEach(k => {
        actions.setPalletType(k as PalletTypeKey, '');
      });
      // 設置選中的托盤類型
      actions.setPalletType(key, value);
    },
    [actions, state.palletType]
  );

  const handlePackageTypeChange = useCallback(
    (key: PackageTypeKey, value: string) => {
      // 先清空所有包裝類型
      Object.keys(state.packageType).forEach(k => {
        actions.setPackageType(k as PackageTypeKey, '');
      });
      // 設置選中的包裝類型
      actions.setPackageType(key, value);
    },
    [actions, state.packageType]
  );

  // 使用 ref 來避免閉包問題
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleGrossWeightChange = useCallback(
    (idx: number, value: string) => {
      const currentState = stateRef.current;

      actions.setGrossWeight(idx, value);

      // 自動添加新行
      if (
        idx === currentState.grossWeights.length - 1 &&
        value.trim() !== '' &&
        currentState.grossWeights.length < 22
      ) {
        setTimeout(() => {
          actions.addGrossWeight();
        }, 0);
      }
    },
    [actions]
  );

  // Validation
  const isFormValid =
    state.formData.grnNumber.trim() !== '' &&
    state.formData.materialSupplier.trim() !== '' &&
    state.formData.productCode.trim() !== '' &&
    (state.labelMode === 'qty' ||
      (Object.values(state.palletType).some(v => v.trim() !== '') &&
        Object.values(state.packageType).some(v => v.trim() !== ''))) &&
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
          component: 'GRNLabelCard',
          action: 'form_validation',
          clockNumber: currentUserId,
        }
      );
      return;
    }
    actions.toggleClockNumberDialog();
  }, [isFormValid, actions, currentUserId]);

  // Clock number confirmation
  const handleClockNumberConfirm = useCallback(
    async (clockNumber: string) => {
      actions.toggleClockNumberDialog();
      await processPrintRequest(clockNumber);
    },
    [processPrintRequest, actions]
  );

  // Theme configuration for consistent styling
  const theme = {
    borderColor: 'border-orange-500/20',
    glowColor: 'shadow-orange-500/10',
    accentColor: 'text-orange-400',
    headerBg: 'bg-orange-500/10',
  };

  return (
    <>
      {/* Inject custom styles */}
      <style jsx global>
        {customStyles}
      </style>

      <div className={`h-full ${className || ''}`}>
        <GlassmorphicCard
          variant="default"
          hover={false}
          borderGlow={false}
          className={`h-full overflow-hidden transition-all duration-300 ${theme.borderColor} ${theme.glowColor}`}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className={`border-b border-slate-700/50 p-4 transition-all duration-300 ${theme.headerBg}`}>
              <div className="flex items-center gap-2">
                <Package className={`h-6 w-6 ${theme.accentColor}`} />
                <h2 className="text-xl font-semibold text-white">GRN Label Generation</h2>
                {state.grossWeights.filter(w => w.trim() !== '').length > 0 && (
                  <span className={`ml-auto rounded-full bg-orange-600/80 px-2 py-1 text-sm font-medium text-white`}>
                    {state.grossWeights.filter(w => w.trim() !== '').length} labels
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">Generate and print GRN labels for received goods</p>
            </div>

            {/* Main Content */}
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="space-y-6">
                {/* GRN Details Section */}
                <div className="space-y-4">
                  <GrnDetailCard
                    formData={state.formData}
                    labelMode={state.labelMode}
                    productInfo={state.productInfo}
                    supplierInfo={state.supplierInfo}
                    supplierError={state.ui.supplierError}
                    currentUserId={currentUserId}
                    palletType={state.palletType}
                    packageType={state.packageType}
                    onFormChange={handleFormChange}
                    onSupplierInfoChange={handleSupplierInfoChange}
                    onProductInfoChange={qcProductInfo => {
                      const adaptedInfo = adaptProductInfo(qcProductInfo);
                      actions.setProductInfo(adaptedInfo);
                    }}
                    onLabelModeChange={mode => handleLabelModeChange(mode)}
                    onPalletTypeChange={handlePalletTypeChange}
                    onPackageTypeChange={handlePackageTypeChange}
                    disabled={state.ui.isProcessing}
                  />
                </div>

                {/* Weight Input Section */}
                <div className="space-y-4 border-t border-slate-700/30 pt-6">
                  <h3 className="text-base font-medium text-white">Weight/Quantity Input</h3>
                    <WeightInputList
                      grossWeights={state.grossWeights}
                      onChange={handleGrossWeightChange}
                      onRemove={useCallback(
                        (idx: number) => {
                          actions.removeGrossWeight(idx);
                          // 確保至少有一個輸入框
                          if (
                            state.grossWeights.length === 1 ||
                            (state.grossWeights.length === 2 &&
                              state.grossWeights[state.grossWeights.length - 1].trim() !== '')
                          ) {
                            actions.addGrossWeight();
                          }
                        },
                        [actions, state.grossWeights]
                      )}
                      labelMode={state.labelMode}
                      selectedPalletType={
                        (Object.entries(state.palletType).find(
                          ([, value]) => (parseInt(value) || 0) > 0
                        )?.[0] || 'notIncluded') as PalletTypeKey
                      }
                      selectedPackageType={
                        (Object.entries(state.packageType).find(
                          ([, value]) => (parseInt(value) || 0) > 0
                        )?.[0] || 'notIncluded') as PackageTypeKey
                      }
                      maxItems={22}
                      disabled={state.ui.isProcessing}
                    />
                </div>

                {/* Progress Bar */}
                {state.progress.total > 0 && (
                  <div className="space-y-4 border-t border-slate-700/30 pt-6">
                    <h3 className="text-base font-medium text-white">Generation Progress</h3>
                    <EnhancedProgressBar
                      current={state.progress.current}
                      total={state.progress.total}
                      status={state.progress.status}
                      title="GRN Label Generation"
                      variant="compact"
                      showPercentage={true}
                      showItemDetails={true}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Action Button */}
                <div className="space-y-4 border-t border-slate-700/30 pt-6">
                  <button
                    onClick={handlePrintClick}
                    disabled={!isFormValid || state.ui.isProcessing}
                    className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
                      !isFormValid || state.ui.isProcessing
                        ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                        : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500'
                    }`}
                  >
                    {state.ui.isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        <span>Processing Labels...</span>
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        <span>Print GRN Label(s)</span>
                        {state.grossWeights.filter(w => w.trim() !== '').length > 0 && (
                          <span className="rounded-full bg-orange-800 px-2 py-0.5 text-xs font-bold">
                            {state.grossWeights.filter(w => w.trim() !== '').length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      <ClockNumberConfirmDialog
        isOpen={state.ui.isClockNumberDialogOpen}
        onOpenChange={() => actions.toggleClockNumberDialog()}
        onConfirm={handleClockNumberConfirm}
        onCancel={() => actions.toggleClockNumberDialog()}
        title='Confirm Printing'
        description='Please enter your clock number to proceed with printing GRN labels.'
        isLoading={state.ui.isProcessing}
      />
    </>
  );
};

export default GRNLabelCard;