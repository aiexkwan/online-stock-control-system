'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageErrorBoundary } from '@/lib/error-handling';
import { StarfieldBackground } from '@/app/components/StarfieldBackground';
import StockCountForm from './components/StockCountForm';
import ScanResult from './components/ScanResult';

// 簡化狀態類型
type CountState = 'form' | 'result' | 'input';

// 盤點數據類型
interface CountData {
  plt_num: string;
  product_code: string;
  product_desc: string;
  remain_qty: number;
  current_remain_qty?: number;
  need_input?: boolean;
}

export default function AdminStockCountPage() {
  const [state, setState] = useState<CountState>('form');
  const [countData, setCountData] = useState<CountData | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 處理表單提交
  const handleFormSubmit = async (formData: {
    qrCode?: string;
    pallet?: string;
    productCode?: string;
    quantity?: number;
  }) => {
    setIsLoading(true);

    try {
      let requestBody: Record<string, unknown> = {};

      if (formData.qrCode) {
        // QR掃描模式
        requestBody = { qrCode: formData.qrCode };
      } else {
        // 手動輸入模式
        requestBody = {
          plt_num: formData.pallet,
          product_code: formData.productCode,
          counted_qty: formData.quantity,
        };
      }

      const response = await fetch('/api/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Processing failed');
        return;
      }

      // 設置結果數據
      const data: CountData = {
        plt_num: result.data.plt_num,
        product_code: result.data.product_code,
        product_desc: result.data.product_desc,
        remain_qty: result.data.remain_qty || 0,
        current_remain_qty: result.data.current_remain_qty,
        need_input: result.data.need_input,
      };

      setCountData(data);

      if (data.need_input) {
        setState('input');
        if (result.data.is_first_count) {
          toast.info(
            `First count for ${data.product_code}. Current stock: ${data.current_remain_qty}`
          );
        }
      } else {
        setState('result');
        toast.success('Count recorded successfully!');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred during processing');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理數量提交
  const handleQuantitySubmit = async () => {
    if (!countData || !countedQuantity) return;

    const countedQty = parseInt(countedQuantity);
    if (isNaN(countedQty) || countedQty < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plt_num: countData.plt_num,
          product_code: countData.product_code,
          counted_qty: countedQty,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Count submission failed');
        return;
      }

      setCountData(prev =>
        prev
          ? {
              ...prev,
              remain_qty: result.data.remain_qty,
              product_desc: result.data.product_desc || prev.product_desc,
              need_input: false,
            }
          : null
      );

      setState('result');
      setCountedQuantity('');
      toast.success('Count recorded successfully!');
    } catch (error) {
      console.error('Quantity submit error:', error);
      toast.error('An error occurred during count submission');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置到初始狀態
  const handleReset = () => {
    setState('form');
    setCountData(null);
    setCountedQuantity('');
  };

  return (
    <StarfieldBackground>
      <PageErrorBoundary pageName='StockCount'>
        <div className='text-white'>
          <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
            <div className='space-y-8'>
              {/* 表單區域 */}
              {state === 'form' && (
                <StockCountForm onSubmit={handleFormSubmit} isLoading={isLoading} />
              )}

              {/* 結果顯示區域 */}
              {(state === 'result' || state === 'input') && countData && (
                <ScanResult
                  data={countData}
                  countedQuantity={countedQuantity}
                  onQuantityChange={setCountedQuantity}
                  onQuantitySubmit={handleQuantitySubmit}
                  onReset={handleReset}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </PageErrorBoundary>
    </StarfieldBackground>
  );
}
