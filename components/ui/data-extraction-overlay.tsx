/**
 * Data Extraction Results Overlay Component
 * Full-screen overlay to display PDF extraction results
 */

'use client';

import * as React from 'react';
const { useEffect } = React;
import {
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { cardTextStyles } from '../../lib/card-system/theme';
import type { ExtractedOrderItem } from '../../lib/types/order-extraction';

interface DataExtractionOverlayProps {
  isOpen: boolean;
  data: ExtractedOrderItem[];
  fileName: string;
  orderRef: string;
  onClose: () => void;
}

export const DataExtractionOverlay: React.FC<DataExtractionOverlayProps> = ({
  isOpen,
  data,
  fileName,
  orderRef,
  onClose,
}) => {
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderOrderItem = (item: ExtractedOrderItem, index: number) => (
    <div
      key={`${item.product_code}-${index}`}
      className={cn('rounded-lg border p-4', 'border-gray-700/50 bg-white/5 backdrop-blur-sm')}
    >
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <code className='rounded bg-green-500/10 px-2 py-1 font-mono text-sm text-green-400'>
            {item.product_code}
          </code>
          <div className='text-right'>
            <span className='text-xs text-gray-500'>Qty:</span>
            <span className='ml-1 font-medium text-white'>{item.product_qty}</span>
          </div>
        </div>

        <p className={cn(cardTextStyles.bodySmall, 'text-gray-300')}>{item.product_desc}</p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col',
        'bg-black/90 backdrop-blur-xl',
        'animate-in fade-in-0 duration-200'
      )}
      role='dialog'
      aria-labelledby='extraction-title'
      aria-modal='true'
    >
      {/* Top header */}
      <div
        className={cn(
          'flex items-center justify-between px-6 py-4',
          'bg-gray-900/80 backdrop-blur-md',
          'border-b border-green-500/20'
        )}
      >
        <div className='flex items-center gap-4'>
          <DocumentTextIcon className='h-6 w-6 text-green-400' />
          <div className='flex-1'>
            <h1 id='extraction-title' className={cardTextStyles.title}>
              Extraction Results
            </h1>
            <p className={cardTextStyles.labelSmall}>
              {fileName} • Order: {orderRef}
            </p>

            {/* Order-level information displayed once */}
            {data.length > 0 && (
              <div className='mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3'>
                <div className='rounded border border-blue-500/20 bg-blue-500/10 px-3 py-2'>
                  <span className='font-medium text-blue-400'>Account:</span>
                  <div className='font-mono text-white'>{data[0]?.account_num || '-'}</div>
                </div>
                <div className='rounded border border-purple-500/20 bg-purple-500/10 px-3 py-2'>
                  <span className='font-medium text-purple-400'>Invoice To:</span>
                  <div className='text-xs leading-tight text-white'>
                    {data[0]?.invoice_to || '-'}
                  </div>
                </div>
                <div className='rounded border border-orange-500/20 bg-orange-500/10 px-3 py-2'>
                  <span className='font-medium text-orange-400'>Delivery:</span>
                  <div className='text-xs leading-tight text-white'>
                    {data[0]?.delivery_add || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-gray-300 hover:text-white'
          >
            <XMarkIcon className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* Simple items list */}
      <ScrollArea className='flex-1 p-6'>
        {data.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center text-center'>
            <ClipboardDocumentListIcon className='mb-4 h-16 w-16 text-gray-500' />
            <h3 className={cardTextStyles.subtitle}>No items found</h3>
            <p className='mt-2 text-gray-400'>No data available</p>
          </div>
        ) : (
          <div className='space-y-3'>{data.map(renderOrderItem)}</div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DataExtractionOverlay;
