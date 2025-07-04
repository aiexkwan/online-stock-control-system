'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusMessage } from '../../components/ui/universal-stock-movement-layout';
import { useStockMovementRPC } from '../hooks/useStockMovementRPC';

// 導入拆分的組件
import { PageHeader } from './components/PageHeader';
import { PalletSearchSection } from './components/PalletSearchSection';
import { TransferLogSection } from './components/TransferLogSection';
import { PageFooter } from './components/PageFooter';
import { SkipNavigation } from './components/SkipNavigation';
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog';
import { TransferControlPanel } from './components/TransferControlPanel';

// 導入鍵盤快捷鍵 Hook
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

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
    optimisticTransfers,
    searchPalletInfo,
    executeStockTransfer,
    addActivityLog,
    preloadPallets,
    getCacheStats
  } = useStockMovementRPC({
    enableCache: true,
    cacheOptions: {
      ttl: 5 * 60 * 1000, // 5分鐘快取
      maxSize: 50, // 最多快取50個托盤
      preloadPatterns: ['PM-', 'PT-'], // 預加載常用前綴
      enableBackgroundRefresh: true
    }
  });

  const [searchValue, setSearchValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<PalletInfo | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [verifiedClockNumber, setVerifiedClockNumber] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

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

  // 頁面載入時自動聚焦和預加載資料
  useEffect(() => {
    focusSearchInput();
    
    // 預加載最近使用的托盤資料
    const initPreload = async () => {
      try {
        await preloadPallets(['PM-', 'PT-', 'PL-']);
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Stock Transfer] 預加載完成');
      } catch (error) {
        console.error('[Stock Transfer] 預加載失敗:', error);
      }
    };
    
    initPreload();
  }, [focusSearchInput, preloadPallets]);

  // 獲取考慮樂觀更新的顯示位置
  const getDisplayLocation = useCallback((pltNum: string, defaultLocation: string) => {
    const optimistic = optimisticTransfers.find(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
    
    if (optimistic) {
      return {
        location: optimistic.toLocation,
        isPending: true,
        fromLocation: optimistic.fromLocation
      };
    }
    
    return {
      location: defaultLocation,
      isPending: false,
      fromLocation: null
    };
  }, [optimisticTransfers]);

  // Process transfer execution
  const handleTransferExecute = useCallback(async (targetLocation: string, clockNumber: string) => {
    if (!selectedPallet) return;
    
    const success = await executeStockTransfer(
      selectedPallet.plt_num,
      selectedPallet.product_code,
      selectedPallet.product_qty,
      selectedPallet.current_plt_loc || 'Await',
      targetLocation,
      clockNumber
    );

    if (success) {
      setStatusMessage({
        type: 'success',
        message: `✓ Pallet ${selectedPallet.plt_num} successfully moved to ${targetLocation}`
      });
      // Clear only pallet search, keep destination and operator
      setSearchValue('');
      setSelectedPallet(null);
      focusSearchInput();
    } else {
      setStatusMessage({
        type: 'error',
        message: `❌ TRANSFER FAILED: Pallet ${selectedPallet.plt_num} could not be moved to ${targetLocation}`
      });
      setSelectedPallet(null);
    }
  }, [selectedPallet, executeStockTransfer, focusSearchInput]);

  // Handle search selection - Optimized for speed
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      setStatusMessage(null);
      
      // Check if destination and operator are ready
      if (!selectedDestination || !verifiedClockNumber) {
        setStatusMessage({
          type: 'warning',
          message: '⚠️ Please select destination and verify operator first'
        });
        return;
      }
      
      const searchValue = result.data.value;
      const searchType = result.data.searchType || 'pallet_num';
      
      // Search pallet information
      const palletInfo = await searchPalletInfo(searchType, searchValue);
      
      if (palletInfo) {
        // Check for pending transfers
        const hasPendingTransfer = optimisticTransfers.some(
          t => t.pltNum === palletInfo.plt_num && t.status === 'pending'
        );
        
        if (hasPendingTransfer) {
          setStatusMessage({
            type: 'warning',
            message: `⏳ Pallet ${palletInfo.plt_num} has a pending transfer. Please wait.`
          });
          return;
        }
        
        const currentLocation = palletInfo.current_plt_loc || 'Await';
        
        // Check if Voided
        if (currentLocation === 'Voided') {
          setStatusMessage({
            type: 'error',
            message: `❌ TRANSFER BLOCKED: Pallet is voided, cannot be moved`
          });
          return;
        }
        
        // Validate transfer rules
        const { validateTransfer } = await import('./components/TransferDestinationSelector');
        const validation = validateTransfer(currentLocation, selectedDestination);
        
        if (!validation.isValid) {
          setStatusMessage({
            type: 'error',
            message: `❌ ${validation.errorMessage}`
          });
          return;
        }
        
        // Set selected pallet and execute transfer immediately
        setSelectedPallet(palletInfo);
        
        // Execute transfer
        await handleTransferExecute(selectedDestination, verifiedClockNumber);
      } else {
        setStatusMessage({
          type: 'error',
          message: `❌ ${searchType === 'series' ? 'Series' : 'Pallet'} "${searchValue}" not found`
        });
      }
    }
  }, [searchPalletInfo, optimisticTransfers, selectedDestination, verifiedClockNumber, handleTransferExecute]);


  // Reset operation - optimized for quick next scan
  const handleReset = useCallback(() => {
    // Clear all states
    setSearchValue('');
    setStatusMessage(null);
    setSelectedPallet(null);
    setSelectedDestination('');
    setVerifiedClockNumber(null);
    setVerifiedName(null);
    
    // Auto-focus for immediate next operation
    focusSearchInput();
  }, [focusSearchInput]);

  // 設置鍵盤快捷鍵
  const { shortcuts } = useKeyboardShortcuts({
    onSearch: focusSearchInput,
    onReset: handleReset,
    onHelp: () => setShowShortcutsDialog(true),
    enabled: !showShortcutsDialog // 在對話框開啟時禁用快捷鍵
  });

  return (
    <div className="min-h-screen">
      {/* Skip Navigation Links */}
      <SkipNavigation />
      
      {/* 主要內容區域 */}
      <div className="relative">
        <main id="main-content" className="container mx-auto px-4 py-8 max-w-5xl">
          {/* 頁面標題區域 */}
          <PageHeader />

          {/* Status Messages */}
          {statusMessage && (
            <StatusMessage
              type={statusMessage.type}
              message={statusMessage.message}
              onDismiss={() => setStatusMessage(null)}
            />
          )}

          {/* Main Layout - 左邊 2/3，右邊 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Operation Area */}
              <section id="search-section" aria-label="Pallet search section">
                <PalletSearchSection
                  searchValue={searchValue}
                  onSearchValueChange={setSearchValue}
                  onSearchSelect={handleSearchSelect}
                  isLoading={isLoading}
                  searchInputRef={searchInputRef}
                  disabled={!selectedDestination || !verifiedClockNumber}
                  disabledMessage={
                    !selectedDestination 
                      ? "Please select a destination first" 
                      : !verifiedClockNumber 
                        ? "Please verify your clock number" 
                        : "Please select destination and verify operator first"
                  }
                />
              </section>

              {/* Activity Log */}
              <section id="transfer-log" aria-label="Transfer activity log section">
                <TransferLogSection
                  activityLog={activityLog}
                  optimisticTransfers={optimisticTransfers}
                />
              </section>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="lg:col-span-1">
              <section id="transfer-control" aria-label="Transfer control panel">
                <TransferControlPanel
                  selectedPallet={selectedPallet}
                  selectedDestination={selectedDestination}
                  verifiedClockNumber={verifiedClockNumber}
                  verifiedName={verifiedName}
                  onDestinationChange={setSelectedDestination}
                  onClockNumberVerified={(clockNum, name) => {
                    setVerifiedClockNumber(clockNum);
                    setVerifiedName(name);
                  }}
                  isProcessing={isLoading}
                />
              </section>
            </div>
          </div>

          {/* 底部裝飾 */}
          <PageFooter />
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        shortcuts={shortcuts}
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