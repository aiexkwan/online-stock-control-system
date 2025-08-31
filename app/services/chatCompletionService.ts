/**
 * Chat Completion Service
 * 使用 OpenAI Chat Completions API 替代 Assistant API
 * 提供更穩定和快速的響應
 */

import OpenAI from 'openai';
import { systemLogger } from '@/lib/logger';
import { ExtractedPDFData } from './pdfExtractionService';
import productCodeValidator, { ValidationResult } from './productCodeValidator';
import { extractionMonitor, ExtractionResult } from './extractionMonitor';
import { ProductCodeCleaner } from './productCodeCleaner';

// Type definitions for error handling
interface OpenAIApiError extends Error {
  response?: {
    status: number;
    statusText?: string;
    data?: unknown;
  };
  code?: string;
  type?: string;
  status?: number;
}

interface ErrorDetails {
  error: string;
  type?: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  hint?: string;
  apiKeyPresent?: boolean;
  apiKeyPrefix?: string;
  vercelRegion?: string;
  suggestions?: string[];
  model?: string;
}

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
    is_validated?: boolean;
    was_corrected?: boolean;
    original_code?: string;
    confidence_score?: number;
  }>;
  metadata?: {
    totalPages: number;
    extractionMethod: string;
    tokensUsed?: number;
    error?: string;
    promptVariant?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    validationSummary?: {
      total: number;
      valid: number;
      corrected: number;
      invalid: number;
    };
  };
}

export class ChatCompletionService {
  private static instance: ChatCompletionService;
  private openai: OpenAI;
  private validator: typeof productCodeValidator;
  private monitor = extractionMonitor;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // 初始化 ProductCodeValidator
    this.validator = productCodeValidator;

