/**
 * 增強型表單驗證系統
 * 基於 Zod 提供完整的表單驗證和類型安全
 *
 * 特性：
 * - 運行時類型驗證
 * - 自訂驗證規則
 * - 國際化錯誤訊息
 * - 異步驗證支持
 * - React Hook Form 整合
 */

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UseFormProps } from 'react-hook-form';

// ===== 基礎驗證規則 =====

const requiredString = (fieldName: string) => z.string().min(1, `${fieldName}不能為空`);

const optionalString = z.string().optional();

const email = z.string().min(1, '電子郵件不能為空').email('請輸入有效的電子郵件格式');

const password = z
  .string()
  .min(8, '密碼至少需要 8 個字符')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含大小寫字母和數字');

const confirmPassword = (passwordField: string = 'password') => z.string().min(1, '請確認密碼');

const phoneNumber = z
  .string()
  .regex(/^[+]?[\d\s-()]+$/, '請輸入有效的電話號碼格式')
  .min(8, '電話號碼至少需要 8 位數字');

const productCode = z
  .string()
  .min(1, '產品代碼不能為空')
  .max(50, '產品代碼不能超過 50 個字符')
  .regex(/^[A-Z0-9\-_]+$/, '產品代碼只能包含大寫字母、數字、連字符和底線')
  .transform(val => val.toUpperCase());

const quantity = z
  .number({ invalid_type_error: '數量必須為數字' })
  .int('數量必須為整數')
  .min(0, '數量不能為負數')
  .max(999999, '數量不能超過 999,999');

const weight = z
  .number({ invalid_type_error: '重量必須為數字' })
  .min(0, '重量不能為負數')
  .max(99999.99, '重量不能超過 99,999.99');

const date = z.string().refine(val => !isNaN(Date.parse(val)), { message: '請輸入有效的日期格式' });

// ===== 認證表單 Schema =====

export const loginFormSchema = z.object({
  clockNumber: z
    .string()
    .min(1, '工號不能為空')
    .regex(/^\d+$/, '工號只能包含數字')
    .transform(val => parseInt(val, 10)),
  password: requiredString('密碼'),
  rememberMe: z.boolean().default(false),
});

