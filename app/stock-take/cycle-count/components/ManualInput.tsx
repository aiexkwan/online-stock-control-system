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
      setError('Please enter pallet number');
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


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center mb-6">
        <PencilSquareIcon className="h-8 w-8 text-green-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Manual Pallet Number Input</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="qr-input" className="block text-sm font-medium text-gray-300 mb-2">
            Enter Pallet Number:
          </label>
          <input
            id="qr-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="e.g.: 241224/01"
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
              Processing...
            </>
          ) : (
            <>
              <QrCodeIcon className="h-5 w-5 mr-2" />
              Submit Pallet Number
            </>
          )}
        </button>
      </form>


      {/* 說明 */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-blue-200 text-sm">
          💡 Manual input only accepts pallet numbers. Series can only be read by scanning QR codes.
        </p>
      </div>
    </motion.div>
  );
} 