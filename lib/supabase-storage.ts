import { supabase } from './supabase';

export const STORAGE_BUCKET = 'pallet-label-pdf';

export async function setupStorage() {
  console.log('[setupStorage] Attempting to setup storage...');
  try {
    console.log('[setupStorage] Calling supabase.storage.listBuckets(). Supabase client and storage object should be available here.');
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    console.log('[setupStorage] listBuckets call completed.');

    if (listError) {
      console.warn('[setupStorage] Warning: Error listing buckets (listError object):', listError, 'Proceeding with assumption that bucket might exist or policies will handle it.');
      // Not throwing an error here to allow upload attempt even if listBuckets fails
    } else {
      console.log('[setupStorage] All buckets raw data:', buckets);
      if (buckets && Array.isArray(buckets)) {
        buckets.forEach((b, i) => {
          console.log(`[setupStorage] Bucket[${i}]: id='${b.id}', name='${b.name}'`);
        });
      }
      console.log('[setupStorage] STORAGE_BUCKET (programmed):', STORAGE_BUCKET);

      const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
      console.log('[setupStorage] bucketExists for "', STORAGE_BUCKET, '":', bucketExists);

      if (!bucketExists) {
        console.warn(`[setupStorage] Warning: Storage bucket "${STORAGE_BUCKET}" was not found in the list or could not be verified. Buckets listed:`, buckets, 'Proceeding with upload attempt assuming it exists and is accessible.');
        // Not throwing an error here. If the bucket truly doesn't exist or isn't accessible, the .upload() will fail.
      } else {
        console.log('[setupStorage] Storage bucket verified successfully.');
      }
    }

    console.log('[setupStorage] Setup check completed (non-critical for public buckets).');
    return true;
  } catch (error) {
    let msg = '';
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      msg = JSON.stringify(error);
    } else {
      msg = String(error);
    }
    // This catch block might not be reached if we don't throw errors above
    console.error('[setupStorage] Error in setupStorage (caught exception if any):', msg, 'Original error object:', error);
    // We will let the upload function handle its own errors primarily.
    // throw new Error('setupStorage failed: ' + msg); // Commenting out the throw
    return false; // Indicate potential issue but don't stop the flow
  }
}

export async function uploadPdf(palletNum: string, qrValue: string, blob: Blob) {
  try {
    // 將 / 換成 _
    const safePalletNum = palletNum.replace(/\//g, '_');
    const safeQrValue = qrValue.replace(/\//g, '_');
    const fileName = `Label - ${safePalletNum} - ${safeQrValue}.pdf`;
    // 上傳文件
    const { data, error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        cacheControl: '3600',
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 獲取公開 URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    let msg = '';
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'object') {
      msg = JSON.stringify(error);
    } else {
      msg = String(error);
    }
    console.error('Error in uploadPdf:', msg);
    throw new Error('uploadPdf failed: ' + msg);
  }
}
