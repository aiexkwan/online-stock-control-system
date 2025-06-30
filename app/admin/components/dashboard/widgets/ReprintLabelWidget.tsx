'use client';

import React, { useState } from 'react';
import { BaseWidget } from '@/app/admin/components/widgets/BaseWidget';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PrinterIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

interface ReprintLabelWidgetProps {
  title?: string;
  gridArea?: string;
}

export function ReprintLabelWidget({ title = 'Reprint Label', gridArea }: ReprintLabelWidgetProps) {
  const [palletNumber, setPalletNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleReprint = async () => {
    if (!palletNumber.trim()) {
      toast.error('Please enter a pallet number');
      return;
    }

    setIsLoading(true);
    try {
      // Query record_palletinfo table - correct column name is plt_num
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('pdf_url, plt_num, product_code, product_qty')
        .eq('plt_num', palletNumber.toUpperCase()) // Ensure uppercase for pallet number
        .maybeSingle(); // Use maybeSingle to handle no results gracefully

      if (error) {
        console.error('Database error:', error);
        toast.error(`Database error: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error(`Pallet number ${palletNumber} not found`);
        return;
      }

      if (!data.pdf_url) {
        toast.error(`No PDF label found for pallet ${palletNumber}`);
        return;
      }

      // Execute print
      await printPDF(data.pdf_url);
      toast.success(`Label for ${data.plt_num} (${data.product_code}) sent to printer`);
      
      // Clear input
      setPalletNumber('');
    } catch (error) {
      console.error('Reprint error:', error);
      toast.error('Print failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const printPDF = async (pdfUrl: string) => {
    // Method 1: Open PDF in new window/tab and trigger print
    try {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        // Wait for PDF to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      } else {
        // Fallback: Download and let user print manually
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `pallet-label-${palletNumber}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('PDF downloaded. Please print it manually.');
      }
    } catch (error) {
      console.error('Print error:', error);
      // Final fallback: Just open the PDF
      window.open(pdfUrl, '_blank');
      toast.info('PDF opened in new tab. Please print it manually.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleReprint();
    }
  };

  return (
    <div className="h-full w-full bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="flex-1 p-3 min-h-0 overflow-auto">
        <div className="flex items-center space-x-2 h-full">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter pallet number"
              value={palletNumber}
              onChange={(e) => setPalletNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleReprint}
            disabled={isLoading || !palletNumber.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PrinterIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}