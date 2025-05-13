import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from '@/components/print-label-pdf/PrintLabelPdf';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js'; // For type hinting Supabase client
import QRCode from 'qrcode'; // Import QRCode library

/**
 * Generates a PDF filename based on the pallet number.
 * Example: if palletNum is "080808/14", returns "080808_14.pdf".
 * @param palletNum - The pallet number string.
 * @returns The formatted PDF filename.
 * @throws Error if palletNum is empty.
 */
export function generatePalletPdfFileName(palletNum: string): string {
  if (!palletNum || palletNum.trim() === '') {
    throw new Error('Pallet number cannot be empty for PDF naming.');
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
  fileName?: string; // Kept for logging or if needed for other purposes, but not for Supabase path.
  storagePath?: string; // Kept for logging, but not for Supabase path.
  supabaseClient: SupabaseClient;
}): Promise<string> {
  const palletNum = pdfProps.palletNum;
  if (!palletNum) {
    throw new Error('[pdfUtils.generateAndUploadPdf] Pallet number is missing in pdfProps and is required.');
  }

  // The PrintLabelPdf component is the actual document structure
  const blob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
  
  if (!(blob instanceof Blob)) {
    throw new Error('[pdfUtils.generateAndUploadPdf] PDF generation did not return a Blob.');
  }
  if (blob.size === 0) {
    console.warn('[pdfUtils.generateAndUploadPdf] Generated PDF blob has a size of 0. Uploading an empty file.');
  }

  const finalSupabaseFileName = generatePalletPdfFileName(palletNum);
  const filePath = finalSupabaseFileName; // Files go to the root of the bucket

  console.log(`[pdfUtils.generateAndUploadPdf] Uploading PDF. Original fileName (ignored for path): ${arguments[0].fileName}, Original storagePath (ignored for path): ${arguments[0].storagePath}. Final Supabase path: ${filePath}`);

  const { data, error } = await supabaseClient.storage
    .from('pallet-label-pdf') // Standard bucket name
    .upload(filePath, blob, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: true,        // Overwrite if file exists
      contentType: 'application/pdf',
    });

  if (error) {
    console.error('[pdfUtils.generateAndUploadPdf] Supabase Upload Error:', error);
    throw new Error(`[pdfUtils.generateAndUploadPdf] Supabase Upload Failed for ${filePath}: ${error.message}`);
  }
  
  if (!data || !data.path) {
    throw new Error(`[pdfUtils.generateAndUploadPdf] Upload for ${filePath} succeeded but no path was returned from Supabase.`);
  }

  console.log(`[pdfUtils.generateAndUploadPdf] File uploaded successfully to Supabase. Path: ${data.path}`);

  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabaseClient.storage
    .from('pallet-label-pdf')
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error(`[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${data.path}.`);
  }
  
  console.log(`[pdfUtils.generateAndUploadPdf] Public URL: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
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