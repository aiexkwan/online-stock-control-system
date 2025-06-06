import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    console.log('[Test OpenAI API] 開始測試 OpenAI...');
    
    // 創建 OpenAI 客戶端
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({ apiKey });
    
    // 測試用的簡單 prompt
    const testPrompt = `
You are a JSON-only data extraction bot. You must ONLY output valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON.

Extract order information from this sample text:
"Order #12345 for Customer ABC Ltd, Product Code: PROD001, Description: Test Product, Quantity: 10, Price: £12.50"

Return ONLY a JSON array with this exact format:
[{"account_num":0,"order_ref":12345,"customer_ref":0,"invoice_to":"ABC Ltd","delivery_add":"NOT_FOUND","product_code":"PROD001","product_desc":"Test Product","product_qty":10,"unit_price":1250}]

Remember: ONLY return the JSON array, nothing else.`;
    
    console.log('[Test OpenAI API] 發送測試請求到 OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only data extraction bot. You must ONLY output valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON. Your entire response must be parseable by JSON.parse()."
        },
        {
          role: "user",
          content: testPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });
    
    console.log('[Test OpenAI API] OpenAI 回應接收完成');
    
    const extractedContent = response.choices[0]?.message?.content;
    
    if (!extractedContent) {
      return NextResponse.json({ 
        error: 'No content from OpenAI',
        response: response
      }, { status: 500 });
    }
    
    console.log('[Test OpenAI API] 原始回應:', extractedContent);
    console.log('[Test OpenAI API] 回應長度:', extractedContent.length);
    console.log('[Test OpenAI API] 回應類型:', typeof extractedContent);
    
    // 嘗試解析 JSON
    let parsedData;
    let parseError = null;
    
    try {
      // 清理內容
      let cleanContent = extractedContent.trim();
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
      
      console.log('[Test OpenAI API] 清理後內容:', cleanContent);
      
      parsedData = JSON.parse(cleanContent);
      console.log('[Test OpenAI API] JSON 解析成功:', parsedData);
    } catch (error: any) {
      parseError = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      };
      console.error('[Test OpenAI API] JSON 解析失敗:', parseError);
    }
    
    return NextResponse.json({
      success: true,
      originalContent: extractedContent,
      contentLength: extractedContent.length,
      contentType: typeof extractedContent,
      parsedData: parsedData,
      parseError: parseError,
      isValidJSON: parseError === null,
      openaiResponse: {
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason
      }
    });
    
  } catch (error: any) {
    console.error('[Test OpenAI API] 意外錯誤:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 