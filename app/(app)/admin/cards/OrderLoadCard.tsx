'use client';

import React, { useState, useEffect } from 'react';
import { DataCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { useOrderLoad } from '../hooks/useOrderLoad';
import { 
  UserIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  DocumentArrowDownIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import integrated components
import BatchLoadPanel from '@/app/(app)/order-loading/components/BatchLoadPanel';
import { LoadingProgressChart } from '@/app/(app)/order-loading/components/LoadingProgressChart';
import MobileOrderLoading from '@/app/(app)/order-loading/components/MobileOrderLoading';
import { SoundSettingsToggle } from '@/app/(app)/order-loading/components/SoundSettingsToggle';
import { UnifiedLoadingReportDialog } from '@/app/(app)/order-loading/components/UnifiedLoadingReportDialog';

export interface OrderLoadCardProps {
  className?: string;
}

// Mobile device detection hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const screenWidth = window.innerWidth;
      
      setIsMobile(mobileRegex.test(userAgent) || screenWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

export const OrderLoadCard: React.FC<OrderLoadCardProps> = ({ className }) => {
  const isMobile = useMobileDetection();
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const {
    // State
    idNumber,
    isIdValid,
    isCheckingId,
    availableOrders,
    orderSummaries,
    selectedOrderRef,
    orderData,
    isLoadingOrders,
    searchValue,
    isSearching,
    recentLoads,
    orderSearchQuery,
    showUndoDialog,
    undoItem,
    
    // Functions
    setIdNumber,
    setSearchValue,
    setOrderSearchQuery,
    setShowUndoDialog,
    handleIdChange,
    handleIdBlur,
    handleOrderSelect,
    handleSearchSelect,
    handleUndoClick,
    handleConfirmedUndo,
    refreshAllData,
    
    // Refs
    idInputRef,
    searchInputRef,
    
    // Sound
    soundSettings,
  } = useOrderLoad();

  // Change user (reset to ID input)
  const handleChangeUser = () => {
    setIdNumber('');
    localStorage.removeItem('orderLoadingUserId');
    if (idInputRef.current) {
      idInputRef.current.focus();
    }
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className={`h-full ${className || ''}`}>
        <DataCard
          className="h-full overflow-hidden"
          borderGlow="hover"
          glassmorphicVariant="default"
          padding="none"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`${cardTextStyles.title} flex items-center`}>
                    <DevicePhoneMobileIcon className="mr-2 h-5 w-5 text-blue-400" />
                    Order Loading
                  </h2>
                  <p className={cardTextStyles.labelSmall}>Mobile optimized interface</p>
                </div>
                <div className="flex items-center space-x-2">
                  <SoundSettingsToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportDialog(true)}
                    className="text-slate-400 hover:text-white"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <MobileOrderLoading
                idNumber={idNumber}
                isIdValid={isIdValid}
                isCheckingId={isCheckingId}
                onIdChange={handleIdChange}
                onIdBlur={handleIdBlur}
                availableOrders={availableOrders}
                orderSummaries={orderSummaries}
                selectedOrderRef={selectedOrderRef}
                orderSearchQuery={orderSearchQuery}
                onOrderSearchChange={setOrderSearchQuery}
                onOrderSelect={handleOrderSelect}
                onChangeUser={handleChangeUser}
                orderData={orderData as unknown as Record<string, unknown>[]}
                isLoadingOrders={isLoadingOrders}
                searchValue={searchValue}
                isSearching={isSearching}
                onSearchChange={setSearchValue}
                onSearchSelect={handleSearchSelect}
                recentLoads={recentLoads}
                onUndoClick={handleUndoClick}
                idInputRef={idInputRef}
                searchInputRef={searchInputRef}
              />
            </div>
          </div>
        </DataCard>

        {/* Report Dialog */}
        <UnifiedLoadingReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      </div>
    );
  }

  // Desktop view
  return (
    <div className={`h-full ${className || ''}`}>
      <DataCard
        className="h-full overflow-hidden"
        borderGlow="hover"
        glassmorphicVariant="default"
        padding="none"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <ComputerDesktopIcon className="mr-2 h-5 w-5 text-purple-400" />
                  Order Loading System
                </h2>
                <p className="text-sm text-slate-400">Manage order loading operations</p>
              </div>
              <div className="flex items-center space-x-2">
                <SoundSettingsToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportDialog(true)}
                  className="text-slate-400 hover:text-white"
                  title="Generate loading reports"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {!isIdValid ? (
              // Step 1: ID Input
              <div className="flex h-full items-center justify-center p-8">
                <Card className="w-full max-w-md border-slate-700/50 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-200">
                      <UserIcon className="mr-2 h-6 w-6 text-blue-400" />
                      Employee Login
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Input
                        ref={idInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={idNumber}
                        onChange={handleIdChange}
                        onBlur={handleIdBlur}
                        placeholder="Enter 4-digit ID..."
                        maxLength={4}
                        disabled={isCheckingId}
                        className="text-center text-lg font-mono"
                      />
                    </div>
                    
                    {isCheckingId && (
                      <div className="flex items-center justify-center py-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-transparent"></div>
                        <span className="ml-2 text-slate-400">Verifying ID...</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-slate-400 text-center">
                      Please enter your 4-digit employee ID
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : availableOrders.length === 0 ? (
              // No orders available
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <TruckIcon className="mx-auto mb-4 h-16 w-16 text-slate-600" />
                  <h3 className="mb-2 text-xl font-semibold text-white">No Orders Available</h3>
                  <p className="text-slate-400">No pending orders for loading at this time.</p>
                </div>
              </div>
            ) : !selectedOrderRef ? (
              // Step 2: Order Selection
              <div className="flex h-full flex-col p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <ClipboardDocumentListIcon className="mr-2 h-6 w-6 text-green-400" />
                    Select Order to Load
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Choose an order to begin loading operations</p>
                </div>

                {/* Order Search */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
                  {availableOrders
                    .filter(orderRef => orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                    .map(orderRef => {
                      const summary = orderSummaries.get(orderRef);
                      const isComplete = summary && summary.percentage >= 100;

                      return (
                        <Card
                          key={orderRef}
                          className={cn(
                            "cursor-pointer transition-all hover:scale-105 border-slate-700/50 bg-slate-800/50",
                            isComplete && "border-white/50 bg-white/10"
                          )}
                          onClick={() => handleOrderSelect(orderRef)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-cyan-300">Order #{orderRef}</h4>
                              {isComplete && (
                                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                                  ✓ Complete
                                </span>
                              )}
                            </div>
                            
                            {summary && (
                              <div className="space-y-2">
                                <div className="text-sm text-slate-400">
                                  {summary.completedItems}/{summary.itemCount} items • 
                                  {summary.loadedQty}/{summary.totalQty} units
                                </div>
                                <div className="w-full bg-slate-600/30 rounded-full h-2">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      isComplete 
                                        ? "bg-gradient-to-r from-green-500 to-green-400" 
                                        : "bg-gradient-to-r from-blue-500 to-blue-400"
                                    )}
                                    style={{ width: `${summary.percentage}%` }}
                                  />
                                </div>
                                <div className="text-right text-sm font-medium">
                                  {summary.percentage.toFixed(1)}%
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ) : (
              // Step 3: Loading Interface
              <div className="flex h-full">
                {/* Left Panel - Scanning & Progress */}
                <div className="flex-1 flex flex-col p-6 space-y-6">
                  {/* Order Info */}
                  <Card className="border-slate-700/50 bg-slate-800/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-cyan-300">
                          Order #{selectedOrderRef}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleChangeUser}
                          className="border-slate-600 text-slate-300"
                        >
                          Change User
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {orderSummaries.has(selectedOrderRef) && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-300">
                              {orderSummaries.get(selectedOrderRef)!.percentage.toFixed(0)}%
                            </div>
                            <div className="text-sm text-slate-400">Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-300">
                              {orderSummaries.get(selectedOrderRef)!.loadedQty}
                            </div>
                            <div className="text-sm text-slate-400">Units Loaded</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-300">
                              {orderSummaries.get(selectedOrderRef)!.completedItems}/
                              {orderSummaries.get(selectedOrderRef)!.itemCount}
                            </div>
                            <div className="text-sm text-slate-400">Items Complete</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Scanning Interface */}
                  <Card className="border-slate-700/50 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-200">
                        <TruckIcon className="mr-2 h-6 w-6 text-purple-400" />
                        Scan to Load
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UnifiedSearch
                        searchType="pallet"
                        value={searchValue}
                        onChange={setSearchValue}
                        onSelect={handleSearchSelect}
                        isLoading={isSearching}
                        placeholder="Scan or enter pallet number..."
                        ref={searchInputRef}
                        products={[]}
                      />
                    </CardContent>
                  </Card>

                  {/* Progress Chart */}
                  {orderData.length > 0 && (
                    <Card className="border-slate-700/50 bg-slate-800/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-200">
                          <ChartBarIcon className="mr-2 h-6 w-6 text-green-400" />
                          Loading Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LoadingProgressChart 
                          orderData={orderData} 
                          recentLoads={recentLoads}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Batch Loading Panel */}
                  {selectedOrderRef && (
                    <BatchLoadPanel
                      orderRef={selectedOrderRef}
                      onBatchComplete={refreshAllData}
                    />
                  )}
                </div>

                {/* Right Panel - Order Details & History */}
                <div className="w-80 border-l border-slate-700/50 p-6 space-y-4 overflow-y-auto">
                  {/* Order Items */}
                  <Card className="border-slate-700/50 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-200">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {orderData.map((order, index) => {
                        const totalQty = parseInt(order.product_qty || '0');
                        const loadedQty = parseInt(order.loaded_qty || '0');
                        const percentage = totalQty > 0 ? (loadedQty / totalQty) * 100 : 0;
                        const isComplete = loadedQty >= totalQty;

                        return (
                          <div
                            key={index}
                            className={cn(
                              "rounded-lg border p-3 space-y-2",
                              isComplete 
                                ? "border-white/30 bg-white/10" 
                                : "border-slate-600/30 bg-slate-700/30"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm text-cyan-300">
                                {order.product_code}
                              </span>
                              <span className={cn(
                                "text-xs font-medium",
                                isComplete ? "text-green-400" : "text-yellow-400"
                              )}>
                                {isComplete ? '✓' : `${percentage.toFixed(0)}%`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 truncate">
                              {order.product_desc}
                            </p>
                            <div className="text-xs text-slate-400">
                              {loadedQty} / {totalQty} loaded
                            </div>
                            <div className="w-full bg-slate-600/30 rounded-full h-1">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isComplete 
                                    ? "bg-green-500" 
                                    : "bg-blue-500"
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Recent Loads */}
                  {recentLoads.length > 0 && (
                    <Card className="border-slate-700/50 bg-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-sm text-slate-200">Recent Loads</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {recentLoads.slice(0, 8).map((load, index) => {
                          const uuid = typeof load.uuid === 'string' ? load.uuid : `load-${index}`;
                          const palletNum = typeof load.pallet_num === 'string' ? load.pallet_num : 'Unknown';
                          const quantity = typeof load.quantity === 'number' ? load.quantity : 'N/A';

                          return (
                            <div
                              key={uuid}
                              className="flex items-center justify-between rounded bg-slate-700/30 p-2 text-xs"
                            >
                              <div>
                                <span className="font-mono text-cyan-300">{palletNum}</span>
                                <span className="mx-1 text-slate-400">•</span>
                                <span className="text-green-300">Qty: {quantity}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUndoClick({
                                  ...load,
                                  pallet_num: palletNum,
                                  product_code: String(load.product_code || ''),
                                  quantity: Number(load.quantity || 0),
                                })}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              >
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DataCard>

      {/* Report Dialog */}
      <UnifiedLoadingReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />

      {/* Undo Confirmation Dialog */}
      {showUndoDialog && undoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md border-none bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-200">Confirm Undo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                Are you sure you want to undo the loading of pallet{' '}
                <span className="font-mono text-cyan-300">{undoItem.pallet_num}</span>?
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUndoDialog(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmedUndo}
                >
                  Undo Load
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderLoadCard;