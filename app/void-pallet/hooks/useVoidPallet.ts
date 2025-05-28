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
  VoidParams 
} from '../types';
import { 
  searchPalletAction, 
  voidPalletAction, 
  processDamageAction,
  logErrorAction 
} from '../actions';

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
      // Log error, no need for userId as logErrorAction now gets user info from Supabase Auth
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

        // Process reprint logic
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
    
    // Helper function
    validateVoidParams,
    
    // Calculated properties
    canExecuteVoid: !state.isProcessing && !state.error?.isBlocking && validateVoidParams() === null,
    showDamageQuantityInput: VOID_REASONS.find(r => r.value === state.voidReason)?.requiresDamageQty || false,
    isACOPallet: state.foundPallet?.plt_remark?.includes('ACO Ref') || false,
  };
} 