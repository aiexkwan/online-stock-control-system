/**
 * 使用統一報表框架的 Stock Take Report Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportBuilder } from '@/app/components/reports/core/ReportBuilder';
import { useReportGeneration } from '@/app/components/reports/hooks/useReportGeneration';
import { ReportFormat, FilterValues } from '@/app/components/reports/core/ReportConfig';
import { useToast } from '@/components/ui/use-toast';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

interface UnifiedStockTakeReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function UnifiedStockTakeReportDialog({ 
  isOpen, 
  onClose, 
  defaultDate 
}: UnifiedStockTakeReportDialogProps) {
  const { toast } = useToast();
  const { generateReport } = useReportGeneration('stock-take-report', {
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
    // 將過濾器數據傳給數據源
    const enhancedFilters = {
      ...filters,
      filters // 保留原始過濾器供數據源使用
    };
    await generateReport(format, enhancedFilters);
  };

  // 動態加載報表配置
  const [reportConfig, setReportConfig] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (isOpen) {
      // 動態導入以避免服務端渲染問題
      import('@/app/components/reports/core/ReportRegistry').then(({ ReportRegistry }) => {
        const report = ReportRegistry.getReport('stock-take-report');
        if (report) {
          // 如果有默認日期，更新配置
          if (defaultDate) {
            const config = { ...report.config };
            const dateFilter = config.filters.find((f: any) => f.id === 'stockTakeDate');
            if (dateFilter) {
              dateFilter.defaultValue = defaultDate;
            }
            setReportConfig(config);
          } else {
            setReportConfig(report.config);
          }
        }
      });
    }
  }, [isOpen, defaultDate]);

  if (!reportConfig) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogStyles.content} max-w-2xl`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <svg className={`h-6 w-6 ${iconColors.blue}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Generate Stock Take Report
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