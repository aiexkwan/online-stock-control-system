import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Test PDF API] 開始測試 PDF 處理...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('[Test PDF API] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // 轉換文件為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    console.log('[Test PDF API] Buffer 大小:', pdfBuffer.length);
    
    // 檢測運行環境
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    console.log('[Test PDF API] 運行環境:', isVercel ? 'Vercel' : 'Local');
    
    let extractedText = '';
    
    if (isVercel) {
      console.log('[Test PDF API] 在 Vercel 環境中使用 pdfjs-dist...');
      
      try {
        // 動態導入 pdfjs-dist legacy build
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        
        // 設置 worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        console.log('[Test PDF API] pdfjs-dist 版本:', pdfjsLib.version);
        
        // 將 Buffer 轉換為 Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // 加載 PDF 文檔
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          useSystemFonts: true,
          disableFontFace: true,
          isEvalSupported: false,
        });
        
        const pdfDoc = await loadingTask.promise;
        console.log('[Test PDF API] PDF 加載成功，頁數:', pdfDoc.numPages);
        
        let fullText = '';
        
        // 逐頁提取文本
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          try {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // 將文本項目組合成字符串
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            
            fullText += pageText + '\n';
            console.log(`[Test PDF API] 頁面 ${pageNum} 文本長度:`, pageText.length);
          } catch (pageError) {
            console.warn(`[Test PDF API] 頁面 ${pageNum} 提取失敗:`, pageError);
          }
        }
        
        extractedText = fullText;
        console.log('[Test PDF API] 總文本長度:', extractedText.length);
        
      } catch (pdfError: any) {
        console.error('[Test PDF API] pdfjs-dist 錯誤:', pdfError);
        return NextResponse.json({ 
          error: 'PDF text extraction failed',
          details: pdfError.message,
          environment: 'Vercel'
        }, { status: 500 });
      }
    } else {
      extractedText = 'Local environment - PDF processing not implemented in test';
    }
    
    return NextResponse.json({
      success: true,
      environment: isVercel ? 'Vercel' : 'Local',
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 500),
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error: any) {
    console.error('[Test PDF API] 意外錯誤:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 