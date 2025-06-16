'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  onQuantityChange?: (quantity: string) => void;
  disabled?: boolean;
  required?: boolean;
  userId?: string; // Keep for backward compatibility
}

export const ProductCodeInput: React.FC<ProductCodeInputProps> = ({
  value,
  onChange,
  onProductInfoChange,
  onQuantityChange,
  disabled = false,
  required = true,
  userId // Keep for backward compatibility but not used
}) => {
  const [productError, setProductError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchValue, setLastSearchValue] = useState<string>('');
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
      onProductInfoChange(null);
      setProductError(null);
      setIsLoading(false);
      setLastSearchValue('');
      return;
    }

    // 避免重複搜尋相同的值
    if (trimmedValue === lastSearchValue && !productError) {
      console.log('[ProductCodeInput] Skipping duplicate search for:', trimmedValue);
      return;
    }

    // 取消之前的搜尋
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 開始搜尋
    console.log('[ProductCodeInput] Starting search for:', trimmedValue);
    setIsLoading(true);
    setProductError(null);
    setLastSearchValue(trimmedValue);

    // 創建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log('[ProductCodeInput] Creating Supabase client...');
      const client = createClient();
      
      console.log('[ProductCodeInput] Executing query for:', trimmedValue);
      // 直接搜尋 data_code 表 - 使用 ilike 進行不區分大小寫的搜尋
      const { data, error } = await client
        .from('data_code')
        .select('code, description, standard_qty, type, remark')
        .ilike('code', trimmedValue)
        .single();

      console.log('[ProductCodeInput] Search result:', { data, error });

      if (error || !data) {
        // 找不到產品
        onProductInfoChange(null);
        setProductError(`Product Code ${trimmedValue} Not Found`);
        console.log('[ProductCodeInput] Product not found:', trimmedValue);
      } else {
        // 找到產品
        const productData = data as ProductInfo;
        onProductInfoChange(productData);
        onChange(productData.code); // 使用資料庫中的標準化代碼
        setProductError(null);
        console.log('[ProductCodeInput] Product found:', productData);
        
        // 自動填充數量（如果有）
        if (productData.standard_qty && onQuantityChange) {
          onQuantityChange(productData.standard_qty);
        }
      }
    } catch (error: any) {
      // 如果是取消請求，不處理
      if (error.name === 'AbortError') {
        console.log('[ProductCodeInput] Search cancelled');
        return;
      }
      
      console.error('[ProductCodeInput] Search error:', error);
      onProductInfoChange(null);
      
      if (error.message === 'Search timeout') {
        setProductError('Search timeout. Please try again.');
      } else {
        setProductError('Search failed. Please try again.');
      }
    } finally {
      // 只有在沒有被取消的情況下才清除 loading 狀態
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        console.log('[ProductCodeInput] Search completed, loading state cleared');
      }
    }
  };

  // 處理 blur 事件
  const handleBlur = () => {
    if (value.trim()) {
      searchProductCode(value);
    }
  };

  // 處理 Enter 和 Tab 鍵
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && value.trim() && !isLoading) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      searchProductCode(value);
    }
  };

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // 清除錯誤訊息和重置搜尋狀態
    if (productError) {
      setProductError(null);
    }
    // 如果用戶正在輸入，重置最後搜尋值
    if (e.target.value !== value) {
      setLastSearchValue('');
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">
        Product Code
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            productError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          required={required}
          placeholder="Enter product code"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {productError && (
        <div className="text-red-500 text-sm font-semibold mt-1">
          {productError}
        </div>
      )}
    </div>
  );
};

ProductCodeInput.displayName = 'ProductCodeInput';

export default ProductCodeInput; 