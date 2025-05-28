'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  VoidPalletState, 
  PalletInfo, 
  ErrorState, 
  VOID_REASONS,
  SearchParams,
  VoidParams,
  ReprintInfoInput,
  AutoReprintParams 
} from '../types';
import { 
  searchPalletAction, 
  voidPalletAction, 
  processDamageAction,
  logErrorAction 
} from '../actions';
import { createClient } from '@/app/utils/supabase/client';

const supabase = createClient();

const initialState: VoidPalletState = {
  searchInput: '',
  searchType: 'qr',
  isSearching: false,
  foundPallet: null,
  voidReason: '',
  damageQuantity: 0,
  password: '',
  isProcessing: false,
  error: null,
  showScanner: false,
  showConfirmDialog: false,
  showReprintDialog: false,
  isInputDisabled: false,
  // Enhanced reprint flow
  showReprintInfoDialog: false,
  reprintInfo: null,
  isAutoReprinting: false,
};

export function useVoidPallet() {
  const router = useRouter();
  const [state, setState] = useState<VoidPalletState>(initialState);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<VoidPalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // Set error state
  const setError = useCallback((error: ErrorState | null) => {
    updateState({ error, isInputDisabled: error?.isBlocking || false });
    
    if (error) {
      // Log error to console for debugging
      console.error(`[VoidPallet] ${error.type}: ${error.message}`);
      
      // Log error to database (logErrorAction will handle user ID lookup automatically)
      logErrorAction('unknown', `${error.type}: ${error.message}`);
    }
  }, [updateState]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    updateState({ isInputDisabled: false });
  }, [setError, updateState]);

  // Search pallet
  const searchPallet = useCallback(async (searchValue: string, searchType: 'qr' | 'pallet_num') => {
    if (!searchValue.trim()) {
      toast.error('Please enter search value');
      return;
    }

    updateState({ isSearching: true, foundPallet: null });
    clearError();

    try {
      const params: SearchParams = { searchValue: searchValue.trim(), searchType };
      const result = await searchPalletAction(params);

      if (result.success && result.data) {
        updateState({ 
          foundPallet: result.data,
          isSearching: false 
        });
        toast.success(`Pallet found: ${result.data.plt_num}`);
      } else {
        setError({
          type: 'search',
          message: result.error || 'Pallet search failed',
          isBlocking: true,
          timestamp: new Date()
        });
        updateState({ isSearching: false });
      }
    } catch (error: any) {
      setError({
        type: 'system',
        message: `Search error: ${error.message}`,
        isBlocking: true,
        timestamp: new Date()
      });
      updateState({ isSearching: false });
    }
  }, [updateState, clearError, setError]);

  // Process QR scan
  const handleQRScan = useCallback((scannedValue: string) => {
    updateState({ 
      searchInput: scannedValue, 
      showScanner: false,
      searchType: 'qr'
    });
    searchPallet(scannedValue, 'qr');
  }, [updateState, searchPallet]);

  // Validate void parameters
  const validateVoidParams = useCallback((): string | null => {
    if (!state.foundPallet) return 'Pallet information not found';
    if (!state.voidReason.trim()) return 'Please select void reason';
    if (!state.password.trim()) return 'Please enter password';

    const voidReasonConfig = VOID_REASONS.find(r => r.value === state.voidReason);
    if (voidReasonConfig?.requiresDamageQty) {
      if (state.damageQuantity <= 0 || state.damageQuantity > state.foundPallet.product_qty) {
        return `Damage quantity must be between 1 and ${state.foundPallet.product_qty}`;
      }
    }

    return null;
  }, [state]);

  // Execute void operation
  const executeVoid = useCallback(async () => {
    const validationError = validateVoidParams();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!state.foundPallet) return;

    updateState({ isProcessing: true });
    clearError();

    try {
      const voidParams: VoidParams = {
        palletInfo: state.foundPallet,
        voidReason: state.voidReason,
        password: state.password,
        damageQuantity: state.damageQuantity > 0 ? state.damageQuantity : undefined
      };

      let result;
      
      // Choose processing method based on void reason
      if (state.voidReason === 'Damage') {
        result = await processDamageAction(voidParams);
      } else {
        result = await voidPalletAction(voidParams);
      }

      if (result.success) {
        toast.success(result.message || 'Pallet voided successfully');

        // Check if we need to show reprint info dialog for special cases
        if (shouldShowReprintDialog(state.voidReason, result)) {
          const reprintType = getReprintType(state.voidReason);
          const reprintInfo: ReprintInfoInput = {
            type: reprintType,
            originalPalletInfo: state.foundPallet,
          };

          // For damage cases, set remaining quantity
          if (reprintType === 'damage' && result.remainingQty !== undefined) {
            reprintInfo.remainingQuantity = result.remainingQty;
          }

          updateState({ 
            showReprintInfoDialog: true, 
            reprintInfo: reprintInfo 
          });
          return; // Don't reset state yet, wait for user input
        }

        // Process reprint logic for other cases (legacy flow)
        if (result.requiresReprint && result.reprintInfo) {
          const queryParams = new URLSearchParams({
            product_code: result.reprintInfo.product_code,
            quantity: result.reprintInfo.quantity.toString(),
            source_action: result.reprintInfo.source_action,
            original_plt_num: result.reprintInfo.original_plt_num,
          });

          if (result.reprintInfo.target_location) {
            queryParams.set('target_location', result.reprintInfo.target_location);
          }

          // Delay redirect to let user see success message
          setTimeout(() => {
            router.push(`/print-label?${queryParams.toString()}`);
          }, 2000);
        }

        resetState();
      } else {
        setError({
          type: 'void',
          message: result.error || 'Void operation failed',
          isBlocking: true,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      setError({
        type: 'system',
        message: `Void error: ${error.message}`,
        isBlocking: true,
        timestamp: new Date()
      });
    } finally {
      updateState({ isProcessing: false });
    }
  }, [state, validateVoidParams, updateState, clearError, setError, resetState, router]);

  // Handle damage quantity change
  const handleDamageQuantityChange = useCallback((quantity: number) => {
    if (!state.foundPallet) return;
    
    // ACO logic: If remark contains ACO Ref, automatically set to full quantity
    const isACOPallet = state.foundPallet.plt_remark?.includes('ACO Ref');
    if (isACOPallet && state.voidReason === 'Damage') {
      updateState({ damageQuantity: state.foundPallet.product_qty });
      return;
    }

    updateState({ damageQuantity: quantity });
  }, [state.foundPallet, state.voidReason, updateState]);

  // Handle void reason change
  const handleVoidReasonChange = useCallback((reason: string) => {
    updateState({ voidReason: reason });
    
    // If not damage reason, clear damage quantity
    const voidReasonConfig = VOID_REASONS.find(r => r.value === reason);
    if (!voidReasonConfig?.requiresDamageQty) {
      updateState({ damageQuantity: 0 });
    }
  }, [updateState]);

  // Enhanced reprint flow functions
  const shouldShowReprintDialog = useCallback((voidReason: string, result: any): boolean => {
    // Check if this is one of the three special cases that need reprint info
    const specialCases = ['Damage', 'Wrong Qty', 'Wrong Product Code'];
    return specialCases.includes(voidReason) && result.success;
  }, []);

  const getReprintType = useCallback((voidReason: string): 'damage' | 'wrong_qty' | 'wrong_code' => {
    switch (voidReason) {
      case 'Damage':
        return 'damage';
      case 'Wrong Qty':
        return 'wrong_qty';
      case 'Wrong Product Code':
        return 'wrong_code';
      default:
        return 'damage'; // fallback
    }
  }, []);

  const handleReprintInfoConfirm = useCallback(async (reprintInfo: ReprintInfoInput) => {
    updateState({ isAutoReprinting: true, showReprintInfoDialog: false });
    
    try {
      // Get current user info for operator clock number
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        throw new Error('Unable to get user information');
      }

      console.log(`[Auto Reprint] Looking up user ID for email: ${user.email}`);

      // Look up user ID from data_id table
      const { data: userData, error: userDataError } = await supabase
        .from('data_id')
        .select('id, name, email')
        .eq('email', user.email)
        .single();

      console.log(`[Auto Reprint] User lookup result:`, { userData, userDataError });

      if (userDataError || !userData) {
        throw new Error('User not found in system');
      }

      // Use the id field as the operator clock number
      const operatorClockNum = userData.id.toString();
      console.log(`[Auto Reprint] Using operator clock number: ${operatorClockNum}`);

      // Prepare auto reprint parameters
      const autoReprintParams = {
        productCode: reprintInfo.correctedProductCode || reprintInfo.originalPalletInfo.product_code,
        quantity: reprintInfo.correctedQuantity || reprintInfo.remainingQuantity || reprintInfo.originalPalletInfo.product_qty,
        originalPltNum: reprintInfo.originalPalletInfo.plt_num,
        originalLocation: reprintInfo.originalPalletInfo.plt_loc || 'await',
        sourceAction: `void_${reprintInfo.type}`,
        targetLocation: reprintInfo.originalPalletInfo.plt_loc || 'Pipeline',
        reason: state.voidReason,
        operatorClockNum: operatorClockNum
      };

      console.log(`[Auto Reprint] Calling API with params:`, autoReprintParams);

      // Call auto reprint API
      const response = await fetch('/api/auto-reprint-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(autoReprintParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auto reprint failed');
      }

      // Get success message and new pallet number from headers
      const newPalletNum = response.headers.get('X-New-Pallet-Number');
      const successMessage = response.headers.get('X-Success-Message');

      console.log(`[Auto Reprint] Success! New pallet: ${newPalletNum}`);

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = newPalletNum ? `${newPalletNum.replace(/\//g, '_')}.pdf` : `auto-reprint-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(successMessage || `New pallet ${newPalletNum} created and printed successfully`);
      
      // Reset state
      resetState();

    } catch (error: any) {
      console.error('Auto reprint error:', error);
      setError({
        type: 'system',
        message: `Auto reprint failed: ${error.message}`,
        isBlocking: true,
        timestamp: new Date()
      });
    } finally {
      updateState({ isAutoReprinting: false });
    }
  }, [state.voidReason, updateState, resetState, setError]);

  const handleReprintInfoCancel = useCallback(() => {
    updateState({ showReprintInfoDialog: false, reprintInfo: null });
  }, [updateState]);

  return {
    // State
    state,
    
    // State update function
    updateState,
    resetState,
    setError,
    clearError,
    
    // Business logic function
    searchPallet,
    handleQRScan,
    executeVoid,
    handleDamageQuantityChange,
    handleVoidReasonChange,
    
    // Enhanced reprint flow functions
    handleReprintInfoConfirm,
    handleReprintInfoCancel,
    shouldShowReprintDialog,
    getReprintType,
    
    // Helper function
    validateVoidParams,
    
    // Calculated properties
    canExecuteVoid: !state.isProcessing && !state.error?.isBlocking && validateVoidParams() === null,
    showDamageQuantityInput: VOID_REASONS.find(r => r.value === state.voidReason)?.requiresDamageQty || false,
    isACOPallet: state.foundPallet?.plt_remark?.includes('ACO Ref') || false,
  };
} 