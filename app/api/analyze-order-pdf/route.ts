'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import crypto from 'crypto';

// 簡單的內存緩存（生產環境建議使用 Redis）
const fileCache = new Map<string, any>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分鐘

// 🔥 需要插入到 record_aco 的 product_code 列表
const ACO_PRODUCT_CODES = [
  "MHALFWG", "MHALFWG15", "MHALFWG20", "MHALFWG30", "MHALFWG38", 
  "MHALFWG45", "MHALFWG60", "MHCONKIT", "MHCONR", "MHEASY15", 
  "MHEASY60", "MHEASYA", "MHEASYB", "MHLACO12Y", "MHLACO18Y", 
  "MHLACO24Y", "MHLACO6Y", "MHWEDGE", "MHWEDGE15", "MHWEDGE20", 
  "MHWEDGE30", "MHWEDGE38", "MHWEDGE45", "MHWEDGE60"
];

// 生成文件哈希值
function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// 檢查緩存
function getCachedResult(fileHash: string): any | null {
  const cached = fileCache.get(fileHash);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  if (cached) {
    fileCache.delete(fileHash); // 清除過期緩存
  }
  return null;
}

// 設置緩存
function setCachedResult(fileHash: string, data: any): void {
  fileCache.set(fileHash, {
    data,
    timestamp: Date.now()
  });
}

// 清理過期緩存
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of fileCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      fileCache.delete(key);
    }
  }
}

// 創建 Supabase 服務端客戶端的函數
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

// 創建 OpenAI 客戶端
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
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

// PDF 文本提取函數（簡化版）
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }
    
    const pkg = require('pdf-parse');
    const pdfParse = pkg.default || pkg;
    const pdfData = await pdfParse(pdfBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No readable text found in PDF');
    }
    
    return pdfData.text.trim();
  } catch (error: any) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

// 🔥 策略 2：PDF 文本智能預處理函數
function preprocessPdfText(rawText: string): string {
  console.log(`[PDF Preprocessing] Original text length: ${rawText.length} chars`);
  
  // 1. 提取訂單參考號碼（通常在文檔開頭）
  const orderRefMatch = rawText.match(/\b\d{8,10}\b/);
  const orderRef = orderRefMatch ? orderRefMatch[0] : '';
  
  // 2. 定位產品表格區域的關鍵標識
  const tableStartMarkers = [
    'Item Code',
    'Product Code', 
    'Code',
    'Description',
    'Qty',
    'Pack Size',
    'Weight'
  ];
  
  const tableEndMarkers = [
    'Total Weight',
    'Total Number Of Pages',
    'Notes:',
    'Nett',
    'VAT',
    'TOTAL',
    'Parcel 1',
    'Parcel 2',
    'Height',
    'Length',
    'Width'
  ];
  
  // 3. 找到表格開始位置
  let tableStart = -1;
  for (const marker of tableStartMarkers) {
    const index = rawText.indexOf(marker);
    if (index !== -1 && (tableStart === -1 || index < tableStart)) {
      tableStart = index;
    }
  }
  
  // 4. 找到表格結束位置
  let tableEnd = rawText.length;
  for (const marker of tableEndMarkers) {
    const index = rawText.indexOf(marker, tableStart);
    if (index !== -1 && index < tableEnd) {
      tableEnd = index;
    }
  }
  
  // 5. 提取和過濾產品行
  let coreContent = '';
  
  // 添加訂單參考號碼
  if (orderRef) {
    coreContent += `Order Reference: ${orderRef}\n\n`;
  }
  
  // 添加表格內容並進行智能過濾
  if (tableStart !== -1) {
    const tableContent = rawText.substring(tableStart, tableEnd);
    
    // 🔥 智能產品行識別和過濾
    const productLines = extractProductLines(tableContent);
    if (productLines.length > 0) {
      coreContent += `Product Items:\n${productLines.join('\n')}`;
    } else {
      // 備用：使用原始表格內容但進行基本清理
      coreContent += `Product Table:\n${tableContent}`;
    }
  } else {
    // 如果找不到表格標識，嘗試直接識別產品行
    console.log('[PDF Preprocessing] Table markers not found, attempting direct product line extraction');
    const productLines = extractProductLines(rawText);
    if (productLines.length > 0) {
      coreContent += `Order Reference: ${orderRef}\n\nProduct Items:\n${productLines.join('\n')}`;
    } else {
      // 最後備用策略：使用原始文本但進行清理
      coreContent = rawText;
    }
  }
  
  // 6. 清理和優化文本
  let processedText = coreContent
    // 移除多餘的空行
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // 移除行首行尾空格
    .replace(/^\s+|\s+$/gm, '')
    // 移除重複的空格
    .replace(/\s{2,}/g, ' ')
    // 移除常見的無關內容
    .replace(/Tel:\s*\d+[\d\s\-\+\(\)]*\n?/gi, '')
    .replace(/Email:\s*[\w\.\-]+@[\w\.\-]+\n?/gi, '')
    .replace(/Price Band ID:\s*\d+\n?/gi, '')
    .replace(/Priority:\s*\n?/gi, '')
    .replace(/Credit Position:.*?\n?/gi, '')
    .replace(/Account Balance:.*?\n?/gi, '')
    .replace(/Document Date:.*?\n?/gi, '')
    .replace(/Requested Delivery Date:.*?\n?/gi, '')
    .replace(/Entered By:.*?\n?/gi, '')
    .replace(/Checked By:.*?\n?/gi, '')
    // 移除地址相關內容
    .replace(/\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/g, '') // 英國郵編
    .replace(/\bPL\d+\s+\d[A-Z]{2}\b/g, '') // 特定郵編格式
    .replace(/\bWF\d+\s+\d[A-Z]{2}\b/g, '') // WF 郵編
    .replace(/\bHP\d+\s+\d[A-Z]{2}\b/g, '') // HP 郵編
    .replace(/\bSL\d+\s+\d[A-Z]{2}\b/g, '') // SL 郵編
    // 移除常見的無關詞組
    .replace(/Invoice To:/gi, '')
    .replace(/Delivery Address:/gi, '')
    .replace(/Pallet Information/gi, '')
    .replace(/Driver/gi, '')
    .replace(/Number of Pallets/gi, '')
    .replace(/Pallet Spaces/gi, '')
    .replace(/Weight/gi, '')
    .replace(/Pack/gi, '')
    .replace(/Booked In/gi, '')
    .replace(/Site Tel No:/gi, '')
    .trim();
  
  console.log(`[PDF Preprocessing] Processed text length: ${processedText.length} chars`);
  console.log(`[PDF Preprocessing] Reduction: ${((rawText.length - processedText.length) / rawText.length * 100).toFixed(1)}%`);
  
  return processedText;
}

