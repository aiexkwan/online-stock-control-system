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
  // Removed terminal location restrictions - pallets can move from any location
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

    // Apply standard movement rules regardless of current location
    if (fromLocation === 'Await') {
      return { location: product_code.startsWith('Z') ? 'Production' : 'Fold Mill' };
    } else if (fromLocation === 'Fold Mill') {
      return { location: product_code.startsWith('U') ? 'PipeLine' : 'Production' };
    } else {
      // For all other locations, apply the same rules as from 'Await'
      // This allows movement from any location (including previous terminal locations)
      return { location: product_code.startsWith('Z') ? 'Production' : 'Fold Mill' };
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
    <StockMovementLayout
      isLoading={isLoading}
      loadingText="Processing transfer..."
    >
      <Toaster richColors position="top-center" />
      
      {/* Status Messages */}
      {statusMessage && (
        <StatusMessage
          type={statusMessage.type}
          message={statusMessage.message}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      <div className="space-y-6">
        {/* Operation Area */}
        <div className="space-y-6">
          {/* Search Area */}
          <Card className="border-gray-600 bg-gray-800 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400">Pallet Search</CardTitle>
                <FloatingInstructions
                  title="Stock Transfer Instructions"
                  variant="hangover"
                  steps={[
                    {
                      title: "Scan or Enter Pallet",
                      description: "Scan QR code or enter complete pallet number (e.g., 250525/13) or series number (e.g., 260525-5UNXGE)."
                    },
                    {
                      title: "Confirm Pallet Information",
                      description: "Review pallet details including product code, quantity, and current location. System will calculate target location."
                    },
                    {
                      title: "Enter Clock Number",
                      description: "Enter your clock number to confirm the stock transfer operation."
                    },
                    {
                      title: "View Results",
                      description: "Check operation results and activity log. The search field will auto-focus for next operation."
                    }
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Pallet Information Display */}
          {scannedPalletInfo && (
            <Card className="border-blue-400 bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-blue-400">Pallet Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-300">Pallet Number:</span>
                      <span className="text-white ml-2">{scannedPalletInfo.plt_num}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">Product Code:</span>
                      <span className="text-white ml-2">{scannedPalletInfo.product_code}</span>
                    </div>
            <div>
                      <span className="font-medium text-gray-300">Quantity:</span>
                      <span className="text-white ml-2">{scannedPalletInfo.product_qty}</span>
            </div>
            <div>
                      <span className="font-medium text-gray-300">Current Location:</span>
                      <span className="text-white ml-2">{scannedPalletInfo.current_plt_loc || 'Await'}</span>
            </div>
          </div>

                  {scannedPalletInfo.plt_remark && (
                    <div>
                      <span className="font-medium text-gray-300">Remarks:</span>
                      <span className="text-white ml-2">{scannedPalletInfo.plt_remark}</span>
            </div>
          )}

                  {/* Target Location Display */}
                  {(() => {
                    const targetResult = calculateTargetLocation(scannedPalletInfo);
                    return targetResult.location && (
                      <div className="mt-4 p-3 bg-gray-700 rounded-md border border-green-400">
                        <span className="font-medium text-green-400">Target Location:</span>
                        <span className="text-green-400 font-semibold ml-2">{targetResult.location}</span>
            </div>
                    );
                  })()}

                  {/* Operation Buttons */}
                  <div className="flex space-x-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isLoading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Reset
                    </Button>
            </div>
                </CardContent>
              </Card>
            )}
            </div>

          {/* Activity Log */}
          <div>
            <ActivityLog
              activities={activityLog}
              title="Transfer Log"
              maxHeight="h-96"
            />
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
      </StockMovementLayout>
    );
  } 