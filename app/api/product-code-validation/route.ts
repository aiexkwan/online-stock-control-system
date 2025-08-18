/**
 * Product Code Validation API
 * 
 * 提供產品代碼驗證和豐富化服務的 REST API 端點
 * 
 * 端點: POST /api/product-code-validation
 * 
 * 請求格式:
 * {
 *   "codes": ["ABC123", "XYZ789", "invalid001"]
 * }
 * 
 * 回應格式:
 * {
 *   "success": true,
 *   "data": {
 *     "enrichedOrders": [...],
 *     "summary": {...}
 *   },
 *   "processingTime": 45,
 *   "cacheStats": {...}
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import ProductCodeValidator from '@/app/services/productCodeValidator';
import type { ValidationResult } from '@/app/services/productCodeValidator';
import { createLogger, logApiRequest, logApiResponse } from '@/lib/logger';

const apiLogger = createLogger('ProductCodeValidationAPI');

// 請求驗證 Schema
const ValidationRequestSchema = z.object({
  codes: z.array(z.string()).min(1, 'Codes array cannot be empty').max(100, 'Maximum 100 codes per request'),
  options: z.object({
    includeCacheStats: z.boolean().default(false),
    includeHealthCheck: z.boolean().default(false),
  }).optional(),
});

type ValidationRequest = z.infer<typeof ValidationRequestSchema>;

// 回應格式
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    processingTime: number;
    timestamp: string;
    requestId: string;
  };
}

interface ValidationApiResponse extends ValidationResult {
  cacheStats?: ReturnType<typeof ProductCodeValidator.getCacheStats>;
  healthCheck?: Awaited<ReturnType<typeof ProductCodeValidator.healthCheck>>;
}

/**
 * POST /api/product-code-validation
 * 驗證產品代碼列表
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // 記錄請求
    logApiRequest('POST', '/api/product-code-validation', {}, 'ProductCodeValidation');
    
    // 解析請求體
    const body = await request.json();
    
    // 驗證請求格式
    const validationResult = ValidationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = 'Invalid request format';
      apiLogger.warn('Request validation failed', {
        requestId,
        errors: validationResult.error.errors,
        body: typeof body === 'object' ? Object.keys(body) : body,
      });
      
      logApiResponse('POST', '/api/product-code-validation', 400, Date.now() - startTime);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: errorMessage,
          details: validationResult.error.errors,
        },
        meta: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }, { status: 400 });
    }

    const { codes, options } = validationResult.data;
    
    apiLogger.info('Processing validation request', {
      requestId,
      codeCount: codes.length,
      includeCacheStats: options?.includeCacheStats,
      includeHealthCheck: options?.includeHealthCheck,
    });

    // 執行產品代碼驗證
    const validationResults = await ProductCodeValidator.validateAndEnrichCodes(codes);
    
    // 構建回應數據
    const responseData: ValidationApiResponse = {
      ...validationResults,
    };

    // 可選：包含快取統計
    if (options?.includeCacheStats) {
      responseData.cacheStats = ProductCodeValidator.getCacheStats();
    }

    // 可選：包含健康檢查
    if (options?.includeHealthCheck) {
      responseData.healthCheck = await ProductCodeValidator.healthCheck();
    }

    const processingTime = Date.now() - startTime;
    
    apiLogger.info('Validation request completed', {
      requestId,
      total: validationResults.summary.total,
      valid: validationResults.summary.valid,
      corrected: validationResults.summary.corrected,
      invalid: validationResults.summary.invalid,
      processingTime,
    });

    logApiResponse('POST', '/api/product-code-validation', 200, processingTime);

    return NextResponse.json<ApiResponse<ValidationApiResponse>>({
      success: true,
      data: responseData,
      meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    apiLogger.error('Validation request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
    });

    logApiResponse('POST', '/api/product-code-validation', 500, processingTime);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        requestId,
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/product-code-validation
 * 獲取服務狀態和統計信息
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    logApiRequest('GET', '/api/product-code-validation');

    // 獲取系統狀態
    const healthCheck = await ProductCodeValidator.healthCheck();
    const cacheStats = ProductCodeValidator.getCacheStats();
    
    const responseData = {
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      health: healthCheck.details,
    };

    const processingTime = Date.now() - startTime;
    logApiResponse('GET', '/api/product-code-validation', 200, processingTime);

    return NextResponse.json<ApiResponse<typeof responseData>>({
      success: true,
      data: responseData,
      meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    apiLogger.error('Status request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
    });

    logApiResponse('GET', '/api/product-code-validation', 500, processingTime);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve service status',
      },
      meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }, { status: 500 });
  }
}

/**
 * OPTIONS /api/product-code-validation
 * CORS 預檢請求處理
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}