'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';
import { QrScanner } from '@/components/qr-scanner/qr-scanner';

interface ScanToStartProps {
  onScanSuccess: (qrCode: string) => void;
  isLoading?: boolean;
}

export default function ScanToStart({ onScanSuccess, isLoading = false }: ScanToStartProps) {
  const [showScanner, setShowScanner] = useState(false);

  // 處理掃描結果
  const handleScan = (result: string) => {
    setShowScanner(false);
    onScanSuccess(result);
  };

  // 關閉掃描器
  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl"
      >
        <div className="flex flex-col items-center">
          {/* 圖標和標題 */}
          <div className="mb-6">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full mb-4"
            >
              <QrCodeIcon className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent text-center">
              Scan To Start
            </h2>
          </div>

          {/* 說明文字 */}
          <div className="text-center mb-8 max-w-md">
            <p className="text-slate-300 text-lg mb-2">
              Scan the QR code on the pallet label to begin counting
            </p>
            <p className="text-slate-400 text-sm">
              Position the QR code within the camera viewfinder
            </p>
          </div>

          {/* 掃描按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowScanner(true)}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
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

          {/* 提示信息 */}
          <div className="mt-8 bg-slate-900/50 border border-slate-600/50 rounded-lg p-4 max-w-md">
            <h3 className="text-sm font-semibold text-white mb-2">Instructions:</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Ensure good lighting for scanning</li>
              <li>• Hold the device steady</li>
              <li>• Keep QR code within the frame</li>
              <li>• Allow camera permissions when prompted</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* QR 掃描器 */}
      {showScanner && (
        <QrScanner
          open={showScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Scan Pallet QR Code"
          hint="Position the QR code within the viewfinder"
        />
      )}
    </>
  );
} 