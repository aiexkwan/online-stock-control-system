'use client';

import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf } from '../../../components/print-label-pdf/PrintLabelPdf';
import { setupStorage, uploadPdf } from '../../../lib/supabase-storage';

interface PdfGeneratorProps {
  productCode: string;
  description: string;
  quantity: number;
  date: string;
  operatorClockNum: string;
  qcClockNum: string;
  palletNum: string;
  workOrderNumber: string;
  qrValue: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export async function generateAndUploadPdf(props: PdfGeneratorProps) {
  try {
    // 設置 Storage
    const storageReady = await setupStorage();
    if (!storageReady) {
      throw new Error('Failed to setup storage');
    }

    // 生成 PDF blob
    const pdfData = {
        productCode: props.productCode ?? '',
        description: props.description ?? '',
        quantity: props.quantity ?? 0,
        date: props.date ?? '',
        operatorClockNum: props.operatorClockNum ?? '',
        qcClockNum: props.qcClockNum ?? '',
        workOrderNumber: props.workOrderNumber ?? '',
        palletNum: props.palletNum ?? '',
        qrValue: props.qrValue ?? '',
     };
    console.log('PDF props:', pdfData);

    const blob = await pdf(<PrintLabelPdf {...pdfData} />).toBlob();
    console.log('PDF blob generated:', blob);

    // 檢查 blob
    if (!blob || blob.size === 0) {
      throw new Error('Generated PDF blob is invalid');
    }

    // 上傳 PDF
    const publicUrl = await uploadPdf(props.palletNum, props.qrValue, blob);
    console.log('PDF uploaded successfully:', publicUrl);

    props.onSuccess?.(publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in generateAndUploadPdf:', error);
    props.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
} 