    // 診斷 API key 格式
    systemLogger.info(
      {
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10),
        apiKeySuffix: apiKey.substring(apiKey.length - 4),
        hasCorrectPrefix: apiKey.startsWith('sk-'),
        nodeEnv: process.env.NODE_ENV,
      },
      '[ChatCompletionService] Initializing with API key'
    );

    // 配置 OpenAI 客戶端 - 根據 Vercel 區域自動選擇最佳端點
    const getOptimalBaseURL = () => {
      const vercelRegion = process.env.VERCEL_REGION;

      // 如果明確設定了 EU endpoint，使用它
      if (process.env.OPENAI_EU_ENDPOINT) {
        return process.env.OPENAI_EU_ENDPOINT;
      }

      // 根據 Vercel 區域選擇最佳端點
      if (vercelRegion?.startsWith('eu-') || vercelRegion === 'lhr1' || vercelRegion === 'fra1') {
        return 'https://api.openai.com/v1'; // 歐洲區域用標準端點
      }

      // 默認使用標準美國端點
      return 'https://api.openai.com/v1';
    };

    const baseURL = getOptimalBaseURL();

    systemLogger.info(
      {
        baseURL,
        vercelRegion: process.env.VERCEL_REGION,
        hasEuEndpoint: !!process.env.OPENAI_EU_ENDPOINT,
      },
      '[ChatCompletionService] OpenAI endpoint selected'
    );

    this.openai = new OpenAI({
      apiKey,
      baseURL,
      // 增加 timeout 同 retry 設定
      maxRetries: 3,
      timeout: 30000, // 30 seconds
    });
  }

  public static getInstance(): ChatCompletionService {
    if (!ChatCompletionService.instance) {
      ChatCompletionService.instance = new ChatCompletionService();
    }
    return ChatCompletionService.instance;
  }

  /**
   * 使用 Chat Completions API 提取訂單數據（含自動重試機制）
   */
  public async extractOrdersFromText(
    pdfText: string,
    extractedData: ExtractedPDFData,
    maxRetries: number = 2
  ): Promise<OrderExtractionResult> {
    let lastError: Error | null = null;
    const overallStartTime = Date.now();

    // 重試機制
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        systemLogger.info(
          {
            textLength: pdfText.length,
            numPages: extractedData.numPages,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
          },
          '[ChatCompletionService] Starting order extraction'
        );

        // 檢測 PDF 複雜度
        const complexity = this.detectPDFComplexity(pdfText, extractedData);

        // 獲取 A/B 測試變體
        const variant = this.monitor.getPromptVariant();

        // 準備系統提示詞
        const systemPrompt = this.buildSystemPrompt(complexity, variant?.id);

        // 準備用戶消息（包含 PDF 文本）
        const userMessage = this.buildUserMessage(pdfText, extractedData);

        // 調用 Chat Completions API
        // 使用 gpt-4o (如果有權限) 或 gpt-4-turbo
        const modelToUse = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // 改用更穩定嘅 mini model

        systemLogger.info(
          {
            model: modelToUse,
            apiKeyPresent: !!process.env.OPENAI_API_KEY,
            apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10),
            baseURL: this.openai.baseURL,
            region: process.env.VERCEL_REGION || 'unknown',
          },
          '[ChatCompletionService] Using model'
        );

        const completion = await this.openai.chat.completions.create({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.1, // 低溫度以提高一致性
          max_tokens: 4096,
          response_format: { type: 'json_object' }, // 強制 JSON 響應
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const tokensUsed = completion.usage?.total_tokens || 0;

        // 添加原始響應日誌以調試數量問題
        if (pdfText.includes('MHEASYB') && pdfText.includes('840')) {
          systemLogger.info(
            {
              rawResponse: responseText,
              fileName: extractedData.fileName,
            },
            '[ChatCompletionService] Debug: Raw AI response for MHEASYB 840 case'
          );
        }

        systemLogger.info(
          {
            responseLength: responseText.length,
            tokensUsed,
            processingTime: Date.now() - startTime,
            complexity,
            promptVariant: variant?.id,
          },
          '[ChatCompletionService] Received response from OpenAI'
        );

        // 解析響應（集成 ProductCodeValidator）
        const result = await this.parseResponse(responseText, tokensUsed);

        // 添加元數據
        result.metadata = {
          totalPages: extractedData.numPages,
          extractionMethod: 'chat-completion',
          tokensUsed,
          promptVariant: variant?.id,
          complexity,
          validationSummary: result.metadata?.validationSummary,
        };

        // 驗證結果
        this.validateResult(result, extractedData);

        // 記錄監控指標
        this.trackExtractionMetrics({
          success: true,
          extractionTime: Date.now() - startTime,
          tokensUsed,
          orderCount: result.orders.length,
          correctedCount: result.orders.filter(o => o.was_corrected).length,
          invalidCount: result.orders.filter(o => !o.is_validated).length,
          cacheHitCount: 0, // 將由 ProductCodeValidator 提供
          method: 'chat-completion',
          model: modelToUse,
          promptVariant: variant?.id,
          complexity,
          fileName: extractedData.fileName,
        });

        return result;
      } catch (error: unknown) {
        lastError = error as Error;
        const apiError = error as OpenAIApiError;
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

        systemLogger.warn(
          {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: errorMessage,
          },
          '[ChatCompletionService] Extraction attempt failed'
        );

        // 如果還有重試次數，繼續重試
        if (attempt < maxRetries) {
          // 等待一段時間再重試
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    // 所有重試都失敗，處理最終錯誤
    if (lastError) {
      const apiError = lastError as OpenAIApiError;
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

      // 提供更詳細的錯誤診斷
      let errorDetails: ErrorDetails = {
        error: errorMessage,
        type: apiError?.type || apiError?.code || 'unknown',
      };

      // 檢查 OpenAI 特定錯誤
      if (apiError?.response) {
        errorDetails.status = apiError.response.status;
        errorDetails.statusText = apiError.response.statusText;
        errorDetails.data = apiError.response.data;

        // 更詳細嘅錯誤診斷
        if (apiError.response.status === 401) {
          errorDetails.hint = 'Invalid API key. Please check OPENAI_API_KEY in Vercel dashboard';
        } else if (apiError.response.status === 429) {
          errorDetails.hint = 'Rate limit exceeded or quota exhausted';
        } else if (apiError.response.status === 404) {
          errorDetails.hint = `Model not found. You may not have access to this model`;
        }
      }

      // 檢查是否是 API Key 問題
      if (
        errorMessage.includes('apikey') ||
        errorMessage.includes('API key') ||
        errorMessage.includes('Incorrect API key')
      ) {
        errorDetails.hint = 'Check if OPENAI_API_KEY is valid in Vercel Environment Variables';
      }

      // 檢查是否是額度問題
      if (
        errorMessage.includes('quota') ||
        errorMessage.includes('limit') ||
        errorMessage.includes('insufficient')
      ) {
        errorDetails.hint = 'OpenAI API quota may be exceeded';
      }

      // 檢查網絡問題
      if (
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('Connection')
      ) {
        errorDetails.hint = 'Network connection issue or OpenAI API is unreachable';
        errorDetails.apiKeyPresent = !!process.env.OPENAI_API_KEY;
        errorDetails.apiKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 10);
        errorDetails.vercelRegion = process.env.VERCEL_REGION;
        errorDetails.suggestions = [
          '1. Verify API key is valid at platform.openai.com',
          '2. Check if your OpenAI account has available credits',
          '3. Try using gpt-3.5-turbo or gpt-4o-mini model',
          '4. Check OpenAI API status at status.openai.com',
        ];
      }

      systemLogger.error(errorDetails, '[ChatCompletionService] Failed to extract orders');

      // 記錄監控指標（失敗情況）
      this.trackExtractionMetrics({
        success: false,
        extractionTime: Date.now() - overallStartTime,
        tokensUsed: 0,
        orderCount: 0,
        correctedCount: 0,
        invalidCount: 0,
        cacheHitCount: 0,
        method: 'chat-completion',
        model: 'unknown',
        error: errorDetails.hint || errorMessage,
        fileName: extractedData.fileName,
      });

      // 返回空結果而不是拋出錯誤
      return {
        orders: [],
        metadata: {
          totalPages: extractedData.numPages,
          extractionMethod: 'chat-completion-failed',
          error: errorDetails.hint || errorMessage,
        },
      };
    }

    // 如果沒有錯誤但也沒有結果，返回空結果
    return {
      orders: [],
      metadata: {
        totalPages: extractedData.numPages,
        extractionMethod: 'chat-completion-unknown-failure',
        error: 'Unknown extraction failure after all retries',
      },
    };
  }

  /**
   * 構建動態系統提示詞（根據複雜度和 A/B 測試變體）
   */
  private buildSystemPrompt(
    complexity?: 'simple' | 'medium' | 'complex',
    _promptVariant?: string
  ): string {
    // 獲取 A/B 測試變體
    const variant = this.monitor.getPromptVariant();

    // 基礎簡化版本（移除 product_desc 要求，節省 token）
    const basePrompt = `Extract product orders from PDF, return JSON only.

Format:
{
  "orders": [
    {
      "order_ref": "string",
      "account_num": "string", 
      "delivery_add": "string",
      "invoice_to": "string",
      "customer_ref": "string",
      "product_code": "EXACT_CODE",
      "product_qty": number,
      "unit_price": "string (optional)"
    }
  ]
}

Rules:
- Skip Trans*/shipping items
- Return valid JSON without explanation
- CRITICAL: Extract COMPLETE product codes - never truncate or abbreviate
- Product codes can have numbers at the end (e.g., ME6045150, UT054B90L)
- Extract the FULL product code including all digits and letters
- Remove leading zeros from order_ref
- CRITICAL: Extract complete quantities - if you see "840", return 840 not 40
- Double-check large quantities (>100) are extracted in full
- IMPORTANT: Use "Qty Req" column for quantities, IGNORE "Pallet Qty" lines
- "Pallet Qty" is noise/metadata - NOT the actual order quantity
- CRITICAL: The "Qty Req" column is AFTER "Unit Price" column
- Unit Price contains decimals (e.g., 143.28) - DO NOT confuse with quantity
- Quantity is the integer value in "Qty Req" column, typically 1, 2, or small numbers
- If you see format like "143.28 1" - the quantity is 1, NOT 8 or 28
- CRITICAL: For addresses, extract COMPLETE multi-line addresses, not just first line
- Look for "Invoice To:" label followed by company name and address lines
- Look for "Delivery Address:" label followed by delivery address lines
- Do NOT confuse form field labels with actual addresses (ignore "Driver", "Tel No:", etc.)
- "Invoice To:" section contains full company name + address - extract ALL lines after this label
- "Delivery Address:" section contains full delivery address - extract ALL lines after this label
- Join multi-line addresses with ", " (comma space) as separator
- EXCLUDE email addresses and phone numbers from addresses
- Do NOT include "Tel:", "Email:", phone numbers, or email addresses in address fields
- Only include company _name, street address, city, region, and postcode
- Ignore empty form fields and labels like "Driver", "Tel No:", "Booked In"`;

    // 根據複雜度添加 few-shot examples
    if (complexity === 'complex' || (variant && variant.id === 'detailed')) {
      return basePrompt + this.getFewShotExamples();
    }

    // 簡化版本（用於 A/B 測試）
    if (variant && variant.id === 'simplified') {
      return `Extract orders as JSON:
{"orders":[{"order_ref":"str","account_num":"str","delivery_add":"str","invoice_to":"str","customer_ref":"str","product_code":"str","product_qty":num,"unit_price":"str"}]}
Skip Trans* items. Extract COMPLETE product codes (never truncate) and quantities.`;
    }

    return basePrompt;
  }

  /**
   * 獲取 Few-shot 示例（僅在複雜情況下使用）
   */
  private getFewShotExamples(): string {
    return `\n\nExamples:\n\nInput: "Order: 12345, _Product: MHL10G Widget Qty: 5"
Output: {"orders":[{"order_ref":"12345","product_code":"MHL10G","product_qty":5}]}

Input: "Trans shipping: £15.00, _Product: ABC123 Part Qty: 3"
Output: {"orders":[{"product_code":"ABC123","product_qty":3}]}

CRITICAL: In table format, columns are typically:
Code | Pack Size | Description | Weight | Unit Price | Qty Req

The QUANTITY is the LAST NUMBER in each row (Qty Req column).
DO NOT confuse Unit Price (which has decimals like 143.28) with quantity.

Example patterns:
"CODE123 1 Product Name 17 143.28 1" → code=CODE123, qty=1 (NOT 143 or 28)
"ITEM456 Pack Description 7 3.20 72" → code=ITEM456, qty=72 (NOT 3 or 20)
"PROD789ABC 1 Item Name 15 179.10 2" → code=PROD789ABC, qty=2 (FULL code, NOT truncated)

CRITICAL: Product codes can be alphanumeric with letters/numbers at the end - extract completely

ADDRESS EXTRACTION EXAMPLES:
Invoice To:
Company ABC Ltd
123 Main Street
Business Park
London
SW1A 1AA
Tel: 020 1234 5678
Email: info@company.co.uk
→ "invoice_to": "Company ABC Ltd, 123 Main Street, Business Park, London, SW1A 1AA"

Delivery Address:
Unit 5 Industrial Estate
456 Factory Road
Manchester
M1 2AB
Tel: 0161 123 4567
→ "delivery_add": "Unit 5 Industrial Estate, 456 Factory Road, Manchester, M1 2AB"

COMMON MISTAKES TO AVOID:
❌ WRONG: "invoice_to": "Driver" (this is a form field label, not address)
✅ CORRECT: "invoice_to": "Drain Depot Ltd, Unit D Alpha Centre, Cheney Manor, Swindon, Wilts, SN2 2QJ"

❌ WRONG: Extracting form field labels like "Driver", "Tel No:", "Booked In" as addresses
✅ CORRECT: Only extract content AFTER "Invoice To:" and "Delivery Address:" labels

CRITICAL: Skip Tel:, Email:, phone numbers, email addresses, and form field labels in address extraction`;
  }

  /**
   * 構建用戶消息
   */
  private buildUserMessage(pdfText: string, extractedData: ExtractedPDFData): string {
    let message = `請從以下 PDF 文本中提取所有訂單產品。這個 PDF 有 ${extractedData.numPages} 頁。\n\n`;

    // 如果文本太長，可能需要截斷或總結
    const maxTextLength = 30000; // 約 7500 tokens

    if (pdfText.length > maxTextLength) {
      systemLogger.warn(
        {
          originalLength: pdfText.length,
          truncatedTo: maxTextLength,
        },
        '[ChatCompletionService] Text truncated due to length'
      );

      // 優先保留開頭（訂單信息）和產品表格部分
      const headerLength = 5000;
      const header = pdfText.substring(0, headerLength);
      const products = pdfText.substring(headerLength, maxTextLength);

      message += '=== PDF HEADER ===\n';
      message += header;
      message += '\n=== PRODUCTS SECTION ===\n';
      message += products;

      if (pdfText.length > maxTextLength) {
        message += '\n[注意：文本已被截斷，可能有產品未顯示]';
      }
    } else {
      message += pdfText;
    }

    message += '\n\n請提取所有產品，返回 JSON 格式。';

    return message;
  }

  /**
   * 解析 API 響應（集成 ProductCodeValidator）
   */
  private async parseResponse(
    responseText: string,
    tokensUsed: number
  ): Promise<OrderExtractionResult> {
    try {
      const parsed = JSON.parse(responseText);

      if (!parsed.orders || !Array.isArray(parsed.orders)) {
        systemLogger.error(
          {
            response: responseText.substring(0, 500),
          },
          '[ChatCompletionService] Invalid response format'
        );

        return { orders: [] };
      }

      // 提取產品代碼並清理（先清理再驗證）
      const rawCodes = parsed.orders.map((order: OrderExtractionResult['orders'][0]) => {
        const rawCode = String(order.product_code || '');
        // 使用 ProductCodeCleaner 清理代碼
        return ProductCodeCleaner.cleanProductCode(rawCode);
      });

      // 使用 ProductCodeValidator 驗證和豐富化
      let validation: ValidationResult;
      let enrichedOrders: OrderExtractionResult['orders'] = [];

      try {
        validation = await this.validator.validateAndEnrichCodes(rawCodes);

        // 構建最終結果（包含從資料庫獲取的 product_desc）
        enrichedOrders = parsed.orders.map(
          (order: OrderExtractionResult['orders'][0], index: number) => {
            const enrichedData = validation.enrichedOrders[index];
            const originalRawCode = String(order.product_code || '');
            const cleanedCode = rawCodes[index]; // 已清理的代碼

            // 檢查是否經過 ProductCodeCleaner 修正
            const wasCleanerCorrected = originalRawCode !== cleanedCode;

            return {
              order_ref: String(order.order_ref || '').replace(/^0+/, ''), // 去除前導零
              account_num: String(order.account_num || '-'),
              delivery_add: String(order.delivery_add || '-'),
              invoice_to: String(order.invoice_to || '-'),
              customer_ref: String(order.customer_ref || '-'),
              product_code: enrichedData.product_code,
              product_desc: enrichedData.product_desc, // 從資料庫獲取
              product_qty: Math.floor(Number(order.product_qty)) || 1,
              weight: undefined,
              unit_price: order.unit_price ? String(order.unit_price) : undefined,
              is_validated: enrichedData.is_valid,
              was_corrected: enrichedData.was_corrected || wasCleanerCorrected,
              original_code: wasCleanerCorrected ? originalRawCode : enrichedData.original_code,
              confidence_score: enrichedData.confidence_score,
            };
          }
        );

        // 記錄清理和驗證的統計
        const cleanerCorrectedCount = enrichedOrders.filter(o => {
          const idx = enrichedOrders.indexOf(o);
          return parsed.orders[idx]?.product_code !== rawCodes[idx];
        }).length;

        systemLogger.info(
          {
            orderCount: enrichedOrders.length,
            validationSummary: validation.summary,
            cleanerCorrectedCount,
            orderRef: enrichedOrders[0]?.order_ref,
          },
          '[ChatCompletionService] Successfully parsed, cleaned and validated response'
        );

        return {
          orders: enrichedOrders,
          metadata: {
            totalPages: 1, // 將由呼叫者覆蓋
            extractionMethod: 'chat-completion',
            validationSummary: validation.summary,
          },
        };
      } catch (validationError) {
        // 降級策略：資料庫驗證失敗時使用原始數據
        systemLogger.warn(
          {
            error:
              validationError instanceof Error
                ? validationError.message
                : 'Unknown validation error',
            fallbackToOriginal: true,
          },
          '[ChatCompletionService] Validation failed, using original data'
        );

        enrichedOrders = parsed.orders.map((order: OrderExtractionResult['orders'][0]) => ({
          order_ref: String(order.order_ref || '').replace(/^0+/, ''),
          account_num: String(order.account_num || '-'),
          delivery_add: String(order.delivery_add || '-'),
          invoice_to: String(order.invoice_to || '-'),
          customer_ref: String(order.customer_ref || '-'),
          product_code: String(order.product_code || ''),
          product_desc: 'Validation unavailable - please verify manually',
          product_qty: parseInt(String(order.product_qty)) || 1,
          weight: undefined,
          unit_price: order.unit_price ? String(order.unit_price) : undefined,
          is_validated: false,
          was_corrected: false,
        }));

        return {
          orders: enrichedOrders,
          metadata: {
            totalPages: 1, // 將由呼叫者覆蓋
            extractionMethod: 'chat-completion',
            validationSummary: {
              total: enrichedOrders.length,
              valid: 0,
              corrected: 0,
              invalid: enrichedOrders.length,
            },
          },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error(
        {
          error: errorMessage,
          responseStart: responseText.substring(0, 200),
        },
        '[ChatCompletionService] Failed to parse response'
      );

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
      warnings.push(
        `Only ${result.orders.length} products found in ${extractedData.numPages}-page PDF`
      );
    }

    // 檢查必要字段
    const missingCodes = result.orders.filter(o => !o.product_code).length;
    if (missingCodes > 0) {
      warnings.push(`${missingCodes} products missing product code`);
    }

    if (warnings.length > 0) {
      systemLogger.warn(
        {
          warnings,
          orderCount: result.orders.length,
          numPages: extractedData.numPages,
        },
        '[ChatCompletionService] Validation warnings'
      );
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
      systemLogger.info(
        {
          pageNumber: page.pageNumber,
          textLength: page.text.length,
        },
        '[ChatCompletionService] Processing page'
      );

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
  private deduplicateOrders(
    orders: OrderExtractionResult['orders']
  ): OrderExtractionResult['orders'] {
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
      systemLogger.info(
        {
          original: orders.length,
          deduplicated: unique.length,
          removed: orders.length - unique.length,
        },
        '[ChatCompletionService] Removed duplicate orders'
      );
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
    // 使用 fallback model - 預設 gpt-3.5-turbo 更穩定
    const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo';

    systemLogger.info(
      {
        model: fallbackModel,
        reason: 'Primary model failed, trying fallback',
      },
      '[ChatCompletionService] Using fallback model'
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: fallbackModel,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserMessage(pdfText, extractedData) },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const fallbackStartTime = Date.now();

      const result = await this.parseResponse(responseText, tokensUsed);

      result.metadata = {
        ...result.metadata,
        totalPages: extractedData.numPages,
        extractionMethod: 'chat-completion-fallback',
        tokensUsed,
      };

      // 記錄監控指標（fallback 成功）
      this.trackExtractionMetrics({
        success: true,
        extractionTime: Date.now() - fallbackStartTime,
        tokensUsed,
        orderCount: result.orders.length,
        correctedCount: result.orders.filter(o => o.was_corrected).length,
        invalidCount: result.orders.filter(o => !o.is_validated).length,
        cacheHitCount: 0,
        method: 'chat-completion-fallback',
        model: fallbackModel,
        fileName: extractedData.fileName,
      });

      return result;
    } catch (error: unknown) {
      const apiError = error as OpenAIApiError;
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

      // 詳細錯誤診斷
      let errorDetails: ErrorDetails = {
        error: errorMessage,
        type: apiError?.type || apiError?.code || 'unknown',
        model: fallbackModel,
      };

      if (apiError?.response) {
        errorDetails.status = apiError.response.status;
        errorDetails.data = apiError.response.data;
      }

      if (errorMessage.includes('Connection')) {
        errorDetails.hint = 'Both primary and fallback models failed - check OpenAI API status';
        errorDetails.apiKeyPresent = !!process.env.OPENAI_API_KEY;
      }

      systemLogger.error(errorDetails, '[ChatCompletionService] Fallback model also failed');

      // 記錄監控指標（fallback 失敗）
      this.trackExtractionMetrics({
        success: false,
        extractionTime: Date.now() - Date.now(), // fallback 時間無法精確計算
        tokensUsed: 0,
        orderCount: 0,
        correctedCount: 0,
        invalidCount: 0,
        cacheHitCount: 0,
        method: 'chat-completion-fallback',
        model: fallbackModel,
        error: errorDetails.hint || errorMessage,
        fileName: extractedData.fileName,
      });

      return {
        orders: [],
        metadata: {
          totalPages: extractedData.numPages,
          extractionMethod: 'failed',
        },
      };
    }
  }

  /**
   * 檢測 PDF 複雜度
   */
  private detectPDFComplexity(
    pdfText: string,
    extractedData: ExtractedPDFData
  ): 'simple' | 'medium' | 'complex' {
    const textLength = pdfText.length;
    const pageCount = extractedData.numPages;

    // 如果包含MHL產品和Pallet Qty，需要複雜模式
    if (pdfText.includes('MHL') && pdfText.includes('Pallet Qty')) {
      return 'complex'; // 強制使用複雜模式以包含例子
    }

    // 簡單判斷標準
    if (pageCount === 1 && textLength < 5000) {
      return 'simple';
    }

    if (pageCount <= 3 && textLength < 15000) {
      return 'medium';
    }

    return 'complex';
  }

  /**
   * 記錄提取指標到監控系統
   */
  private trackExtractionMetrics(result: ExtractionResult): void {
    try {
      this.monitor.trackExtraction(result);
    } catch (error) {
      systemLogger.warn(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        '[ChatCompletionService] Failed to track extraction metrics'
      );
    }
  }
}
