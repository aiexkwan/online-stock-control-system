import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from '@/components/print-label-pdf/PrintLabelPdf';
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js'; // For type hinting Supabase client

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

export function prepareGrnLabelData(input: GrnInputData): PrintLabelPdfProps {
  const labelDate = format(new Date(), 'dd-MMM-yyyy'); // Default to current date

  return {
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.netWeight,
    date: labelDate,
    operatorClockNum: '-', // Typically '-' for GRN labels
    qcClockNum: input.receivedBy, // Represents "Received By" for GRN
    workOrderNumber: `${input.grnNumber.trim()} (${input.materialSupplier.trim().toUpperCase()})`, // GRN Ref + Supplier
    palletNum: input.palletNum,
    qrValue: input.series, // The unique series for the QR code
    productType: input.productType || undefined,
    labelType: 'GRN', // Clearly mark as GRN label type
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
  fileName: string;
  storagePath: string;
  supabaseClient: SupabaseClient; // Use SupabaseClient type
}): Promise<string> {
  // The PrintLabelPdf component is the actual document structure
  const blob = await pdf(<PrintLabelPdf {...pdfProps} />).toBlob();
  
  if (!(blob instanceof Blob)) {
    throw new Error('PDF generation did not return a Blob.');
  }

  const filePath = `${storagePath.endsWith('/') ? storagePath : storagePath + '/'}${fileName}`;
  
  const { data, error } = await supabaseClient.storage
    .from('pallet-label-pdf') // Standard bucket name
    .upload(filePath, blob, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: true,        // Overwrite if file exists
      contentType: 'application/pdf',
    });

  if (error) {
    console.error('Supabase Upload Error:', error);
    throw new Error(`Supabase Upload Failed: ${error.message}`);
  }
  
  if (!data || !data.path) {
    throw new Error(`Upload for ${filePath} succeeded but no path was returned from Supabase.`);
  }

  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabaseClient.storage
    .from('pallet-label-pdf')
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error(`Failed to get public URL for ${data.path}.`);
  }
  
  return publicUrlData.publicUrl;
}

// Placeholder for QC Label Data Preparation (to be defined based on QC label requirements)
export interface QcInputData {
  // Define fields required to prepare QC Label PDF data
  productCode: string;
  productDescription: string;
  quantity: number;
  series: string;
  palletNum: string;
  operatorClockNum: string;
  qcClockNum: string;
  workOrderNumber?: string; // e.g. ACO ref
  workOrderName?: string;
  productType?: string | null;
  // dateForLabel?: Date;
}

export function prepareQcLabelData(input: QcInputData): PrintLabelPdfProps {
  const labelDate = format(new Date(), 'dd-MMM-yyyy');
  return {
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.quantity,
    date: labelDate,
    operatorClockNum: input.operatorClockNum,
    qcClockNum: input.qcClockNum,
    workOrderNumber: input.workOrderNumber || '-',
    palletNum: input.palletNum,
    qrValue: input.series,
    productType: input.productType || undefined,
    labelType: 'QC', // Clearly mark as QC label type
    workOrderName: input.workOrderName,
  };
} 