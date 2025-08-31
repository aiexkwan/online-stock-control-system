'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { DatabaseRecord } from '@/types/database/tables';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PrintOptions, PrintType } from '../types';

export interface PrintPreviewProps {
  type: PrintType;
  data: DatabaseRecord[];
  options: PrintOptions;
  className?: string;
}

interface PreviewDataStructure {
  items: DatabaseRecord[];
}

export function PrintPreview({ type, data, options, className }: PrintPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewContent, setPreviewContent] = useState<string>('');

  const generatePreview = useCallback(() => {
    // This would normally generate actual preview content
    // For now, we'll create a simple representation
    let content = '';

    const previewData: PreviewDataStructure = { items: data };

    switch (type) {
      case PrintType.QC_LABEL:
        // 策略2: DTO/自定義 type interface - 適配數據格式
        content = generateQcLabelPreview(previewData);
        break;
      case PrintType.GRN_LABEL:
        content = generateGrnLabelPreview(previewData);
        break;
      case PrintType.TRANSACTION_REPORT:
        content = generateReportPreview(previewData, 'Transaction Report');
        break;
      default:
        content = '<div class="p-4">Preview not available for this document type</div>';
    }

    setPreviewContent(content);

    // Calculate pages (simplified)
    // 策略4: unknown + type narrowing - 安全獲取數組長度
    const estimatedPages = Math.ceil((Array.isArray(data) ? data.length : 1) / 10);
    setTotalPages(Math.max(1, estimatedPages));
  }, [type, data]); // Remove 'options' as it's not used in the function

  useEffect(() => {
    // Generate preview content based on type
    generatePreview();
  }, [generatePreview]);

  const generateQcLabelPreview = (data: PreviewDataStructure) => {
    // Get first item for preview or create empty object
    const firstItem = data.items.length > 0 ? data.items[0] : {};
    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">QC Label</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Product Code</p>
            <p class="font-medium">${firstItem.productCode || firstItem.product_code || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Quantity</p>
            <p class="font-medium">${firstItem.quantity || firstItem.product_qty || '0'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Operator</p>
            <p class="font-medium">${firstItem.operator || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Date</p>
            <p class="font-medium">${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        ${
          Array.isArray(firstItem.plt_num) && (firstItem.plt_num as unknown[]).length > 0
            ? `
          <div>
            <p class="text-sm text-gray-600">Pallet Numbers</p>
            <div class="mt-1 space-y-1">
              ${(firstItem.plt_num as string[])
                .slice(0, 3)
                .map((id: string) => `<p class="font-mono text-sm">${String(id)}</p>`)
                .join('')}
              ${
                (firstItem.plt_num as string[]).length > 3
                  ? `<p class="text-sm text-gray-500">... and ${(firstItem.plt_num as string[]).length - 3} more</p>`
                  : ''
              }
            </div>
          </div>
        `
            : firstItem.plt_num
              ? `
          <div>
            <p class="text-sm text-gray-600">Pallet Number</p>
            <p class="font-mono text-sm">${String(firstItem.plt_num)}</p>
          </div>
        `
              : ''
        }
      </div>
    `;
  };

  const generateGrnLabelPreview = (data: PreviewDataStructure) => {
    // Get first item for preview or create empty object
    const firstItem = data.items.length > 0 ? data.items[0] : {};
    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">GRN Label</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">GRN Number</p>
            <p class="font-medium">${firstItem.grnNumber || firstItem.grn_ref || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Supplier</p>
            <p class="font-medium">${firstItem.supplierName || firstItem.sup_code || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Material Code</p>
            <p class="font-medium">${firstItem.materialCode || firstItem.material_code || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Weight</p>
            <p class="font-medium">${firstItem.totalGrossWeight || firstItem.gross_weight || '0'} kg</p>
          </div>
        </div>
      </div>
    `;
  };

  const generateReportPreview = (reportData: PreviewDataStructure, title: string) => {
    // 策略4: unknown + type narrowing - 安全獲取報表屬性
    const firstItem = reportData.items.length > 0 ? reportData.items[0] : {};
    const startDate = typeof firstItem.startDate === 'string' ? firstItem.startDate : 'N/A';
    const endDate = typeof firstItem.endDate === 'string' ? firstItem.endDate : 'N/A';
    const totalRecords = reportData.items.length;

    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">${title}</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Date Range:</span>
            <span class="text-sm">${startDate} - ${endDate}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Total Records:</span>
            <span class="text-sm">${totalRecords}</span>
          </div>
        </div>
        <div class="border-t pt-4">
          <p class="text-sm text-gray-500 text-center">Report preview content</p>
        </div>
      </div>
    `;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const navigatePages = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Preview Controls */}
      <div className='flex items-center justify-between border-b bg-gray-50 p-2'>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => navigatePages('prev')}
            disabled={currentPage === 1}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <span className='text-sm'>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => navigatePages('next')}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className='h-4 w-4' />
          </Button>
          <span className='w-12 text-center text-sm'>{zoom}%</span>
          <Button size='sm' variant='outline' onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className='h-4 w-4' />
          </Button>
          <Button size='sm' variant='outline' onClick={handleRotate}>
            <RotateCw className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className='flex-1 overflow-auto bg-gray-100 p-4'>
        <div
          className='mx-auto bg-white shadow-lg'
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center top',
            transition: 'transform 0.2s',
            width: options.orientation === 'portrait' ? '210mm' : '297mm',
            minHeight: options.orientation === 'portrait' ? '297mm' : '210mm',
            maxWidth: '100%',
          }}
        >
          <div className='h-full' dangerouslySetInnerHTML={{ __html: previewContent }} />
        </div>
      </div>
    </div>
  );
}
