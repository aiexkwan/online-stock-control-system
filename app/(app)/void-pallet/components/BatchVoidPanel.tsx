'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  MapPin,
  Hash,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  ListChecks,
  X,
} from 'lucide-react';
import { BatchPalletItem } from '../types/batch';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchVoidPanelProps {
  items: BatchPalletItem[];
  onSelectItem: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  isProcessing: boolean;
  selectedCount: number;
}

export function BatchVoidPanel({
  items,
  onSelectItem,
  onSelectAll,
  onRemoveItem,
  onClearAll,
  isProcessing,
  selectedCount,
}: BatchVoidPanelProps) {
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAllChecked(checked);
    onSelectAll(checked);
  };

  const getStatusIcon = (status: BatchPalletItem['status']) => {
    switch (status) {
      case 'pending':
        return null;
      case 'processing':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-400' />;
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-400' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-400' />;
    }
  };

  const getStatusColor = (status: BatchPalletItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-700 text-gray-300';
      case 'processing':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'completed':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'error':
        return 'bg-red-900/50 text-red-300 border-red-700';
    }
  };

  return (
    <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-xl'>
      <div className='border-b border-slate-700/50 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <h3 className='text-lg font-semibold text-white'>Batch Void List</h3>
            <Badge variant='secondary' className='bg-slate-700'>
              {items.length} pallets
            </Badge>
            {selectedCount > 0 && <Badge className='bg-orange-600'>{selectedCount} selected</Badge>}
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleSelectAll(!selectAllChecked)}
              disabled={isProcessing || items.length === 0}
              className='text-slate-400 hover:text-white'
            >
              <ListChecks className='mr-1 h-4 w-4' />
              {selectAllChecked ? 'Deselect All' : 'Select All'}
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={onClearAll}
              disabled={isProcessing || items.length === 0}
              className='text-red-400 hover:text-red-300'
            >
              <Trash2 className='mr-1 h-4 w-4' />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className='custom-scrollbar max-h-96 overflow-y-auto'>
        {items.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>
            <Package className='mx-auto mb-3 h-12 w-12 opacity-50' />
            <p>No pallets scanned yet</p>
            <p className='mt-1 text-sm'>Scan pallets to add them to the batch</p>
          </div>
        ) : (
          <div className='p-2'>
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`mb-2 rounded-lg border p-3 transition-all duration-200 ${getStatusColor(item.status)} ${item.selected && item.status === 'pending' ? 'ring-2 ring-orange-500' : ''} `}
                >
                  <div className='flex items-start gap-3'>
                    {/* Checkbox */}
                    <div className='pt-1'>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={checked => onSelectItem(item.id, checked as boolean)}
                        disabled={isProcessing || item.status !== 'pending'}
                        className='border-slate-500'
                      />
                    </div>

                    {/* Pallet Info */}
                    <div className='flex-grow'>
                      <div className='mb-1 flex items-center gap-2'>
                        <div className='flex items-center gap-1'>
                          <Hash className='h-3 w-3 text-gray-400' />
                          <span className='font-medium text-white'>{item.palletInfo.plt_num}</span>
                        </div>
                        {getStatusIcon(item.status)}
                      </div>

                      <div className='flex items-center gap-4 text-sm text-gray-400'>
                        <div className='flex items-center gap-1'>
                          <Package className='h-3 w-3' />
                          <span>{item.palletInfo.product_code}</span>
                        </div>
                        <div>Qty: {item.palletInfo.product_qty}</div>
                        {item.palletInfo.plt_loc && (
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3' />
                            <span>{item.palletInfo.plt_loc}</span>
                          </div>
                        )}
                      </div>

                      {/* Error message */}
                      {item.error && (
                        <div className='mt-2 flex items-center gap-1 text-xs text-red-400'>
                          <AlertCircle className='h-3 w-3' />
                          <span>{item.error}</span>
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    {item.status === 'pending' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isProcessing}
                        className='h-8 w-8 p-0 text-gray-400 hover:text-red-400'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className='border-t border-slate-700/50 p-4'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center gap-4'>
              <span className='text-gray-400'>
                Total Quantity:{' '}
                <span className='font-medium text-white'>
                  {items.reduce((sum, item) => sum + item.palletInfo.product_qty, 0)}
                </span>
              </span>
            </div>

            <div className='flex items-center gap-3'>
              {items.some(item => item.status === 'completed') && (
                <span className='text-green-400'>
                  ✓ {items.filter(item => item.status === 'completed').length} completed
                </span>
              )}
              {items.some(item => item.status === 'error') && (
                <span className='text-red-400'>
                  ✗ {items.filter(item => item.status === 'error').length} failed
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
