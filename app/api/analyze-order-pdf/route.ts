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

// PDF 轉圖像函數（Serverless 環境不支持）
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('[PDF to Images] 檢查 PDF 轉圖像支持...');
    console.log('[PDF to Images] Buffer 大小:', pdfBuffer.length, 'bytes');
    
    // 在 serverless 環境中，PDF 轉圖像需要額外的系統依賴
    // 直接跳過圖像轉換，使用文本提取模式
    console.log('[PDF to Images] Serverless 環境不支持 PDF 轉圖像，使用文本提取模式');
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

// PDF 文本提取函數（使用 pdf-parse 正確導入方式）
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Text Extraction] 開始使用 pdf-parse 提取 PDF 文本...');
    console.log('[PDF Text Extraction] Buffer 大小:', pdfBuffer.length, 'bytes');
    console.log('[PDF Text Extraction] Buffer 類型:', typeof pdfBuffer);
    console.log('[PDF Text Extraction] 是否為 Buffer:', Buffer.isBuffer(pdfBuffer));
    
    // 確保傳入的是 Buffer 對象
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid buffer provided to extractTextFromPDF');
    }
    
    // 驗證 Buffer 不為空
    if (pdfBuffer.length === 0) {
      throw new Error('Empty PDF buffer provided');
    }
    
    // 使用正確的 pdf-parse 導入方式，避免測試文件問題
    console.log('[PDF Text Extraction] 使用 pdf-parse 正確導入方式...');
    
    // 使用兼容的導入方式
    const pkg = require('pdf-parse');
    const pdfParse = pkg.default || pkg;
    
    // 直接處理 Buffer，不使用任何配置選項
    console.log('[PDF Text Extraction] 調用 pdf-parse 處理 Buffer...');
    const pdfData = await pdfParse(pdfBuffer);
    
    console.log('[PDF Text Extraction] pdf-parse 提取成功');
    console.log('[PDF Text Extraction] 頁數:', pdfData.numpages);
    console.log('[PDF Text Extraction] 文本長度:', pdfData.text.length);
    console.log('[PDF Text Extraction] 文本預覽（前500字符）:', pdfData.text.substring(0, 500));
    
    if (pdfData.text && pdfData.text.trim().length > 0) {
      console.log('[PDF Text Extraction] 成功從上傳的 PDF 提取文本');
      return pdfData.text.trim();
    } else {
      console.warn('[PDF Text Extraction] pdf-parse 返回空文本');
      throw new Error('No readable text found in PDF');
    }
    
  } catch (error: any) {
    console.error('[PDF Text Extraction] pdf-parse 處理失敗:', error);
    console.error('[PDF Text Extraction] 錯誤詳情:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    throw new Error(`PDF text extraction failed: ${error.message}`);
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