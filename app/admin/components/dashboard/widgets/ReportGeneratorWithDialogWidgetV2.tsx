/**
 * Report Generator With Dialog Widget V2
 * 使用 DashboardAPI + 服務器端 reference 加載
 * 遷移自原 ReportGeneratorWithDialogWidget
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminDialog as Dialog,
  AdminDialogContent as DialogContent,
  AdminDialogDescription as DialogDescription,
  AdminDialogFooter as DialogFooter,
  AdminDialogHeader as DialogHeader,
  AdminDialogTitle as DialogTitle,
} from '@/app/admin/components/ui/admin-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { cn } from '@/lib/utils';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

interface ReportGeneratorWithDialogWidgetV2Props {
  title: string;
  reportType: string;
  description?: string;
  dialogTitle: string;
  dialogDescription: string;
  selectLabel: string;
  dataTable: string;
  referenceField: string;
  apiEndpoint?: string;
}

export const ReportGeneratorWithDialogWidgetV2 = function ReportGeneratorWithDialogWidgetV2({
  title,
  reportType,
  description,
  dialogTitle,
  dialogDescription,
  selectLabel,
  dataTable,
  referenceField,
  apiEndpoint,
}: ReportGeneratorWithDialogWidgetV2Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string>('');
  const [references, setReferences] = useState<string[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'downloading' | 'downloaded' | 'complete'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    optimized?: boolean;
  }>({});

  const loadReferences = useCallback(async () => {
    setIsLoadingRefs(true);
    setError(null);
    const startTime = performance.now();

    try {
      const api = createDashboardAPI();
      const result = await api.fetch({
        widgetIds: ['report_references'],
        params: {
          dataSource: 'report_references',
          staticValue: dataTable,
          label: referenceField,
          limit: 1000,
          offset: 0,
        },
      });

      const endTime = performance.now();
      setPerformanceMetrics({
        apiResponseTime: Math.round(endTime - startTime),
        optimized: false, // metadata doesn't have optimized property
      });

      // Check if widget data contains error
      if (result.widgets?.[0]?.data?.error) {
        throw new Error(result.widgets[0].data.error);
      }

      setReferences((result.widgets?.[0]?.data?.value as string[]) || []);
      setMetadata(result.metadata || {});
    } catch (err) {
      console.error('Error loading references:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setReferences([]);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [dataTable, referenceField]);

  // Load references when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadReferences();
    }
  }, [isDialogOpen, loadReferences]);

  const handleDownload = async () => {
    if (!selectedRef || downloadStatus !== 'idle') return;

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
      // Call the API endpoint to generate report with selected reference
      const response = await fetch(apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          reference: selectedRef,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Download the report
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${selectedRef}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      clearInterval(interval);
      setProgress(100);
      setDownloadStatus('downloaded');

      // Close dialog and reset
      setTimeout(() => {
        setIsDialogOpen(false);
        setSelectedRef('');
        setDownloadStatus('idle');
        setProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(interval);
      setDownloadStatus('idle');
      setProgress(0);
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  };

  // Memoize sorted references for better performance
  const sortedReferences = useMemo(() => {
    return [...references].sort((a, b) => {
      // Try to sort numerically if possible
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA; // Descending order for numbers
      }
      return a.localeCompare(b);
    });
  }, [references]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex h-full items-center justify-between px-6'
      >
        <div className='flex-1'>
          <p className='text-2xl text-muted-foreground'>
            {description || `Generate ${title.toLowerCase()}`}
          </p>
          {performanceMetrics.apiResponseTime && (
            <p className='mt-1 text-xs text-slate-500'>
              Last loaded in {performanceMetrics.apiResponseTime}ms
              {performanceMetrics.optimized && ' (server-optimized)'}
            </p>
          )}
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          size='lg'
          className='relative ml-4 select-none overflow-hidden px-8 py-6 text-lg'
        >
          <Download className='mr-3 h-6 w-6' />
          Download
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {error && (
              <div className='rounded-md border border-red-500/20 bg-red-500/10 p-3'>
                <p className='text-sm text-red-400'>{error}</p>
              </div>
            )}

            <div className='grid gap-2'>
              <label htmlFor='reference' className='text-sm font-medium text-slate-200'>
                {selectLabel}
              </label>
              <Select value={selectedRef} onValueChange={setSelectedRef}>
                <SelectTrigger
                  id='reference'
                  className='border-slate-600 bg-slate-700/50 text-white hover:bg-slate-700/70 focus:border-blue-500 focus:ring-blue-500/50'
                >
                  <SelectValue
                    placeholder={
                      isLoadingRefs ? 'Loading...' : `Select from ${references.length} options`
                    }
                  />
                </SelectTrigger>
                <SelectContent className='max-h-[300px] border-slate-700 bg-slate-800'>
                  {sortedReferences.map(ref => (
                    <SelectItem
                      key={ref}
                      value={ref}
                      className='text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white'
                    >
                      {ref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {metadata.totalCount && metadata.totalCount > references.length && (
                <p className='text-xs text-slate-400'>
                  Showing first {references.length} of {metadata.totalCount} total references
                </p>
              )}

              {metadata.queryTime && (
                <p className='text-[10px] text-green-400'>
                  ✓ Server-side query completed in {metadata.queryTime}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDialogOpen(false)}
              className='border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!selectedRef || downloadStatus !== 'idle'}
              className={cn(
                'relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/25',
                downloadStatus === 'downloading' && 'from-blue-600/50 to-cyan-600/50',
                downloadStatus !== 'idle' && 'pointer-events-none',
                !selectedRef &&
                  'from-slate-600 to-slate-600 hover:from-slate-600 hover:to-slate-600'
              )}
            >
              {downloadStatus === 'idle' && (
                <>
                  <Download className='mr-2 h-4 w-4' />
                  Generate Report
                </>
              )}
              {downloadStatus === 'downloading' && (
                <div className='z-[5] flex items-center justify-center'>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {Math.round(progress)}%
                </div>
              )}
              {downloadStatus === 'downloaded' && (
                <>
                  <CheckCircle className='mr-2 h-4 w-4' />
                  <span>Downloaded</span>
                </>
              )}
              {downloadStatus === 'downloading' && (
                <div
                  className='absolute inset-0 bottom-0 left-0 z-[3] h-full bg-white/20 transition-all duration-200 ease-in-out'
                  style={{ width: `${progress}%` }}
                />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportGeneratorWithDialogWidgetV2;
