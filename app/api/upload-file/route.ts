import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !folder || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: file, folder, or fileName' },
        { status: 400 }
      );
    }

    // 驗證文件夾
    const allowedFolders = ['stockPic', 'productSpec'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder. Allowed folders: stockPic, productSpec' },
        { status: 400 }
      );
    }

    // 驗證文件格式
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileValidation = {
      stockPic: ['.png', '.jpeg', '.jpg'],
      productSpec: ['.pdf', '.doc', '.docx']
    };

    if (!fileValidation[folder as keyof typeof fileValidation].includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file format for ${folder}. Allowed: ${fileValidation[folder as keyof typeof fileValidation].join(', ')}` },
        { status: 400 }
      );
    }

    // 驗證文件大小 (10MB)
    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // 創建 Supabase 客戶端
    const supabase = createClient();

    // 構建文件路徑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileNameWithTimestamp = `${timestamp}_${fileName}`;
    const filePath = `${folder}/${fileNameWithTimestamp}`;

    // 將文件轉換為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
        fileName: fileNameWithTimestamp,
        folder: folder,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 