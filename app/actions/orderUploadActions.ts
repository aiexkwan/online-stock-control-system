'use server';

import { createClient } from '@/app/utils/supabase/server';
import { DatabaseRecord } from '@/types/database/tables';
import type { Database } from '@/types/database/supabase';
import { getErrorMessage } from '@/types/core/error';
import { AssistantService } from '@/app/services/assistantService';
import { SYSTEM_PROMPT } from '@/lib/openai-assistant-config';
import { EnhancedOrderExtractionService } from '@/app/services/enhancedOrderExtractionService';
import { sendOrderCreatedEmail } from '../services/emailService';
import * as crypto from 'crypto';

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

interface OrderInsertRecord {
  order_ref: string;
  account_num: string;
  delivery_add: string;
  invoice_to: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  unit_price: string;
  uploaded_by: string;
  token: number;
  loaded_qty: string;
  weight?: number;
  customer_ref?: string;
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
  const orderRecords: OrderInsertRecord[] = orderData.products.map(product => {
    const record: OrderInsertRecord = {
      order_ref: String(orderData.order_ref),
      account_num: orderData.account_num || '-',
      delivery_add: orderData.delivery_add || '-',
      invoice_to: orderData.invoice_to || '-',
      product_code: product.product_code,
      product_desc: product.product_desc,
      product_qty: product.product_qty,
      unit_price: product.unit_price || '-',
      uploaded_by: String(uploadedBy),
      token: tokenPerRecord,
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

  // 插入所有記錄 - 轉換為 Supabase 預期的類型
  const { data, error } = await supabase
    .from('data_order')
    .insert(orderRecords as unknown as Record<string, unknown>[])
    .select();

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
      finished_qty: 0,
      latest_update: new Date().toISOString(),
    }));

    const { error: acoError } = await supabase.from('record_aco').insert(acoRecords);

    if (acoError) {
      console.error('[storeEnhancedOrderData] ACO records insert failed:', acoError);
    }
  }

  return insertResults;
}

// Admin client 用於背景任務
const getAdminClient = () => {
  const { createClient: createAdminSupabaseClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is required for admin client');
  }
  return createAdminSupabaseClient(supabaseUrl, supabaseServiceKey);
};

// 背景存儲文件到 Supabase Storage（支援重試機制）
async function uploadToStorageAsync(
  fileData: { buffer: ArrayBuffer; name: string },
  uploadedBy: string,
  extractedText?: string
): Promise<string | null> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1秒
  
  // 重試機制輔助函數
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const buffer = Buffer.from(fileData.buffer);
      
      // 使用 Admin client 繞過 RLS 限制，確保背景任務能正常執行
      const adminSupabase = getAdminClient();
      
      console.log(`[uploadToStorageAsync] Attempt ${attempt}/${MAX_RETRIES} - Starting file upload and doc_upload record creation using Admin client`);
      
      // Admin client 不需要用戶身份驗證，直接開始上傳
      console.log('[uploadToStorageAsync] Using Service Role client, skipping user auth check');

      // 使用 admin client 上傳文件到 Storage
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('documents')
        .upload(`orderpdf/${fileData.name}`, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (uploadError) {
        console.error(`[uploadToStorageAsync] Attempt ${attempt} - Storage upload failed:`, uploadError);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
        return null;
      }

      const { data: urlData } = adminSupabase.storage
        .from('documents')
        .getPublicUrl(`orderpdf/${fileData.name}`);

      // 驗證必要資料
      const parsedUploadedBy = parseInt(uploadedBy);
      if (isNaN(parsedUploadedBy)) {
        console.error('[uploadToStorageAsync] Invalid uploadedBy value:', uploadedBy);
        return null;
      }

      // 除錯：輸出要插入的資料
      console.log(`[uploadToStorageAsync] Attempt ${attempt} - Preparing to insert doc_upload using Service Role:`, {
        doc_name: fileData.name,
        upload_by: parsedUploadedBy,
        doc_url: urlData.publicUrl,
        file_size: buffer.length,
        folder: 'orderpdf',
        has_json_txt: !!extractedText,
        using_admin_client: true
      });

      // 使用 Database Function 安全地寫入 doc_upload 表
      // 呢個方法更安全，因為只授予特定操作權限，而唔係完整嘅 Service Role 權限
      const { data: insertResult, error: docError } = await adminSupabase
        .rpc('insert_doc_upload', {
          p_doc_name: fileData.name,
          p_upload_by: parsedUploadedBy,
          p_doc_type: 'application/pdf',
          p_doc_url: urlData.publicUrl,
          p_file_size: buffer.length,
          p_folder: 'orderpdf',
          p_json_txt: extractedText || null
        });

      if (docError) {
        console.error(`[uploadToStorageAsync] Attempt ${attempt} - doc_upload insert failed:`, {
          error: docError,
          errorDetails: {
            message: docError.message,
            code: docError.code,
            details: docError.details,
            hint: docError.hint,
          },
          insertData: {
            doc_name: fileData.name,
            upload_by: parsedUploadedBy,
            doc_type: 'order',
            file_size: buffer.length,
            folder: 'orderpdf',
            uploadedBy_raw: uploadedBy,
            uploadedBy_parsed: parsedUploadedBy,
          }
        });
        
        // 如果是權限錯誤或數據驗證錯誤，不需要重試
        if (docError.code === 'PGRST116' || docError.code === 'PGRST301' || docError.code === '42501') {
          console.error('[uploadToStorageAsync] Non-retryable error detected, aborting retries');
          return null;
        }
        
        if (attempt < MAX_RETRIES) {
          console.log(`[uploadToStorageAsync] Retrying in ${RETRY_DELAY * attempt}ms...`);
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
        return null;
      } else {
        console.log(`[uploadToStorageAsync] Attempt ${attempt} - Successfully created doc_upload record using Database Function:`, {
          uuid: insertResult,
          doc_name: fileData.name,
          executionTime: `${Date.now()}ms`,
          function_call_success: true
        });
        
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error(`[uploadToStorageAsync] Attempt ${attempt} - Unexpected error:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        uploadedBy,
        fileName: fileData.name
      });
      
      if (attempt < MAX_RETRIES) {
        console.log(`[uploadToStorageAsync] Retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
        continue;
      }
      return null;
    }
  }
  
  console.error('[uploadToStorageAsync] All retry attempts exhausted');
  return null;
}

