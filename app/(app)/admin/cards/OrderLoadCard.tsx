'use client';

import React, { useState } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { DataCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cn } from '@/lib/utils';
import { loadPalletToOrder, LoadPalletResult } from '@/app/actions/orderLoadingActions';

export interface OrderLoadCardProps {
  className?: string;
}

export const OrderLoadCard: React.FC<OrderLoadCardProps> = ({ className }) => {
  // 極簡狀態管理 - 只保留3個核心狀態
  const [scanInput, setScanInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 單一處理函數
  const handleOperation = async () => {
    // 輸入驗證
    if (!scanInput.trim()) {
      setResult({ type: 'error', message: '請輸入托盤號碼' });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // 固定使用 ORDER001 作為預設訂單
      // 實際應用中可以從props或context獲取
      const orderRef = 'ORDER001';

      // 調用loadPalletToOrder action
      const response: LoadPalletResult = await loadPalletToOrder(orderRef, scanInput);

      if (response.success) {
        setResult({
          type: 'success',
          message: `成功載入托盤 ${response.data?.palletNumber || scanInput}`,
        });
        // 清空輸入
        setScanInput('');
      } else {
        setResult({
          type: 'error',
          message: response.message || '載入失敗',
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: '系統錯誤，請稍後再試',
      });
    } finally {
      setIsProcessing(false);
      // 3秒後自動清除結果
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className={cn('h-full', className)}>
      <DataCard
        className='h-full overflow-hidden'
        borderGlow='hover'
        glassmorphicVariant='default'
        padding='large'
      >
        {/* Header */}
        <div className='mb-6'>
          <h2 className='flex items-center text-lg font-semibold text-white'>
            <TruckIcon className='mr-3 h-6 w-6 text-blue-400' />
            Order Loading
          </h2>
          <p className='mt-1 text-sm text-slate-400'>掃描托盤號碼進行訂單載入</p>
        </div>

        {/* 掃描輸入區 */}
        <div className='mb-6 space-y-4'>
          <div className='w-full'>
            <UnifiedSearch
              searchType='pallet'
              value={scanInput}
              onChange={setScanInput}
              onSelect={result => {
                if (result && typeof result === 'object' && 'pallet_num' in result) {
                  setScanInput(result.pallet_num as string);
                }
              }}
              isLoading={false}
              placeholder='掃描或輸入托盤號碼...'
              products={[]}
            />
          </div>

          <Button
            onClick={handleOperation}
            disabled={isProcessing || !scanInput.trim()}
            className={cn(
              'w-full py-3 font-medium transition-all',
              isProcessing
                ? 'cursor-not-allowed bg-slate-600 text-slate-400'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            )}
          >
            {isProcessing ? (
              <div className='flex items-center justify-center'>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                處理中...
              </div>
            ) : (
              '載入托盤'
            )}
          </Button>
        </div>

        {/* 結果顯示區 */}
        {result && (
          <div
            className={cn(
              'animate-in fade-in-50 rounded-lg border p-4 text-center duration-300',
              result.type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            )}
          >
            <div className='mb-2 flex items-center justify-center'>
              {result.type === 'success' ? (
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
                  <span className='text-sm font-bold text-white'>✓</span>
                </div>
              ) : (
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                  <span className='text-sm font-bold text-white'>✗</span>
                </div>
              )}
            </div>
            <p className='text-sm font-medium'>{result.message}</p>
          </div>
        )}

        {/* 說明文字 */}
        <div className='mt-auto pt-6 text-center text-xs text-slate-500'>
          請使用掃描器或手動輸入托盤號碼進行載入操作
        </div>
      </DataCard>
    </div>
  );
};

export default OrderLoadCard;
