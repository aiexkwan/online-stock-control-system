'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase 服務端客戶端
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF to Images] Starting PDF processing');
    
    const { pdfUrl, fileName } = await request.json();
    
    if (!pdfUrl || !fileName) {
      return NextResponse.json({ 
        error: 'Missing required fields: pdfUrl or fileName' 
      }, { status: 400 });
    }
    
    const supabaseAdmin = createSupabaseAdmin();
    
    // 由於 GPT-4o Vision API 可能支持某些 PDF 格式
    // 我們可以嘗試以下幾種方法：
    
    // 方法 1: 生成 Supabase 簽名 URL
    console.log('[PDF to Images] Generating signed URL for PDF');
    
    // 從公開 URL 提取存儲路徑
    const urlParts = pdfUrl.split('/');
    const bucketIndex = urlParts.indexOf('object') + 2; // 'public' or 'sign'
    const bucket = urlParts[bucketIndex];
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    console.log('[PDF to Images] Bucket:', bucket, 'Path:', filePath);
    
    // 生成簽名 URL（7天有效期）
    const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(decodeURIComponent(filePath), 7 * 24 * 60 * 60); // 7 days
    
    if (signError || !signedUrlData?.signedUrl) {
      console.error('[PDF to Images] Failed to create signed URL:', signError);
      // 如果失敗，返回原始 URL
      return NextResponse.json({
        success: true,
        imageUrls: [pdfUrl],
        pageCount: 1,
        note: 'Using original PDF URL'
      });
    }
    
    console.log('[PDF to Images] Signed URL created successfully');
    
    // 方法 2: 使用 Supabase 的 transform API（如果可用）
    // Supabase 可能支持圖片轉換，但不一定支持 PDF
    
    // 方法 3: 使用第三方 API 服務
    // 這裡列出一些可以考慮的選項：
    // - api2pdf.com - 有免費額度
    // - pdfshift.io - 有免費試用
    // - cloudconvert.com - 有免費額度
    
    // 暫時返回簽名 URL，讓 GPT-4o 嘗試處理
    return NextResponse.json({
      success: true,
      imageUrls: [signedUrlData.signedUrl],
      pageCount: 1,
      signedUrl: signedUrlData.signedUrl,
      originalUrl: pdfUrl,
      note: 'Using Supabase signed URL for PDF'
    });
    
  } catch (error: any) {
    console.error('[PDF to Images] Error:', error);
    return NextResponse.json({ 
      error: 'PDF processing failed',
      details: error.message 
    }, { status: 500 });
  }
}