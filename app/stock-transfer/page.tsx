'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusMessage } from '../../components/ui/stock-movement-layout';
import { useStockMovement } from '../hooks/useStockMovement';

// 導入拆分的組件
import { PageHeader } from './components/PageHeader';
import { PalletSearchSection } from './components/PalletSearchSection';
import { TransferLogSection } from './components/TransferLogSection';
import { PageFooter } from './components/PageFooter';
import { SkipNavigation } from './components/SkipNavigation';
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog';
import { TransferConfirmDialog, TRANSFER_CODE_MAPPING } from './components/TransferConfirmDialog';

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
  } = useStockMovement({
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
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState<{
    palletInfo: PalletInfo;
    targetLocation: string;
    transferCode?: string;
  } | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

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

  // 根據轉移代號計算目標位置
  const calculateTargetLocationByCode = useCallback((currentLocation: string, transferCode: string): { location: string | null; error?: string } => {
    // 檢查是否為 Voided 位置
    if (currentLocation === 'Voided') {
      return { 
        location: null, 
        error: 'Pallet is voided, cannot be moved' 
      };
    }

    // 根據當前位置和轉移代號查找目標位置
    const locationMappings = TRANSFER_CODE_MAPPING[currentLocation];
    if (!locationMappings) {
      return {
        location: null,
        error: `No transfer codes defined for location: ${currentLocation}`
      };
    }

    const targetLocation = locationMappings[transferCode];
    if (!targetLocation) {
      return {
        location: null,
        error: `Invalid transfer code "${transferCode}" for location: ${currentLocation}`
      };
    }

    return { location: targetLocation };
  }, []);

  // Handle search selection - Optimized for speed
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      setStatusMessage(null);
      
      const searchValue = result.data.value;
      // Get the detected search type from the result data
      const searchType = result.data.searchType || 'pallet_num'; // Default to pallet_num if not provided
      
      // Search pallet information using the detected type
      const palletInfo = await searchPalletInfo(searchType, searchValue);
      
      if (palletInfo) {
        // 檢查是否有待處理的轉移
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
        
        // 檢查是否為 Voided 位置
        const currentLocation = palletInfo.current_plt_loc || 'Await';
        if (currentLocation === 'Voided') {
          setStatusMessage({
            type: 'error',
            message: `❌ TRANSFER BLOCKED: Pallet is voided, cannot be moved`
          });
          return;
        }
        
        // 儲存托盤資訊並顯示轉移對話框
        setPendingTransferData({
          palletInfo,
          targetLocation: '' // 將在輸入轉移代號後設定
        });
        setShowTransferDialog(true);
        
        // 清除狀態訊息
        setStatusMessage(null);
      } else {
        setStatusMessage({
          type: 'error',
          message: `❌ ${searchType === 'series' ? 'Series' : 'Pallet'} "${searchValue}" not found`
        });
      }
    }
  }, [searchPalletInfo, optimisticTransfers]);

  // 處理轉移確認（包含轉移代號和員工ID）
  const handleTransferConfirm = async (transferCode: string, clockNumber: string) => {
    if (!pendingTransferData) return;
    
    const currentLocation = pendingTransferData.palletInfo.current_plt_loc || 'Await';
    const targetResult = calculateTargetLocationByCode(currentLocation, transferCode);
    
    if (!targetResult.location) {
      setStatusMessage({
        type: 'error',
        message: `❌ ${targetResult.error}`
      });
      return;
    }

    const { palletInfo } = pendingTransferData;
    setShowTransferDialog(false);
    
    const success = await executeStockTransfer(
      palletInfo.plt_num,
      palletInfo.product_code,
      palletInfo.product_qty,
      palletInfo.current_plt_loc || 'Await',
      targetResult.location,
      clockNumber  // 傳遞 clock number
    );

    if (success) {
      setStatusMessage({
        type: 'success',
        message: `✓ Pallet ${palletInfo.plt_num} successfully moved to ${targetResult.location}`
      });
      // Reset for next operation
      setSearchValue('');
      // 自動聚焦到搜尋欄位以便快速執行下一個操作
      focusSearchInput();
    } else {
      // 🚀 新增：設置錯誤狀態消息，觸發黑色背景紅色字體閃爍效果
      setStatusMessage({
        type: 'error',
        message: `❌ TRANSFER FAILED: Pallet ${palletInfo.plt_num} could not be moved to ${targetResult.location}`
      });
    }
    
    setPendingTransferData(null);
  };

  // Handle transfer dialog cancel
  const handleTransferCancel = () => {
    setShowTransferDialog(false);
    setPendingTransferData(null);
    // Reset search for quick retry
    setSearchValue('');
    focusSearchInput();
  };

  // Reset operation - optimized for quick next scan
  const handleReset = useCallback(() => {
    // Clear all states
    setSearchValue('');
    setStatusMessage(null);
    setShowTransferDialog(false);
    setPendingTransferData(null);
    
    // Auto-focus for immediate next operation
    focusSearchInput();
  }, [focusSearchInput]);

  // 設置鍵盤快捷鍵
  const { shortcuts } = useKeyboardShortcuts({
    onSearch: focusSearchInput,
    onReset: handleReset,
    onHelp: () => setShowShortcutsDialog(true),
    enabled: !showTransferDialog && !showShortcutsDialog // 在對話框開啟時禁用快捷鍵
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

          <div className="space-y-8">
            {/* Operation Area */}
            <section id="search-section" aria-label="Pallet search section">
              <div className="space-y-8">
                {/* Search Area */}
                <PalletSearchSection
                  searchValue={searchValue}
                  onSearchValueChange={setSearchValue}
                  onSearchSelect={handleSearchSelect}
                  isLoading={isLoading}
                  searchInputRef={searchInputRef}
                />
              </div>
            </section>

            {/* Activity Log */}
            <section id="transfer-log" aria-label="Transfer activity log section">
              <TransferLogSection
                activityLog={activityLog}
                optimisticTransfers={optimisticTransfers}
              />
            </section>
          </div>

          {/* 底部裝飾 */}
          <PageFooter />
        </main>
      </div>

      {/* Transfer Confirm Dialog */}
      <TransferConfirmDialog
        isOpen={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onConfirm={handleTransferConfirm}
        onCancel={handleTransferCancel}
        title="Stock Transfer"
        description=""
        currentLocation={pendingTransferData?.palletInfo.current_plt_loc || 'Await'}
        isLoading={isLoading}
      />

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