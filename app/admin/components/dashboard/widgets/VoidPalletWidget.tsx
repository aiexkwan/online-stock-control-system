'use client';

import React, { useState, useCallback, useRef } from 'react';
import { X, Search, QrCode, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useVoidPallet } from '@/app/void-pallet/hooks/useVoidPallet';
import { VOID_REASONS } from '@/app/void-pallet/types';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';

interface VoidPalletWidgetProps {
  widget: {
    id: string;
    type: string;
    title: string;
    config: any;
  };
  timeFrame: TimeFrame;
}

type VoidStep = 'search' | 'confirm' | 'result';

export const VoidPalletWidget: React.FC<VoidPalletWidgetProps> = ({ widget, timeFrame }) => {
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

  const [currentStep, setCurrentStep] = useState<VoidStep>('search');
  const [searchValue, setSearchValue] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [voidResult, setVoidResult] = useState<{ success: boolean; message: string } | null>(null);
  
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

  // 處理搜尋提交
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('請輸入 Pallet 編號');
      return;
    }

    try {
      const result = await searchPallet(searchValue.trim(), 'pallet_num');
      if (result.success && result.data) {
        setCurrentStep('confirm');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // 處理 QR 掃描結果
  const handleQrScan = async (qrValue: string) => {
    setShowQrScanner(false);
    setSearchValue(qrValue);
    
    try {
      const result = await searchPallet(qrValue, 'qr');
      if (result.success && result.data) {
        setCurrentStep('confirm');
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
  };

  // 處理 Void 提交
  const handleVoidSubmit = async () => {
    if (!state.foundPallet || !canExecuteVoid()) {
      return;
    }

    try {
      const result = await executeVoid(state.foundPallet, state.voidReason, '', state.damageQuantity);
      if (result.success) {
        setVoidResult({ success: true, message: result.message || 'Pallet void successfully' });
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

  // 重置到搜尋步驟
  const resetToSearch = () => {
    setCurrentStep('search');
    setSearchValue('');
    setVoidResult(null);
    updateState({ foundPallet: null, voidReason: '', damageQuantity: 0 });
    clearError();
    focusSearchInput();
  };

  // 清除錯誤
  const handleClearError = () => {
    clearError();
  };

  // 渲染搜尋步驟
  const renderSearchStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="輸入 Pallet 編號..."
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={state.isSearching}
            />
            {state.isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={state.isSearching || !searchValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>搜尋</span>
          </button>
        </div>
        
        <button
          onClick={() => setShowQrScanner(true)}
          className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center justify-center space-x-2"
        >
          <QrCode className="w-4 h-4" />
          <span>QR 掃描</span>
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
              清除錯誤
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染確認步驟
  const renderConfirmStep = () => (
    <div className="space-y-4">
      {/* Pallet 資訊 */}
      {state.foundPallet && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Pallet 資訊</h4>
          <div className="space-y-1">
            <p className="text-white font-medium">{state.foundPallet.plt_num}</p>
            <p className="text-gray-300 text-sm">{state.foundPallet.product_code}</p>
          </div>
        </div>
      )}
      
      {/* Void 原因選擇 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Void 原因</label>
        <select
          value={state.voidReason}
          onChange={(e) => handleVoidReasonChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
        >
          <option value="">選擇原因...</option>
          {VOID_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* 損壞數量輸入 */}
      {showDamageQuantityInput() && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">損壞數量</label>
          <input
            type="number"
            value={state.damageQuantity}
            onChange={(e) => handleDamageQuantityChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
            min="0"
            max={state.foundPallet?.product_qty}
          />
        </div>
      )}
      
      {/* 操作按鈕 */}
      <div className="flex space-x-3">
        <button
          onClick={resetToSearch}
          className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
        >
          返回搜尋
        </button>
        <button
          onClick={handleVoidSubmit}
          disabled={!canExecuteVoid() || state.isProcessing}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {state.isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>處理中...</span>
            </>
          ) : (
            <span>確認 Void</span>
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
              清除錯誤
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染結果步驟
  const renderResultStep = () => (
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
          {voidResult?.success ? '操作成功' : '操作失敗'}
        </h4>
        <p className="text-gray-400 text-sm mt-1">{voidResult?.message}</p>
      </div>
      
      <button
        onClick={resetToSearch}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        繼續操作
      </button>
    </div>
  );

  return (
    <div className="h-full p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">{widget.title}</h3>
      
      {/* 步驟指示器 */}
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
          <span className="text-sm">搜尋</span>
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
          <span className="text-sm">確認</span>
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
          <span className="text-sm">結果</span>
        </div>
      </div>
      
      {/* 步驟內容 */}
      <div className="flex-1">
        {currentStep === 'search' && renderSearchStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'result' && renderResultStep()}
      </div>
      
      {/* QR 掃描器 */}
      {showQrScanner && (
        <SimpleQRScanner
          isOpen={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrScan}
          title="掃描 Pallet QR Code"
        />
      )}
    </div>
  );
};