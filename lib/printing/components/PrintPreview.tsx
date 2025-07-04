'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { PrintOptions, PrintType } from '../types';
import { cn } from '@/lib/utils';

export interface PrintPreviewProps {
  type: string;
  data: any;
  options: PrintOptions;
  className?: string;
}

export function PrintPreview({
  type,
  data,
  options,
  className
}: PrintPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    // Generate preview content based on type
    generatePreview();
  }, [type, data, options]);

  const generatePreview = () => {
    // This would normally generate actual preview content
    // For now, we'll create a simple representation
    let content = '';
    
    switch (type) {
      case PrintType.QC_LABEL:
        content = generateQcLabelPreview(data);
        break;
      case PrintType.GRN_LABEL:
        content = generateGrnLabelPreview(data);
        break;
      case PrintType.TRANSACTION_REPORT:
        content = generateReportPreview(data, 'Transaction Report');
        break;
      default:
        content = '<div class="p-4">Preview not available for this document type</div>';
    }
    
    setPreviewContent(content);
    
    // Calculate pages (simplified)
    const estimatedPages = Math.ceil((data.items?.length || 1) / 10);
    setTotalPages(Math.max(1, estimatedPages));
  };

  const generateQcLabelPreview = (data: any) => {
    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">QC Label</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Product Code</p>
            <p class="font-medium">${data.productCode || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Quantity</p>
            <p class="font-medium">${data.quantity || '0'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Operator</p>
            <p class="font-medium">${data.operator || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Date</p>
            <p class="font-medium">${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        ${data.palletIds?.length > 0 ? `
          <div>
            <p class="text-sm text-gray-600">Pallet IDs</p>
            <div class="mt-1 space-y-1">
              ${data.palletIds.slice(0, 3).map((id: string) => 
                `<p class="font-mono text-sm">${id}</p>`
              ).join('')}
              ${data.palletIds.length > 3 ? 
                `<p class="text-sm text-gray-500">... and ${data.palletIds.length - 3} more</p>` : ''
              }
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const generateGrnLabelPreview = (data: any) => {
    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">GRN Label</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">GRN Number</p>
            <p class="font-medium">${data.grnNumber || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Supplier</p>
            <p class="font-medium">${data.supplierName || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Material Code</p>
            <p class="font-medium">${data.materialCode || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Weight</p>
            <p class="font-medium">${data.totalGrossWeight || '0'} kg</p>
          </div>
        </div>
      </div>
    `;
  };

  const generateReportPreview = (data: any, title: string) => {
    return `
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-bold text-center">${title}</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Date Range:</span>
            <span class="text-sm">${data.startDate || 'N/A'} - ${data.endDate || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Total Records:</span>
            <span class="text-sm">${data.totalRecords || '0'}</span>
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
    <div className={cn("flex flex-col h-full", className)}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigatePages('prev')}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigatePages('next')}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div 
          className="mx-auto bg-white shadow-lg"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center top',
            transition: 'transform 0.2s',
            width: options.orientation === 'portrait' ? '210mm' : '297mm',
            minHeight: options.orientation === 'portrait' ? '297mm' : '210mm',
            maxWidth: '100%'
          }}
        >
          <div 
            className="h-full"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      </div>
    </div>
  );
}