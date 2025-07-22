'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  getUnifiedPrintingService,
  PrintType,
  PrintRequest,
  PaperSize,
  PrintPriority,
} from '@/lib/printing';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';

interface UsePrintIntegrationReturn {
  printGrnLabels: (pdfBlobs: Blob[], metadata?: Record<string, unknown>) => Promise<void>;
  isServiceAvailable: boolean;
}

export const usePrintIntegration = (): UsePrintIntegrationReturn => {
  const printingServiceRef = useRef<ReturnType<typeof getUnifiedPrintingService> | null>(null);
  const halRef = useRef<ReturnType<typeof getHardwareAbstractionLayer> | null>(null);
  const isServiceAvailable = useRef(false);

  // Initialize printing services
  useEffect(() => {
    console.log('[GRN PrintIntegration] Initializing printing services...');

    const initServices = async () => {
      try {
        // Try unified printing service first
        const printingService = getUnifiedPrintingService();
        await printingService.initialize();
        printingServiceRef.current = printingService;
        isServiceAvailable.current = true;
        console.log('[GRN PrintIntegration] ✅ Unified printing service initialized');
      } catch (err) {
        console.warn('[GRN PrintIntegration] ⚠️ Unified service failed, trying HAL:', err);

        // Fallback to HAL
        try {
          const hal = getHardwareAbstractionLayer();
          await hal.initialize();
          halRef.current = hal;
          isServiceAvailable.current = true;
          console.log('[GRN PrintIntegration] ✅ HAL initialized as fallback');
        } catch (halErr) {
          console.error('[GRN PrintIntegration] ❌ Both services failed:', halErr);
          isServiceAvailable.current = false;
        }
      }
    };

    initServices();
  }, []);

  const printGrnLabels = useCallback(
    async (pdfBlobs: Blob[], metadata?: Record<string, unknown>) => {
      if (pdfBlobs.length === 0) {
        toast.error('No PDFs to print');
        return;
      }

      try {
        // Check which service is available
        if (printingServiceRef.current) {
          // Use unified printing service
          console.log('[GRN PrintIntegration] Using unified printing service');

          if (pdfBlobs.length === 1) {
            // Single label
            const printRequest: PrintRequest = {
              type: PrintType.GRN_LABEL,
              data: {
                pdfBlob: pdfBlobs[0],
                grnNumber: typeof metadata?.grnNumber === 'string' ? metadata.grnNumber : '',
                supplier: typeof metadata?.supplierCode === 'string' ? metadata.supplierCode : '',
                productCode: typeof metadata?.productCode === 'string' ? metadata.productCode : '',
                operator: typeof metadata?.userId === 'string' ? metadata.userId : '',
                ...metadata,
              },
              options: {
                copies: 1,
                paperSize: PaperSize.A4,
                orientation: 'portrait',
                priority: PrintPriority.NORMAL,
              },
              metadata: {
                userId: typeof metadata?.userId === 'string' ? metadata.userId : 'grn-user',
                source: 'grn-label-form',
                timestamp: new Date().toISOString(),
              },
            };

            const result = await printingServiceRef.current.print(printRequest);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success('GRN label sent to print queue');
          } else {
            // Multiple labels - merge first
            console.log('[GRN PrintIntegration] Merging multiple PDFs...');

            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();

            for (const pdfBlob of pdfBlobs) {
              const pdfBuffer = await pdfBlob.arrayBuffer();
              try {
                const pdfToMerge = await PDFDocument.load(pdfBuffer);
                const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
              } catch (error) {
                console.error('[GRN PrintIntegration] Error merging PDF:', error);
              }
            }

            const mergedPdfBytes = await mergedPdf.save();
            const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

            const printRequest: PrintRequest = {
              type: PrintType.GRN_LABEL,
              data: {
                pdfBlob: mergedPdfBlob,
                merged: true,
                grnNumber: typeof metadata?.grnNumber === 'string' ? metadata.grnNumber : '',
                supplier: typeof metadata?.supplierCode === 'string' ? metadata.supplierCode : '',
                productCode: typeof metadata?.productCode === 'string' ? metadata.productCode : '',
                operator: typeof metadata?.userId === 'string' ? metadata.userId : '',
                ...metadata,
              },
              options: {
                copies: 1,
                paperSize: PaperSize.A4,
                orientation: 'portrait',
                priority: PrintPriority.NORMAL,
              },
              metadata: {
                userId: typeof metadata?.userId === 'string' ? metadata.userId : 'grn-user',
                source: 'grn-label-form',
                timestamp: new Date().toISOString(),
              },
            };

            const result = await printingServiceRef.current.print(printRequest);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success(`${pdfBlobs.length} GRN labels sent to print queue`);
          }
        } else if (halRef.current) {
          // Use HAL directly
          console.log('[GRN PrintIntegration] Using HAL directly');

          if (pdfBlobs.length === 1) {
            const printJob = {
              type: 'grn-label' as const,
              data: {
                pdfBlob: pdfBlobs[0],
                ...metadata,
              },
              copies: 1,
              priority: 'normal' as const,
            };

            const result = await halRef.current.print(printJob);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success('GRN label sent to print queue');
          } else {
            // Merge PDFs for HAL
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();

            for (const pdfBlob of pdfBlobs) {
              const pdfBuffer = await pdfBlob.arrayBuffer();
              const pdfToMerge = await PDFDocument.load(pdfBuffer);
              const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

            const printJob = {
              type: 'grn-label' as const,
              data: {
                pdfBlob: mergedPdfBlob,
                merged: true,
                ...metadata,
              },
              copies: 1,
              priority: 'normal' as const,
            };

            const result = await halRef.current.print(printJob);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success(`${pdfBlobs.length} GRN labels sent to print queue`);
          }
        } else {
          // Fallback to legacy printing
          console.log('[GRN PrintIntegration] Using legacy printing');
          const { mergeAndPrintPdfs } = await import('@/lib/pdfUtils');
          const pdfArrayBuffers = await Promise.all(pdfBlobs.map(blob => blob.arrayBuffer()));
          await mergeAndPrintPdfs(pdfArrayBuffers, `GRN_Labels_${Date.now()}.pdf`);
          toast.success(`${pdfBlobs.length} GRN label(s) ready for printing`);
        }
      } catch (error) {
        console.error('[GRN PrintIntegration] Print error:', error);
        toast.error(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    []
  );

  return {
    printGrnLabels,
    isServiceAvailable: isServiceAvailable.current,
  };
};
