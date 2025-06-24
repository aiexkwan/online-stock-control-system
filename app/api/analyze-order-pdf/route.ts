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
  const orderRefMatch = rawText.match(/\b\d{6,10}\b/);
  const orderRef = orderRefMatch ? orderRefMatch[0] : '';
  
  // 1.1 提取 Account No (可能包含字母和數字)
  // 改進：支持字母數字組合
  const accountMatch = rawText.match(/Account\s*No\.?:?\s*([A-Z0-9]+)/i);
  const accountNum = accountMatch ? accountMatch[1] : '';
  console.log(`[PDF Preprocessing] Account No found: ${accountNum}`);
  
  // 1.2 提取 Delivery Address
  let deliveryAdd = '';
  // 改進：更精確的地址匹配
  const deliveryAddMatch = rawText.match(/Delivery\s*Address:?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|\n\s*\n))/i);
  if (deliveryAddMatch) {
    const rawAddress = deliveryAddMatch[1].trim();
    console.log(`[PDF Preprocessing] Raw delivery address match:`, rawAddress);
    
    // 清理地址，保留郵政編碼
    deliveryAdd = rawAddress
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 過濾空行和標題
        if (!line) return false;
        if (line.match(/^(Delivery Address:?|Invoice To:?|Tel:?|Email:?)$/i)) return false;
        // 保留含有郵政編碼的行
        return true;
      })
      .join(', ');
  } else {
    console.log(`[PDF Preprocessing] No delivery address match found`);
  }
  
  // 2. 定位產品表格區域的關鍵標識
  const tableStartMarkers = [
    'Item Code',
    'Product Code', 
    'Code',
    'Description',
    'Qty Req',
    'Pack Size',
    'Weight'
  ];
  
  const tableEndMarkers = [
    'Total Weight Of Order',
    'Total Number Of Pages',
    'Notes:',
    'Nett',
    'VAT',
    'TOTAL',
    'Parcel 1',
    'Parcel 2'
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
    coreContent += `Order Reference: ${orderRef}\n`;
  }
  
  // 添加 Account No
  if (accountNum) {
    coreContent += `Account No: ${accountNum}\n`;
  } else {
    // 即使沒有帳號也要加上標籤
    coreContent += `Account No: \n`;
  }
  
  // 添加 Delivery Address
  if (deliveryAdd) {
    coreContent += `Delivery Address: ${deliveryAdd}\n`;
  } else {
    // 即使沒有地址也要加上標籤，讓 OpenAI 知道要填充這個欄位
    coreContent += `Delivery Address: \n`;
  }
  
  coreContent += '\n';
  
  // 添加表格內容並進行智能過濾
  if (tableStart !== -1) {
    const tableContent = rawText.substring(tableStart, tableEnd);
    
    // 🔥 改進的產品行識別和過濾
    const processedLines = extractAndProcessProductLines(tableContent);
    if (processedLines.length > 0) {
      coreContent += `Product Table:\n${processedLines.join('\n')}`;
    } else {
      // 備用：使用原始表格內容但保留基本格式
      coreContent += `Product Table:\n${tableContent}`;
    }
  } else {
    // 如果找不到表格標識，嘗試直接識別產品行
    console.log('[PDF Preprocessing] Table markers not found, attempting direct product line extraction');
    const processedLines = extractAndProcessProductLines(rawText);
    if (processedLines.length > 0) {
      coreContent += `Order Reference: ${orderRef}\n\nProduct Table:\n${processedLines.join('\n')}`;
    } else {
      // 最後備用策略：使用原始文本
      coreContent = rawText;
    }
  }
  
  // 6. 輕度清理文本（保留重要的格式）
  let processedText = coreContent
    // 移除多餘的空行（但保留單個換行）
    .replace(/\n{3,}/g, '\n\n')
    // 移除常見的無關內容
    .replace(/Tel:\s*\d+[\d\s\-\+\(\)]*\n?/gi, '')
    .replace(/Email:\s*[\w\.\-]+@[\w\.\-]+\n?/gi, '')
    .replace(/Price Band ID:\s*\d+\n?/gi, '')
    .replace(/Credit Position:.*?\n?/gi, '')
    .replace(/Account Balance:.*?\n?/gi, '')
    .replace(/Document Date:.*?\n?/gi, '')
    .replace(/Requested Delivery Date:.*?\n?/gi, '')
    .replace(/Entered By:.*?\n?/gi, '')
    .replace(/Checked By:.*?\n?/gi, '')
    // 移除地址相關內容（更精確的模式）
    // .replace(/\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b(?!\s*\d)/g, '') // 暫時註釋掉，避免移除郵編
    // 移除頁首頁尾
    .replace(/Invoice To:/gi, '')
    // 不要移除 Delivery Address: 標識，因為需要用來提取地址
    // .replace(/Delivery Address:/gi, '')
    .replace(/Pallet Information/gi, '')
    .replace(/Site Tel No:.*?\n?/gi, '')
    .trim();
  
  console.log(`[PDF Preprocessing] Processed text length: ${processedText.length} chars`);
  console.log(`[PDF Preprocessing] Reduction: ${((rawText.length - processedText.length) / rawText.length * 100).toFixed(1)}%`);
  console.log(`[PDF Preprocessing] Extracted Account No:`, accountNum);
  console.log(`[PDF Preprocessing] Extracted Delivery Address:`, deliveryAdd);
  
  // Debug: 顯示前 500 個字符
  console.log(`[PDF Preprocessing] First 500 chars of processed text:`, processedText.substring(0, 500));
  
  return processedText;
}

