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

  React.useEffect(() => {
    if (isOpen) {
      // 動態導入以避免服務端渲染問題
      import('@/app/components/reports/core/ReportRegistry').then(({ ReportRegistry }) => {
        const report = ReportRegistry.getReport('order-loading-report');
        if (report) {
          setReportConfig(report.config);
        }
      });
    }
  }, [isOpen]);

  if (!reportConfig) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogStyles.content} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <svg
              className={`h-6 w-6 ${iconColors.green}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
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
