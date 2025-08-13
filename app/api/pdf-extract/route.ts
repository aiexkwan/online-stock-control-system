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