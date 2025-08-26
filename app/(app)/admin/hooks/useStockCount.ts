'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Count state types
export type CountState = 'form' | 'result' | 'input';

// Count data interface
export interface CountData {
  plt_num: string;
  product_code: string;
  product_desc: string;
  remain_qty: number;
  current_remain_qty?: number;
  need_input?: boolean;
  is_first_count?: boolean;
  counted_qty?: number;
}

// Form data interface
export interface StockCountFormData {
  qrCode?: string;
  pallet?: string;
  productCode?: string;
  quantity?: number;
}

// Hook return interface
export interface UseStockCountReturn {
  state: CountState;
  countData: CountData | null;
  countedQuantity: string;
  isLoading: boolean;
  error: string | null;
  mode: 'scan' | 'manual';
  setMode: (mode: 'scan' | 'manual') => void;
  setCountedQuantity: (value: string) => void;
  handleFormSubmit: (formData: StockCountFormData) => Promise<void>;
  handleQuantitySubmit: () => Promise<void>;
  handleReset: () => void;
  clearError: () => void;
}

export function useStockCount(): UseStockCountReturn {
  const [state, setState] = useState<CountState>('form');
  const [countData, setCountData] = useState<CountData | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle form submission (QR scan or manual input)
  const handleFormSubmit = useCallback(async (formData: StockCountFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      let requestBody: Record<string, unknown> = {};

      if (formData.qrCode) {
        // QR scan mode
        requestBody = { qrCode: formData.qrCode };
      } else {
        // Manual input mode
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
        const errorMessage = result.error || 'Processing failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Set result data
      const data: CountData = {
        plt_num: result.data.plt_num,
        product_code: result.data.product_code,
        product_desc: result.data.product_desc,
        remain_qty: result.data.remain_qty || 0,
        current_remain_qty: result.data.current_remain_qty,
        need_input: result.data.need_input,
        is_first_count: result.data.is_first_count,
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
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = 'An error occurred during processing';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle quantity submission
  const handleQuantitySubmit = useCallback(async () => {
    if (!countData || !countedQuantity) return;

    const countedQty = parseInt(countedQuantity);
    if (isNaN(countedQty) || countedQty < 0) {
      const errorMessage = 'Please enter a valid quantity';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

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
        const errorMessage = result.error || 'Count submission failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setCountData({
        ...countData,
        remain_qty: result.data.remain_qty,
        product_desc: result.data.product_desc || countData.product_desc,
        counted_qty: countedQty,
        need_input: false,
      });

      setState('result');
      setCountedQuantity('');
      toast.success('Count recorded successfully!');
    } catch (err) {
      console.error('Quantity submit error:', err);
      const errorMessage = 'An error occurred during count submission';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [countData, countedQuantity]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setState('form');
    setCountData(null);
    setCountedQuantity('');
    setError(null);
    // Keep the mode as is for user convenience
  }, []);

  return {
    state,
    countData,
    countedQuantity,
    isLoading,
    error,
    mode,
    setMode,
    setCountedQuantity,
    handleFormSubmit,
    handleQuantitySubmit,
    handleReset,
    clearError,
  };
}
