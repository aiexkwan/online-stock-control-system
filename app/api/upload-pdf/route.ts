'use server';

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('[Upload PDF API] 接收 PDF 上傳請求...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const storagePath = (formData.get('storagePath') as string) || 'orderpdf';

    if (!file) {
      console.error('[Upload PDF API] 沒有找到文件');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fileName) {
      console.error('[Upload PDF API] 沒有提供文件名');
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('[Upload PDF API] 文件信息:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
      });

    // 驗證文件類型
    if (file.type !== 'application/pdf') {
      console.error('[Upload PDF API] 無效的文件類型:', file.type);
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Only PDF files are allowed.`,
        },
        { status: 400 }
      );
    }

    // 轉換文件為 Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer as string], { type: 'application/pdf' });

    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log(
        '[Upload PDF API] 文件轉換完成，準備上傳到 Supabase Storage bucket:',
        storagePath
      );

    // 創建服務端客戶端
    const supabaseAdmin = createSupabaseAdmin();

    // 上傳到 Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(storagePath)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[Upload PDF API] Storage 上傳錯誤:', uploadError);
      return NextResponse.json(
        {
          error: `Storage upload failed: ${(uploadError as { message: string }).message}`,
        },
        { status: 500 }
      );
    }

    if (!uploadData || !uploadData.path) {
      console.error('[Upload PDF API] 上傳成功但沒有返回路徑');
      return NextResponse.json(
        {
          error: 'Upload succeeded but no path returned',
        },
        { status: 500 }
      );
    }

    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('[Upload PDF API] 文件上傳成功，路徑:', uploadData.path);

    // 獲取公共 URL
    const { data: urlData } = supabaseAdmin.storage.from(storagePath).getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('[Upload PDF API] 無法獲取公共 URL');
      return NextResponse.json(
        {
          error: 'Failed to get public URL',
        },
        { status: 500 }
      );
    }

    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('[Upload PDF API] 公共 URL 生成成功:', urlData.publicUrl);

    return NextResponse.json({
      success: true,
      publicUrl: urlData.publicUrl,
      path: uploadData.path,
      bucket: storagePath,
    });
  } catch (error: any) {
    console.error('[Upload PDF API] 意外錯誤:', error);
    return NextResponse.json(
      {
        error: `Server error: ${(error as { message: string }).message}`,
      },
      { status: 500 }
    );
  }
}
