'use client';

import React, { useState } from 'react';
import { BaseWidget } from '@/app/admin/components/widgets/BaseWidget';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PrinterIcon, Loader2 } from 'lucide-react';
import { useWidgetToast } from '@/app/admin/hooks/useWidgetToast';
import { fetchPalletForReprint } from '@/app/actions/palletActions';
import {
  TransactionLogService,
  TransactionSource,
  TransactionOperation,
} from '@/app/services/transactionLog.service';
import { ErrorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface ReprintLabelWidgetProps {
  title?: string;
  gridArea?: string;
}

export function ReprintLabelWidget({ title = 'Reprint Label', gridArea }: ReprintLabelWidgetProps) {
  const [palletNumber, setPalletNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useWidgetToast();
  const transactionLog = new TransactionLogService();
  const errorHandler = ErrorHandler.getInstance();

  const handleReprint = async () => {
    if (!palletNumber.trim()) {
      showError('Please enter a pallet number');
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
        userId: 'system', // Using system user for admin dashboard operations
        metadata: {
          palletNumber: palletNumber.toUpperCase(),
          widget: 'ReprintLabelWidget',
        },
      });

      // Step 1: Fetch pallet information using Server Action
      await transactionLog.recordStep(transactionId, {
        name: 'fetch_pallet_info',
        sequence: 1,
        data: { palletNumber: palletNumber.toUpperCase() },
      });

      const result = await fetchPalletForReprint(palletNumber);

      if (!result.success) {
        const errorMsg = result.error || `Failed to fetch pallet ${palletNumber}`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'FETCH_ERROR');
        showError(errorMsg);
        return;
      }

      const palletData = result.data;

      if (!palletData || !palletData.pdf_url) {
        const errorMsg = `No PDF label found for pallet ${palletNumber}`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'PDF_NOT_FOUND');
        showError(errorMsg);
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

      await printPDF(typeof palletData.pdf_url === 'string' ? palletData.pdf_url : '');

      // Complete transaction
      await transactionLog.completeTransaction(transactionId, {
        printSuccess: true,
        palletPrinted: palletData.plt_num,
      });

      showSuccess(
        `Label for ${palletData.plt_num} (${palletData.product_description || palletData.product_code}) sent to printer`
      );

      // Clear input
      setPalletNumber('');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      await transactionLog.recordError(transactionId, err, 'REPRINT_FAILED');

      errorHandler.handleApiError(err, {
        component: 'ReprintLabelWidget',
        action: 'handleReprint',
        additionalData: {
          palletNumber: palletNumber.toUpperCase(),
        },
      });
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
        showInfo('PDF downloaded. Please print it manually.');
      }
    } catch (error) {
      errorHandler.handleApiError(error instanceof Error ? error : new Error('Print error'), {
        component: 'ReprintLabelWidget',
        action: 'printPDF',
        additionalData: {
          pdfUrl,
        },
      });
      // Final fallback: Just open the PDF
      window.open(pdfUrl, '_blank');
      showInfo('PDF opened in new tab. Please print it manually.');
    }
  };

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg border backdrop-blur-sm',
        'border-border bg-card/40'
      )}
    >
      <div className={cn('flex-shrink-0 border-b px-3 py-2', 'border-border')}>
        <h3 className={cn(textClasses['body-small'], 'font-semibold text-foreground')}>{title}</h3>
      </div>
      <div className={cn('min-h-0 flex-1 overflow-auto', widgetSpacing.container)}>
        <div className={cn('flex h-full items-center gap-2')}>
          <div className='flex-1'>
            <Input
              type='text'
              placeholder='Enter pallet number'
              value={palletNumber}
              onChange={e => setPalletNumber(e.target.value)}
              className={cn(
                'h-9 border-input bg-background/50',
                textClasses['body-small'],
                'placeholder:text-muted-foreground'
              )}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleReprint}
            disabled={isLoading || !palletNumber.trim()}
            className={cn(
              'h-9 px-3',
              getWidgetCategoryColor('operations', 'gradient'),
              'hover:opacity-90',
              textClasses['body-small']
            )}
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
