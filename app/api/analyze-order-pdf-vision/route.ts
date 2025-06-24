'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

// 定義訂單數據接口
interface OrderData {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
  delivery_add?: string;
  account_num?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF Vision Analysis] Starting PDF vision analysis request');
    
    const body = await request.json();
    const { pdfUrl, fileName, uploadedBy } = body;
    
    // 基本驗證
    if (!pdfUrl || !fileName || !uploadedBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: pdfUrl, fileName, or uploadedBy' 
      }, { status: 400 });
    }
    
    console.log('[PDF Vision Analysis] Analyzing PDF from URL:', pdfUrl);
    
    // 先將 PDF 轉換為 PNG
    console.log('[PDF Vision Analysis] Converting PDF to PNG...');
    let imageUrls: string[] = [];
    
    try {
      const convertResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/convert-pdf-to-png`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl, fileName })
      });
      
      if (!convertResponse.ok) {
        const error = await convertResponse.json();
        throw new Error(error.error || 'PDF conversion failed');
      }
      
      const convertResult = await convertResponse.json();
      imageUrls = convertResult.imageUrls;
      
      console.log(`[PDF Vision Analysis] Converted to ${imageUrls.length} PNG images`);
      
    } catch (convertError: any) {
      console.error('[PDF Vision Analysis] PDF conversion error:', convertError);
      return NextResponse.json({ 
        error: 'Failed to convert PDF to images',
        details: convertError.message
      }, { status: 500 });
    }
    
    if (imageUrls.length === 0) {
      return NextResponse.json({ 
        error: 'No images generated from PDF'
      }, { status: 500 });
    }
    
    // 讀取 OpenAI prompt 文件
    let prompt = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const promptPath = path.join(process.cwd(), 'docs', 'openAI_pdf_vision_prompt');
      prompt = fs.readFileSync(promptPath, 'utf8');
      console.log('[PDF Vision Analysis] Prompt loaded from file');
    } catch (promptError: any) {
      console.error('[PDF Vision Analysis] Failed to read prompt file:', promptError.message);
      // 使用預設 prompt
      prompt = `你是一個專業的 PDF 訂單資料視覺分析專家。請查看提供的 PDF 圖像，並根據以下規則精準抽取每一個訂單 line item。

【重要提示】
- 你將收到 PDF 文件的視覺內容
- 請仔細查看所有表格、文字和格式
- 特別注意 Account No 和 Delivery Address 欄位
- 確保提取完整的送貨地址，包括郵政編碼

【資料庫結構】
必須返回以下格式的 JSON array：
- order_ref: 訂單參考號（去除前置零，例如 "000123" → 123）
- product_code: 產品代碼（準確提取）
- product_desc: 產品描述（完整描述）
- product_qty: 產品數量（必須為正整數）
- delivery_add: 完整的送貨地址（包括街道、城市、郵政編碼）
- account_num: 客戶帳號（從 Account No 欄位提取）

請只返回 JSON array，不要包含任何其他文字或說明。`;
    }
    
    // 發送到 OpenAI Vision API
    const openai = createOpenAIClient();
    console.log('[PDF Vision Analysis] Sending to OpenAI Vision API...');
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a JSON-only data extraction bot. Return ONLY valid JSON arrays. No explanations or markdown."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              // 添加所有轉換後的 PNG 圖片
              ...imageUrls.map(url => ({
                type: "image_url" as const,
                image_url: {
                  url: url,
                  detail: "high" as const
                }
              }))
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });
      
      console.log('[PDF Vision Analysis] OpenAI API call successful');
      console.log('[PDF Vision Analysis] Usage:', response.usage);
      
      const extractedContent = response.choices[0]?.message?.content;
      if (!extractedContent) {
        return NextResponse.json({ 
          error: 'No content extracted from OpenAI',
          details: 'Empty response from GPT-4o'
        }, { status: 500 });
      }
      
      console.log(`[PDF Vision Analysis] OpenAI response: ${extractedContent.length} chars`);
      
      // 解析 OpenAI 回應
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
        
        console.log(`[PDF Vision Analysis] Parsed ${orderData.length} records`);
        
      } catch (parseError: any) {
        console.error('[PDF Vision Analysis] Parse error:', parseError.message);
        console.error('[PDF Vision Analysis] Raw response:', extractedContent);
        return NextResponse.json({ 
          error: 'Failed to parse OpenAI response',
          details: parseError.message,
          rawResponse: extractedContent
        }, { status: 500 });
      }
      
      // 創建 Supabase 客戶端
      const supabaseAdmin = createSupabaseAdmin();
      
      // 數據庫插入
      if (orderData.length > 0) {
        try {
          const insertData = orderData.map(order => ({
            order_ref: String(order.order_ref),
            product_code: order.product_code,
            product_desc: order.product_desc,
            product_qty: String(order.product_qty),
            uploaded_by: String(uploadedBy),
            delivery_add: order.delivery_add || '-',
            account_num: order.account_num || '-'
          }));
          
          console.log('[PDF Vision Analysis] Inserting data:', insertData);
          
          const { data: insertResults, error: insertError } = await supabaseAdmin
            .from('data_order')
            .insert(insertData)
            .select();
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`[PDF Vision Analysis] Successfully inserted ${insertResults.length} records`);
          
          // 更新 doc_upload 表的 json 欄位和 token
          try {
            const totalTokens = response.usage?.total_tokens || 0;
            
            const { data: docRecord, error: findError } = await supabaseAdmin
              .from('doc_upload')
              .select('uuid')
              .eq('doc_name', fileName)
              .eq('upload_by', uploadedBy)
              .eq('doc_type', 'order')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (docRecord && !findError) {
              const { error: updateError } = await supabaseAdmin
                .from('doc_upload')
                .update({
                  json: JSON.stringify(orderData),
                  token: totalTokens
                })
                .eq('uuid', docRecord.uuid);
              
              if (updateError) {
                console.error('[PDF Vision Analysis] Failed to update doc_upload:', updateError);
              } else {
                console.log('[PDF Vision Analysis] Successfully updated doc_upload');
              }
            }
          } catch (updateError: any) {
            console.error('[PDF Vision Analysis] Error updating doc_upload:', updateError);
          }
          
          // 清理臨時圖片
          console.log('[PDF Vision Analysis] Cleaning up temporary images...');
          const supabaseAdmin = createSupabaseAdmin();
          for (const imageUrl of imageUrls) {
            try {
              const urlParts = imageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              await supabaseAdmin.storage
                .from('documents')
                .remove([`orderpdf/temp/${fileName}`]);
            } catch (cleanupError) {
              console.error('[PDF Vision Analysis] Error cleaning up image:', cleanupError);
            }
          }
          
          return NextResponse.json({
            success: true,
            message: `Successfully processed PDF and inserted ${insertResults.length} records`,
            recordCount: insertResults.length,
            extractedData: orderData,
            insertedRecords: insertResults,
            usage: response.usage
          });
          
        } catch (insertError: any) {
          console.error('[PDF Vision Analysis] Database insertion failed:', insertError.message);
          return NextResponse.json({ 
            error: 'Database insertion failed',
            details: insertError.message
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({
          success: true,
          message: 'PDF processed but no valid records found',
          recordCount: 0
        });
      }
      
    } catch (openaiError: any) {
      console.error('[PDF Vision Analysis] ❌ OpenAI API error:', openaiError);
      console.error('[PDF Vision Analysis] Error details:', {
        message: openaiError.message,
        status: openaiError.status,
        type: openaiError.type,
        code: openaiError.code
      });
      
      // 如果是因為不支持 PDF 格式，返回明確的錯誤訊息
      if (openaiError.message?.includes('unsupported') || 
          openaiError.message?.includes('image') ||
          openaiError.status === 400) {
        return NextResponse.json({ 
          error: 'PDF format not supported by Vision API',
          details: 'Please convert PDF to PNG first',
          originalError: openaiError.message
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'OpenAI API call failed',
        details: openaiError.message || 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[PDF Vision Analysis] ❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: 'PDF analysis failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}