import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from '@/components/print-label-pdf/PrintLabelPdf';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js'; // For type hinting Supabase client
import QRCode from 'qrcode'; // Import QRCode library
import { PDFDocument } from 'pdf-lib'; // Added for PDF merging

// Define an interface for the expected structure of getPublicUrl response
interface StoragePublicUrlResponse {
  data: { publicUrl: string } | null;
  error: Error | null; // Or import a more specific StorageError type from Supabase if available
}

/**
 * Generates a PDF filename based on the pallet number.
 * Example: if palletNum is "080808/14", returns "080808_14.pdf".
 * @param palletNum - The pallet number string.
 * @returns The formatted PDF filename.
 * @throws Error if palletNum is empty.
 */
export function generatePalletPdfFileName(palletNum: string): string {
  if (!palletNum || palletNum.trim() === '') {
    //throw new Error('Pallet number cannot be empty for PDF naming.');
  }
  // Replace all occurrences of '/' with '_'
  const safePalletNum = palletNum.replace(/\//g, '_');
  return `${safePalletNum}.pdf`;
}

// Interface for GRN specific data input by the user or form
export interface GrnInputData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
  productDescription: string;
  productType?: string | null;
  netWeight: number;
  series: string;
  palletNum: string;
  receivedBy: string; // User ID or clock number of the person receiving
  labelMode?: 'qty' | 'weight'; // Add label mode to control PDF display
  // dateForLabel?: Date; // Optional: if a specific date needs to be on the label, otherwise current date is used
}

export async function prepareGrnLabelData(input: GrnInputData): Promise<PrintLabelPdfProps> {
  const labelDate = format(new Date(), 'dd-MMM-yyyy'); // Default to current date
  const dataForQr = input.series || input.productCode; // Fallback logic for QR data
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(dataForQr, { errorCorrectionLevel: 'M', margin: 1, width: 140 });
  } catch (err) {
    console.error('Failed to generate QR code data URL for GRN:', err);
    // Fallback or error handling for qrCodeDataUrl can be added here if necessary
  }

  // Pass through raw inputs for GRN details
  // The decision logic will be in PrintLabelPdf.tsx
  return {
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.netWeight,
    date: labelDate,
    operatorClockNum: '-',
    qcClockNum: input.receivedBy,
    palletNum: input.palletNum,
    qrCodeDataUrl,
    productType: input.productType || undefined,
    labelType: 'GRN',
    labelMode: input.labelMode || 'weight', // Pass label mode to PDF component
    // Pass through raw/original inputs from the form
    grnNumber: input.grnNumber,
    grnMaterialSupplier: input.materialSupplier,
    // qcWorkOrderNumber and qcWorkOrderName will be undefined here, which is fine
  };
}

