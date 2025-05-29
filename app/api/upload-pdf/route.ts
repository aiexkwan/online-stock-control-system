'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 備用環境變數（與其他 actions 保持一致）
const FALLBACK_SUPABASE_URL = 'https://bbmkuiplnzvpudszrend.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM';

// 創建 Supabase 服務端客戶端
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  
  console.log('[Upload PDF API] 創建服務端 Supabase 客戶端...');
  console.log('[Upload PDF API] Environment check:', {
    url: supabaseUrl,
    serviceRoleKeyExists: !!serviceRoleKey,
    serviceRoleKeyFirst10: serviceRoleKey?.substring(0, 10) + '...'
  });
  
  const client = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      }
    }
  );
  
  console.log('[Upload PDF API] 服務端客戶端創建完成，應該能夠繞過 RLS');
  
  return client;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload PDF API] 接收 PDF 上傳請求...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const storagePath = formData.get('storagePath') as string || 'pallet-label-pdf';
    
    if (!file) {
      console.error('[Upload PDF API] 沒有找到文件');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!fileName) {
      console.error('[Upload PDF API] 沒有提供文件名');
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }
    
    console.log('[Upload PDF API] 文件信息:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      storagePath
    });
    
    // 轉換文件為 Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    
    console.log('[Upload PDF API] 文件轉換完成，準備上傳到 Supabase Storage...');
    
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
      return NextResponse.json({ 
        error: `Storage upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }
    
    if (!uploadData || !uploadData.path) {
      console.error('[Upload PDF API] 上傳成功但沒有返回路徑');
      return NextResponse.json({ 
        error: 'Upload succeeded but no path returned' 
      }, { status: 500 });
    }
    
    console.log('[Upload PDF API] 文件上傳成功，路徑:', uploadData.path);
    
    // 獲取公共 URL
    const { data: urlData } = supabaseAdmin.storage
      .from(storagePath)
      .getPublicUrl(uploadData.path);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('[Upload PDF API] 無法獲取公共 URL');
      return NextResponse.json({ 
        error: 'Failed to get public URL' 
      }, { status: 500 });
    }
    
    console.log('[Upload PDF API] 公共 URL 生成成功:', urlData.publicUrl);
    
    return NextResponse.json({
      success: true,
      publicUrl: urlData.publicUrl,
      path: uploadData.path
    });
    
  } catch (error: any) {
    console.error('[Upload PDF API] 意外錯誤:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message}` 
    }, { status: 500 });
  }
} 