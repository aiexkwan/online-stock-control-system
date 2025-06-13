'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MotionBackground from '@/app/components/MotionBackground';
import StockTakeNav from '../components/StockTakeNav';
import ScanToStart from './components/ScanToStart';
import RemainToCount from './components/RemainToCount';
import NumberPad from './components/NumberPad';
import ManualInput from './components/ManualInput';
import ErrorBoundary from './components/ErrorBoundary';
import { ClipboardDocumentCheckIcon, QueueListIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// 定義狀態類型
type CountState = 'initial' | 'scanning' | 'counting' | 'need_input' | 'batch_mode';

// 定義盤點數據類型
interface CountData {
  plt_num: string;
  product_code: string;
  product_desc: string;
  remain_qty: number;
  current_remain_qty?: number;
}

// 批量掃描記錄
interface BatchScanRecord {
  plt_num: string;
  product_code: string;
  product_desc: string;
  counted_qty: number;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  error?: string;
  current_remain_qty?: number; // 當前剩餘數量
}

export default function CycleCountPage() {
  const [state, setState] = useState<CountState>('initial');
  const [countData, setCountData] = useState<CountData | null>(null);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchScans, setBatchScans] = useState<BatchScanRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingBatchItem, setPendingBatchItem] = useState<Partial<BatchScanRecord> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
        setState(batchMode ? 'batch_mode' : 'initial');
        return;
      }

      // 批量模式處理
      if (batchMode) {
        // 檢查是否已經在批量列表中
        const existingItem = batchScans.find(item => item.plt_num === scanResult.data.plt_num);
        if (existingItem && existingItem.status === 'pending') {
          toast.error('This pallet is already in the batch list');
          setState('batch_mode');
          return;
        }
        
        // 獲取產品的當前剩餘數量（如果今日已經有盤點記錄）
        const processResponse = await fetch('/api/stock-count/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plt_num: scanResult.data.plt_num,
            product_code: scanResult.data.product_code,
            check_only: true, // 只檢查，不處理
          }),
        });

        const processResult = await processResponse.json();
        
        // 準備批量項目，等待輸入數量
        setPendingBatchItem({
          plt_num: scanResult.data.plt_num,
          product_code: scanResult.data.product_code,
          product_desc: processResult.data?.product_desc || scanResult.data.product_desc || `Product ${scanResult.data.product_code}`,
          timestamp: new Date().toISOString(),
          status: 'pending',
          current_remain_qty: processResult.data?.current_remain_qty,
        });
        
        // 如果是第一次盤點，顯示提示
        if (processResult.data?.is_first_count) {
          toast.info(`First count for ${scanResult.data.product_code}. Current stock: ${processResult.data?.current_remain_qty || 0}`);
        }
        
        setShowNumberPad(true);
        setState('need_input');
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

      // 檢查是否需要用戶輸入（包括第一次盤點）
      if (processResult.data.need_input || processResult.data.is_first_count) {
        setCountData({
          plt_num: scanResult.data.plt_num,
          product_code: scanResult.data.product_code,
          product_desc: processResult.data.product_desc || `Product ${scanResult.data.product_code}`,
          remain_qty: 0,
          current_remain_qty: processResult.data.current_remain_qty,
        });
        setState('need_input');
        setShowNumberPad(true);
        
        // 如果是第一次盤點，顯示提示
        if (processResult.data.is_first_count) {
          toast.info(`First count for ${scanResult.data.product_code}. Current stock: ${processResult.data.current_remain_qty}`);
        }
      } else {
        // 處理完成
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
    // 批量模式處理
    if (batchMode && pendingBatchItem) {
      // 如果是編輯模式
      if (editingIndex !== null) {
        const updatedScans = [...batchScans];
        updatedScans[editingIndex] = {
          ...updatedScans[editingIndex],
          counted_qty: countedQty,
        };
        setBatchScans(updatedScans);
        setEditingIndex(null);
        setShowNumberPad(false);
        setState('batch_mode');
        toast.success('Quantity updated');
        return;
      }
      
      // 數據驗證
      const validation = await validateQuantity(pendingBatchItem.product_code!, countedQty);
      if (!validation.is_valid) {
        toast.error(validation.message || 'Invalid quantity');
        
        // 如果有警告但允許繼續，顯示確認對話框
        if (validation.warnings && validation.warnings.length > 0) {
          const confirmed = window.confirm(`Warning: ${validation.warnings.join('\n')}\n\nDo you want to continue?`);
          if (!confirmed) return;
        } else {
          return; // 如果有錯誤，直接返回
        }
      }
      
      // 添加到批量掃描列表
      addBatchScanRecord({
        ...pendingBatchItem as BatchScanRecord,
        counted_qty: countedQty,
      });
      
      setPendingBatchItem(null);
      setShowNumberPad(false);
      setState('batch_mode');
      toast.success(`Added ${pendingBatchItem.product_code} to batch`);
      return;
    }

    if (!countData) return;

    // 數據驗證
    const validation = await validateQuantity(countData.product_code, countedQty);
    if (!validation.is_valid) {
      toast.error(validation.message || 'Invalid quantity');
      
      // 如果有警告但允許繼續，顯示確認對話框
      if (validation.warnings && validation.warnings.length > 0) {
        const confirmed = window.confirm(`Warning: ${validation.warnings.join('\n')}\n\nDo you want to continue?`);
        if (!confirmed) return;
      } else {
        return; // 如果有錯誤，直接返回
      }
    }

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
    setPendingBatchItem(null);
    setEditingIndex(null);
    
    if (batchMode) {
      setState('batch_mode');
    } else {
      setState('initial');
      setCountData(null);
    }
  };

  // 重置到初始狀態
  const resetToInitial = () => {
    setState('initial');
    setCountData(null);
    setShowNumberPad(false);
  };

  // 添加批量掃描記錄
  const addBatchScanRecord = (record: BatchScanRecord) => {
    setBatchScans(prev => [...prev, record]);
  };

  // 數據驗證函數
  const validateQuantity = async (productCode: string, quantity: number): Promise<any> => {
    try {
      const response = await fetch('/api/stock-count/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_code: productCode,
          counted_qty: quantity,
        }),
      });

      const result = await response.json();
      return result.data || { is_valid: true };
    } catch (error) {
      console.error('Validation error:', error);
      return { is_valid: true }; // 驗證失敗時允許繼續
    }
  };

  // 處理批量掃描提交
  const handleBatchSubmit = async () => {
    if (batchScans.length === 0) {
      toast.error('No items to submit');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stock-count/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          scans: batchScans.filter(s => s.status === 'pending'),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Processed ${result.data.success_count} items successfully`);
        if (result.data.error_count > 0) {
          toast.error(`${result.data.error_count} items failed`);
        }
        // 清空批量掃描列表
        setBatchScans([]);
        setBatchMode(false);
        setState('initial');
      } else {
        toast.error('Batch processing failed');
      }
    } catch (error) {
      console.error('Batch submit error:', error);
      toast.error('An error occurred during batch submission');
    } finally {
      setIsLoading(false);
    }
  };

  // 切換批量模式
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (!batchMode) {
      // 進入批量模式時生成會話ID
      setSessionId(crypto.randomUUID());
      setState('batch_mode');
      toast.info('Batch mode enabled. Scan multiple items before submitting.');
    } else {
      // 退出批量模式
      setBatchScans([]);
      setSessionId(null);
      setPendingBatchItem(null);
      setEditingIndex(null);
      setState('initial');
    }
  };
  
  // 編輯批量項目數量
  const handleEditBatchItem = (index: number) => {
    const item = batchScans[index];
    if (item.status !== 'pending') return;
    
    setEditingIndex(index);
    setPendingBatchItem(item);
    setShowNumberPad(true);
  };
  
  // 刪除批量項目
  const handleDeleteBatchItem = (index: number) => {
    const updatedScans = batchScans.filter((_, i) => i !== index);
    setBatchScans(updatedScans);
    toast.info('Item removed from batch');
  };

  return (
    <MotionBackground>
      <ErrorBoundary>
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
            {/* Batch Mode Toggle */}
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={toggleBatchMode}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  batchMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <QueueListIcon className="h-5 w-5" />
                {batchMode ? 'Exit Batch Mode' : 'Enable Batch Mode'}
              </button>
              {batchMode && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-green-400 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Batch mode active - Scan multiple pallets and enter quantities before submitting
                </motion.p>
              )}
            </div>

            {/* Batch Mode List */}
            <AnimatePresence>
              {batchMode && batchScans.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <QueueListIcon className="h-5 w-5 text-blue-400" />
                    Batch Scan List ({batchScans.length} items)
                  </h3>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {batchScans.map((scan, index) => (
                      <motion.div
                        key={`${scan.plt_num}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          scan.status === 'error' 
                            ? 'bg-red-900/20 border border-red-700/50' 
                            : scan.status === 'success'
                            ? 'bg-green-900/20 border border-green-700/50'
                            : 'bg-slate-700/30 border border-slate-600/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {scan.status === 'error' ? (
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                          ) : scan.status === 'success' ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                          ) : (
                            <ClockIcon className="h-5 w-5 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {scan.product_code} - {scan.plt_num}
                            </p>
                            <p className="text-xs text-slate-400">
                              {scan.product_desc || 'No description'}
                            </p>
                            {scan.current_remain_qty !== undefined && (
                              <p className="text-xs text-slate-500 mt-1">
                                Current Stock: {scan.current_remain_qty} → {scan.current_remain_qty - scan.counted_qty}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              Qty: {scan.counted_qty}
                            </p>
                            {scan.error && (
                              <p className="text-xs text-red-400">{scan.error}</p>
                            )}
                          </div>
                          {scan.status === 'pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditBatchItem(index)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                                title="Edit quantity"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteBatchItem(index)}
                                className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                title="Remove from batch"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleBatchSubmit}
                      disabled={isLoading || batchScans.filter(s => s.status === 'pending').length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Submit Batch ({batchScans.filter(s => s.status === 'pending').length} items)
                    </button>
                    <button
                      onClick={() => setBatchScans([])}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan To Start 區域 */}
            <AnimatePresence mode="wait">
              {(state === 'initial' || state === 'scanning' || state === 'batch_mode') && (
                <ScanToStart 
                  onScanSuccess={handleScanSuccess}
                  isLoading={isLoading}
                />
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
              {/* 手動輸入按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowManualInput(!showManualInput)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {showManualInput ? 'Hide Manual Input' : 'Manual Input'}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            >
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                  {pendingBatchItem && (
                    <div className="p-6 border-b border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {editingIndex !== null ? 'Edit Quantity' : 'Enter Quantity for Pallet'}
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-300">
                          Product: <span className="font-medium text-white">{pendingBatchItem.product_code}</span>
                        </p>
                        <p className="text-sm text-slate-300">
                          Pallet: <span className="font-medium text-white">{pendingBatchItem.plt_num}</span>
                        </p>
                        {pendingBatchItem.product_desc && (
                          <p className="text-sm text-slate-300">
                            Description: <span className="font-medium text-white">{pendingBatchItem.product_desc}</span>
                          </p>
                        )}
                        {pendingBatchItem.current_remain_qty !== undefined && (
                          <p className="text-sm text-slate-300">
                            Current Stock: <span className="font-medium text-white">{pendingBatchItem.current_remain_qty}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <NumberPad
                    onConfirm={handleNumberPadConfirm}
                    onCancel={handleNumberPadCancel}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </ErrorBoundary>
    </MotionBackground>
  );
} 