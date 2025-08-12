'use server';

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseRecord } from '@/types/database/tables';
import { ApiResponse, ApiRequest, QueryParams } from '@/lib/validation/zod-schemas';
import { getErrorMessage } from '@/types/core/error';
import { createClient } from '@supabase/supabase-js';
import { AssistantService } from '@/app/services/assistantService';
import { SYSTEM_PROMPT } from '@/lib/openai-assistant-config';
import { apiLogger, logApiRequest, logApiResponse, systemLogger } from '@/lib/logger';
import crypto from 'crypto';

// 簡單的內存緩存（與現有系統一致）
interface CachedAssistantResult {
  orderData: EnhancedOrderData;
  analysis: string;
  extractedText?: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

interface CacheData {
  data: CachedAssistantResult;
  timestamp: number;
}

const fileCache = new Map<string, CacheData>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分鐘

// ACO 產品代碼列表（與現有系統一致）
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

// 增強的訂單數據接口
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
function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// 檢查緩存
function getCachedResult(fileHash: string): CachedAssistantResult | null {
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
function setCachedResult(fileHash: string, data: CachedAssistantResult): void {
  fileCache.set(fileHash, {
    data,
    timestamp: Date.now(),
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
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });
}

// 存儲增強的訂單數據
async function storeEnhancedOrderData(
  orderData: EnhancedOrderData,
  uploadedBy: string,
  tokenUsed: number
) {
  const supabase = createSupabaseAdmin();
  let insertResults: DatabaseRecord[] = [];

  // 計算每條記錄的 token
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
      token: String(tokenPerRecord), // 確保是字符串，Supabase 會自動轉換為 bigint
      loaded_qty: '0', // 預設值
    };

    // weight 是 bigint，可以為 null
    if (product.weight) {
      record.weight = product.weight;
    }

    // customer_ref 是獨立欄位（可以為 null）
    if (orderData.customer_ref && orderData.customer_ref !== '-') {
      record.customer_ref = orderData.customer_ref;
    }

    return record;
  });

  // 插入所有記錄
  apiLogger.debug({
    recordCount: orderRecords.length,
    sampleRecord: orderRecords[0],
  }, '[Assistant API] Inserting records');

  try {
    const { data, error } = await supabase.from('data_order').insert(orderRecords).select();

    if (error) {
      apiLogger.error({
        error: getErrorMessage(error),
        code: (error as Error & { code?: string }).code,
        details: error.details,
        hint: error.hint,
        sampleRecord: orderRecords[0],
        allRecords: orderRecords, // 記錄所有數據以便調試
      }, '[Assistant API] Database insert failed');

      // 嘗試單獨插入第一筆記錄來診斷問題
      const { error: singleError } = await supabase.from('data_order').insert(orderRecords[0]);

      if (singleError) {
        apiLogger.error({
          error: getErrorMessage(singleError),
          code: (singleError as Error & { code?: string }).code,
          record: orderRecords[0],
        }, '[Assistant API] Single record insert also failed');
      }

      throw new Error(`資料庫插入失敗: ${getErrorMessage(error)}`);
    }

    insertResults = data || [];

    apiLogger.info({
      recordCount: insertResults.length,
      tokenPerRecord,
      totalTokens: tokenUsed,
    }, '[Assistant API] Records inserted successfully');
  } catch (error) {
    throw error;
  }

  // 處理 ACO 產品
  const acoProducts = orderData.products.filter(p => ACO_PRODUCT_CODES.includes(p.product_code));

  if (acoProducts.length > 0) {
    const acoRecords = acoProducts.map(product => ({
      code: product.product_code, // record_aco 表使用 'code' 而不是 'product_code'
      order_ref: parseInt(orderData.order_ref), // record_aco 需要 integer
      required_qty: product.product_qty,
      uploaded_by: parseInt(uploadedBy), // 確保是數字
    }));

    apiLogger.debug({
      count: acoRecords.length,
      records: acoRecords,
    }, '[Assistant API] Inserting ACO records');

    const { error: acoError } = await supabase.from('record_aco').insert(acoRecords);

    if (acoError) {
      apiLogger.warn({
        error: getErrorMessage(acoError),
        code: (acoError as Error & { code?: string }).code,
        details: acoError.details,
      }, '[Assistant API] ACO records insert failed');
    } else {
      apiLogger.info({ count: acoRecords.length }, '[Assistant API] ACO records inserted');
    }
  }

  return insertResults;
}

