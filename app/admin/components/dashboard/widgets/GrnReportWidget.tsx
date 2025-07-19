/**
 * GRN Report Widget
 * 遷移至 REST API 架構，移除版本號
 * 使用 NestJS GRN API 端點進行數據獲取
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseRecord } from '@/lib/types/database';
import { Download, CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { exportGrnReport } from '@/lib/exportReport';
import { useReportPrinting } from '@/app/admin/hooks/useReportPrinting';
import { WidgetSkeleton } from './common/WidgetStates';
import { GrnReportExportData } from './types/GrnReportTypes';
import { GrnReportPageData } from '@/app/actions/reportActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';

interface GrnReportWidgetProps {
  title: string;
  reportType: string;
  description?: string;
  apiEndpoint?: string;
}

// GRN Report Data interface
interface GrnReportData {
  material_description?: string;
  supplier_name?: string;
  report_date?: string;
  records?: DatabaseRecord[];
  error?: string;
  [key: string]: unknown;
}

// REST API client for GRN endpoints
const grnApiClient = {
  async getReferences(): Promise<string[]> {
    const response = await fetch('/api/v1/grn/references', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GRN references: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.references || [];
  },

  async getMaterialCodes(grnRef: string): Promise<string[]> {
    const response = await fetch(`/api/v1/grn/${grnRef}/material-codes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch material codes: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.materialCodes || [];
  },

  async getReportData(grnRef: string, productCodes?: string[]): Promise<GrnReportData> {
    const url = new URL(`/api/v1/grn/${grnRef}/report-data`, window.location.origin);
    if (productCodes && productCodes.length > 0) {
      url.searchParams.append('productCodes', JSON.stringify(productCodes));
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report data: ${response.statusText}`);
    }
    
    return await response.json();
  },
};

export const GrnReportWidget = function GrnReportWidget({
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

  // Use unified printing hook
  const { printReport, isPrinting, isServiceAvailable } = useReportPrinting({
    reportType: 'grn',
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'GRN report sent to print queue',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Print error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const fetchGrnRefs = useCallback(async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      const refs = await grnApiClient.getReferences();
      const endTime = performance.now();

      setGrnRefs(refs);

      // Set default selection
      if (refs.length > 0 && !selectedGrnRef) {
        setSelectedGrnRef(refs[0]);
      }

      setPerformanceMetrics({
        lastFetchTime: Math.round(endTime - startTime),
        optimized: true,
      });
    } catch (error) {
      console.error('[GrnReportWidget as string] Error fetching GRN references:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch GRN references',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedGrnRef, toast]);

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
      const userEmail = 'report@system.local';

      // Get material codes for the selected grn_ref
      const materialCodes = await grnApiClient.getMaterialCodes(selectedGrnRef);

      if (materialCodes.length === 0) {
        throw new Error('No materials found for the selected GRN reference');
      }

      // Generate report for each material code
      let successCount = 0;
      for (const materialCode of materialCodes) {
        try {
          const reportData = await grnApiClient.getReportData(selectedGrnRef, [materialCode as string]);
          
          if (reportData && !reportData.error) {
            // Convert to GrnReportPageData format expected by exportGrnReport
            const pageData: GrnReportPageData = {
              grn_ref: selectedGrnRef,
              user_id: userEmail,
              material_code: materialCode as string,
              material_description: (reportData as any).material_description || null,
              supplier_name: (reportData as any).supplier_name || null,
              report_date: new Date().toISOString().split('T')[0],
              records: (reportData as any).records || [],
              total_gross_weight: 0,
              total_net_weight: 0,
              weight_difference: 0,
            };
            await exportGrnReport(pageData);
            successCount++;
          }
        } catch (error) {
          console.error(`Error generating report for material ${materialCode}:`, error);
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
      console.error('[GrnReportWidget as string] Download failed:', error);
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
      // Get material codes
      const materialCodes = await grnApiClient.getMaterialCodes(selectedGrnRef);

      if (!materialCodes || materialCodes.length === 0) {
        throw new Error('No material codes found for this GRN reference');
      }

      // For printing, we'll print the first material code
      const reportData = await grnApiClient.getReportData(selectedGrnRef, [materialCodes[0]]);
      
      if (!reportData || reportData.error) {
        throw new Error(reportData?.error || 'Failed to get report data');
      }

      console.log('[GrnReportWidget as string] Report data received:', reportData);

      // Generate PDF using pdf-lib
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Create a landscape page for the GRN report
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

      records.forEach((record: DatabaseRecord, index: number) => {
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

        // Fill table cells with data
        page.drawText(String(record.supplier_invoice_number) || '', {
          x: 30,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText(String(record.date_received) || '', {
          x: 155,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText('Y', {
          x: 215,
          y: yText,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.4, 0),
        });

        page.drawText((record.package_count || 0).toString(), {
          x: 275,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText((record.gross_weight || 0).toString(), {
          x: 325,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText((record.net_weight || 0).toString(), {
          x: 380,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        const grossWeight = typeof record.gross_weight === 'number' ? record.gross_weight : 0;
        const netWeight = typeof record.net_weight === 'number' ? record.net_weight : 0;
        const palletWeight = grossWeight - netWeight;
        page.drawText(palletWeight.toString(), {
          x: 435,
          y: yText,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText('Y', {
          x: 555,
          y: yText,
          size: 10,
          font: boldFont,
          color: rgb(0, 0.4, 0),
        });

        // Passed column with gray background
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
      await printReport(blob, {
        reportTitle: `GRN_${selectedGrnRef}_${materialCodes[0]}`,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[GrnReportWidget as string] Print error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to print report',
        variant: 'destructive',
      });
    }
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
        <p className={cn('mt-0.5', textClasses['label-small'], 'text-muted-foreground')}>{description || 'GRN Report'}</p>
      </div>
      <div className={cn('min-h-0 flex-1 overflow-visible', widgetSpacing.container)}>
        <div className={cn('flex h-full items-center gap-2')}>
          <div className='flex-1'>
            <Select
              value={selectedGrnRef}
              onValueChange={(value) => setSelectedGrnRef(value)}
              disabled={loading || grnRefs.length === 0}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-full',
                  'bg-background/50 hover:bg-background/70',
                  'border border-input hover:border-input/80',
                  'text-foreground',
                  textClasses['body-small']
                )}
              >
                <SelectValue
                  placeholder={loading ? 'Loading...' : grnRefs.length === 0 ? 'No GRN references' : 'Select GRN reference'}
                />
              </SelectTrigger>
              <SelectContent className={cn('border-border bg-card')}>
                {grnRefs.map((ref: string) => (
                  <SelectItem key={ref} value={ref} className={cn(
                    'text-foreground hover:bg-accent',
                    textClasses['body-small']
                  )}>
                    {ref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loading && (
              <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>Loading GRN references...</p>
            )}
            {!loading && grnRefs.length === 0 && (
              <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>No GRN references found</p>
            )}
          </div>

          <div className='flex gap-2'>
            {/* Print button */}
            {isServiceAvailable && (
              <Button
                onClick={handlePrint}
                size='sm'
                variant='outline'
                disabled={!selectedGrnRef || isPrinting || loading}
                className={cn(
                  'h-9 gap-2 px-3',
                  'bg-background/50 hover:bg-background/70',
                  'border-border hover:border-border/80',
                  'text-muted-foreground hover:text-foreground',
                  'transition-all duration-200',
                  textClasses['body-small']
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
              disabled={downloadStatus !== 'idle' || !selectedGrnRef || loading}
              className={cn(
                'h-9 gap-2 px-4',
                'bg-gradient-to-r',
                downloadStatus === 'idle'
                  ? getWidgetCategoryColor('reports', 'gradient')
                  : downloadStatus === 'downloading'
                    ? 'from-blue-600 to-cyan-600'
                    : downloadStatus === 'downloaded'
                      ? 'from-green-600 to-emerald-600'
                      : 'from-gray-600 to-gray-700',
                'font-medium text-primary-foreground',
                'transform transition-all duration-300',
                downloadStatus === 'downloaded' && 'scale-95',
                downloadStatus === 'complete' && 'scale-100',
                textClasses['body-small']
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
          <div className={cn(
            'mt-2 text-right',
            textClasses['label-small']
          )} style={{ color: semanticColors.success.DEFAULT }}>
            ✓ REST API optimized ({performanceMetrics.lastFetchTime}ms)
          </div>
        )}
      </div>
    </div>
  );
};

export default GrnReportWidget;