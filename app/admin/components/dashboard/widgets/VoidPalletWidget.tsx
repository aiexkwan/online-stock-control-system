/**
 * Void Pallet Widget
 * Full featured version - migrated from original VoidPalletWidget
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Search, QrCode, Loader2, CheckCircle, AlertCircle, Package2, List } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { useBatchVoid } from '@/app/void-pallet/hooks/useBatchVoid';
import { VOID_REASONS } from '@/app/void-pallet/types';
import { BatchPalletItem } from '@/app/void-pallet/types/batch';
import { BatchVoidPanel } from '@/app/void-pallet/components/BatchVoidPanel';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { getProductByCode } from '@/app/actions/productActions';

type VoidStep = 'search' | 'confirm' | 'result';

export const VoidPalletWidget = React.memo(function VoidPalletWidget({ widget, isEditMode }: WidgetComponentProps) {
  const router = useRouter();
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
    selectItem: toggleItemSelection,
    selectAll: selectAllItems,
    clearBatch,
    executeBatchVoid,
  } = useBatchVoid();

  const [currentStep, setCurrentStep] = useState<VoidStep>('search');
  const [searchValue, setSearchValue] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [voidResult, setVoidResult] = useState<{ success: boolean; message: string; remainingQty?: number; requiresReprint?: boolean } | null>(null);
  const [productDescription, setProductDescription] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Batch mode specific state
  const [batchVoidResult, setBatchVoidResult] = useState<{ total: number; successful: number; failed: number; details: any[] } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

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
      getProductByCode(state.foundPallet.product_code).then(result => {
        if (result.success && result.data) {
          setProductDescription(result.data.description);
        }
      }).catch(error => {
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
          toast.success(`Added ${state.foundPallet.plt_num} to batch list`);
          // Clear search
          setSearchValue('');
          updateState({ foundPallet: null });
          focusSearchInput();
        }
      });
    }
  }, [state.foundPallet, currentStep, batchState.mode, searchValue, state.searchType, addToBatch, updateState, focusSearchInput]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a Pallet number');
      return;
    }

    try {
      await searchPallet(searchValue.trim(), 'pallet_num');
      // The searchPallet function updates the state directly
      // We'll check if pallet was found after state update
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An unexpected error occurred during search');
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
      toast.error('An unexpected error occurred during QR scan');
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
          damageQuantity: state.damageQuantity
        });
      } else {
        result = await voidPalletAction({
          palletInfo: state.foundPallet,
          voidReason: state.voidReason,
          password: password
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
          requiresReprint: result.requiresReprint
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
      toast.error('Please select items and enter password');
      return;
    }

    try {
      // Process batch with fixed void reason
      const result = await executeBatchVoid({
        voidReason: 'Print Extra Label',
        password: password
      });

      if (result.success) {
        setBatchVoidResult({
          total: result.summary.total,
          successful: result.summary.successful,
          failed: result.summary.failed,
          details: batchState.items.filter(item => item.status === 'completed' || item.status === 'error').map(item => ({
            plt_num: item.palletInfo.plt_num,
            success: item.status === 'completed',
            error: item.error
          }))
        });
        setCurrentStep('result');
      } else {
        toast.error('Batch void failed');
      }
    } catch (error: any) {
      console.error('Batch void error:', error);
      toast.error(`Batch void failed: ${error.message}`);
    }
  };

  // Clear error
  const handleClearError = () => {
    clearError();
  };

  // Render search step
  const renderSearchStep = () => (
    <div className="space-y-4">
      {/* Mode toggle buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => {
            toggleMode();
            clearBatch();
            resetToSearch();
          }}
          disabled={isEditMode || batchState.isProcessing}
          className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
            batchState.mode === 'single' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Package2 className="w-4 h-4" />
          <span>Single Mode</span>
        </button>
        <button
          onClick={() => {
            toggleMode();
            clearBatch();
            resetToSearch();
          }}
          disabled={isEditMode || batchState.isProcessing}
          className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
            batchState.mode === 'batch' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <List className="w-4 h-4" />
          <span>Batch Mode</span>
        </button>
      </div>

      <div className="flex flex-col space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter Pallet number..."
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none"
              disabled={state.isSearching || isEditMode}
            />
            {state.isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={state.isSearching || !searchValue.trim() || isEditMode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
        
        <button
          onClick={() => setShowQrScanner(true)}
          disabled={isEditMode}
          className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Scan</span>
        </button>
      </div>
      
      {state.error && (
        <div className="bg-red-900/50 border border-red-700/50 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{state.error.message}</p>
            <button
              onClick={handleClearError}
              className="text-red-300 hover:text-red-200 text-xs mt-1 underline"
            >
              Clear error
            </button>
          </div>
        </div>
      )}
      
      {/* Batch mode list */}
      {batchState.mode === 'batch' && batchState.items.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400">
              Batch List ({batchState.items.length} items, {batchState.selectedCount} selected)
            </h4>
            <button
              onClick={() => setCurrentStep('confirm')}
              disabled={batchState.selectedCount === 0 || isEditMode}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Confirm
            </button>
          </div>
          <BatchVoidPanel
            items={batchState.items}
            onSelectItem={toggleItemSelection}
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
    <div className="space-y-4">
      {/* Single mode - show pallet information */}
      {batchState.mode === 'single' && state.foundPallet && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Pallet Information</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Row 1 */}
            <div>
              <p className="text-white font-medium">{state.foundPallet.plt_num}</p>
              <p className="text-gray-400 text-xs">Pallet Number</p>
            </div>
            <div>
              <p className="text-gray-300">{state.foundPallet.product_code}</p>
              <p className="text-gray-400 text-xs">Product Code</p>
            </div>
            {/* Row 2 */}
            <div>
              <p className="text-gray-300">{productDescription || 'N/A'}</p>
              <p className="text-gray-400 text-xs">Product Description</p>
            </div>
            <div>
              <p className="text-gray-300">{state.foundPallet.product_qty} units</p>
              <p className="text-gray-400 text-xs">Quantity on Pallet</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch mode - show selected items */}
      {batchState.mode === 'batch' && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Batch Void Confirmation ({batchState.selectedCount} items selected)
          </h4>
          <div className="max-h-40 overflow-y-auto">
            <BatchVoidPanel
              items={batchState.items.filter(item => item.selected)}
              onSelectItem={toggleItemSelection}
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">
          Void Reason
          {batchState.mode === 'batch' && (
            <span className="text-xs text-blue-400 ml-2">(Batch mode: fixed to Print Extra Label)</span>
          )}
        </label>
        <select
          value={batchState.mode === 'batch' ? 'Print Extra Label' : state.voidReason}
          onChange={(e) => batchState.mode === 'single' && handleVoidReasonChange(e.target.value)}
          disabled={isEditMode || batchState.mode === 'batch'}
          className={`w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none disabled:opacity-50 ${
            batchState.mode === 'batch' ? 'bg-slate-900/50 cursor-not-allowed' : ''
          }`}
        >
          <option value="">Select reason...</option>
          {VOID_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Password input - show only when void reason is selected or in batch mode */}
      {(state.voidReason || batchState.mode === 'batch') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isEditMode}
            placeholder="Enter password to confirm..."
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
          />
        </div>
      )}
      
      {/* Damage quantity input - only show in single mode */}
      {showDamageQuantityInput && batchState.mode === 'single' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Damage Quantity</label>
          <input
            type="number"
            value={state.damageQuantity}
            onChange={(e) => handleDamageQuantityChange(parseInt(e.target.value) || 0)}
            disabled={isEditMode}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
            min="0"
            max={state.foundPallet?.product_qty}
          />
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={resetToSearch}
          disabled={isEditMode}
          className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back to Search
        </button>
        <button
          onClick={batchState.mode === 'batch' ? handleBatchVoid : handleVoidSubmit}
          disabled={
            batchState.mode === 'batch' 
              ? (!password || batchState.selectedCount === 0 || batchState.isProcessing || isEditMode)
              : (!state.voidReason || !password || (showDamageQuantityInput && (!state.damageQuantity || state.damageQuantity <= 0 || state.damageQuantity > state.foundPallet.product_qty)) || state.isProcessing || isEditMode)
          }
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {(state.isProcessing || batchState.isProcessing) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>
              {batchState.mode === 'batch' 
                ? `Confirm Batch Void (${batchState.selectedCount} items)`
                : 'Confirm Void'
              }
            </span>
          )}
        </button>
      </div>
      
      {state.error && (
        <div className="bg-red-900/50 border border-red-700/50 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{state.error.message}</p>
            <button
              onClick={handleClearError}
              className="text-red-300 hover:text-red-200 text-xs mt-1 underline"
            >
              Clear error
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render result step
  const renderResultStep = () => {
    // Batch mode result
    if (batchState.mode === 'batch' && batchVoidResult) {
      return (
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            batchVoidResult.failed === 0 ? 'bg-green-900/50 border border-green-700/50' : 'bg-yellow-900/50 border border-yellow-700/50'
          }`}>
            {batchVoidResult.failed === 0 ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            )}
          </div>
          
          <div className="text-center">
            <h4 className="text-lg font-medium text-white">
              Batch Void Complete
            </h4>
            <p className="text-gray-400 text-sm mt-1">
              Total: {batchVoidResult.total} | Success: {batchVoidResult.successful} | Failed: {batchVoidResult.failed}
            </p>
          </div>

          {/* Show failed items if any */}
          {batchVoidResult.failed > 0 && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <h5 className="text-sm font-medium text-red-400 mb-2">Failed Items</h5>
              {batchVoidResult.details
                .filter(item => !item.success)
                .map((item, index) => (
                  <div key={index} className="text-xs text-red-300">
                    {item.plt_num}: {item.error}
                  </div>
                ))}
            </div>
          )}

          <button
            onClick={() => {
              clearBatch();
              resetToSearch();
            }}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      );
    }

    // Single mode result
    return (
      <div className="space-y-4 text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          voidResult?.success ? 'bg-green-900/50 border border-green-700/50' : 'bg-red-900/50 border border-red-700/50'
        }`}>
          {voidResult?.success ? (
            <CheckCircle className="w-8 h-8 text-green-400" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-400" />
          )}
        </div>
        
        <div>
          <h4 className={`text-lg font-medium ${
            voidResult?.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {voidResult?.success ? 'Success' : 'Failed'}
          </h4>
          <p className="text-gray-400 text-sm mt-1">{voidResult?.message}</p>
        </div>
        
        <div className="flex flex-col space-y-3">
          {voidResult?.requiresReprint && voidResult?.remainingQty && voidResult?.remainingQty > 0 && (
            <button
            onClick={async () => {
              // Use auto-reprint functionality
              if (state.foundPallet) {
                try {
                  toast.loading('Processing reprint...');
                  
                  // Get current user clock number
                  const { getCurrentUserClockNumberAsync } = await import('@/app/hooks/useAuth');
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
                      operatorClockNum: clockNumber
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
                    toast.dismiss();
                    
                    // Generate and print PDF
                    try {
                      const { prepareQcLabelData, mergeAndPrintPdfs } = await import('@/lib/pdfUtils');
                      const { pdf } = await import('@react-pdf/renderer');
                      const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');
                      
                      // Prepare PDF data
                      const pdfLabelProps = await prepareQcLabelData(result.data.qcInputData);
                      
                      // Generate PDF blob
                      const pdfBlob = await pdf(<PrintLabelPdf {...pdfLabelProps} />).toBlob();
                      
                      if (!pdfBlob) {
                        throw new Error('PDF generation failed');
                      }
                      
                      // Convert blob to ArrayBuffer for printing
                      const pdfArrayBuffer = await pdfBlob.arrayBuffer();
                      
                      // Auto-print the PDF
                      await mergeAndPrintPdfs([pdfArrayBuffer], result.data.fileName);
                      
                      toast.success(`New pallet ${result.data.newPalletNumber} created and sent to printer`);
                    } catch (printError: any) {
                      console.error('Print error:', printError);
                      toast.warning(`New pallet ${result.data.newPalletNumber} created but printing failed. Please print manually.`);
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
                  toast.dismiss();
                  toast.error(`Reprint failed: ${error.message}`);
                }
              }
            }}
            disabled={isEditMode}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reprint Label ({voidResult.remainingQty} units)
          </button>
        )}
        <button
          onClick={resetToSearch}
          disabled={isEditMode}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="VOID_PALLET" isEditMode={isEditMode}>
        <CardHeader className="pb-3">
          <CardTitle className="widget-title">Void Pallet</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'search' ? 'text-blue-400' : 
              currentStep === 'confirm' || currentStep === 'result' ? 'text-green-400' : 'text-gray-500'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                currentStep === 'search' ? 'bg-blue-600 border-blue-500' :
                currentStep === 'confirm' || currentStep === 'result' ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
              }`}>
                1
              </div>
              <span className="text-sm">Search</span>
            </div>
            
            <div className={`w-8 h-px ${
              currentStep === 'confirm' || currentStep === 'result' ? 'bg-green-500' : 'bg-gray-600'
            }`} />
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'confirm' ? 'text-blue-400' : 
              currentStep === 'result' ? 'text-green-400' : 'text-gray-500'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                currentStep === 'confirm' ? 'bg-blue-600 border-blue-500' :
                currentStep === 'result' ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
              }`}>
                2
              </div>
              <span className="text-sm">Confirm</span>
            </div>
            
            <div className={`w-8 h-px ${
              currentStep === 'result' ? 'bg-green-500' : 'bg-gray-600'
            }`} />
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'result' ? 'text-blue-400' : 'text-gray-500'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                currentStep === 'result' ? 'bg-blue-600 border-blue-500' : 'bg-gray-600 border-gray-500'
              }`}>
                3
              </div>
              <span className="text-sm">Result</span>
            </div>
          </div>
          
          {/* Step content */}
          <div className="flex-1">
            {currentStep === 'search' && renderSearchStep()}
            {currentStep === 'confirm' && renderConfirmStep()}
            {currentStep === 'result' && renderResultStep()}
          </div>
        </CardContent>
      </WidgetCard>
      
      {/* QR Scanner */}
      {showQrScanner && (
        <SimpleQRScanner
          isOpen={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrScan}
          title="Scan Pallet QR Code"
        />
      )}
    </motion.div>
  );
});

export default VoidPalletWidget;
