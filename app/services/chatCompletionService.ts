/**
 * Chat Completion Service
 * 使用 OpenAI Chat Completions API 替代 Assistant API
 * 提供更穩定和快速的響應
 */

import OpenAI from 'openai';
import { systemLogger } from '@/lib/logger';
import { ExtractedPDFData } from './pdfExtractionService';

export interface OrderExtractionResult {
  orders: Array<{
    order_ref: string;
    account_num: string;
    delivery_add: string;
    invoice_to: string;
    customer_ref: string;
    product_code: string;
    product_desc: string;
    product_qty: number;
    weight?: number;
    unit_price?: string;
  }>;
  metadata?: {
    totalPages: number;
    extractionMethod: string;
    tokensUsed?: number;
  };
}

export class ChatCompletionService {
  private static instance: ChatCompletionService;
  private openai: OpenAI;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  public static getInstance(): ChatCompletionService {
    if (!ChatCompletionService.instance) {
      ChatCompletionService.instance = new ChatCompletionService();
    }
    return ChatCompletionService.instance;
  }

  /**
   * 使用 Chat Completions API 提取訂單數據
   */
  public async extractOrdersFromText(
    pdfText: string,
    extractedData: ExtractedPDFData
  ): Promise<OrderExtractionResult> {
    try {
      const startTime = Date.now();
      
      systemLogger.info({
        textLength: pdfText.length,
        numPages: extractedData.numPages,
      }, '[ChatCompletionService] Starting order extraction');

      // 準備系統提示詞
      const systemPrompt = this.buildSystemPrompt();
      
      // 準備用戶消息（包含 PDF 文本）
      const userMessage = this.buildUserMessage(pdfText, extractedData);

      // 調用 Chat Completions API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1, // 低溫度以提高一致性
        max_tokens: 4096,
        response_format: { type: 'json_object' }, // 強制 JSON 響應
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const tokensUsed = completion.usage?.total_tokens || 0;

      systemLogger.info({
        responseLength: responseText.length,
        tokensUsed,
        processingTime: Date.now() - startTime,
      }, '[ChatCompletionService] Received response from OpenAI');

      // 解析響應
      const result = this.parseResponse(responseText);
      
      // 添加元數據
      result.metadata = {
        totalPages: extractedData.numPages,
        extractionMethod: 'chat-completion',
        tokensUsed,
      };

      // 驗證結果
      this.validateResult(result, extractedData);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[ChatCompletionService] Failed to extract orders');
      
      // 返回空結果而不是拋出錯誤
      return {
        orders: [],
        metadata: {
          totalPages: extractedData.numPages,
          extractionMethod: 'chat-completion-failed',
        },
      };
    }
  }

  /**
   * 構建系統提示詞
   */
  private buildSystemPrompt(): string {
    return `你是一個專業的訂單數據提取專家。你的任務是從 PDF 文本中提取所有產品信息。

重要規則：
1. **只返回 JSON 格式**，不要任何解釋或其他文字
2. **掃描所有頁面**，確保不遺漏任何產品
3. **排除運輸費用**（Trans, TransDPD, TransC 等）
4. **每個產品一個記錄**

輸出格式：
{
  "orders": [
    {
      "order_ref": "訂單號（去除前導零）",
      "account_num": "帳號",
      "delivery_add": "送貨地址",
      "invoice_to": "發票地址",
      "customer_ref": "客戶參考號",
      "product_code": "產品代碼",
      "product_desc": "產品描述",
      "product_qty": 數量（整數）,
      "weight": 重量（可選）,
      "unit_price": "單價（可選）"
    }
  ]
}

產品識別規則：
- 產品代碼通常以字母開頭，後跟數字和可能的字母（如 MHL10, MHL15G）
- 排除 "Trans", "TransDPD", "TransC" 等運輸費用項目
- 每個產品包含：代碼、描述、數量
- 數量是 "Qty Req" 欄位的值

特別注意：
- 有些 PDF 有多頁，必須掃描所有頁面
- 頁面底部的產品容易被遺漏
- "Total Number Of Pages" 顯示總頁數`;
  }

  /**
   * 構建用戶消息
   */
  private buildUserMessage(pdfText: string, extractedData: ExtractedPDFData): string {
    let message = `請從以下 PDF 文本中提取所有訂單產品。這個 PDF 有 ${extractedData.numPages} 頁。\n\n`;
    
    // 如果文本太長，可能需要截斷或總結
    const maxTextLength = 30000; // 約 7500 tokens
    
    if (pdfText.length > maxTextLength) {
      systemLogger.warn({
        originalLength: pdfText.length,
        truncatedTo: maxTextLength,
      }, '[ChatCompletionService] Text truncated due to length');
      
      // 優先保留開頭（訂單信息）和產品表格部分
      const headerLength = 5000;
      const header = pdfText.substring(0, headerLength);
      const products = pdfText.substring(headerLength, maxTextLength);
      
      message += "=== PDF HEADER ===\n";
      message += header;
      message += "\n=== PRODUCTS SECTION ===\n";
      message += products;
      
      if (pdfText.length > maxTextLength) {
        message += "\n[注意：文本已被截斷，可能有產品未顯示]";
      }
    } else {
      message += pdfText;
    }
    
    message += "\n\n請提取所有產品，返回 JSON 格式。";
    
    return message;
  }