// 記錄訂單上傳歷史
async function recordOrderUploadHistory(orderRef: string, uploadedBy: string): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();

    // uploadedBy 參數已經係用戶 ID (integer)，直接使用
    const userId = parseInt(uploadedBy);

    // 插入歷史記錄
    const { error } = await supabase.from('record_history').insert({
      time: new Date().toISOString(),
      id: userId, // 直接使用 uploadedBy 轉換成 integer
      action: 'Order Upload',
      plt_num: null, // 訂單上傳不涉及棧板
      loc: null, // 訂單上傳不涉及位置
      remark: orderRef, // 記錄訂單參考號
    });

    if (error) {
      apiLogger.error({ error }, '[recordOrderUploadHistory as string] Error recording history');
    } else {
      apiLogger.info(
        `[recordOrderUploadHistory as string] Recorded: Order Upload for ${orderRef} by user ID ${userId}`
      );
    }
  } catch (error) {
    apiLogger.error({ error }, '[recordOrderUploadHistory as string] Unexpected error');
  }
}

// 背景存儲函數（與現有系統一致）
async function uploadToStorageAsync(
  pdfBuffer: Buffer,
  fileName: string,
  uploadedBy: string,
  extractedText?: string
) {
  try {
    systemLogger.info('[Background Storage] Starting upload');
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
    const { error: docError } = await supabaseAdmin.from('doc_upload').insert({
      doc_name: fileName,
      upload_by: uploadedBy,
      doc_type: 'order',
      doc_url: urlData.publicUrl,
      file_size: pdfBuffer.length,
      folder: 'orderpdf',
      json_txt: extractedText || null,
    });

    if (docError) {
      systemLogger.warn({ error: docError }, '[Background Storage] doc_upload insert failed');
    } else {
      systemLogger.info('[Background Storage] doc_upload inserted with json_txt field');
    }

    return urlData.publicUrl;
  } catch (error: unknown) {
    systemLogger.error({ error: getErrorMessage(error) }, '[Background Storage] Upload failed');
    throw error;
  }
}

