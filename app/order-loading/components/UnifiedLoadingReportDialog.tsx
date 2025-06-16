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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Order Loading Report</DialogTitle>
        </DialogHeader>
        <ReportBuilder
          config={reportConfig}
          onGenerate={handleGenerate}
        />
      </DialogContent>
    </Dialog>
  );
}