  /**
   * 解析 API 響應
   */
  private parseResponse(responseText: string): OrderExtractionResult {
    try {
      const parsed = JSON.parse(responseText);
      
      if (!parsed.orders || !Array.isArray(parsed.orders)) {
        systemLogger.error({
          response: responseText.substring(0, 500),
        }, '[ChatCompletionService] Invalid response format');
        
        return { orders: [] };
      }
      
      // 清理和標準化數據
      const orders = parsed.orders.map((order: any) => ({
        order_ref: String(order.order_ref || '').replace(/^0+/, ''), // 去除前導零
        account_num: String(order.account_num || '-'),
        delivery_add: String(order.delivery_add || '-'),
        invoice_to: String(order.invoice_to || '-'),
        customer_ref: String(order.customer_ref || '-'),
        product_code: String(order.product_code || ''),
        product_desc: String(order.product_desc || ''),
        product_qty: parseInt(order.product_qty) || 1,
        weight: order.weight ? parseFloat(order.weight) : undefined,
        unit_price: order.unit_price ? String(order.unit_price) : undefined,
      }));
      
      systemLogger.info({
        orderCount: orders.length,
        orderRef: orders[0]?.order_ref,
      }, '[ChatCompletionService] Successfully parsed response');
      
      return { orders };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
        responseStart: responseText.substring(0, 200),
      }, '[ChatCompletionService] Failed to parse response');
      
      return { orders: [] };
    }
  }

  /**
   * 驗證提取結果
   */
  private validateResult(result: OrderExtractionResult, extractedData: ExtractedPDFData): void {
    const warnings: string[] = [];
    
    // 檢查是否提取到產品
    if (result.orders.length === 0) {
      warnings.push('No products extracted');
    }
    
    // 檢查是否所有產品有相同的訂單號
    const orderRefs = new Set(result.orders.map(o => o.order_ref));
    if (orderRefs.size > 1) {
      warnings.push(`Multiple order refs found: ${Array.from(orderRefs).join(', ')}`);
    }
    
    // 對於多頁 PDF，檢查產品數量是否合理
    if (extractedData.numPages > 1 && result.orders.length < 5) {
      warnings.push(`Only ${result.orders.length} products found in ${extractedData.numPages}-page PDF`);
    }
    
    // 檢查必要字段
    const missingCodes = result.orders.filter(o => !o.product_code).length;
    if (missingCodes > 0) {
      warnings.push(`${missingCodes} products missing product code`);
    }
    
    if (warnings.length > 0) {
      systemLogger.warn({
        warnings,
        orderCount: result.orders.length,
        numPages: extractedData.numPages,
      }, '[ChatCompletionService] Validation warnings');
    }
  }

  /**
   * 分塊處理長文檔
   */
  public async extractOrdersInChunks(
    extractedData: ExtractedPDFData
  ): Promise<OrderExtractionResult> {
    const allOrders: OrderExtractionResult['orders'] = [];
    let totalTokensUsed = 0;
    
    // 按頁面處理
    for (const page of extractedData.pages) {
      systemLogger.info({
        pageNumber: page.pageNumber,
        textLength: page.text.length,
      }, '[ChatCompletionService] Processing page');
      
      // 創建單頁的 ExtractedPDFData
      const singlePageData: ExtractedPDFData = {
        ...extractedData,
        text: page.text,
        pages: [page],
        numPages: 1,
      };
      
      const result = await this.extractOrdersFromText(page.text, singlePageData);
      
      if (result.orders.length > 0) {
        allOrders.push(...result.orders);
        totalTokensUsed += result.metadata?.tokensUsed || 0;
      }
      
      // 添加延遲以避免速率限制
      if (page.pageNumber < extractedData.numPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 去重（基於產品代碼和數量）
    const uniqueOrders = this.deduplicateOrders(allOrders);
    
    return {
      orders: uniqueOrders,
      metadata: {
        totalPages: extractedData.numPages,
        extractionMethod: 'chat-completion-chunked',
        tokensUsed: totalTokensUsed,
      },
    };
  }

  /**
   * 去除重複的訂單項目
   */
  private deduplicateOrders(orders: OrderExtractionResult['orders']): OrderExtractionResult['orders'] {
    const seen = new Set<string>();
    const unique: OrderExtractionResult['orders'] = [];
    
    for (const order of orders) {
      const key = `${order.product_code}-${order.product_qty}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(order);
      }
    }
    
    if (unique.length < orders.length) {
      systemLogger.info({
        original: orders.length,
        deduplicated: unique.length,
        removed: orders.length - unique.length,
      }, '[ChatCompletionService] Removed duplicate orders');
    }
    
    return unique;
  }

  /**
   * 使用備用模型重試
   */
  public async retryWithFallbackModel(
    pdfText: string,
    extractedData: ExtractedPDFData
  ): Promise<OrderExtractionResult> {
    systemLogger.info('[ChatCompletionService] Retrying with fallback model gpt-4o-mini');
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // 更快更便宜的備用模型
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserMessage(pdfText, extractedData) }
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const result = this.parseResponse(responseText);
      
      result.metadata = {
        totalPages: extractedData.numPages,
        extractionMethod: 'chat-completion-fallback',
        tokensUsed: completion.usage?.total_tokens,
      };
      
      return result;
    } catch (error) {
      systemLogger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, '[ChatCompletionService] Fallback model also failed');
      
      return {
        orders: [],
        metadata: {
          totalPages: extractedData.numPages,
          extractionMethod: 'failed',
        },
      };
    }
  }
}