// 🔥 輔助函數：智能提取產品行
function extractProductLines(text: string): string[] {
  const lines = text.split('\n');
  const productLines: string[] = [];
  
  // 常見產品代碼模式
  const productCodePatterns = [
    /^[A-Z]{1,4}\d+[A-Z]*\d*/, // 如 ME6045150, S3027D, MSU120120
    /^[A-Z]+\d+/, // 如 LOFT01, Trans
    /^\d+[A-Z]*/, // 如 5072
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳過空行和標題行
    if (!trimmedLine || 
        trimmedLine.includes('Item Code') ||
        trimmedLine.includes('Description') ||
        trimmedLine.includes('Pack Size') ||
        trimmedLine.includes('Weight (Kg)') ||
        trimmedLine.includes('Unit Price') ||
        trimmedLine.includes('Qty Req') ||
        trimmedLine.includes('Picked by') ||
        trimmedLine.includes('Qty Picked') ||
        trimmedLine.includes('Qty Loaded')) {
      continue;
    }
    
    // 檢查是否為產品行
    const isProductLine = productCodePatterns.some(pattern => pattern.test(trimmedLine));
    
    if (isProductLine) {
      // 進一步清理產品行
      const cleanedLine = trimmedLine
        .replace(/\s{2,}/g, ' ') // 移除多餘空格
        .replace(/^\s+|\s+$/g, ''); // 移除首尾空格
      
      if (cleanedLine.length > 3) { // 確保不是太短的行
        productLines.push(cleanedLine);
      }
    }
  }
  
  console.log(`[PDF Preprocessing] Extracted ${productLines.length} product lines`);
  return productLines;
}

// 定義訂單數據接口（優化版 - 添加 token 欄位）
interface OrderData {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
  uploaded_by: number;
  token?: number; // 🔥 新增 token 欄位
}

