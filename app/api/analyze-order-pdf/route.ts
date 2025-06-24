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
    
    console.log('[PDF Text Extract] Buffer size:', pdfBuffer.length);
    
    const pkg = require('pdf-parse');
    const pdfParse = pkg.default || pkg;
    
    // 添加更多選項以處理不同類型的 PDF
    const options = {
      max: 0, // 不限制頁數
      // 移除 version 設定，因為可能導致問題
    };
    
    const pdfData = await pdfParse(pdfBuffer, options);
    
    console.log('[PDF Text Extract] Pages:', pdfData.numpages);
    console.log('[PDF Text Extract] Text length:', pdfData.text?.length || 0);
    console.log('[PDF Text Extract] PDF info:', pdfData.info);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      // 如果沒有文本，嘗試提取頁面信息
      console.log('[PDF Text Extract] No text found, PDF info:', pdfData.info);
      throw new Error('No readable text found in PDF - might be a scanned image');
    }
    
    const extractedText = pdfData.text.trim();
    console.log('[PDF Text Extract] FULL EXTRACTED TEXT:');
    console.log('=====================================');
    console.log(extractedText);
    console.log('=====================================');
    console.log('[PDF Text Extract] Contains key terms:', {
      hasOrderRef: /\b\d{6,10}\b/.test(extractedText),
      hasAccount: /Account\s*No/i.test(extractedText),
      hasDelivery: /Delivery\s*Address/i.test(extractedText),
      hasProduct: /Product|Item|Code/i.test(extractedText),
      hasNumbers: /\d+/.test(extractedText)
    });
    
    return extractedText;
  } catch (error: any) {
    console.error('[PDF Text Extract] Error:', error.message);
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
  // 改進：支持多種格式
  let accountNum = '';
  const accountPatterns = [
    /Account\s*No\.?:?\s*([A-Z0-9]+)/i,
    /Account\s*Number:?\s*([A-Z0-9]+)/i,
    /Acc\s*No\.?:?\s*([A-Z0-9]+)/i,
    /Customer\s*No\.?:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of accountPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      accountNum = match[1];
      break;
    }
  }
  console.log(`[PDF Preprocessing] Account No found: "${accountNum}"`);
  
  // 1.2 提取 Delivery Address - 改進版
  let deliveryAdd = '';
  const deliveryPatterns = [
    // 標準格式：Delivery Address: 後的內容
    /Delivery\s*Address:?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|Goods\s*to|^\s*$))/i,
    // 備選格式：Deliver To: 或 Ship To:
    /(?:Deliver\s*To|Ship\s*To):?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|^\s*$))/i
  ];
  
  for (const pattern of deliveryPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const rawAddress = match[1].trim();
      console.log(`[PDF Preprocessing] Raw delivery address match:`, rawAddress.substring(0, 200));
      
      // 清理地址，移除不相關的行
      deliveryAdd = rawAddress
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // 過濾空行和標題
          if (!line) return false;
          if (line.match(/^(Delivery Address:?|Invoice To:?|Deliver To:?|Ship To:?|Tel:?|Email:?|Site Tel No:?)$/i)) return false;
          // 過濾純數字行（可能是電話）
          if (line.match(/^\d+$/)) return false;
          // 過濾日期格式
          if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) return false;
          return true;
        })
        .slice(0, 5) // 最多取前5行
        .join(', ');
      
      if (deliveryAdd.length > 10) { // 確保地址有意義的長度
        break;
      }
    }
  }
  
  console.log(`[PDF Preprocessing] Extracted delivery address: "${deliveryAdd}"`);
  
  // 如果仍然沒有找到地址，嘗試查找包含郵政編碼的行
  if (!deliveryAdd) {
    const postcodeMatch = rawText.match(/([A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2})/g);
    if (postcodeMatch) {
      const lines = rawText.split('\n');
      for (const line of lines) {
        if (postcodeMatch.some(postcode => line.includes(postcode))) {
          // 找到包含郵政編碼的行及其前幾行
          const lineIndex = lines.indexOf(line);
          const addressLines = lines.slice(Math.max(0, lineIndex - 3), lineIndex + 1)
            .map(l => l.trim())
            .filter(l => l && !l.match(/^(Tel:|Email:|Date:|Account|Customer)/i));
          
          if (addressLines.length > 0) {
            deliveryAdd = addressLines.join(', ');
            console.log(`[PDF Preprocessing] Found address by postcode: "${deliveryAdd}"`);
            break;
          }
        }
      }
    }
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
    'Parcel 2',
    'Parcel 3',
    'Parcel 4',
    'Parcel 5',
    'Height',
    'Length',
    'Width',
    'Weight',
    'Requested Delivery Date:',
    'Actual Delivery Date:',
    'Driver:',
    'No Of Pallets:',
    'Amended On Sage:',
    'Is A Balance Order Required:'
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
    // 即使沒有帳號也要加上標籤，但提示 OpenAI 嘗試從原文提取
    coreContent += `Account No: [EXTRACT_FROM_TEXT]\n`;
  }
  
  // 添加 Delivery Address
  if (deliveryAdd) {
    coreContent += `Delivery Address: ${deliveryAdd}\n`;
  } else {
    // 即使沒有地址也要加上標籤，但提示 OpenAI 嘗試從原文提取
    coreContent += `Delivery Address: [EXTRACT_FROM_TEXT]\n`;
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
      // 備用：從原始文本中提取產品行
      console.log('[PDF Preprocessing] No processed lines found, extracting product lines from raw text');
      const productLines = extractProductLinesFromRawText(rawText);
      if (productLines.length > 0) {
        coreContent += `Product Table:\n${productLines.join('\n')}`;
      } else {
        coreContent += `Product Table:\n${tableContent}`;
      }
    }
  } else {
    // 如果找不到表格標識，嘗試直接識別產品行
    console.log('[PDF Preprocessing] Table markers not found, attempting direct product line extraction');
    const productLines = extractProductLinesFromRawText(rawText);
    if (productLines.length > 0) {
      coreContent += `Product Table:\n${productLines.join('\n')}`;
    } else {
      // 最後備用策略：保留關鍵產品信息
      const productSection = rawText.match(/S\d+[A-Z0-9\-]+.*?(?=\n|$)/gm);
      if (productSection && productSection.length > 0) {
        coreContent += `Product Table:\n${productSection.join('\n')}`;
      } else {
        coreContent += `Product Table:\n[No products found]`;
      }
    }
  }
  
  // 6. 強化文本清理，移除無關內容
  let processedText = coreContent
    // 移除多餘的空行（但保留單個換行）
    .replace(/\n{3,}/g, '\n\n')
    // 移除 Parcel 相關信息
    .replace(/Parcel\s*\d+[\s\S]*?(?=\n|$)/gi, '')
    // 移除包裝尺寸信息
    .replace(/Height[\s\S]*?Width[\s\S]*?Length[\s\S]*?Weight/gi, '')
    .replace(/Length[\s\S]*?Height[\s\S]*?Width[\s\S]*?Weight/gi, '')
    .replace(/Weight[\s\S]*?Width[\s\S]*?Height[\s\S]*?Length/gi, '')
    // 移除總計信息
    .replace(/Notes:.*?TOTAL[\d\.]+/gi, '')
    .replace(/Nett[\d\.]+\s*VAT[\d\.]+\s*TOTAL[\d\.]+/gi, '')
    // 移除頁尾信息
    .replace(/Total Number Of Pages:.*$/gi, '')
    .replace(/Requested Delivery Date:.*?Total Weight Of Order.*$/gi, '')
    .replace(/Actual Delivery Date:.*$/gi, '')
    .replace(/Driver:.*$/gi, '')
    .replace(/No Of Pallets:.*$/gi, '')
    .replace(/Amended On Sage:.*$/gi, '')
    .replace(/Is A Balance Order Required:.*$/gi, '')
    .replace(/Total Weight Of Order.*$/gi, '')
    // 移除聯絡信息
    .replace(/Tel:\s*\d+[\d\s\-\+\(\)]*\n?/gi, '')
    .replace(/Email:\s*[\w\.\-]+@[\w\.\-]+\n?/gi, '')
    .replace(/Site Tel No:.*?\n?/gi, '')
    // 移除其他無關信息
    .replace(/Price Band ID:\s*\d+\n?/gi, '')
    .replace(/Credit Position:.*?\n?/gi, '')
    .replace(/Account Balance:.*?\n?/gi, '')
    .replace(/Document Date:.*?\n?/gi, '')
    .replace(/Requested Delivery Date:.*?\n?/gi, '')
    .replace(/Entered By:.*?\n?/gi, '')
    .replace(/Checked By:.*?\n?/gi, '')
    .replace(/Invoice To:/gi, '')
    .replace(/Pallet Information/gi, '')
    .replace(/Priority:/gi, '')
    // 移除多個連續嘅空白字符
    .replace(/\s{3,}/g, ' ')
    .trim();

  // 7. 特殊清理：移除你提到嘅具體無關內容
  const unwantedPatterns = [
    // 移除包裝詳情
    /Parcel\s*[1-5][\s\S]*?(?=\n[A-Z]|\n\s*$|$)/gi,
    // 移除尺寸重量詳情
    /(?:Height|Length|Width|Weight)(?:\s+(?:Height|Length|Width|Weight))*[\s\S]*?(?=\n[A-Z]|\n\s*$|$)/gi,
    // 移除總計部分
    /Notes:\s*Nett[\d\.]+\s*VAT[\d\.]+\s*TOTAL[\d\.]+/gi,
    // 移除頁尾信息
    /Total Number Of Pages:\s*\d+/gi,
    /Requested Delivery Date:[\s\S]*?Total Weight Of Order \(Kg\):\s*\d*/gi,
    /Actual Delivery Date:[\s\S]*?$/gi,
    /Driver:[\s\S]*?$/gi,
    /No Of Pallets:[\s\S]*?$/gi,
    /Amended On Sage:[\s\S]*?$/gi,
    /Is A Balance Order Required:[\s\S]*?$/gi,
    // 移除零散的包裝信息
    /LengthHeight/gi,
    /WidthWeight/gi,
    /HeightLength/gi
  ];

  for (const pattern of unwantedPatterns) {
    processedText = processedText.replace(pattern, '');
  }

  // 最終清理
  processedText = processedText
    .replace(/\n{2,}/g, '\n') // 移除多餘換行
    .replace(/\s{2,}/g, ' ')  // 移除多餘空格
    .trim();
  
  console.log(`[PDF Preprocessing] Processed text length: ${processedText.length} chars`);
  console.log(`[PDF Preprocessing] Reduction: ${((rawText.length - processedText.length) / rawText.length * 100).toFixed(1)}%`);
  console.log(`[PDF Preprocessing] Extracted Account No:`, accountNum);
  console.log(`[PDF Preprocessing] Extracted Delivery Address:`, deliveryAdd);
  console.log('[PDF Preprocessing] FULL PROCESSED TEXT:');
  console.log('=====================================');
  console.log(processedText);
  console.log('=====================================');
  
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
    
    if (contentType.includes('multipart/form-data')) {
      // 🚀 新流程：直接處理 FormData（性能優化）
      console.log('[PDF Analysis] Using direct FormData processing');
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      fileName = formData.get('fileName') as string || file.name;
      uploadedBy = formData.get('uploadedBy') as string;
      const saveToStorage = formData.get('saveToStorage') === 'true';
      
      console.log('[PDF Analysis] FormData received:', { 
        fileName, 
        uploadedBy, 
        fileSize: file.size,
        saveToStorage 
      });
      
      if (!file || !fileName || !uploadedBy) {
        return NextResponse.json({ 
          error: 'Missing required fields: file, fileName, or uploadedBy' 
        }, { status: 400 });
      }
      
      // 🚀 直接從文件提取，無需 Storage round trip
      try {
        const arrayBuffer = await file.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        console.log('[PDF Analysis] PDF loaded directly from FormData, size:', pdfBuffer.length, 'bytes');
        
        // 檢查 PDF 魔術數字
        const pdfMagic = pdfBuffer.slice(0, 5).toString();
        console.log('[PDF Analysis] PDF magic bytes:', pdfMagic);
        
        if (!pdfMagic.startsWith('%PDF')) {
          throw new Error('Uploaded file is not a valid PDF');
        }
        
        // 🔄 可選背景存儲（不影響分析性能）
        if (saveToStorage) {
          console.log('[PDF Analysis] Scheduling background storage upload...');
          // 在分析完成後執行背景存儲
          setImmediate(async () => {
            try {
              await uploadToStorageAsync(pdfBuffer, fileName, uploadedBy);
            } catch (storageError) {
              console.warn('[PDF Analysis] Background storage failed:', storageError);
            }
          });
        }
        
      } catch (fileError: any) {
        console.error('[PDF Analysis] FormData processing error:', fileError);
        throw new Error(`Failed to process uploaded file: ${fileError.message}`);
      }
      
    } else if (contentType.includes('application/json')) {
      // 🔄 舊流程：兼容現有 JSON 請求
      console.log('[PDF Analysis] Using legacy JSON processing with Storage download');
      
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
      
      // 嘗試從 Supabase Storage 直接讀取，如果失敗則用 URL 下載
      console.log('[PDF Analysis] Getting PDF from storage or URL:', pdfUrl);
      try {
        // 方法 1: 嘗試從 Supabase Storage 直接讀取
        const urlParts = new URL(pdfUrl);
        const pathSegments = urlParts.pathname.split('/');
        
        // 檢查是否是 Supabase storage URL
        if (pdfUrl.includes('supabase.co/storage/v1/object/public/')) {
          const bucketIndex = pathSegments.findIndex(segment => segment === 'public') + 1;
          const bucket = pathSegments[bucketIndex];
          const filePath = pathSegments.slice(bucketIndex + 1).join('/');
          
          console.log('[PDF Analysis] Attempting direct storage download:', { bucket, filePath });
          
          try {
            const supabaseAdmin = createSupabaseAdmin();
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from(bucket)
              .download(decodeURIComponent(filePath));
            
            if (!downloadError && fileData) {
              const arrayBuffer = await fileData.arrayBuffer();
              pdfBuffer = Buffer.from(arrayBuffer);
              console.log('[PDF Analysis] PDF loaded from storage, size:', pdfBuffer.length, 'bytes');
            } else {
              throw new Error('Storage download failed: ' + downloadError?.message);
            }
          } catch (storageError: any) {
            console.warn('[PDF Analysis] Storage download failed, trying URL:', storageError.message);
            throw storageError; // 讓它 fallback 到 URL 方法
          }
        } else {
          throw new Error('Not a Supabase storage URL');
        }
      } catch (storageError: any) {
        // 方法 2: Fallback 到 URL 下載
        console.log('[PDF Analysis] Fallback to URL download:', pdfUrl);
        try {
          const pdfResponse = await fetch(pdfUrl);
          console.log('[PDF Analysis] PDF response status:', pdfResponse.status);
          
          if (!pdfResponse.ok) {
            throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
          }
          
          const contentType = pdfResponse.headers.get('content-type');
          console.log('[PDF Analysis] PDF content-type:', contentType);
          
          const arrayBuffer = await pdfResponse.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuffer);
          console.log('[PDF Analysis] PDF downloaded via URL, size:', pdfBuffer.length, 'bytes');
        } catch (urlError: any) {
          console.error('[PDF Analysis] Both storage and URL download failed');
          throw new Error(`Failed to get PDF: Storage error: ${storageError.message}, URL error: ${urlError.message}`);
        }
      }
      
      // 檢查 PDF 魔術數字
      const pdfMagic = pdfBuffer.slice(0, 5).toString();
      console.log('[PDF Analysis] PDF magic bytes:', pdfMagic);
      
      if (!pdfMagic.startsWith('%PDF')) {
        throw new Error('Downloaded file is not a valid PDF');
      }
      
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
            token: tokenPerRecord, // 🔥 添加 token 欄位到 data_order 表
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
            console.log('[PDF Analysis] Cached text to save length:', cachedResult.extractedText?.length || 0, 'chars');
            
            // 查找最近上傳的對應文件記錄
            console.log('[PDF Analysis] Looking for doc_upload record (cached):', {
              doc_name: fileName,
              upload_by: uploadedBy,
              doc_type: 'order'
            });
            
            const { data: docRecord, error: findError } = await supabaseAdmin
              .from('doc_upload')
              .select('uuid, json')
              .eq('doc_name', fileName)
              .eq('upload_by', uploadedBy) // 不需要 parseInt，因為是 text 類型
              .eq('doc_type', 'order')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            console.log('[PDF Analysis] Doc record found (cached):', {
              found: !!docRecord,
              uuid: docRecord?.uuid,
              hasExistingJson: !!docRecord?.json,
              findError: findError
            });
            
            if (docRecord && !findError) {
              // 準備要儲存的數據
              const jsonData = {
                extractedText: cachedResult.extractedText,
                originalLength: cachedResult.textProcessing?.originalLength || 0,
                processedLength: cachedResult.textProcessing?.processedLength || 0,
                extractedOrders: cachedResult.orderData,
                timestamp: new Date().toISOString(),
                fromCache: true
              };
              
              const { error: updateError } = await supabaseAdmin
                .from('doc_upload')
                .update({
                  json: JSON.stringify(jsonData) // 儲存為 JSON 字符串，移除 token 欄位
                })
                .eq('uuid', docRecord.uuid);
              
              if (updateError) {
                console.error('[PDF Analysis] Failed to update doc_upload json field (cached):', updateError);
                console.error('[PDF Analysis] Update error details (cached):', {
                  message: updateError.message,
                  code: updateError.code,
                  details: updateError.details
                });
              } else {
                console.log('[PDF Analysis] Successfully updated doc_upload json field (cached)');
                console.log('[PDF Analysis] Saved data size (cached):', JSON.stringify(jsonData).length, 'chars');
              }
            } else {
              console.error('[PDF Analysis] Could not find doc_upload record (cached):', findError);
              console.error('[PDF Analysis] Find error details (cached):', {
                message: findError?.message,
                code: findError?.code,
                details: findError?.details
              });
            }
          } catch (updateError: any) {
            console.error('[PDF Analysis] Error updating doc_upload (cached):', updateError);
            console.error('[PDF Analysis] Full error (cached):', {
              message: updateError.message,
              stack: updateError.stack
            });
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
      
      // 🔥 如果文本提取失敗，嘗試 OCR fallback
      if (pdfUrl) {
        console.log('[PDF Analysis] Attempting OCR fallback with PDF URL...');
        
        // 創建一個簡單的 fallback 文本，包含基本信息
        const fallbackText = `Order Reference: ${fileName?.match(/\d+/)?.[0] || 'Unknown'}
Account No: 
Delivery Address: 

Product Table:
Unable to extract text from PDF. Please check if the PDF contains text or is a scanned image.
PDF URL: ${pdfUrl}`;
        
        extractedText = fallbackText;
        rawText = fallbackText;
        
        console.log('[PDF Analysis] Using fallback text for analysis');
        
        // 繼續處理而不是返回錯誤
      } else {
        return NextResponse.json({ 
          error: 'PDF text extraction failed',
          details: textError.message,
          suggestion: 'The PDF might be a scanned image. Please ensure the PDF contains selectable text.'
        }, { status: 500 });
      }
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
    console.log('[PDF Analysis] FULL MESSAGE CONTENT SENT TO OPENAI:');
    console.log('=====================================');
    console.log(messageContent);
    console.log('=====================================');
    
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
            content: "You are a precise data extraction specialist. Extract order data and return ONLY a valid JSON array. No text, explanations, markdown, or code blocks - just pure JSON."
          },
          {
            role: "user",
            content: messageContent
          }
        ],
        max_tokens: 1500,
        temperature: 0.0, // 🔥 設為 0 確保一致性
        response_format: { type: "json_object" } // 🔥 強制 JSON 模式
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
              content: "You are a precise data extraction specialist. Extract order data and return ONLY a valid JSON array. No text, explanations, markdown, or code blocks - just pure JSON."
            },
            {
              role: "user",
              content: messageContent
            }
          ],
          max_tokens: 1500,
          temperature: 0.0,
          response_format: { type: "json_object" }
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
    console.log('[PDF Analysis] FULL OPENAI RESPONSE:');
    console.log('=====================================');
    console.log(extractedContent);
    console.log('=====================================');
    
    // 解析 OpenAI 回應（增強版）
    let orderData: OrderData[];
    try {
      let cleanContent = extractedContent.trim()
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\uFEFF/, '');
      
      console.log(`[PDF Analysis] Cleaned content for parsing:`, cleanContent.substring(0, 300));
      
      const parsedResponse = JSON.parse(cleanContent);
      
      // 檢查是否是新格式 {orders: [...]} 或舊格式 [...]
      if (parsedResponse.orders && Array.isArray(parsedResponse.orders)) {
        orderData = parsedResponse.orders;
        console.log('[PDF Analysis] Using new format: {orders: [...]}');
      } else if (Array.isArray(parsedResponse)) {
        orderData = parsedResponse;
        console.log('[PDF Analysis] Using legacy format: [...]');
      } else {
        console.error(`[PDF Analysis] Invalid response format. Type: ${typeof parsedResponse}, Content:`, parsedResponse);
        throw new Error('Response is not in expected format');
      }
      
      console.log(`[PDF Analysis] Parsed ${orderData.length} records`);
      
      // 檢查每個記錄是否有必要欄位
      orderData.forEach((record, index) => {
        console.log(`[PDF Analysis] Record ${index}:`, {
          order_ref: record.order_ref,
          product_code: record.product_code,
          delivery_add: record.delivery_add,
          account_num: record.account_num
        });
      });
    
      // 如果沒有數據，顯示 OpenAI 的原始回應
      if (orderData.length === 0) {
        console.log('[PDF Analysis] ❌ NO RECORDS PARSED!');
        console.log('[PDF Analysis] OpenAI raw response:', extractedContent);
        console.log('[PDF Analysis] Text sent to OpenAI (full):', extractedText);
        console.log('[PDF Analysis] Prompt used:', prompt.substring(0, 500));
        
        // 嘗試簡化測試：直接檢查文本是否包含基本信息
        const hasOrderNumber = /\b\d{6,10}\b/.test(extractedText);
        const hasProductInfo = /Product|Item|Code|Description/i.test(extractedText);
        const hasQuantity = /\b\d+\b/.test(extractedText);
        
        console.log('[PDF Analysis] Text analysis:', {
          hasOrderNumber,
          hasProductInfo, 
          hasQuantity,
          textLength: extractedText.length,
          sampleText: extractedText.substring(0, 200)
        });
      }
      
    } catch (parseError: any) {
      console.error('[PDF Analysis] Parse error:', parseError.message);
      console.error('[PDF Analysis] Raw OpenAI response that failed to parse:', extractedContent);
      console.error('[PDF Analysis] Text that was sent to OpenAI:', extractedText.substring(0, 1000));
      
      return NextResponse.json({ 
        error: 'Failed to parse OpenAI response',
        details: parseError.message,
        rawResponse: extractedContent.substring(0, 500), // 提供前500字符供調試
        sentText: extractedText.substring(0, 500)
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
            token: tokenPerRecord, // 🔥 添加 token 欄位到 data_order 表
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
          console.log('[PDF Analysis] Text to save length:', extractedText.length, 'chars');
          
          // 查找最近上傳的對應文件記錄
          console.log('[PDF Analysis] Looking for doc_upload record:', {
            doc_name: fileName,
            upload_by: uploadedBy,
            doc_type: 'order'
          });
          
          const { data: docRecord, error: findError } = await supabaseAdmin
            .from('doc_upload')
            .select('uuid, json')
            .eq('doc_name', fileName)
            .eq('upload_by', uploadedBy) // 不需要 parseInt，因為是 text 類型
            .eq('doc_type', 'order')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          console.log('[PDF Analysis] Doc record found:', {
            found: !!docRecord,
            uuid: docRecord?.uuid,
            hasExistingJson: !!docRecord?.json,
            findError: findError
          });
          
          if (docRecord && !findError) {
            // 準備要儲存的數據
            const jsonData = {
              extractedText: extractedText,
              originalLength: rawText.length,
              processedLength: extractedText.length,
              extractedOrders: orderData,
              timestamp: new Date().toISOString()
            };
            
            const { error: updateError } = await supabaseAdmin
              .from('doc_upload')
              .update({
                json: JSON.stringify(jsonData) // 儲存為 JSON 字符串，移除 token 欄位
              })
              .eq('uuid', docRecord.uuid);
            
            if (updateError) {
              console.error('[PDF Analysis] Failed to update doc_upload json field:', updateError);
              console.error('[PDF Analysis] Update error details:', {
                message: updateError.message,
                code: updateError.code,
                details: updateError.details
              });
            } else {
              console.log('[PDF Analysis] Successfully updated doc_upload json field');
              console.log('[PDF Analysis] Saved data size:', JSON.stringify(jsonData).length, 'chars');
            }
          } else {
            console.error('[PDF Analysis] Could not find doc_upload record:', findError);
            console.error('[PDF Analysis] Find error details:', {
              message: findError?.message,
              code: findError?.code,
              details: findError?.details
            });
          }
        } catch (updateError: any) {
          console.error('[PDF Analysis] Error updating doc_upload:', updateError);
          console.error('[PDF Analysis] Full error:', {
            message: updateError.message,
            stack: updateError.stack
          });
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
        
        // 🔥 發送訂單創建郵件通知 - 使用內部服務（可選）
        let emailResult = null;
        try {
          console.log('[PDF Analysis] Attempting to send order created email notification...');
          
          // 檢查郵件服務是否可用
          try {
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
            
            console.log('[PDF Analysis] Calling internal email service...');
            
            const emailData = await sendOrderCreatedEmail(emailRequestBody);
            
            console.log('[PDF Analysis] Order created email sent successfully:', emailData);
            emailResult = {
              success: true,
              message: emailData.message,
              emailId: emailData.emailId,
              recipients: emailData.recipients
            };
          } catch (emailImportError: any) {
            console.warn('[PDF Analysis] Email service not available:', emailImportError.message);
            emailResult = {
              success: false,
              error: 'Email service not available',
              skipped: true
            };
          }
          
        } catch (emailError: any) {
          console.warn('[PDF Analysis] Email notification failed (non-critical):', emailError.message);
          emailResult = {
            success: false,
            error: `Email service error: ${emailError.message}`,
            skipped: true
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
        extractedData: [], // 🔥 返回空數組而不是 undefined
        extractedText: extractedText, // 🔥 返回提取的文本供調試
        openaiResponse: extractedContent, // 🔥 返回 OpenAI 原始響應供調試
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