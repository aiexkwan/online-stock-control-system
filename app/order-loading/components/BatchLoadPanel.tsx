'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DocumentDuplicateIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { UnifiedSearch } from '@/components/ui/unified-search';

interface BatchItem {
  id: string;
  input: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
  palletNumber?: string;
  productCode?: string;
  quantity?: number;
}

interface BatchLoadPanelProps {
  orderRef: string;
  onBatchComplete: () => void;
}

export default function BatchLoadPanel({ orderRef, onBatchComplete }: BatchLoadPanelProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchMode, setShowBatchMode] = useState(false);

  // Add item to batch
  const handleAddToBatch = (result: any) => {
    const input = result.data.value;

    // Check if already in batch
    if (batchItems.some(item => item.input === input)) {
      toast.warning('This item is already in the batch');
      return;
    }

    const newItem: BatchItem = {
      id: Date.now().toString(),
      input,
      status: 'pending',
    };

    setBatchItems(prev => [...prev, newItem]);
    setSearchValue(''); // Clear search
    toast.success(`Added ${input} to batch`);
  };

  // Remove item from batch
  const handleRemoveItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear all items
  const handleClearBatch = () => {
    if (window.confirm('Clear all items from batch?')) {
      setBatchItems([]);
    }
  };

  // Process batch
  const handleProcessBatch = async () => {
    if (batchItems.length === 0) {
      toast.error('No items in batch to process');
      return;
    }

    setIsProcessing(true);

    // Process items sequentially to avoid conflicts
    for (const item of batchItems) {
      setBatchItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'loading' } : i)));

      try {
        const { loadPalletToOrder } = await import('@/app/actions/orderLoadingActions');
        const result = await loadPalletToOrder(orderRef, item.input);

        if (result.success) {
          setBatchItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'success',
                    message: result.message,
                    palletNumber: result.data?.palletNumber,
                    productCode: result.data?.productCode,
                    quantity: result.data?.productQty,
                  }
                : i
            )
          );
        } else {
          setBatchItems(prev =>
            prev.map(i =>
              i.id === item.id ? { ...i, status: 'error', message: result.message } : i
            )
          );
        }
      } catch (error) {
        setBatchItems(prev =>
          prev.map(i =>
            i.id === item.id ? { ...i, status: 'error', message: 'System error occurred' } : i
          )
        );
      }

      // Small delay between items to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);

    // Calculate results
    const successCount = batchItems.filter(i => i.status === 'success').length;
    const errorCount = batchItems.filter(i => i.status === 'error').length;

    if (successCount > 0) {
      toast.success(`✓ Batch completed: ${successCount} successful, ${errorCount} failed`);
      onBatchComplete(); // Refresh parent data
    } else {
      toast.error('❌ Batch failed: No items were loaded successfully');
    }
  };

  // Get status icon
  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className='h-5 w-5 rounded-full bg-slate-600' />;
      case 'loading':
        return <ArrowPathIcon className='h-5 w-5 animate-spin text-blue-400' />;
      case 'success':
        return <CheckCircleIcon className='h-5 w-5 text-green-400' />;
      case 'error':
        return <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />;
    }
  };

  return (
    <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between text-slate-200'>
          <div className='flex items-center'>
            <DocumentDuplicateIcon className='mr-2 h-6 w-6 text-indigo-400' />
            Batch Loading Mode
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowBatchMode(!showBatchMode)}
            className='text-slate-400 hover:text-white'
          >
            {showBatchMode ? 'Hide' : 'Show'} Batch
          </Button>
        </CardTitle>
      </CardHeader>

      {showBatchMode && (
        <CardContent className='space-y-4'>
          {/* Search input */}
          <div>
            <UnifiedSearch
              searchType='pallet'
              onSelect={handleAddToBatch}
              placeholder='Scan to add to batch...'
              enableAutoDetection={true}
              value={searchValue}
              onChange={setSearchValue}
              disabled={isProcessing}
            />
          </div>

          {/* Batch items list */}
          {batchItems.length > 0 && (
            <div className='space-y-2'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm text-slate-400'>{batchItems.length} items in batch</span>
                <div className='space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleClearBatch}
                    disabled={isProcessing}
                    className='border-red-400/50 text-red-400 hover:bg-red-400/10'
                  >
                    <TrashIcon className='mr-1 h-4 w-4' />
                    Clear All
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleProcessBatch}
                    disabled={isProcessing || batchItems.length === 0}
                    className='bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  >
                    {isProcessing ? (
                      <>
                        <ArrowPathIcon className='mr-1 h-4 w-4 animate-spin' />
                        Processing...
                      </>
                    ) : (
                      <>Process Batch ({batchItems.length})</>
                    )}
                  </Button>
                </div>
              </div>

              <div className='max-h-60 space-y-2 overflow-y-auto rounded-lg bg-slate-900/30 p-2'>
                {batchItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      item.status === 'success'
                        ? 'border-green-700/50 bg-green-900/20'
                        : item.status === 'error'
                          ? 'border-red-700/50 bg-red-900/20'
                          : 'border-slate-700/50 bg-slate-800/50'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      {getStatusIcon(item.status)}
                      <div>
                        <div className='font-mono text-sm text-white'>{item.input}</div>
                        {item.message && (
                          <div className='mt-1 text-xs text-slate-400'>
                            {item.status === 'success' && item.productCode && (
                              <span className='text-green-400'>
                                {item.productCode} - {item.quantity} units
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className='text-red-400'>{item.message}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.status === 'pending' && !isProcessing && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveItem(item.id)}
                        className='text-slate-400 hover:text-red-400'
                      >
                        <TrashIcon className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {batchItems.length === 0 && (
            <div className='py-8 text-center text-slate-400'>
              <DocumentDuplicateIcon className='mx-auto mb-3 h-12 w-12 opacity-50' />
              <p className='text-sm'>Scan items to add to batch</p>
              <p className='mt-1 text-xs'>Process multiple pallets at once</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
