'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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
  
  return createClient(
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
}

// 創建 OpenAI 客戶端
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

// PDF 轉圖像函數（使用 pdf-lib 進行 PDF 操作）
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('[PDF to Images] 開始使用 pdf-lib 轉換 PDF 到圖像...');
    
    // 使用 pdf-lib 處理 PDF
    const { PDFDocument } = await import('pdf-lib');
    
    // 加載 PDF 文檔
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`[PDF to Images] PDF 包含 ${pageCount} 頁`);
    
    // 注意：pdf-lib 本身不能直接轉換為圖像
    // 在 serverless 環境中，我們跳過圖像轉換，直接使用文本提取
    console.log('[PDF to Images] pdf-lib 不支持直接圖像轉換，使用文本提取模式');
    throw new Error('PDF_TEXT_EXTRACTION_NEEDED');
    
  } catch (error: any) {
    console.error('[PDF to Images] 轉換錯誤:', error);
    
    // 如果是特殊的文本提取標記，重新拋出
    if (error.message === 'PDF_TEXT_EXTRACTION_NEEDED') {
      throw error;
    }
    
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PDF 文本提取函數（使用 pdf-parse）
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Text Extraction] 開始使用 pdf-parse 提取 PDF 文本...');
    console.log('[PDF Text Extraction] Buffer 大小:', pdfBuffer.length, 'bytes');
    
    // 確保傳入的是 Buffer 對象
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid buffer provided to extractTextFromPDF');
    }
    
    // 方法 1: 使用 pdf-parse（主要方法）
    try {
      console.log('[PDF Text Extraction] 嘗試使用 pdf-parse...');
      
      const pdfParse = (await import('pdf-parse')).default;
      
      // 使用 pdf-parse 提取文本 - 修復配置問題
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0, // 最大頁數，0 表示所有頁面
        // 移除可能導致問題的配置選項
      });
      
      console.log('[PDF Text Extraction] pdf-parse 提取成功');
      console.log('[PDF Text Extraction] 頁數:', pdfData.numpages);
      console.log('[PDF Text Extraction] 文本長度:', pdfData.text.length);
      console.log('[PDF Text Extraction] 文本預覽（前500字符）:', pdfData.text.substring(0, 500));
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('No text content found in PDF using pdf-parse');
      }
      
      return pdfData.text;
      
    } catch (parseError: any) {
      console.error('[PDF Text Extraction] pdf-parse 失敗:', parseError.message);
      
      // 方法 2: 使用基本的文本模式匹配（更可靠的備用方案）
      try {
        console.log('[PDF Text Extraction] 嘗試基本文本模式匹配...');
        
        const textContent = pdfBuffer.toString('latin1', 0, Math.min(pdfBuffer.length, 100000));
        
        // 嘗試找到 PDF 中的文本流 - 改進的正則表達式
        const textMatches = textContent.match(/\(([^)]+)\)/g);
        if (textMatches && textMatches.length > 0) {
          const extractedText = textMatches
            .map(match => match.slice(1, -1))
            .filter(text => text.length > 1) // 過濾掉單字符
            .join(' ')
            .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
            .replace(/\\/g, '');
          
          if (extractedText.length > 100) {
            console.log('[PDF Text Extraction] 基本模式匹配成功，文本長度:', extractedText.length);
            console.log('[PDF Text Extraction] 提取的文本預覽:', extractedText.substring(0, 500));
            return extractedText;
          }
        }
        
        // 嘗試另一種 PDF 文本提取方法
        const streamMatches = textContent.match(/stream[\s\S]*?endstream/g);
        if (streamMatches && streamMatches.length > 0) {
          let streamText = '';
          for (const stream of streamMatches) {
            const cleanStream = stream.replace(/stream\s*|\s*endstream/g, '');
            // 嘗試解碼文本流
            const textInStream = cleanStream.match(/\(([^)]+)\)/g);
            if (textInStream) {
              streamText += textInStream.map(t => t.slice(1, -1)).join(' ') + ' ';
            }
          }
          
          if (streamText.length > 100) {
            console.log('[PDF Text Extraction] 流提取成功，文本長度:', streamText.length);
            console.log('[PDF Text Extraction] 提取的文本預覽:', streamText.substring(0, 500));
            return streamText;
          }
        }
        
        // 搜索特定的訂單模式
        const patterns = [
          /Picking\s+List[:\s]*(\d+)/i,
          /Account\s+No[:\s]*(\w+)/i,
          /Customer[s]?\s+Ref[:\s]*([^\n\r]+)/i,
          /Item\s+Code[:\s]*([^\n\r]+)/i,
          /Description[:\s]*([^\n\r]+)/i,
          /Qty[:\s]*(\d+)/i,
        ];
        
        let foundText = '';
        for (const pattern of patterns) {
          const matches = textContent.match(new RegExp(pattern.source, 'gi'));
          if (matches) {
            foundText += matches.join('\n') + '\n';
          }
        }
        
        if (foundText.length > 50) {
          console.log('[PDF Text Extraction] 模式匹配提取成功，文本長度:', foundText.length);
          console.log('[PDF Text Extraction] 提取的文本:', foundText);
          return foundText;
        }
        
        throw new Error('No extractable text found using pattern matching');
        
      } catch (basicError) {
        console.error('[PDF Text Extraction] 基本提取失敗:', basicError);
        
        // 方法 3: 使用 pdf-lib 作為最後備用（僅提取基本信息）
        try {
          console.log('[PDF Text Extraction] 嘗試使用 pdf-lib 作為最後備用...');
          
          const { PDFDocument } = await import('pdf-lib');
          
          // 加載 PDF 文檔
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pageCount = pdfDoc.getPageCount();
          
          console.log(`[PDF Text Extraction] pdf-lib 加載成功，頁數: ${pageCount}`);
          
          // pdf-lib 主要用於 PDF 操作，不是文本提取
          // 我們可以獲取一些基本信息，但無法直接提取文本
          const title = pdfDoc.getTitle() || '';
          const subject = pdfDoc.getSubject() || '';
          const keywordsRaw = pdfDoc.getKeywords();
          const keywords = Array.isArray(keywordsRaw) ? keywordsRaw : [];
          
          let extractedInfo = '';
          if (title) extractedInfo += `Title: ${title}\n`;
          if (subject) extractedInfo += `Subject: ${subject}\n`;
          if (keywords.length > 0) extractedInfo += `Keywords: ${keywords.join(', ')}\n`;
          
          if (extractedInfo.length > 0) {
            console.log('[PDF Text Extraction] pdf-lib 提取到基本信息:', extractedInfo);
            console.warn('[PDF Text Extraction] 警告：只提取到 PDF 元數據，沒有實際內容');
            return extractedInfo;
          }
          
          throw new Error('No extractable content found using pdf-lib');
          
        } catch (pdfLibError: any) {
          console.error('[PDF Text Extraction] pdf-lib 也失敗:', pdfLibError.message);
          throw new Error(`All PDF text extraction methods failed. pdf-parse: ${parseError.message}, basic: ${basicError}, pdf-lib: ${pdfLibError.message}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('[PDF Text Extraction] 文本提取失敗:', error);
    console.error('[PDF Text Extraction] 錯誤詳情:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') // 只顯示前3行堆棧
    });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// 定義訂單數據接口
interface OrderData {
  account_num: number;
  order_ref: number;
  customer_ref: string;
  invoice_to: string;
  delivery_add: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  unit_price: number;
  uploaded_by: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Analyze Order PDF API] 接收 PDF 分析請求...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const saveToStorage = formData.get('saveToStorage') as string;
    
    if (!file) {
      console.error('[Analyze Order PDF API] 沒有找到文件');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!uploadedBy) {
      console.error('[Analyze Order PDF API] 沒有提供上傳者ID');
      return NextResponse.json({ error: 'No uploadedBy provided' }, { status: 400 });
    }
    
    console.log('[Analyze Order PDF API] 文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy,
      saveToStorage: saveToStorage === 'true'
    });
    
    // 驗證文件類型
    if (file.type !== 'application/pdf') {
      console.error('[Analyze Order PDF API] 無效的文件類型:', file.type);
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Only PDF files are allowed.` 
      }, { status: 400 });
    }
    
    // 轉換文件為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // 可選：保存文件到 Storage
    let storageInfo = null;
    if (saveToStorage === 'true') {
      try {
        console.log('[Analyze Order PDF API] 保存文件到 orderpdf bucket...');
        
        const supabaseAdmin = createSupabaseAdmin();
        const fileName = `order-${Date.now()}-${file.name}`;
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('orderpdf')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf',
          });
        
        if (uploadError) {
          console.error('[Analyze Order PDF API] Storage 上傳錯誤:', uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from('orderpdf')
            .getPublicUrl(uploadData.path);
          
          storageInfo = {
            path: uploadData.path,
            publicUrl: urlData.publicUrl,
            bucket: 'orderpdf'
          };
          
          console.log('[Analyze Order PDF API] 文件保存成功:', storageInfo);
        }
      } catch (storageError) {
        console.error('[Analyze Order PDF API] Storage 操作錯誤:', storageError);
      }
    }
    
    console.log('[Analyze Order PDF API] 開始 PDF 處理...');
    
    // 檢測運行環境
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    
    // 步驟 1: 根據環境選擇處理方式
    let imageBase64Array: string[] = [];
    let extractedText: string = '';
    let processingMode = '';
    
    if (isVercel) {
      // Vercel 環境：直接使用文本提取，不嘗試圖像轉換
      console.log('[Analyze Order PDF API] Vercel 環境：直接使用文本提取模式');
      try {
        extractedText = await extractTextFromPDF(pdfBuffer);
        processingMode = 'text_extraction';
        console.log('[Analyze Order PDF API] 文本提取成功，字符數:', extractedText.length);
      } catch (textError: any) {
        console.error('[Analyze Order PDF API] 文本提取失敗:', textError.message);
        return NextResponse.json({ 
          error: 'PDF text extraction failed in Vercel',
          details: textError.message
        }, { status: 500 });
      }
    } else {
      // 本地環境：優先嘗試圖像轉換
      try {
        imageBase64Array = await convertPdfToImages(pdfBuffer);
        processingMode = 'image_analysis';
        console.log(`[Analyze Order PDF API] PDF 轉圖像成功，共 ${imageBase64Array.length} 頁`);
      } catch (imageError: any) {
        console.warn('[Analyze Order PDF API] 圖像轉換失敗，嘗試文本提取:', imageError.message);
        
        try {
          extractedText = await extractTextFromPDF(pdfBuffer);
          processingMode = 'text_extraction';
          console.log('[Analyze Order PDF API] 文本提取成功，字符數:', extractedText.length);
        } catch (textError: any) {
          console.error('[Analyze Order PDF API] 所有 PDF 處理方法都失敗:', textError.message);
          return NextResponse.json({ 
            error: 'PDF processing failed',
            details: `Unable to process PDF: ${textError.message}`,
            imageError: imageError.message,
            textError: textError.message
          }, { status: 500 });
        }
      }
    }
    
    // 步驟 3: 發送到 OpenAI（系統不做任何數據處理）
    console.log('[Analyze Order PDF API] 發送到 OpenAI 進行完全處理...');
    
    const openai = createOpenAIClient();
    
    // 定義 OpenAI prompt
    const prompt = `
You are a professional data extraction specialist. Analyze the provided UK order "Picking List" and extract order information.

**CRITICAL INSTRUCTIONS:**
1. Return ONLY a valid JSON array - no explanations, no markdown, no additional text.
2. Start your response with [ and end with ].
3. Do not include any text before or after the JSON array.
4. Do not wrap the response in markdown code blocks.

**IMPORTANT: If you cannot find clear order data, return an empty array: []**

**Database Schema:**
- account_num (number) - Account number (extract from "Account No" field, if not found set as 0)
- order_ref (number) - Picking List number (extract from "Picking List" field, remove leading zeros, if not found set as 0)
- customer_ref (string) - Customer reference (extract from "Customers Ref" or "Customer Ref" field, keep original format like "PO0034637", "DSPO-0360425")
- invoice_to (string) - Invoice To address (extract company name and address, combine multiple lines)
- delivery_add (string) - Delivery Address (extract full delivery address, combine multiple lines)
- product_code (string) - Product code/SKU (from "Item Code" or similar field)
- product_desc (string) - Product description (from "Description" field)
- product_qty (number) - Quantity (from "Qty Req" or "Quantity" field)
- unit_price (number) - Price in pence/cents (£12.50 = 1250, if blank set as 0)

**EXTRACTION RULES:**
- Look for patterns like "Picking List: 280833", "Account No: 1504", "Customers Ref: PO0034637"
- For product lines, look for item codes, descriptions, quantities, and prices
- Skip transport, delivery charges, pallet charges, and system remarks
- Only extract actual product items with valid codes and descriptions
- If data is missing, use defaults: Numbers = 0, Text = "NOT_FOUND"

**Example format:**
[{"account_num":1504,"order_ref":280833,"customer_ref":"PO0034637","invoice_to":"Company Name Address","delivery_add":"Delivery Address","product_code":"ME6045150","product_desc":"Product Description","product_qty":1,"unit_price":1500}]

**REMEMBER: Extract ALL product line items. If no clear data found, return []**`;
    
    // 構建 OpenAI 消息
    const messageContent: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];
    
    if (processingMode === 'image_analysis') {
      // 圖像模式：添加所有頁面的圖像
      for (let i = 0; i < imageBase64Array.length; i++) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${imageBase64Array[i]}`,
            detail: "high"
          }
        });
      }
      console.log('[Analyze Order PDF API] 使用圖像模式，包含', imageBase64Array.length, '張圖像');
    } else {
      // 文本模式：添加提取的文本，並提供更多上下文
      const textWithContext = `
**DOCUMENT TEXT CONTENT:**
${extractedText}

**ANALYSIS INSTRUCTIONS:**
Please carefully analyze the above text content to extract order information. Look for:
- Picking List number
- Account number  
- Customer reference
- Invoice and delivery addresses
- Product items with codes, descriptions, quantities, and prices

If the text appears garbled or unclear, try to identify key patterns and numbers that match the expected format.`;
      
      messageContent[0].text += textWithContext;
      console.log('[Analyze Order PDF API] 使用文本模式，文本長度:', extractedText.length);
      console.log('[Analyze Order PDF API] 文本內容預覽:', extractedText.substring(0, 500));
      console.log('[Analyze Order PDF API] 文本內容（完整）:', extractedText);
    }
    
    // 發送到 OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only data extraction bot. You must ONLY output valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON. Your entire response must be parseable by JSON.parse()."
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });
    
    console.log('[Analyze Order PDF API] OpenAI 回應接收完成');
    
    const extractedContent = response.choices[0]?.message?.content;
    
    if (!extractedContent) {
      console.error('[Analyze Order PDF API] OpenAI 沒有返回內容');
      return NextResponse.json({ error: 'No content extracted from OpenAI' }, { status: 500 });
    }
    
    console.log('[Analyze Order PDF API] OpenAI 原始回應:', extractedContent);
    console.log('[Analyze Order PDF API] OpenAI 回應長度:', extractedContent.length);
    console.log('[Analyze Order PDF API] 處理模式:', processingMode);
    
    // 如果是文本提取模式，記錄提取的文本內容
    if (processingMode === 'text_extraction') {
      console.log('[Analyze Order PDF API] 提取的文本內容（前1000字符）:', extractedText.substring(0, 1000));
      console.log('[Analyze Order PDF API] 提取的文本總長度:', extractedText.length);
    }
    
    // 步驟 4: 直接解析 OpenAI 回應（最小處理）
    let orderData: OrderData[];
    try {
      // 只做最基本的清理
      let cleanContent = extractedContent.trim();
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      cleanContent = cleanContent.replace(/^\uFEFF/, '');
      
      // 直接解析，不做複雜的處理
      orderData = JSON.parse(cleanContent);
      
      if (!Array.isArray(orderData)) {
        throw new Error('OpenAI response is not an array');
      }
      
      console.log(`[Analyze Order PDF API] OpenAI 返回 ${orderData.length} 條記錄`);
      
    } catch (parseError: any) {
      console.error('[Analyze Order PDF API] OpenAI 回應解析失敗:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse OpenAI response',
        details: parseError.message,
        originalContent: extractedContent
      }, { status: 500 });
    }
    
    // 步驟 5: 直接插入數據庫（不做驗證）
    console.log('[Analyze Order PDF API] 直接插入數據庫...');
    
    const supabaseAdmin = createSupabaseAdmin();
    
    try {
      const insertPromises = orderData.map(async (order, index) => {
        const orderWithUploader = {
          ...order,
          uploaded_by: parseInt(uploadedBy)
        };
        
        console.log(`[Analyze Order PDF API] 插入記錄 ${index + 1}:`, orderWithUploader);
        
        const { data, error } = await supabaseAdmin
          .from('data_order')
          .insert(orderWithUploader)
          .select();
        
        if (error) {
          console.error(`[Analyze Order PDF API] 插入記錄 ${index + 1} 錯誤:`, error);
          throw error;
        }
        
        return data;
    });
    
    const insertResults = await Promise.all(insertPromises);
    
      console.log('[Analyze Order PDF API] 所有記錄插入成功');
    
    return NextResponse.json({
      success: true,
        message: `Successfully processed PDF and inserted ${insertResults.length} records`,
      extractedData: orderData,
      insertedRecords: insertResults.flat(),
      recordCount: insertResults.length,
        processingMode: processingMode,
        pagesProcessed: processingMode === 'image_analysis' ? imageBase64Array.length : 1,
      storageInfo: storageInfo,
        openaiResponse: {
          model: response.model,
          usage: response.usage
        }
      });
      
    } catch (insertError: any) {
      console.error('[Analyze Order PDF API] 數據庫插入失敗:', insertError);
      return NextResponse.json({ 
        error: 'Database insertion failed',
        details: insertError.message,
        extractedData: orderData
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Analyze Order PDF API] 系統錯誤:', error);
    return NextResponse.json({ 
      error: 'System error',
      details: error.message
    }, { status: 500 });
  }
} 