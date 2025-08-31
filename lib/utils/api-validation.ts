/**
 * API 路由驗證工具
 *
 * 統一的 API 請求和回應驗證系統
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';

// API 回應基礎 Schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
});

// API 錯誤回應 Schema
export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
});

// 成功回應 Schema
export const apiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  message: z.string().optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
});

// 分頁參數 Schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// 通用查詢參數 Schema
export const queryParamsSchema = z
  .object({
    search: z.string().optional(),
    filter: z.record(z.unknown()).optional(),
  })
  .merge(paginationSchema);

// 用戶認證參數 Schema
export const userAuthParamsSchema = z.object({
  userId: z.string().uuid('無效的用戶 ID 格式'),
});

// 產品相關參數 Schema
export const productParamsSchema = z.object({
  productCode: z.string().min(1, '產品代碼不能為空'),
  description: z.string().optional(),
  stockLevel: z.number().min(0).optional(),
});

// 庫存轉移參數 Schema
export const stockTransferParamsSchema = z.object({
  fromLocation: z.string().min(1, '來源位置為必填項'),
  toLocation: z.string().min(1, '目標位置為必填項'),
  productCode: z.string().min(1, '產品代碼為必填項'),
  quantity: z.number().positive('數量必須為正數'),
  reason: z.string().optional(),
});

// GRN 參數 Schema
export const grnParamsSchema = z.object({
  grnRef: z.number().positive('GRN 參考號必須為正數'),
  materialCode: z.string().min(1, '物料代碼為必填項'),
  supplierCode: z.string().min(1, '供應商代碼為必填項'),
  grossWeight: z.number().positive('毛重必須為正數'),
  netWeight: z.number().positive('淨重必須為正數'),
  palletCount: z.number().min(1, '棧板數量至少為 1'),
  packageCount: z.number().min(1, '包裝數量至少為 1'),
});

// 訂單參數 Schema
export const orderParamsSchema = z.object({
  orderRef: z.string().min(1, '訂單參考號為必填項'),
  customerRef: z.string().optional(),
  deliveryAddress: z.string().min(1, '送貨地址為必填項'),
  items: z
    .array(
      z.object({
        productCode: z.string().min(1),
        quantity: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .min(1, '訂單必須包含至少一個項目'),
});

// 供應商參數 Schema
export const supplierParamsSchema = z.object({
  supplierCode: z.string().min(1, '供應商代碼為必填項'),
  supplierName: z.string().min(1, '供應商名稱為必填項'),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
});

// 類型定義
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type ApiSuccessResponse = z.infer<typeof apiSuccessResponseSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type QueryParams = z.infer<typeof queryParamsSchema>;
export type UserAuthParams = z.infer<typeof userAuthParamsSchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type StockTransferParams = z.infer<typeof stockTransferParamsSchema>;
export type GrnParams = z.infer<typeof grnParamsSchema>;
export type OrderParams = z.infer<typeof orderParamsSchema>;
export type SupplierParams = z.infer<typeof supplierParamsSchema>;

// 驗證工具函數
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path || 'root'] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { root: 'Unknown validation error' } };
  }
}

export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const params: Record<string, unknown> = {};

  // 使用 forEach 替代 for...of 來避免迭代器問題
  searchParams.forEach((value: string, key: string) => {
    // 嘗試解析數值
    if (/^\d+$/.test(value)) {
      params[key] = parseInt(value, 10);
    } else if (/^\d*\.\d+$/.test(value)) {
      params[key] = parseFloat(value);
    } else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    } else {
      params[key] = value;
    }
  });

  return validateRequestBody(schema, params);
}

// API 路由包裝器
export function withValidation<TBody = unknown, TQuery = unknown>(options: {
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<TQuery>;
  requireAuth?: boolean;
}) {
  return function <
    THandler extends (
      request: NextRequest,
      context: {
        params: { [key: string]: string | string[] };
        body?: TBody;
        query?: TQuery;
        userId?: string;
      }
    ) => Promise<Response>,
  >(handler: THandler): THandler {
    return (async (
      request: NextRequest,
      context: {
        params: { [key: string]: string | string[] };
      }
    ) => {
      try {
        const updatedContext: {
          params: { [key: string]: string | string[] };
          body?: TBody;
          query?: TQuery;
          userId?: string;
        } = { ...context };

        // 驗證請求體
        if (
          options.bodySchema &&
          (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')
        ) {
          try {
            const body = await request.json();
            const bodyValidation = validateRequestBody(options.bodySchema, body);

            if (!bodyValidation.success) {
              return Response.json(
                {
                  success: false,
                  error: 'Invalid request body',
                  details: 'errors' in bodyValidation ? bodyValidation.errors : undefined,
                  timestamp: new Date().toISOString(),
                },
                { status: 400 }
              );
            }

            updatedContext.body = bodyValidation.data;
          } catch (error) {
            return Response.json(
              {
                success: false,
                error: 'Invalid JSON in request body',
                timestamp: new Date().toISOString(),
              },
              { status: 400 }
            );
          }
        }

        // 驗證查詢參數
        if (options.querySchema) {
          const { searchParams } = new URL(request.url);
          const queryValidation = validateQueryParams(options.querySchema, searchParams);

          if (!queryValidation.success) {
            return Response.json(
              {
                success: false,
                error: 'Invalid query parameters',
                details: 'errors' in queryValidation ? queryValidation.errors : undefined,
                timestamp: new Date().toISOString(),
              },
              { status: 400 }
            );
          }

          updatedContext.query = queryValidation.data;
        }

        // 用戶認證檢查
        if (options.requireAuth) {
          const authHeader = request.headers.get('authorization');
          if (!authHeader?.startsWith('Bearer ')) {
            return Response.json(
              {
                success: false,
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
                timestamp: new Date().toISOString(),
              },
              { status: 401 }
            );
          }

          // TODO: 實現 JWT 驗證邏輯
          // const token = authHeader.substring(7);
          // const userId = await validateToken(token);
          // updatedContext.userId = userId;
        }

        return await handler(request, updatedContext);
      } catch (error) {
        console.error('API validation error:', error);
        return Response.json(
          {
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }) as THandler;
  };
}

// 成功回應建構器
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const response = apiSuccessResponseSchema.parse({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });

  return Response.json(response, { status });
}

// 錯誤回應建構器
export function createErrorResponse(
  error: string,
  message?: string,
  details?: unknown,
  status: number = 400
): Response {
  const response = apiErrorResponseSchema.parse({
    success: false,
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
  });

  return Response.json(response, { status });
}

// 驗證中間件
export function validateAuth(request: NextRequest): { userId?: string; error?: Response } {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: createErrorResponse(
        'Unauthorized',
        'Missing or invalid authorization header',
        undefined,
        401
      ),
    };
  }

  // TODO: 實現實際的 JWT 驗證
  // const token = authHeader.substring(7);
  // const userId = validateJWT(token);

  return { userId: 'mock-user-id' }; // 暫時回傳模擬值
}

// 常用驗證器
export const commonValidators = {
  uuid: z.string().uuid('無效的 UUID 格式'),
  email: z.string().email('無效的電子郵件格式'),
  positiveNumber: z.number().positive('必須為正數'),
  nonEmptyString: z.string().min(1, '不能為空字串'),
  productCode: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, '無效的產品代碼格式'),
  dateString: z.string().refine(date => !isNaN(Date.parse(date)), '無效的日期格式'),
} as const;
