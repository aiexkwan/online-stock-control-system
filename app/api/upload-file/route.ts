import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase 服務端客戶端的函數
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[Upload File API] 接收文件上傳請求...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !folder || !fileName) {
      console.error('[Upload File API] 缺少必要字段:', { file: !!file, folder, fileName });
      return NextResponse.json(
        { error: 'Missing required fields: file, folder, or fileName' },
        { status: 400 }
      );
    }

    // 驗證文件夾
    const allowedFolders = ['stockPic', 'productSpec', 'photos', 'orderpdf'];
    if (!allowedFolders.includes(folder)) {
      console.error('[Upload File API] 無效的文件夾:', folder);
      return NextResponse.json(
        { error: 'Invalid folder. Allowed folders: stockPic, productSpec, photos, orderpdf' },
        { status: 400 }
      );
    }

    // 驗證文件格式
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileValidation = {
      stockPic: ['.png', '.jpeg', '.jpg'],
      productSpec: ['.pdf', '.doc', '.docx'],
      photos: ['.png', '.jpeg', '.jpg', '.gif', '.webp'],
      orderpdf: ['.pdf'],
    };

    if (!fileValidation[folder as keyof typeof fileValidation].includes(fileExtension)) {
      console.error('[Upload File API] 無效的文件格式:', { folder, fileExtension });
      return NextResponse.json(
        {
          error: `Invalid file format for ${folder}. Allowed: ${fileValidation[folder as keyof typeof fileValidation].join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 驗證文件大小 (10MB)
    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      console.error('[Upload File API] 文件過大:', file.size);
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[Upload File API] 文件信息:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        folder,
      });

    // 創建服務端客戶端（使用 Service Role Key 繞過 RLS）
    const supabaseAdmin = createSupabaseAdmin();

    // 構建文件路徑
    const filePath = `${folder}/${fileName}`;

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[Upload File API] 準備上傳到路徑:', filePath);

    // 將文件轉換為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 上傳到 Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true, // 改為 true，允許覆蓋已存在的文件
        cacheControl: '3600',
      });

    if (error) {
      console.error('[Upload File API] Supabase 上傳錯誤:', error);

      // 如果是 RLS 錯誤，提供更詳細的錯誤信息
      if (error.message.includes('row-level security') || error.message.includes('RLS')) {
        return NextResponse.json(
          {
            error: 'Storage access denied. Please check bucket permissions.',
            details: error.message,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    if (!data || !data.path) {
      console.error('[Upload File API] 上傳成功但沒有返回路徑');
      return NextResponse.json({ error: 'Upload succeeded but no path returned' }, { status: 500 });
    }

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[Upload File API] 文件上傳成功，路徑:', data.path);

    // 獲取公開 URL
    const { data: urlData } = supabaseAdmin.storage.from('documents').getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('[Upload File API] 無法獲取公共 URL');
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
    }

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('[Upload File API] 公共 URL 生成成功:', urlData.publicUrl);

    // 寫入記錄至 doc_upload 表
    try {
      // 獲取當前登入的用戶
      const uploadByStr = formData.get('uploadBy') as string;
      const uploadBy = uploadByStr ? parseInt(uploadByStr) : 1; // 轉換為整數，預設為 1

      // 確定文檔類型
      let docType: string;
      switch (folder) {
        case 'stockPic':
          docType = 'image';
          break;
        case 'productSpec':
          docType = 'spec';
          break;
        case 'photos':
          docType = 'photo';
          break;
        case 'orderpdf':
          docType = 'order';
          break;
        default:
          docType = 'other';
      }

      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[Upload File API] 準備寫入 doc_upload 表:', {
          doc_name: fileName,
          upload_by: uploadBy,
          doc_type: docType,
          folder: folder,
        });

      // 插入記錄到 doc_upload 表
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('doc_upload')
        .insert({
          doc_name: fileName,
          upload_by: uploadBy,
          doc_type: docType,
          doc_url: urlData.publicUrl,
          file_size: file.size,
          folder: folder,
        })
        .select();

      if (insertError) {
        console.error('[Upload File API] 寫入 doc_upload 表失敗:', insertError);
        // 不影響上傳成功的返回，只記錄錯誤
      } else {
        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[Upload File API] 成功寫入 doc_upload 表:', insertData);
      }
    } catch (dbError) {
      console.error('[Upload File API] 數據庫操作錯誤:', dbError);
      // 不影響上傳成功的返回
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        folder: folder,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error('[Upload File API] 意外錯誤:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
