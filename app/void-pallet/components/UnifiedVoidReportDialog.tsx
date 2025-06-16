/**
 * 使用統一報表框架的 Void Report Dialog
 * 逐步替換現有的 VoidReportDialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportBuilder } from '@/app/components/reports/core/ReportBuilder';
import { useReportGeneration } from '@/app/components/reports/hooks/useReportGeneration';
import { ReportFormat, FilterValues } from '@/app/components/reports/core/ReportConfig';
import { useToast } from '@/components/ui/use-toast';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

interface UnifiedVoidReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedVoidReportDialog({ isOpen, onClose }: UnifiedVoidReportDialogProps) {
  const { toast } = useToast();
  const { generateReport } = useReportGeneration('void-pallet-report', {
    onSuccess: (blob, filename) => {
      toast({
        title: 'Report Generated',
        description: `${filename} has been downloaded successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Report Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
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
        const report = ReportRegistry.getReport('void-pallet-report');
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
            <svg className={`h-6 w-6 ${iconColors.red}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Generate Void Pallet Report
          </DialogTitle>
        </DialogHeader>
        <ReportBuilder
          config={reportConfig}
          onGenerate={handleGenerate}
        />
      </DialogContent>
    </Dialog>
  );
}