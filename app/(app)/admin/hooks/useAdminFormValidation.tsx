'use client';

import type { AdminFormData, ProductInfo } from '../types/adminQcTypes';

// Type definitions - removed unused interface

interface UseAdminFormValidationReturn {
  errors: Record<string, string>;
  isValid: boolean;
  validateFormInternal: () => { isValid: boolean; errors: Record<string, string> };
  validateForm: () => { isValid: boolean; errors: Record<string, string> };
  isAcoOrderFulfilled: boolean;
  isAcoOrderExcess: boolean;
  isAcoOrderIncomplete: boolean;
  canSearchAco: () => boolean;
  validateAcoOrderDetails: () => boolean;
}

export const useAdminFormValidation = ({
  formData,
  productInfo,
}: {
  formData: AdminFormData;
  productInfo: ProductInfo | null;
}): UseAdminFormValidationReturn => {
  // Simple validation without useMemo to avoid dependencies
  const validateFormInternal = () => {
    const errors: Record<string, string> = {};

    if (!formData.productCode.trim()) {
      errors.productCode = 'Product code is required';
    }

    const quantityStr = String(formData.quantity || '');
    const quantityNum = parseInt(quantityStr.trim(), 10);
    if (!quantityStr.trim() || isNaN(quantityNum) || quantityNum <= 0) {
      errors.quantity = 'Valid quantity is required';
    }

    const countStr = String(formData.count || '');
    const countNum = parseInt(countStr.trim(), 10);
    if (!countStr.trim() || isNaN(countNum) || countNum <= 0) {
      errors.count = 'Valid count is required';
    }

    if (productInfo?.type === 'ACO' && !formData.acoOrderRef.trim()) {
      errors.acoOrderRef = 'ACO Order Reference is required';
    }

    if (productInfo?.type === 'Slate' && !formData.slateDetail.batchNumber.trim()) {
      errors.batchNumber = 'Batch number is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Simple checks without dependencies
  const isAcoOrderFulfilled = () => {
    if (productInfo?.type === 'ACO' && typeof formData.acoRemain === 'number') {
      return formData.acoRemain === 0;
    }
    return false;
  };

  const isAcoOrderExcess = () => {
    if (productInfo?.type === 'ACO' && typeof formData.acoRemain === 'number') {
      const quantityStr = String(formData.quantity || '');
      const countStr = String(formData.count || '');
      const quantityPerPallet = parseInt(quantityStr.trim(), 10);
      const palletCount = parseInt(countStr.trim(), 10);

      if (!isNaN(quantityPerPallet) && !isNaN(palletCount)) {
        return quantityPerPallet * palletCount > formData.acoRemain;
      }
    }
    return false;
  };

  const isAcoOrderIncomplete = () => {
    return productInfo?.type === 'ACO' && !formData.acoOrderRef.trim();
  };

  // Get current errors and validation state
  const validationResult = validateFormInternal();

  const validateForm = () => {
    const result = validateFormInternal();
    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  };

  return {
    errors: validationResult.errors,
    isValid: validationResult.isValid,
    validateFormInternal,
    validateForm,
    isAcoOrderFulfilled: isAcoOrderFulfilled(),
    isAcoOrderExcess: isAcoOrderExcess(),
    isAcoOrderIncomplete: isAcoOrderIncomplete(),
    canSearchAco: () => false, // Admin version doesn't need search
    validateAcoOrderDetails: () => true, // Admin version doesn't have manual ACO details
  };
};
