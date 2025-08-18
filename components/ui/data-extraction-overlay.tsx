/**
 * Data Extraction Results Overlay Component
 * Full-screen overlay to display PDF extraction results
 */

'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { cardTextStyles } from '@/lib/card-system/theme';
import type { ExtractedOrderItem } from '@/lib/types/order-extraction';

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
      className={cn(
        'p-4 rounded-lg border',
        'bg-white/5 backdrop-blur-sm border-gray-700/50'
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <code className="text-green-400 font-mono text-sm bg-green-500/10 px-2 py-1 rounded">
            {item.product_code}
          </code>
          <div className="text-right">
            <span className="text-gray-500 text-xs">Qty:</span> 
            <span className="ml-1 font-medium text-white">{item.product_qty}</span>
          </div>
        </div>
        
        <p className={cn(cardTextStyles.bodySmall, "text-gray-300")}>
          {item.product_desc}
        </p>
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
      role="dialog"
      aria-labelledby="extraction-title"
      aria-modal="true"
    >
      {/* Top header */}
      <div className={cn(
        'flex items-center justify-between px-6 py-4',
        'bg-gray-900/80 backdrop-blur-md',
        'border-b border-green-500/20'
      )}>
        <div className="flex items-center gap-4">
          <DocumentTextIcon className="h-6 w-6 text-green-400" />
          <div className="flex-1">
            <h1 id="extraction-title" className={cardTextStyles.title}>
              Extraction Results
            </h1>
            <p className={cardTextStyles.labelSmall}>
              {fileName} • Order: {orderRef}
            </p>
            
            {/* Order-level information displayed once */}
            {data.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20">
                  <span className="text-blue-400 font-medium">Account:</span>
                  <div className="text-white font-mono">{data[0]?.account_num || '-'}</div>
                </div>
                <div className="bg-purple-500/10 px-3 py-2 rounded border border-purple-500/20">
                  <span className="text-purple-400 font-medium">Invoice To:</span>
                  <div className="text-white text-xs leading-tight">{data[0]?.invoice_to || '-'}</div>
                </div>
                <div className="bg-orange-500/10 px-3 py-2 rounded border border-orange-500/20">
                  <span className="text-orange-400 font-medium">Delivery:</span>
                  <div className="text-white text-xs leading-tight">{data[0]?.delivery_add || '-'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Simple items list */}
      <ScrollArea className="flex-1 p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-500 mb-4" />
            <h3 className={cardTextStyles.subtitle}>No items found</h3>
            <p className="text-gray-400 mt-2">No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map(renderOrderItem)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DataExtractionOverlay;