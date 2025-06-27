'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCodeIcon, CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';

interface ScanToStartProps {
  onScanSuccess: (qrCode: string) => void;
  isLoading?: boolean;
}

export default function ScanToStart({ onScanSuccess, isLoading = false }: ScanToStartProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Handle scan results
  const handleScan = (result: string) => {
    setShowScanner(false);
    onScanSuccess(result);
  };

  // Close scanner
  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // Handle manual input submit
  const handleManualSubmit = (e: React.FormEvent) => {
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl"
      >
        {!showManualInput ? (
          <div className="flex flex-col items-center">
            {/* Icon and Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent text-center">
                Scan To Start
              </h2>
            </div>

            {/* Description */}
            <div className="text-center mb-8 max-w-md">
              <p className="text-slate-300 text-lg mb-2">
                Scan the QR code on the pallet label to begin counting
              </p>
              <p className="text-slate-400 text-sm">
                Position the QR code within the camera viewfinder
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              {/* Scan Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowScanner(true)}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CameraIcon className="h-6 w-6" />
                    Start Scanning
                  </>
                )}
              </motion.button>

              {/* Manual Input Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowManualInput(true)}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="h-6 w-6" />
                Manual Input
              </motion.button>
            </div>
          </div>
        ) : (
          /* Manual Input Form */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <PencilSquareIcon className="h-8 w-8 text-green-400 mr-3" />
                <h2 className="text-xl font-bold text-white">Manual Pallet Number Input</h2>
              </div>
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setInputValue('');
                  setError('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
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
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
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
                <button
                  type="button"
                  onClick={() => {
                    setShowManualInput(false);
                    setInputValue('');
                    setError('');
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* 說明 */}
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                💡 Manual input only accepts pallet numbers. Series can only be read by scanning QR codes.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* QR Scanner */}
      {showScanner && (
        <SimpleQRScanner
          open={showScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Scan Pallet QR Code"
        />
      )}
    </>
  );
} 