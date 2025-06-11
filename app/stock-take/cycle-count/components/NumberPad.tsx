'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon, BackspaceIcon } from '@heroicons/react/24/outline';

interface NumberPadProps {
  onConfirm: (value: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NumberPad({ onConfirm, onCancel, isLoading = false }: NumberPadProps) {
  const [value, setValue] = useState('');

  // 處理數字輸入
  const handleNumberClick = (num: string) => {
    if (value.length < 10) { // 限制最大長度
      setValue(prev => prev + num);
    }
  };

  // 處理退格
  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  // 處理確認
  const handleConfirm = () => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onConfirm(numValue);
    }
  };

  // 處理清除
  const handleClear = () => {
    setValue('');
  };

  // 數字按鈕
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
      >
        {/* 標題 */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Enter Counted Quantity</h3>
          <p className="text-slate-400 text-sm">Input the actual quantity for this pallet</p>
        </div>

        {/* 顯示區域 */}
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-6">
          <div className="text-right">
            <span className="text-2xl font-mono text-white">
              {value || '0'}
            </span>
          </div>
        </div>

        {/* 數字鍵盤 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {numbers.slice(0, 9).map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNumberClick(num)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
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
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
            disabled={isLoading}
          >
            C
          </motion.button>
          
          {/* 0 按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberClick('0')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
            disabled={isLoading}
          >
            0
          </motion.button>
          
          {/* 退格按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackspace}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
            disabled={isLoading}
          >
            <BackspaceIcon className="h-5 w-5" />
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
    </div>
  );
} 