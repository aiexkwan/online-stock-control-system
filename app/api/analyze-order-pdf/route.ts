'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import crypto from 'crypto';

// 簡單的內存緩存（生產環境建議使用 Redis）
const fileCache = new Map<string, any>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分鐘

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

// 定義訂單數據接口（簡化版）
interface OrderData {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
  uploaded_by: number;
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
          const insertData = cachedResult.orderData.map((order: any) => ({
            ...order,
            uploaded_by: parseInt(uploadedBy)
          }));
          
          const { data: insertResults, error: insertError } = await supabaseAdmin
            .from('data_order')
            .insert(insertData)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`[PDF Analysis] Cached data inserted: ${insertResults.length} records`);
          
          return NextResponse.json({
            success: true,
            message: `Successfully processed PDF (cached) and inserted ${insertResults.length} records`,
            recordCount: insertResults.length,
            extractedData: cachedResult.orderData, // 🔥 返回緩存的數據
            insertedRecords: insertResults,
            storageInfo: storageInfo,
            cached: true,
            usage: cachedResult.usage
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
    try {
      extractedText = await extractTextFromPDF(pdfBuffer);
      console.log(`[PDF Analysis] Text extracted: ${extractedText.length} chars`);
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
    
    // 🔥 緩存結果
    setCachedResult(fileHash, {
      orderData,
      usage: response.usage
    });
    
    // 數據庫插入（優化版）
    if (orderData.length > 0) {
      try {
        const supabaseAdmin = createSupabaseAdmin();
        const insertData = orderData.map(order => ({
          ...order,
          uploaded_by: parseInt(uploadedBy)
        }));
        
        const { data: insertResults, error: insertError } = await supabaseAdmin
          .from('data_order')
          .insert(insertData)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log(`[PDF Analysis] Successfully inserted ${insertResults.length} records`);
        
        return NextResponse.json({
          success: true,
          message: `Successfully processed PDF and inserted ${insertResults.length} records`,
          recordCount: insertResults.length,
          extractedData: orderData, // 🔥 返回提取的數據
          insertedRecords: insertResults,
          storageInfo: storageInfo,
          cached: false,
          usage: response.usage // 🔥 返回 token 使用情況
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
        cached: false
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