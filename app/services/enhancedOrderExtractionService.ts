/**
 * Enhanced Order Extraction Service
 * 整合 PDF 提取和 Chat Completions API
 * 提供多層 fallback 機制確保高可靠性
 */

import { PDFExtractionService } from './pdfExtractionService';
import { ChatCompletionService, OrderExtractionResult } from './chatCompletionService';
import { AssistantService } from './assistantService';
import { systemLogger } from '@/lib/logger';
import { SYSTEM_PROMPT } from '@/lib/openai-assistant-config';

export interface EnhancedExtractionResult {
  success: boolean;
  data?: {
    order_ref: string;
    account_num: string;
    delivery_add: string;
    invoice_to: string;
    customer_ref: string;
    products: Array<{
      product_code: string;
      product_desc: string;
      product_qty: number;
      weight?: number;
      unit_price: string;
    }>;
  };
  extractionMethod: 'pdf-chat' | 'pdf-chat-chunked' | 'assistant-fallback' | 'failed';
  metadata: {
    productsExtracted: number;
    pagesProcessed: number;
    tokensUsed?: number;
    processingTime: number;
    fallbackUsed: boolean;
  };
  error?: string;
}

export class EnhancedOrderExtractionService {
  private static instance: EnhancedOrderExtractionService;
  private pdfService: PDFExtractionService;
  private chatService: ChatCompletionService;
  private assistantService: AssistantService;

  private constructor() {
    this.pdfService = PDFExtractionService.getInstance();
    this.chatService = ChatCompletionService.getInstance();
    this.assistantService = AssistantService.getInstance();
  }

  public static getInstance(): EnhancedOrderExtractionService {
    if (!EnhancedOrderExtractionService.instance) {
      EnhancedOrderExtractionService.instance = new EnhancedOrderExtractionService();
    }
    return EnhancedOrderExtractionService.instance;
  }

  /**
   * 主要提取方法
   */
  public async extractOrderFromPDF(
    fileBuffer: ArrayBuffer,
    fileName: string
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    
    try {
      systemLogger.info({
        fileName,
        bufferSize: fileBuffer.byteLength,
      }, '[EnhancedOrderExtraction] Starting extraction');

      // 步驟 1: 提取 PDF 文本
      const extractedData = await this.pdfService.extractText(fileBuffer);
      
      // 驗證提取的文本
      const validation = this.pdfService.validateExtractedText(extractedData.text);
      if (!validation.isValid) {
        systemLogger.warn({
          missingElements: validation.missingElements,
        }, '[EnhancedOrderExtraction] PDF validation failed, but continuing');
      }

      // 獲取元數據
      const metadata = this.pdfService.extractMetadata(extractedData.text);
      systemLogger.info({
        metadata,
      }, '[EnhancedOrderExtraction] Metadata extracted');

      // 步驟 2: 預處理文本
      const processedText = this.pdfService.preprocessTextForLLM(extractedData);

      // 步驟 3: 使用 Chat Completions API 提取訂單
      let result = await this.chatService.extractOrdersFromText(processedText, extractedData);
      
      // 步驟 4: 如果結果不理想，嘗試分塊處理
      if (result.orders.length === 0 || 
          (extractedData.numPages > 1 && result.orders.length < 5)) {
        systemLogger.info('[EnhancedOrderExtraction] Trying chunked extraction');
        result = await this.chatService.extractOrdersInChunks(extractedData);
      }

      // 步驟 5: 如果仍然失敗，使用備用模型
      if (result.orders.length === 0) {
        systemLogger.info('[EnhancedOrderExtraction] Trying fallback model');
        result = await this.chatService.retryWithFallbackModel(processedText, extractedData);
      }

      // 步驟 6: 最後的 fallback - 使用原有的 Assistant API
      if (result.orders.length === 0) {
        systemLogger.warn('[EnhancedOrderExtraction] All Chat API methods failed, falling back to Assistant API');
        return await this.fallbackToAssistantAPI(fileBuffer, fileName);
      }

      // 轉換結果格式
      const enhancedResult = this.convertToEnhancedResult(result, extractedData, startTime);
      
      systemLogger.info({
        success: enhancedResult.success,
        productsExtracted: enhancedResult.metadata.productsExtracted,
        method: enhancedResult.extractionMethod,
        processingTime: enhancedResult.metadata.processingTime,
      }, '[EnhancedOrderExtraction] Extraction completed');

      return enhancedResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
        fileName,
      }, '[EnhancedOrderExtraction] Extraction failed');

