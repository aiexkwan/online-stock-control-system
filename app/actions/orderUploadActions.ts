'use server';

import { createClient } from '@/app/utils/supabase/server';
import { DatabaseRecord } from '@/lib/types/database';
import { getErrorMessage } from '@/lib/types/error-handling';
import { AssistantService } from '@/lib/services/assistantService';
import { SYSTEM_PROMPT } from '@/lib/openai-assistant-config';
import crypto from 'crypto';

// ACO 產品代碼列表
const ACO_PRODUCT_CODES = [
  'MHALFWG',
  'MHALFWG15',
  'MHALFWG20',
  'MHALFWG30',
  'MHALFWG38',
  'MHALFWG45',
  'MHALFWG60',
  'MHCONKIT',
  'MHCONR',
  'MHEASY15',
  'MHEASY60',
  'MHEASYA',
  'MHEASYB',
  'MHLACO12Y',
  'MHLACO18Y',
  'MHLACO24Y',
  'MHLACO6Y',
  'MHWEDGE',
  'MHWEDGE15',
  'MHWEDGE20',
  'MHWEDGE30',
  'MHWEDGE38',
  'MHWEDGE45',
  'MHWEDGE60',
];

// 簡單的內存緩存
const fileCache = new Map<string, { data: OrderAnalysisResult; timestamp: number }>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分鐘

interface OrderAnalysisResult {
  success: boolean;
  data?: EnhancedOrderData;
  extractedData?: Record<string, unknown>[];
  recordCount?: number;
  cached?: boolean;
  processingTime?: number;
  extractedCount?: number;
  emailSent?: boolean;
  enhancedFields?: {
    hasInvoiceTo: boolean;
    hasCustomerRef: boolean;
    hasWeights: boolean;
    hasUnitPrices: boolean;
  };
  error?: string;
  orderData?: EnhancedOrderData;
}

interface EnhancedOrderData {
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
}

// 生成文件哈希值
function generateFileHash(buffer: ArrayBuffer): string {
  const hashBuffer = Buffer.from(buffer);
  return crypto.createHash('md5').update(hashBuffer).digest('hex');
}

// 檢查緩存
function getCachedResult(fileHash: string): OrderAnalysisResult | null {
  const cached = fileCache.get(fileHash);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  if (cached) {
    fileCache.delete(fileHash);
  }
  return null;
}

// 設置緩存
function setCachedResult(fileHash: string, data: OrderAnalysisResult): void {
  fileCache.set(fileHash, {
    data,
    timestamp: Date.now(),
  });
}

// 記錄訂單上傳歷史
async function recordOrderUploadHistory(orderRef: string, uploadedBy: string): Promise<void> {
  try {
    const supabase = await createClient();
    const userId = parseInt(uploadedBy);

    const { error } = await supabase.from('record_history').insert({
      time: new Date().toISOString(),
      id: userId,
      action: 'Order Upload',
      plt_num: null,
      loc: null,
      remark: orderRef,
    });

    if (error) {
      console.error('[recordOrderUploadHistory] Error:', error);
    }
  } catch (error) {
    console.error('[recordOrderUploadHistory] Unexpected error:', error);
  }
}

// 存儲增強的訂單數據
async function storeEnhancedOrderData(
  orderData: EnhancedOrderData,
  uploadedBy: string,
  tokenUsed: number
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  let insertResults: Record<string, unknown>[] = [];

  const tokenPerRecord = Math.ceil(tokenUsed / orderData.products.length);

  // 準備插入資料
  const orderRecords = orderData.products.map(product => {
    const record: DatabaseRecord = {
      order_ref: String(orderData.order_ref),
      account_num: orderData.account_num || '-',
      delivery_add: orderData.delivery_add || '-',
      invoice_to: orderData.invoice_to || '-',
      product_code: product.product_code,
      product_desc: product.product_desc,
      product_qty: String(product.product_qty),
      unit_price: product.unit_price || '-',
      uploaded_by: String(uploadedBy),
      token: String(tokenPerRecord),
      loaded_qty: '0',
    };

    if (product.weight) {
      record.weight = product.weight;
    }

    if (orderData.customer_ref && orderData.customer_ref !== '-') {
      record.customer_ref = orderData.customer_ref;
    }

    return record;
  });

  // 插入所有記錄
  const { data, error } = await supabase.from('data_order').insert(orderRecords).select();

  if (error) {
    console.error('[storeEnhancedOrderData] Database insert failed:', error);
    throw new Error(`資料庫插入失敗: ${getErrorMessage(error)}`);
  }

  insertResults = data || [];

  // 處理 ACO 產品
  const acoProducts = orderData.products.filter(p => ACO_PRODUCT_CODES.includes(p.product_code));

  if (acoProducts.length > 0) {
    const acoRecords = acoProducts.map(product => ({
      code: product.product_code,
      order_ref: parseInt(orderData.order_ref),
      required_qty: product.product_qty,
      uploaded_by: parseInt(uploadedBy),
    }));

    const { error: acoError } = await supabase.from('record_aco').insert(acoRecords);

    if (acoError) {
      console.error('[storeEnhancedOrderData] ACO records insert failed:', acoError);
    }
  }

  return insertResults;
}

