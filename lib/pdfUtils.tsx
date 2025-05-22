import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from '@/components/print-label-pdf/PrintLabelPdf';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js'; // For type hinting Supabase client
import QRCode from 'qrcode'; // Import QRCode library
import { PDFDocument } from 'pdf-lib'; // Added for PDF merging
import { toast } from 'sonner';      // Added for toast notifications

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
  supabaseClient
}: {
  pdfProps: PrintLabelPdfProps;
  fileName?: string; 
  storagePath?: string; 
  supabaseClient: SupabaseClient;
}): Promise<{ publicUrl: string; blob: Blob }> {
  const palletNum = pdfProps.palletNum;
  if (!palletNum) {
    console.error('[pdfUtils.generateAndUploadPdf] Pallet number is missing in pdfProps. This is critical for naming and potentially content.');
  }

  console.log('[pdfUtils.generateAndUploadPdf] Attempting to generate PDF with props:', JSON.stringify(pdfProps, null, 2));

  let blob: Blob | null = null;
  try {
    blob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
  } catch (renderError: any) {
    console.error('[pdfUtils.generateAndUploadPdf] Error during @react-pdf/renderer toBlob():', renderError);
    toast.error(`PDF render error for pallet ${palletNum || 'UNKNOWN'}: ${renderError.message}`);
    throw new Error(`PDF render failed for ${palletNum || 'UNKNOWN'}: ${renderError.message}`);
  }
  
  if (!blob) {
    console.error('[pdfUtils.generateAndUploadPdf] PDF generation returned a null or undefined blob.');
    toast.error(`PDF generation failed for pallet ${palletNum || 'UNKNOWN'} (null blob).`);
    throw new Error(`[pdfUtils.generateAndUploadPdf] PDF generation did not return a Blob for pallet ${palletNum || 'UNKNOWN'}.`);
  }

  console.log(`[pdfUtils.generateAndUploadPdf] Generated blob for pallet ${palletNum || 'UNKNOWN'}. Size: ${blob.size}, Type: ${blob.type}`);

  if (blob.size === 0) {
    console.warn(`[pdfUtils.generateAndUploadPdf] Generated PDF blob for pallet ${palletNum || 'UNKNOWN'} has a size of 0. This will likely result in an empty PDF.`);
    // toast.warn(`Generated PDF for pallet ${palletNum || 'UNKNOWN'} is empty.`); 
  }

  const finalSupabaseFileName = palletNum ? generatePalletPdfFileName(palletNum) : `unknown_pallet_${Date.now()}.pdf`;
  const filePath = finalSupabaseFileName;

  // Access original arguments via the 'arguments' object is generally discouraged in modern JS/TS.
  // If fileName and storagePath are needed for logging, they should be explicitly passed and used.
  // For now, assuming they are not critical for this log message as they are ignored for the path.
  console.log(`[pdfUtils.generateAndUploadPdf] Uploading PDF. Final Supabase path: ${filePath}`);

  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('pallet-label-pdf')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    });

  if (uploadError) {
    console.error('[pdfUtils.generateAndUploadPdf] Supabase Upload Error:', uploadError);
    toast.error(`Supabase Upload Failed for ${filePath}: ${uploadError.message}`);
    throw new Error(`[pdfUtils.generateAndUploadPdf] Supabase Upload Failed for ${filePath}: ${uploadError.message}`);
  }
  
  if (!uploadData || !uploadData.path) {
    console.error(`[pdfUtils.generateAndUploadPdf] Upload for ${filePath} succeeded but no path was returned from Supabase.`);
    toast.error(`Upload for ${filePath} succeeded but no path was returned.`);
    throw new Error(`[pdfUtils.generateAndUploadPdf] Upload for ${filePath} succeeded but no path was returned from Supabase.`);
  }

  console.log(`[pdfUtils.generateAndUploadPdf] File uploaded successfully to Supabase. Path: ${uploadData.path}`);

  const publicUrlResult = await supabaseClient.storage
    .from('pallet-label-pdf')
    .getPublicUrl(uploadData.path) as StoragePublicUrlResponse; // Type assertion added

  const urlError = publicUrlResult.error;
  const urlData = publicUrlResult.data;

  if (urlError) {
    console.error(`[pdfUtils.generateAndUploadPdf] Error getting public URL for ${uploadData.path}:`, urlError);
    toast.error(`Failed to get public URL for ${uploadData.path}: ${urlError.message}`);
    throw new Error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}: ${urlError.message}`);
  }

  if (!urlData || !urlData.publicUrl) {
    console.error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path} (no URL in data).`);
    toast.error(`Failed to get public URL for ${uploadData.path}.`);
    throw new Error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}.`);
  }
  
  const publicUrl = urlData.publicUrl;
  console.log(`[pdfUtils.generateAndUploadPdf] Public URL: ${publicUrl}`);
  return { publicUrl: publicUrl, blob };
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
    toast.error('No PDF documents provided to merge and print.');
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
        toast.error('Error processing one of the PDFs. Merged document may be incomplete.');
        // Optionally, decide if you want to continue merging other PDFs or stop
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      toast.error('No pages were successfully merged. Printing cannot proceed.');
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
        toast.info('Initiating print dialog for merged PDF...'); // Info toast

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
        //toast.error('Failed to initiate print dialog. Please try again or check browser settings.');
        // Cleanup in case of print error too
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }
    };

    iframe.onerror = () => {
        console.error('[mergeAndPrintPdfs] Error loading PDF into iframe.');
        //toast.error('Failed to load merged PDF for printing.');
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    };

  } catch (error) {
    console.error('[mergeAndPrintPdfs] Failed to merge and print PDFs:', error);
    //toast.error('An error occurred while merging or printing PDFs. Please check console.');
  }
} 