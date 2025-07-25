/**
 * usePdfGeneration Hook
 * 處理 PDF 生成相關的所有邏輯
 * Enhanced with unified printing service for better print queue management
 */

import { useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '@/types/core/error';
import { toast } from 'sonner';
import { renderReactPDFToBlob, loadPDF } from '@/lib/services/unified-pdf-service';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { prepareQcLabelData, mergeAndPrintPdfs, type QcInputData } from '@/lib/pdfUtils';
import { uploadPdfToStorage, updatePalletPdfUrl } from '@/app/actions/qcActions';
import { getOrdinalSuffix, getAcoPalletCount } from '@/app/utils/qcLabelHelpers';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';
import {
  getUnifiedPrintingService,
  PrintType,
  PrintRequest,
  PaperSize,
  PrintPriority,
} from '@/lib/printing';
import type { ProductInfo } from '../../types';

interface PdfGenerationOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  palletNumbers: string[];
  series: string[];
  formData: {
    operator?: string;
    acoOrderRef?: string;
    slateDetail?: {
      batchNumber: string;
    };
  };
  clockNumber: string;
  onProgress?: (current: number, status: 'Processing' | 'Success' | 'Failed') => void;
}

interface UsePdfGenerationReturn {
  generatePdfs: (options: PdfGenerationOptions) => Promise<{
    success: boolean;
    pdfBlobs: Blob[];
    uploadedUrls: string[];
    errors: string[];
  }>;
  printPdfs: (
    pdfBlobs: Blob[],
    productCode: string,
    palletNumbers: string[],
    series: string[],
    quantity?: number,
    operator?: string
  ) => Promise<void>;
  // Enhanced with hardware service features
  getPrintQueueStatus?: () => { pending: number; processing: number };
  cancelPrintJob?: (jobId: string) => Promise<boolean>;
}

