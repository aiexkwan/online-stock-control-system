/**
 * PDF 提取 API Route
 * 專門處理 PDF 上載和提取，使用 Node.js runtime
 * 解決 Vercel serverless 中 pdf-parse 相容性問題
 */

export const runtime = 'nodejs';
export const preferredRegion = ['lhr1', 'dub1', 'fra1']; // EU/UK 地區優先

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedOrderExtractionService } from '@/app/services/enhancedOrderExtractionService';
import { systemLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 安全檢查：限制檔案大小 (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // 檢查來源：使用更寬鬆的檢查以支援 Server Action 調用
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const internalHeader = request.headers.get('x-internal-request');
    
    // 在 production 環境中，允許以下情況：
    // 1. 有 x-internal-request header
    // 2. 來自 Vercel 域名
    // 3. 沒有 origin/referer（Server Action 調用）
    const isInternalCall = 
      internalHeader === 'true' ||
      origin?.includes('.vercel.app') ||
      referer?.includes('.vercel.app') ||
      (!origin && !referer); // Server Action 調用通常沒有這些 headers
    
    // 只在有明確外部來源時才拒絕
    if (process.env.NODE_ENV === 'production' && origin && !isInternalCall) {
      // 檢查是否來自外部域名
      const isExternalOrigin = origin && 
        !origin.includes('localhost') && 
        !origin.includes('vercel.app') &&
        !origin.includes(process.env.NEXT_PUBLIC_APP_URL || '');
      
      if (isExternalOrigin) {
        systemLogger.warn({
          origin,
          referer,
          internalHeader,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }, '[PDF Extract API] External access blocked');
        
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        );
      }
    }
    
    // 檢查 Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // 檢查檔案大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 413 }
      );
    }

    // 驗證文件類型
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    systemLogger.info({
      fileName: fileName || file.name,
      fileSize: file.size,
      contentType: file.type
    }, '[PDF Extract API] Processing file');

    // 轉換文件為 ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // 使用增強提取服務
    const enhancedService = EnhancedOrderExtractionService.getInstance();
    const result = await enhancedService.extractOrderFromPDF(
      fileBuffer, 
      fileName || file.name
    );

    if (result.success && result.data) {
      systemLogger.info({
        orderRef: result.data.order_ref,
        productCount: result.data.products.length,
        method: result.extractionMethod,
        processingTime: result.metadata.processingTime,
        tokensUsed: result.metadata.tokensUsed
      }, '[PDF Extract API] Extraction successful');

      return NextResponse.json({
        success: true,
        data: result.data,
        metadata: result.metadata
      });
    } else {
      systemLogger.error({
        error: result.error,
        fileName: fileName || file.name
      }, '[PDF Extract API] Extraction failed');

      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'PDF 提取失敗' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    systemLogger.error({
      error: errorMessage
    }, '[PDF Extract API] API error');

    return NextResponse.json(
      { 
        success: false, 
        error: `API 錯誤: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}