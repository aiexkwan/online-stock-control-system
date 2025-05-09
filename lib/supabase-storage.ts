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
      console.error('[setupStorage] Error listing buckets (listError object):', listError);
      throw new Error('Error listing buckets: ' + (listError.message || JSON.stringify(listError)));
    }

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
      console.error(`[setupStorage] Storage bucket "${STORAGE_BUCKET}" does not exist or could not be verified. Buckets listed:`, buckets);
      throw new Error(`Storage bucket "${STORAGE_BUCKET}" does not exist or could not be verified.`);
    }

    console.log('[setupStorage] Setup successful.');
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
    console.error('[setupStorage] Error in setupStorage (caught exception):', msg, 'Original error object:', error);
    throw new Error('setupStorage failed: ' + msg);
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
