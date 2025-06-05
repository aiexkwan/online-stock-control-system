'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { UnifiedSearch } from '../../components/ui/unified-search';
import { useVoidPallet } from './hooks/useVoidPallet';
import { ReprintInfoDialog } from './components/ReprintInfoDialog';
import FloatingInstructions from '../../components/ui/floating-instructions';
import { VOID_REASONS } from './types';

export default function VoidPalletPage() {
  const {
    state,
    updateState,
    searchPallet,
    handleQRScan,
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
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 添加搜尋輸入框的 ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 自動聚焦到搜尋欄位
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // 頁面載入時自動聚焦
  useEffect(() => {
    focusSearchInput();
  }, [focusSearchInput]);

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

  // Handle search selection with auto-detection
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      const searchValue = result.data.value;
      
      // Get the detected search type from the result data
      const detectedSearchType = result.data.searchType;
      
      // Map the detected type to void-pallet's search type
      // void-pallet uses 'qr' for series and 'pallet_num' for pallet numbers
      let searchType: 'qr' | 'pallet_num' = 'pallet_num';
      
      if (detectedSearchType === 'series') {
        searchType = 'qr'; // void-pallet uses 'qr' for series search
      } else if (detectedSearchType === 'pallet_num') {
        searchType = 'pallet_num';
      } else {
        // Fallback: try to detect manually
        if (searchValue.includes('-')) {
          searchType = 'qr'; // Series
        } else {
          searchType = 'pallet_num'; // Pallet number
        }
      }
      
      // Update search type and perform search
      updateState({ searchType, searchInput: searchValue });
      await searchPallet(searchValue, searchType);
    }
  }, [searchPallet, updateState]);

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
      await executeVoid();
      // 如果沒有拋出錯誤，則認為操作成功
      handleVoidComplete();
    } catch (error) {
      // 錯誤已經在 executeVoid 中處理，這裡不需要額外處理
      console.error('Void operation failed:', error);
    }
  }, [executeVoid, handleVoidComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white relative overflow-hidden">
      {/* 背景裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 動態漸層球體 */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* 網格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* 主要內容區域 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* 頁面標題區域 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent mb-3 flex items-center justify-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl mr-4 shadow-lg shadow-red-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                Void Pallet
              </h1>
              
              {/* Instructions 按鈕在標題右邊 */}
              <div className="absolute right-0 top-0">
                <FloatingInstructions
                  title="Void Pallet Instructions"
                  variant="hangover"
                  steps={[
                    {
                      title: "1. Search Pallet",
                      description: "Scan QR code or enter pallet number/series to find the pallet."
                    },
                    {
                      title: "2. Select Void Reason",
                      description: "Choose the appropriate reason for voiding the pallet."
                    },
                    {
                      title: "3. Enter Password",
                      description: "Provide your password to confirm the void operation."
                    },
                    {
                      title: "4. Complete Operation",
                      description: "Review details and execute the void operation."
                    }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className={`mb-8 p-4 rounded-xl border ${
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Search Area */}
            <div className="relative group">
              {/* 卡片背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-red-900/20 hover:border-red-500/30 transition-all duration-300">
                {/* 卡片內部光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                {/* 頂部邊框光效 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-red-100 to-orange-100 bg-clip-text text-transparent">
                      Pallet Search
                    </h2>
                  </div>
                  
                  <UnifiedSearch
                    ref={searchInputRef}
                    searchType="pallet"
                    placeholder="Enter pallet number or series - auto-detection enabled"
                    onSelect={handleSearchSelect}
                    value={searchValue}
                    onChange={setSearchValue}
                    isLoading={state.isSearching}
                    disabled={state.isSearching || state.isProcessing}
                    enableAutoDetection={true}
                  />
                </div>
              </div>
            </div>

            {/* Pallet Information and Void Form */}
            {state.foundPallet && !state.error?.isBlocking && (
              <div className="space-y-8">
                {/* Pallet Information Display */}
                <div className="relative group">
                  {/* 卡片背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-3xl blur-xl"></div>
                  
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-red-500/50 rounded-3xl p-8 shadow-2xl shadow-red-900/20 hover:border-red-400/70 transition-all duration-300">
                    {/* 卡片內部光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    
                    {/* 頂部邊框光效 */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-100 rounded-t-3xl"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-2xl font-semibold bg-gradient-to-r from-red-300 via-orange-300 to-red-200 bg-clip-text text-transparent mb-6">
                        Pallet Details
                      </h2>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Pallet Number</span>
                            <span className="text-lg font-semibold text-white">{state.foundPallet.plt_num}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Product Code</span>
                            <span className="text-lg font-semibold text-white">{state.foundPallet.product_code}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Quantity</span>
                            <span className="text-lg font-semibold text-white">{state.foundPallet.product_qty}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Current Location</span>
                            <span className="text-lg font-semibold text-white">{state.foundPallet.plt_loc || 'Unknown'}</span>
                          </div>
                        </div>

                        {state.foundPallet.plt_remark && (
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Remarks</span>
                            <span className="text-white">{state.foundPallet.plt_remark}</span>
                          </div>
                        )}

                        {/* ACO Pallet Indicator */}
                        {isACOPallet && (
                          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                              <div>
                                <span className="block text-sm font-medium text-blue-400 mb-1">Special Pallet Type</span>
                                <span className="text-lg font-semibold text-blue-300">ACO Order Pallet</span>
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
                  {/* 卡片背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-3xl blur-xl"></div>
                  
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-red-900/20 hover:border-red-500/30 transition-all duration-300">
                    {/* 卡片內部光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    
                    {/* 頂部邊框光效 */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-red-100 to-orange-100 bg-clip-text text-transparent mb-6">
                        Void Operation
                      </h2>
                      
                      <div className="space-y-6">
                        {/* Void Reason Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-3">
                            Void Reason <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={state.voidReason}
                            onChange={(e) => handleVoidReasonChange(e.target.value)}
                            disabled={state.isProcessing}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
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
                            <label className="block text-sm font-medium text-slate-300 mb-3">
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
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                            />
                          </div>
                        )}

                        {/* Password Input */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-3">
                            Password <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="password"
                            value={state.password}
                            onChange={(e) => updateState({ password: e.target.value })}
                            disabled={state.isProcessing}
                            placeholder="Enter your password to confirm"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-300"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 pt-4">
                          <button
                            onClick={handleExecuteVoid}
                            disabled={!canExecuteVoid || state.isProcessing}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/25"
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
                            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 rounded-xl text-slate-300 hover:text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-400">
                  {state.isSearching ? 'Searching pallet...' : 'Processing void operation...'}
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!state.foundPallet && !state.isSearching && !state.error && (
              <div className="relative group">
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-red-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 shadow-2xl shadow-red-900/20 hover:border-red-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10 text-center">
                    <div className="text-slate-500">
                      <svg className="mx-auto h-16 w-16 mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                      <h3 className="text-xl font-medium mb-3 text-slate-400">Start searching for pallet</h3>
                      <p className="text-slate-500">
                  Use the search function above to find the pallet to void
                </p>
                    </div>
                  </div>
              </div>
            </div>
          )}
          </div>

          {/* 底部裝飾 */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>Pennine Manufacturing Stock Control System</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Reprint Info Dialog */}
      {state.showReprintInfoDialog && state.reprintInfo && state.foundPallet && (
        <ReprintInfoDialog
          isOpen={state.showReprintInfoDialog}
          onClose={handleReprintInfoCancel}
          onConfirm={handleReprintInfoConfirm}
          type={getReprintType(state.voidReason)}
          palletInfo={state.foundPallet}
          remainingQuantity={state.reprintInfo.remainingQuantity}
          isProcessing={state.isAutoReprinting}
        />
      )}

      {/* 添加自定義滾動條樣式 */}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
} 