      // 嘗試 Assistant API 作為最後手段
      return await this.fallbackToAssistantAPI(fileBuffer, fileName);
    }
  }

  /**
   * 轉換結果格式
   */
  private convertToEnhancedResult(
    result: OrderExtractionResult,
    extractedData: any,
    startTime: number
  ): EnhancedExtractionResult {
    if (!result.orders || result.orders.length === 0) {
      return {
        success: false,
        extractionMethod: 'failed',
        metadata: {
          productsExtracted: 0,
          pagesProcessed: extractedData.numPages,
          processingTime: Date.now() - startTime,
          fallbackUsed: false,
        },
        error: 'No products extracted',
      };
    }

    // 獲取第一個訂單的共同信息
    const firstOrder = result.orders[0];
    
    // 構建產品列表
    const products = result.orders.map(order => ({
      product_code: order.product_code,
      product_desc: order.product_desc,
      product_qty: order.product_qty,
      weight: order.weight,
      unit_price: order.unit_price || '0',
    }));

    // 確定提取方法
    let extractionMethod: EnhancedExtractionResult['extractionMethod'] = 'pdf-chat';
    if (result.metadata?.extractionMethod === 'chat-completion-chunked') {
      extractionMethod = 'pdf-chat-chunked';
    }

    return {
      success: true,
      data: {
        order_ref: firstOrder.order_ref,
        account_num: firstOrder.account_num,
        delivery_add: firstOrder.delivery_add,
        invoice_to: firstOrder.invoice_to,
        customer_ref: firstOrder.customer_ref,
        products,
      },
      extractionMethod,
      metadata: {
        productsExtracted: products.length,
        pagesProcessed: extractedData.numPages,
        tokensUsed: result.metadata?.tokensUsed,
        processingTime: Date.now() - startTime,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Fallback 到 Assistant API
   */
  private async fallbackToAssistantAPI(
    fileBuffer: ArrayBuffer,
    fileName: string
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    let threadId: string | undefined;
    let fileId: string | undefined;

    try {
      systemLogger.info('[EnhancedOrderExtraction] Using Assistant API as fallback');

      // 獲取 Assistant
      const assistantId = await this.assistantService.getAssistant();
      
      // 創建 Thread
      threadId = await this.assistantService.createThread();
      
      // 上傳文件
      const pdfBuffer = Buffer.from(fileBuffer);
      fileId = await this.assistantService.uploadFile(pdfBuffer, fileName);
      
      // 發送消息
      await this.assistantService.sendMessage(threadId, SYSTEM_PROMPT, fileId);
      
      // 運行並等待結果
      const result = await this.assistantService.runAndWait(threadId, assistantId);
      
      // 解析結果
      const parsedData = this.assistantService.parseAssistantResponse(result);
      
      // 清理資源
      await this.assistantService.cleanup(threadId, fileId);
      
      // 構建返回結果
      const products = parsedData.products.map(product => ({
        product_code: product.product_code,
        product_desc: product.description || '',
        product_qty: product.quantity,
        weight: 0,
        unit_price: product.unit_price?.toString() || '0',
      }));

      return {
        success: true,
        data: {
          order_ref: parsedData.order_ref || '',
          account_num: '-',
          delivery_add: '-',
          invoice_to: '-',
          customer_ref: '-',
          products,
        },
        extractionMethod: 'assistant-fallback',
        metadata: {
          productsExtracted: products.length,
          pagesProcessed: 0, // Assistant API 不提供頁數信息
          processingTime: Date.now() - startTime,
          fallbackUsed: true,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[EnhancedOrderExtraction] Assistant API fallback also failed');

      // 清理資源
      if (threadId || fileId) {
        await this.assistantService.cleanup(threadId, fileId).catch(() => {});
      }

      return {
        success: false,
        extractionMethod: 'failed',
        metadata: {
          productsExtracted: 0,
          pagesProcessed: 0,
          processingTime: Date.now() - startTime,
          fallbackUsed: true,
        },
        error: `All extraction methods failed: ${errorMessage}`,
      };
    }
  }

  /**
   * 批量處理多個 PDF
   */
  public async extractOrdersFromMultiplePDFs(
    files: Array<{ buffer: ArrayBuffer; name: string }>
  ): Promise<EnhancedExtractionResult[]> {
    const results: EnhancedExtractionResult[] = [];
    
    for (const file of files) {
      systemLogger.info({
        fileName: file.name,
        fileIndex: files.indexOf(file) + 1,
        totalFiles: files.length,
      }, '[EnhancedOrderExtraction] Processing file in batch');
      
      const result = await this.extractOrderFromPDF(file.buffer, file.name);
      results.push(result);
      
      // 添加延遲以避免速率限制
      if (files.indexOf(file) < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 總結批量處理結果
    const summary = {
      totalFiles: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalProductsExtracted: results.reduce((sum, r) => sum + r.metadata.productsExtracted, 0),
      averageProcessingTime: results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / results.length,
    };
    
    systemLogger.info({
      summary,
    }, '[EnhancedOrderExtraction] Batch processing completed');
    
    return results;
  }

  /**
   * 驗證提取結果的完整性
   */
  public validateExtractionResult(result: EnhancedExtractionResult): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (!result.success) {
      issues.push('Extraction failed');
      suggestions.push('Check PDF format and content');
    }
    
    if (result.data) {
      // 檢查訂單號
      if (!result.data.order_ref || result.data.order_ref === '-') {
        issues.push('Missing order reference');
        suggestions.push('Verify PDF contains order reference');
      }
      
      // 檢查產品
      if (result.data.products.length === 0) {
        issues.push('No products found');
        suggestions.push('Check product table format in PDF');
      }
      
      // 檢查產品代碼
      const missingCodes = result.data.products.filter(p => !p.product_code).length;
      if (missingCodes > 0) {
        issues.push(`${missingCodes} products missing product codes`);
        suggestions.push('Review product identification logic');
      }
      
      // 檢查數量
      const invalidQty = result.data.products.filter(p => p.product_qty <= 0).length;
      if (invalidQty > 0) {
        issues.push(`${invalidQty} products with invalid quantities`);
        suggestions.push('Check quantity extraction logic');
      }
    }
    
    // 性能檢查
    if (result.metadata.processingTime > 30000) {
      issues.push(`Slow processing: ${Math.round(result.metadata.processingTime / 1000)}s`);
      suggestions.push('Consider optimizing extraction logic');
    }
    
    // Token 使用檢查
    if (result.metadata.tokensUsed && result.metadata.tokensUsed > 10000) {
      issues.push(`High token usage: ${result.metadata.tokensUsed}`);
      suggestions.push('Consider text preprocessing to reduce tokens');
    }
    
    const isValid = issues.length === 0;
    
    if (!isValid) {
      systemLogger.warn({
        issues,
        suggestions,
        result: {
          method: result.extractionMethod,
          products: result.metadata.productsExtracted,
        },
      }, '[EnhancedOrderExtraction] Validation issues found');
    }
    
    return { isValid, issues, suggestions };
  }
}