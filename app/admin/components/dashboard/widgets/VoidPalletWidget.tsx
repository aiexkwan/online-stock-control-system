/**
 * Void Pallet Widget
 * Full featured version - migrated from original VoidPalletWidget
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Search, QrCode, Loader2, CheckCircle, Package2, List, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWidgetToast } from '@/app/admin/hooks/useWidgetToast';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { useBatchVoid } from '@/app/void-pallet/hooks/useBatchVoid';
import { VOID_REASONS } from '@/app/void-pallet/types';
import { BatchPalletItem } from '@/app/void-pallet/types/batch';
import { BatchVoidPanel } from '@/app/void-pallet/components/BatchVoidPanel';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { getProductByCode } from '@/app/actions/productActions';
import { WidgetError } from './common/WidgetStates';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

type VoidStep = 'search' | 'confirm' | 'result';

export const VoidPalletWidget = React.memo(function VoidPalletWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const router = useRouter();
  const { showSuccess, showError, showLoading, showWarning } = useWidgetToast();
  const {
    state,
    updateState,
    searchPallet,
    executeVoid,
    handleDamageQuantityChange,
    handleVoidReasonChange,
    clearError,
    canExecuteVoid,
    showDamageQuantityInput,
  } = useVoidPallet();

  // Batch mode integration
  const {
    batchState,
    toggleMode,
    addToBatch,
    removeFromBatch,
    selectAll: selectAllItems,
    clearBatch,
    executeBatchVoid,
  } = useBatchVoid();

  const [currentStep, setCurrentStep] = useState<VoidStep>('search');
  const [searchValue, setSearchValue] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [voidResult, setVoidResult] = useState<{
    success: boolean;
    message: string;
    remainingQty?: number;
    requiresReprint?: boolean;
  } | null>(null);
  const [productDescription, setProductDescription] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Batch mode specific state
  const [batchVoidResult, setBatchVoidResult] = useState<{
    total: number;
    successful: number;
    failed: number;
    details: any[];
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile =
    typeof window !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Auto focus search input
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Watch for found pallet and move to confirm step (single mode only)
  React.useEffect(() => {
    if (state.foundPallet && currentStep === 'search' && batchState.mode === 'single') {
      setCurrentStep('confirm');
      // Fetch product description
      getProductByCode(state.foundPallet.product_code)
        .then(result => {
          if (result.success && result.data) {
            setProductDescription(result.data.description);
          }
        })
        .catch(error => {
          console.error('Failed to fetch product description:', error);
        });
    }
  }, [state.foundPallet, currentStep, batchState.mode]);

  // Handle batch mode - add found pallet to batch list
  React.useEffect(() => {
    if (state.foundPallet && currentStep === 'search' && batchState.mode === 'batch') {
      // Add to batch list
      addToBatch(searchValue, state.searchType || 'pallet_num').then(success => {
        if (success) {
          showSuccess(`Added ${state.foundPallet?.plt_num} to batch list`);
          // Clear search
          setSearchValue('');
          updateState({ foundPallet: null });
          focusSearchInput();
        }
      });
    }
  }, [
    state.foundPallet,
    currentStep,
    batchState.mode,
    searchValue,
    state.searchType,
    addToBatch,
    updateState,
    focusSearchInput,
    showSuccess,
  ]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      showError('Please enter a Pallet number');
      return;
    }

    try {
      await searchPallet(searchValue.trim(), 'pallet_num');
      // The searchPallet function updates the state directly
      // We'll check if pallet was found after state update
    } catch (error) {
      console.error('Search error:', error);
      showError('An unexpected error occurred during search');
    }
  };

  // Handle QR scan result
  const handleQrScan = async (qrValue: string) => {
    setShowQrScanner(false);
    setSearchValue(qrValue);

    try {
      await searchPallet(qrValue, 'qr');
      // The searchPallet function updates the state directly
      // We'll check if pallet was found after state update
    } catch (error) {
      console.error('QR scan error:', error);
      showError('An unexpected error occurred during QR scan');
    }
  };

  // Handle void submission
  const handleVoidSubmit = async () => {
    if (!state.foundPallet || !state.voidReason || !password) {
      return;
    }

    try {
      // Call the void action directly with parameters
      const { voidPalletAction, processDamageAction } = await import('@/app/void-pallet/actions');

      let result;
      if (state.voidReason === 'Damage' && state.damageQuantity > 0) {
        result = await processDamageAction({
          palletInfo: state.foundPallet,
          voidReason: state.voidReason,
          password: password,
          damageQuantity: state.damageQuantity,
        });
      } else {
        result = await voidPalletAction({
          palletInfo: state.foundPallet,
          voidReason: state.voidReason,
          password: password,
        });
      }

      if (!result) {
        setVoidResult({ success: false, message: 'Void operation failed - no response' });
        setCurrentStep('result');
        return;
      }

      if (result.success) {
        setVoidResult({
          success: true,
          message: result.message || 'Pallet void successfully',
          remainingQty: result.remainingQty,
          requiresReprint: result.requiresReprint,
        });
        setCurrentStep('result');
      } else {
        setVoidResult({ success: false, message: result.error || 'Void failed' });
        setCurrentStep('result');
      }
    } catch (error) {
      console.error('Void error:', error);
      setVoidResult({ success: false, message: 'System error occurred' });
      setCurrentStep('result');
    }
  };

  // Reset to search step
  const resetToSearch = () => {
    setCurrentStep('search');
    setSearchValue('');
    setVoidResult(null);
    setBatchVoidResult(null);
    setProductDescription('');
    setPassword('');
    updateState({ foundPallet: null, voidReason: '', damageQuantity: 0 });
    clearError();
    focusSearchInput();
  };

  // Handle batch void submission
  const handleBatchVoid = async () => {
    if (!password || batchState.selectedCount === 0) {
      showError('Please select items and enter password');
      return;
    }

    try {
      // Process batch with fixed void reason
      const result = await executeBatchVoid({
        voidReason: 'Print Extra Label',
        password: password,
      });

      if (result.success) {
        setBatchVoidResult({
          total: result.summary?.total || 0,
          successful: result.summary?.successful || 0,
          failed: result.summary?.failed || 0,
          details: batchState.items
            .filter(item => item.status === 'completed' || item.status === 'error')
            .map(item => ({
              plt_num: item.palletInfo.plt_num,
              success: item.status === 'completed',
              error: item.error,
            })),
        });
        setCurrentStep('result');
      } else {
        showError('Batch void failed');
      }
    } catch (error: any) {
      console.error('Batch void error:', error);
      showError('Batch void failed', error);
    }
  };

  // Clear error
  const handleClearError = () => {
    clearError();
  };

  // Render search step
  const renderSearchStep = () => (
    <div className='space-y-4'>
      {/* Mode toggle buttons */}
      <div className='mb-4 flex space-x-2'>
        <button
          onClick={() => {
            toggleMode();
            clearBatch();
            resetToSearch();
          }}
          disabled={isEditMode || batchState.isProcessing}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            batchState.mode === 'single'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Package2 className='h-4 w-4' />
          <span>Single Mode</span>
        </button>
        <button
          onClick={() => {
            toggleMode();
            clearBatch();
            resetToSearch();
          }}
          disabled={isEditMode || batchState.isProcessing}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            batchState.mode === 'batch'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <List className='h-4 w-4' />
          <span>Batch Mode</span>
        </button>
      </div>

      <div className={cn('flex flex-col', spacingUtilities.list.container)}>
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <input
              ref={searchInputRef}
              type='text'
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder='Enter Pallet number...'
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2',
                'border-input placeholder:text-muted-foreground',
                'focus:border-primary/50 focus:outline-none',
                textClasses['body-base']
              )}
              disabled={state.isSearching || isEditMode}
            />
            {state.isSearching && (
              <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
                <Loader2 className='h-4 w-4 animate-spin text-primary' />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={state.isSearching || !searchValue.trim() || isEditMode}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50',
              textClasses['label-base']
            )}
          >
            <Search className='h-4 w-4' />
            <span>Search</span>
          </button>
        </div>

        <button
          onClick={() => setShowQrScanner(true)}
          disabled={isEditMode}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            'disabled:cursor-not-allowed disabled:opacity-50',
            textClasses['label-base']
          )}
        >
          <QrCode className='h-4 w-4' />
          <span>QR Scan</span>
        </button>
      </div>

      {state.error && (
        <WidgetError
          message={state.error.message}
          severity='error'
          display='inline'
          actions={[
            {
              label: 'Clear error',
              onClick: handleClearError,
              variant: 'ghost',
            },
          ]}
        />
      )}

      {/* Batch mode list */}
      {batchState.mode === 'batch' && batchState.items.length > 0 && (
        <div className='mt-4'>
          <div className='mb-2 flex items-center justify-between'>
            <h4 className={cn(textClasses['label-large'], 'text-muted-foreground')}>
              Batch List ({batchState.items.length} items, {batchState.selectedCount} selected)
            </h4>
            <button
              onClick={() => setCurrentStep('confirm')}
              disabled={batchState.selectedCount === 0 || isEditMode}
              className={cn(
                'rounded-lg px-4 py-2',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:cursor-not-allowed disabled:opacity-50',
                textClasses['label-base']
              )}
            >
              Proceed to Confirm
            </button>
          </div>
          <BatchVoidPanel
            items={batchState.items}
            onSelectItem={(id, selected) => {
              // Toggle selection by updating item
              const item = batchState.items.find(i => i.id === id);
              if (item) {
                item.selected = selected;
              }
            }}
            onSelectAll={selectAllItems}
            onRemoveItem={removeFromBatch}
            onClearAll={clearBatch}
            isProcessing={batchState.isProcessing}
            selectedCount={batchState.selectedCount}
          />
        </div>
      )}
    </div>
  );

  // Render confirm step
  const renderConfirmStep = () => (
    <div className='space-y-4'>
      {/* Single mode - show pallet information */}
      {batchState.mode === 'single' && state.foundPallet && (
        <div className='rounded-lg border border-border bg-card p-4'>
          <h4 className={cn('mb-3', textClasses['label-large'], 'text-muted-foreground')}>Pallet Information</h4>
          <div className='grid grid-cols-2 gap-4'>
            {/* Row 1 */}
            <div>
              <p className={cn(textClasses['body-base'], 'font-medium')}>{state.foundPallet.plt_num}</p>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Pallet Number</p>
            </div>
            <div>
              <p className={textClasses['body-base']}>{state.foundPallet.product_code}</p>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Product Code</p>
            </div>
            {/* Row 2 */}
            <div>
              <p className={textClasses['body-base']}>{productDescription || 'N/A'}</p>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Product Description</p>
            </div>
            <div>
              <p className={textClasses['body-base']}>{state.foundPallet.product_qty} units</p>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Quantity on Pallet</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch mode - show selected items */}
      {batchState.mode === 'batch' && (
        <div className='rounded-lg border border-slate-700/30 bg-slate-800/30 p-4'>
          <h4 className='mb-3 text-sm font-medium text-gray-400'>
            Batch Void Confirmation ({batchState.selectedCount} items selected)
          </h4>
          <div className='max-h-40 overflow-y-auto'>
            <BatchVoidPanel
              items={batchState.items.filter(item => item.selected)}
              onSelectItem={(id, selected) => {
              // Toggle selection by updating item
              const item = batchState.items.find(i => i.id === id);
              if (item) {
                item.selected = selected;
              }
            }}
              onSelectAll={selectAllItems}
              onRemoveItem={removeFromBatch}
              onClearAll={clearBatch}
              isProcessing={batchState.isProcessing}
              selectedCount={batchState.selectedCount}
            />
          </div>
        </div>
      )}

      {/* Void reason selection */}
      <div className='space-y-2'>
        <label className='text-sm font-medium text-gray-400'>
          Void Reason
          {batchState.mode === 'batch' && (
            <span className='ml-2 text-xs text-blue-400'>
              (Batch mode: fixed to Print Extra Label)
            </span>
          )}
        </label>
        <select
          value={batchState.mode === 'batch' ? 'Print Extra Label' : state.voidReason}
          onChange={e => batchState.mode === 'single' && handleVoidReasonChange(e.target.value)}
          disabled={isEditMode || batchState.mode === 'batch'}
          className={`w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none disabled:opacity-50 ${
            batchState.mode === 'batch' ? 'cursor-not-allowed bg-slate-900/50' : ''
          }`}
        >
          <option value=''>Select reason...</option>
          {VOID_REASONS.map(reason => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      {/* Password input - show only when void reason is selected or in batch mode */}
      {(state.voidReason || batchState.mode === 'batch') && (
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Password</label>
          <input
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isEditMode}
            placeholder='Enter password to confirm...'
            className='w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none disabled:opacity-50'
          />
        </div>
      )}

      {/* Damage quantity input - only show in single mode */}
      {showDamageQuantityInput && batchState.mode === 'single' && (
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Damage Quantity</label>
          <input
            type='number'
            value={state.damageQuantity}
            onChange={e => handleDamageQuantityChange(parseInt(e.target.value) || 0)}
            disabled={isEditMode}
            className='w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none disabled:opacity-50'
            min='0'
            max={state.foundPallet?.product_qty}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className='flex space-x-3'>
        <button
          onClick={resetToSearch}
          disabled={isEditMode}
          className='flex-1 rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          Back to Search
        </button>
        <button
          onClick={batchState.mode === 'batch' ? handleBatchVoid : handleVoidSubmit}
          disabled={
            batchState.mode === 'batch'
              ? !password || batchState.selectedCount === 0 || batchState.isProcessing || isEditMode
              : !state.voidReason ||
                !password ||
                (showDamageQuantityInput &&
                  (!state.damageQuantity ||
                    state.damageQuantity <= 0 ||
                    state.damageQuantity > (state.foundPallet?.product_qty || 0))) ||
                state.isProcessing ||
                isEditMode
          }
          className='flex flex-1 items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {state.isProcessing || batchState.isProcessing ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Processing...</span>
            </>
          ) : (
            <span>
              {batchState.mode === 'batch'
                ? `Confirm Batch Void (${batchState.selectedCount} items)`
                : 'Confirm Void'}
            </span>
          )}
        </button>
      </div>

      {state.error && (
        <WidgetError
          message={state.error.message}
          severity='error'
          display='inline'
          actions={[
            {
              label: 'Clear error',
              onClick: handleClearError,
              variant: 'ghost',
            },
          ]}
        />
      )}
    </div>
  );

  // Render result step
  const renderResultStep = () => {
    // Batch mode result
    if (batchState.mode === 'batch' && batchVoidResult) {
      return (
        <div className='space-y-4'>
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              batchVoidResult.failed === 0
                ? 'border border-green-700/50 bg-green-900/50'
                : 'border border-yellow-700/50 bg-yellow-900/50'
            }`}
          >
            {batchVoidResult.failed === 0 ? (
              <CheckCircle className='h-8 w-8 text-green-400' />
            ) : (
              <AlertCircle className='h-8 w-8 text-yellow-400' />
            )}
          </div>

          <div className='text-center'>
            <h4 className='text-lg font-medium text-white'>Batch Void Complete</h4>
            <p className='mt-1 text-sm text-gray-400'>
              Total: {batchVoidResult.total} | Success: {batchVoidResult.successful} | Failed:{' '}
              {batchVoidResult.failed}
            </p>
          </div>

          {/* Show failed items if any */}
          {batchVoidResult.failed > 0 && (
            <WidgetError
              message='Failed Items'
              severity='error'
              display='inline'
              error={new Error(
                batchVoidResult.details
                  .filter(item => !item.success)
                  .map(item => `${item.plt_num}: ${item.error}`)
                  .join('\n')
              )}
            />
          )}

          <button
            onClick={() => {
              clearBatch();
              resetToSearch();
            }}
            className='w-full rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
          >
            Continue
          </button>
        </div>
      );
    }

    // Single mode result
    return (
      <div className='space-y-4 text-center'>
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            voidResult?.success
              ? 'border border-green-700/50 bg-green-900/50'
              : 'border border-red-700/50 bg-red-900/50'
          }`}
        >
          {voidResult?.success ? (
            <CheckCircle className='h-8 w-8 text-green-400' />
          ) : (
            <X className='h-8 w-8 text-red-400' />
          )}
        </div>

        <div>
          <h4
            className={`text-lg font-medium ${
              voidResult?.success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {voidResult?.success ? 'Success' : 'Failed'}
          </h4>
          <p className='mt-1 text-sm text-gray-400'>{voidResult?.message}</p>
        </div>

        <div className='flex flex-col space-y-3'>
          {voidResult?.requiresReprint &&
            voidResult?.remainingQty &&
            voidResult?.remainingQty > 0 && (
              <button
                onClick={async () => {
                  // Use auto-reprint functionality
                  if (state.foundPallet) {
                    try {
                      const dismiss = showLoading('Processing reprint...');

                      // Get current user clock number
                      const { getCurrentUserClockNumberAsync } = await import(
                        '@/app/hooks/useAuth'
                      );
                      const clockNumber = await getCurrentUserClockNumberAsync();

                      if (!clockNumber || clockNumber === 'unknown') {
                        throw new Error('Unable to get user information. Please login again.');
                      }

                      // Call auto-reprint API
                      const response = await fetch('/api/auto-reprint-label-v2', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          productCode: state.foundPallet.product_code,
                          quantity: voidResult.remainingQty,
                          originalPltNum: state.foundPallet.plt_num,
                          originalLocation: state.foundPallet.plt_loc || 'Pipeline',
                          sourceAction: 'void_damage',
                          targetLocation: state.foundPallet.plt_loc || 'Pipeline',
                          reason: state.voidReason,
                          operatorClockNum: clockNumber,
                        }),
                      });

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Reprint API error:', errorText);

                        // Check for duplicate pallet number error
                        if (errorText.includes('already exists')) {
                          throw new Error('Duplicate pallet number detected. Please try again.');
                        }
                        throw new Error('Reprint failed. Please try again.');
                      }

                      const result = await response.json();
                      if (result.success) {
                        dismiss();

                        // Generate and print PDF
                        try {
                          const { prepareQcLabelData, mergeAndPrintPdfs } = await import(
                            '@/lib/pdfUtils'
                          );
                          const { renderReactPDFToBlob } = await import('@/lib/services/unified-pdf-service');
                          const { PrintLabelPdf } = await import(
                            '@/components/print-label-pdf/PrintLabelPdf'
                          );

                          // Prepare PDF data
                          const pdfLabelProps = await prepareQcLabelData(result.data.qcInputData);

                          // Generate PDF blob
                          const pdfBlob = await renderReactPDFToBlob(<PrintLabelPdf {...pdfLabelProps} />);

                          if (!pdfBlob) {
                            throw new Error('PDF generation failed');
                          }

                          // Convert blob to ArrayBuffer for printing
                          const pdfArrayBuffer = await pdfBlob.arrayBuffer();

                          // Auto-print the PDF
                          await mergeAndPrintPdfs([pdfArrayBuffer], result.data.fileName);

                          showSuccess(
                            `New pallet ${result.data.newPalletNumber} created and sent to printer`
                          );
                        } catch (printError: any) {
                          console.error('Print error:', printError);
                          showWarning(
                            `New pallet ${result.data.newPalletNumber} created but printing failed. Please print manually.`
                          );
                        }

                        resetToSearch();
                      } else {
                        // Check for specific error types
                        if (result.error && result.error.includes('already exists')) {
                          throw new Error('Duplicate pallet number detected. Please try again.');
                        }
                        throw new Error(result.error || 'Reprint failed');
                      }
                    } catch (error: any) {
                      dismiss();
                      showError(`Reprint failed: ${error.message}`);
                    }
                  }
                }}
                disabled={isEditMode}
                className='rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Reprint Label ({voidResult.remainingQty} units)
              </button>
            )}
          <button
            onClick={resetToSearch}
            disabled={isEditMode}
            className='rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='VOID_PALLET' isEditMode={isEditMode}>
        <CardHeader className='pb-3'>
          <CardTitle className='widget-title'>Void Pallet</CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          {/* Step indicator */}
          <div className='mb-6 flex items-center justify-center space-x-4'>
            <div
              className={`flex items-center space-x-2 ${
                currentStep === 'search'
                  ? 'text-blue-400'
                  : currentStep === 'confirm' || currentStep === 'result'
                    ? 'text-green-400'
                    : 'text-gray-500'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${
                  currentStep === 'search'
                    ? 'border-blue-500 bg-blue-600'
                    : currentStep === 'confirm' || currentStep === 'result'
                      ? 'border-green-500 bg-green-600'
                      : 'border-gray-500 bg-gray-600'
                }`}
              >
                1
              </div>
              <span className='text-sm'>Search</span>
            </div>

            <div
              className={`h-px w-8 ${
                currentStep === 'confirm' || currentStep === 'result'
                  ? 'bg-green-500'
                  : 'bg-gray-600'
              }`}
            />

            <div
              className={`flex items-center space-x-2 ${
                currentStep === 'confirm'
                  ? 'text-blue-400'
                  : currentStep === 'result'
                    ? 'text-green-400'
                    : 'text-gray-500'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${
                  currentStep === 'confirm'
                    ? 'border-blue-500 bg-blue-600'
                    : currentStep === 'result'
                      ? 'border-green-500 bg-green-600'
                      : 'border-gray-500 bg-gray-600'
                }`}
              >
                2
              </div>
              <span className='text-sm'>Confirm</span>
            </div>

            <div
              className={`h-px w-8 ${currentStep === 'result' ? 'bg-green-500' : 'bg-gray-600'}`}
            />

            <div
              className={`flex items-center space-x-2 ${
                currentStep === 'result' ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${
                  currentStep === 'result'
                    ? 'border-blue-500 bg-blue-600'
                    : 'border-gray-500 bg-gray-600'
                }`}
              >
                3
              </div>
              <span className='text-sm'>Result</span>
            </div>
          </div>

          {/* Step content */}
          <div className='flex-1'>
            {currentStep === 'search' && renderSearchStep()}
            {currentStep === 'confirm' && renderConfirmStep()}
            {currentStep === 'result' && renderResultStep()}
          </div>
        </CardContent>
      </WidgetCard>

      {/* QR Scanner */}
      {showQrScanner && (
        <SimpleQRScanner
          open={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrScan}
          title='Scan Pallet QR Code'
        />
      )}
    </motion.div>
  );
});

export default VoidPalletWidget;