// 🔥 改進的輔助函數：智能提取和處理產品行
function extractAndProcessProductLines(text: string): string[] {
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let currentProduct: { code?: string; packSize?: string; desc?: string; weight?: string; price?: string; qty?: string } = {};
  let isInProductSection = false;
  
  // 常見產品代碼模式
  const productCodePatterns = [
    /^[A-Z]{1,4}\d+[A-Z]*\d*/, // 如 ME6045150, S3027D, MSU120120
    /^[A-Z]+\d+/, // 如 LOFT01, D1001
    /^\d{4}[A-Z]*/, // 如 5072
    /^Trans$/i, // Transport Charge
    /^NS$/i, // Non-stock
  ];
  
  // 電話號碼模式（用於過濾）
  const phonePattern = /^\d{5,}\s+\d{3,}\s+\d{3,}/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳過空行
    if (!line) continue;
    
    // 跳過電話號碼行
    if (phonePattern.test(line)) continue;
    
    // 跳過標題行
    if (line.includes('Item Code') || 
        line.includes('Description') || 
        line.includes('Pack Size') ||
        line.includes('Qty Req') ||
        line.includes('Weight (Kg)') ||
        line.includes('Unit Price') ||
        line === 'Loaded' ||
        line === 'Picked' ||
        line.includes('Pallet Qty')) {
      isInProductSection = true; // 標記已進入產品區域
      continue;
    }
    
    // 檢查是否為產品代碼行
    const firstWord = line.split(/\s+/)[0];
    const isProductCode = productCodePatterns.some(pattern => pattern.test(firstWord));
    
    if (isProductCode && isInProductSection) {
      // 如果之前有產品，先保存
      if (currentProduct.code) {
        const productLine = formatProductLine(currentProduct);
        if (productLine) processedLines.push(productLine);
      }
      
      // 開始新產品
      currentProduct = {};
      
      // 解析產品行
      const parts = line.split(/\s+/);
      currentProduct.code = parts[0];
      
      // 嘗試識別 Pack Size（通常是產品代碼後的數字）
      let descStartIndex = 1;
      if (parts.length > 1 && /^\d+$/.test(parts[1]) && parseInt(parts[1]) < 100) {
        currentProduct.packSize = parts[1];
        descStartIndex = 2;
      }
      
      // 提取描述（直到遇到數字）
      let descParts = [];
      let j = descStartIndex;
      while (j < parts.length && !/^\d+\.?\d*$/.test(parts[j])) {
        descParts.push(parts[j]);
        j++;
      }
      currentProduct.desc = descParts.join(' ');
      
      // 剩餘的數字可能是 weight, price, qty
      const numbers = parts.slice(j).filter(p => /^\d+\.?\d*$/.test(p));
      if (numbers.length > 0) {
        // 最後一個通常是數量
        currentProduct.qty = numbers[numbers.length - 1];
        // 倒數第二個可能是價格
        if (numbers.length > 1) {
          currentProduct.price = numbers[numbers.length - 2];
        }
        // 倒數第三個可能是重量
        if (numbers.length > 2) {
          currentProduct.weight = numbers[numbers.length - 3];
        }
      }
    } else if (currentProduct.code && !isProductCode) {
      // 可能是產品描述的延續行
      if (!line.includes('per pallet') && 
          !line.includes('dimensions') && 
          !line.includes('stack') &&
          !line.includes('limited stock')) {
        // 合併到當前產品描述
        currentProduct.desc = (currentProduct.desc || '') + ' ' + line;
      }
    }
  }
  
  // 保存最後一個產品
  if (currentProduct.code) {
    const productLine = formatProductLine(currentProduct);
    if (productLine) processedLines.push(productLine);
  }
  
  console.log(`[PDF Preprocessing] Processed ${processedLines.length} product lines`);
  return processedLines;
}

