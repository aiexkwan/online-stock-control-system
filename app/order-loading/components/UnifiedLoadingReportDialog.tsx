/**
 * 使用統一報表框架的 Order Loading Report Dialog
 * 逐步替換現有的 LoadingReportDialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportBuilder } from '@/app/components/reports/core/ReportBuilder';
import { useReportGeneration } from '@/app/components/reports/hooks/useReportGeneration';
import { ReportFormat, FilterValues } from '@/app/components/reports/core/ReportConfig';
import { useToast } from '@/components/ui/use-toast';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { DynamicImportHandler } from '@/lib/utils/dynamic-import-handler';

interface UnifiedLoadingReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedLoadingReportDialog({ isOpen, onClose }: UnifiedLoadingReportDialogProps) {
  const { toast } = useToast();
  const { generateReport } = useReportGeneration('order-loading-report', {
    onSuccess: (blob, filename) => {
      toast({
        title: 'Report Generated',
        description: `${filename} has been downloaded successfully.`,
      });
      onClose();
    },
    onError: error => {
      toast({
        title: 'Report Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = async (format: ReportFormat, filters: FilterValues) => {
    await generateReport(format, filters);
  };

  // 動態加載報表配置
  const [reportConfig, setReportConfig] = React.useState<any>(null);
  const [loadingError, setLoadingError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      // 使用 DynamicImportHandler 進行安全的動態導入
      DynamicImportHandler.safeImport(
        () => import('@/app/components/reports/core/ReportRegistry'),
        {
          retryCount: 3,
          retryDelay: 1000,
          fallbackDelay: 2000,
          onError: (error) => {
            console.error('Failed to load report registry:', error);
            setLoadingError('Failed to load report configuration');
          }
        }
      )
        .then(({ ReportRegistry }) => {
          const report = ReportRegistry.getReport('order-loading-report');
          if (report) {
            setReportConfig(report.config);
            setLoadingError(null);
          } else {
            setLoadingError('Report configuration not found');
          }
        })
        .catch(error => {
          console.error('Final error loading report registry:', error);
          setLoadingError('Failed to load report configuration');
          
          // Attempt to recover after a delay
          setTimeout(() => {
            setLoadingError(null);
            setReportConfig(null);
          }, 3000);
        });
    }
  }, [isOpen]);

  if (loadingError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${dialogStyles.content} max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={dialogStyles.title}>
              <svg
                className={`h-6 w-6 ${iconColors.blue}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              Report Configuration Error
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-gray-400 mb-4">{loadingError}</p>
            <p className="text-sm text-gray-500">Attempting to recover...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reportConfig) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${dialogStyles.content} max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={dialogStyles.title}>
              <svg
                className={`h-6 w-6 ${iconColors.blue}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              Generate Order Loading Report
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading report configuration...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogStyles.content} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <svg
              className={`h-6 w-6 ${iconColors.blue}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            Generate Order Loading Report
          </DialogTitle>
        </DialogHeader>
        <ReportBuilder config={reportConfig} onGenerate={handleGenerate} />
      </DialogContent>
    </Dialog>
  );
}
