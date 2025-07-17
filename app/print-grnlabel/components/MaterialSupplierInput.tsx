'use client';

import React, { useState, useEffect, useRef } from 'react';
import { validateSupplierCode } from '@/app/actions/grnActions';

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
  className = '',
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
    (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[MaterialSupplierInput] Starting search for:', trimmedValue);
    setIsLoading(true);
    setSupplierError(null);

    // 創建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[MaterialSupplierInput] Calling validateSupplierCode for:', trimmedValue);

      // 使用 Server Action 進行供應商驗證
      const result = await validateSupplierCode(trimmedValue);

      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[MaterialSupplierInput] Search result:', result);

      // 檢查是否被取消
      if (abortController.signal.aborted) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[MaterialSupplierInput] Search was aborted');
        return;
      }

      if (!result.success || !result.data) {
        // 找不到供應商
        onSupplierInfoChange(null);
        setSupplierError(result.error || `Supplier Code ${trimmedValue} Not Found`);
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[MaterialSupplierInput] Supplier not found:', trimmedValue);
      } else {
        // 找到供應商
        const supplierData = result.data;
        onSupplierInfoChange(supplierData);
        onChange(supplierData.supplier_code); // 使用資料庫中的標準化代碼
        setSupplierError(null);
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[MaterialSupplierInput] Supplier found:', supplierData);
      }
    } catch (error: any) {
      // 如果是取消請求，不處理
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[MaterialSupplierInput] Search cancelled or aborted');
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
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[MaterialSupplierInput] Search completed, loading state cleared');
      }
    }
  };

  // 處理 blur 事件
  const handleBlur = () => {
    if (value.trim()) {
      searchSupplierCode(value);
    }
  };

  // 處理 Enter 鍵提交
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        searchSupplierCode(value);
      }
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
      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[MaterialSupplierInput] Input cleared, resetting supplier info');
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className='mb-1 block text-sm text-gray-300'>
          Material Supplier
          {required && <span className='ml-1 text-red-400'>*</span>}
        </label>
      )}
      <div className='relative'>
        <input
          type='text'
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            supplierError ? 'border-red-500 focus:ring-red-500' : 'border-gray-700'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          required={required}
          placeholder='Enter supplier code'
        />
        {isLoading && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        )}
      </div>

      {supplierError && (
        <div className='mt-1 text-sm font-semibold text-red-500'>{supplierError}</div>
      )}
    </div>
  );
};

MaterialSupplierInput.displayName = 'MaterialSupplierInput';

export default MaterialSupplierInput;