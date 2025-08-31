/**
 * useFormValidation Hook
 * 處理 QC Label 表單驗證邏輯和計算值
 */

import { useMemo } from 'react';
import type { FormData, ProductInfo } from '../../types';
import { _MIN_ACO_ORDER_REF_LENGTH as MIN_ACO_ORDER_REF_LENGTH } from '../../constants';

interface UseFormValidationProps {
  formData: FormData;
  productInfo: ProductInfo | null;
}

interface UseFormValidationReturn {
  canSearchAco: boolean;
  isAcoOrderFulfilled: boolean;
  isAcoOrderIncomplete: boolean;
  isAcoOrderExcess: boolean;
  _validateForm: () => { isValid: boolean; _errors: Record<string, string> };
  _validateAcoOrderDetails: () => boolean;
  validateBasicFields: () => { isValid: boolean; _errors: Record<string, string> };
}

export const useFormValidation = ({
  formData,
  productInfo,
}: UseFormValidationProps): UseFormValidationReturn => {
  // 是否可以搜索 ACO 訂單
  const canSearchAco = useMemo(() => {
    return formData.acoOrderRef?.trim().length >= MIN_ACO_ORDER_REF_LENGTH;
  }, [formData.acoOrderRef]);

  // 檢查 ACO 訂單是否已完成
  const isAcoOrderFulfilled = useMemo(() => {
    if (productInfo?.type === 'ACO' && formData.acoRemain) {
      return formData.acoRemain.includes('Order Been Fulfilled for');
    }
    return false;
  }, [productInfo?.type, formData.acoRemain]);

  // 檢查 ACO 訂單詳情是否不完整
  const isAcoOrderIncomplete = useMemo(() => {
    if (productInfo?.type !== 'ACO') {
      return false;
    }

    // 如果沒有提供 ACO 訂單參考號
    if (!formData.acoOrderRef?.trim()) {
      return true;
    }

    // 如果提供了 ACO 訂單參考號但沒有執行搜索
    if (formData.acoOrderRef?.trim().length >= MIN_ACO_ORDER_REF_LENGTH && !formData.acoRemain) {
      return true;
    }

    // 如果是新的 ACO 訂單但沒有提供訂單詳情
    if (formData.acoNewRef) {
      const validOrderDetails = formData.acoOrderDetails.filter(
        (detail, idx) =>
          detail.code?.trim() &&
          detail.qty?.trim() &&
          !formData.acoOrderDetailErrors[idx] && // 沒有驗證錯誤
          !isNaN(parseInt(detail.qty?.trim() || '0')) &&
          parseInt(detail.qty?.trim() || '0') > 0
      );

      if (validOrderDetails.length === 0) {
        return true;
      }

      // 檢查是否有任何驗證錯誤
      const hasValidationErrors =
        formData.acoOrderDetailErrors?.some(error => error?.trim() !== '') || false;
      if (hasValidationErrors) {
        return true;
      }
    }

    return false;
  }, [
    productInfo?.type,
    formData.acoOrderRef,
    formData.acoRemain,
    formData.acoNewRef,
    formData.acoOrderDetails,
    formData.acoOrderDetailErrors,
  ]);

  // 檢查 ACO 訂單是否超量
  const isAcoOrderExcess = useMemo(() => {
    if (
      productInfo?.type === 'ACO' &&
      formData.acoRemain &&
      formData.acoRemain.includes('Order Remain Qty for')
    ) {
      const match = formData.acoRemain.match(/Order Remain Qty for .+: (\d+)/);
      if (match) {
        const acoRemainQty = parseInt(match[1], 10);
        // 安全處理 quantity 和 count - FormData 中已定義為 string 類型
        const quantityStr = formData.quantity || '';
        const countStr = formData.count || '';
        const quantityPerPallet = parseInt(quantityStr.trim(), 10);
        const palletCount = parseInt(countStr.trim(), 10);

        if (!isNaN(acoRemainQty) && !isNaN(quantityPerPallet) && !isNaN(palletCount)) {
          return quantityPerPallet * palletCount > acoRemainQty;
        }
      }
    }
    return false;
  }, [productInfo?.type, formData.acoRemain, formData.quantity, formData.count]);

  // 驗證基本字段
  const validateBasicFields = (): { isValid: boolean; _errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // 驗證產品代碼
    if (!formData.productCode?.trim()) {
      errors.productCode = 'Product code is required';
    }

    // 驗證數量 - FormData 中已定義為 string 類型
    const quantityStr = formData.quantity || '';
    const quantity = parseInt(quantityStr, 10);
    if (!quantityStr.trim() || isNaN(quantity) || quantity <= 0) {
      errors.quantity = 'Valid quantity is required';
    }

    // 驗證計數 - FormData 中已定義為 string 類型
    const countStr = formData.count || '';
    const count = parseInt(countStr, 10);
    if (!countStr.trim() || isNaN(count) || count <= 0) {
      errors.count = 'Valid count is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      _errors: errors,
    };
  };

  // 驗證 ACO 訂單詳情
  const _validateAcoOrderDetails = (): boolean => {
    if (productInfo?.type !== 'ACO' || !formData.acoNewRef) {
      return true;
    }

    const hasValidDetails =
      formData.acoOrderDetails?.some(
        detail =>
          detail.code?.trim() &&
          detail.qty?.trim() &&
          !isNaN(parseInt(detail.qty?.trim() || '0')) &&
          parseInt(detail.qty?.trim() || '0') > 0
      ) || false;

    const hasErrors = formData.acoOrderDetailErrors?.some(error => error?.trim() !== '') || false;

    return hasValidDetails && !hasErrors;
  };

  // 驗證整個表單
  const _validateForm = (): { isValid: boolean; _errors: Record<string, string> } => {
    const basicValidation = validateBasicFields();

    if (!basicValidation.isValid) {
      return basicValidation;
    }

    const errors = { ...basicValidation._errors };

    // ACO 特定驗證
    if (productInfo?.type === 'ACO') {
      if (isAcoOrderIncomplete) {
        errors.acoOrder = 'ACO order details are incomplete';
      }
      if (isAcoOrderExcess) {
        errors.acoOrder = 'Quantity exceeds remaining order quantity';
      }
      if (isAcoOrderFulfilled) {
        errors.acoOrder = 'Order has been fulfilled';
      }
    }

    // Slate 特定驗證
    if (productInfo?.type === 'Slate') {
      const hasValidSlateDetail = formData.slateDetail?.batchNumber?.trim();

      if (!hasValidSlateDetail) {
        errors.slate = 'At least one batch number is required for Slate products';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      _errors: errors,
    };
  };

  return {
    canSearchAco,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete,
    isAcoOrderExcess,
    _validateForm,
    _validateAcoOrderDetails,
    validateBasicFields,
  };
};
