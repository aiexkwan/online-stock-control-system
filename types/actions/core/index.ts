/**
 * @fileoverview Server Actions 核心類型統一導出
 * @module types/actions/core
 * 
 * Phase 2: Server Actions 類型統一 - 核心模塊
 */

// Result types
export * from './result';
export * from './form-data';

// Re-export specific types for convenience
export type {
  ActionResult,
  ActionError,
  ActionContext,
  FormValidationError,
  ActionResultWithRedirect,
  ActionResultWithNotification,
  FileUploadActionResult,
  BatchActionResult,
} from './result';

export type {
  FormDataValue,
  ParsedFormData,
  FormDataParseOptions,
  TypedFormDataParser,
  FormField,
  FormDataParseResult,
} from './form-data';

// Utility functions
export {
  createActionSuccess,
  createActionError,
  createValidationError,
  createErrorFromException,
  createActionSuccessWithRedirect,
  createActionSuccessWithNotification,
  isActionSuccess,
  isActionError,
  hasValidationErrors,
  safeActionExecute,
} from './result';

export {
  formDataToObject,
  smartConvert,
  parseFormData,
  createFormDataParser,
  extractFormField,
  extractFormFields,
} from './form-data';