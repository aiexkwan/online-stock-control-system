'use client';

import React, { useState, useCallback } from 'react';
// Custom dialog implementation
import { DocumentPlusIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ProductInfo } from './types';

interface BatchItem {
  id: string;
  productCode: string;
  productInfo?: ProductInfo | null;
  quantity: string;
  count: string;
  operator?: string;
  acoOrderRef?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface BatchProcessingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProcess: (items: BatchItem[]) => Promise<void>;
  className?: string;
}

export const BatchProcessingDialog: React.FC<BatchProcessingDialogProps> = React.memo(
  ({ isOpen, onClose, onProcess, className = '' }) => {
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // 添加單個項目
    const addBatchItem = useCallback(() => {
      const newItem: BatchItem = {
        id: `batch-${Date.now()}-${Math.random()}`,
        productCode: '',
        quantity: '',
        count: '',
        operator: '',
        acoOrderRef: '',
        status: 'pending',
      };
      setBatchItems(prev => [...prev, newItem]);
    }, []);

    // 更新項目
    const updateBatchItem = useCallback((id: string, field: keyof BatchItem, value: unknown) => {
      setBatchItems(prev =>
        prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
      );
    }, []);

    // 移除項目
    const removeBatchItem = useCallback((id: string) => {
      setBatchItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // 處理 CSV 文件上傳
    const handleCsvUpload = useCallback(async (file: File) => {
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        // 跳過標題行
        const dataLines = lines.slice(1);

        const newItems: BatchItem[] = dataLines.map(line => {
          const [productCode, quantity, count, operator, acoOrderRef] = line
            .split(',')
            .map(s => s.trim());
          return {
            id: `batch-${Date.now()}-${Math.random()}`,
            productCode: productCode || '',
            quantity: quantity || '',
            count: count || '',
            operator: operator || '',
            acoOrderRef: acoOrderRef || '',
            status: 'pending',
          };
        });

        setBatchItems(prev => [...prev, ...newItems]);
        setCsvFile(file);
      } catch (error) {
        console.error('Error reading CSV file:', error);
      }
    }, []);

    // 處理批量處理
    const handleBatchProcess = useCallback(async () => {
      if (batchItems.length === 0) return;

      setIsProcessing(true);
      try {
        await onProcess(batchItems);
      } finally {
        setIsProcessing(false);
      }
    }, [batchItems, onProcess]);

    // 下載 CSV 模板
    const downloadTemplate = useCallback(() => {
      const template = 'ProductCode,Quantity,Count,Operator,AcoOrderRef\n';
      const blob = new Blob([template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qc_label_batch_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }, []);

    // 計算統計
    const statistics = React.useMemo(() => {
      const total = batchItems.length;
      const pending = batchItems.filter(item => item.status === 'pending').length;
      const processing = batchItems.filter(item => item.status === 'processing').length;
      const completed = batchItems.filter(item => item.status === 'completed').length;
      const failed = batchItems.filter(item => item.status === 'failed').length;

      return { total, pending, processing, completed, failed };
    }, [batchItems]);

    if (!isOpen) return null;

    return (
      <>
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm' onClick={onClose} />
        <div className='fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl'>
          <div className='mb-6'>
            <h2 className='mb-2 text-2xl font-bold text-white'>Batch Processing</h2>
            <p className='text-sm text-slate-400'>Process multiple QC labels at once</p>
          </div>

          {/* Statistics */}
          <div className='mb-6 grid grid-cols-5 gap-4'>
            <div className='rounded-lg bg-slate-700/50 p-3 text-center'>
              <div className='text-2xl font-bold text-white'>{statistics.total}</div>
              <div className='text-xs text-slate-400'>Total</div>
            </div>
            <div className='rounded-lg bg-blue-900/30 p-3 text-center'>
              <div className='text-2xl font-bold text-blue-400'>{statistics.pending}</div>
              <div className='text-xs text-slate-400'>Pending</div>
            </div>
            <div className='rounded-lg bg-yellow-900/30 p-3 text-center'>
              <div className='text-2xl font-bold text-yellow-400'>{statistics.processing}</div>
              <div className='text-xs text-slate-400'>Processing</div>
            </div>
            <div className='rounded-lg bg-green-900/30 p-3 text-center'>
              <div className='text-2xl font-bold text-green-400'>{statistics.completed}</div>
              <div className='text-xs text-slate-400'>Completed</div>
            </div>
            <div className='rounded-lg bg-red-900/30 p-3 text-center'>
              <div className='text-2xl font-bold text-red-400'>{statistics.failed}</div>
              <div className='text-xs text-slate-400'>Failed</div>
            </div>
          </div>

          {/* Actions */}
          <div className='mb-6 flex gap-4'>
            <button
              onClick={addBatchItem}
              className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500'
            >
              <DocumentPlusIcon className='h-4 w-4' />
              Add Item
            </button>

            <label className='flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-500'>
              <input
                type='file'
                accept='.csv'
                onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                className='hidden'
              />
              Upload CSV
            </label>

            <button
              onClick={downloadTemplate}
              className='flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-white transition-colors hover:bg-slate-500'
            >
              Download Template
            </button>
          </div>

          {/* Batch Items */}
          <div className='mb-6 max-h-96 overflow-y-auto'>
            <div className='space-y-2'>
              {batchItems.map(item => (
                <div
                  key={item.id}
                  className='rounded-lg border border-slate-600/50 bg-slate-700/30 p-4'
                >
                  <div className='grid grid-cols-6 items-center gap-2'>
                    <input
                      type='text'
                      value={item.productCode}
                      onChange={e => updateBatchItem(item.id, 'productCode', e.target.value)}
                      placeholder='Product Code'
                      className='rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white'
                      disabled={item.status !== 'pending'}
                    />
                    <input
                      type='number'
                      value={item.quantity}
                      onChange={e => updateBatchItem(item.id, 'quantity', e.target.value)}
                      placeholder='Quantity'
                      className='rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white'
                      disabled={item.status !== 'pending'}
                    />
                    <input
                      type='number'
                      value={item.count}
                      onChange={e => updateBatchItem(item.id, 'count', e.target.value)}
                      placeholder='Count'
                      className='rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white'
                      disabled={item.status !== 'pending'}
                    />
                    <input
                      type='text'
                      value={item.operator || ''}
                      onChange={e => updateBatchItem(item.id, 'operator', e.target.value)}
                      placeholder='Operator'
                      className='rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white'
                      disabled={item.status !== 'pending'}
                    />
                    <input
                      type='text'
                      value={item.acoOrderRef || ''}
                      onChange={e => updateBatchItem(item.id, 'acoOrderRef', e.target.value)}
                      placeholder='ACO Ref'
                      className='rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white'
                      disabled={item.status !== 'pending'}
                    />
                    <div className='flex items-center justify-end gap-2'>
                      {item.status === 'completed' && (
                        <CheckCircleIcon className='h-5 w-5 text-green-400' />
                      )}
                      {item.status === 'failed' && (
                        <span className='text-xs text-red-400'>{item.error}</span>
                      )}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeBatchItem(item.id)}
                          className='text-red-400 hover:text-red-300'
                        >
                          <XMarkIcon className='h-5 w-5' />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className='flex justify-end gap-4'>
            <button
              onClick={onClose}
              className='rounded-lg bg-slate-600 px-6 py-2 text-white transition-colors hover:bg-slate-500'
            >
              Cancel
            </button>
            <button
              onClick={handleBatchProcess}
              disabled={batchItems.length === 0 || isProcessing}
              className={`rounded-lg px-6 py-2 transition-colors ${
                batchItems.length === 0 || isProcessing
                  ? 'cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isProcessing ? 'Processing...' : `Process ${batchItems.length} Items`}
            </button>
          </div>
        </div>
      </>
    );
  }
);

BatchProcessingDialog.displayName = 'BatchProcessingDialog';
