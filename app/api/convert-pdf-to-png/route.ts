'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/types/error-handling';

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
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PDF to PNG] Starting conversion');
    }

    const { pdfUrl, fileName } = await request.json();

    if (!pdfUrl || !fileName) {
      return NextResponse.json(
        {
          error: 'Missing required fields: pdfUrl or fileName',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const imageUrls: string[] = [];

    // 使用免費的 PDF to Image API
    // 選項 1: 使用 pdf.co API (需要註冊免費帳號)
    // 選項 2: 使用 ConvertAPI (每月有免費額度)
    // 選項 3: 使用 Cloudinary (有免費層)

    // 這裡使用一個簡單的方案：直接使用 Google Docs Viewer
    // Google Docs Viewer 可以將 PDF 轉換為可查看的格式

    try {
      // 方案 1: 使用 Google Docs Viewer 嵌入式圖片
      // 注意：這個方法可能不適用於所有 PDF
      const encodedUrl = encodeURIComponent(pdfUrl);
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

      // 為了簡化，我們假設 PDF 只有一頁
      // 在實際應用中，你可能需要使用專門的 PDF 處理服務
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PDF to PNG] Using Google Docs Viewer as fallback');
      }

      // 創建一個包含 PDF 預覽的截圖 URL
      // 這是一個臨時解決方案
      const timestamp = Date.now();
      const imageName = `${fileName.replace('.pdf', '')}_preview_${timestamp}.png`;

      // 生成一個佔位符圖片，包含 PDF URL 信息
      const placeholderSvg = `
        <svg width="1200" height="1600" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="1600" fill="white" stroke="#ccc" stroke-width="2"/>
          <text x="600" y="100" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
            PDF Document
          </text>
          <text x="600" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
            ${fileName}
          </text>
          <text x="600" y="800" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">
            Please view the original PDF for accurate content
          </text>
          <text x="600" y="830" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
            ${pdfUrl}
          </text>
        </svg>
      `;

      // 將 SVG 轉換為 Buffer
      const svgBuffer = Buffer.from(placeholderSvg);

      // 上傳到 Supabase
      const imagePath = `orderpdf/temp/${imageName}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(imagePath, svgBuffer, {
          contentType: 'image/svg+xml',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 獲取公開 URL
      const { data: urlData } = supabaseAdmin.storage.from('documents').getPublicUrl(imagePath);

      if (urlData?.publicUrl) {
        // 對於測試，我們直接返回原始 PDF URL
        // GPT-4o 可能能夠處理某些 PDF 格式
        imageUrls.push(pdfUrl);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[PDF to PNG] Using original PDF URL for GPT-4o');
        }
      }
    } catch (conversionError: unknown) {
      console.error('[PDF to PNG] Conversion error:', conversionError);
      // 如果轉換失敗，直接返回原始 PDF URL
      // 讓 GPT-4o 嘗試處理
      imageUrls.push(pdfUrl);
    }

    return NextResponse.json({
      success: true,
      imageUrls: imageUrls,
      pageCount: imageUrls.length,
      note: 'Using original PDF URL - GPT-4o may handle some PDF formats directly',
    });
  } catch (error: unknown) {
    console.error('[PDF to PNG] Error:', error);
    return NextResponse.json(
      {
        error: 'PDF to PNG conversion failed',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
