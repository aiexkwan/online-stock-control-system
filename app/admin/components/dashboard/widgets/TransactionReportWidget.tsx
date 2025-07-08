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
import { useToast } from '@/components/ui/use-toast';
import { buildTransactionReport } from '@/lib/exportReport';
import { getTransactionReportData } from '@/app/actions/reportActions';
import { type DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { useReportPrinting } from '@/app/admin/hooks/useReportPrinting';

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
  const { toast } = useToast();
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
      toast({
        title: 'Success',
        description: 'Report processed successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Invalid Date Range',
        description: 'Please select a date range',
        variant: 'destructive',
      });
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
      downloadReport(buffer, filename);

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

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
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
    <div className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm'>
      <div className='flex-shrink-0 border-b border-gray-700/50 px-3 py-2'>
        <h3 className='text-sm font-semibold text-white'>{title}</h3>
        <p className='mt-0.5 text-xs text-gray-400'>{description || 'Stock Transfer Report'}</p>
      </div>
      <div className='min-h-0 flex-1 overflow-visible p-3'>
        <div className='flex h-full items-center space-x-2'>
          <div className='relative flex-1'>
            <button
              ref={buttonRef}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={cn(
                'flex h-9 w-full items-center gap-2 px-3 py-2',
                'bg-gray-800/50 hover:bg-gray-700/50',
                'border border-gray-700 hover:border-gray-600',
                'rounded text-sm transition-all',
                'text-left'
              )}
            >
              <CalendarIcon className='h-4 w-4 text-gray-400' />
              <span className='flex-1 text-white'>{getDateRangeLabel()}</span>
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
                      'fixed bg-slate-900',
                      'backdrop-blur-xl',
                      'z-[9999] rounded-lg border border-gray-600 shadow-2xl',
                      'p-3',
                      'min-w-[280px]'
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
                        caption_label: 'text-white text-sm',
                        nav: 'text-white',
                        nav_button: cn('h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100'),
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex',
                        head_cell: 'text-gray-500 rounded-md w-7 font-normal text-xs',
                        row: 'flex w-full mt-1',
                        cell: 'text-center text-xs p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                        day: cn(
                          'h-7 w-7 p-0 font-normal aria-selected:opacity-100 text-gray-300',
                          'hover:bg-gray-800 hover:text-white rounded-md'
                        ),
                        day_selected:
                          'bg-gray-700 text-white hover:bg-gray-600 hover:text-white focus:bg-gray-700 focus:text-white',
                        day_today: 'bg-gray-800 text-white',
                        day_outside: 'text-gray-600 opacity-50',
                        day_disabled: 'text-gray-600 opacity-50',
                        day_range_middle: 'aria-selected:bg-gray-800 aria-selected:text-white',
                        day_hidden: 'invisible',
                      }}
                      disabled={{
                        after: new Date(),
                      }}
                    />

                    {/* Action buttons */}
                    <div className='mt-3 flex justify-end gap-2 border-t border-gray-700 pt-3'>
                      <button
                        onClick={() => setIsCalendarOpen(false)}
                        className='rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white'
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
                    toast({
                      title: 'Invalid Date Range',
                      description: 'Please select a date range',
                      variant: 'destructive',
                    });
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
                    await printReport(buffer, {
                      dateRange: `${format(fromDate, 'MMM d')} - ${format(toDate, 'MMM d, yyyy')}`,
                      startDate,
                      endDate,
                    });
                  } catch (error) {
                    console.error('Print failed:', error);
                  }
                }}
                disabled={isPrinting || downloadStatus !== 'idle'}
                className={cn(
                  'h-9 px-3',
                  'bg-gray-600 text-white hover:bg-gray-700',
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
                'bg-blue-600 text-white hover:bg-blue-700',
                downloadStatus === 'downloading' && 'bg-blue-600/50',
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
                  className='absolute inset-0 bottom-0 left-0 z-[3] h-full bg-blue-500 transition-all duration-200 ease-in-out'
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
