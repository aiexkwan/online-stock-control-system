'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusMessage } from '@/components/ui/universal-stock-movement-layout';
import {
  searchPallet,
  transferPallet,
  getTransferHistory,
  validateTransferDestination,
  TransferHistoryItem,
} from '@/app/actions/stockTransferActions';
import { toast } from 'sonner';

// 導入拆分的組件
import { PageHeader } from './components/PageHeader';
import { PalletSearchSection } from './components/PalletSearchSection';
import { TransferLogSection } from './components/TransferLogSection';
import { PageFooter } from './components/PageFooter';
import { SkipNavigation } from './components/SkipNavigation';
import { TransferControlPanel } from './components/TransferControlPanel';
import { validateTransfer } from './components/TransferDestinationSelector';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_desc?: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
  location?: string | null;
  generate_time?: string;
  series?: string;
}

interface ActivityLogItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
  palletNum?: string;
  metadata?: Record<string, unknown>;
}

// Optimistic transfer interface for UI updates
interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

export default function StockTransferPage() {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<PalletInfo | null>(null);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [verifiedClockNumber, setVerifiedClockNumber] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([]);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-execute transfer when all conditions are met
  // Need ALL three conditions:
  // 1. selectedPallet (from scan)
  // 2. selectedDestination
  // 3. verifiedClockNumber
  useEffect(() => {
    // Check if all conditions are met
    if (selectedPallet && selectedDestination && verifiedClockNumber && !isTransferring) {
      console.log('[Stock Transfer] All conditions met, auto-executing transfer:', {
        pallet: selectedPallet.plt_num,
        destination: selectedDestination,
        operator: verifiedClockNumber,
      });

      // Execute transfer using the callback
      executeStockTransfer(selectedPallet, selectedDestination, verifiedClockNumber).then(
        success => {
          if (success) {
            setStatusMessage({
              type: 'success',
              message: `✓ Pallet ${selectedPallet.plt_num} successfully moved to ${selectedDestination}`,
            });
            // Clear only pallet search, keep destination and operator
            setSearchValue('');
            setSelectedPallet(null);
            focusSearchInput();
          } else {
            setStatusMessage({
              type: 'error',
              message: `✗ Failed to transfer pallet ${selectedPallet.plt_num}`,
            });
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPallet?.plt_num, selectedDestination, verifiedClockNumber, isTransferring]); // Monitor these conditions

  // Add activity log helper
  const addActivityLog = useCallback((log: ActivityLogItem) => {
    setActivityLog(prev => [log, ...prev].slice(0, 50)); // Keep last 50 entries
  }, []);

  // Auto focus search input
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Load transfer history on mount
  useEffect(() => {
    focusSearchInput();
    loadTransferHistory();
  }, [focusSearchInput]);

  // Load transfer history
  const loadTransferHistory = async () => {
    try {
      const history = await getTransferHistory(20);
      setTransferHistory(history);
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    }
  };

  // Cleanup optimistic transfers periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setOptimisticTransfers(prev =>
        prev.filter(
          t => t.status === 'pending' || Date.now() - t.timestamp < 5000 // Keep success/failed for 5 seconds
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Execute stock transfer using Server Action
  const executeStockTransfer = useCallback(
    async (palletInfo: PalletInfo, toLocation: string, operatorId: string): Promise<boolean> => {
      const transferId = `${palletInfo.plt_num}-${Date.now()}`;
      const fromLocation = palletInfo.current_plt_loc || palletInfo.location || 'Unknown';

      // Check for pending transfers
      const hasPending = optimisticTransfers.some(
        t => t.pltNum === palletInfo.plt_num && t.status === 'pending'
      );

      if (hasPending) {
        toast.warning(`Pallet ${palletInfo.plt_num} has a pending transfer. Please wait.`);
        return false;
      }

      // Add optimistic update
      const optimisticEntry: OptimisticTransfer = {
        id: transferId,
        pltNum: palletInfo.plt_num,
        fromLocation,
        toLocation,
        status: 'pending',
        timestamp: Date.now(),
      };

      setOptimisticTransfers(prev => [...prev, optimisticEntry]);
      setIsTransferring(true);

      try {
        // Validate transfer first
        const validation = await validateTransferDestination(palletInfo.plt_num, toLocation);
        if (!validation.valid) {
          throw new Error(validation.message || 'Invalid transfer');
        }

        // Execute transfer
        const result = await transferPallet(palletInfo.plt_num, toLocation);

        if (result.success) {
          // Update optimistic state
          setOptimisticTransfers(prev =>
            prev.map(t => (t.id === transferId ? { ...t, status: 'success' } : t))
          );

          // Add to activity log
          addActivityLog({
            id: Date.now().toString(),
            type: 'success',
            message: result.message,
            timestamp: new Date().toISOString(),
            palletNum: palletInfo.plt_num,
          });

          // Reload transfer history
          loadTransferHistory();

          toast.success(result.message);
          return true;
        } else {
          // Update optimistic state
          setOptimisticTransfers(prev =>
            prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
          );

          toast.error(result.error || 'Transfer failed');
          return false;
        }
      } catch (error) {
        console.error('Transfer error:', error);

        // Update optimistic state
        setOptimisticTransfers(prev =>
          prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
        );

        toast.error(error instanceof Error ? error.message : 'Transfer failed');
        return false;
      } finally {
        setIsTransferring(false);
      }
    },
    [optimisticTransfers, addActivityLog]
  );

  // Handle transfer execution
  const handleTransferExecute = useCallback(
    async (targetLocation: string, clockNumber: string) => {
      if (!selectedPallet) return;

      const success = await executeStockTransfer(selectedPallet, targetLocation, clockNumber);

      if (success) {
        setStatusMessage({
          type: 'success',
          message: `✓ Pallet ${selectedPallet.plt_num} successfully moved to ${targetLocation}`,
        });
        // Clear only pallet search, keep destination and operator
        setSearchValue('');
        setSelectedPallet(null);
        focusSearchInput();
      } else {
        setStatusMessage({
          type: 'error',
          message: `✗ Failed to transfer pallet ${selectedPallet.plt_num}`,
        });
      }
    },
    [selectedPallet, executeStockTransfer, focusSearchInput]
  );

  // Helper functions for compatibility
  const hasPendingTransfer = useCallback(
    (pltNum: string): boolean => {
      return optimisticTransfers.some(t => t.pltNum === pltNum && t.status === 'pending');
    },
    [optimisticTransfers]
  );

  const preloadPallets = useCallback(async () => {
    // No-op for now - can implement caching strategy later
  }, []);

  return (
    <div className='flex min-h-screen w-full flex-col'>
      <SkipNavigation />

      <PageHeader />

      <main id='main-content' className='flex-1 px-4 pb-8 pt-20 sm:px-6 md:px-8' role='main'>
        <div className='mx-auto max-w-7xl'>
          {/* Status Message */}
          {statusMessage && (
            <div className='animate-fade-in mb-6'>
              <StatusMessage
                type={statusMessage.type}
                message={statusMessage.message}
                onDismiss={() => setStatusMessage(null)}
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            {/* Pallet Search Section */}
            <div className='lg:col-span-1 xl:col-span-1'>
              <PalletSearchSection
                searchValue={searchValue}
                onSearchValueChange={setSearchValue}
                onSearchSelect={async result => {
                  // Handle search result from UnifiedSearch (including QR scan)
                  // 策略4: unknown + type narrowing - 安全獲取搜索值
                  const searchValue =
                    Array.isArray(result.data) && result.data.length > 0
                      ? typeof result.data[0]?.value === 'string'
                        ? result.data[0].value
                        : result.title
                      : result.title || '';

                  if (searchValue) {
                    setIsSearching(true);
                    try {
                      const searchResult = await searchPallet(searchValue);
                      if (searchResult.success && searchResult.data) {
                        setSelectedPallet(searchResult.data);

                        // Add to activity log
                        addActivityLog({
                          id: Date.now().toString(),
                          type: 'info',
                          message: `Found pallet ${searchResult.data.plt_num}`,
                          timestamp: new Date().toISOString(),
                          palletNum: searchResult.data.plt_num,
                        });

                        // useEffect will handle auto-execution when all conditions are met
                      } else {
                        addActivityLog({
                          id: Date.now().toString(),
                          type: 'error',
                          message: searchResult.error || 'Pallet not found',
                          timestamp: new Date().toISOString(),
                        });
                        toast.error(searchResult.error || 'Pallet not found');
                      }
                    } finally {
                      setIsSearching(false);
                    }
                  }
                }}
                isLoading={isLoading || isSearching}
                searchInputRef={searchInputRef}
                disabled={!selectedDestination || !verifiedClockNumber}
                disabledMessage='Please select destination and verify operator first'
              />
            </div>

            {/* Transfer Control Panel */}
            <div className='lg:col-span-1 xl:col-span-1'>
              <TransferControlPanel
                selectedPallet={selectedPallet}
                selectedDestination={selectedDestination}
                verifiedClockNumber={verifiedClockNumber}
                verifiedName={verifiedName}
                onDestinationChange={setSelectedDestination}
                onClockNumberVerified={(clockNumber, name) => {
                  setVerifiedClockNumber(clockNumber);
                  setVerifiedName(name);
                }}
                isProcessing={isTransferring}
              />
            </div>

            {/* Transfer Log Section */}
            <div className='lg:col-span-2 xl:col-span-1'>
              <TransferLogSection
                activityLog={activityLog}
                optimisticTransfers={optimisticTransfers}
              />
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