// 格式化產品行
function formatProductLine(product: any): string {
  if (!product.code) return '';
  
  // 構建格式化的產品行，使用 | 分隔
  const parts = [
    product.code,
    product.packSize || '1',
    product.desc || '',
    product.weight || '0',
    product.price || '0.00',
    product.qty || '1'
  ];
  
  return parts.join(' | ');
}

// 定義訂單數據接口（優化版 - 添加 token 欄位）
interface OrderData {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
  uploaded_by: number;
  token?: number; // 🔥 新增 token 欄位
  delivery_add?: string; // 🔥 新增 delivery_add 欄位
  account_num?: string; // 🔥 新增 account_num 欄位
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
    console.error('[PDF Analysis] GET request error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF Analysis] Starting PDF analysis request');
    
    // 修改為支持兩種請求格式
    let pdfUrl: string | undefined;
    let fileName: string | undefined;
    let uploadedBy: string | undefined;
    let pdfBuffer: Buffer | undefined;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // 新格式：接收 JSON 包含 pdfUrl
      const body = await request.json();
      pdfUrl = body.pdfUrl;
      fileName = body.fileName;
      uploadedBy = body.uploadedBy || body.orderNumber;
      
      console.log('[PDF Analysis] JSON request received:', { pdfUrl, fileName, uploadedBy });
      
      if (!pdfUrl || !fileName || !uploadedBy) {
        return NextResponse.json({ 
          error: 'Missing required fields: pdfUrl, fileName, or uploadedBy' 
        }, { status: 400 });
      }
      
      // 下載 PDF
      console.log('[PDF Analysis] Downloading PDF from URL:', pdfUrl);
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
      
      const arrayBuffer = await pdfResponse.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log('[PDF Analysis] PDF downloaded, size:', pdfBuffer.length, 'bytes');
      
