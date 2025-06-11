'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';
import { QrScanner } from '@/components/qr-scanner/qr-scanner';
import { SimpleQrScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { DirectQrScanner } from '@/components/qr-scanner/direct-qr-scanner';
import { Html5QrScanner } from '@/components/qr-scanner/html5-qr-scanner';
import { SafariOptimizedScanner } from '@/components/qr-scanner/safari-optimized-scanner';
import { MinimalCameraTest } from '@/components/qr-scanner/minimal-camera-test';
import { TestCamera } from '@/components/qr-scanner/test-camera';

interface ScanToStartProps {
  onScanSuccess: (qrCode: string) => void;
  isLoading?: boolean;
}

export default function ScanToStart({ onScanSuccess, isLoading = false }: ScanToStartProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [showSimpleScanner, setShowSimpleScanner] = useState(false);
  const [showDirectScanner, setShowDirectScanner] = useState(false);
  const [showHtml5Scanner, setShowHtml5Scanner] = useState(false);
  const [showSafariScanner, setShowSafariScanner] = useState(false);
  const [showMinimalTest, setShowMinimalTest] = useState(false);
  const [showTestCamera, setShowTestCamera] = useState(false);

  // 處理掃描結果
  const handleScan = (result: string) => {
    setShowScanner(false);
    setShowSimpleScanner(false);
    setShowDirectScanner(false);
    setShowHtml5Scanner(false);
    setShowSafariScanner(false);
    setShowMinimalTest(false);
    setShowTestCamera(false);
    onScanSuccess(result);
  };

  // 關閉掃描器
  const handleCloseScanner = () => {
    setShowScanner(false);
    setShowSimpleScanner(false);
    setShowDirectScanner(false);
    setShowHtml5Scanner(false);
    setShowSafariScanner(false);
    setShowMinimalTest(false);
    setShowTestCamera(false);
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
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMinimalTest(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  🚨 Minimal Test
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSafariScanner(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  Safari Scanner 📱✨
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTestCamera(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  Test Camera 🧪
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHtml5Scanner(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  HTML5 Scanner 🚀
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDirectScanner(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  Direct Scanner ⭐
                </>
              )}
            </motion.button>

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
                  Advanced Scanner
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSimpleScanner(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="h-6 w-6" />
                  Simple Scanner
                </>
              )}
            </motion.button>
          </div>

          {/* 提示信息 */}
          <div className="mt-8 bg-slate-900/50 border border-slate-600/50 rounded-lg p-4 max-w-md">
            <h3 className="text-sm font-semibold text-white mb-2">Scanner Options:</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• <strong>🚨 Minimal Test:</strong> <span className="text-red-400">最簡化測試 - 繞過所有權限問題</span></li>
              <li>• <strong>Safari Scanner 📱✨:</strong> <span className="text-green-400">Optimized for iPhone/Safari</span></li>
              <li>• <strong>Test Camera 🧪:</strong> Shows camera + simulate scan</li>
              <li>• <strong>HTML5 Scanner 🚀:</strong> Pure HTML5 - No external libraries</li>
              <li>• <strong>Direct Scanner ⭐:</strong> Direct camera access</li>
              <li>• <strong>Advanced Scanner:</strong> Full-featured with device selection</li>
              <li>• <strong>Simple Scanner:</strong> Basic fallback option</li>
              <li>• Ensure good lighting for scanning</li>
              <li>• Allow camera permissions when prompted</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* 測試相機 */}
      {showTestCamera && (
        <TestCamera
          open={showTestCamera}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Test Camera"
          hint="This will show if camera access works"
        />
      )}

      {/* HTML5 QR 掃描器 */}
      {showHtml5Scanner && (
        <Html5QrScanner
          open={showHtml5Scanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="HTML5 QR Scanner"
          hint="Position the QR code within the viewfinder"
        />
      )}

      {/* 直接 QR 掃描器 */}
      {showDirectScanner && (
        <DirectQrScanner
          open={showDirectScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Direct QR Scanner"
          hint="Position the QR code within the viewfinder"
        />
      )}

      {/* QR 掃描器 */}
      {showScanner && (
        <QrScanner
          open={showScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Advanced QR Scanner"
          hint="Position the QR code within the viewfinder"
        />
      )}

      {/* 簡單 QR 掃描器 */}
      {showSimpleScanner && (
        <SimpleQrScanner
          open={showSimpleScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Simple QR Scanner"
          hint="Position the QR code within the viewfinder"
        />
      )}

      {/* Safari 優化掃描器 */}
      {showSafariScanner && (
        <SafariOptimizedScanner
          open={showSafariScanner}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="Safari Optimized Scanner"
          hint="Specially designed for iPhone Safari - Position QR code clearly"
        />
      )}

      {/* 最簡化相機測試 */}
      {showMinimalTest && (
        <MinimalCameraTest
          open={showMinimalTest}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title="🚨 Minimal Camera Test - 最簡化測試"
        />
      )}
    </>
  );
} 