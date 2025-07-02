'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

interface MaterialSupplierInputProps {
  value: string;
  onChange: (value: string) => void;
  onSupplierInfoChange: (supplierInfo: SupplierInfo | null) => void;
  disabled?: boolean;
  required?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const MaterialSupplierInput: React.FC<MaterialSupplierInputProps> = ({
  value,
  onChange,
  onSupplierInfoChange,
  disabled = false,
  required = true,
  showLabel = true,
  className = ''
}) => {
  const [supplierError, setSupplierError] = useState<string | null>(null);
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

  // 搜尋供應商代碼
  const searchSupplierCode = async (searchValue: string) => {
    const trimmedValue = searchValue.trim();
    
    // 空值處理
    if (!trimmedValue) {
      onSupplierInfoChange(null);
      setSupplierError(null);
      setIsLoading(false);
      return;
    }

    // 取消之前的搜尋
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 開始搜尋
    process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Starting search for:', trimmedValue);
    setIsLoading(true);
    setSupplierError(null);

    // 創建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Creating Supabase client...');
      const client = createClient();
      
      process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Executing query for:', trimmedValue);
      
      // 設置超時機制 - 10秒後自動取消
      const timeoutId = setTimeout(() => {
        if (abortController === abortControllerRef.current) {
          abortController.abort();
          process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Search timeout after 10 seconds');
        }
      }, 10000);

      // 使用 RPC 函數進行供應商搜尋
      const { data, error } = await client
        .rpc('search_supplier_code', { 
          p_code: trimmedValue 
        })
        .abortSignal(abortController.signal);

      // 清除超時
      clearTimeout(timeoutId);

      process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Search result:', { data, error });

      // 檢查是否被取消
      if (abortController.signal.aborted) {
        process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Search was aborted');
        return;
      }

      if (error || !data) {
        // 找不到供應商
        onSupplierInfoChange(null);
        setSupplierError(`Supplier Code ${trimmedValue} Not Found`);
        process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Supplier not found:', trimmedValue);
      } else {
        // 找到供應商 - RPC 函數返回 JSON
        const supplierData = data as SupplierInfo;
        onSupplierInfoChange(supplierData);
        onChange(supplierData.supplier_code); // 使用資料庫中的標準化代碼
        setSupplierError(null);
        process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Supplier found:', supplierData);
      }
    } catch (error: any) {
      // 如果是取消請求，不處理
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Search cancelled or aborted');
        return;
      }
      
      console.error('[MaterialSupplierInput] Search error:', error);
      onSupplierInfoChange(null);
      
      if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        setSupplierError('Search timeout. Please try again.');
      } else {
        setSupplierError('Search failed. Please try again.');
      }
    } finally {
      // 只有在沒有被取消的情況下才清除 loading 狀態
      if (abortControllerRef.current === abortController && !abortController.signal.aborted) {
        setIsLoading(false);
        process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Search completed, loading state cleared');
      }
    }
  };

  // 處理 blur 事件
  const handleBlur = () => {
    if (value.trim()) {
      searchSupplierCode(value);
    }
  };

  // 處理 Enter 和 Tab 鍵
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && value.trim() && !isLoading) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      searchSupplierCode(value);
    }
  };

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // 清除錯誤訊息
    if (supplierError) {
      setSupplierError(null);
    }
    
    // 當輸入框被清空時，重置 supplierInfo
    if (!newValue.trim()) {
      onSupplierInfoChange(null);
      process.env.NODE_ENV !== "production" && console.log('[MaterialSupplierInput] Input cleared, resetting supplier info');
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm text-gray-300 mb-1">
          Material Supplier
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 ${
            supplierError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          required={required}
          placeholder="Enter supplier code"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {supplierError && (
        <div className="text-red-500 text-sm font-semibold mt-1">
          {supplierError}
        </div>
      )}
    </div>
  );
};

MaterialSupplierInput.displayName = 'MaterialSupplierInput';

export default MaterialSupplierInput; 