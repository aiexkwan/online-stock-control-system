/**
 * Zod 整合使用範例
 * 示範如何在系統中有效使用 Zod 進行類型安全和驗證
 *
 * 這個文件展示了各種 Zod 使用模式和最佳實踐
 */

import { z } from 'zod';
import {
  validateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  withApiValidation,
  ProductCodeValidationSchema,
  GrnValidationSchema,
  isValidationFailure,
} from '../schemas/api-validation';
import {
  loginFormSchema,
  productFormSchema,
  validateField,
  validateMultiple,
} from '../schemas/form-validation-enhanced';
import { getValidatedEnv, getFeatureFlags, env } from '../schemas/env-validation';
import {
  validateWithZod,
  toDatabaseValue,
  batchValidateWithZod,
  UnknownTypeHandler,
} from '../types/unknown-handlers';

// ===== 1. API 驗證範例 =====

/**
 * 範例：產品創建 API 端點
 */
export async function createProductApiExample(request: unknown) {
  // 使用 withApiValidation 中間件
  const handler = withApiValidation(productFormSchema, async validatedData => {
    // 這裡的 validatedData 已經經過 Zod 驗證，類型安全
    console.log('Validated product data:', validatedData);

    // 模擬業務邏輯
    const product = {
      id: crypto.randomUUID(),
      ...validatedData,
      createdAt: new Date().toISOString(),
    };

    return createApiResponse({
      success: true,
      data: product,
      meta: {
        executionTime: 150,
        version: '1.0.0',
      },
    });
  });

  return handler(request);
}

/**
 * 範例：手動 API 驗證
 */
export function validateProductCodeExample(input: unknown) {
  const validation = validateApiRequest(input, ProductCodeValidationSchema);

  if (isValidationFailure(validation)) {
    return createApiErrorResponse('VALIDATION_ERROR', '產品代碼格式無效', validation.errors);
  }

  // 驗證成功，使用類型安全的數據
  const { code } = validation.data;

  return createApiResponse({
    success: true,
    data: { normalizedCode: code.toUpperCase() },
  });
}

// ===== 2. 表單驗證範例 =====

/**
 * 範例：登入表單驗證
 */
export function validateLoginFormExample(formData: unknown) {
  const validation = validateField(loginFormSchema, formData);

  if (!validation.success) {
    return {
      success: false,
      error: (validation as { success: false; error: string }).error,
    };
  }

  // 類型安全的表單數據
  const { clockNumber, password: _password, rememberMe } = validation.data;

  return {
    success: true,
    data: {
      clockNumber,
      password: '***', // 不返回密碼
      rememberMe,
    },
  };
}

/**
 * 範例：多欄位批量驗證
 */
export function validateMultipleFieldsExample(formData: Record<string, unknown>) {
  const schemas = {
    productCode: z.string().min(1),
    quantity: z.number().min(0),
    price: z.number().min(0).optional(),
  };

  const validation = validateMultiple(schemas, formData);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // 所有欄位都已驗證
  const { productCode, quantity, price } = validation.data;

  return {
    success: true,
    data: { productCode, quantity, price },
  };
}

// ===== 3. 環境變數驗證範例 =====

/**
 * 範例：獲取配置信息
 */
export function getConfigExample() {
  try {
    const config = getValidatedEnv();
    const features = getFeatureFlags();

    return {
      success: true,
      data: {
        environment: config.NODE_ENV,
        features,
        appInfo: {
          name: config.NEXT_PUBLIC_APP_NAME,
          version: config.NEXT_PUBLIC_APP_VERSION,
          url: config.NEXT_PUBLIC_APP_URL,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '配置錯誤',
    };
  }
}

/**
 * 範例：條件性配置訪問
 */
export function getAiConfigExample() {
  const aiConfig = env.ai();

  if (!env.features().aiFeatures) {
    return {
      success: false,
      error: 'AI 功能已停用',
    };
  }

  return {
    success: true,
    data: {
      openai: {
        model: aiConfig.openai.model,
        maxTokens: aiConfig.openai.maxTokens,
        // 不返回 API 金鑰
      },
      anthropic: aiConfig.anthropic
        ? {
            model: aiConfig.anthropic.model,
          }
        : null,
    },
  };
}

// ===== 4. 未知類型處理範例 =====

/**
 * 範例：安全處理 API 響應
 */
export function processApiResponseExample(response: unknown) {
  // 定義期望的響應結構
  const responseSchema = z.object({
    success: z.boolean(),
    data: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          quantity: z.number(),
        })
      )
      .optional(),
    error: z.string().optional(),
  });

  const validation = validateWithZod(response, responseSchema);

  if (!validation.success) {
    return {
      success: false,
      error: `響應格式無效: ${(validation as { success: false; error: string }).error}`,
    };
  }

  const { success, data, error } = validation.data;

  if (!success) {
    return { success: false, error };
  }

  // 安全地處理數據
  const items = data || [];
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    success: true,
    summary: {
      itemCount: items.length,
      totalQuantity,
      items,
    },
  };
}

/**
 * 範例：使用 UnknownTypeHandler 安全訪問屬性
 */
export function processNestedDataExample(data: unknown) {
  // 使用增強的 safeGet 方法，支援 Zod 驗證
  const stringSchema = z.string().min(1);
  const numberSchema = z.number().min(0);

  const productCode = UnknownTypeHandler.safeGet(data, 'product.code', '', stringSchema);

  const quantity = UnknownTypeHandler.safeGet(data, 'inventory.quantity', 0, numberSchema);

  const location = UnknownTypeHandler.safeGet(data, 'location.name', 'Unknown');

  return {
    productCode,
    quantity,
    location,
    isValid: productCode !== '' && quantity > 0,
  };
}

