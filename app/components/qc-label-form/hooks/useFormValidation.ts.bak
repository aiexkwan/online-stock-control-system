'use client';

import { useMemo } from 'react';
import { ProductInfo, SlateDetail, AcoOrderDetail, FormValidation } from '../types';

interface ValidationInput {
  // Basic fields
  productCode: string;
  productInfo: ProductInfo | null;
  quantity: string;
  count: string;
  operator: string;
  userId: string;

  // ACO specific
  acoOrderRef: string;
  acoOrderDetails: AcoOrderDetail[];
  acoNewRef: boolean;
  acoNewProductCode: string;
  acoNewOrderQty: string;
  acoRemain: string | null;
  isAcoOrderExcess: boolean;
  isProductIncludedInOrder: boolean;
  isAcoOrderFullfilled: boolean;

  // Slate specific
  slateDetail: SlateDetail;

  // Source action (for void correction)
  sourceAction?: string | null;
}

interface ValidationRules {
  validateBasicFields: boolean;
  validateAcoFields: boolean;
  validateSlateFields: boolean;
}

export const useFormValidation = (input: ValidationInput): FormValidation => {
  return useMemo(() => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    // Determine validation rules based on product type
    const rules: ValidationRules = {
      validateBasicFields: true,
      validateAcoFields: input.productInfo?.type === 'ACO',
      validateSlateFields: input.productInfo?.type === 'Slate',
    };

    // Basic field validation
    if (rules.validateBasicFields) {
      // Product Code validation
      if (!input.productCode.trim()) {
        errors.push('Product Code is required.');
        fieldErrors.productCode = 'Product Code is required.';
      }

      // Product Info validation
      if (!input.productInfo) {
        errors.push('Product information is missing. Please enter a valid Product Code.');
        fieldErrors.productInfo = 'Product information is missing.';
      }

      // Quantity validation
      if (!input.quantity || parseInt(input.quantity, 10) <= 0) {
        errors.push('Quantity must be a positive number.');
        fieldErrors.quantity = 'Quantity must be a positive number.';
      }

      // Count validation
      if (!input.count || parseInt(input.count, 10) <= 0) {
        errors.push('Count (number of labels) must be a positive number.');
        fieldErrors.count = 'Count must be a positive number.';
      }

      // User ID validation
      if (!input.userId) {
        errors.push('User ID is missing. Please ensure you are logged in correctly.');
        fieldErrors.userId = 'User ID is missing.';
      }

      // Source action validation (for void correction)
      if (input.sourceAction && input.productCode.trim() && !input.productInfo) {
        errors.push('Product information must be loaded for void correction.');
        fieldErrors.sourceAction = 'Product information required for correction.';
      }
    }

    // ACO specific validation
    if (rules.validateAcoFields) {
      // ACO Order Ref validation
      if (!input.acoOrderRef.trim()) {
        errors.push('ACO Order Ref is required for ACO products.');
        fieldErrors.acoOrderRef = 'ACO Order Ref is required.';
      }

      // ACO order state validation
      if (input.acoOrderRef.trim() && input.acoRemain === null) {
        errors.push('Please search for the ACO order first.');
        fieldErrors.acoSearch = 'Order search required.';
      }

      if (input.isAcoOrderExcess) {
        errors.push('Input quantity exceeds order remaining quantity.');
        fieldErrors.acoQuantity = 'Quantity exceeds remaining.';
      }

      if (input.isAcoOrderFullfilled) {
        errors.push('ACO order is already fulfilled.');
        fieldErrors.acoOrder = 'Order already fulfilled.';
      }

      if (!input.isProductIncludedInOrder && input.acoRemain !== null) {
        errors.push('Product code is not included in this ACO order.');
        fieldErrors.acoProduct = 'Product not in order.';
      }
    }

    // Slate specific validation
    if (rules.validateSlateFields) {
      if (!input.slateDetail.batchNumber.trim()) {
        errors.push('Batch Number is required for Slate products.');
        fieldErrors.slateBatchNumber = 'Batch Number is required.';
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

// Helper function to get validation summary
export const getValidationSummary = (validation: FormValidation) => {
  if (validation.isValid) {
    return { type: 'success', message: 'All fields are valid.' };
  }

  const errorCount = validation.errors.length;
  return {
    type: 'error',
    message: `${errorCount} validation error${errorCount > 1 ? 's' : ''} found.`,
    details: validation.errors,
  };
};

// Helper function to check specific field validation
export const isFieldValid = (validation: FormValidation, fieldName: string): boolean => {
  return !validation.fieldErrors[fieldName];
};

// Helper function to get field error message
export const getFieldError = (
  validation: FormValidation,
  fieldName: string
): string | undefined => {
  return validation.fieldErrors[fieldName];
};
