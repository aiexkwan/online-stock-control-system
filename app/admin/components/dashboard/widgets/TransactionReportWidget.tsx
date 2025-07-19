/**
 * Transaction Report Widget
 * 包含日期選擇器的交易報告生成器
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, CheckCircle, CalendarIcon, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useWidgetToast, WidgetToastPresets } from '@/app/admin/hooks/useWidgetToast';
import { buildTransactionReport } from '@/lib/exportReport';
import { getTransactionReportData } from '@/app/actions/reportActions';
import { type DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { useReportPrinting } from '@/app/admin/hooks/useReportPrinting';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';

interface TransactionReportWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  apiEndpoint?: string;
}

export const TransactionReportWidget = function TransactionReportWidget({
  title,
  reportType,
  description,
  apiEndpoint,
}: TransactionReportWidgetProps) {
  const { showSuccess, showError, showPromise } = useWidgetToast();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'downloading' | 'downloaded' | 'complete'
  >('idle');
  const [progress, setProgress] = useState(0);

  // Use unified printing hook
  const { printReport, downloadReport, isPrinting, isServiceAvailable } = useReportPrinting({
    reportType: 'transaction',
    onSuccess: () => {
      showSuccess('Report processed successfully');
    },
    onError: error => {
      showError((error as { message: string }).message);
    },
  });

  // Calculate calendar position when opening
  useEffect(() => {
    if (isCalendarOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isCalendarOpen]);

  const handleDownload = async () => {
    if (downloadStatus !== 'idle') return;

    // Validate dates
    if (!dateRange?.from) {
      showError('Please select a date range');
      return;
    }

    // If only from date is selected, use it as both start and end
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;

    setDownloadStatus('downloading');
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // Fetch transaction data for the date range
      const startDate = format(startOfDay(fromDate), 'yyyy-MM-dd');
      const endDate = format(endOfDay(toDate), 'yyyy-MM-dd');

      console.log('Generating report for date range:', { startDate, endDate });

      const reportData = await getTransactionReportData(startDate, endDate);

      if (!reportData) {
        throw new Error('No transaction data found for the selected date range');
      }

      // Generate Excel report
      const buffer = await buildTransactionReport(reportData);

      // Use unified download function
      const filename = `transaction-report-${startDate}-to-${endDate}.xlsx`;
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      downloadReport(arrayBuffer, filename);

      clearInterval(interval);
      setProgress(100);
      setDownloadStatus('downloaded');

      // Reset after 2 seconds
      setTimeout(() => {
        setDownloadStatus('complete');
        setTimeout(() => {
          setDownloadStatus('idle');
          setProgress(0);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(interval);
      setDownloadStatus('idle');
      setProgress(0);

      showError(error instanceof Error ? (error as { message: string }).message : 'Failed to generate report');
    }
  };

  // Get display label for date range
  const getDateRangeLabel = () => {
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;

      if (format(fromDate, 'yyyy-MM-dd') === format(toDate, 'yyyy-MM-dd')) {
        return format(fromDate, 'MMM d, yyyy');
      }
      return `${format(fromDate, 'MMM d')} - ${format(toDate, 'MMM d, yyyy')}`;
    }
    return 'Select dates';
  };

  return (
    <div className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-lg border backdrop-blur-sm',
      'border-border bg-card/40'
    )}>
      <div className={cn(
        'flex-shrink-0 border-b px-3 py-2',
        'border-border'
      )}>
        <h3 className={cn(textClasses['body-small'], 'font-semibold text-foreground')}>{title}</h3>
        <p className={cn('mt-0.5', textClasses['label-small'], 'text-muted-foreground')}>
          {description || 'Stock Transfer Report'}
        </p>
      </div>
      <div className='min-h-0 flex-1 overflow-visible p-3'>
        <div className='flex h-full items-center space-x-2'>
          <div className='relative flex-1'>
            <button
              ref={buttonRef}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={cn(
                'flex h-9 w-full items-center gap-2 px-3 py-2',
                'bg-background/50 hover:bg-background/70',
                'border border-border hover:border-border/80',
                'rounded transition-all',
                'text-left',
                textClasses['body-small']
              )}
            >
              <CalendarIcon className='h-4 w-4 text-muted-foreground' />
              <span className='flex-1 text-foreground'>{getDateRangeLabel()}</span>
            </button>

            {isCalendarOpen &&
              typeof window !== 'undefined' &&
              createPortal(
                <>
                  {/* Click outside to close */}
                  <div
                    className='fixed inset-0 z-[9998]'
                    onClick={() => setIsCalendarOpen(false)}
                  />

                  {/* Calendar dropdown */}
                  <div
                    className={cn(
                      'fixed bg-card backdrop-blur-xl',
                      'z-[9999] rounded-lg border shadow-2xl',
                      'border-border p-3 min-w-[280px]'
                    )}
                    style={{
                      top: `${calendarPosition.top}px`,
                      left: `${calendarPosition.left}px`,
                    }}
                  >
                    <Calendar
                      mode='range'
                      selected={dateRange}
                      onSelect={setDateRange}
                      defaultMonth={dateRange?.from}
                      numberOfMonths={1}
                      className='bg-transparent p-0 [&_.rdp]:bg-transparent'
                      classNames={{
                        months: 'flex flex-col',
                        month: 'space-y-2',
                        caption_label: cn('text-foreground', textClasses['body-small']),
                        nav: 'text-foreground',
                        nav_button: cn('h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100'),
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex',
                        head_cell: cn('text-muted-foreground rounded-md w-7 font-normal', textClasses['label-small']),
                        row: 'flex w-full mt-1',
                        cell: 'text-center p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                        day: cn(
                          'h-7 w-7 p-0 font-normal aria-selected:opacity-100 text-muted-foreground',
                          'hover:bg-accent hover:text-accent-foreground rounded-md',
                          textClasses['label-small']
                        ),
                        day_selected:
                          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                        day_today: 'bg-accent text-accent-foreground',
                        day_outside: 'text-muted-foreground/50 opacity-50',
                        day_disabled: 'text-muted-foreground/50 opacity-50',
                        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        day_hidden: 'invisible',
                      }}
                      disabled={{
                        after: new Date(),
                      }}
                    />

                    {/* Action buttons */}
                    <div className='mt-3 flex justify-end gap-2 border-t border-border pt-3'>
                      <button
                        onClick={() => setIsCalendarOpen(false)}
                        className={cn(
                          'rounded bg-secondary px-3 py-1.5 transition-colors',
                          'hover:bg-secondary/80 text-secondary-foreground hover:text-secondary-foreground',
                          textClasses['label-small']
                        )}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
          </div>

          <div className='flex gap-2'>
            {/* Print button */}
            {isServiceAvailable && (
              <Button
                onClick={async () => {
                  if (!dateRange?.from) {
                    showError('Please select a date range');
                    return;
                  }

                  const fromDate = dateRange.from;
                  const toDate = dateRange.to || dateRange.from;
                  const startDate = format(startOfDay(fromDate), 'yyyy-MM-dd');
                  const endDate = format(endOfDay(toDate), 'yyyy-MM-dd');

                  try {
                    const reportData = await getTransactionReportData(startDate, endDate);
                    if (!reportData) throw new Error('No data found');

                    const buffer = await buildTransactionReport(reportData);
                    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
                    await printReport(arrayBuffer, {
                      reportTitle: `Transaction_Report_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`,
                      generatedAt: new Date().toISOString(),
                    });
                  } catch (error) {
                    console.error('Print failed:', error);
                  }
                }}
                disabled={isPrinting || downloadStatus !== 'idle'}
                className={cn(
                  'h-9 px-3',
                  'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  isPrinting && 'opacity-50'
                )}
                size='sm'
              >
                {isPrinting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Printer className='h-4 w-4' />
                )}
              </Button>
            )}

            {/* Download button */}
            <Button
              onClick={handleDownload}
              disabled={downloadStatus !== 'idle'}
              className={cn(
                'relative h-9 select-none overflow-hidden px-3',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                downloadStatus === 'downloading' && 'bg-primary/50',
                downloadStatus !== 'idle' && 'pointer-events-none'
              )}
              size='sm'
            >
              {downloadStatus === 'idle' && <Download className='h-4 w-4' />}
              {downloadStatus === 'downloading' && <Loader2 className='h-4 w-4 animate-spin' />}
              {downloadStatus === 'downloaded' && <CheckCircle className='h-4 w-4' />}
              {downloadStatus === 'complete' && <Download className='h-4 w-4' />}
              {downloadStatus === 'downloading' && (
                <div
                  className='absolute inset-0 bottom-0 left-0 z-[3] h-full bg-primary/80 transition-all duration-200 ease-in-out'
                  style={{ width: `${progress}%` }}
                />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReportWidget;