/**
 * 範例：批量 Zod 驗證
 */
export function validateBatchDataExample(records: unknown[]) {
  const recordSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['product', 'order', 'supplier']),
    data: z.record(z.unknown()),
    timestamp: z.string().datetime(),
  });

  const results = records.map((record, index) => {
    const validation = validateWithZod(record, recordSchema);

    return {
      index,
      success: validation.success,
      data: validation.success ? validation.data : null,
      error: validation.success ? null : (validation as { success: false; error: string }).error,
    };
  });

  const validRecords = results.filter(result => result.success).map(result => result.data!);

  const errors = results
    .filter(result => !result.success)
    .map(result => ({
      index: result.index,
      error: result.error,
    }));

  return {
    success: errors.length === 0,
    summary: {
      total: records.length,
      valid: validRecords.length,
      invalid: errors.length,
    },
    validRecords,
    errors,
  };
}

// ===== 5. 資料轉換範例 =====

/**
 * 範例：安全的資料庫記錄轉換
 */
export function transformDatabaseRecordExample(rawRecord: unknown) {
  // 轉換為安全的資料庫值
  const safeValue = toDatabaseValue(rawRecord);

  if (!safeValue) {
    return {
      success: false,
      error: '無法轉換為有效的資料庫記錄',
    };
  }

  // 進一步驗證特定欄位
  if (typeof safeValue === 'object' && safeValue !== null) {
    const record = safeValue as Record<string, unknown>;

    const schemas = {
      id: z.string().uuid(),
      name: z.string().min(1),
      createdAt: z.string().datetime(),
    };

    const validation = batchValidateWithZod(record, schemas);

    return {
      success: validation.success,
      data: validation.success ? validation.results : null,
      errors: validation.success
        ? []
        : Object.entries(validation.results)
            .filter(([, result]) => !result.success)
            .map(([field, result]) => ({
              field,
              error: result.error,
            })),
    };
  }

  return {
    success: false,
    error: '記錄格式無效',
  };
}

// ===== 6. 業務規則驗證範例 =====

/**
 * 範例：GRN (商品收貨記錄) 驗證
 */
export function validateGrnDataExample(grnData: unknown) {
  const validation = validateApiRequest(grnData, GrnValidationSchema);

  if (isValidationFailure(validation)) {
    return createApiErrorResponse('GRN_VALIDATION_ERROR', 'GRN 數據驗證失敗', validation.errors);
  }

  const grn = validation.data;

  // 業務規則驗證
  const businessRules = [];

  if (grn.netWeight > grn.grossWeight) {
    businessRules.push('淨重不能大於毛重');
  }

  if (grn.palletCount === 0 && grn.packageCount === 0) {
    businessRules.push('棧板數量和包裝數量不能都為零');
  }

  if (new Date(grn.receiveDate) > new Date()) {
    businessRules.push('接收日期不能為未來日期');
  }

  if (businessRules.length > 0) {
    return createApiErrorResponse('BUSINESS_RULE_VIOLATION', '業務規則驗證失敗', businessRules);
  }

  return createApiResponse({
    success: true,
    data: {
      ...grn,
      totalWeight: grn.grossWeight + grn.netWeight,
      totalItems: grn.palletCount + grn.packageCount,
      isValid: true,
    },
  });
}

// ===== 7. 測試輔助函數 =====

/**
 * 範例：創建測試數據
 */
export function createTestDataExample() {
  const testProduct = productFormSchema.parse({
    code: 'TEST001',
    description: '測試產品',
    type: 'A',
    color: 'Red',
    standardQuantity: 100,
    remarks: '測試用途',
  });

  const testLogin = loginFormSchema.parse({
    clockNumber: '12345',
    password: 'TestPass123',
    rememberMe: true,
  });

  const testGrn = GrnValidationSchema.parse({
    grnRef: 1001,
    materialCode: 'MAT001',
    supplierCode: 'SUP001',
    grossWeight: 100.5,
    netWeight: 95.0,
    palletCount: 2,
    packageCount: 5,
    receiveDate: '2025-01-15',
    receiveBy: 'USER001',
    remarks: '測試 GRN',
  });

  return {
    testProduct,
    testLogin,
    testGrn,
  };
}

/**
 * 範例：Schema 擴展和組合
 */
export function schemaCompositionExample() {
  // 基礎 Schema
  const baseItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    createdAt: z.string().datetime(),
  });

  // 擴展 Schema
  const productSchema = baseItemSchema.extend({
    code: z.string().min(1),
    price: z.number().min(0),
    category: z.string(),
  });

  const orderItemSchema = baseItemSchema.extend({
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
  });

  // 組合 Schema
  const orderSchema = z.object({
    orderRef: z.string(),
    items: z.array(orderItemSchema),
    totalAmount: z.number().min(0),
    status: z.enum(['pending', 'confirmed', 'shipped', 'delivered']),
  });

  return {
    productSchema,
    orderItemSchema,
    orderSchema,
  };
}

// ===== 導出所有範例 =====

export const zodExamples = {
  api: {
    createProduct: createProductApiExample,
    validateProductCode: validateProductCodeExample,
  },
  forms: {
    validateLogin: validateLoginFormExample,
    validateMultiple: validateMultipleFieldsExample,
  },
  environment: {
    getConfig: getConfigExample,
    getAiConfig: getAiConfigExample,
  },
  unknownTypes: {
    processApiResponse: processApiResponseExample,
    processNestedData: processNestedDataExample,
    validateBatch: validateBatchDataExample,
    transformRecord: transformDatabaseRecordExample,
  },
  business: {
    validateGrn: validateGrnDataExample,
  },
  testing: {
    createTestData: createTestDataExample,
    schemaComposition: schemaCompositionExample,
  },
};

export default zodExamples;
