/**
 * API 驗證 Schema 統一定義
 * 提供標準化的 API 請求和響應驗證
 *
 * 設計原則：
 * - 使用 Zod 進行運行時類型驗證
 * - 提供詳細的錯誤訊息
 * - 支援嵌套驗證和轉換
 * - 統一的錯誤處理模式
 */

import { z } from 'zod';

// ===== 基礎驗證 Schema =====

export const CommonIdSchema = z.string().uuid('無效的 UUID 格式');
export const PaginationSchema = z.object({
  page: z.number().int().min(1, '頁碼必須大於等於 1').default(1),
  limit: z.number().int().min(1).max(100, '每頁最多 100 條記錄').default(10),
  offset: z.number().int().min(0).optional(),
});

export const SortSchema = z.object({
  field: z.string().min(1, '排序欄位不能為空'),
  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: '排序方向必須是 asc 或 desc' }),
    })
    .default('asc'),
});

export const DateRangeSchema = z
  .object({
    startDate: z.string().datetime('開始日期格式無效'),
    endDate: z.string().datetime('結束日期格式無效'),
  })
  .refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: '開始日期不能晚於結束日期',
    path: ['startDate'],
  });

// ===== API 請求 Schema =====

export const ApiRequestMetaSchema = z.object({
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  requestId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  userAgent: z.string().optional(),
  ip: z.string().ip().optional(),
});

export const BaseApiRequestSchema = z.object({
  meta: ApiRequestMetaSchema.optional(),
  pagination: PaginationSchema.optional(),
  sort: SortSchema.optional(),
  filters: z.record(z.unknown()).optional(),
});

// ===== API 響應 Schema =====

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  field: z.string().optional(),
  suggestion: z.string().optional(),
});

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  received: z.unknown().optional(),
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: ApiErrorSchema.optional(),
  errors: z.array(ValidationErrorSchema).optional(),
  meta: z
    .object({
      timestamp: z.string().datetime(),
      requestId: z.string().uuid().optional(),
      executionTime: z.number().min(0).optional(),
      version: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      total: z.number().int().min(0),
      totalPages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    })
    .optional(),
});

// ===== 專業領域 Schema =====

export const ProductCodeValidationSchema = z.object({
  code: z
    .string()
    .min(1, '產品代碼不能為空')
    .max(50, '產品代碼不能超過 50 個字符')
    .regex(/^[A-Z0-9\-_]+$/, '產品代碼只能包含大寫字母、數字、連字符和底線'),
});

export const QuantityValidationSchema = z.object({
  quantity: z
    .number()
    .int('數量必須為整數')
    .min(0, '數量不能為負數')
    .max(999999, '數量不能超過 999,999'),
});

export const UserIdValidationSchema = z.object({
  userId: CommonIdSchema,
});

export const GrnValidationSchema = z.object({
  grnRef: z.number().int().min(1, 'GRN 參考號必須大於 0'),
  materialCode: ProductCodeValidationSchema.shape.code,
  supplierCode: z.string().min(1, '供應商代碼不能為空').max(20),
  grossWeight: z.number().min(0, '毛重不能為負數'),
  netWeight: z.number().min(0, '淨重不能為負數'),
  palletCount: z.number().int().min(0, '棧板數量不能為負數'),
  packageCount: z.number().int().min(0, '包裝數量不能為負數'),
  receiveDate: z.string().date('接收日期格式無效'),
  receiveBy: z.string().min(1, '接收人員不能為空').max(50),
  remarks: z.string().max(500, '備註不能超過 500 個字符').optional(),
});

export const OrderValidationSchema = z.object({
  orderRef: z.string().min(1, '訂單參考號不能為空').max(20),
  accountNum: z.string().max(50).optional(),
  deliveryAddress: z.string().max(200).optional(),
  customerRef: z.string().max(50).optional(),
  deliveryDate: z.string().date().optional(),
  items: z
    .array(
      z.object({
        productCode: ProductCodeValidationSchema.shape.code,
        requiredQuantity: z.number().int().min(1, '必需數量必須大於 0'),
        deliveredQuantity: z.number().int().min(0, '已送數量不能為負數').optional(),
      })
    )
    .min(1, '訂單必須包含至少一個項目'),
});

export const PdfGenerationRequestSchema = z.object({
  type: z.enum(['qc_label', 'grn_label', 'report', 'custom'], {
    errorMap: () => ({ message: '無效的 PDF 類型' }),
  }),
  data: z.unknown(), // 具體驗證由各個 PDF 生成器處理
  options: z
    .object({
      paperSize: z.enum(['A4', 'A3', 'Letter']).default('A4'),
      orientation: z.enum(['portrait', 'landscape']).default('portrait'),
      margin: z
        .object({
          top: z.number().min(0).default(20),
          right: z.number().min(0).default(20),
          bottom: z.number().min(0).default(20),
          left: z.number().min(0).default(20),
        })
        .optional(),
    })
    .optional(),
});

// ===== 工具函數 =====

export type ApiRequest = z.infer<typeof BaseApiRequestSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ProductCodeValidation = z.infer<typeof ProductCodeValidationSchema>;
export type QuantityValidation = z.infer<typeof QuantityValidationSchema>;
export type GrnValidation = z.infer<typeof GrnValidationSchema>;
export type OrderValidation = z.infer<typeof OrderValidationSchema>;
export type PdfGenerationRequest = z.infer<typeof PdfGenerationRequestSchema>;

// Define validation result types explicitly
export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationFailure = {
  success: false;
  errors: ValidationError[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Type guard to check if validation failed
export function isValidationFailure<T>(result: ValidationResult<T>): result is ValidationFailure {
  return !result.success;
}

/**
 * 安全驗證 API 請求
 */
export function validateApiRequest<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data } as ValidationSuccess<z.infer<T>>;
  }

  const errors: ValidationError[] = result.error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    received: 'received' in issue ? issue.received : undefined,
  }));

  return { success: false, errors } as ValidationFailure;
}

/**
 * 創建標準化的 API 響應
 */
export function createApiResponse<T = unknown>(params: {
  success: boolean;
  data?: T;
  error?: ApiError;
  errors?: ValidationError[];
  meta?: {
    requestId?: string;
    executionTime?: number;
    version?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}): ApiResponse {
  return {
    success: params.success,
    data: params.data,
    error: params.error,
    errors: params.errors,
    meta: {
      timestamp: new Date().toISOString(),
      ...params.meta,
    },
    pagination: params.pagination,
  };
}

/**
 * 創建標準化的 API 錯誤響應
 */
export function createApiErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  field?: string,
  suggestion?: string
): ApiResponse {
  return createApiResponse({
    success: false,
    error: {
      code,
      message,
      details,
      field,
      suggestion,
    },
  });
}

/**
 * 從 Zod 錯誤創建 API 錯誤響應
 */
export function createValidationErrorResponse(errors: ValidationError[]): ApiResponse {
  return createApiResponse({
    success: false,
    errors,
  });
}

/**
 * 中間件：驗證請求並處理錯誤
 */
export function withApiValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (validatedData: z.infer<T>) => Promise<ApiResponse> | ApiResponse
) {
  return async (request: unknown): Promise<ApiResponse> => {
    const validation = validateApiRequest(request, schema);

    if (isValidationFailure(validation)) {
      return createValidationErrorResponse(validation.errors);
    }

    try {
      return await handler(validation.data);
    } catch (error) {
      console.error('[withApiValidation] Handler error:', error);

      return createApiErrorResponse(
        'HANDLER_ERROR',
        '處理請求時發生錯誤',
        error instanceof Error ? error.message : String(error)
      );
    }
  };
}
