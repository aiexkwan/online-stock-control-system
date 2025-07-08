/**
 * Shared validation components and utilities
 * 共享的驗證組件和工具
 */

export { ValidationInput, type ValidationInputProps } from './ValidationInput';
export { NumericInput, type NumericInputProps } from './NumericInput';
export { ValidationForm, useValidationForm } from './ValidationForm';
export { SupplierInput, type SupplierInputProps, type SupplierInfo } from './SupplierInput';
export { SupplierField, type SupplierFieldProps } from './SupplierField';
export * from './validationRules';

// Export common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  productCode: /^[A-Z0-9-]+$/i,
  clockNumber: /^\d+$/,
  palletNumber: /^\d{6}\/\d{1,3}$/,
  numeric: /^\d+$/,
  decimal: /^\d*\.?\d+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  phoneNumber: /^[\d\s\-\+\(\)]+$/,
};
