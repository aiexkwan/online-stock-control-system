'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MotionBackground from '@/app/components/MotionBackground';
import StockTakeNav from '../components/StockTakeNav';
import ScanToStart from './components/ScanToStart';
import RemainToCount from './components/RemainToCount';
import NumberPad from './components/NumberPad';
import BasicCameraTest from './components/BasicCameraTest';
import CameraTest from './components/CameraTest';
import ManualInput from './components/ManualInput';
import DetailedDiagnostic from './components/DetailedDiagnostic';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

// 定義狀態類型
type CountState = 'initial' | 'scanning' | 'counting' | 'need_input';

// 定義盤點數據類型
interface CountData {
  plt_num: string;
  product_code: string;
  product_desc: string;
  remain_qty: number;
  current_remain_qty?: number;
}

export default function CycleCountPage() {
  const [state, setState] = useState<CountState>('initial');
  const [countData, setCountData] = useState<CountData | null>(null);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [showBasicCameraTest, setShowBasicCameraTest] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showDetailedDiagnostic, setShowDetailedDiagnostic] = useState(false);

  // 處理 QR 掃描成功
  const handleScanSuccess = async (qrCode: string) => {
    setIsLoading(true);
    setState('scanning');

    try {
      // 調用掃描 API
      const scanResponse = await fetch('/api/stock-count/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode }),
      });

      const scanResult = await scanResponse.json();

      if (!scanResult.success) {
        toast.error(scanResult.error || 'Scan failed');
        setState('initial');
        return;
      }

      // 調用處理 API
      const processResponse = await fetch('/api/stock-count/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plt_num: scanResult.data.plt_num,
          product_code: scanResult.data.product_code,
        }),
      });

      const processResult = await processResponse.json();

      if (!processResult.success) {
        if (processResult.data?.already_counted) {
          toast.error(processResult.error);
          setState('initial');
          return;
        }
        toast.error(processResult.error || 'Process failed');
        setState('initial');
        return;
      }

      // 檢查是否需要用戶輸入
      if (processResult.data.need_input) {
        setCountData({
          plt_num: scanResult.data.plt_num,
          product_code: scanResult.data.product_code,
          product_desc: processResult.data.product_desc || `Product ${scanResult.data.product_code}`,
          remain_qty: 0,
          current_remain_qty: processResult.data.current_remain_qty,
        });
        setState('need_input');
        setShowNumberPad(true);
      } else {
        // 首次盤點或處理完成
        setCountData({
          plt_num: scanResult.data.plt_num,
          product_code: scanResult.data.product_code,
          product_desc: processResult.data.product_desc || `Product ${scanResult.data.product_code}`,
          remain_qty: processResult.data.remain_qty,
        });
        setState('counting');
        
        toast.success('Count updated successfully!');
      }

    } catch (error) {
      console.error('Scan processing error:', error);
      toast.error('An error occurred during processing');
      setState('initial');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理數字鍵盤確認
  const handleNumberPadConfirm = async (countedQty: number) => {
    if (!countData) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/stock-count/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plt_num: countData.plt_num,
          product_code: countData.product_code,
          counted_qty: countedQty,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Count submission failed');
        return;
      }

      // 更新數據
      setCountData(prev => prev ? {
        ...prev,
        remain_qty: result.data.remain_qty,
        product_desc: result.data.product_desc || prev.product_desc
      } : null);

      setState('counting');
      setShowNumberPad(false);
      toast.success('Count recorded successfully!');

    } catch (error) {
      console.error('Count submission error:', error);
      toast.error('An error occurred during count submission');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理數字鍵盤取消
  const handleNumberPadCancel = () => {
    setShowNumberPad(false);
    setState('initial');
    setCountData(null);
  };

  // 重置到初始狀態
  const resetToInitial = () => {
    setState('initial');
    setCountData(null);
    setShowNumberPad(false);
  };

  return (
    <MotionBackground>
      <div className="text-white">
        <StockTakeNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 頁面標題 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-4">
              Cycle Count
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Perform inventory cycle counting to maintain accurate stock levels.
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Scan To Start 區域 */}
            <AnimatePresence mode="wait">
              {(state === 'initial' || state === 'scanning') && (
                <ScanToStart 
                  onScanSuccess={handleScanSuccess}
                  isLoading={isLoading}
                />
              )}
            </AnimatePresence>

            {/* Camera Test 區域 */}
            <AnimatePresence>
              {showCameraTest && (
                <CameraTest />
              )}
            </AnimatePresence>

            {/* Basic Camera Test 區域 */}
            <AnimatePresence>
              {showBasicCameraTest && (
                <BasicCameraTest />
              )}
            </AnimatePresence>

            {/* Manual Input 區域 */}
            <AnimatePresence>
              {showManualInput && (
                <ManualInput 
                  onScanSuccess={handleScanSuccess}
                  isLoading={isLoading}
                />
              )}
            </AnimatePresence>

            {/* Detailed Diagnostic 區域 */}
            <AnimatePresence>
              {showDetailedDiagnostic && (
                <DetailedDiagnostic />
              )}
            </AnimatePresence>

            {/* Remain To Count 區域 */}
            <AnimatePresence>
              {countData && state === 'counting' && (
                <RemainToCount
                  remainQty={countData.remain_qty}
                  productCode={countData.product_code}
                  productDesc={countData.product_desc}
                  visible={true}
                />
              )}
            </AnimatePresence>

            {/* 操作按鈕區域 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* 相機測試按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCameraTest(!showCameraTest)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {showCameraTest ? 'Hide Camera Test' : 'Test Camera'}
              </motion.button>

              {/* 基礎診斷按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBasicCameraTest(!showBasicCameraTest)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {showBasicCameraTest ? 'Hide Diagnostics' : 'Camera Diagnostics'}
              </motion.button>

              {/* 手動輸入按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowManualInput(!showManualInput)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {showManualInput ? 'Hide Manual Input' : 'Manual Input'}
              </motion.button>

              {/* 詳細診斷按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDetailedDiagnostic(!showDetailedDiagnostic)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {showDetailedDiagnostic ? 'Hide Detailed Diagnostic' : 'Detailed Diagnostic'}
              </motion.button>

              {/* 重新開始按鈕 */}
              {state === 'counting' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetToInitial}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Scan Next Pallet
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* 數字鍵盤 */}
        <AnimatePresence>
          {showNumberPad && (
            <NumberPad
              onConfirm={handleNumberPadConfirm}
              onCancel={handleNumberPadCancel}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionBackground>
  );
} 