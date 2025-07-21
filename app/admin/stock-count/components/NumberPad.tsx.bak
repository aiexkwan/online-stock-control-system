'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon, BackspaceIcon } from '@heroicons/react/24/outline';

interface NumberPadProps {
  onConfirm: (value: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NumberPad({ onConfirm, onCancel, isLoading = false }: NumberPadProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 處理數字輸入
  const handleNumberClick = useCallback(
    (num: string) => {
      if (value.length < 10) {
        // 限制最大長度
        setValue(prev => prev + num);
      }
    },
    [value.length]
  );

  // 處理退格
  const handleBackspace = useCallback(() => {
    setValue(prev => prev.slice(0, -1));
  }, []);

  // 處理確認
  const handleConfirm = useCallback(() => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onConfirm(numValue);
    }
  }, [value, onConfirm]);

  // 處理清除
  const handleClear = useCallback(() => {
    setValue('');
  }, []);

  // Focus 輸入框當組件載入
  useEffect(() => {
    // 延遲一下確保動畫完成
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // 鍵盤事件處理器已移除

  // 處理輸入框變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, ''); // 只允許數字
    if (newValue.length <= 10) {
      setValue(newValue);
    }
  };

  // 數字按鈕
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className='mx-auto w-full max-w-sm p-6'
    >
      {/* 標題 */}
      <div className='mb-6 text-center'>
        <h3 className='mb-2 text-xl font-bold text-white'>Enter Counted Quantity</h3>
        <p className='text-sm text-slate-400'>Input the actual quantity for this pallet</p>
        {/* 快捷鍵提示已移除 */}
      </div>

      {/* 顯示區域 - 可輸入的文字框 */}
      <div className='mb-6 rounded-lg border border-slate-600 bg-slate-900 p-4'>
        <input
          ref={inputRef}
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          value={value}
          onChange={handleInputChange}
          placeholder='0'
          className='w-full rounded bg-transparent text-right font-mono text-2xl text-white outline-none focus:ring-2 focus:ring-blue-500'
          disabled={isLoading}
          autoComplete='off'
        />
      </div>

      {/* 數字鍵盤 */}
      <div className='mb-6 grid grid-cols-3 gap-3'>
        {numbers.slice(0, 9).map((num: string) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberClick(num)}
            className='touch-manipulation select-none rounded-lg bg-slate-700 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-600 active:bg-slate-500'
            disabled={isLoading}
          >
            {num}
          </motion.button>
        ))}

        {/* 清除按鈕 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClear}
          className='touch-manipulation select-none rounded-lg bg-slate-700 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-600 active:bg-slate-500'
          disabled={isLoading}
        >
          C
        </motion.button>

        {/* 0 按鈕 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNumberClick('0')}
          className='touch-manipulation select-none rounded-lg bg-slate-700 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-600 active:bg-slate-500'
          disabled={isLoading}
        >
          0
        </motion.button>

        {/* 退格按鈕 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackspace}
          className='flex touch-manipulation select-none items-center justify-center rounded-lg bg-slate-700 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-600 active:bg-slate-500'
          disabled={isLoading}
        >
          <BackspaceIcon className='h-6 w-6' />
        </motion.button>
      </div>

      {/* 操作按鈕 */}
      <div className='flex gap-3'>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700'
          disabled={isLoading}
        >
          <XMarkIcon className='h-5 w-5' />
          Cancel
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
          disabled={isLoading || !value}
        >
          {isLoading ? (
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
          ) : (
            <CheckIcon className='h-5 w-5' />
          )}
          Confirm
        </motion.button>
      </div>
    </motion.div>
  );
}
