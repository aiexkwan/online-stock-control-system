'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DatabaseRecord } from '@/lib/types/database';
import { getErrorMessage } from '@/lib/types/error-handling';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUserId } from '@/app/hooks/useUserId';
import { getCurrentUserClockNumberAsync } from '@/app/hooks/useAuth';
import {
  VoidPalletState,
  PalletInfo,
  ErrorState,
  VOID_REASONS,
  SearchParams,
  VoidParams,
  AutoReprintParams,
  ReprintInfoInput,
} from '../types';
import {
  searchPalletAction,
  voidPalletAction,
  processDamageAction,
  logErrorAction,
} from '../actions';
import {
  detectSearchType,
  formatSearchInput,
  validateSearchFormat,
} from '../utils/searchDetection';
import {
  transformErrorMessage,
  shouldClearInput,
  formatErrorForDisplay,
} from '../utils/errorMessages';

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
  isAutoReprinting: false,
  reprintInfo: null,
  showReprintInfoDialog: false,
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
  const setError = useCallback(
    (error: ErrorState | null) => {
      updateState({ error, isInputDisabled: error?.isBlocking || false });

      if (error) {
        // Log error to console for debugging
        console.error(`[VoidPallet] ${error.type}: ${getErrorMessage(error)}`);

        // Log error to database (使用異步方式獲取 clock number)
        getCurrentUserClockNumberAsync()
          .then((clockNumber: string | null) => {
            logErrorAction(clockNumber || 'unknown', `${error.type}: ${getErrorMessage(error)}`);
          })
          .catch((err: any) => {
            (process.env.NODE_ENV as string) !== 'production' &&
              (process.env.NODE_ENV as string) !== 'production' &&
              console.warn('[VoidPallet] Failed to get clock number for error logging:', err);
            logErrorAction('unknown', `${error.type}: ${getErrorMessage(error)}`);
          });
      }
    },
    [updateState]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    updateState({ isInputDisabled: false });
  }, [setError, updateState]);

  // Search pallet with enhanced detection
  const searchPallet = useCallback(
    async (searchValue: string, searchType: 'qr' | 'pallet_num') => {
      if (!searchValue.trim()) {
        toast.error('Please enter search value');
        return;
      }

      // Enhanced search type detection
      const detection = detectSearchType(searchValue.trim());

      // Show detection confidence in console for debugging
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[Search Detection]', {
          input: searchValue,
          detected: detection.type,
          confidence: detection.confidence,
          pattern: detection.pattern,
        });

      // If confidence is low, show warning
      if (detection.confidence < 50 && detection.suggestions) {
        toast.warning(detection.suggestions[0]);
      }

      // Use detected type if confidence is high enough
      const finalSearchType =
        detection.confidence >= 70
          ? detection.type === 'series'
            ? 'qr'
            : 'pallet_num'
          : searchType;

      updateState({ isSearching: true, foundPallet: null });
      clearError();

      try {
        const params: SearchParams = {
          searchValue: searchValue.trim(),
          searchType: finalSearchType,
        };
        const result = await searchPalletAction(params);

        if (result.success && result.data) {
          updateState({
            foundPallet: result.data,
            isSearching: false,
          });
          //toast.success(`Pallet found: ${result.data.plt_num}`);
        } else {
          // Enhanced error handling with user-friendly messages
          const errorMessage = result.error || 'Pallet search failed';
          const errorConfig = transformErrorMessage(errorMessage);
          const displayError = formatErrorForDisplay(errorConfig);

          // Show user-friendly error message
          if (errorConfig.severity === 'warning') {
            toast.warning(displayError.title);
          } else {
            toast.error(displayError.title);
          }

          // Show suggested actions if any
          if (displayError.actions && displayError.actions.length > 0) {
            displayError.actions.forEach((action, index) => {
              setTimeout(
                () => {
                  toast.info(`💡 ${action}`);
                },
                (index + 1) * 1000
              );
            });
          }

          // Clear input if needed
          if (shouldClearInput(errorConfig.code)) {
            updateState({
              isSearching: false,
              searchInput: '',
              foundPallet: null,
            });
          } else {
            updateState({ isSearching: false });
          }

          // Only set blocking error for severe errors
          if (errorConfig.severity === 'error' && !shouldClearInput(errorConfig.code)) {
            setError({
              type: 'search',
              message: errorConfig.userMessage,
              details: errorConfig.technicalMessage,
              isBlocking: true,
              timestamp: new Date(),
            });
          }
        }
      } catch (error: unknown) {
        setError({
          type: 'system',
          message: `Search error: ${getErrorMessage(error)}`,
          isBlocking: true,
          timestamp: new Date(),
        });
        updateState({ isSearching: false });
      }
    },
    [updateState, clearError, setError]
  );

  // Process QR scan
  const handleQRScan = useCallback(
    (scannedValue: string) => {
      updateState({
        searchInput: scannedValue,
        showScanner: false,
        searchType: 'qr',
      });
      searchPallet(scannedValue, 'qr');
    },
    [updateState, searchPallet]
  );

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
  const handleVoidReasonChange = useCallback(
    (reason: string) => {
      updateState({ voidReason: reason });

      // If not damage reason, clear damage quantity
      const voidReasonConfig = VOID_REASONS.find(r => r.value === reason);
      if (!voidReasonConfig?.requiresDamageQty) {
        updateState({ damageQuantity: 0 });
      }
    },
    [updateState]
  );

  // Enhanced reprint flow functions
  const shouldShowReprintDialog = useCallback(
    (voidReason: string, result: DatabaseRecord, palletInfo: PalletInfo): boolean => {
      // 🔥 修改：檢查是否為 ACO pallet
      const isACOPallet = palletInfo.plt_remark?.includes('ACO Ref');

      // 🔥 修改：ACO pallet 不顯示重印對話框
      if (isACOPallet) {
        return false;
      }

      // 🔥 修改：完全損壞不顯示重印對話框
      if (voidReason === 'Damage' && result.remainingQty === 0) {
        return false;
      }

      // 只有在選擇了特定的作廢原因後才顯示重印對話框
      const reprintReasons = ['Wrong Label', 'Wrong Qty', 'Wrong Product Code', 'Damage'];
      return reprintReasons.includes(voidReason) && result.success;
    },
    []
  );

  const getReprintType = useCallback(
    (voidReason: string): 'damage' | 'wrong_qty' | 'wrong_code' | 'wrong_label' => {
      switch (voidReason) {
        case 'Damage':
          return 'damage';
        case 'Wrong Qty':
          return 'wrong_qty';
        case 'Wrong Product Code':
          return 'wrong_code';
        case 'Wrong Label':
          return 'wrong_label';
        default:
          return 'damage'; // fallback
      }
    },
    []
  );

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
        damageQuantity: state.damageQuantity > 0 ? state.damageQuantity : undefined,
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
        if (shouldShowReprintDialog(state.voidReason, result, state.foundPallet)) {
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
            showReprintInfoDialog: false, // 確保不立即顯示
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
          timestamp: new Date(),
        });
        return { success: false };
      }
    } catch (error: unknown) {
      setError({
        type: 'system',
        message: `Void error: ${getErrorMessage(error)}`,
        isBlocking: true,
        timestamp: new Date(),
      });
      return { success: false };
    } finally {
      updateState({ isProcessing: false });
    }
  }, [
    state,
    validateVoidParams,
    updateState,
    clearError,
    setError,
    resetState,
    router,
    shouldShowReprintDialog,
    getReprintType,
  ]);

  // Handle damage quantity change
  const handleDamageQuantityChange = useCallback(
    (quantity: number) => {
      if (!state.foundPallet) return;

      // ACO logic: If remark contains ACO Ref, automatically set to full quantity
      const isACOPallet = state.foundPallet.plt_remark?.includes('ACO Ref');
      if (isACOPallet && state.voidReason === 'Damage') {
        updateState({ damageQuantity: state.foundPallet.product_qty });
        return;
      }

      updateState({ damageQuantity: quantity });
    },
    [state.foundPallet, state.voidReason, updateState]
  );

  const handleReprintInfoConfirm = useCallback(
    async (reprintInfo: ReprintInfoInput) => {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
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

        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[Auto Reprint] Browser compatibility check passed');

        // 獲取 operator clock number - 只使用 Supabase Auth
        let operatorClockNum: string | null = null;

        // 使用異步函數獲取 clock number
        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[Auto Reprint] Getting clock number via async method...');
        operatorClockNum = await getCurrentUserClockNumberAsync();

        if (operatorClockNum) {
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Got clock number from async method:', operatorClockNum);
        } else {
          console.error('[Auto Reprint] Failed to get clock number from async method');
        }

        // 檢查是否成功獲取 clock number
        if (!operatorClockNum || operatorClockNum === 'unknown') {
          throw new Error(
            'Unable to get current user clock number. Please ensure you are logged in and try again.'
          );
        }

        // 確保 operatorClockNum 不為 null（已經通過上面的檢查）
        const finalOperatorClockNum: string = operatorClockNum!;
        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log(`[Auto Reprint] Final operator clock number: ${finalOperatorClockNum}`);

        // Prepare auto reprint parameters
        const autoReprintParams = {
          productCode:
            reprintInfo.correctedProductCode || reprintInfo.originalPalletInfo.product_code,
          quantity:
            reprintInfo.correctedQuantity ||
            reprintInfo.remainingQuantity ||
            reprintInfo.originalPalletInfo.product_qty,
          originalPltNum: reprintInfo.originalPalletInfo.plt_num,
          originalLocation: reprintInfo.originalPalletInfo.plt_loc || 'await',
          sourceAction: `void_${reprintInfo.type}`,
          targetLocation: reprintInfo.originalPalletInfo.plt_loc || 'Pipeline',
          reason: state.voidReason,
          operatorClockNum: finalOperatorClockNum,
        };

        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log(`[Auto Reprint] Calling API with params:`, autoReprintParams);

        // Call auto reprint API (same as QC Label approach)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Calling API...');
          const response = await fetch('/api/auto-reprint-label-v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(autoReprintParams),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`[Auto Reprint] API response status: ${response.status}`);
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(
              `[Auto Reprint] API response headers:`,
              Object.fromEntries(response.headers.entries())
            );

          if (!response.ok) {
            let errorMessage = 'Auto reprint failed';
            try {
              const errorText = await response.text();
              errorMessage = `HTTP ${response.status}: ${errorText}`;
              console.error('[Auto Reprint] API error response:', errorText);
            } catch (parseError) {
              console.error('[Auto Reprint] Failed to parse error response:', parseError);
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          // Parse JSON response
          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Auto reprint failed');
          }

          const { newPalletNumber, fileName, qcInputData } = result.data;

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`[Auto Reprint] Success! New pallet: ${newPalletNumber}`);
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`[Auto Reprint] QC input data:`, qcInputData);

          // Generate PDF using exactly the same logic as QC Label
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Generating PDF using QC Label logic...');
          const { prepareQcLabelData, mergeAndPrintPdfs } = await import('@/lib/pdfUtils');
          const { renderReactPDFToBlob } = await import('@/lib/services/unified-pdf-service');
          const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Preparing QC label data...');
          const pdfLabelProps = await prepareQcLabelData(qcInputData);

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Generating PDF blob...');
          // Use JSX syntax now that this is a .tsx file
          const pdfBlob = await renderReactPDFToBlob(<PrintLabelPdf {...pdfLabelProps} />);

          if (!pdfBlob) {
            throw new Error('PDF generation failed to return a blob.');
          }

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`[Auto Reprint] PDF blob generated, size: ${pdfBlob.size} bytes`);

          // Upload PDF to storage and update database
          try {
            (process.env.NODE_ENV as string) !== 'production' &&
              (process.env.NODE_ENV as string) !== 'production' &&
              console.log('[Auto Reprint] Uploading PDF to storage...');

            // Convert blob to ArrayBuffer then to number array for server action
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const numberArray = Array.from(uint8Array);

            // Import server actions
            const { uploadPdfToStorage, updatePalletPdfUrl } = await import(
              '@/app/actions/qcActions'
            );

            // Upload PDF
            const uploadResult = await uploadPdfToStorage(numberArray, fileName, 'qc-labels');

            if (uploadResult.error) {
              console.error('[Auto Reprint] PDF upload failed:', uploadResult.error);
              toast.warning(`PDF generated but upload failed: ${uploadResult.error}`);
            } else if (uploadResult.publicUrl) {
              (process.env.NODE_ENV as string) !== 'production' &&
                (process.env.NODE_ENV as string) !== 'production' &&
                console.log('[Auto Reprint] PDF uploaded successfully:', uploadResult.publicUrl);

              // Update database with PDF URL
              const updateResult = await updatePalletPdfUrl(
                newPalletNumber,
                uploadResult.publicUrl
              );
              if (updateResult.error) {
                console.error(
                  '[Auto Reprint] Failed to update PDF URL in database:',
                  updateResult.error
                );
              } else {
                (process.env.NODE_ENV as string) !== 'production' &&
                  (process.env.NODE_ENV as string) !== 'production' &&
                  console.log('[Auto Reprint] PDF URL updated in database successfully');
              }
            }
          } catch (uploadError: unknown) {
            console.error('[Auto Reprint] Error during PDF upload:', uploadError);
            // Don't fail the whole operation, just log the error
          }

          // Convert blob to ArrayBuffer for printing (exact same as QC Label)
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();

          // Auto-print the PDF (exact same as QC Label)
          await mergeAndPrintPdfs([pdfArrayBuffer], fileName);

          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log('[Auto Reprint] Auto-print triggered successfully');
          toast.success(`New pallet ${newPalletNumber} created and sent to printer successfully`);

          // Reset state
          resetState();
        } catch (fetchError: unknown) {
          clearTimeout(timeoutId);
          if ((fetchError as Error).name === 'AbortError') {
            throw new Error('Request timeout - please try again');
          }
          throw fetchError;
        }
      } catch (error: unknown) {
        console.error('[Auto Reprint] Error in reprint process:', error);
        toast.error(`Auto reprint failed: ${getErrorMessage(error)}`);
        setError({
          type: 'system',
          message: `Auto reprint failed: ${getErrorMessage(error)}`,
          isBlocking: true,
          timestamp: new Date(),
        });
      } finally {
        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[Auto Reprint] Process completed, resetting state...');
        updateState({ isAutoReprinting: false });
      }
    },
    [state.voidReason, updateState, resetState, setError]
  );

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
    handleReprintInfoConfirm,
    handleReprintInfoCancel,

    // Helper function
    validateVoidParams,

    // Calculated properties
    canExecuteVoid:
      !state.isProcessing && !state.error?.isBlocking && validateVoidParams() === null,
    showDamageQuantityInput:
      VOID_REASONS.find(r => r.value === state.voidReason)?.requiresDamageQty || false,
    isACOPallet: state.foundPallet?.plt_remark?.includes('ACO Ref') || false,
  };
}
