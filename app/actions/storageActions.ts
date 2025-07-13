'use server';

import { createClient as createServerSupabaseClient } from '@/app/utils/supabase/server';
import { randomUUID } from 'crypto';

interface UploadResult {
  success: boolean;
  error?: string;
  filePath?: string;
}

export async function uploadPalletLabelPdfAction(
  fileName: string,
  fileContent: Uint8Array, // Changed from ArrayBuffer to Uint8Array
  contentType: string = 'application/pdf'
): Promise<UploadResult> {
  const supabase = await createServerSupabaseClient();
  const bucketName = 'pallet-label-pdf'; // As per loginBuild.md

  // Ensure a unique file path, perhaps with a UUID or timestamp if needed
  // For simplicity, using the provided fileName, but consider potential overwrites or structure.
  const filePath = `${fileName}`;

  process.env.NODE_ENV !== 'production' &&
    console.log(
      `[uploadPalletLabelPdfAction] Attempting to upload ${filePath} to bucket ${bucketName}, size: ${fileContent.byteLength}`
    );

  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, fileContent, {
      contentType: contentType,
      upsert: true, // loginBuild.md doesn't specify, but upsert is often useful
    });

    if (error) {
      console.error(
        `[uploadPalletLabelPdfAction] Supabase storage upload error for ${filePath}:`,
        error.message
      );
      return { success: false, error: `Storage upload failed: ${error.message}` };
    }

    process.env.NODE_ENV !== 'production' &&
      console.log(
        `[uploadPalletLabelPdfAction] File ${filePath} uploaded successfully to ${bucketName}. Path: ${data?.path}`
      );
    return { success: true, filePath: data?.path };
  } catch (e: any) {
    console.error('[uploadPalletLabelPdfAction] Unexpected error during upload:', e);
    return { success: false, error: `An unexpected server error occurred: ${e.message}` };
  }
}
