'use client';

import { useMemo } from 'react';
import { ProductInfo, SlateDetail, AcoOrderDetail, FormValidation, ErrorInfo } from '../types';

/**
 * 企業級表單驗證輸入介面
 * 提供完整的類型安全性和可擴展性
 */
interface ValidationInput {
  // 基本欄位
  readonly productCode: string;
  readonly productInfo: ProductInfo | null;
  readonly quantity: string;
  readonly count: string;
  readonly operator: string;
  readonly userId: string;

  // ACO 訂單專用欄位
  readonly acoOrderRef: string;
  readonly acoOrderDetails: readonly AcoOrderDetail[];
  readonly acoNewRef: boolean;
  readonly acoNewProductCode: string;
  readonly acoNewOrderQty: string;
  readonly acoRemain: string | null;
  readonly isAcoOrderExcess: boolean;
  readonly isProductIncludedInOrder: boolean;
  readonly isAcoOrderFullfilled: boolean;

  // Slate 產品專用欄位
  readonly slateDetail: SlateDetail;

  // 來源操作（用於作廢修正）
  readonly sourceAction?: string | null;
}

/**
 * 驗證規則配置介面
 * 支援不同產品類型的條件驗證
 */
interface ValidationRules {
  readonly validateBasicFields: boolean;
  readonly validateAcoFields: boolean;
  readonly validateSlateFields: boolean;
}

/**
 * 企業級表單驗證 Hook
 * 提供完整的類型安全驗證和錯誤處理
 *
 * @param input 驗證輸入參數
 * @returns 驗證結果包含驗證狀態和錯誤訊息
 */
export const useFormValidation = (input: ValidationInput): FormValidation => {
  return useMemo(() => {
    const errors: ErrorInfo[] = [];
    const fieldErrors: Record<string, ErrorInfo> = {};

    // 根據產品類型決定驗證規則
    const rules: ValidationRules = {
      validateBasicFields: true,
      validateAcoFields: input.productInfo?.type === 'ACO',
      validateSlateFields: input.productInfo?.type === 'Slate',
    };

    // 基本欄位驗證
    if (rules.validateBasicFields) {
      // 產品代碼驗證
      if (!input.productCode.trim()) {
        const errorInfo: ErrorInfo = {
          code: 'PRODUCT_CODE_REQUIRED',
          message: 'Product Code is required.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.productCode = errorInfo;
      }

      // 產品資訊驗證
      if (!input.productInfo) {
        const errorInfo: ErrorInfo = {
          code: 'PRODUCT_INFO_MISSING',
          message: 'Product information is missing. Please enter a valid Product Code.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.productInfo = errorInfo;
      }

      // 數量驗證
      const quantityNum = parseInt(input.quantity, 10);
      if (!input.quantity || isNaN(quantityNum) || quantityNum <= 0) {
        const errorInfo: ErrorInfo = {
          code: 'QUANTITY_INVALID',
          message: 'Quantity must be a positive number.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.quantity = errorInfo;
      }

      // 標籤數量驗證
      const countNum = parseInt(input.count, 10);
      if (!input.count || isNaN(countNum) || countNum <= 0) {
        const errorInfo: ErrorInfo = {
          code: 'COUNT_INVALID',
          message: 'Count (number of labels) must be a positive number.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.count = errorInfo;
      }

      // 使用者ID驗證
      if (!input.userId) {
        const errorInfo: ErrorInfo = {
          code: 'USER_ID_MISSING',
          message: 'User ID is missing. Please ensure you are logged in correctly.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.userId = errorInfo;
      }

      // 來源操作驗證（用於作廢修正）
      if (input.sourceAction && input.productCode.trim() && !input.productInfo) {
        const errorInfo: ErrorInfo = {
          code: 'SOURCE_ACTION_INVALID',
          message: 'Product information must be loaded for void correction.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.sourceAction = errorInfo;
      }
    }

    // ACO 特定驗證
    if (rules.validateAcoFields) {
      // ACO 訂單編號驗證
      if (!input.acoOrderRef.trim()) {
        const errorInfo: ErrorInfo = {
          code: 'ACO_ORDER_REF_REQUIRED',
          message: 'ACO Order Ref is required for ACO products.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.acoOrderRef = errorInfo;
      }

      // ACO 訂單狀態驗證
      if (input.acoOrderRef.trim() && input.acoRemain === null) {
        const errorInfo: ErrorInfo = {
          code: 'ACO_ORDER_SEARCH_REQUIRED',
          message: 'Please search for the ACO order first.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.acoSearch = errorInfo;
      }

      if (input.isAcoOrderExcess) {
        const errorInfo: ErrorInfo = {
          code: 'ACO_QUANTITY_EXCESS',
          message: 'Input quantity exceeds order remaining quantity.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.acoQuantity = errorInfo;
      }

      if (input.isAcoOrderFullfilled) {
        const errorInfo: ErrorInfo = {
          code: 'ACO_ORDER_FULFILLED',
          message: 'ACO order is already fulfilled.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.acoOrder = errorInfo;
      }

      if (!input.isProductIncludedInOrder && input.acoRemain !== null) {
        const errorInfo: ErrorInfo = {
          code: 'ACO_PRODUCT_NOT_IN_ORDER',
          message: 'Product code is not included in this ACO order.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.acoProduct = errorInfo;
      }
    }

    // Slate 特定驗證
    if (rules.validateSlateFields) {
      if (!input.slateDetail.batchNumber.trim()) {
        const errorInfo: ErrorInfo = {
          code: 'SLATE_BATCH_NUMBER_REQUIRED',
          message: 'Batch Number is required for Slate products.',
          timestamp: new Date(),
        };
        errors.push(errorInfo);
        fieldErrors.slateBatchNumber = errorInfo;
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      fieldErrors,
    };
  }, [input]);
};

/**
 * 驗證摘要類型定義
 */
interface ValidationSummary {
  readonly type: 'success' | 'error';
  readonly message: string;
  readonly details?: readonly string[];
}

/**
 * 獲取驗證結果摘要
 * @param validation 表單驗證結果
 * @returns 驗證摘要資訊
 */
export const getValidationSummary = (validation: FormValidation): ValidationSummary => {
  if (validation.isValid) {
    return { type: 'success', message: 'All fields are valid.' };
  }

  const errorCount = validation.errors.length;
  return {
    type: 'error',
    message: `${errorCount} validation error${errorCount > 1 ? 's' : ''} found.`,
    details: validation.errors.map(err => err.message),
  };
};

/**
 * 檢查特定欄位是否有效
 * @param validation 表單驗證結果
 * @param fieldName 欄位名稱
 * @returns 欄位是否有效
 */
export const isFieldValid = (validation: FormValidation, fieldName: string): boolean => {
  return !validation.fieldErrors[fieldName];
};

/**
 * 獲取欄位錯誤訊息
 * @param validation 表單驗證結果
 * @param fieldName 欄位名稱
 * @returns 欄位錯誤訊息（如果有的話）
 */
export const getFieldError = (
  validation: FormValidation,
  fieldName: string
): string | undefined => {
  return validation.fieldErrors[fieldName]?.message;
};
