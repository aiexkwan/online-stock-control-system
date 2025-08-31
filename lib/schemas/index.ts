/**
 * 統一 Schema 導出點
 *
 * 集中管理所有 Zod schema，提供統一的導入入口
 */

// 核心驗證 Schema
export {
  loginFormSchema,
  registerFormSchema,
  stockTransferFormSchema,
  grnFormSchema,
  orderFormSchema,
  supplierFormSchema,
  qcLabelFormSchema,
  // 基礎 Schema
  productCodeSchema,
  quantitySchema,
  emailSchema,
  passwordSchema,
  clockNumberSchema,
  // 驗證工具函數
  validateLoginForm,
  validateRegisterForm,
  validateStockTransferForm,
  validateGrnForm,
  validateOrderForm,
  validateQcLabelForm,
  validateSupplierForm,
  formatZodErrors,
  createFormValidator,
} from './form-validation';

// 表單驗證類型導出
export type {
  LoginFormData,
  RegisterFormData,
  StockTransferFormData,
  GrnFormData,
  OrderFormData,
  QcLabelFormData,
  SupplierFormData,
} from './form-validation';

// 共用 Schema（值導出）
export {
  ApiResponseSchema,
  ErrorResponseSchema,
  DatabaseRecordSchema,
  ProductCodeSchema,
  UuidSchema,
  TimestampSchema,
  PaginationSchema,
} from './shared';

// 共用類型（類型導出）
export type { ApiResponse, ErrorResponse, DatabaseRecord, Pagination, TimeRange } from './shared';

// 列印相關 Schema（值導出）
export {
  PrintTypeSchema,
  QcLabelDataSchema,
  GrnLabelDataSchema,
  TemplateConfigSchema,
  PrintJobSchema,
  PrintServiceResponseSchema,
} from './printing';

// 列印相關類型（類型導出）
export type {
  PrintType,
  QcLabelData,
  GrnLabelData,
  TemplateConfig,
  PrintJob,
  PrintServiceResponse,
} from './printing';

// 重新導出現有的 zod-schemas 以保持向後相容
export {
  ProductCodeSchema as ZodProductCodeSchema,
  QuantitySchema as ZodQuantitySchema,
  EmailSchema as ZodEmailSchema,
  ApiRequestSchema,
  ApiResponseSchema as ZodApiResponseSchema,
  QueryParamsSchema,
  DatabaseRecordSchema as ZodDatabaseRecordSchema,
  validateQueryParams as zodValidateQueryParams,
} from '../validation/zod-schemas';

// zod-schemas 類型導出
export type {
  QueryParams as ZodQueryParams,
  ApiRequest as ZodApiRequest,
  ApiResponse as ZodApiResponse,
  DatabaseRecord as ZodDatabaseRecord,
} from '../validation/zod-schemas';

// 業務 Schema
export * from '../types/business-schemas';
export * from '../types/warehouse-rpc-schemas';

// API 驗證工具
export {
  withValidation,
  validateRequestBody,
  validateQueryParams as apiValidateQueryParams,
  createSuccessResponse,
  createErrorResponse,
  validateAuth,
} from '../utils/api-validation';

// API 驗證類型
export type {
  ApiResponse as ValidationApiResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  PaginationParams,
  QueryParams as ValidationQueryParams,
} from '../utils/api-validation';