export const usePdfGeneration = (): UsePdfGenerationReturn => {
  const supabase = createClient();

  // Initialize hardware abstraction layer for enhanced printing
  const halRef = useRef<ReturnType<typeof getHardwareAbstractionLayer> | null>(null);
  const useHardwareServices = useRef(false);

  // Initialize unified printing service
  const printingServiceRef = useRef<ReturnType<typeof getUnifiedPrintingService> | null>(null);
  const usePrintingService = useRef(false);

  useEffect(() => {
    console.log('[PrintPDF] Attempting to initialize unified printing service...');
    try {
      const printingService = getUnifiedPrintingService();
      printingService
        .initialize()
        .then(() => {
          printingServiceRef.current = printingService;
          usePrintingService.current = true;
          console.log('[PrintPDF] ✅ Unified printing service initialized successfully');
        })
        .catch(err => {
          console.warn(
            '[PrintPDF] ⚠️ Unified printing service initialization failed, falling back to HAL:',
            err
          );
          // Try HAL as fallback
          try {
            const hal = getHardwareAbstractionLayer();
            hal.initialize().then(() => {
              halRef.current = hal;
              useHardwareServices.current = true;
              console.log('[PrintPDF] ✅ Hardware services initialized as fallback');
            });
          } catch (halErr) {
            console.warn('[PrintPDF] ⚠️ Both printing services unavailable, using legacy printing');
          }
        });
    } catch (err) {
      console.warn('[PrintPDF] ⚠️ Printing services not available, using legacy printing:', err);
    }
  }, []);

  // 生成單個 PDF
  const generateSinglePdf = useCallback(
    async (
      productInfo: ProductInfo,
      quantity: number,
      palletNum: string,
      series: string,
      operatorClockNum: string,
      qcClockNum: string,
      acoDisplayText?: string
    ): Promise<{ blob: Blob | null; url: string | null; error: string | null }> => {
      try {
        // 準備 QC 標籤數據
        const qcInput: QcInputData = {
          productCode: productInfo.code,
          productDescription: productInfo.description,
          quantity: quantity,
          series: series,
          palletNum: palletNum,
          operatorClockNum: operatorClockNum,
          qcClockNum: qcClockNum,
          workOrderNumber: acoDisplayText || undefined,
          workOrderName: productInfo.type === 'ACO' ? 'ACO Order' : undefined,
          productType: productInfo.type,
        };

        const pdfLabelProps = await prepareQcLabelData(qcInput);

        // 生成 PDF blob
        const pdfElement = <PrintLabelPdf {...pdfLabelProps} />;
        const pdfBlob = await renderReactPDFToBlob(pdfElement);

        if (!pdfBlob) {
          throw new Error('PDF generation failed to return a blob.');
        }

        // 轉換 blob 為 ArrayBuffer 然後為 number array
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
        const pdfNumberArray = Array.from(pdfUint8Array);

        // 上傳 PDF
        const fileName = `${palletNum.replace('/', '_')}.pdf`;
        const uploadResult = await uploadPdfToStorage(pdfNumberArray, fileName, 'qc-labels');

        if (uploadResult.error) {
          throw new Error(`PDF upload failed: ${uploadResult.error}`);
        }

        if (!uploadResult.publicUrl) {
          throw new Error('PDF upload succeeded but no public URL returned.');
        }

        // Update PDF URL in database
        const updateResult = await updatePalletPdfUrl(palletNum, uploadResult.publicUrl);
        if (updateResult.error) {
          console.error(
            `[usePdfGeneration] Failed to update PDF URL for pallet ${palletNum}:`,
            updateResult.error
          );
          // Don't fail the entire operation, just log the error
        }

        return { blob: pdfBlob, url: uploadResult.publicUrl, error: null };
      } catch (error: unknown) {
        console.error(`Error generating PDF for pallet ${palletNum}:`, error);
        return { blob: null, url: null, error: getErrorMessage(error) };
      }
    },
    []
  );

  // 批量生成 PDFs
  const generatePdfs = useCallback(
    async (options: PdfGenerationOptions) => {
      const {
        productInfo,
        quantity,
        count,
        palletNumbers,
        series,
        formData,
        clockNumber,
        onProgress,
      } = options;

      // 檢查必要參數
      if (!productInfo || !productInfo.code) {
        throw new Error('Product information is missing');
      }

      const pdfBlobs: Blob[] = [];
      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      // 對於 ACO 訂單，獲取初始托盤計數
      let initialAcoPalletCount = 0;
      if (productInfo.type === 'ACO' && formData.acoOrderRef?.trim()) {
        initialAcoPalletCount = await getAcoPalletCount(supabase, formData.acoOrderRef.trim());
      }

      // 處理每個托盤
      for (let i = 0; i < count; i++) {
        if (onProgress) {
          onProgress(i + 1, 'Processing');
        }

        const palletNum = palletNumbers[i];
        const seriesNum = series[i];

        // 計算 ACO 托盤計數
        let acoDisplayText = '';
        if (productInfo.type === 'ACO' && formData.acoOrderRef?.trim()) {
          const acoPalletCount = initialAcoPalletCount + i;
          acoDisplayText = `${formData.acoOrderRef.trim()} - ${getOrdinalSuffix(acoPalletCount)} Pallet`;
        }

        const result = await generateSinglePdf(
          productInfo,
          quantity,
          palletNum,
          seriesNum,
          formData.operator || '-',
          clockNumber,
          acoDisplayText
        );

        if (result.error) {
          errors.push(`Pallet ${i + 1} (${palletNum}): ${result.error}`);
          if (onProgress) {
            onProgress(i + 1, 'Failed');
          }
          toast.error(`Pallet ${i + 1} (${palletNum}) Error: ${result.error}`);
        } else if (result.blob && result.url) {
          pdfBlobs.push(result.blob);
          uploadedUrls.push(result.url);
          if (onProgress) {
            onProgress(i + 1, 'Success');
          }
        }
      }

      return {
        success: pdfBlobs.length > 0,
        pdfBlobs,
        uploadedUrls,
        errors,
      };
    },
    [generateSinglePdf, supabase]
  );

  // Enhanced print PDFs with hardware service support
  const printPdfs = useCallback(
    async (
      pdfBlobs: Blob[],
      productCode: string,
      palletNumbers: string[],
      series: string[],
      quantity?: number,
      operator?: string
    ) => {
      if (pdfBlobs.length === 0) {
        toast.error('No PDFs to print.');
        return;
      }

      try {
        // Check if unified printing service is available
        console.log('[PrintPDF] Printing service check:', {
          usePrintingService: usePrintingService.current,
          printingServiceRef: printingServiceRef.current ? 'initialized' : 'null',
          useHardwareServices: useHardwareServices.current,
          halRef: halRef.current ? 'initialized' : 'null',
        });

        if (usePrintingService.current && printingServiceRef.current) {
          // Use unified printing service
          console.log('[PrintPDF] Using unified printing service');

          if (pdfBlobs.length === 1) {
            // Single PDF
            const printRequest: PrintRequest = {
              type: PrintType.QC_LABEL,
              data: {
                pdfBlob: pdfBlobs[0],
                productCode,
                palletNum: palletNumbers[0],
                series: series[0],
                quantity: quantity || 1,
                operator: operator || 'QC-Operator',
              },
              options: {
                copies: 1,
                paperSize: PaperSize.A4,
                orientation: 'portrait',
                priority: PrintPriority.NORMAL,
              },
              metadata: {
                userId: 'qc-label-user', // TODO: Get from auth
                source: 'qc-label-form',
                timestamp: new Date().toISOString(),
              },
            };

            const result = await printingServiceRef.current.print(printRequest);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success('QC label sent to unified print queue.');
          } else {
            // Multiple PDFs - use enhanced hardware service with merging
            console.log('[PrintPDF] Using enhanced hardware printing for multiple PDFs');

            // First merge PDFs using pdf-lib
            const pdfLib = await import('@/lib/services/unified-pdf-service');
            const { PDFDocument } = await pdfLib.getPDFLib();
            const mergedPdf = await PDFDocument.create();

            for (const pdfBlob of pdfBlobs) {
              const pdfBuffer = await pdfBlob.arrayBuffer();
              try {
                const pdfToMerge = await PDFDocument.load(pdfBuffer);
                const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
              } catch (error) {
                console.error('[PrintPDF] Error loading PDF for merging:', error);
              }
            }

            if (mergedPdf.getPageCount() === 0) {
              throw new Error('No pages to print after merging');
            }

            const mergedPdfBytes = await mergedPdf.save();
            const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

            // Use unified printing service to print merged PDF
            const printRequest: PrintRequest = {
              type: PrintType.QC_LABEL,
              data: {
                pdfBlob: mergedPdfBlob,
                productCode,
                palletNumbers,
                series,
                merged: true,
                quantity: quantity || 1,
                operator: operator || 'QC-Operator',
              },
              options: {
                copies: 1,
                paperSize: PaperSize.A4,
                orientation: 'portrait',
                priority: PrintPriority.NORMAL,
              },
              metadata: {
                userId: 'qc-label-user', // TODO: Get from auth
                source: 'qc-label-form',
                labelCount: pdfBlobs.length,
                timestamp: new Date().toISOString(),
              },
            };

            const result = await printingServiceRef.current.print(printRequest);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success(`${pdfBlobs.length} QC labels merged and sent to unified print queue.`);
          }
        } else if (useHardwareServices.current && halRef.current) {
          // Fallback to HAL
          console.log('[PrintPDF] Falling back to hardware abstraction layer');
          if (pdfBlobs.length === 1) {
            const printJob = {
              type: 'qc-label' as const,
              data: {
                pdfBlob: pdfBlobs[0],
                productCode,
                palletNum: palletNumbers[0],
                series: series[0],
              },
              copies: 1,
              priority: 'normal' as const,
              metadata: {
                source: 'qc-label-form',
                timestamp: new Date().toISOString(),
              },
            };

            const result = await halRef.current.print(printJob);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success('QC label sent to print queue.');
          } else {
            // Multiple PDFs - merge first
            const pdfLib = await import('@/lib/services/unified-pdf-service');
            const { PDFDocument } = await pdfLib.getPDFLib();
            const mergedPdf = await PDFDocument.create();

            for (const pdfBlob of pdfBlobs) {
              const pdfBuffer = await pdfBlob.arrayBuffer();
              try {
                const pdfToMerge = await PDFDocument.load(pdfBuffer);
                const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
              } catch (error) {
                console.error('[PrintPDF] Error loading PDF for merging:', error);
              }
            }

            const mergedPdfBytes = await mergedPdf.save();
            const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

            const printJob = {
              type: 'qc-label' as const,
              data: {
                pdfBlob: mergedPdfBlob,
                productCode,
                palletNumbers,
                series,
                merged: true,
              },
              copies: 1,
              priority: 'normal' as const,
            };

            const result = await halRef.current.print(printJob);
            if (!result.success) {
              throw new Error(result.error || 'Print failed');
            }
            toast.success(`${pdfBlobs.length} QC labels sent to print queue.`);
          }
        } else {
          // Legacy printing
          console.log('[PrintPDF] Using legacy printing (no enhanced services available)');
          const pdfArrayBuffers = await Promise.all(pdfBlobs.map(blob => blob.arrayBuffer()));
          let printFileName = '';

          if (pdfBlobs.length === 1) {
            const firstPalletNum = palletNumbers[0];
            const seriesForName = series[0];
            printFileName = `QCLabel_${productCode}_${firstPalletNum.replace('/', '_')}_${seriesForName}.pdf`;
          } else {
            const firstPalletNumForName = palletNumbers[0].replace('/', '_');
            printFileName = `QCLabels_Merged_${productCode}_${firstPalletNumForName}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;
          }

          await mergeAndPrintPdfs(pdfArrayBuffers, printFileName);
          toast.success(`${pdfBlobs.length} QC label(s) generated and ready for printing.`);
        }
      } catch (error: unknown) {
        console.error('PDF printing error:', error);
        toast.error(`PDF Printing Error: ${getErrorMessage(error)}`);
        throw error;
      }
    },
    []
  );

  // Get print queue status (if hardware services available)
  const getPrintQueueStatus = useCallback(() => {
    if (useHardwareServices.current && halRef.current) {
      return halRef.current.queue.getQueueStatus();
    }
    return { pending: 0, processing: 0 };
  }, []);

  // Cancel print job (if hardware services available)
  const cancelPrintJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (useHardwareServices.current && halRef.current) {
      return halRef.current.queue.removeFromQueue(jobId);
    }
    return false;
  }, []);

  return {
    generatePdfs,
    printPdfs,
    ...(useHardwareServices.current
      ? {
          getPrintQueueStatus,
          cancelPrintJob,
        }
      : {}),
  };
};
