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
  const handleNumberClick = useCallback((num: string) => {
    if (value.length < 10) { // 限制最大長度
      setValue(prev => prev + num);
    }
  }, [value.length]);

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

  // 處理鍵盤輸入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      
      // 數字鍵 (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      }
      // 數字鍵盤的數字鍵
      else if (e.code >= 'Numpad0' && e.code <= 'Numpad9') {
        e.preventDefault();
        const num = e.code.slice(-1);
        handleNumberClick(num);
      }
      // Enter 鍵確認
      else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
      // Escape 鍵取消
      else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Backspace 或 Delete 鍵
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleBackspace();
      }
      // C 或 c 鍵清除
      else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, isLoading, handleClear, handleConfirm, handleNumberClick, handleBackspace, onCancel]);

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
      className="p-6 max-w-sm mx-auto w-full"
    >
        {/* 標題 */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Enter Counted Quantity</h3>
          <p className="text-slate-400 text-sm">Input the actual quantity for this pallet</p>
          {/* 快捷鍵提示 - 只在非觸控裝置顯示 */}
          <div className="hidden sm:flex justify-center gap-4 mt-3 text-xs text-slate-500">
            <span>Enter: Confirm</span>
            <span>Esc: Cancel</span>
            <span>C: Clear</span>
          </div>
        </div>

        {/* 顯示區域 - 可輸入的文字框 */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-6">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleInputChange}
            placeholder="0"
            className="w-full text-right text-2xl font-mono text-white bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        {/* 數字鍵盤 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {numbers.slice(0, 9).map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNumberClick(num)}
              className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold py-4 text-lg rounded-lg transition-colors select-none touch-manipulation"
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
            className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold py-4 text-lg rounded-lg transition-colors select-none touch-manipulation"
            disabled={isLoading}
          >
            C
          </motion.button>
          
          {/* 0 按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberClick('0')}
            className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold py-4 text-lg rounded-lg transition-colors select-none touch-manipulation"
            disabled={isLoading}
          >
            0
          </motion.button>
          
          {/* 退格按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackspace}
            className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold py-4 text-lg rounded-lg transition-colors flex items-center justify-center select-none touch-manipulation"
            disabled={isLoading}
          >
            <BackspaceIcon className="h-6 w-6" />
          </motion.button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <XMarkIcon className="h-5 w-5" />
            Cancel
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !value}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckIcon className="h-5 w-5" />
            )}
            Confirm
          </motion.button>
        </div>
    </motion.div>
  );
} 