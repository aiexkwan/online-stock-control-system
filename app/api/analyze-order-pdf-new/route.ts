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

// PDF 文本提取函數
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }
    
    console.log('[PDF Text Extract] Buffer size:', pdfBuffer.length);
    
    const pkg = require('pdf-parse');
    const pdfParse = pkg.default || pkg;
    
    const options = {
      max: 0, // 不限制頁數
    };
    
    const pdfData = await pdfParse(pdfBuffer, options);
    
    console.log('[PDF Text Extract] Pages:', pdfData.numpages);
    console.log('[PDF Text Extract] Text length:', pdfData.text?.length || 0);
    console.log('[PDF Text Extract] PDF info:', pdfData.info);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
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
  let accountNum = '';
  
  // 首先檢查 "Account No:" 後面是否是 PO 號碼
  const accountLineMatch = rawText.match(/Account\s*No\.?:?\s*([^\n]+)/i);
  if (accountLineMatch && accountLineMatch[1].match(/^PO\d+/i)) {
    // 如果是 PO 號碼，查找前面的獨立數字行（5-8位數字）
    const beforeAccountNo = rawText.substring(0, accountLineMatch.index);
    const lines = beforeAccountNo.split('\n').reverse(); // 從後往前查找
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^\d{5,8}$/)) {
        accountNum = trimmedLine;
        console.log(`[PDF Preprocessing] Found account number in standalone line: "${accountNum}"`);
        break;
      }
    }
  }
  
  // 如果沒找到，使用常規模式
  if (!accountNum) {
    const accountPatterns = [
      /Account\s*No\.?:?\s*([A-Z0-9]+)/i,
      /Account\s*Number:?\s*([A-Z0-9]+)/i,
      /Acc\s*No\.?:?\s*([A-Z0-9]+)/i,
      /Customer\s*No\.?:?\s*([A-Z0-9]+)/i
    ];
    
    for (const pattern of accountPatterns) {
      const match = rawText.match(pattern);
      if (match && !match[1].match(/^PO/i)) { // 排除 PO 開頭的匹配
        accountNum = match[1];
        break;
      }
    }
  }
  console.log(`[PDF Preprocessing] Account No found: "${accountNum}"`);
  
  // 1.2 提取 Delivery Address - 改進版
  let deliveryAdd = '';
  const deliveryPatterns = [
    /Delivery\s*Address:?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|Goods\s*to|^\s*$))/i,
    /(?:Deliver\s*To|Ship\s*To):?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|^\s*$))/i
  ];
  
  for (const pattern of deliveryPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const rawAddress = match[1].trim();
      console.log(`[PDF Preprocessing] Raw delivery address match:`, rawAddress.substring(0, 200));
      
      deliveryAdd = rawAddress
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          if (!line) return false;
          if (line.match(/^(Delivery Address:?|Invoice To:?|Deliver To:?|Ship To:?|Tel:?|Email:?|Site Tel No:?)$/i)) return false;
          if (line.match(/^\d+$/)) return false;
          if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) return false;
          return true;
        })
        .slice(0, 5)
        .join(', ');
      
      if (deliveryAdd.length > 10) {
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
  
  // 2. 提取產品信息 - 改進的方法
  const allLines = rawText.split('\n');
  const productLines = allLines.filter(line => {
    const trimmed = line.trim();
    // 匹配產品代碼模式：字母開頭，包含數字，可能有連字符
    const hasProductCode = /^[A-Z][A-Z0-9\-]*\d+[A-Z0-9\-]*/.test(trimmed);
    // 或者匹配運輸費用
    const isTransport = /^Trans\d*/.test(trimmed);
    // 避免匹配頁眉、地址等行
    const isNotHeader = !trimmed.match(/^(Picking List|Document Date|Delivery Address|Invoice To|Account No|Price Band|Credit Position|Notes|Total|Parcel|Height|Length|Width|Weight|Driver|Email|Tel|Site Tel|Requested Delivery|Actual Delivery|Page|Balance|VAT|TOTAL|Nett)[:|\s]/i);
    
    return (hasProductCode || isTransport) && isNotHeader && trimmed.length > 3;
  });
  
  console.log(`[PDF Preprocessing] Found ${productLines.length} potential product lines`);
  console.log(`[PDF Preprocessing] Product lines:`, productLines.slice(0, 5)); // 顯示前5行作為調試
  
  // 3. 構建清潔的文本
  let coreContent = '';
  
  // 添加訂單參考號碼
  if (orderRef) {
    coreContent += `Order Reference: ${orderRef}\n`;
  }
  
  // 添加 Account No
  if (accountNum) {
    coreContent += `Account No: ${accountNum}\n`;
  } else {
    coreContent += `Account No: [EXTRACT_FROM_TEXT]\n`;
  }
  
  // 添加 Delivery Address
  if (deliveryAdd) {
    coreContent += `Delivery Address: ${deliveryAdd}\n`;
  } else {
    coreContent += `Delivery Address: [EXTRACT_FROM_TEXT]\n`;
  }
  
  coreContent += '\n';
  
  // 添加產品信息
  if (productLines.length > 0) {
    coreContent += `Product Table:\n${productLines.join('\n')}`;
  } else {
    // 如果沒找到產品行，提取包含數字的行
    const numberLines = rawText.split('\n').filter(line => 
      /\d+/.test(line) && 
      line.length > 5 && 
      !line.match(/Date|Tel|Email|Page|Balance|Weight/)
    );
    if (numberLines.length > 0) {
      coreContent += `Product Table:\n${numberLines.slice(0, 10).join('\n')}`;
    } else {
      coreContent += `Product Table:\n[No products found]`;
    }
  }
  
  console.log(`[PDF Preprocessing] Processed text length: ${coreContent.length} chars`);
  console.log(`[PDF Preprocessing] Reduction: ${((rawText.length - coreContent.length) / rawText.length * 100).toFixed(1)}%`);
  console.log(`[PDF Preprocessing] Extracted Account No:`, accountNum);
  console.log(`[PDF Preprocessing] Extracted Delivery Address:`, deliveryAdd);
  console.log('[PDF Preprocessing] FULL PROCESSED TEXT:');
  console.log('=====================================');
  console.log(coreContent);
  console.log('=====================================');
  
  return coreContent;
}

