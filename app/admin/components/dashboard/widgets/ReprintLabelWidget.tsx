'use client';

import React, { useState } from 'react';
import { BaseWidget } from '@/app/admin/components/widgets/BaseWidget';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PrinterIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import {
  TransactionLogService,
  TransactionSource,
  TransactionOperation,
} from '@/app/services/transactionLog.service';
import { ErrorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

interface ReprintLabelWidgetProps {
  title?: string;
  gridArea?: string;
}

export function ReprintLabelWidget({ title = 'Reprint Label', gridArea }: ReprintLabelWidgetProps) {
  const [palletNumber, setPalletNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dashboardAPI = createDashboardAPI();
  const transactionLog = new TransactionLogService();
  const errorHandler = new ErrorHandler('ReprintLabelWidget');

  const handleReprint = async () => {
    if (!palletNumber.trim()) {
      toast.error('Please enter a pallet number');
      return;
    }

    // Start transaction logging
    const transactionId = transactionLog.generateTransactionId();

    setIsLoading(true);
    try {
      // Record transaction start
      await transactionLog.startTransaction({
        transactionId,
        sourceModule: TransactionSource.REPRINT_LABEL,
        sourcePage: 'AdminDashboard',
        sourceAction: 'ReprintLabel',
        operationType: TransactionOperation.PRINT_LABEL,
        userId: 'system', // TODO: Get actual user ID
        metadata: {
          palletNumber: palletNumber.toUpperCase(),
          widget: 'ReprintLabelWidget',
        },
      });

      // Step 1: Fetch pallet information
      await transactionLog.recordStep(transactionId, {
        name: 'fetch_pallet_info',
        sequence: 1,
        data: { palletNumber: palletNumber.toUpperCase() },
      });

      const result = await dashboardAPI.fetch({
        widgetIds: ['reprint'],
        params: {
          dataSource: 'pallet_reprint',
          palletNum: palletNumber.toUpperCase(),
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pallet information');
      }

      const palletData = result.data?.widgets?.[0]?.data?.value;

      if (!palletData) {
        const errorMsg = `Pallet number ${palletNumber} not found`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'PALLET_NOT_FOUND');
        toast.error(errorMsg);
        return;
      }

      if (!palletData.pdf_url) {
        const errorMsg = `No PDF label found for pallet ${palletNumber}`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'PDF_NOT_FOUND');
        toast.error(errorMsg);
        return;
      }

      // Step 2: Execute print
      await transactionLog.recordStep(transactionId, {
        name: 'execute_print',
        sequence: 2,
        data: {
          pdfUrl: palletData.pdf_url,
          palletInfo: {
            plt_num: palletData.plt_num,
            product_code: palletData.product_code,
            product_description: palletData.product_description,
            quantity: palletData.product_qty,
          },
        },
      });

      await printPDF(palletData.pdf_url);

      // Complete transaction
      await transactionLog.completeTransaction(transactionId, {
        printSuccess: true,
        palletPrinted: palletData.plt_num,
      });

      toast.success(
        `Label for ${palletData.plt_num} (${palletData.product_description || palletData.product_code}) sent to printer`
      );

      // Clear input
      setPalletNumber('');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      await transactionLog.recordError(transactionId, err, 'REPRINT_FAILED');

      const handledError = errorHandler.handleError(err, {
        context: 'handleReprint',
        palletNumber: palletNumber.toUpperCase(),
      });

      toast.error(handledError.userMessage || 'Print failed, please try again');
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
      errorHandler.handleError(error instanceof Error ? error : new Error('Print error'), {
        context: 'printPDF',
        pdfUrl,
      });
      // Final fallback: Just open the PDF
      window.open(pdfUrl, '_blank');
      toast.info('PDF opened in new tab. Please print it manually.');
    }
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm'>
      <div className='flex-shrink-0 border-b border-gray-700/50 px-3 py-2'>
        <h3 className='text-sm font-semibold text-white'>{title}</h3>
      </div>
      <div className='min-h-0 flex-1 overflow-auto p-3'>
        <div className='flex h-full items-center space-x-2'>
          <div className='flex-1'>
            <Input
              type='text'
              placeholder='Enter pallet number'
              value={palletNumber}
              onChange={e => setPalletNumber(e.target.value)}
              className='h-9 border-gray-700 bg-gray-800/50 text-sm text-white placeholder:text-gray-500'
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleReprint}
            disabled={isLoading || !palletNumber.trim()}
            className='h-9 bg-blue-600 px-3 text-white hover:bg-blue-700'
            size='sm'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <PrinterIcon className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReprintLabelWidget;
