/**
 * Unified Transaction Report Dialog
 * Integrated with the unified report framework
 */

'use client';

import React, { useState } from 'react';
import { UnifiedReportDialog } from '@/app/components/reports/core/UnifiedReportDialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { buildTransactionReport } from '@/lib/exportReport';
import { format } from 'date-fns';
import { getTransactionReportData } from '@/app/actions/reportActions';

interface UnifiedTransactionReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedTransactionReportDialog({ isOpen, onClose }: UnifiedTransactionReportDialogProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (format === 'excel') {
        // Fetch transaction data for the date range
        const reportData = await getTransactionReportData(startDate, endDate);
        
        if (!reportData) {
          throw new Error('No transaction data found for the selected date range');
        }
        
        // Generate Excel report
        await buildTransactionReport(reportData);
        
        toast({
          title: "Success",
          description: "Transaction report generated successfully",
        });
      } else {
        // PDF format not supported for transaction reports
        toast({
          title: "Format Not Supported",
          description: "Transaction reports are only available in Excel format",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedReportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Report"
      description="Generate product movement and transfer reports for a date range"
      formats={['excel']}
      onGenerate={handleGenerateReport}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Report includes all product transfers within the selected date range
        </p>
      </div>
    </UnifiedReportDialog>
  );
}