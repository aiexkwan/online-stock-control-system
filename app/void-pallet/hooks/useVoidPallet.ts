'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCurrentUserClockNumber } from '../../hooks/useAuth';
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
  logErrorAction,
  voidPalletWithPassword,
  logHistoryAction
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
      const currentUserClockNumber = getCurrentUserClockNumber();
      logErrorAction(currentUserClockNumber || 'unknown', `${error.type}: ${error.message}`);
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
        //toast.success(`Pallet found: ${result.data.plt_num}`);
      } else {
        // 檢查是否為 "already voided" 錯誤
        const errorMessage = result.error || 'Pallet search failed';
        if (errorMessage.toLowerCase().includes('already voided') || 
            errorMessage.toLowerCase().includes('voided') ||
            errorMessage.toLowerCase().includes('已作廢')) {
          // 使用 toast 顯示錯誤並重置輸入欄位
          toast.error('Pallet is already voided');
          updateState({ 
            isSearching: false,
            searchInput: '',
            foundPallet: null 
          });
          return;
        }
        
        // 其他錯誤使用原有的錯誤處理
        setError({
          type: 'search',
          message: errorMessage,
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
    // 只有在選擇了特定的作廢原因後才顯示重印對話框
    const reprintReasons = ['Wrong Label', 'Wrong Qty', 'Wrong Product Code', 'Damage'];
    return reprintReasons.includes(voidReason) && result.success;
  }, []);

  const getReprintType = useCallback((voidReason: string): 'damage' | 'wrong_qty' | 'wrong_code' => {
    switch (voidReason) {
      case 'Damage':
        return 'damage';
      case 'Wrong Qty':
        return 'wrong_qty';
      case 'Wrong Product Code':
        return 'wrong_code';
      case 'Wrong Label':
        return 'damage'; // Wrong Label 使用與 damage 相同的處理邏輯
      default:
        return 'damage'; // fallback
    }
  }, []);

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

          // 不立即顯示重印對話框，而是存儲重印信息，等待 VoidPalletDialog 關閉後再顯示
          updateState({ 
            reprintInfo: reprintInfo,
            showReprintInfoDialog: false // 確保不立即顯示
          });
          
          // 返回成功狀態，讓調用者知道需要處理重印
          return { success: true, needsReprint: true, reprintInfo };
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
        return { success: true, needsReprint: false };
      } else {
        setError({
          type: 'void',
          message: result.error || 'Void operation failed',
          isBlocking: true,
          timestamp: new Date()
        });
        return { success: false };
      }
    } catch (error: any) {
      setError({
        type: 'system',
        message: `Void error: ${error.message}`,
        isBlocking: true,
        timestamp: new Date()
      });
      return { success: false };
    } finally {
      updateState({ isProcessing: false });
    }
  }, [state, validateVoidParams, updateState, clearError, setError, resetState, router, shouldShowReprintDialog, getReprintType]);

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

  const handleReprintInfoConfirm = useCallback(async (reprintInfo: ReprintInfoInput) => {
    console.log('[Auto Reprint] Starting reprint process...');
    updateState({ isAutoReprinting: true, showReprintInfoDialog: false });
    
    try {
      // 檢查瀏覽器支持
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }
      
      if (!window.URL || !window.URL.createObjectURL) {
        throw new Error('Browser does not support URL.createObjectURL');
      }
      
      // 檢查網路狀態
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        throw new Error('No internet connection available');
      }
      
      console.log('[Auto Reprint] Browser compatibility check passed');

      // 獲取 operator clock number - 使用多種方法確保成功
      let operatorClockNum: string | null = null;
      
      // 方法1: 使用 hook 獲取的 clock number
      const currentUserClockNumber = getCurrentUserClockNumber();
      if (currentUserClockNumber && currentUserClockNumber !== 'unknown') {
        operatorClockNum = currentUserClockNumber;
        console.log('[Auto Reprint] Using clock number from hook:', operatorClockNum);
      }
      
      // 方法2: 從 localStorage 獲取（備用方案）
      if (!operatorClockNum) {
        const storedClockNumber = localStorage.getItem('loggedInUserClockNumber');
        if (storedClockNumber && storedClockNumber !== 'unknown') {
          operatorClockNum = storedClockNumber;
          console.log('[Auto Reprint] Using stored clock number from localStorage:', operatorClockNum);
        }
      }
      
      // 方法3: 通過 email 查詢數據庫
      if (!operatorClockNum) {
        const storedEmail = localStorage.getItem('loggedInUserEmail');
        if (storedEmail) {
          console.log('[Auto Reprint] Trying to lookup clock number by stored email:', storedEmail);
          
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            
            const { data, error } = await supabase
              .from('data_id')
              .select('id')
              .eq('email', storedEmail)
              .single();
              
            console.log('[Auto Reprint] Database query result:', { data, error });
              
            if (!error && data && data.id) {
              operatorClockNum = data.id.toString();
              console.log('[Auto Reprint] Got clock number from database:', operatorClockNum);
              
              // 儲存到 localStorage 以供下次使用
              if (operatorClockNum) {
                localStorage.setItem('loggedInUserClockNumber', operatorClockNum);
              }
            } else {
              console.error('[Auto Reprint] Database query failed:', error);
            }
          } catch (dbError) {
            console.error('[Auto Reprint] Database lookup error:', dbError);
          }
        }
      }
      
      // 檢查是否成功獲取 clock number
      if (!operatorClockNum || operatorClockNum === 'unknown') {
        throw new Error('Unable to get current user clock number. Please ensure you are logged in and try again.');
      }

      // 確保 operatorClockNum 不為 null（已經通過上面的檢查）
      const finalOperatorClockNum: string = operatorClockNum!;
      console.log(`[Auto Reprint] Final operator clock number: ${finalOperatorClockNum}`);

      // Prepare auto reprint parameters
      const autoReprintParams = {
        productCode: reprintInfo.correctedProductCode || reprintInfo.originalPalletInfo.product_code,
        quantity: reprintInfo.correctedQuantity || reprintInfo.remainingQuantity || reprintInfo.originalPalletInfo.product_qty,
        originalPltNum: reprintInfo.originalPalletInfo.plt_num,
        originalLocation: reprintInfo.originalPalletInfo.plt_loc || 'await',
        sourceAction: `void_${reprintInfo.type}`,
        targetLocation: reprintInfo.originalPalletInfo.plt_loc || 'Pipeline',
        reason: state.voidReason,
        operatorClockNum: finalOperatorClockNum
      };

      console.log(`[Auto Reprint] Calling API with params:`, autoReprintParams);

      // Call auto reprint API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/auto-reprint-label', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(autoReprintParams),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`[Auto Reprint] API response status: ${response.status}`);
        console.log(`[Auto Reprint] API response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = 'Auto reprint failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('[Auto Reprint] API error response:', errorData);
          } catch (parseError) {
            console.error('[Auto Reprint] Failed to parse error response:', parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Get success message and new pallet number from headers
        const newPalletNum = response.headers.get('X-New-Pallet-Number');
        const successMessage = response.headers.get('X-Success-Message');

        console.log(`[Auto Reprint] Success! New pallet: ${newPalletNum}`);
        console.log(`[Auto Reprint] Success message: ${successMessage}`);

        // Download the PDF
        console.log('[Auto Reprint] Starting PDF download...');
        const blob = await response.blob();
        console.log(`[Auto Reprint] PDF blob size: ${blob.size} bytes`);
        console.log(`[Auto Reprint] PDF blob type: ${blob.type}`);
        
        if (blob.size === 0) {
          throw new Error('Received empty PDF file');
        }

        // 檢查 blob 類型
        if (!blob.type.includes('pdf') && !blob.type.includes('application/octet-stream')) {
          console.warn(`[Auto Reprint] Unexpected blob type: ${blob.type}`);
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = newPalletNum ? `${newPalletNum.replace(/\//g, '_')}.pdf` : `auto-reprint-${Date.now()}.pdf`;
        
        // 確保元素被添加到 DOM
        document.body.appendChild(a);
        
        console.log(`[Auto Reprint] Triggering download for file: ${a.download}`);
        console.log(`[Auto Reprint] Download URL: ${url}`);
        
        // 嘗試觸發下載
        try {
          a.click();
          console.log('[Auto Reprint] Download click triggered successfully');
        } catch (clickError) {
          console.error('[Auto Reprint] Error triggering download click:', clickError);
          // 備用方法：直接打開 URL
          window.open(url, '_blank');
          console.log('[Auto Reprint] Fallback: opened URL in new tab');
        }
        
        // Clean up
        setTimeout(() => {
          try {
            window.URL.revokeObjectURL(url);
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
            console.log('[Auto Reprint] Download cleanup completed');
          } catch (cleanupError) {
            console.error('[Auto Reprint] Error during cleanup:', cleanupError);
          }
        }, 1000); // 增加延遲時間

        toast.success(successMessage || `New pallet ${newPalletNum} created and printed successfully`);
        
        // Reset state
        resetState();

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw fetchError;
      }

    } catch (error: any) {
      console.error('[Auto Reprint] Error in reprint process:', error);
      toast.error(`Auto reprint failed: ${error.message}`);
      setError({
        type: 'system',
        message: `Auto reprint failed: ${error.message}`,
        isBlocking: true,
        timestamp: new Date()
      });
    } finally {
      console.log('[Auto Reprint] Process completed, resetting state...');
      updateState({ isAutoReprinting: false });
    }
  }, [state.voidReason, updateState, resetState, setError]);

  const handleReprintInfoCancel = useCallback(() => {
    updateState({ showReprintInfoDialog: false, reprintInfo: null });
  }, [updateState]);

  // Get current user clock number from localStorage
  const getCurrentClockNumber = useCallback(() => {
    return getCurrentUserClockNumber();
  }, []);

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