// 計算每個訂單記錄的 token 分配
function calculateTokenPerRecord(totalTokens: number, recordCount: number): number {
  if (recordCount === 0) return 0;
  return Math.ceil(totalTokens / recordCount);
}

// GET 方法：清理緩存和獲取緩存狀態
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'clear-cache') {
      const beforeSize = fileCache.size;
      fileCache.clear();
      console.log(`[PDF Analysis] Cache cleared: ${beforeSize} entries removed`);
      
      return NextResponse.json({
        success: true,
        message: `Cache cleared successfully. ${beforeSize} entries removed.`,
        cacheSize: fileCache.size
      });
    }
    
    if (action === 'cache-status') {
      cleanExpiredCache();
      const cacheEntries = Array.from(fileCache.entries()).map(([hash, value]) => ({
        hash: hash.substring(0, 8) + '...',
        age: Math.round((Date.now() - value.timestamp) / 1000 / 60), // 分鐘
        recordCount: value.data.orderData?.length || 0
      }));
      
      return NextResponse.json({
        success: true,
        cacheSize: fileCache.size,
        entries: cacheEntries,
        expiryMinutes: CACHE_EXPIRY / 1000 / 60
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'PDF Analysis API is running',
      availableActions: ['clear-cache', 'cache-status']
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF Analysis] Starting PDF analysis request');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const saveToStorage = formData.get('saveToStorage') as string;
    
    // 基本驗證
    if (!file || !uploadedBy) {
      return NextResponse.json({ 
        error: !file ? 'No file provided' : 'No uploadedBy provided' 
      }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Only PDF files are allowed.` 
      }, { status: 400 });
    }
    
    console.log(`[PDF Analysis] Processing: ${file.name} (${file.size} bytes)`);
    
    // 轉換文件為 Buffer 並生成哈希值
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const fileHash = generateFileHash(pdfBuffer);
    
    // 🔥 檢查緩存，避免重複處理
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult) {
      console.log(`[PDF Analysis] Cache hit: ${fileHash.substring(0, 8)}... (${cachedResult.orderData?.length || 0} records)`);
      
      // 如果需要保存到存儲，仍然執行存儲操作
      let storageInfo = null;
      if (saveToStorage === 'true') {
        try {
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
          
          if (!uploadError) {
            const { data: urlData } = supabaseAdmin.storage
              .from('orderpdf')
              .getPublicUrl(uploadData.path);
            
            storageInfo = {
              path: uploadData.path,
              publicUrl: urlData.publicUrl,
              bucket: 'orderpdf'
            };
          }
        } catch (storageError) {
          console.warn('[PDF Analysis] Storage operation failed');
        }
      }
      
      // 重新插入數據庫（因為 uploaded_by 可能不同）
      if (cachedResult.orderData && cachedResult.orderData.length > 0) {
        try {
          const supabaseAdmin = createSupabaseAdmin();
          
          // 🔥 計算每個記錄的 token 分配（使用緩存的 usage 資訊）
          const totalTokens = cachedResult.usage?.total_tokens || 0;
          const tokenPerRecord = calculateTokenPerRecord(totalTokens, cachedResult.orderData.length);
          
          const insertData = cachedResult.orderData.map((order: any) => ({
            ...order,
            uploaded_by: parseInt(uploadedBy),
            token: tokenPerRecord // 🔥 添加 token 消耗記錄
          }));
          
          const { data: insertResults, error: insertError } = await supabaseAdmin
            .from('data_order')
            .insert(insertData)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`[PDF Analysis] Cached data inserted: ${insertResults.length} records, ${tokenPerRecord} tokens per record`);
          
          // 🔥 檢查是否有需要插入到 record_aco 的 product_code（快取版本）
          const acoRecords = insertResults.filter(record => 
            ACO_PRODUCT_CODES.includes(record.product_code)
          );
          
          let acoInsertResults = null;
          if (acoRecords.length > 0) {
            try {
              const acoInsertData = acoRecords.map(record => ({
                order_ref: record.order_ref,
                code: record.product_code,
                required_qty: record.product_qty,
                remain_qty: record.product_qty
                // latest_update 欄位留空，由 Supabase 預填
              }));
              
              const { data: acoResults, error: acoError } = await supabaseAdmin
                .from('record_aco')
                .insert(acoInsertData)
                .select();
              
              if (acoError) {
                console.error('[PDF Analysis] ACO insertion failed (cached):', acoError.message);
              } else {
                acoInsertResults = acoResults;
                console.log(`[PDF Analysis] Successfully inserted ${acoResults.length} ACO records (cached)`);
              }
            } catch (acoError: any) {
              console.error('[PDF Analysis] ACO insertion error (cached):', acoError.message);
            }
          }
          
          // 🔥 發送訂單創建郵件通知（快取版本）
          let emailResult = null;
          try {
            console.log('[PDF Analysis] Sending order created email notification (cached)...');
            
            const emailRequestBody = {
              orderData: insertResults.map(record => ({
                order_ref: record.order_ref,
                product_code: record.product_code,
                product_desc: record.product_desc,
                product_qty: record.product_qty
              })),
              from: 'ordercreated@pennine.cc',
              pdfAttachment: {
                filename: file.name,
                content: pdfBuffer.toString('base64')
              }
            };
            
            console.log('[PDF Analysis] Email request body:', JSON.stringify(emailRequestBody, null, 2));
            
            // Call our new API route to send email
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-order-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailRequestBody)
            });
            
            const emailData = emailResponse.ok ? await emailResponse.json() : null;
            const emailError = !emailResponse.ok ? new Error(`HTTP ${emailResponse.status}`) : null;

            if (emailError) {
              console.error('[PDF Analysis] Error sending order created email (cached):', emailError);
              console.error('[PDF Analysis] Full error object:', JSON.stringify(emailError, null, 2));
              emailResult = {
                success: false,
                error: emailError.message
              };
            } else {
              console.log('[PDF Analysis] Order created email sent successfully (cached):', emailData);
              emailResult = {
                success: true,
                message: emailData.message,
                emailId: emailData.emailId,
                recipients: emailData.recipients
              };
            }
            
          } catch (emailError: any) {
            console.error('[PDF Analysis] Error invoking email function (cached):', emailError);
            console.error('[PDF Analysis] Full error details:', emailError);
            emailResult = {
              success: false,
              error: `Email service error: ${emailError.message}`
            };
          }
          
          return NextResponse.json({
            success: true,
            message: `Successfully processed PDF (cached) and inserted ${insertResults.length} records${acoInsertResults ? ` and ${acoInsertResults.length} ACO records` : ''}`,
            recordCount: insertResults.length,
            extractedData: cachedResult.orderData, // 🔥 返回緩存的數據
            insertedRecords: insertResults,
            acoRecords: acoInsertResults, // 🔥 返回 ACO 插入結果
            emailNotification: emailResult, // 🔥 返回郵件發送結果
            storageInfo: storageInfo,
            cached: true,
            usage: cachedResult.usage,
            tokenPerRecord: tokenPerRecord // 🔥 返回每個記錄的 token 消耗
          });
          
        } catch (insertError: any) {
          console.error('[PDF Analysis] Database insertion failed:', insertError.message);
          return NextResponse.json({ 
            error: 'Database insertion failed',
            details: insertError.message
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({
          success: true,
          message: 'PDF processed (cached) but no valid records found',
          recordCount: 0,
          storageInfo: storageInfo,
          cached: true
        });
      }
    }
    
    // 可選：保存文件到 Storage（簡化版）
    let storageInfo = null;
    if (saveToStorage === 'true') {
      try {
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
        
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from('orderpdf')
            .getPublicUrl(uploadData.path);
          
          storageInfo = {
            path: uploadData.path,
            publicUrl: urlData.publicUrl,
            bucket: 'orderpdf'
          };
          console.log('[PDF Analysis] File saved to storage');
        }
      } catch (storageError) {
        console.warn('[PDF Analysis] Storage operation failed');
      }
    }
    
    // PDF 文本提取
    let extractedText: string;
    let rawText: string; // 🔥 聲明 rawText 變數在更廣的作用域
    let textReductionPercentage: string = '0'; // 🔥 文本減少百分比
    
    try {
      rawText = await extractTextFromPDF(pdfBuffer);
      console.log(`[PDF Analysis] Raw text extracted: ${rawText.length} chars`);
      
      // 🔥 應用策略 2：智能文本預處理
      extractedText = preprocessPdfText(rawText);
      textReductionPercentage = ((rawText.length - extractedText.length) / rawText.length * 100).toFixed(1);
      console.log(`[PDF Analysis] Preprocessed text: ${extractedText.length} chars (${textReductionPercentage}% reduction)`);
    } catch (textError: any) {
      console.error('[PDF Analysis] Text extraction failed:', textError.message);
      return NextResponse.json({ 
        error: 'PDF text extraction failed',
        details: textError.message
      }, { status: 500 });
    }
    
    // 讀取 OpenAI prompt 文件
    let prompt = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const promptPath = path.join(process.cwd(), 'docs', 'openAI_pdf_prompt');
      prompt = fs.readFileSync(promptPath, 'utf8');
      console.log('[PDF Analysis] Prompt loaded from file');
    } catch (promptError: any) {
      console.error('[PDF Analysis] Failed to read prompt file:', promptError.message);
      return NextResponse.json({ 
        error: 'Failed to load prompt file',
        details: promptError.message
      }, { status: 500 });
    }
    
    // 🔥 傳送完整文本內容
    const messageContent = `${prompt}\n\n**DOCUMENT TEXT:**\n${extractedText}`;
    
    console.log('[PDF Analysis] Sending to OpenAI');
    
    // 發送到 OpenAI API（優化版）
    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only data extraction bot. Return ONLY valid JSON arrays. No explanations or markdown."
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 2000, // 🔥 減少 max_tokens 節省成本
      temperature: 0.1
    });
    
    const extractedContent = response.choices[0]?.message?.content;
    if (!extractedContent) {
      return NextResponse.json({ error: 'No content extracted from OpenAI' }, { status: 500 });
    }
    
    console.log(`[PDF Analysis] OpenAI response: ${extractedContent.length} chars, tokens: ${response.usage?.total_tokens || 'unknown'}`);
    
    // 解析 OpenAI 回應（簡化版）
    let orderData: OrderData[];
    try {
      let cleanContent = extractedContent.trim()
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\uFEFF/, '');
      
      orderData = JSON.parse(cleanContent);
      
      if (!Array.isArray(orderData)) {
        throw new Error('Response is not an array');
      }
      
      console.log(`[PDF Analysis] Parsed ${orderData.length} records`);
      
    } catch (parseError: any) {
      console.error('[PDF Analysis] Parse error:', parseError.message);
      return NextResponse.json({ 
        error: 'Failed to parse OpenAI response',
        details: parseError.message
      }, { status: 500 });
    }
    
    // 🔥 緩存結果（包含預處理資訊）
    setCachedResult(fileHash, {
      orderData,
      usage: response.usage,
      originalTextLength: rawText.length, // 🔥 記錄原始文本長度
      processedTextLength: extractedText.length, // 🔥 記錄預處理後文本長度
      textReduction: textReductionPercentage // 🔥 記錄文本減少百分比
    });
    
    // 數據庫插入（優化版 - 添加 token 記錄）
    if (orderData.length > 0) {
      try {
        const supabaseAdmin = createSupabaseAdmin();
        
        // 🔥 計算每個記錄的 token 分配
        const totalTokens = response.usage?.total_tokens || 0;
        const tokenPerRecord = calculateTokenPerRecord(totalTokens, orderData.length);
        
        const insertData = orderData.map(order => ({
          ...order,
          uploaded_by: parseInt(uploadedBy),
          token: tokenPerRecord // 🔥 添加 token 消耗記錄
        }));
        
        const { data: insertResults, error: insertError } = await supabaseAdmin
          .from('data_order')
          .insert(insertData)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log(`[PDF Analysis] Successfully inserted ${insertResults.length} records, ${tokenPerRecord} tokens per record, total: ${totalTokens} tokens`);
        
        // 🔥 檢查是否有需要插入到 record_aco 的 product_code
        const acoRecords = insertResults.filter(record => 
          ACO_PRODUCT_CODES.includes(record.product_code)
        );
        
        let acoInsertResults = null;
        if (acoRecords.length > 0) {
          try {
            const acoInsertData = acoRecords.map(record => ({
              order_ref: record.order_ref,
              code: record.product_code,
              required_qty: record.product_qty,
              remain_qty: record.product_qty
              // latest_update 欄位留空，由 Supabase 預填
            }));
            
            const { data: acoResults, error: acoError } = await supabaseAdmin
              .from('record_aco')
              .insert(acoInsertData)
              .select();
            
            if (acoError) {
              console.error('[PDF Analysis] ACO insertion failed:', acoError.message);
            } else {
              acoInsertResults = acoResults;
              console.log(`[PDF Analysis] Successfully inserted ${acoResults.length} ACO records`);
            }
          } catch (acoError: any) {
            console.error('[PDF Analysis] ACO insertion error:', acoError.message);
          }
        }
        
        // 🔥 發送訂單創建郵件通知
        let emailResult = null;
        try {
          console.log('[PDF Analysis] Sending order created email notification...');
          
          const emailRequestBody = {
            orderData: insertResults.map(record => ({
              order_ref: record.order_ref,
              product_code: record.product_code,
              product_desc: record.product_desc,
              product_qty: record.product_qty
            })),
            from: 'ordercreated@pennine.cc',
            pdfAttachment: {
              filename: file.name,
              content: pdfBuffer.toString('base64')
            }
          };
          
                     console.log('[PDF Analysis] Email request body:', JSON.stringify(emailRequestBody, null, 2));
           
           // Call our new API route to send email
           const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-order-email`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify(emailRequestBody)
           });
           
           const emailData = emailResponse.ok ? await emailResponse.json() : null;
           const emailError = !emailResponse.ok ? new Error(`HTTP ${emailResponse.status}`) : null;

          if (emailError) {
            console.error('[PDF Analysis] Error sending order created email:', emailError);
            console.error('[PDF Analysis] Full error object:', JSON.stringify(emailError, null, 2));
            emailResult = {
              success: false,
              error: emailError.message
            };
          } else {
            console.log('[PDF Analysis] Order created email sent successfully:', emailData);
            emailResult = {
              success: true,
              message: emailData.message,
              emailId: emailData.emailId,
              recipients: emailData.recipients
            };
          }
          
        } catch (emailError: any) {
          console.error('[PDF Analysis] Error invoking email function:', emailError);
          console.error('[PDF Analysis] Full error details:', emailError);
          emailResult = {
            success: false,
            error: `Email service error: ${emailError.message}`
          };
        }
        
        return NextResponse.json({
          success: true,
          message: `Successfully processed PDF and inserted ${insertResults.length} records${acoInsertResults ? ` and ${acoInsertResults.length} ACO records` : ''}`,
          recordCount: insertResults.length,
          extractedData: orderData, // 🔥 返回提取的數據
          insertedRecords: insertResults,
          acoRecords: acoInsertResults, // 🔥 返回 ACO 插入結果
          emailNotification: emailResult, // 🔥 返回郵件發送結果
          storageInfo: storageInfo,
          cached: false,
          usage: response.usage, // 🔥 返回 token 使用情況
          tokenPerRecord: tokenPerRecord, // 🔥 返回每個記錄的 token 消耗
          totalTokensUsed: totalTokens, // 🔥 返回總 token 消耗
          textProcessing: { // 🔥 新增文本預處理統計
            originalLength: rawText.length,
            processedLength: extractedText.length,
            reductionPercentage: textReductionPercentage,
            tokensSaved: Math.round((rawText.length - extractedText.length) / 4) // 估算節省的 tokens (約 4 字符 = 1 token)
          }
        });
        
      } catch (insertError: any) {
        console.error('[PDF Analysis] Database insertion failed:', insertError.message);
        return NextResponse.json({ 
          error: 'Database insertion failed',
          details: insertError.message
        }, { status: 500 });
      }
    } else {
      console.log('[PDF Analysis] No records to insert');
      return NextResponse.json({
        success: true,
        message: 'PDF processed but no valid records found',
        recordCount: 0,
        storageInfo: storageInfo,
        cached: false,
        usage: response.usage, // 🔥 即使沒有記錄也返回 token 使用情況
        totalTokensUsed: response.usage?.total_tokens || 0,
        textProcessing: { // 🔥 新增文本預處理統計
          originalLength: rawText.length,
          processedLength: extractedText.length,
          reductionPercentage: textReductionPercentage,
          tokensSaved: Math.round((rawText.length - extractedText.length) / 4) // 估算節省的 tokens
        }
      });
    }
    
  } catch (error: any) {
    console.error('[PDF Analysis] System error:', error.message);
    return NextResponse.json({ 
      error: 'System error',
      details: error.message
    }, { status: 500 });
  }
} 