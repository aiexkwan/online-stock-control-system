'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { createClient } from '@/app/utils/supabase/client';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

interface ProductCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  onQuantityChange?: (quantity: string) => void;
  disabled?: boolean;
  required?: boolean;
  userId?: string; // Keep for backward compatibility
  showLabel?: boolean; // Add prop to control label visibility
  className?: string; // Add className prop
}

export const ProductCodeInput: React.FC<ProductCodeInputProps> = ({
  value,
  onChange,
  onBlur,
  onProductInfoChange,
  onQuantityChange,
  disabled = false,
  required = true,
  userId, // Keep for backward compatibility but not used
  showLabel = true, // Default to true for backward compatibility
  className = '',
}) => {
  const [productError, setProductError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理函數
  useEffect(() => {
    return () => {
      // 組件卸載時取消任何進行中的請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 簡化的搜尋函數 - 每次都是獨立搜尋，無需記憶
  const searchProductCode = async (searchValue: string) => {
    const trimmedValue = searchValue.trim();

    // 空值處理
    if (!trimmedValue) {
      // 取消任何進行中的搜尋
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      onProductInfoChange(null);
      setProductError(null);
      setIsLoading(false);
      return;
    }

    // 移除重複搜尋檢查 - 每次觸發都執行搜尋，確保用戶體驗一致
    // 原邏輯: if (trimmedValue === lastSearchValue && !productError && !isLoading) return;
    // 問題: 用戶輸入 TAV1 → 修改為 TAV2 → 又改回 TAV1 時，搜尋會被跳過

    // 取消之前的搜尋
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 開始搜尋
    (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[ProductCodeInput] Starting search for:', trimmedValue);
    setIsLoading(true);
    setProductError(null);

    // 創建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[ProductCodeInput] Creating Supabase client...');
      const client = createClient();

      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[ProductCodeInput] Executing query for:', trimmedValue);

      // 直接查詢 data_code 表，不需要 RPC
      const { data, error } = await client
        .from('data_code')
        .select('code, description, standard_qty, type, remark')
        .ilike('code', trimmedValue)
        .single();

      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[ProductCodeInput] Search result:', { data, error });

      // 檢查是否被取消
      if (abortController.signal.aborted) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[ProductCodeInput] Search was aborted');
        return;
      }

      if (error || !data) {
        // 找不到產品
        onProductInfoChange(null);
        setProductError(`Product Code ${trimmedValue} Not Found`);
        setIsLoading(false); // 確保清除 loading 狀態
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[ProductCodeInput] Product not found:', trimmedValue);
      } else {
        // 找到產品 - 恢復完整資料以支援 QCLabelCard 和 GRNLabelCard
        const productData: ProductInfo = {
          code: data.code,
          description: data.description,
          standard_qty: data.standard_qty.toString(),
          type: data.type,
          remark: data.remark || '-',
        };
        onProductInfoChange(productData);
        onChange(productData.code); // 使用資料庫中的標準化代碼
        setProductError(null);
        setIsLoading(false); // 確保清除 loading 狀態
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[ProductCodeInput] Product found:', productData);

        // 自動填充數量（如果有）
        if (productData.standard_qty && onQuantityChange) {
          onQuantityChange(productData.standard_qty);
        }
      }
    } catch (searchError: unknown) {
      // 如果是取消請求，不處理
      if ((searchError as Error).name === 'AbortError' || abortController.signal.aborted) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[ProductCodeInput] Search cancelled or aborted');
        return;
      }

      console.error('[ProductCodeInput] Search error:', searchError);
      onProductInfoChange(null);

      if (getErrorMessage(searchError)?.includes('aborted')) {
        // 被取消的請求，不顯示錯誤
        return;
      } else {
        setProductError('Search failed. Please try again.');
        setIsLoading(false); // 確保清除 loading 狀態
      }
    } finally {
      // 清理 abortController 引用
      if (abortControllerRef.current === abortController) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[ProductCodeInput] Search completed');
      }
    }
  };

  // 處理 blur 事件
  const handleBlur = () => {
    // 只有當輸入欄有值時才搜尋
    if (value.trim()) {
      searchProductCode(value);
    } else {
      // 輸入欄冇值，確保清除所有狀態
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      setProductError(null);
      onProductInfoChange(null);
    }

    // 呼叫父組件的 onBlur（如果有）
    if (onBlur) {
      onBlur();
    }
  };

  // 處理 Enter 鍵提交
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        searchProductCode(value);
      }
    }
  };

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // 清除錯誤訊息
    if (productError) {
      setProductError(null);
    }

    // 當輸入框被清空時，只係清理狀態，唔觸發搜尋
    if (!newValue.trim()) {
      // 取消任何進行中的搜尋
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // 立即清除載入狀態
      setIsLoading(false);
      // 注意：唔喺呢度 call onProductInfoChange，等 onBlur 處理
      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[ProductCodeInput] Input cleared, cancelling any pending searches');
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className='mb-1 block text-sm text-gray-300'>
          Product Code
          {required && <span className='ml-1 text-red-400'>*</span>}
        </label>
      )}
      <div className='relative'>
        <input
          type='text'
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            productError ? 'border-red-500 focus:ring-red-500' : 'border-gray-700'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          required={required}
          placeholder='Enter product code'
        />
        {isLoading && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        )}
      </div>

      {productError && (
        <div className='mt-1 text-sm font-semibold text-red-500'>{productError}</div>
      )}
    </div>
  );
};

ProductCodeInput.displayName = 'ProductCodeInput';

export default ProductCodeInput;
