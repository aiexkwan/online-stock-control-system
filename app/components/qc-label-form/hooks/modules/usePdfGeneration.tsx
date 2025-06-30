/**
 * usePdfGeneration Hook
 * 處理 PDF 生成相關的所有邏輯
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { prepareQcLabelData, mergeAndPrintPdfs, type QcInputData } from '@/lib/pdfUtils';
import { uploadPdfToStorage, updatePalletPdfUrl } from '@/app/actions/qcActions';
import { getOrdinalSuffix, getAcoPalletCount } from '@/app/utils/qcLabelHelpers';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
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
  printPdfs: (pdfBlobs: Blob[], productCode: string, palletNumbers: string[], series: string[]) => Promise<void>;
}

export const usePdfGeneration = (): UsePdfGenerationReturn => {
  const supabase = createClient();

  // 生成單個 PDF
  const generateSinglePdf = useCallback(async (
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
        productType: productInfo.type
      };

      const pdfLabelProps = await prepareQcLabelData(qcInput);

      // 生成 PDF blob
      const pdfElement = <PrintLabelPdf {...pdfLabelProps} />;
      const pdfBlob = await pdf(pdfElement).toBlob();
      
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
        console.error(`[usePdfGeneration] Failed to update PDF URL for pallet ${palletNum}:`, updateResult.error);
        // Don't fail the entire operation, just log the error
      }

      return { blob: pdfBlob, url: uploadResult.publicUrl, error: null };
    } catch (error: any) {
      console.error(`Error generating PDF for pallet ${palletNum}:`, error);
      return { blob: null, url: null, error: error.message };
    }
  }, []);

  // 批量生成 PDFs
  const generatePdfs = useCallback(async (options: PdfGenerationOptions) => {
    const {
      productInfo,
      quantity,
      count,
      palletNumbers,
      series,
      formData,
      clockNumber,
      onProgress
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
      errors
    };
  }, [generateSinglePdf, supabase]);

  // 打印 PDFs
  const printPdfs = useCallback(async (
    pdfBlobs: Blob[],
    productCode: string,
    palletNumbers: string[],
    series: string[]
  ) => {
    if (pdfBlobs.length === 0) {
      toast.error('No PDFs to print.');
      return;
    }

    try {
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
    } catch (error: any) {
      console.error('PDF printing error:', error);
      toast.error(`PDF Printing Error: ${error.message}`);
      throw error;
    }
  }, []);

  return {
    generatePdfs,
    printPdfs
  };
};