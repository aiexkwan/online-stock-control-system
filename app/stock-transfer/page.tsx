'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  StockMovementLayout, 
  StatusMessage, 
  ActivityLog 
} from '../../components/ui/stock-movement-layout';
import { UnifiedSearch } from '../../components/ui/unified-search';
import { useStockMovement } from '../hooks/useStockMovement';
import { ClockNumberConfirmDialog } from '../components/qc-label-form/ClockNumberConfirmDialog';
import FloatingInstructions from '../../components/ui/floating-instructions';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
}

export default function StockTransferPage() {
  const {
    isLoading,
    activityLog,
    searchPalletInfo,
    executeStockTransfer,
    addActivityLog
  } = useStockMovement();

  const [scannedPalletInfo, setScannedPalletInfo] = useState<PalletInfo | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [showClockNumberDialog, setShowClockNumberDialog] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState<{
    palletInfo: PalletInfo;
    targetLocation: string;
  } | null>(null);

  // 添加搜尋輸入框的 ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 自動聚焦到搜尋欄位
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100); // 短暫延遲確保 DOM 已更新
  }, []);

  // 頁面載入時自動聚焦
  useEffect(() => {
    focusSearchInput();
  }, [focusSearchInput]);

  // Calculate target location (pure function - no side effects)
  // Updated workflow: Await → Production → Fold Mill → Production (cycle)
  const calculateTargetLocation = useCallback((palletInfo: PalletInfo): { location: string | null; error?: string } => {
    const { product_code, current_plt_loc } = palletInfo;
    const fromLocation = current_plt_loc || 'Await';

    // Only prevent movement from 'Voided' location
    if (fromLocation === 'Voided') {
      return { 
        location: null, 
        error: 'Pallet is voided, cannot be moved' 
      };
    }

    // New workflow rules:
    // 1st move: Await → Production (for all products)
    // 2nd move: Production → Fold Mill (for all products)
    // 3rd move: Fold Mill → Production (for all products, creating a cycle)
    if (fromLocation === 'Await') {
      // First move: Always go to Production
      return { location: 'Production' };
    } else if (fromLocation === 'Production') {
      // Second move: Always go to Fold Mill
      return { location: 'Fold Mill' };
    } else if (fromLocation === 'Fold Mill') {
      // Third move: Always go back to Production (creating a cycle)
      return { location: 'Production' };
    } else {
      // For other locations (PipeLine, Pre-Book, Bulk, Back Car Park, etc.)
      // Apply the same rule as from Await (go to Production)
      return { location: 'Production' };
    }
  }, []);

  // Handle search selection
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      setCurrentStep(1);
      setStatusMessage(null);
      
      const searchValue = result.data.value;
      // Don't update searchValue here to avoid infinite loop
      // The UnifiedSearch component will handle the value update
      
      // Only support exact pallet number or series search
      // Pallet numbers typically contain "/" (e.g., "260525/1")
      // Series typically contain "-" (e.g., "260525-5UNXGE")
      let searchType: 'series' | 'pallet_num';
      
      if (searchValue.includes('/')) {
        searchType = 'pallet_num';
      } else if (searchValue.includes('-')) {
        searchType = 'series';
      } else {
        // For unclear format, show error message
        setStatusMessage({
          type: 'error',
          message: 'Please enter complete pallet number (e.g., 250525/13) or series number (e.g., 260525-5UNXGE)'
        });
        setCurrentStep(0);
        return;
      }
      
      // Search pallet information (exact match only)
      const palletInfo = await searchPalletInfo(searchType, searchValue);
      
      if (palletInfo) {
        setScannedPalletInfo(palletInfo);
        setCurrentStep(2);

        // Calculate target location
        const targetResult = calculateTargetLocation(palletInfo);
        if (targetResult.location) {
          setCurrentStep(3);
          
          // Store transfer data and show clock number dialog
          setPendingTransferData({
            palletInfo,
            targetLocation: targetResult.location
          });
          setShowClockNumberDialog(true);
        } else if (targetResult.error) {
          // Set error message using useEffect to avoid setState during render
          setTimeout(() => {
            setStatusMessage({
              type: 'warning',
              message: targetResult.error!
            });
          }, 0);
        }
      } else {
        setCurrentStep(0);
      }
    }
  }, [searchPalletInfo, calculateTargetLocation]);



  // Handle clock number confirmation
  const handleClockNumberConfirm = async (clockNumber: string) => {
    if (!pendingTransferData) return;

    const { palletInfo, targetLocation } = pendingTransferData;
    
    setShowClockNumberDialog(false);
    setCurrentStep(4);
    
    const success = await executeStockTransfer(
      palletInfo.plt_num,
      palletInfo.product_code,
      palletInfo.product_qty,
      palletInfo.current_plt_loc || 'Await',
      targetLocation,
      clockNumber  // 傳遞 clock number
    );

    if (success) {
      setStatusMessage({
        type: 'success',
        message: `Pallet ${palletInfo.plt_num} successfully moved to ${targetLocation}`
      });
      // Reset for next operation
      setScannedPalletInfo(null);
      setSearchValue('');
      setCurrentStep(0);
      // 自動聚焦到搜尋欄位以便快速執行下一個操作
      focusSearchInput();
    } else {
      setCurrentStep(3);
    }
    
    setPendingTransferData(null);
  };

  // Handle clock number dialog cancel
  const handleClockNumberCancel = () => {
    setShowClockNumberDialog(false);
    setPendingTransferData(null);
    setCurrentStep(2); // Go back to pallet info display
  };

  // Reset operation
  const handleReset = () => {
    setScannedPalletInfo(null);
    setSearchValue('');
    setCurrentStep(0);
    setStatusMessage(null);
    setShowClockNumberDialog(false);
    setPendingTransferData(null);
    // 重置後自動聚焦到搜尋欄位
    focusSearchInput();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white relative overflow-hidden">
      {/* 背景裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 動態漸層球體 */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* 網格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* 主要內容區域 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* 頁面標題區域 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent mb-3 flex items-center justify-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 shadow-lg shadow-blue-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                Pallet Transfer
              </h1>
              
              {/* Instructions 按鈕在標題右邊 */}
              <div className="absolute right-0 top-0">
                <FloatingInstructions
                  title="Stock Transfer Instructions"
                  variant="hangover"
                  steps={[
                    {
                      title: "1. Scan or Enter Pallet",
                      description: "Scan QR code or manually enter complete pallet number."
                    },
                    {
                      title: "2. Scan Clock ID Code",
                      description: "Scan your clock ID code for confirmation."
                    },
                    {
                      title: "3. View Results",
                      description: "Operation update and previous activity log will be shown in the transfer log section."
                    }
                  ]}
                />
              </div>
            </div>
          </div>

          <Toaster richColors position="top-center" />
          
          {/* Status Messages */}
          {statusMessage && (
            <StatusMessage
              type={statusMessage.type}
              message={statusMessage.message}
              onDismiss={() => setStatusMessage(null)}
            />
          )}

          <div className="space-y-8">
            {/* Operation Area */}
            <div className="space-y-8">
              {/* Search Area */}
              <div className="relative group">
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
                
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                  {/* 卡片內部光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* 頂部邊框光效 */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                        Pallet Search
                      </h2>
                    </div>
                    
                    <UnifiedSearch
                      ref={searchInputRef}
                      searchType="pallet"
                      placeholder="Scan QR code or enter complete pallet number (e.g., 250525/13)"
                      onSelect={handleSearchSelect}
                      value={searchValue}
                      onChange={setSearchValue}
                      isLoading={isLoading}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Pallet Information Display */}
              {scannedPalletInfo && (
                <div className="relative group">
                  {/* 卡片背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
                  
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-blue-500/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-400/70 transition-all duration-300">
                    {/* 卡片內部光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    
                    {/* 頂部邊框光效 */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-100 rounded-t-3xl"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent mb-6">
                        Pallet Details
                      </h2>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Pallet Number</span>
                            <span className="text-lg font-semibold text-white">{scannedPalletInfo.plt_num}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Product Code</span>
                            <span className="text-lg font-semibold text-white">{scannedPalletInfo.product_code}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Quantity</span>
                            <span className="text-lg font-semibold text-white">{scannedPalletInfo.product_qty}</span>
                          </div>
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Current Location</span>
                            <span className="text-lg font-semibold text-white">{scannedPalletInfo.current_plt_loc || 'Await'}</span>
                          </div>
                        </div>

                        {scannedPalletInfo.plt_remark && (
                          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                            <span className="block text-sm font-medium text-slate-400 mb-1">Remarks</span>
                            <span className="text-white">{scannedPalletInfo.plt_remark}</span>
                          </div>
                        )}

                        {/* Target Location Display */}
                        {(() => {
                          const targetResult = calculateTargetLocation(scannedPalletInfo);
                          return targetResult.location && (
                            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <div>
                                  <span className="block text-sm font-medium text-green-400 mb-1">Target Location</span>
                                  <span className="text-lg font-semibold text-green-300">{targetResult.location}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Operation Buttons */}
                        <div className="flex space-x-4 pt-4">
                          <button
                            onClick={handleReset}
                            disabled={isLoading}
                            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 rounded-xl text-slate-300 hover:text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="relative group">
              {/* 卡片背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                {/* 卡片內部光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                {/* 頂部邊框光效 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-6">
                    Transfer Log
                  </h2>
                  
                  <div className="h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {activityLog.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-slate-400">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No transfer records found</p>
                        </div>
                      </div>
                    ) : (
                      activityLog.map((activity, index) => (
                        <div
                          key={index}
                          className={`flex items-start space-x-3 p-4 rounded-xl border transition-all duration-300 ${
                            activity.type === 'success'
                              ? 'bg-green-500/10 border-green-500/30 text-green-300'
                              : activity.type === 'error'
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            activity.type === 'success' ? 'bg-green-400' :
                            activity.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-slate-400">
                                {activity.timestamp || new Date().toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{activity.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部裝飾 */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>Pennine Manufacturing Stock Transfer System</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Clock Number Confirmation Dialog */}
      <ClockNumberConfirmDialog
        isOpen={showClockNumberDialog}
        onOpenChange={setShowClockNumberDialog}
        onConfirm={handleClockNumberConfirm}
        onCancel={handleClockNumberCancel}
        title="Confirm Stock Transfer"
        description="Please enter your clock number to proceed with the stock transfer."
        isLoading={isLoading}
      />

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