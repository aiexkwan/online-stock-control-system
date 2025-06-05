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

// PDF 轉圖像函數（使用 pdf2pic 或類似庫）
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 注意：這裡需要安裝 pdf2pic 或 pdf-poppler 等庫
    // npm install pdf2pic
    const pdf2pic = require('pdf2pic');
    
    const convert = pdf2pic.fromBuffer(pdfBuffer, {
      density: 300,           // 高解析度
      saveFilename: "page",
      savePath: "/tmp",
      format: "png",
      width: 2480,           // A4 寬度 @ 300 DPI
      height: 3508           // A4 高度 @ 300 DPI
    });
    
    const results = await convert.bulk(-1); // 轉換所有頁面
    
    console.log(`[PDF to Images] 轉換結果: ${results.length} 個文件`);
    
    // 將圖像轉為 base64
    const base64Images: string[] = [];
    for (const result of results) {
      if (result.base64) {
        // 如果已經有 base64，直接使用
        base64Images.push(result.base64);
      } else if (result.path) {
        // 如果有文件路徑，讀取文件並轉換為 base64
        try {
          const imageBuffer = fs.readFileSync(result.path);
          const base64String = imageBuffer.toString('base64');
          base64Images.push(base64String);
          
          // 清理臨時文件
          fs.unlinkSync(result.path);
        } catch (fileError) {
          console.error('[PDF to Images] 讀取文件錯誤:', fileError);
        }
      }
    }
    
    console.log(`[PDF to Images] 成功轉換 ${base64Images.length} 個圖像為 base64`);
    return base64Images;
  } catch (error) {
    console.error('[PDF to Images] 轉換錯誤:', error);
    throw new Error('Failed to convert PDF to images');
  }
}

// 定義訂單數據接口
interface OrderData {
  account_num: number;
  order_ref: number;
  customer_ref: number;
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
    
    console.log('[Analyze Order PDF API] 開始將 PDF 轉換為圖像...');
    
    // 將 PDF 轉換為圖像
    const imageBase64Array = await convertPdfToImages(pdfBuffer);
    
    if (imageBase64Array.length === 0) {
      throw new Error('No images extracted from PDF');
    }
    
    console.log(`[Analyze Order PDF API] PDF 轉換完成，共 ${imageBase64Array.length} 頁圖像`);
    
    // 創建 OpenAI 客戶端
    const openai = createOpenAIClient();
    
    // 構建詳細的 prompt
    const prompt = `
You are a professional data extraction specialist with expertise in analyzing business documents. Please analyze the uploaded document images and extract order information according to the following database schema.

**CRITICAL REQUIREMENTS:**

1. **Database Schema for "data_order" table:**
   - account_num (bigint) - Account number or customer account ID
   - order_ref (bigint) - Order reference number or order ID
   - customer_ref (bigint) - Customer reference number or customer PO number
   - invoice_to (text) - Invoice address, company name, or billing address
   - delivery_add (text) - Delivery address or shipping address
   - product_code (text) - Product code, SKU, or item number
   - product_desc (text) - Product description or item description
   - product_qty (bigint) - Product quantity ordered
   - unit_price (bigint) - Unit price in smallest currency unit (pence/cents)

2. **Data Extraction Rules:**
   - ALL fields are REQUIRED and must be filled
   - For numeric fields: Extract only numbers, remove formatting
   - For unit_price: Convert to smallest currency unit (£12.50 → 1250, $5.99 → 599)
   - For text fields: Clean whitespace but preserve essential information
   - If multiple line items exist, create separate records for each

3. **Field Mapping Guidelines:**
   - account_num: Look for "Account", "Customer ID", "Account No", "Acc No"
   - order_ref: Look for "Order No", "Order Ref", "PO Number", "Order ID"
   - customer_ref: Look for "Customer Ref", "Your Ref", "Customer PO", "Ref No"
   - invoice_to: Look for "Bill To", "Invoice Address", "Customer Name"
   - delivery_add: Look for "Ship To", "Delivery Address", "Delivery To"
   - product_code: Look for "Code", "SKU", "Item No", "Product Code", "Part No"
   - product_desc: Look for "Description", "Item", "Product", "Details"
   - product_qty: Look for "Qty", "Quantity", "Units", "Amount"
   - unit_price: Look for "Price", "Unit Price", "Rate", "Cost"

4. **Fallback Values (only if data cannot be found):**
   - Numeric fields: Use 0
   - Text fields: Use "NOT_FOUND"

5. **Multi-page Analysis:**
   - Analyze ALL provided images as they represent different pages of the same document
   - Look for continuation of data across pages
   - Combine information from all pages to create complete records

**OUTPUT FORMAT:**
Return ONLY a valid JSON array. Each object represents one order line item.

Example format:
[
  {
    "account_num": 12345,
    "order_ref": 67890,
    "customer_ref": 11111,
    "invoice_to": "ABC Company Ltd, 123 Business Street, London, UK",
    "delivery_add": "XYZ Warehouse, 456 Industrial Road, Manchester, UK",
    "product_code": "SLATE001",
    "product_desc": "Welsh Slate 600x400mm Natural Grey",
    "product_qty": 100,
    "unit_price": 1250
  }
]

**IMPORTANT:** 
- Analyze all document images carefully
- Look for tables, line items, and structured data across all pages
- Pay attention to headers and labels
- Extract all order lines if multiple products are listed
- Ensure numeric values are properly converted
- Double-check currency conversions

Please analyze the document images now and extract the order data.
`;
    
