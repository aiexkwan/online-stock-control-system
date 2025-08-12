/**
 * Zod 驗證 Schema 統一定義
 *
 * 多專家協作設計：
 * - 架構專家：Schema 結構設計
 * - QA 專家：驗證規則制定
 * - 代碼品質專家：類型安全保證
 */

import { z } from 'zod';

// ===== 改進的 Database Type System =====

// 基礎安全類型（不變）
export const SafeDatabaseValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.date(),
  z.null(),
  z.undefined()
]);

// 關聯查詢結果 Schema（如 data_code, data_supplier, data_id）
export const RelationResultSchema = z.object({
  description: z.string().optional(),
  colour: z.string().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  id: z.number().optional(),
  code: z.string().optional(),
  supplier_code: z.string().optional(),
  supplier_name: z.string().optional(),
  email: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  uuid: z.string().optional(),
  icon_url: z.string().optional(),
  // 允許其他字符串鍵的安全值
}).catchall(SafeDatabaseValueSchema);

// Forward declare the type
export type DatabaseValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | null 
  | undefined 
  | { [key: string]: DatabaseValue }
  | DatabaseValue[];

// 遞歸 DatabaseValue Schema（支援嵌套）
export const DatabaseValueSchema: z.ZodType<DatabaseValue> = z.lazy(() =>
  z.union([
    SafeDatabaseValueSchema,
    z.record(z.string(), DatabaseValueSchema), // 遞歸物件
    z.array(DatabaseValueSchema), // 遞歸陣列
  ])
);

// 更新的 DatabaseRecord Schema（支援嵌套結構）
export const DatabaseRecordSchema = z.lazy(() => z.record(z.string(), DatabaseValueSchema));

// Legacy Schema（向後相容）
export const LegacyDatabaseRecordSchema = z.record(z.unknown());

// 原始 unknown record schema（作為後備）
export const UnknownDatabaseRecordSchema = z.record(z.unknown());

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
// 原有導出類型
// ===== 類型定義 =====
export type SafeDatabaseValue = z.infer<typeof SafeDatabaseValueSchema>;
export type RelationResult = z.infer<typeof RelationResultSchema>;
// DatabaseValue is already defined as interface above
export type DatabaseRecord = { [key: string]: DatabaseValue };
export type LegacyDatabaseRecord = z.infer<typeof LegacyDatabaseRecordSchema>;
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

// 新增導出類型
export type HistoryState = z.infer<typeof HistoryStateSchema>;
export type RpcData = z.infer<typeof RpcDataSchema>;
export type RpcResult = z.infer<typeof RpcResultSchema>;
export type SupplierData = z.infer<typeof SupplierDataSchema>;
export type SupplierInfo = z.infer<typeof SupplierInfoSchema>;
export type RpcSearchSupplierResponse = z.infer<typeof RpcSearchSupplierResponseSchema>;
export type RpcSupplierMutationResponse = z.infer<typeof RpcSupplierMutationResponseSchema>;
export type EnhancedDatabaseRecord = z.infer<typeof EnhancedDatabaseRecordSchema>;
export type StockLevelHistoryData = z.infer<typeof StockLevelHistoryDataSchema>;
export type QueryResultData = z.infer<typeof QueryResultDataSchema>;
export type DatabaseQueryResponse = z.infer<typeof DatabaseQueryResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type QueryContext = z.infer<typeof QueryContextSchema>;

// ===== 新增的 Schema =====

