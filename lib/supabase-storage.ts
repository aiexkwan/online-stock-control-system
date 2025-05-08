import { supabase } from './supabase';

export const STORAGE_BUCKET = 'pallet-label-pdf';

export async function setupStorage() {
  try {
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    console.log('All buckets:', buckets); // Debug 輸出所有 bucket 名稱
    if (buckets && Array.isArray(buckets)) {
      buckets.forEach((b, i) => {
        console.log(`Bucket[${i}]: id='${b.id}', name='${b.name}'`);
      });
    }
    console.log('STORAGE_BUCKET (程式碼設定):', STORAGE_BUCKET);

    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error('Error listing buckets: ' + (listError.message || JSON.stringify(listError)));
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    console.log('bucketExists:', bucketExists);

    if (!bucketExists) {
      throw new Error('Storage bucket does not exist. Please create it manually in Supabase console.');
    }

    return true;
  } catch (error) {
    let msg = '';
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'object') {
      msg = JSON.stringify(error);
    } else {
      msg = String(error);
    }
    console.error('Error in setupStorage:', msg);
    throw new Error('setupStorage failed: ' + msg);
  }
}

export async function uploadPdf(palletNum: string, blob: Blob) {
  try {
    const fileName = `labels/${palletNum}.pdf`;
    
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