// 定義訂單數據接口
interface OrderData {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
  uploaded_by: number;
  token?: number;
  delivery_add?: string;
  account_num?: string;
}

// 計算每個訂單記錄的 token 分配
function calculateTokenPerRecord(totalTokens: number, recordCount: number): number {
  if (recordCount === 0) return 0;
  return Math.ceil(totalTokens / recordCount);
}

// 🚀 可選背景存儲函數
async function uploadToStorageAsync(pdfBuffer: Buffer, fileName: string, uploadedBy: string, extractedText?: string) {
  try {
    console.log('[Background Storage] Starting upload...');
    const supabaseAdmin = createSupabaseAdmin();
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(`orderpdf/${fileName}`, pdfBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(`orderpdf/${fileName}`);
    
    // 寫入 doc_upload 表（包含 json_txt 欄位）
    const { error: docError } = await supabaseAdmin
      .from('doc_upload')
      .insert({
        doc_name: fileName,
        upload_by: uploadedBy,
        doc_type: 'order',
        doc_url: urlData.publicUrl,
        file_size: pdfBuffer.length,
        folder: 'orderpdf',
        json_txt: extractedText || null // 🔥 加入提取的文本到 json_txt 欄位
      });
    
    if (docError) {
      console.warn('[Background Storage] doc_upload insert failed:', docError);
    } else {
      console.log('[Background Storage] doc_upload inserted with json_txt field');
    }
    
    console.log('[Background Storage] Upload completed:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('[Background Storage] Upload failed:', error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF Analysis] Starting PDF analysis request');
    
    // 🚀 新流程：只處理 FormData，直接從文件提取
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file?.name;
    const uploadedBy = formData.get('uploadedBy') as string;
    const saveToStorage = formData.get('saveToStorage') === 'true';
    
    console.log('[PDF Analysis] FormData received:', { 
      fileName, 
      uploadedBy, 
      fileSize: file?.size,
      saveToStorage 
    });
    
    if (!file || !fileName || !uploadedBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, fileName, or uploadedBy' 
      }, { status: 400 });
    }
    
    // 🚀 直接從文件提取，無需 Storage round trip
    let pdfBuffer: Buffer;
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
      
    } catch (fileError: any) {
      console.error('[PDF Analysis] FormData processing error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to process uploaded file',
        details: fileError.message
      }, { status: 400 });
    }
    
    // 檢查緩存
    const fileHash = generateFileHash(pdfBuffer);
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult) {
      console.log(`[PDF Analysis] Cache hit: ${fileHash.substring(0, 8)}... (${cachedResult.orderData?.length || 0} records)`);
      
      // 重新插入數據庫（因為 uploaded_by 可能不同）
      if (cachedResult.orderData && cachedResult.orderData.length > 0) {
        try {
          const supabaseAdmin = createSupabaseAdmin();
          const totalTokens = cachedResult.usage?.total_tokens || 0;
          const tokenPerRecord = calculateTokenPerRecord(totalTokens, cachedResult.orderData.length);
          
          const insertData = cachedResult.orderData.map((order: any) => ({
            order_ref: String(order.order_ref),
            product_code: order.product_code,
            product_desc: order.product_desc,
            product_qty: String(order.product_qty),
            uploaded_by: String(uploadedBy),
            token: tokenPerRecord,
            delivery_add: order.delivery_add || '-',
            account_num: order.account_num || '-'
          }));
          
          const { data: insertResults, error: insertError } = await supabaseAdmin
            .from('data_order')
            .insert(insertData)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`[PDF Analysis] Cached data inserted: ${insertResults.length} records`);
          
          // 🔥 更新 doc_upload 表的 json 欄位（緩存版本 - 總是嘗試更新）
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
              .eq('upload_by', uploadedBy)
              .eq('doc_type', 'order')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            console.log('[PDF Analysis] Doc record found (cached):', {
              found: !!docRecord,
              uuid: docRecord?.uuid,
              hasExistingJson: !!docRecord?.json,
              findError: findError?.message
            });
            
            if (docRecord && !findError) {
              // 更新 json_txt 欄位
              const { error: updateError } = await supabaseAdmin
                .from('doc_upload')
                .update({
                  json_txt: cachedResult.extractedText // 存儲緩存的提取文本到 json_txt 欄位
                })
                .eq('uuid', docRecord.uuid);
              
              if (updateError) {
                console.error('[PDF Analysis] Failed to update doc_upload json_txt field (cached):', updateError);
              } else {
                console.log('[PDF Analysis] Successfully updated doc_upload json_txt field (cached)');
              }
            } else {
              console.warn('[PDF Analysis] No matching doc_upload record found for json update (cached)');
            }
            
          } catch (jsonUpdateError: any) {
            console.error('[PDF Analysis] Error updating doc_upload json field (cached):', jsonUpdateError.message);
          }
          
          // 📧 發送訂單創建郵件通知（緩存版本）
          let emailResult = { success: false, error: 'Email not attempted' };
          try {
            console.log('[PDF Analysis] Preparing order created email (cached)...');
            
            const { sendOrderCreatedEmail } = await import('../../services/emailService');
            
            const emailRequestBody = {
              orderData: cachedResult.orderData.map((order: any) => ({
                order_ref: order.order_ref,
                product_code: order.product_code,
                product_desc: order.product_desc,
                product_qty: order.product_qty
              })),
              pdfAttachment: {
                filename: fileName,
                content: pdfBuffer.toString('base64') // 將 PDF 轉換為 base64
              }
            };
            
            console.log('[PDF Analysis] Calling internal email service with PDF attachment (cached)...');
            console.log('[PDF Analysis] PDF attachment size (cached):', pdfBuffer.length, 'bytes');
            
            const emailData = await sendOrderCreatedEmail(emailRequestBody);
            
            console.log('[PDF Analysis] Order created email sent successfully (cached):', emailData);
            emailResult = {
              success: true,
              error: '',
              message: emailData.message,
              emailId: emailData.emailId,
              recipients: emailData.recipients
            } as any;
            
          } catch (emailError: any) {
            console.error('[PDF Analysis] Error sending order created email (cached):', emailError);
            emailResult = {
              success: false,
              error: `Email service error: ${emailError.message}`
            };
          }
          
          return NextResponse.json({
            success: true,
            message: `Successfully processed PDF (cached) and inserted ${insertResults.length} records`,
            recordCount: insertResults.length,
            extractedData: cachedResult.orderData,
            insertedRecords: insertResults,
            emailNotification: emailResult, // 📧 返回郵件發送結果
            cached: true,
            usage: cachedResult.usage,
            tokenPerRecord: tokenPerRecord
          });
          
        } catch (insertError: any) {
          console.error('[PDF Analysis] Database insertion failed:', insertError.message);
          return NextResponse.json({ 
            error: 'Database insertion failed',
            details: insertError.message
          }, { status: 500 });
        }
      }
    }
    
    // PDF 文本提取
    let extractedText: string;
    let rawText: string;
    let textReductionPercentage: string = '0';
    
    try {
      rawText = await extractTextFromPDF(pdfBuffer);
      console.log(`[PDF Analysis] Raw text extracted: ${rawText.length} chars`);
      
      // 啟用預處理以提高準確性
      extractedText = preprocessPdfText(rawText);
      textReductionPercentage = ((rawText.length - extractedText.length) / rawText.length * 100).toFixed(1);
      console.log(`[PDF Analysis] Preprocessed text: ${extractedText.length} chars (${textReductionPercentage}% reduction)`);
      
    } catch (textError: any) {
      console.error('[PDF Analysis] Text extraction failed:', textError.message);
      return NextResponse.json({ 
        error: 'PDF text extraction failed',
        details: textError.message,
        suggestion: 'The PDF might be a scanned image. Please ensure the PDF contains selectable text.'
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
    console.log('[PDF Analysis] FULL MESSAGE CONTENT SENT TO OPENAI:');
    console.log('=====================================');
    console.log(messageContent);
    console.log('=====================================');
    
    // 發送到 OpenAI API
    const openai = createOpenAIClient();
    let response;
    
    try {
      console.log('[PDF Analysis] Trying GPT-4o model...');
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a precise data extraction specialist. Extract order data and return ONLY a valid JSON object with orders array. No text, explanations, markdown, or code blocks - just pure JSON."
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
    } catch (error: any) {
      console.error('[PDF Analysis] GPT-4o failed:', error.message);
      
      console.log('[PDF Analysis] Falling back to GPT-4-turbo model...');
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a precise data extraction specialist. Extract order data and return ONLY a valid JSON object with orders array. No text, explanations, markdown, or code blocks - just pure JSON."
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
    
    // 解析 OpenAI 回應
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
        rawResponse: extractedContent.substring(0, 500),
        sentText: extractedText.substring(0, 500)
      }, { status: 500 });
    }
    
    // 🔥 緩存結果
    setCachedResult(fileHash, {
      orderData,
      usage: response.usage,
      extractedText: extractedText,
      originalTextLength: rawText.length,
      processedTextLength: extractedText.length,
      textReduction: textReductionPercentage
    });
    
    // 數據庫插入
    if (orderData.length > 0) {
      try {
        const supabaseAdmin = createSupabaseAdmin();
        
        const totalTokens = response.usage?.total_tokens || 0;
        const tokenPerRecord = calculateTokenPerRecord(totalTokens, orderData.length);
        
        console.log('[PDF Analysis] Raw orderData:', orderData);
        
        const insertData = orderData.map(order => {
          const record = {
            order_ref: String(order.order_ref),
            product_code: order.product_code,
            product_desc: order.product_desc,
            product_qty: String(order.product_qty),
            uploaded_by: String(uploadedBy),
            token: tokenPerRecord,
            delivery_add: order.delivery_add || '-',
            account_num: order.account_num || '-'
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
        
        // 🔥 更新 doc_upload 表的 json 欄位（僅當不使用背景存儲時）
        if (!saveToStorage) {
          try {
            console.log('[PDF Analysis] Updating doc_upload json field...');
            console.log('[PDF Analysis] Extracted text to save length:', extractedText?.length || 0, 'chars');
            
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
              .eq('upload_by', uploadedBy)
              .eq('doc_type', 'order')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            console.log('[PDF Analysis] Doc record found:', {
              found: !!docRecord,
              uuid: docRecord?.uuid,
              hasExistingJson: !!docRecord?.json,
              findError: findError?.message
            });
            
            if (docRecord && !findError) {
              // 更新 json 欄位
              const { error: updateError } = await supabaseAdmin
                .from('doc_upload')
                .update({
                  json: extractedText // 存儲提取的文本到 json 欄位
                })
                .eq('uuid', docRecord.uuid);
              
              if (updateError) {
                console.error('[PDF Analysis] Failed to update doc_upload json field:', updateError);
              } else {
                console.log('[PDF Analysis] Successfully updated doc_upload json field');
              }
            } else {
              console.warn('[PDF Analysis] No matching doc_upload record found for json update');
            }
            
          } catch (jsonUpdateError: any) {
            console.error('[PDF Analysis] Error updating doc_upload json field:', jsonUpdateError.message);
          }
        } else {
          console.log('[PDF Analysis] Skipping doc_upload json update - will be handled by background storage');
        }
        
        // 🔄 可選背景存儲（不影響響應時間）
        if (saveToStorage) {
          setImmediate(async () => {
            try {
              await uploadToStorageAsync(pdfBuffer, fileName, uploadedBy, extractedText);
            } catch (storageError) {
              console.warn('[PDF Analysis] Background storage failed:', storageError);
            }
          });
        }
        
        // 📧 發送訂單創建郵件通知
        let emailResult = { success: false, error: 'Email not attempted' };
        try {
          console.log('[PDF Analysis] Preparing order created email...');
          
          const { sendOrderCreatedEmail } = await import('../../services/emailService');
          
          const emailRequestBody = {
            orderData: orderData.map(order => ({
              order_ref: order.order_ref,
              product_code: order.product_code,
              product_desc: order.product_desc,
              product_qty: order.product_qty
            })),
            pdfAttachment: {
              filename: fileName,
              content: pdfBuffer.toString('base64') // 將 PDF 轉換為 base64
            }
          };
          
          console.log('[PDF Analysis] Calling internal email service with PDF attachment...');
          console.log('[PDF Analysis] PDF attachment size:', pdfBuffer.length, 'bytes');
          
          const emailData = await sendOrderCreatedEmail(emailRequestBody);
          
          console.log('[PDF Analysis] Order created email sent successfully:', emailData);
          emailResult = {
            success: true,
            error: '',
            message: emailData.message,
            emailId: emailData.emailId,
            recipients: emailData.recipients
          } as any;
          
        } catch (emailError: any) {
          console.error('[PDF Analysis] Error sending order created email:', emailError);
          emailResult = {
            success: false,
            error: `Email service error: ${emailError.message}`
          };
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
        
        return NextResponse.json({
          success: true,
          message: `Successfully processed PDF and inserted ${insertResults.length} records${acoInsertResults ? ` and ${acoInsertResults.length} ACO records` : ''}`,
          recordCount: insertResults.length,
          extractedData: orderData,
          extractedText: extractedText,
          insertedRecords: insertResults,
          acoRecords: acoInsertResults,
          emailNotification: emailResult, // 📧 返回郵件發送結果
          cached: false,
          usage: response.usage,
          tokenPerRecord: tokenPerRecord,
          totalTokensUsed: totalTokens,
          textProcessing: {
            originalLength: rawText.length,
            processedLength: extractedText.length,
            reductionPercentage: textReductionPercentage,
            tokensSaved: Math.round((rawText.length - extractedText.length) / 4)
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
        extractedData: [],
        extractedText: extractedText,
        openaiResponse: extractedContent,
        cached: false,
        usage: response.usage,
        totalTokensUsed: response.usage?.total_tokens || 0,
        textProcessing: {
          originalLength: rawText.length,
          processedLength: extractedText.length,
          reductionPercentage: textReductionPercentage,
          tokensSaved: Math.round((rawText.length - extractedText.length) / 4)
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
    
    return NextResponse.json({ 
      error: 'System error',
      details: error.message,
      errorType: error.name,
      errorCode: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }, { status: 500 });
  }
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
      const cacheEntries = Array.from(fileCache.entries()).map(([hash, value]) => ({
        hash: hash.substring(0, 8) + '...',
        age: Math.round((Date.now() - value.timestamp) / 1000 / 60),
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
      message: 'PDF Analysis API is running (FormData only)',
      supportedMethods: ['POST (FormData)'],
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