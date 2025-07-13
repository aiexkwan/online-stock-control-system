/**
 * GRN Report Widget V2
 * 使用 RPC 函數和 DashboardAPI 優化數據獲取
 * PDF 生成邏輯保留在客戶端
 * 遷移自原 GrnReportWidget
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { exportGrnReport } from '@/lib/exportReport';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { useReportPrinting } from '@/app/admin/hooks/useReportPrinting';
import { WidgetSkeleton } from './common/WidgetStates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';

interface GrnReportWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  apiEndpoint?: string;
}

export const GrnReportWidgetV2 = function GrnReportWidgetV2({
  title,
  reportType,
  description,
  apiEndpoint,
}: GrnReportWidgetProps) {
  const { toast } = useToast();
  const [grnRefs, setGrnRefs] = useState<string[]>([]);
  const [selectedGrnRef, setSelectedGrnRef] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'downloading' | 'downloaded' | 'complete'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastFetchTime?: number;
    optimized?: boolean;
  }>({});

  const api = createDashboardAPI();

  // Use unified printing hook
  const { printReport, isPrinting, isServiceAvailable } = useReportPrinting({
    reportType: 'grn',
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'GRN report sent to print queue',
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

  const fetchGrnRefs = useCallback(async () => {
    try {
      const startTime = performance.now();

      const result = await api.fetch({
        widgetIds: ['grn_references'],
        params: {
          dataSource: 'grn_references',
          limit: 1000,
          offset: 0,
        },
      });

      const endTime = performance.now();

      if (result.widgets && result.widgets.length > 0) {
        const widgetData = result.widgets[0];

        if (widgetData.data.error) {
          console.error('[GrnReportWidgetV2] Error:', widgetData.data.error);
          toast({
            title: 'Error',
            description: 'Failed to fetch GRN references',
            variant: 'destructive',
          });
          return;
        }

        const refs = widgetData.data.value || [];
        setGrnRefs(refs);

        // Set default selection
        if (refs.length > 0 && !selectedGrnRef) {
          setSelectedGrnRef(refs[0]);
        }

        setPerformanceMetrics({
          lastFetchTime: Math.round(endTime - startTime),
          optimized: true,
        });
      }
    } catch (error) {
      console.error('[GrnReportWidgetV2] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch GRN references',
        variant: 'destructive',
      });
    }
  }, [api, toast, selectedGrnRef]);

  // Fetch GRN references when component mounts
  useEffect(() => {
    fetchGrnRefs();
  }, [fetchGrnRefs]);

  const handleDownload = async () => {
    if (!selectedGrnRef) {
      toast({
        title: 'No GRN Selected',
        description: 'Please select a GRN reference',
        variant: 'destructive',
      });
      return;
    }

    if (downloadStatus !== 'idle') return;

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
      // User authentication is handled in the export function
      // Using default email for now - this should be provided by the server
      const userEmail = 'report@system.local';

      // Get material codes for the selected grn_ref using RPC
      const materialResult = await api.fetch({
        widgetIds: ['grn_material_codes'],
        params: {
          dataSource: 'grn_material_codes',
          staticValue: selectedGrnRef,
        },
      });

      if (!materialResult.widgets || materialResult.widgets.length === 0) {
        throw new Error('Failed to fetch material codes');
      }

      const materialCodes = materialResult.widgets[0].data.value || [];

      if (materialCodes.length === 0) {
        throw new Error('No materials found for the selected GRN reference');
      }

      // Generate report for each material code
      let successCount = 0;
      for (const materialCode of materialCodes) {
        // Fetch report data using RPC
        const reportResult = await api.fetch({
          widgetIds: ['grn_report_data'],
          params: {
            dataSource: 'grn_report_data',
            staticValue: selectedGrnRef,
            productCodes: [materialCode],
          },
        });

        if (reportResult.widgets && reportResult.widgets.length > 0) {
          const reportData = reportResult.widgets[0].data.value;
          if (reportData && !reportData.error) {
            // Export using existing PDF generation logic
            await exportGrnReport({
              ...reportData,
              uploader_email: userEmail,
              uploader_name: userEmail.split('@')[0], // Simple fallback
            });
            successCount++;
          }
        }
      }

      clearInterval(interval);
      setProgress(100);
      setDownloadStatus('downloaded');

      toast({
        title: 'Success',
        description: `GRN reports generated for ${successCount} material code(s)`,
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setDownloadStatus('complete');
        setTimeout(() => {
          setDownloadStatus('idle');
          setProgress(0);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('[GrnReportWidgetV2] Download failed:', error);
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

  const handlePrint = async () => {
    if (!selectedGrnRef) {
      toast({
        title: 'Error',
        description: 'Please select a GRN reference',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get material codes using RPC
      const materialResult = await api.fetch({
        widgetIds: ['grn_material_codes'],
        params: {
          dataSource: 'grn_material_codes',
          staticValue: selectedGrnRef,
        },
      });

      if (!materialResult.widgets || materialResult.widgets.length === 0) {
        throw new Error('Failed to fetch material codes');
      }

      const materialCodes = materialResult.widgets[0].data.value || [];

      if (!materialCodes || materialCodes.length === 0) {
        throw new Error('No material codes found for this GRN reference');
      }

      // User authentication is handled in the print service
      const userEmail = 'report@system.local';

      // For printing, we'll just print the first material code
      // Fetch report data using RPC
      const reportResult = await api.fetch({
        widgetIds: ['grn_report_data'],
        params: {
          dataSource: 'grn_report_data',
          staticValue: selectedGrnRef,
          productCodes: [materialCodes[0]],
        },
      });

      if (!reportResult.widgets || reportResult.widgets.length === 0) {
        throw new Error('Failed to get report data');
      }

      const reportData = reportResult.widgets[0].data.value;
      if (!reportData || reportData.error) {
        throw new Error(reportData?.error || 'Failed to get report data');
      }

      console.log('[GrnReportWidgetV2] Report data received:', reportData);

      // Generate a proper PDF from the GRN report data
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Create a landscape page for the GRN report (Excel style)
      const page = pdfDoc.addPage([842, 595]); // A4 Landscape
      const { width, height } = page.getSize();
      let yPosition = height - 40;

      // Draw GRN Number box (top right)
      page.drawRectangle({
        x: width - 180,
        y: yPosition - 40,
        width: 150,
        height: 35,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
      });
      page.drawText('G.R.N. Number:', {
        x: width - 270,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(selectedGrnRef, {
        x: width - 160,
        y: yPosition - 20,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Draw PASS/FAIL boxes
      page.drawRectangle({
        x: width - 180,
        y: yPosition - 85,
        width: 70,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      page.drawText('PASS', {
        x: width - 160,
        y: yPosition - 70,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawRectangle({
        x: width - 100,
        y: yPosition - 85,
        width: 70,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      page.drawText('FAIL', {
        x: width - 80,
        y: yPosition - 70,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Left side - Material info
      yPosition = height - 60;
      const leftLabels = [
        { label: 'Code:', value: materialCodes[0] },
        { label: 'Description:', value: reportData.material_description || 'N/A' },
        { label: 'Supplier Name:', value: reportData.supplier_name || 'N/A' },
        { label: 'Our Order No.:', value: '' },
        { label: 'Date:', value: reportData.report_date || new Date().toLocaleDateString('en-US') },
      ];

      leftLabels.forEach((item, index) => {
        page.drawText(item.label, {
          x: 100,
          y: yPosition - index * 20,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(item.value, {
          x: 200,
          y: yPosition - index * 20,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
      });

      // Draw table headers
      yPosition = height - 180;
      const tableHeaders = [
        { text: 'Supplier Invoice No.', x: 30, width: 120 },
        { text: 'In Date', x: 155, width: 55 },
        { text: 'Package', x: 215, width: 55 },
        { text: 'Qty of Package', x: 275, width: 45 },
        { text: 'Gross WT', x: 325, width: 50 },
        { text: 'Net WT', x: 380, width: 50 },
        { text: 'Pallet WT', x: 435, width: 50 },
        { text: 'Remark', x: 490, width: 60 },
        { text: 'Labels Check', x: 555, width: 60 },
        { text: 'Q.C. Report', x: 620, width: 80 },
        { text: 'Passed', x: 705, width: 50 },
      ];

      // Draw header row background
      page.drawRectangle({
        x: 25,
        y: yPosition - 20,
        width: 730,
        height: 20,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Draw headers
      tableHeaders.forEach(header => {
        page.drawText(header.text, {
          x: header.x,
          y: yPosition - 15,
          size: 9,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });

      // Draw table data
      yPosition -= 20;
      const records = reportData.records || [];
      const rowHeight = 20;

      records.forEach((record: any, index: number) => {
        // Draw row borders
        page.drawRectangle({
          x: 25,
          y: yPosition - rowHeight,
          width: 730,
          height: rowHeight,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });

        const yText = yPosition - 15;

        // Supplier Invoice No
        page.drawText(record.supplier_invoice_number || '', {
          x: 30,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Date
        page.drawText(record.date_received || '', {
          x: 155,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Package (with Y for Yes)
        page.drawText('Y', {
          x: 215,
          y: yText,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.4, 0),
        });

        // Qty of Package
        page.drawText((record.package_count || 0).toString(), {
          x: 275,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Gross Weight
        page.drawText((record.gross_weight || 0).toString(), {
          x: 325,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Net Weight
        page.drawText((record.net_weight || 0).toString(), {
          x: 380,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Calculate pallet weight (gross - net)
        const palletWeight = (record.gross_weight || 0) - (record.net_weight || 0);
        page.drawText(palletWeight.toString(), {
          x: 435,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Labels Check (Y for Yes)
        page.drawText('Y', {
          x: 555,
          y: yText,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.4, 0),
        });

        // Passed column (with Y in gray area)
        page.drawRectangle({
          x: 705,
          y: yPosition - rowHeight,
          width: 50,
          height: rowHeight,
          color: rgb(0.9, 0.9, 0.9),
        });
        page.drawText('Y', {
          x: 725,
          y: yText,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.4, 0),
        });

        yPosition -= rowHeight;
      });

      // Send to print service
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      await printReport(blob, `GRN_${selectedGrnRef}_${materialCodes[0]}`);
    } catch (error) {
      console.error('[GrnReportWidgetV2] Print error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to print report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm'>
      <div className='flex-shrink-0 border-b border-gray-700/50 px-3 py-2'>
        <h3 className='text-sm font-semibold text-white'>{title}</h3>
        <p className='mt-0.5 text-xs text-gray-400'>{description || 'GRN Report'}</p>
      </div>
      <div className='min-h-0 flex-1 overflow-visible p-3'>
        <div className='flex h-full items-center space-x-2'>
          <div className='flex-1'>
            <Select
              value={selectedGrnRef}
              onValueChange={setSelectedGrnRef}
              disabled={grnRefs.length === 0}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-full',
                  'bg-gray-800/50 hover:bg-gray-700/50',
                  'border border-gray-700 hover:border-gray-600',
                  'text-white'
                )}
              >
                <SelectValue
                  placeholder={grnRefs.length === 0 ? 'Loading...' : 'Select GRN reference'}
                />
              </SelectTrigger>
              <SelectContent className='border-slate-700 bg-slate-900'>
                {grnRefs.map(ref => (
                  <SelectItem key={ref} value={ref} className='text-white hover:bg-slate-800'>
                    {ref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {grnRefs.length === 0 && (
              <p className='mt-1 text-xs text-gray-500'>No GRN references found</p>
            )}
          </div>

          <div className='flex gap-2'>
            {/* Print button */}
            {isServiceAvailable && (
              <Button
                onClick={handlePrint}
                size='sm'
                variant='outline'
                disabled={!selectedGrnRef || isPrinting}
                className={cn(
                  'h-9 gap-2 px-3',
                  'bg-gray-800/50 hover:bg-gray-700/50',
                  'border-gray-700 hover:border-gray-600',
                  'text-gray-300 hover:text-white',
                  'transition-all duration-200'
                )}
              >
                {isPrinting ? (
                  <WidgetSkeleton type='spinner' className='h-4 w-4' />
                ) : (
                  <Printer className='h-4 w-4' />
                )}
                Print
              </Button>
            )}

            {/* Download button */}
            <Button
              onClick={handleDownload}
              size='sm'
              disabled={downloadStatus !== 'idle' || !selectedGrnRef}
              className={cn(
                'h-9 gap-2 px-4',
                'bg-gradient-to-r',
                downloadStatus === 'idle'
                  ? 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500'
                  : downloadStatus === 'downloading'
                    ? 'from-blue-600 to-cyan-600'
                    : downloadStatus === 'downloaded'
                      ? 'from-green-600 to-emerald-600'
                      : 'from-gray-600 to-gray-700',
                'font-medium text-white',
                'transform transition-all duration-300',
                downloadStatus === 'downloaded' && 'scale-95',
                downloadStatus === 'complete' && 'scale-100'
              )}
            >
              {downloadStatus === 'idle' ? (
                <>
                  <Download className='h-4 w-4' />
                  Download
                </>
              ) : downloadStatus === 'downloading' ? (
                <>
                  <WidgetSkeleton type='spinner' className='h-4 w-4' />
                  {Math.round(progress)}%
                </>
              ) : downloadStatus === 'downloaded' ? (
                <>
                  <CheckCircle className='h-4 w-4' />
                  Done!
                </>
              ) : (
                <>
                  <Download className='h-4 w-4' />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Performance indicator */}
        {performanceMetrics.optimized && performanceMetrics.lastFetchTime && (
          <div className='mt-2 text-right text-[10px] text-green-400'>
            ✓ Server-optimized ({performanceMetrics.lastFetchTime}ms)
          </div>
        )}
      </div>
    </div>
  );
};

export default GrnReportWidgetV2;
