'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PencilSquareIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface ManualInputProps {
  onScanSuccess: (qrCode: string) => void;
  isLoading: boolean;
}

export default function ManualInput({ onScanSuccess, isLoading }: ManualInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      setError('請輸入 QR Code 內容');
      return;
    }

    setError('');
    onScanSuccess(inputValue.trim());
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError('');
  };

  // 示例 QR Code 格式
  const exampleFormats = [
    'PLT240001',
    'PLT240002', 
    'PLT240003'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center mb-6">
        <PencilSquareIcon className="h-8 w-8 text-green-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Manual QR Code Input</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="qr-input" className="block text-sm font-medium text-gray-300 mb-2">
            輸入 QR Code 內容：
          </label>
          <input
            id="qr-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="例如: PLT240001"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              處理中...
            </>
          ) : (
            <>
              <QrCodeIcon className="h-5 w-5 mr-2" />
              提交 QR Code
            </>
          )}
        </button>
      </form>

      {/* 示例格式 */}
      <div className="mt-6 p-4 bg-slate-900/30 rounded-lg">
        <h3 className="text-white font-semibold mb-2">示例格式：</h3>
        <div className="space-y-2">
          {exampleFormats.map((format, index) => (
            <button
              key={index}
              onClick={() => setInputValue(format)}
              className="block w-full text-left text-sm text-gray-300 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 px-3 py-2 rounded transition-colors"
              disabled={isLoading}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* 說明 */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-blue-200 text-sm">
          💡 如果相機無法使用，您可以手動輸入 QR Code 內容進行測試。
          通常 Pallet Label 的 QR Code 格式為 "PLT" 開頭加上數字。
        </p>
      </div>
    </motion.div>
  );
} 