      fileName = body.fileName;
      pdfBuffer = Buffer.from(new Uint8Array(0)); // 暫時空 buffer
    } else {
      return NextResponse.json({ 
        error: 'Invalid content type. Expected application/json' 
      }, { status: 400 });
    }
    
    // 如果沒有 fileName，使用預設值
    if (!fileName && pdfUrl) {
      fileName = pdfUrl.split('/').pop() || 'unknown.pdf';
    }
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
            order_ref: String(order.order_ref), // 轉換為 text
            product_code: order.product_code,
            product_desc: order.product_desc,
            product_qty: String(order.product_qty), // 轉換為 text
            uploaded_by: String(uploadedBy), // 轉換為 text
            delivery_add: order.delivery_add || '-', // 🔥 添加 delivery_add，預設值 '-'
            account_num: order.account_num || '-' // 🔥 添加 account_num，預設值 '-'
          }));
          
          const { data: insertResults, error: insertError } = await supabaseAdmin
            .from('data_order')
            .insert(insertData)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`[PDF Analysis] Cached data inserted: ${insertResults.length} records, ${tokenPerRecord} tokens per record`);
          
          // 🔥 更新 doc_upload 表的 json 欄位（快取版本）
          try {
            console.log('[PDF Analysis] Updating doc_upload json field (cached)...');
            
            // 查找最近上傳的對應文件記錄
            console.log('[PDF Analysis] Looking for doc_upload record (cached):', {
              doc_name: fileName,
              upload_by: uploadedBy,
              doc_type: 'order'
            });
            
            const { data: docRecord, error: findError } = await supabaseAdmin
              .from('doc_upload')
              .select('uuid')
              .eq('doc_name', fileName)
              .eq('upload_by', uploadedBy) // 不需要 parseInt，因為是 text 類型
              .eq('doc_type', 'order')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (docRecord && !findError) {
              const { error: updateError } = await supabaseAdmin
                .from('doc_upload')
                .update({
                  json: cachedResult.extractedText, // 儲存智能預處理後的文本（從緩存）
                  token: totalTokens // 🔥 更新 token 欄位
                })
                .eq('uuid', docRecord.uuid);
              
              if (updateError) {
                console.error('[PDF Analysis] Failed to update doc_upload json field (cached):', updateError);
              } else {
                console.log('[PDF Analysis] Successfully updated doc_upload json field (cached)');
              }
            } else {
              console.error('[PDF Analysis] Could not find doc_upload record (cached):', findError);
            }
          } catch (updateError: any) {
            console.error('[PDF Analysis] Error updating doc_upload (cached):', updateError);
            // 不影響主要流程
          }
          
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
          
          // 🔥 發送訂單創建郵件通知（快取版本）- 使用內部服務
          let emailResult = null;
          try {
            console.log('[PDF Analysis] Sending order created email notification (cached)...');
            
            // 使用內部郵件服務，完全繞過中間件和API路由問題
            const { sendOrderCreatedEmail } = await import('../../services/emailService');
            
            const emailRequestBody = {
              orderData: insertResults.map(record => ({
                order_ref: record.order_ref,
                product_code: record.product_code,
                product_desc: record.product_desc,
                product_qty: record.product_qty
              })),
              from: 'ordercreated@pennine.cc',
              pdfAttachment: {
                filename: fileName || 'order.pdf',
                content: pdfBuffer.toString('base64')
              }
            };
            
            console.log('[PDF Analysis] Calling internal email service (cached)...');
            
            const emailData = await sendOrderCreatedEmail(emailRequestBody);
            
            console.log('[PDF Analysis] Order created email sent successfully (cached):', emailData);
            emailResult = {
              success: true,
              message: emailData.message,
              emailId: emailData.emailId,
              recipients: emailData.recipients
            };
            
            // doc_upload 記錄已在 upload-file API 中寫入，這裡不需要重複寫入（緩存版本）
            
          } catch (emailError: any) {
            console.error('[PDF Analysis] Error sending order created email (cached):', emailError);
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
            extractedText: cachedResult.extractedText || '', // 🔥 返回緩存的原始文本
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
    
    // 當使用 JSON 請求時，文件已經在 storage 中
    let storageInfo = null;
    if (pdfUrl) {
      storageInfo = {
        publicUrl: pdfUrl,
        bucket: 'documents'
      };
    }
    
    // PDF 文本提取
    let extractedText: string;
    let rawText: string; // 🔥 聲明 rawText 變數在更廣的作用域
    let textReductionPercentage: string = '0'; // 🔥 文本減少百分比
    
    try {
      rawText = await extractTextFromPDF(pdfBuffer);
      console.log(`[PDF Analysis] Raw text extracted: ${rawText.length} chars`);
      
      // 🔥 啟用預處理以提高準確性
      const USE_PREPROCESSING = true; // 可以輕易切換
      
      if (USE_PREPROCESSING) {
        // 應用策略 2：智能文本預處理
        extractedText = preprocessPdfText(rawText);
        textReductionPercentage = ((rawText.length - extractedText.length) / rawText.length * 100).toFixed(1);
        console.log(`[PDF Analysis] Preprocessed text: ${extractedText.length} chars (${textReductionPercentage}% reduction)`);
      } else {
        // 直接使用原始文本
        extractedText = rawText;
        textReductionPercentage = '0';
        console.log(`[PDF Analysis] Using raw text without preprocessing`);
      }
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
    console.log('[PDF Analysis] Text being sent to OpenAI (first 1000 chars):', messageContent.substring(0, 1000));
    
    // 發送到 OpenAI API（優化版）
    const openai = createOpenAIClient();
    let response;
    
    try {
      // 首先嘗試使用 GPT-4o
      console.log('[PDF Analysis] Trying GPT-4o model...');
      response = await openai.chat.completions.create({
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
    } catch (error: any) {
      console.error('[PDF Analysis] GPT-4o failed:', error.message);
      
      // 如果 GPT-4o 失敗，嘗試使用 GPT-4-turbo
      console.log('[PDF Analysis] Falling back to GPT-4-turbo model...');
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
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
          max_tokens: 2000,
          temperature: 0.1
        });
      } catch (fallbackError: any) {
        console.error('[PDF Analysis] GPT-4-turbo also failed:', fallbackError.message);
        throw new Error('Both GPT-4o and GPT-4-turbo models failed');
      }
    }
    
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
    
    // 如果沒有數據，顯示 OpenAI 的原始回應
    if (orderData.length === 0) {
      console.log('[PDF Analysis] No records parsed. OpenAI raw response:', extractedContent);
      console.log('[PDF Analysis] Text sent to OpenAI (full):', extractedText);
    }
      
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
      extractedText: extractedText, // 🔥 緩存處理後的文本
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
        
        console.log('[PDF Analysis] Raw orderData:', orderData);
        
        const insertData = orderData.map(order => {
          const record = {
            order_ref: String(order.order_ref), // 轉換為 text
            product_code: order.product_code,
            product_desc: order.product_desc,
            product_qty: String(order.product_qty), // 轉換為 text
            uploaded_by: String(uploadedBy), // 轉換為 text
            // token: tokenPerRecord, // 🔥 token 欄位不存在，移除
            delivery_add: order.delivery_add || '-', // 🔥 添加 delivery_add，預設值 '-'
            account_num: order.account_num || '-' // 🔥 添加 account_num，預設值 '-'
          };
          console.log('[PDF Analysis] Insert record:', record);
          return record;
        });
        
        const { data: insertResults, error: insertError } = await supabaseAdmin
          .from('data_order')
          .insert(insertData)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        console.log(`[PDF Analysis] Successfully inserted ${insertResults.length} records, ${tokenPerRecord} tokens per record, total: ${totalTokens} tokens`);
        
        // 🔥 更新 doc_upload 表的 json 欄位
        try {
          console.log('[PDF Analysis] Updating doc_upload json field...');
          
          // 查找最近上傳的對應文件記錄
          console.log('[PDF Analysis] Looking for doc_upload record:', {
            doc_name: fileName,
            upload_by: uploadedBy,
            doc_type: 'order'
          });
          
          const { data: docRecord, error: findError } = await supabaseAdmin
            .from('doc_upload')
            .select('uuid')
            .eq('doc_name', fileName)
            .eq('upload_by', uploadedBy) // 不需要 parseInt，因為是 text 類型
            .eq('doc_type', 'order')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (docRecord && !findError) {
            const { error: updateError } = await supabaseAdmin
              .from('doc_upload')
              .update({
                json: extractedText, // 儲存智能預處理後的文本
                token: totalTokens // 🔥 更新 token 欄位
              })
              .eq('uuid', docRecord.uuid);
            
            if (updateError) {
              console.error('[PDF Analysis] Failed to update doc_upload json field:', updateError);
            } else {
              console.log('[PDF Analysis] Successfully updated doc_upload json field');
            }
          } else {
            console.error('[PDF Analysis] Could not find doc_upload record:', findError);
          }
        } catch (updateError: any) {
          console.error('[PDF Analysis] Error updating doc_upload:', updateError);
          // 不影響主要流程
        }
        
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
        
        // 🔥 發送訂單創建郵件通知 - 使用內部服務
        let emailResult = null;
        try {
          console.log('[PDF Analysis] Sending order created email notification...');
          
          // 使用內部郵件服務，完全繞過中間件和API路由問題
          const { sendOrderCreatedEmail } = await import('../../services/emailService');
          
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
          
          console.log('[PDF Analysis] Calling internal email service...');
          
          const emailData = await sendOrderCreatedEmail(emailRequestBody);
          
          console.log('[PDF Analysis] Order created email sent successfully:', emailData);
          emailResult = {
            success: true,
            message: emailData.message,
            emailId: emailData.emailId,
            recipients: emailData.recipients
          };
          
          // doc_upload 記錄已在 upload-file API 中寫入，這裡不需要重複寫入
          
        } catch (emailError: any) {
          console.error('[PDF Analysis] Error sending order created email:', emailError);
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
          extractedText: extractedText, // 🔥 返回發送給 OpenAI 的處理後文本
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
    console.error('[PDF Analysis] System error:', error);
    console.error('[PDF Analysis] Error stack:', error.stack);
    console.error('[PDF Analysis] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // 返回更詳細的錯誤信息
    return NextResponse.json({ 
      error: 'System error',
      details: error.message,
      errorType: error.name,
      errorCode: error.code,
      // 在開發環境中包含 stack trace
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }, { status: 500 });
  }
} 