// Generic function to generate PDF and upload to Supabase storage
export async function generateAndUploadPdf({
  pdfProps,
  fileName,
  storagePath, // e.g., 'grn_labels' or 'qc_labels'
  supabaseClient,
  useApiUpload = false // 新參數：是否使用 API 路由上傳
}: {
  pdfProps: PrintLabelPdfProps;
  fileName?: string; 
  storagePath?: string; 
  supabaseClient: SupabaseClient;
  useApiUpload?: boolean;
}): Promise<{ publicUrl: string; blob: Blob }> {
  const palletNum = pdfProps.palletNum;
  if (!palletNum) {
    console.error('[pdfUtils.generateAndUploadPdf] Pallet number is missing in pdfProps. This is critical for naming and potentially content.');
  }

  console.log('[pdfUtils.generateAndUploadPdf] 開始生成 PDF...', {
    palletNum,
    useApiUpload,
    storagePath: storagePath || 'pallet-label-pdf',
    pdfPropsKeys: Object.keys(pdfProps)
  });

  let blob: Blob | null = null;
  try {
    console.log('[pdfUtils.generateAndUploadPdf] 調用 @react-pdf/renderer...');
    blob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
    console.log('[pdfUtils.generateAndUploadPdf] PDF 渲染完成:', {
      blobExists: !!blob,
      blobSize: blob?.size,
      blobType: blob?.type
    });
  } catch (renderError: any) {
    console.error('[pdfUtils.generateAndUploadPdf] Error during @react-pdf/renderer toBlob():', renderError);
    throw new Error(`PDF render failed for ${palletNum || 'UNKNOWN'}: ${renderError.message}`);
  }
  
  if (!blob) {
    console.error('[pdfUtils.generateAndUploadPdf] PDF generation returned a null or undefined blob.');
    throw new Error(`[pdfUtils.generateAndUploadPdf] PDF generation did not return a Blob for pallet ${palletNum || 'UNKNOWN'}.`);
  }

  console.log(`[pdfUtils.generateAndUploadPdf] Generated blob for pallet ${palletNum || 'UNKNOWN'}. Size: ${blob.size}, Type: ${blob.type}`);

  if (blob.size === 0) {
    console.warn(`[pdfUtils.generateAndUploadPdf] Generated PDF blob for pallet ${palletNum || 'UNKNOWN'} has a size of 0. This will likely result in an empty PDF.`);
  }

  const finalSupabaseFileName = palletNum ? generatePalletPdfFileName(palletNum) : `unknown_pallet_${Date.now()}.pdf`;
  const bucketName = storagePath || 'pallet-label-pdf';

  console.log(`[pdfUtils.generateAndUploadPdf] 準備上傳...`, {
    fileName: finalSupabaseFileName,
    bucketName,
    useApiUpload
  });

  if (useApiUpload) {
    console.log('[pdfUtils.generateAndUploadPdf] 使用 API 路由上傳...');
    try {
      // 使用 API 路由上傳
      const formData = new FormData();
      formData.append('file', blob, finalSupabaseFileName);
      formData.append('fileName', finalSupabaseFileName);
      formData.append('storagePath', bucketName);

      console.log('[pdfUtils.generateAndUploadPdf] 發送到 /api/upload-pdf...');
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[pdfUtils.generateAndUploadPdf] API upload failed:', errorData);
        throw new Error(`API upload failed: ${errorData.error}`);
      }

      const result = await response.json();
      console.log('[pdfUtils.generateAndUploadPdf] API 上傳成功:', result);
      
      return { publicUrl: result.publicUrl, blob };
    } catch (apiError: any) {
      console.error('[pdfUtils.generateAndUploadPdf] API upload error:', apiError);
      throw new Error(`API upload failed for ${finalSupabaseFileName}: ${apiError.message}`);
    }
  } else {
    console.log('[pdfUtils.generateAndUploadPdf] 使用直接 Supabase 客戶端上傳...');
    // 原有的直接上傳邏輯
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(finalSupabaseFileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[pdfUtils.generateAndUploadPdf] Supabase Upload Error:', uploadError);
      throw new Error(`[pdfUtils.generateAndUploadPdf] Supabase Upload Failed for ${finalSupabaseFileName}: ${uploadError.message}`);
    }
    
    if (!uploadData || !uploadData.path) {
      console.error(`[pdfUtils.generateAndUploadPdf] Upload for ${finalSupabaseFileName} succeeded but no path was returned from Supabase.`);
      throw new Error(`[pdfUtils.generateAndUploadPdf] Upload for ${finalSupabaseFileName} succeeded but no path was returned from Supabase.`);
    }

    console.log(`[pdfUtils.generateAndUploadPdf] File uploaded successfully to Supabase. Path: ${uploadData.path}`);

    const publicUrlResult = await supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path) as StoragePublicUrlResponse;

    const urlError = publicUrlResult.error;
    const urlData = publicUrlResult.data;

    if (urlError) {
      console.error(`[pdfUtils.generateAndUploadPdf] Error getting public URL for ${uploadData.path}:`, urlError);
      throw new Error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}: ${urlError.message}`);
    }

    if (!urlData || !urlData.publicUrl) {
      console.error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path} (no URL in data).`);
      throw new Error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}.`);
    }
    
    const publicUrl = urlData.publicUrl;
    console.log(`[pdfUtils.generateAndUploadPdf] Public URL: ${publicUrl}`);
    return { publicUrl: publicUrl, blob };
  }
}

// Placeholder for QC Label Data Preparation (to be defined based on QC label requirements)
export interface QcInputData {
  productCode: string;
  productDescription: string;
  quantity: number;
  series: string;
  palletNum: string;
  operatorClockNum: string;
  qcClockNum: string;
  workOrderNumber?: string; // User input for WO number (QC/ACO)
  workOrderName?: string;   // User input for WO name (QC)
  productType?: string | null;
}

export async function prepareQcLabelData(input: QcInputData): Promise<PrintLabelPdfProps> {
  console.log('[prepareQcLabelData] Received input:', JSON.stringify(input, null, 2));
  const labelDate = format(new Date(), 'dd-MMM-yyyy');
  const dataForQr = input.series || input.productCode;
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(dataForQr, { errorCorrectionLevel: 'M', margin: 1, width: 140 });
  } catch (err) {
    console.error('Failed to generate QR code data URL for QC:', err);
  }

  // Pass through raw inputs for work order details
  // The decision logic will be in PrintLabelPdf.tsx
  return {
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.quantity,
    date: labelDate,
    operatorClockNum: input.operatorClockNum,
    qcClockNum: input.qcClockNum,
    palletNum: input.palletNum,
    qrCodeDataUrl,
    productType: input.productType || undefined,
    labelType: 'QC',
    // Pass through raw/original inputs from the form
    qcWorkOrderNumber: input.workOrderNumber, 
    qcWorkOrderName: input.workOrderName, 
    // grnNumber and grnMaterialSupplier will be undefined here, which is fine
  };
}

/**
 * Merges multiple PDF documents (provided as ArrayBuffers) into a single PDF
 * and triggers the browser's print dialog.
 *
 * @param pdfArrayBuffers - An array of ArrayBuffers, each representing a PDF file.
 * @param mergedPdfName - Optional. The suggested filename for the merged PDF.
 * @returns Promise<void>
 */
export async function mergeAndPrintPdfs(
  pdfArrayBuffers: ArrayBuffer[],
  mergedPdfName: string = 'merged_document.pdf'
): Promise<void> {
  if (!pdfArrayBuffers || pdfArrayBuffers.length === 0) {
    console.error('[mergeAndPrintPdfs] No PDF documents provided.');
    return;
  }

  try {
    const mergedPdf = await PDFDocument.create();
    for (const pdfBuffer of pdfArrayBuffers) {
      if (pdfBuffer.byteLength === 0) {
        console.warn('[mergeAndPrintPdfs] Encountered an empty ArrayBuffer, skipping.');
        continue;
      }
      try {
        const pdfToMerge = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (loadError) {
        console.error('[mergeAndPrintPdfs] Error loading one of the PDFs for merging:', loadError);
        // Optionally, decide if you want to continue merging other PDFs or stop
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      console.error('[mergeAndPrintPdfs] Merged PDF has no pages.');
      return;
    }

    const mergedPdfBytes = await mergedPdf.save();
    const pdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

    const url = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus(); // Focus on the iframe's content
        console.log('[mergeAndPrintPdfs] Attempting to call print() on iframe contentWindow.');
        iframe.contentWindow?.print(); // Trigger print dialog

        // Clean up after a delay. Adjust delay if print dialog closes too soon.
        // Some browsers might need more time, or print might be cancelled.
        setTimeout(() => {
          URL.revokeObjectURL(url);
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          console.log('[mergeAndPrintPdfs] Iframe and blob URL cleaned up after timeout.');
        }, 10000); // Increased delay to 10 seconds

      } catch (printError) {
        console.error('[mergeAndPrintPdfs] Error triggering print dialog:', printError);
        // Cleanup in case of print error too
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }
    };

    iframe.onerror = () => {
        console.error('[mergeAndPrintPdfs] Error loading PDF into iframe.');
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    };

  } catch (error) {
    console.error('[mergeAndPrintPdfs] Failed to merge and print PDFs:', error);
  }
} 