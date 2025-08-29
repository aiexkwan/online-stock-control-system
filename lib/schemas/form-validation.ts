/**
 * 表單驗證 Schema
 * 
 * 統一的 Zod 表單驗證系統，整合現有的表單組件
 */

import { z } from 'zod';

// 基礎驗證 Schema
export const emailSchema = z
  .string()
  .min(1, '電子郵件為必填項')
  .email('請輸入有效的電子郵件格式');

export const passwordSchema = z
  .string()
  .min(6, '密碼長度至少需要 6 個字符')
  .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/, '密碼只能包含字母、數字和特殊符號');

export const clockNumberSchema = z
  .string()
  .regex(/^\d+$/, 'Clock Number 必須為正整數')
  .transform(val => parseInt(val, 10))
  .refine(val => val > 0, 'Clock Number 必須大於 0');

// 認證表單 Schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  clockNumber: clockNumberSchema,
  name: z.string().min(1, '姓名為必填項').max(50, '姓名長度不能超過 50 個字符'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '密碼確認不匹配',
    path: ['confirmPassword'],
  }
);

export const resetPasswordFormSchema = z.object({
  email: emailSchema,
});

export const changePasswordFormSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: '新密碼確認不匹配',
    path: ['confirmPassword'],
  }
);

// 產品和庫存相關 Schema
export const productCodeSchema = z
  .string()
  .min(1, '產品代碼不能為空')
  .max(20, '產品代碼長度不能超過 20 個字符')
  .regex(/^[A-Z0-9_-]+$/i, '產品代碼只能包含字母、數字、下劃線和連字符');

export const quantitySchema = z
  .number()
  .min(0, '數量不能為負數')
  .max(999999, '數量不能超過 999999');

export const stockTransferFormSchema = z.object({
  productCode: productCodeSchema,
  fromLocation: z.string().min(1, '來源位置為必填項'),
  toLocation: z.string().min(1, '目標位置為必填項'),
  quantity: quantitySchema,
  reason: z.string().optional(),
}).refine(
  (data) => data.fromLocation !== data.toLocation,
  {
    message: '來源位置和目標位置不能相同',
    path: ['toLocation'],
  }
);

// GRN 相關 Schema  
export const grnFormSchema = z.object({
  grnRef: z.number().positive('GRN 參考號必須為正數'),
  materialCode: productCodeSchema,
  supplierCode: z.string().min(1, '供應商代碼為必填項'),
  grossWeight: z.number().positive('毛重必須為正數'),
  netWeight: z.number().positive('淨重必須為正數'),
  palletCount: z.number().min(1, '棧板數量至少為 1'),
  packageCount: z.number().min(1, '包裝數量至少為 1'),
  receiveDate: z.string().refine(date => !isNaN(Date.parse(date)), '無效的日期格式'),
  receiveBy: z.string().min(1, '接收人為必填項'),
  remarks: z.string().optional(),
});

// 訂單相關 Schema
export const orderFormSchema = z.object({
  orderRef: z.string().min(1, '訂單參考號為必填項'),
  customerRef: z.string().optional(),
  deliveryAddress: z.string().min(1, '送貨地址為必填項'),
  deliveryDate: z.string().refine(date => !isNaN(Date.parse(date)), '無效的日期格式'),
  accountNumber: z.string().optional(),
  items: z.array(z.object({
    productCode: productCodeSchema,
    quantity: quantitySchema,
    description: z.string().optional(),
  })).min(1, '訂單必須包含至少一個項目'),
});

// QC 標籤相關 Schema
export const qcLabelFormSchema = z.object({
  productCode: productCodeSchema,
  lotNumber: z.string().min(1, '批次號為必填項'),
  quantity: quantitySchema,
  inspectionDate: z.string().refine(date => !isNaN(Date.parse(date)), '無效的日期格式'),
  inspector: z.string().min(1, '檢驗員為必填項'),
  status: z.enum(['PASS', 'FAIL', 'PENDING'], {
    required_error: '檢驗狀態為必填項',
  }),
  remarks: z.string().optional(),
});

// 供應商相關 Schema
export const supplierFormSchema = z.object({
  supplierCode: z.string().min(1, '供應商代碼為必填項'),
  supplierName: z.string().min(1, '供應商名稱為必填項'),
  contactEmail: emailSchema.optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

// API 請求驗證 Schema
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().min(1),
  query: z.record(z.unknown()).optional(),
  body: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
});

// 文件上傳 Schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: '請選擇有效的文件' }),
  type: z.enum(['pdf', 'excel', 'csv', 'image']),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
});

// 導出類型
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
export type StockTransferFormData = z.infer<typeof stockTransferFormSchema>;
export type GrnFormData = z.infer<typeof grnFormSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type QcLabelFormData = z.infer<typeof qcLabelFormSchema>;
export type SupplierFormData = z.infer<typeof supplierFormSchema>;
export type ApiRequestData = z.infer<typeof apiRequestSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;

// 驗證工具函數
export function validateLoginForm(data: unknown) {
  return loginFormSchema.safeParse(data);
}

export function validateRegisterForm(data: unknown) {
  return registerFormSchema.safeParse(data);
}

export function validateStockTransferForm(data: unknown) {
  return stockTransferFormSchema.safeParse(data);
}

export function validateGrnForm(data: unknown) {
  return grnFormSchema.safeParse(data);
}

export function validateOrderForm(data: unknown) {
  return orderFormSchema.safeParse(data);
}

export function validateQcLabelForm(data: unknown) {
  return qcLabelFormSchema.safeParse(data);
}

export function validateSupplierForm(data: unknown) {
  return supplierFormSchema.safeParse(data);
}

export function validateApiRequest(data: unknown) {
  return apiRequestSchema.safeParse(data);
}

export function validateFileUpload(data: unknown) {
  return fileUploadSchema.safeParse(data);
}

// 統一錯誤處理
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (path) {
      errors[path] = err.message;
    }
  });
  
  return errors;
}

// 表單驗證 Hook 支援
export function createFormValidator<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => schema.safeParse(data),
    validateField: (field: keyof T, value: unknown) => {
      // 安全檢查 schema 是否有 shape 屬性
      if ('shape' in schema && schema.shape) {
        const fieldSchema = (schema.shape as Record<string, z.ZodTypeAny>)[field as string];
        if (fieldSchema) {
          return fieldSchema.safeParse(value);
        }
      }
      return { success: true, data: value };
    },
    formatErrors: formatZodErrors,
  };
}