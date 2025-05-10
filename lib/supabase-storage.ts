import { supabase } from './supabase'; // Corrected import for the Supabase client

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
 * Uploads a PDF file to the specified Supabase storage bucket and folder.
 *
 * @param palletNum The pallet number, used as part of the folder/file path.
 * @param fileName The desired name of the file in Supabase storage.
 * @param pdfBlob The PDF content as a Blob.
 * @returns The public URL of the uploaded PDF.
 * @throws If the upload fails.
 */
export async function uploadPdf(
  palletNum: string, 
  fileName: string,
  pdfBlob: Blob
): Promise<string> {
  console.log(`[uploadPdf] Attempting to upload ${fileName} to folder path based on ${palletNum} in bucket ${STORAGE_BUCKET}`);
  if (!pdfBlob) {
    console.error('[uploadPdf] pdfBlob is null or undefined.');
    throw new Error('pdfBlob cannot be null.');
  }
  if (pdfBlob.size === 0) {
    console.warn('[uploadPdf] pdfBlob has a size of 0. Uploading an empty file.');
  }

  // Constructing filePath similar to previous logic but using palletNum and fileName directly
  // Example: Label - 090525_60 - pallet-label-250509-HFHRP6.pdf
  const safePalletNumForPath = palletNum.replace(/\//g, '_'); 
  const filePath = `Label - ${safePalletNumForPath} - ${fileName}`;
  console.log('[uploadPdf] Full file path in bucket:', filePath);

  try {
    const { data, error } = await supabase.storage // Using the imported supabase client
      .from(STORAGE_BUCKET)
      .upload(filePath, pdfBlob, {
        cacheControl: '3600',
        upsert: true, 
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('[uploadPdf] Upload error object:', error);
      let errorMessage = `Upload failed for ${filePath}. Supabase error: ${error.message}`;
      // Consider checking error.name or error.code for more specific Supabase error types if available
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
    throw new Error(`uploadPdf failed: ${(err as Error).message}`);
  }
}
