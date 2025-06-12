'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useVoidPallet } from '../../void-pallet/hooks/useVoidPallet';
import { ReprintInfoDialog } from '../../void-pallet/components/ReprintInfoDialog';
import { VOID_REASONS } from '../../void-pallet/types';
import { X, Search, QrCode, Loader2 } from 'lucide-react';
import { SimpleQRScanner } from '../../../components/qr-scanner/simple-qr-scanner';

interface VoidPalletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReprintNeeded?: (reprintInfo: any) => void;
}

export default function VoidPalletDialog({ isOpen, onClose, onReprintNeeded }: VoidPalletDialogProps) {
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
    isACOPallet,
    handleReprintInfoConfirm,
    handleReprintInfoCancel,
    getReprintType,
  } = useVoidPallet();

  const [searchValue, setSearchValue] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 添加搜尋輸入框的 ref
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 自動聚焦到搜尋欄位
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // 對話框打開時自動聚焦
  useEffect(() => {
    if (isOpen) {
      focusSearchInput();
    }
  }, [isOpen, focusSearchInput]);

  // 處理錯誤狀態消息
  useEffect(() => {
    if (state.error) {
      // 不再為 "already voided" 錯誤顯示狀態消息，因為已經用 toast 處理
      const errorMessage = state.error.message.toLowerCase();
      if (errorMessage.includes('already voided') || 
          errorMessage.includes('voided') ||
          errorMessage.includes('已作廢')) {
        return; // 不顯示狀態消息
      }
      
      setStatusMessage({
        type: 'error',
        message: state.error.message
      });
    } else {
      setStatusMessage(null);
    }
  }, [state.error]);

  // 監聽 searchInput 的變化，同步更新 searchValue
  useEffect(() => {
    setSearchValue(state.searchInput);
  }, [state.searchInput]);

  // 自動搜索函數
  const performAutoSearch = useCallback(async (searchValue: string) => {
    if (!searchValue.trim()) return;
    
    // Auto-detect search type based on format
    let searchType: 'pallet_num' = 'pallet_num';
    
    if (searchValue.includes('/')) {
      searchType = 'pallet_num';
    } else if (searchValue.includes('-')) {
      searchType = 'pallet_num';
    } else {
      setStatusMessage({
        type: 'error',
        message: 'Please enter complete pallet number (e.g., 250525/13) or series number (e.g., 260525-5UNXGE)'
      });
      return;
    }
    
    // Update search type and perform search
    updateState({ searchType });
    await searchPallet(searchValue, searchType);
  }, [searchPallet, updateState]);

  // 處理輸入框變化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    updateState({ searchInput: newValue });
  }, [updateState]);

  // 處理失焦事件 - 自動搜索
  const handleInputBlur = useCallback(async () => {
    if (searchValue.trim()) {
      await performAutoSearch(searchValue.trim());
    }
  }, [searchValue, performAutoSearch]);

  // 處理 Enter 鍵
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchValue.trim()) {
        await performAutoSearch(searchValue.trim());
      }
    }
  }, [searchValue, performAutoSearch]);

  // 處理 QR 掃描
  const handleQrScan = useCallback(async (scannedValue: string) => {
    setShowQrScanner(false);
    setSearchValue(scannedValue);
    updateState({ searchInput: scannedValue });
    
    // 自動搜索掃描結果
    await performAutoSearch(scannedValue);
  }, [updateState, performAutoSearch]);

  // 清除搜索
  const handleClear = useCallback(() => {
    setSearchValue('');
    updateState({ 
      searchInput: '',
      foundPallet: null,
      error: null
    });
    setStatusMessage(null);
    focusSearchInput();
  }, [updateState, focusSearchInput]);

  // Handle void operation completion
  const handleVoidComplete = useCallback(() => {
    setStatusMessage({
      type: 'success',
      message: `Pallet ${state.foundPallet?.plt_num} successfully voided`
    });
    
    // Reset for next operation
    updateState({ 
      foundPallet: null,
      searchInput: '',
      voidReason: '',
      password: '',
      damageQuantity: 0
    });
    setSearchValue('');
    
    // Auto focus for next operation
    focusSearchInput();
  }, [state.foundPallet, updateState, focusSearchInput]);

  // Handle reset operation
  const handleReset = useCallback(() => {
    updateState({ 
      foundPallet: null,
      searchInput: '',
      voidReason: '',
      password: '',
      damageQuantity: 0,
      error: null
    });
    setSearchValue('');
    setStatusMessage(null);
    focusSearchInput();
  }, [updateState, focusSearchInput]);

  // Enhanced void execution with completion handling
  const handleExecuteVoid = useCallback(async () => {
    try {
      const result = await executeVoid();
      
      // 檢查是否需要重印
      if (result && result.success && result.needsReprint && result.reprintInfo) {
        // 先顯示成功消息
        handleVoidComplete();
        
        // 延遲一點時間後關閉 VoidPalletDialog 並觸發重印回調
        setTimeout(() => {
          onClose(); // 關閉 VoidPalletDialog
          
          // 再延遲一點時間觸發重印回調
          setTimeout(() => {
            if (onReprintNeeded && state.foundPallet) {
              onReprintNeeded({
                type: getReprintType(state.voidReason),
                palletInfo: state.foundPallet,
                reprintInfo: result.reprintInfo,
                voidReason: state.voidReason
              });
            }
          }, 200);
        }, 1000);
      } else if (result && result.success) {
        // 普通成功，直接完成
        handleVoidComplete();
      }
    } catch (error) {
      console.error('Void operation failed:', error);
    }
  }, [executeVoid, handleVoidComplete, onClose, onReprintNeeded, state.foundPallet, state.voidReason, getReprintType]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={handleClose} />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* 背景裝飾元素 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-700/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent flex items-center">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg mr-3 shadow-lg shadow-red-500/25">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              Void Pallet
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 space-y-6">
            {/* Status Messages */}
            {statusMessage && (
              <div className={`p-4 rounded-xl border ${
                statusMessage.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : statusMessage.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{statusMessage.message}</span>
                  <button
                    onClick={() => setStatusMessage(null)}
                    className="text-current hover:opacity-70 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Search Area */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-2xl blur-xl"></div>
              
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-red-100 to-orange-100 bg-clip-text text-transparent mb-4">
                    Pallet Search
                  </h3>
                  
                  {/* 自定義搜索輸入框 */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {state.isSearching ? (
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      placeholder={isMobile ? "Tap to scan or enter pallet number/series" : "Enter pallet number or series"}
                      className="w-full pl-10 pr-20 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                      disabled={state.isSearching || state.isProcessing}
                      onClick={() => {
                        if (isMobile && !state.isSearching && !state.isProcessing) {
                          setShowQrScanner(true);
                        }
                      }}
                    />
                    
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                      {searchValue && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="h-6 w-6 p-0 hover:bg-slate-600/50 rounded text-gray-400 hover:text-white transition-colors"
                          disabled={state.isSearching || state.isProcessing}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setShowQrScanner(true)}
                        className="h-6 w-6 p-0 hover:bg-slate-600/50 rounded text-blue-400 hover:text-blue-300 transition-colors"
                        disabled={state.isSearching || state.isProcessing}
                      >
                        <QrCode className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-2">
                    Press 'Enter' after entering to search
                  </p>
                </div>
              </div>
            </div>

            {/* Pallet Information and Void Form */}
            {state.foundPallet && !state.error?.isBlocking && (
              <div className="space-y-6">
                {/* Pallet Information Display */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-2xl blur-xl"></div>
                  
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6 shadow-xl">
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-red-300 via-orange-300 to-red-200 bg-clip-text text-transparent mb-4">
                        Pallet Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Pallet Number</span>
                            <span className="text-base font-semibold text-white">{state.foundPallet.plt_num}</span>
                          </div>
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Product Code</span>
                            <span className="text-base font-semibold text-white">{state.foundPallet.product_code}</span>
                          </div>
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Quantity</span>
                            <span className="text-base font-semibold text-white">{state.foundPallet.product_qty}</span>
                          </div>
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Current Location</span>
                            <span className="text-base font-semibold text-white">{state.foundPallet.plt_loc || 'Unknown'}</span>
                          </div>
                        </div>

                        {state.foundPallet.plt_remark && (
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Remarks</span>
                            <span className="text-white">{state.foundPallet.plt_remark}</span>
                          </div>
                        )}

                        {/* ACO Pallet Indicator */}
                        {isACOPallet && (
                          <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <div>
                                <span className="block text-sm font-medium text-blue-400 mb-1">Special Pallet Type</span>
                                <span className="text-base font-semibold text-blue-300">ACO Order Pallet</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Void Operation Form */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-2xl blur-xl"></div>
                  
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-red-100 to-orange-100 bg-clip-text text-transparent mb-4">
                        Void Operation
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Void Reason Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Void Reason <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={state.voidReason}
                            onChange={(e) => handleVoidReasonChange(e.target.value)}
                            disabled={state.isProcessing}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                          >
                            <option value="">Select void reason...</option>
                            {VOID_REASONS.map((reason) => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Damage Quantity Input (if applicable) */}
                        {showDamageQuantityInput && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Damage Quantity <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={state.foundPallet.product_qty}
                              value={state.damageQuantity || ''}
                              onChange={(e) => handleDamageQuantityChange(parseInt(e.target.value) || 0)}
                              disabled={state.isProcessing}
                              placeholder={`Enter damage quantity (max: ${state.foundPallet.product_qty})`}
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                            />
                          </div>
                        )}

                        {/* Password Input */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="password"
                            value={state.password}
                            onChange={(e) => updateState({ password: e.target.value })}
                            disabled={state.isProcessing}
                            placeholder="Enter your password to confirm"
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handleExecuteVoid}
                            disabled={!canExecuteVoid || state.isProcessing}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/25"
                          >
                            {state.isProcessing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processing...</span>
                              </div>
                            ) : (
                              'Execute Void'
                            )}
                          </button>
                          
                          <button
                            onClick={handleReset}
                            disabled={state.isProcessing}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 rounded-lg text-slate-300 hover:text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {(state.isSearching || state.isProcessing) && !state.error && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-400">
                    {state.isSearching ? 'Searching pallet...' : 'Processing void operation...'}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!state.foundPallet && !state.isSearching && !state.error && (
              <div className="text-center py-8">
                <div className="text-slate-500">
                  <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h4 className="text-lg font-medium mb-2 text-slate-400">Start searching for pallet</h4>
                  <p className="text-slate-500">
                    Please enter pallet number or series
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner */}
      {showQrScanner && (
        <SimpleQRScanner
          open={showQrScanner}
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
          title="Scan QR Code"
        />
      )}
    </>
  );
} 