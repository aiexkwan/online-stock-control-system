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
  productFormSchema,
  orderFormSchema,
  customerFormSchema,
  supplierFormSchema,
  userFormSchema,
  locationFormSchema,
} from './form-validation';

export {
  ApiResponse,
  ApiResponseSchema,
  DatabaseRecord,
  DatabaseRecordSchema,
  ErrorResponse,
  ErrorResponseSchema,
  ProductCodeSchema,
} from './shared';

export {
  PrintLabelRequestSchema,
  QCLabelRequestSchema,
  GRNLabelRequestSchema,
} from './printing';

// 重新導出現有的 zod-schemas 以保持向後相容（避免重複）
export {
  createUserSchema,
  updateUserSchema,
  QueryParams as ZodQueryParams,
  validateQueryParams as zodValidateQueryParams,
} from '@/lib/validation/zod-schemas';

// 業務 Schema
export * from '@/lib/types/business-schemas';
export * from '@/lib/types/warehouse-rpc-schemas';

// API 驗證工具（只導出不重複的）
export {
  withApiValidation,
  validateRequestBody,
  validateQueryParams as apiValidateQueryParams,
} from '@/lib/utils/api-validation';
