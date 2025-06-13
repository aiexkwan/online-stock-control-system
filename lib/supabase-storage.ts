import { createClient } from './supabase'; // MODIFIED: Import createClient
import { generatePalletPdfFileName } from './pdfUtils'; // Import the new naming function

export const STORAGE_BUCKET = 'pallet-label-pdf';

/**
 * Sets up the Supabase storage client.
 * This function is now simplified as bucket listing is not essential for client-side upload if permissions are set.
 */
export async function setupStorage() {
  console.log('[setupStorage] Storage operations will use the pre-configured client and target bucket:', STORAGE_BUCKET);
  // The explicit bucket check (listBuckets) has been removed.
}

/**
 * Uploads a PDF file to the Supabase storage bucket with a standardized name derived from palletNum.
 *
 * @param palletNum The pallet number, used to generate the PDF filename.
 * @param _ignoredFileName This parameter is kept for compatibility with PdfGenerator.tsx but is NOT used for naming the file in Supabase.
 * @param pdfBlob The PDF content as a Blob.
 * @returns The public URL of the uploaded PDF.
 * @throws If the upload fails or palletNum is missing.
 */
export async function uploadPdf(
  palletNum: string,
  _ignoredFileName: string, // Intentionally ignored for Supabase path naming
  pdfBlob: Blob
): Promise<string> {
  const supabase = createClient(); // ADDED: Create supabase instance here
  if (!palletNum) {
    console.error('[uploadPdf] Pallet number is required but was not provided.');
    throw new Error('Pallet number is required for uploading PDF.');
  }
  console.log(`[uploadPdf] Attempting to upload PDF for palletNum: ${palletNum}. Input fileName '${_ignoredFileName}' is ignored for Supabase path construction.`);

  if (!pdfBlob) {
    console.error('[uploadPdf] pdfBlob is null or undefined.');
    throw new Error('pdfBlob cannot be null.');
  }
  if (pdfBlob.size === 0) {
    console.warn('[uploadPdf] pdfBlob has a size of 0. Uploading an empty file.');
  }

  const finalSupabaseFileName = generatePalletPdfFileName(palletNum);
  const filePath = finalSupabaseFileName; // Store at the root of the bucket

  console.log('[uploadPdf] Full file path in bucket (new logic): ', filePath);

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('[uploadPdf] Upload error object:', error);
      let errorMessage = `Upload failed for ${filePath}. Supabase error: ${error.message}`;
      if (error.message.includes('mime type application/pdf is not supported') || (error as any).error === 'mime type application/pdf is not supported') {
        errorMessage = 'Upload failed: mime type application/pdf is not supported. Check bucket Content-Type settings or client-side Content-Type header.';
      }
      throw new Error(errorMessage);
    }

    if (!data || !data.path) {
      console.error('[uploadPdf] Upload completed but no path returned in data:', data);
      throw new Error(`Upload for ${filePath} seemed to succeed but no path was returned.`);
    }

    console.log('[uploadPdf] File uploaded successfully. Path:', data.path);

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('[uploadPdf] Could not get public URL for path:', data.path, 'PublicUrlData:', publicUrlData);
        throw new Error(`Failed to get public URL for ${data.path}.`);
    }

    console.log('[uploadPdf] Public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (err) {
    console.error('[uploadPdf] Error in uploadPdf:', (err as Error).message, err);
    // Ensure we throw an actual Error object
    if (err instanceof Error) {
      throw err; 
    }
    throw new Error(`uploadPdf failed: ${String(err)}`);
  }
}