// 發送電郵通知
async function sendEmailNotification(
  orderData: EnhancedOrderData,
  fileData: { buffer: ArrayBuffer; name: string },
  uploadedBy: string
): Promise<{ success: boolean; error?: string; details?: unknown }> {
  try {
    console.log('[sendEmailNotification] Starting email notification process');

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

    console.log('[sendEmailNotification] Email request prepared:', {
      orderRef: orderData.order_ref,
      productCount: orderData.products.length,
      attachmentName: fileData.name,
      attachmentSizeBytes: fileData.buffer.byteLength,
    });

    const emailResponse = await sendOrderCreatedEmail(emailRequestBody);
    
    console.log('[sendEmailNotification] Email service response:', {
      success: emailResponse.success,
      emailId: emailResponse.emailId,
      recipients: emailResponse.recipients,
      resendResponseKeys: Object.keys(emailResponse.resendResponse || {}),
    });
    
    // 檢查 Resend API 實際響應
    if (emailResponse.resendResponse && !emailResponse.resendResponse.id) {
      console.warn('[sendEmailNotification] Warning: No email ID in Resend response');
    }
    
    return {
      success: emailResponse.success,
      details: {
        emailId: emailResponse.emailId,
        recipients: emailResponse.recipients,
      }
    };
  } catch (error: unknown) {
    console.error('[sendEmailNotification] Error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 分析訂單 PDF 文件
 * 使用增強的 PDF 提取服務（優先）或 OpenAI Assistant API（備用）
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
  let useEnhancedExtraction = true; // 功能開關

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
      const cachedExtractedData = cachedResult.orderData.products.map(product => ({
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

    let orderData: EnhancedOrderData | undefined;
    let extractionMethod: string = 'unknown';
    let tokensUsed: number = 0;
    let extractedText: string = '';

    // 嘗試使用增強的提取服務
    if (useEnhancedExtraction) {
      try {
        console.log('[analyzeOrderPDF] Using enhanced extraction service');
        const enhancedService = EnhancedOrderExtractionService.getInstance();
        const enhancedResult = await enhancedService.extractOrderFromPDF(fileData.buffer, fileData.name);

        if (enhancedResult.success && enhancedResult.data) {
          // 驗證結果
          const validation = enhancedService.validateExtractionResult(enhancedResult);
          if (validation.issues.length > 0) {
            console.warn('[analyzeOrderPDF] Extraction validation issues:', validation.issues);
          }

          orderData = {
            order_ref: enhancedResult.data.order_ref,
            account_num: enhancedResult.data.account_num,
            delivery_add: enhancedResult.data.delivery_add,
            invoice_to: enhancedResult.data.invoice_to,
            customer_ref: enhancedResult.data.customer_ref,
            products: enhancedResult.data.products,
          };

          extractionMethod = enhancedResult.extractionMethod;
          tokensUsed = enhancedResult.metadata.tokensUsed || Math.ceil(fileData.buffer.byteLength / 4);
          
          console.log('[analyzeOrderPDF] Enhanced extraction successful:', {
            orderRef: orderData.order_ref,
            productCount: orderData.products.length,
            method: extractionMethod,
            tokensUsed,
          });
        } else {
          // 如果增強服務失敗，拋出錯誤以觸發 fallback
          throw new Error(enhancedResult.error || 'Enhanced extraction failed');
        }
      } catch (enhancedError) {
        console.error('[analyzeOrderPDF] Enhanced extraction failed, falling back to Assistant API:', enhancedError);
        useEnhancedExtraction = false; // 標記為失敗，使用 fallback
      }
    }

    // Fallback: 使用原有的 Assistant API
    if (!useEnhancedExtraction) {
      console.log('[analyzeOrderPDF] Using Assistant API (fallback)');
      
      let threadId: string | undefined;
      let fileId: string | undefined;
      
      try {
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
        extractedText = result; // 保存用於存儲

        // 解析結果
        const parsedData = assistantService.parseAssistantResponse(result);
        
        // 嘗試從原始響應提取額外資訊
        let accountNum = '-';
        let deliveryAdd = '-';
        let invoiceTo = '-';
        let customerRef = '-';
        
        try {
          let cleanedResult = result;
          const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            cleanedResult = codeBlockMatch[1].trim();
          }
          
          const rawParsed = JSON.parse(cleanedResult);
          if (rawParsed.orders && Array.isArray(rawParsed.orders) && rawParsed.orders.length > 0) {
            const firstOrder = rawParsed.orders[0];
            accountNum = firstOrder.account_num || '-';
            deliveryAdd = firstOrder.delivery_add || '-';
          }
        } catch (rawParseError) {
          console.warn('[analyzeOrderPDF] Could not extract extra fields, using defaults');
        }
        
        // 構建訂單數據
        orderData = {
          order_ref: parsedData.order_ref || '',
          account_num: accountNum,
          delivery_add: deliveryAdd,
          invoice_to: invoiceTo,
          customer_ref: customerRef,
          products: parsedData.products.map(product => ({
            product_code: product.product_code,
            product_desc: product.description || '',
            product_qty: product.quantity,
            weight: 0,
            unit_price: product.unit_price?.toString() || '0',
          })),
        };
        
        extractionMethod = 'assistant-api';
        tokensUsed = Math.ceil(fileData.buffer.byteLength / 4);
        
        // 清理資源
        await assistantService.cleanup(threadId, fileId).catch(error => {
          console.error('[analyzeOrderPDF] Cleanup failed:', error);
        });
      } catch (assistantError) {
        // 清理資源
        if (threadId || fileId) {
          const assistantService = AssistantService.getInstance();
          await assistantService.cleanup(threadId, fileId).catch(() => {});
        }
        throw assistantError;
      }
    }

    // 確保 orderData 已被賦值
    if (!orderData) {
      throw new Error('Failed to extract order data from PDF');
    }

    // 存儲到資料庫
    await storeEnhancedOrderData(orderData, uploadedBy, tokensUsed);

    // 記錄操作歷史
    await recordOrderUploadHistory(orderData.order_ref, uploadedBy);

    // 發送電郵通知
    const emailResult = await sendEmailNotification(orderData, fileData, uploadedBy);
    
    if (!emailResult.success) {
      console.error('[analyzeOrderPDF] Email notification failed:', emailResult.error);
    } else {
      console.log('[analyzeOrderPDF] Email sent successfully:', emailResult.details);
    }

    // 背景存儲
    if (saveToStorage) {
      try {
        console.log('[analyzeOrderPDF] Starting background storage upload');
        const storageUrl = await uploadToStorageAsync(fileData, uploadedBy, extractedText || JSON.stringify(orderData));
        if (storageUrl) {
          console.log('[analyzeOrderPDF] Background storage completed successfully:', storageUrl);
        } else {
          console.warn('[analyzeOrderPDF] Background storage returned null');
        }
      } catch (error) {
        console.error('[analyzeOrderPDF] Background storage failed:', error);
      }
    }

    // 緩存結果
    setCachedResult(fileHash, {
      success: true,
      orderData,
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

    console.log('[analyzeOrderPDF] Analysis completed successfully:', {
      orderRef: orderData.order_ref,
      productCount: orderData.products.length,
      method: extractionMethod,
      processingTime,
      tokensUsed,
    });

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
      .eq('email', user.email || '')
      .single();

    return userDataByEmail?.id || null;
  } catch (error) {
    console.error('[getCurrentUserId] Error:', error);
    return null;
  }
}