// 發送電郵通知
async function sendEmailNotification(
  orderData: EnhancedOrderData,
  pdfBuffer: Buffer,
  fileName: string,
  uploadedBy: string
) {
  try {
    apiLogger.info('[Assistant API] Preparing order created email');

    const { sendOrderCreatedEmail } = await import('../../services/emailService');

    const emailRequestBody = {
      orderData: orderData.products.map(product => ({
        order_ref: parseInt(orderData.order_ref), // emailService expects number
        product_code: product.product_code,
        product_desc: product.product_desc,
        product_qty: product.product_qty,
      })),
      pdfAttachment: {
        filename: fileName,
        content: pdfBuffer.toString('base64'),
      },
    };

    const emailResponse = await sendOrderCreatedEmail(emailRequestBody);

    if (emailResponse.success) {
      apiLogger.info({
        recipients: emailResponse.recipients,
      }, '[Assistant API] Order created email sent successfully');
    } else {
      apiLogger.warn({
        error: getErrorMessage(emailResponse) || 'Unknown error',
      }, '[Assistant API] Failed to send order created email');
    }

    return emailResponse;
  } catch (error: unknown) {
    apiLogger.error({ error: getErrorMessage(error) }, '[Assistant API] Email notification error');
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  logApiRequest('POST', '/api/analyze-order-pdf-assistant');

  let threadId: string | undefined;
  let fileId: string | undefined;

  try {
    apiLogger.info('[Assistant API] Starting PDF analysis request');

    // 解析表單資料
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = (formData.get('fileName') as string) || file?.name;
    const uploadedBy = formData.get('uploadedBy') as string;
    const saveToStorage = formData.get('saveToStorage') === 'true';

    if (!file || !fileName || !uploadedBy) {
      logApiResponse('POST', '/api/analyze-order-pdf-assistant', 400, Date.now() - startTime);
      return NextResponse.json(
        {
          error: 'Missing required fields: file, fileName, or uploadedBy',
        },
        { status: 400 }
      );
    }

    // 轉換文件為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const fileHash = generateFileHash(pdfBuffer);

    // 檢查緩存
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult) {
      apiLogger.info({ fileHash }, '[Assistant API] Using cached result');

      // 準備返回數據（與非緩存版本一致）
      const cachedExtractedData = cachedResult.orderData.products.map(product => ({
        order_ref: cachedResult.orderData.order_ref,
        account_num: cachedResult.orderData.account_num,
        delivery_add: cachedResult.orderData.delivery_add,
        invoice_to: cachedResult.orderData.invoice_to,
        customer_ref: cachedResult.orderData.customer_ref,
        product_code: product.product_code,
        product_desc: product.product_desc,
        product_qty: product.product_qty,
        weight: product.weight,
        unit_price: product.unit_price,
      }));

      logApiResponse('POST', '/api/analyze-order-pdf-assistant', 200, Date.now() - startTime);
      return NextResponse.json({
        success: true,
        data: cachedResult.orderData,
        extractedData: cachedExtractedData,
        recordCount: cachedExtractedData.length,
        cached: true,
        processingTime: Date.now() - startTime,
        extractedCount: cachedResult.orderData.products.length,
      });
    }

    // 獲取 Assistant 服務
    const assistantService = AssistantService.getInstance();

    // 獲取或創建 Assistant
    const assistantId = await assistantService.getAssistant();

    // 創建 Thread
    threadId = await assistantService.createThread();

    // 上傳文件到 OpenAI
    fileId = await assistantService.uploadFile(pdfBuffer, fileName);

    // 發送消息並附加文件
    await assistantService.sendMessage(threadId, SYSTEM_PROMPT, fileId);

    // 運行 Assistant 並等待結果
    const result = await assistantService.runAndWait(threadId, assistantId);

    apiLogger.info({
      responseLength: result.length,
      responsePreview: result.substring(0, 1000),
      fullResponse: result.length < 2000 ? result : 'Response too long to log',
    }, '[Assistant API] Raw assistant response');

    // 解析結果
    let parsedData: ReturnType<typeof assistantService.parseAssistantResponse>;
    try {
      parsedData = assistantService.parseAssistantResponse(result);
    } catch (parseError: unknown) {
      apiLogger.error({
        error: getErrorMessage(parseError),
        rawResponse: result.substring(0, 1000),
      }, '[Assistant API] Failed to parse assistant response');
      throw new Error(`Failed to parse assistant response: ${getErrorMessage(parseError)}`);
    }

    // 轉換為 EnhancedOrderData 格式
    const orderData: EnhancedOrderData = {
      order_ref: parsedData.order_ref,
      account_num: '', // Assistant 版本沒有這些字段，使用空值
      delivery_add: '',
      invoice_to: '',
      customer_ref: '',
      products: parsedData.products.map(p => ({
        product_code: p.product_code,
        product_desc: p.description || '',
        product_qty: p.quantity,
        weight: 0,
        unit_price: p.unit_price?.toString() || '0',
      })),
    };

    apiLogger.info({
      orderRef: orderData.order_ref,
      productCount: orderData.products?.length || 0,
      hasInvoiceTo: !!orderData.invoice_to && orderData.invoice_to !== '-',
      hasCustomerRef: !!orderData.customer_ref && orderData.customer_ref !== '-',
      hasWeights: orderData.products?.some(p => p.weight) || false,
      hasUnitPrices: orderData.products?.some(p => p.unit_price && p.unit_price !== '-') || false,
    }, '[Assistant API] Analysis completed');

    // 估算 token 使用量（基於文件大小）
    const estimatedTokens = Math.ceil(pdfBuffer.length / 4);

    // 存儲到資料庫
    await storeEnhancedOrderData(orderData, uploadedBy, estimatedTokens);

    // 記錄操作歷史
    await recordOrderUploadHistory(orderData.order_ref, uploadedBy);

    // 發送電郵通知
    const emailResult = await sendEmailNotification(orderData, pdfBuffer, fileName, uploadedBy);

    // 背景存儲（不影響響應時間）
    if (saveToStorage) {
      setImmediate(async () => {
        try {
          await uploadToStorageAsync(pdfBuffer, fileName, uploadedBy, result);
        } catch (storageError) {
          systemLogger.warn({
            error: storageError,
          }, '[Assistant API] Background storage failed');
        }
      });
    }

    // 緩存結果
    setCachedResult(fileHash, {
      orderData,
      analysis: result,
      extractedText: result,
    });

    // 清理資源
    assistantService.cleanup(threadId, fileId).catch(error => {
      systemLogger.warn({ error }, '[Assistant API] Cleanup failed');
    });

    const processingTime = Date.now() - startTime;

    logApiResponse('POST', '/api/analyze-order-pdf-assistant', 200, processingTime);

    // 準備返回數據（兼容前端）
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

    return NextResponse.json({
      success: true,
      data: orderData,
      extractedData: extractedData, // 前端期望這個格式
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
    });
  } catch (error: unknown) {
    apiLogger.error({
      error: getErrorMessage(error),
      stack: (error as Error).stack,
    }, '[Assistant API] Analysis failed');

    // 清理資源
    if (threadId || fileId) {
      const assistantService = AssistantService.getInstance();
      assistantService.cleanup(threadId, fileId).catch(cleanupError => {
        systemLogger.warn({
          error: cleanupError,
        }, '[Assistant API] Cleanup failed after error');
      });
    }

    logApiResponse('POST', '/api/analyze-order-pdf-assistant', 500, Date.now() - startTime);

    return NextResponse.json(
      { error: 'PDF analysis failed', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