    // 構建消息內容，包含所有圖像
    const messageContent: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];
    
    // 添加所有頁面的圖像
    for (let i = 0; i < imageBase64Array.length; i++) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${imageBase64Array[i]}`,
          detail: "high"
        }
      });
    }
    
    console.log('[Analyze Order PDF API] 發送到 OpenAI，包含', imageBase64Array.length, '張圖像...');
    
    // 發送到 OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
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
      return NextResponse.json({ error: 'No content extracted from PDF' }, { status: 500 });
    }
    
    console.log('[Analyze Order PDF API] 提取的內容:', extractedContent);
    
    // 解析 JSON 回應
    let orderData: OrderData[];
    try {
      // 清理回應內容，移除可能的 markdown 格式
      const cleanContent = extractedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      orderData = JSON.parse(cleanContent);
      
      if (!Array.isArray(orderData)) {
        throw new Error('Response is not an array');
      }
      
      // 驗證每個訂單記錄的必要欄位
      orderData.forEach((order, index) => {
        const requiredFields: (keyof OrderData)[] = ['account_num', 'order_ref', 'customer_ref', 'invoice_to', 'delivery_add', 'product_code', 'product_desc', 'product_qty', 'unit_price'];
        for (const field of requiredFields) {
          if (order[field] === undefined || order[field] === null) {
            throw new Error(`Missing required field '${field}' in record ${index + 1}`);
          }
        }
        
        // 確保數字欄位是數字類型
        const numericFields: (keyof OrderData)[] = ['account_num', 'order_ref', 'customer_ref', 'product_qty', 'unit_price'];
        for (const field of numericFields) {
          if (typeof order[field] !== 'number') {
            (order as any)[field] = parseInt(String(order[field])) || 0;
          }
        }
      });
      
    } catch (parseError) {
      console.error('[Analyze Order PDF API] JSON 解析錯誤:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse extracted data',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        rawContent: extractedContent
      }, { status: 500 });
    }
    
    console.log('[Analyze Order PDF API] 解析的訂單數據:', orderData);
    
    // 創建服務端客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // 檢查是否已存在相同的訂單記錄（基於 order_ref 和 product_code）
    console.log('[Analyze Order PDF API] 檢查重複記錄...');
    const duplicateChecks = await Promise.all(
      orderData.map(async (order) => {
        const { data: existingRecords, error } = await supabaseAdmin
          .from('data_order')
          .select('uuid, order_ref, product_code')
          .eq('order_ref', order.order_ref)
          .eq('product_code', order.product_code);
        
        if (error) {
          console.error('[Analyze Order PDF API] 重複檢查錯誤:', error);
          return { isDuplicate: false, order };
        }
        
        return { 
          isDuplicate: existingRecords && existingRecords.length > 0, 
          order,
          existingRecords 
        };
      })
    );
    
    // 過濾掉重複的記錄
    const newOrders = duplicateChecks.filter(check => !check.isDuplicate).map(check => check.order);
    const duplicateOrders = duplicateChecks.filter(check => check.isDuplicate);
    
    if (duplicateOrders.length > 0) {
      console.log(`[Analyze Order PDF API] 發現 ${duplicateOrders.length} 個重複記錄，將跳過插入`);
      duplicateOrders.forEach((dup, index) => {
        console.log(`[Analyze Order PDF API] 重複記錄 ${index + 1}: Order ${dup.order.order_ref}, Product ${dup.order.product_code}`);
      });
    }
    
    if (newOrders.length === 0) {
      console.log('[Analyze Order PDF API] 所有記錄都已存在，無需插入新記錄');
      return NextResponse.json({
        success: true,
        message: 'All records already exist in database',
        extractedData: orderData,
        insertedRecords: [],
        duplicateRecords: duplicateOrders.map(d => d.order),
        recordCount: 0,
        duplicateCount: duplicateOrders.length,
        storageInfo: storageInfo,
        pagesProcessed: imageBase64Array.length
      });
    }
    
    console.log(`[Analyze Order PDF API] 將插入 ${newOrders.length} 個新記錄`);
    
    // 插入數據到 data_order 表
    const insertPromises = newOrders.map(async (order, index) => {
      try {
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
        
        console.log(`[Analyze Order PDF API] 記錄 ${index + 1} 插入成功:`, data);
        return data;
      } catch (insertError) {
        console.error(`[Analyze Order PDF API] 記錄 ${index + 1} 插入失敗:`, insertError);
        throw new Error(`Failed to insert record ${index + 1}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }
    });
    
    const insertResults = await Promise.all(insertPromises);
    
    console.log('[Analyze Order PDF API] 數據插入成功，插入記錄數:', insertResults.length);
    
    return NextResponse.json({
      success: true,
      extractedData: orderData,
      insertedRecords: insertResults.flat(),
      duplicateRecords: duplicateOrders.map(d => d.order),
      recordCount: insertResults.length,
      duplicateCount: duplicateOrders.length,
      storageInfo: storageInfo,
      pagesProcessed: imageBase64Array.length,
      message: `Successfully extracted and saved ${insertResults.length} new order records from ${imageBase64Array.length} pages${duplicateOrders.length > 0 ? ` (${duplicateOrders.length} duplicates skipped)` : ''}`
    });
    
  } catch (error: any) {
    console.error('[Analyze Order PDF API] 意外錯誤:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 