// 背景存儲文件到 Supabase Storage
async function uploadToStorageAsync(
  fileData: { buffer: ArrayBuffer; name: string },
  uploadedBy: string,
  extractedText?: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const buffer = Buffer.from(fileData.buffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`orderpdf/${fileData.name}`, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[uploadToStorageAsync] Upload failed:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`orderpdf/${fileData.name}`);

    // 寫入 doc_upload 表
    const { error: docError } = await supabase.from('doc_upload').insert({
      doc_name: fileData.name,
      upload_by: uploadedBy,
      doc_type: 'order',
      doc_url: urlData.publicUrl,
      file_size: buffer.length,
      folder: 'orderpdf',
      json_txt: extractedText || null,
    });

    if (docError) {
      console.error('[uploadToStorageAsync] doc_upload insert failed:', docError);
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('[uploadToStorageAsync] Error:', error);
    return null;
  }
}

// 發送電郵通知
async function sendEmailNotification(
  orderData: EnhancedOrderData,
  fileData: { buffer: ArrayBuffer; name: string },
  uploadedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { sendOrderCreatedEmail } = await import('../services/emailService');

    const emailRequestBody = {
      orderData: orderData.products.map(product => ({
        order_ref: parseInt(orderData.order_ref),
        product_code: product.product_code,
        product_desc: product.product_desc,
        product_qty: product.product_qty,
      })),
      pdfAttachment: {
        filename: fileData.name,
        content: Buffer.from(fileData.buffer).toString('base64'),
      },
    };

    const emailResponse = await sendOrderCreatedEmail(emailRequestBody);
    return emailResponse;
  } catch (error: unknown) {
    console.error('[sendEmailNotification] Error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 分析訂單 PDF 文件
 * 使用 OpenAI Assistant API 提取訂單信息
 */
export async function analyzeOrderPDF(
  fileData: {
    buffer: ArrayBuffer;
    name: string;
  },
  uploadedBy: string,
  saveToStorage: boolean = true
): Promise<OrderAnalysisResult> {
  const startTime = Date.now();
  let threadId: string | undefined;
  let fileId: string | undefined;

  try {
    // 檢查必要參數
    if (!fileData || !fileData.buffer || !fileData.name || !uploadedBy) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // 生成文件哈希值
    const fileHash = generateFileHash(fileData.buffer);

    // 檢查緩存
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult && cachedResult.orderData) {
      const cachedExtractedData = cachedResult.orderData.products.map((product) => ({
        order_ref: cachedResult.orderData!.order_ref,
        account_num: cachedResult.orderData!.account_num,
        delivery_add: cachedResult.orderData!.delivery_add,
        invoice_to: cachedResult.orderData!.invoice_to,
        customer_ref: cachedResult.orderData!.customer_ref,
        product_code: product.product_code,
        product_desc: product.product_desc,
        product_qty: product.product_qty,
        weight: product.weight,
        unit_price: product.unit_price,
      }));

      return {
        success: true,
        data: cachedResult.orderData,
        extractedData: cachedExtractedData,
        recordCount: cachedExtractedData.length,
        cached: true,
        processingTime: Date.now() - startTime,
        extractedCount: cachedResult.orderData.products.length,
      };
    }

    // 獲取 Assistant 服務
    const assistantService = AssistantService.getInstance();

    // 獲取或創建 Assistant
    const assistantId = await assistantService.getAssistant();

    // 創建 Thread
    threadId = await assistantService.createThread();

    // 上傳文件到 OpenAI
    const pdfBuffer = Buffer.from(fileData.buffer);
    fileId = await assistantService.uploadFile(pdfBuffer, fileData.name);

    // 發送消息並附加文件
    await assistantService.sendMessage(threadId, SYSTEM_PROMPT, fileId);

    // 運行 Assistant 並等待結果
    const result = await assistantService.runAndWait(threadId, assistantId);

    // 解析結果
    let orderData: EnhancedOrderData;
    try {
      const parsedData = assistantService.parseAssistantResponse(result);
      // 確保解析的數據包含必需的字段，為缺失的字段提供默認值
      orderData = {
        order_ref: parsedData.order_ref || '',
        account_num: '', // 從 parsedData 中無法獲取，使用默認值
        delivery_add: '', // 從 parsedData 中無法獲取，使用默認值
        invoice_to: '', // 從 parsedData 中無法獲取，使用默認值
        customer_ref: '', // 從 parsedData 中無法獲取，使用默認值
        products: parsedData.products.map(product => ({
          product_code: product.product_code,
          product_desc: product.description || '',
          product_qty: product.quantity,
          weight: 0, // 默認重量
          unit_price: product.unit_price?.toString() || '0'
        }))
      };
    } catch (parseError: unknown) {
      throw new Error(`Failed to parse assistant response: ${getErrorMessage(parseError)}`);
    }

    // 估算 token 使用量
    const estimatedTokens = Math.ceil(fileData.buffer.byteLength / 4);

    // 存儲到資料庫
    await storeEnhancedOrderData(orderData, uploadedBy, estimatedTokens);

    // 記錄操作歷史
    await recordOrderUploadHistory(orderData.order_ref, uploadedBy);

    // 發送電郵通知
    const emailResult = await sendEmailNotification(orderData, fileData, uploadedBy);

    // 背景存儲
    if (saveToStorage) {
      // 使用 Promise 而不是 setImmediate (server action 環境)
      uploadToStorageAsync(fileData, uploadedBy, result).catch(error => {
        console.error('[analyzeOrderPDF] Background storage failed:', error);
      });
    }

    // 緩存結果
    setCachedResult(fileHash, {
      success: true,
      orderData,
    });

    // 清理資源
    assistantService.cleanup(threadId, fileId).catch(error => {
      console.error('[analyzeOrderPDF] Cleanup failed:', error);
    });

    const processingTime = Date.now() - startTime;

    // 準備返回數據
    const extractedData = orderData.products.map(product => ({
      order_ref: orderData.order_ref,
      account_num: orderData.account_num,
      delivery_add: orderData.delivery_add,
      invoice_to: orderData.invoice_to,
      customer_ref: orderData.customer_ref,
      product_code: product.product_code,
      product_desc: product.product_desc,
      product_qty: product.product_qty,
      weight: product.weight,
      unit_price: product.unit_price,
    }));

    return {
      success: true,
      data: orderData,
      extractedData: extractedData,
      recordCount: extractedData.length,
      processingTime,
      extractedCount: orderData.products.length,
      emailSent: emailResult.success,
      enhancedFields: {
        hasInvoiceTo: !!orderData.invoice_to && orderData.invoice_to !== '-',
        hasCustomerRef: !!orderData.customer_ref && orderData.customer_ref !== '-',
        hasWeights: orderData.products.some(p => !!p.weight),
        hasUnitPrices: orderData.products.some(p => !!p.unit_price && p.unit_price !== '-'),
      },
    };
  } catch (error: unknown) {
    console.error('[analyzeOrderPDF] Analysis failed:', error);

    // 清理資源
    if (threadId || fileId) {
      const assistantService = AssistantService.getInstance();
      assistantService.cleanup(threadId, fileId).catch(cleanupError => {
        console.error('[analyzeOrderPDF] Cleanup failed after error:', cleanupError);
      });
    }

    return {
      success: false,
      error: getErrorMessage(error) || 'PDF analysis failed',
    };
  }
}

/**
 * 獲取當前用戶 ID
 */
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data: userDataByEmail } = await supabase
      .from('data_id')
      .select('id')
      .eq('email', user.email)
      .single();

    return userDataByEmail?.id || null;
  } catch (error) {
    console.error('[getCurrentUserId] Error:', error);
    return null;
  }
}
