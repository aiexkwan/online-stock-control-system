'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getUnifiedPrintingService, PrintType, PrintRequest } from '@/lib/printing';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';

interface UseReportPrintingOptions {
  reportType: 'transaction' | 'inventory' | 'aco-order' | 'grn';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseReportPrintingReturn {
  printReport: (data: ArrayBuffer | Blob, metadata?: any) => Promise<void>;
  downloadReport: (data: ArrayBuffer | Blob, filename: string) => void;
  isPrinting: boolean;
  isServiceAvailable: boolean;
}

export function useReportPrinting({
  reportType,
  onSuccess,
  onError,
}: UseReportPrintingOptions): UseReportPrintingReturn {
  const [isPrinting, setIsPrinting] = useState(false);
  const printingServiceRef = useRef<ReturnType<typeof getUnifiedPrintingService> | null>(null);
  const halRef = useRef<ReturnType<typeof getHardwareAbstractionLayer> | null>(null);
  const isServiceAvailable = useRef(false);

  // Initialize printing services
  useEffect(() => {
    console.log('[ReportPrinting] Initializing printing services...');

    const initServices = async () => {
      try {
        // Try unified printing service first
        const printingService = getUnifiedPrintingService();
        await printingService.initialize();
        printingServiceRef.current = printingService;
        isServiceAvailable.current = true;
        console.log('[ReportPrinting] ✅ Unified printing service initialized');
      } catch (err) {
        console.warn('[ReportPrinting] ⚠️ Unified service failed, trying HAL:', err);

        // Fallback to HAL
        try {
          const hal = getHardwareAbstractionLayer();
          await hal.initialize();
          halRef.current = hal;
          isServiceAvailable.current = true;
          console.log('[ReportPrinting] ✅ HAL initialized as fallback');
        } catch (halErr) {
          console.error('[ReportPrinting] ❌ Both services failed:', halErr);
          isServiceAvailable.current = false;
        }
      }
    };

    initServices();
  }, []);

  // Map report type to print type
  const getPrintType = useCallback((): PrintType => {
    switch (reportType) {
      case 'transaction':
        return PrintType.TRANSACTION_REPORT;
      case 'inventory':
        return PrintType.INVENTORY_REPORT;
      case 'aco-order':
        return PrintType.ACO_ORDER_REPORT;
      case 'grn':
        return PrintType.GRN_REPORT;
      default:
        return PrintType.CUSTOM_DOCUMENT;
    }
  }, [reportType]);

  // Download report function
  const downloadReport = useCallback(
    (data: ArrayBuffer | Blob, filename: string) => {
      try {
        const blob =
          data instanceof Blob
            ? data
            : new Blob([data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        toast.success('Report downloaded successfully');
        onSuccess?.();
      } catch (error) {
        console.error('[ReportPrinting] Download error:', error);
        const err = error instanceof Error ? error : new Error('Download failed');
        toast.error(`Download failed: ${err.message}`);
        onError?.(err);
      }
    },
    [onSuccess, onError]
  );

  // Print report function
  const printReport = useCallback(
    async (data: ArrayBuffer | Blob, metadata?: any) => {
      if (isPrinting) return;

      setIsPrinting(true);

      try {
        let pdfBlob: Blob;

        // Check if data is already a PDF blob
        if (data instanceof Blob && data.type === 'application/pdf') {
          // Use the provided PDF directly
          pdfBlob = data;
          console.log('[ReportPrinting] Using provided PDF blob');
        } else {
          // Convert to PDF if needed (for Excel or other formats)
          console.log('[ReportPrinting] Converting to PDF...');
          const pdfLib = await import('@/lib/services/unified-pdf-service');
          const { PDFDocument, rgb } = await pdfLib.getPDFLib();
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();

          // Add report title
          page.drawText(`${reportType.toUpperCase()} REPORT`, {
            x: 50,
            y: height - 50,
            size: 20,
            color: rgb(0, 0, 0),
          });

          // Add metadata if available
          if (metadata?.dateRange) {
            page.drawText(`Date Range: ${metadata.dateRange}`, {
              x: 50,
              y: height - 80,
              size: 12,
              color: rgb(0.3, 0.3, 0.3),
            });
          }

          // Add note about full report
          page.drawText(
            'This is a print preview. Please download the full Excel report for detailed data.',
            {
              x: 50,
              y: height - 120,
              size: 10,
              color: rgb(0.5, 0.5, 0.5),
            }
          );

          const pdfBytes = await pdfDoc.save();
          pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        }

        // Use printing service
        if (printingServiceRef.current) {
          console.log('[ReportPrinting] Using unified printing service');

          const printRequest: PrintRequest = {
            type: getPrintType(),
            data: {
              pdfBlob,
              reportType,
              ...metadata,
            },
            options: {
              copies: 1,
              paperSize: 'A4' as any,
              orientation: 'portrait',
              priority: 'normal' as any,
            },
            metadata: {
              userId: metadata?.userId || 'report-user',
              reference: reportType,
              tags: ['report', reportType],
            },
          };

          const result = await printingServiceRef.current.print(printRequest);
          if (!result.success) {
            throw new Error(result.error || 'Print failed');
          }

          toast.success('Report sent to print queue');
          onSuccess?.();
        } else if (halRef.current) {
          // Use HAL directly
          console.log('[ReportPrinting] Using HAL directly');

          const printJob = {
            type: 'report' as const, // HAL only supports 'report', not 'grn-report'
            data: {
              pdfBlob,
              reportType,
              ...metadata,
            },
            copies: 1,
            priority: 'normal' as const,
          };

          const result = await halRef.current.print(printJob);
          if (!result.success) {
            throw new Error(result.error || 'Print failed');
          }

          toast.success('Report sent to print queue');
          onSuccess?.();
        } else {
          // Fallback - open PDF in new window
          console.log('[ReportPrinting] Using fallback - opening in new window');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
          URL.revokeObjectURL(pdfUrl);

          toast.info('Report opened in new window for printing');
          onSuccess?.();
        }
      } catch (error) {
        console.error('[ReportPrinting] Print error:', error);
        const err = error instanceof Error ? error : new Error('Print failed');
        toast.error(`Print failed: ${err.message}`);
        onError?.(err);
      } finally {
        setIsPrinting(false);
      }
    },
    [isPrinting, reportType, getPrintType, onSuccess, onError]
  );

  return {
    printReport,
    downloadReport,
    isPrinting,
    isServiceAvailable: isServiceAvailable.current,
  };
}