export const registerFormSchema = z
  .object({
    clockNumber: z
      .string()
      .min(1, '工號不能為空')
      .regex(/^\d+$/, '工號只能包含數字')
      .transform(val => parseInt(val, 10)),
    email: email,
    password: password,
    confirmPassword: confirmPassword(),
    department: requiredString('部門'),
    position: optionalString,
    agreeToTerms: z.boolean().refine(val => val === true, { message: '必須同意服務條款' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '密碼確認不匹配',
    path: ['confirmPassword'],
  });

export const changePasswordFormSchema = z
  .object({
    currentPassword: requiredString('目前密碼'),
    newPassword: password,
    confirmPassword: confirmPassword('newPassword'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: '新密碼確認不匹配',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: '新密碼不能與目前密碼相同',
    path: ['newPassword'],
  });

export const resetPasswordFormSchema = z.object({
  email: email,
});

// ===== 業務表單 Schema =====

export const productFormSchema = z.object({
  code: productCode,
  description: requiredString('產品描述'),
  type: requiredString('產品類型'),
  color: optionalString,
  standardQuantity: z.number().min(0).optional(),
  remarks: z.string().max(500, '備註不能超過 500 個字符').optional(),
});

export const grnFormSchema = z.object({
  grnRef: z
    .number({ invalid_type_error: 'GRN 參考號必須為數字' })
    .int('GRN 參考號必須為整數')
    .min(1, 'GRN 參考號必須大於 0'),
  materialCode: productCode,
  supplierCode: requiredString('供應商代碼'),
  grossWeight: weight,
  netWeight: weight,
  pallet: requiredString('棧板'),
  package: requiredString('包裝'),
  palletCount: quantity,
  packageCount: quantity,
  receiveDate: date,
  receiveBy: requiredString('接收人員'),
  remarks: z.string().max(500, '備註不能超過 500 個字符').optional(),
});

export const orderFormSchema = z.object({
  orderRef: requiredString('訂單參考號'),
  accountNum: optionalString,
  deliveryAddress: z.string().max(200, '送貨地址不能超過 200 個字符').optional(),
  customerRef: optionalString,
  deliveryDate: date.optional(),
  items: z
    .array(
      z.object({
        productCode: productCode,
        requiredQuantity: z
          .number({ invalid_type_error: '必需數量必須為數字' })
          .int('必需數量必須為整數')
          .min(1, '必需數量必須大於 0'),
        description: optionalString,
      })
    )
    .min(1, '訂單必須包含至少一個項目'),
});

export const qcLabelFormSchema = z.object({
  productCode: productCode,
  productName: optionalString,
  quantity: quantity,
  palletNumber: requiredString('棧板號碼'),
  location: requiredString('位置'),
  qcBy: requiredString('QC 人員'),
  qcDate: date,
  batchNumber: optionalString,
  expiryDate: date.optional(),
  notes: z.string().max(300, '備註不能超過 300 個字符').optional(),
});

export const stockTransferFormSchema = z.object({
  productCode: productCode,
  fromLocation: requiredString('來源位置'),
  toLocation: requiredString('目標位置'),
  quantity: quantity,
  reason: requiredString('轉移原因'),
  requestedBy: requiredString('申請人'),
  approvedBy: optionalString,
  notes: z.string().max(400, '備註不能超過 400 個字符').optional(),
});

export const supplierFormSchema = z.object({
  code: z
    .string()
    .min(1, '供應商代碼不能為空')
    .max(20, '供應商代碼不能超過 20 個字符')
    .regex(/^[A-Z0-9\-_]+$/, '供應商代碼只能包含大寫字母、數字、連字符和底線')
    .transform(val => val.toUpperCase()),
  name: requiredString('供應商名稱'),
  address: optionalString,
  contactPerson: optionalString,
  phone: phoneNumber.optional(),
  email: email.optional(),
  notes: z.string().max(500, '備註不能超過 500 個字符').optional(),
});

// ===== 搜索和篩選 Schema =====

export const searchFormSchema = z.object({
  query: z.string().min(1, '搜索關鍵字不能為空').max(100),
  category: z.enum(['product', 'order', 'grn', 'supplier']).optional(),
  dateRange: z
    .object({
      startDate: date,
      endDate: date,
    })
    .refine(data => new Date(data.startDate) <= new Date(data.endDate), {
      message: '開始日期不能晚於結束日期',
      path: ['startDate'],
    })
    .optional(),
});

export const filterFormSchema = z.object({
  status: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  dateRange: z
    .object({
      startDate: date,
      endDate: date,
    })
    .optional(),
  quantityRange: z
    .object({
      min: quantity.optional(),
      max: quantity.optional(),
    })
    .refine(data => !data.min || !data.max || data.min <= data.max, {
      message: '最小數量不能大於最大數量',
      path: ['min'],
    })
    .optional(),
});

// ===== 類型推斷 =====

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
export type GrnFormData = z.infer<typeof grnFormSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type QcLabelFormData = z.infer<typeof qcLabelFormSchema>;
export type StockTransferFormData = z.infer<typeof stockTransferFormSchema>;
export type SupplierFormData = z.infer<typeof supplierFormSchema>;
export type SearchFormData = z.infer<typeof searchFormSchema>;
export type FilterFormData = z.infer<typeof filterFormSchema>;

// ===== React Hook Form 整合 =====

export function createFormResolver<T extends z.ZodTypeAny>(schema: T) {
  return zodResolver(schema);
}

export function createFormProps<T extends z.ZodTypeAny>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>,
  mode: UseFormProps['mode'] = 'onChange'
): UseFormProps<z.infer<T>> {
  return {
    resolver: createFormResolver(schema),
    defaultValues: defaultValues as any,
    mode,
  };
}

// 常用表單配置預設
export const formConfigs = {
  login: () => createFormProps(loginFormSchema, { rememberMe: false }),
  register: () => createFormProps(registerFormSchema, { agreeToTerms: false }),
  changePassword: () => createFormProps(changePasswordFormSchema),
  resetPassword: () => createFormProps(resetPasswordFormSchema),
  product: () => createFormProps(productFormSchema),
  grn: () => createFormProps(grnFormSchema),
  order: () =>
    createFormProps(orderFormSchema, { items: [{ productCode: '', requiredQuantity: 1 }] }),
  qcLabel: () =>
    createFormProps(qcLabelFormSchema, { qcDate: new Date().toISOString().split('T')[0] }),
  stockTransfer: () => createFormProps(stockTransferFormSchema),
  supplier: () => createFormProps(supplierFormSchema),
  search: () => createFormProps(searchFormSchema),
  filter: () => createFormProps(filterFormSchema),
};

// ===== 驗證工具函數 =====

/**
 * 驗證單一欄位
 */
export function validateField<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: result.error.issues[0]?.message || '驗證失敗',
  };
}

/**
 * 批量驗證
 */
export function validateMultiple<T extends Record<string, z.ZodTypeAny>>(
  schemas: T,
  values: Record<string, unknown>
): {
  success: boolean;
  data?: { [K in keyof T]: z.infer<T[K]> };
  errors?: Partial<{ [K in keyof T]: string }>;
} {
  const errors: Partial<{ [K in keyof T]: string }> = {};
  const data: Partial<{ [K in keyof T]: z.infer<T[K]> }> = {};
  let hasErrors = false;

  for (const [key, schema] of Object.entries(schemas)) {
    const validation = validateField(schema, values[key]);

    if (validation.success) {
      data[key as keyof T] = validation.data;
    } else {
      errors[key as keyof T] = (validation as { success: false; error: string }).error;
      hasErrors = true;
    }
  }

  if (hasErrors) {
    return { success: false, errors };
  }

  return { success: true, data: data as { [K in keyof T]: z.infer<T[K]> } };
}

/**
 * 異步欄位驗證（用於遠程驗證）
 */
export async function validateFieldAsync<T>(
  value: T,
  validator: (value: T) => Promise<boolean>,
  errorMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isValid = await validator(value);

    if (isValid) {
      return { success: true };
    } else {
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('[validateFieldAsync] Validation error:', error);
    return { success: false, error: '驗證過程中發生錯誤' };
  }
}

/**
 * 條件驗證
 */
export function conditionalValidation<T extends z.ZodTypeAny>(
  condition: boolean,
  schema: T,
  fallbackSchema?: T
) {
  return condition ? schema : fallbackSchema || z.any();
}