// History 狀態 Schema - 用於 history controller
export const HistoryStateSchema = z.object({
  palletId: z.string().optional(),
  productCode: z.string().optional(),
  productName: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().optional(),
  weight: z.number().optional(),
  status: z.string().optional(),
  operator: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

// RPC 回應 Schema - 替換 generic unknown
export const RpcDataSchema = z.union([
  z.record(z.unknown()),
  z.array(z.record(z.unknown())),
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

// RPC 結果 Schema
export const RpcResultSchema = z.object({
  data: RpcDataSchema.optional(),
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
  executionTime: z.number().optional(),
  count: z.number().optional(),
});

// Supplier 驗證 Schema - 替換 supplier.ts 中的類型守衛
export const SupplierDataSchema = z.object({
  supplier_code: z.string(),
  supplier_name: z.string(),
});

export const SupplierInfoSchema = z.object({
  code: z.string(),
  name: z.string(),
  address: z.string().optional(),
  supplier_code: z.string().optional(),
  supplier_name: z.string().optional(),
});

export const RpcSearchSupplierResponseSchema = z.object({
  exists: z.boolean(),
  supplier: SupplierDataSchema.optional(),
  normalized_code: z.string().optional(),
});

export const RpcSupplierMutationResponseSchema = z.object({
  success: z.boolean(),
  supplier: SupplierDataSchema.optional(),
  error: z.string().optional(),
});

// ===== 轉換和驗證工具函數 =====

// Enhanced Database Record Schema - 用於複雜查詢結果（支援關聯物件）
export const EnhancedDatabaseRecordSchema = z.object({
  data_code: RelationResultSchema.optional(),
  data_supplier: RelationResultSchema.optional(),
  data_id: RelationResultSchema.optional(),
  // 允許其他關聯欄位
  users: RelationResultSchema.optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: DatabaseValueSchema.optional(),
  }).optional(),
}).catchall(DatabaseValueSchema); // 允許其他 DatabaseValue 欄位

// Stock Level History 分析數據 Schema
export const StockLevelHistoryDataSchema = z.object({
  date: z.string(),
  stockLevel: z.number(),
  location: z.string(),
  changeType: z.string(),
  previousLevel: z.number(),
  newLevel: z.number(),
});

// Ask Database 查詢結果 Schema
export const QueryResultDataSchema = z.object({
  data: z.array(z.record(SafeDatabaseValueSchema)),
  rowCount: z.number(),
  executionTime: z.number(),
});

export const DatabaseQueryResponseSchema = z.object({
  question: z.string(),
  sql: z.string(),
  result: QueryResultDataSchema,
  answer: z.string(),
  complexity: z.enum(['simple', 'medium', 'complex']),
  tokensUsed: z.number(),
  cached: z.boolean(),
  timestamp: z.string(),
  resolvedQuestion: z.string().optional(),
  references: z.array(z.record(SafeDatabaseValueSchema)).optional(),
  performanceAnalysis: z.string().optional(),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  message: z.string(),
  suggestion: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
  showSchema: z.boolean().optional(),
  showExamples: z.boolean().optional(),
  showHelp: z.boolean().optional(),
  details: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});

// Query Context Schema
export const QueryContextSchema = z.object({
  query: z.string(),
  sql: z.string().optional(),
  previousQueries: z.array(z.string()).optional(),
});

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

// ===== 新增的驗證函數 =====

export function validateHistoryState(data: unknown): {
  success: boolean;
  data?: HistoryState;
  error?: string;
} {
  const result = HistoryStateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

export function validateRpcResult(data: unknown): {
  success: boolean;
  data?: RpcResult;
  error?: string;
} {
  const result = RpcResultSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

export function validateSupplierInfo(data: unknown): {
  success: boolean;
  data?: SupplierInfo;
  error?: string;
} {
  const result = SupplierInfoSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

export function validateDatabaseQueryResponse(data: unknown): {
  success: boolean;
  data?: DatabaseQueryResponse;
  error?: string;
} {
  const result = DatabaseQueryResponseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}

// 安全類型轉換函數（更新版）
export function safeParseDatabaseValue(value: unknown): DatabaseValue | null {
  const result = DatabaseValueSchema.safeParse(value);
  return result.success ? result.data : null;
}

// 安全解析為基礎類型（不含嵌套）
export function safeParseBasicValue(value: unknown): SafeDatabaseValue | null {
  const result = SafeDatabaseValueSchema.safeParse(value);
  return result.success ? result.data : null;
}

// 轉換 Legacy Record 到新格式
export function convertLegacyDatabaseRecord(legacy: Record<string, unknown>): DatabaseRecord {
  const converted: DatabaseRecord = {};
  
  for (const [key, value] of Object.entries(legacy)) {
    const parsedValue = safeParseDatabaseValue(value);
    if (parsedValue !== null) {
      converted[key] = parsedValue;
    } else {
      // 對於無法解析的值，保持原樣但記錄警告
      console.warn(`Unable to parse value for key "${key}", keeping as unknown:`, value);
      converted[key] = value as DatabaseValue;
    }
  }
  
  return converted;
}

// 安全轉換到 DatabaseRecord
export function safeCastToDatabaseRecord(data: unknown): DatabaseRecord {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const result = DatabaseRecordSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  
  // 如果驗證失敗，嘗試轉換
  return convertLegacyDatabaseRecord(data as Record<string, unknown>);
}

// 安全轉換到 EnhancedDatabaseRecord
export function safeCastToEnhancedDatabaseRecord(data: unknown): EnhancedDatabaseRecord {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const result = EnhancedDatabaseRecordSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  
  // 如果驗證失敗，嘗試轉換
  const basicRecord = convertLegacyDatabaseRecord(data as Record<string, unknown>);
  return basicRecord as EnhancedDatabaseRecord;
}

export function safeParseRpcData(value: unknown): RpcData | null {
  const result = RpcDataSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function safeParseSupplierData(value: unknown): SupplierData | null {
  const result = SupplierDataSchema.safeParse(value);
  return result.success ? result.data : null;
}

// 類型守衛函數（基於 Zod）
export function isValidHistoryState(value: unknown): value is HistoryState {
  return HistoryStateSchema.safeParse(value).success;
}

export function isValidRpcResult(value: unknown): value is RpcResult {
  return RpcResultSchema.safeParse(value).success;
}

export function isValidSupplierInfo(value: unknown): value is SupplierInfo {
  return SupplierInfoSchema.safeParse(value).success;
}

export function isValidSupplierData(value: unknown): value is SupplierData {
  return SupplierDataSchema.safeParse(value).success;
}

export function isValidRpcSearchSupplierResponse(value: unknown): value is RpcSearchSupplierResponse {
  return RpcSearchSupplierResponseSchema.safeParse(value).success;
}

export function isValidRpcSupplierMutationResponse(value: unknown): value is RpcSupplierMutationResponse {
  return RpcSupplierMutationResponseSchema.safeParse(value).success;
}
