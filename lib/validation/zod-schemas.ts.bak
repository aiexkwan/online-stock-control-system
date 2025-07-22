/**
 * Zod 驗證 Schema 統一定義
 *
 * 多專家協作設計：
 * - 架構專家：Schema 結構設計
 * - QA 專家：驗證規則制定
 * - 代碼品質專家：類型安全保證
 */

import { z } from 'zod';

// 基礎類型 Schema
export const DatabaseRecordSchema = z.record(z.unknown());

// 產品代碼 Schema
export const ProductCodeSchema = z.string().min(1, '產品代碼不能為空');

// 數量 Schema
export const QuantitySchema = z.number().min(0, '數量不能為負數');

// 日期 Schema
export const DateSchema = z.string().refine(date => !isNaN(Date.parse(date)), '無效的日期格式');

// 電子郵件 Schema
export const EmailSchema = z.string().email('無效的電子郵件格式');

// UUID Schema
export const UUIDSchema = z.string().uuid('無效的 UUID 格式');

// 資料庫表格 Schema
export const DataCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  type: z.string(),
  colour: z.string().optional(),
  standard_qty: z.number().optional(),
  remark: z.string().nullable().optional(),
});

export const DataIdSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  department: z.string(),
  position: z.string().optional(),
  uuid: z.string().uuid().optional(),
  icon_url: z.string().url().nullable().optional(),
});

export const RecordInventorySchema = z.object({
  product_code: z.string(),
  injection: z.number().nullable().optional(),
  pipeline: z.number().nullable().optional(),
  prebook: z.number().nullable().optional(),
  await: z.number().nullable().optional(),
  fold: z.number().nullable().optional(),
  bulk: z.number().nullable().optional(),
  await_grn: z.number().nullable().optional(),
  backcarpark: z.number().nullable().optional(),
});

export const RecordPalletinfoSchema = z.object({
  plt_num: z.string(),
  product_code: z.string(),
  product_qty: z.number(),
  generate_time: z.string(),
  void_time: z.string().nullable().optional(),
  void_reason: z.string().nullable().optional(),
  void_by: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  special_remark: z.string().nullable().optional(),
});

export const RecordAcoSchema = z.object({
  id: z.number(),
  order_ref: z.number(),
  code: z.string(),
  required_qty: z.number().nullable().optional(),
  delivered_qty: z.number().nullable().optional(),
  account_num: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  delivery_add: z.string().nullable().optional(),
  customer_ref: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const RecordGrnSchema = z.object({
  id: z.number(),
  grn_ref: z.number(),
  material_code: z.string(),
  sup_code: z.string(),
  gross_weight: z.number(),
  net_weight: z.number(),
  pallet: z.string(),
  package: z.string(),
  pallet_count: z.number(),
  package_count: z.number(),
  receive_date: z.string().nullable().optional(),
  receive_by: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
});

// API 請求 Schema
export const ApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  query: z.record(z.unknown()).optional(),
  body: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
});

// API 響應 Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

// 查詢參數 Schema
export const QueryParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(1000).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  filter: z.record(z.unknown()).optional(),
});

// 報表生成 Schema
export const ReportGenerationSchema = z.object({
  type: z.enum(['aco', 'grn', 'inventory', 'transfer']),
  format: z.enum(['pdf', 'excel', 'csv']),
  date_range: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  filters: z.record(z.unknown()).optional(),
  options: z
    .object({
      include_headers: z.boolean().default(true),
      include_summary: z.boolean().default(false),
      group_by: z.string().optional(),
    })
    .optional(),
});

// 檔案上傳 Schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['pdf', 'excel', 'csv', 'image']),
  max_size: z.number().default(10 * 1024 * 1024), // 10MB
  allowed_types: z.array(z.string()).optional(),
});

// 用戶操作 Schema
export const UserActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'view', 'export']),
  resource: z.string(),
  resource_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
});

// 庫存分佈 Schema
export const StockDistributionSchema = z.object({
  name: z.string(),
  size: z.number().min(0),
  value: z.number().min(0),
  percentage: z.number().min(0).max(100),
  color: z.string(),
  fill: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
});

// 產品項目 Schema
export const ProductItemSchema = z.object({
  product_code: z.string(),
  product_desc: z.string().optional(),
  product_qty: z.number().min(0).optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  weight: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
});

// 訂單項目 Schema
export const OrderItemSchema = z.object({
  order_ref: z.string(),
  account_num: z.string().optional(),
  delivery_add: z.string().optional(),
  customer_ref: z.string().optional(),
  delivery_date: z.string().optional(),
  total_weight: z.number().min(0).optional(),
  total_qty: z.number().min(0).optional(),
});

// 導出類型
export type DatabaseRecord = z.infer<typeof DatabaseRecordSchema>;
export type DataCode = z.infer<typeof DataCodeSchema>;
export type DataId = z.infer<typeof DataIdSchema>;
export type RecordInventory = z.infer<typeof RecordInventorySchema>;
export type RecordPalletinfo = z.infer<typeof RecordPalletinfoSchema>;
export type RecordAco = z.infer<typeof RecordAcoSchema>;
export type RecordGrn = z.infer<typeof RecordGrnSchema>;
export type ApiRequest = z.infer<typeof ApiRequestSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type QueryParams = z.infer<typeof QueryParamsSchema>;
export type ReportGeneration = z.infer<typeof ReportGenerationSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type UserAction = z.infer<typeof UserActionSchema>;
export type StockDistribution = z.infer<typeof StockDistributionSchema>;
export type ProductItem = z.infer<typeof ProductItemSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

// 工具函數：安全解析
export function safeParseProductCode(value: unknown): string | null {
  const result = ProductCodeSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function safeParseQuantity(value: unknown): number | null {
  const result = QuantitySchema.safeParse(value);
  return result.success ? result.data : null;
}

export function safeParseDate(value: unknown): string | null {
  const result = DateSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function safeParseEmail(value: unknown): string | null {
  const result = EmailSchema.safeParse(value);
  return result.success ? result.data : null;
}

// 驗證函數
export function validateApiRequest(data: unknown): {
  success: boolean;
  data?: ApiRequest;
  error?: string;
} {
  const result = ApiRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

export function validateDatabaseRecord(data: unknown): {
  success: boolean;
  data?: DatabaseRecord;
  error?: string;
} {
  const result = DatabaseRecordSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

export function validateQueryParams(data: unknown): {
  success: boolean;
  data?: QueryParams;
  error?: string;
} {
  const result = QueryParamsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}
