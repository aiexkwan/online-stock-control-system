/**
 * Common validation rules
 * 常用驗證規則
 */

export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean | string | Promise<boolean | string>;
  message?: string;
}

/**
 * Required field validation
 * 必填欄位驗證
 */
export const required = (message = 'This field is required'): ValidationRule => ({
  validate: (value) => {
    if (typeof value === 'string') {
      return !!value.trim();
    }
    return value !== null && value !== undefined;
  },
  message
});

/**
 * Minimum length validation
 * 最小長度驗證
 */
export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (!value) return true; // Skip if empty (use with required)
    return String(value).length >= min;
  },
  message: message || `Minimum ${min} characters required`
});

/**
 * Maximum length validation
 * 最大長度驗證
 */
export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    return String(value).length <= max;
  },
  message: message || `Maximum ${max} characters allowed`
});

/**
 * Email validation
 * 電子郵件驗證
 */
export const email = (message = 'Invalid email address'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message
});

/**
 * Pattern validation
 * 模式驗證
 */
export const pattern = (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    return regex.test(String(value));
  },
  message
});

/**
 * Numeric validation
 * 數字驗證
 */
export const numeric = (message = 'Must be a number'): ValidationRule => ({
  validate: (value) => {
    if (!value && value !== 0) return true;
    return !isNaN(Number(value));
  },
  message
});

/**
 * Integer validation
 * 整數驗證
 */
export const integer = (message = 'Must be a whole number'): ValidationRule => ({
  validate: (value) => {
    if (!value && value !== 0) return true;
    return Number.isInteger(Number(value));
  },
  message
});

/**
 * Minimum value validation
 * 最小值驗證
 */
export const min = (minValue: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (!value && value !== 0) return true;
    return Number(value) >= minValue;
  },
  message: message || `Minimum value is ${minValue}`
});

/**
 * Maximum value validation
 * 最大值驗證
 */
export const max = (maxValue: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (!value && value !== 0) return true;
    return Number(value) <= maxValue;
  },
  message: message || `Maximum value is ${maxValue}`
});

/**
 * Range validation
 * 範圍驗證
 */
export const range = (minValue: number, maxValue: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (!value && value !== 0) return true;
    const num = Number(value);
    return num >= minValue && num <= maxValue;
  },
  message: message || `Value must be between ${minValue} and ${maxValue}`
});

/**
 * Custom validation
 * 自定義驗證
 */
export const custom = (
  validateFn: (value: any, formData?: any) => boolean | string | Promise<boolean | string>,
  message?: string
): ValidationRule => ({
  validate: validateFn,
  message
});

/**
 * Match field validation
 * 匹配欄位驗證
 */
export const matchField = (fieldName: string, message?: string): ValidationRule => ({
  validate: (value, formData) => {
    if (!formData) return true;
    return value === formData[fieldName];
  },
  message: message || `Must match ${fieldName}`
});

/**
 * Product code validation (Pennine specific)
 * 產品代碼驗證（Pennine 專用）
 */
export const productCode = (message = 'Invalid product code'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    // Product codes are typically alphanumeric
    return /^[A-Z0-9-]+$/i.test(value);
  },
  message
});

/**
 * Clock number validation (Pennine specific)
 * 時鐘號碼驗證（Pennine 專用）
 */
export const clockNumber = (message = 'Invalid clock number'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    // Clock numbers should be positive integers
    return /^\d+$/.test(value) && Number(value) > 0;
  },
  message
});

/**
 * Pallet number validation (Pennine specific)
 * 托盤號碼驗證（Pennine 專用）
 */
export const palletNumber = (message = 'Invalid pallet number'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    // Format: DDMMYY/NNN
    return /^\d{6}\/\d{1,3}$/.test(value);
  },
  message
});

/**
 * Supplier code validation (Pennine specific)
 * 供應商代碼驗證（Pennine 專用）
 */
export const supplierCode = (message = 'Invalid supplier code'): ValidationRule => ({
  validate: (value) => {
    if (!value) return true;
    // Supplier codes are typically uppercase alphanumeric
    return /^[A-Z0-9]+$/.test(value.toUpperCase());
  },
  message
});

/**
 * Combine multiple validation rules
 * 組合多個驗證規則
 */
export const combine = (...rules: ValidationRule[]): ValidationRule[] => rules;

/**
 * Conditional validation
 * 條件驗證
 */
export const when = (
  condition: (formData: any) => boolean,
  rules: ValidationRule | ValidationRule[]
): ValidationRule => ({
  validate: (value, formData) => {
    if (!condition(formData)) return true;
    
    const rulesToApply = Array.isArray(rules) ? rules : [rules];
    for (const rule of rulesToApply) {
      const result = rule.validate(value, formData);
      if (typeof result === 'string' || !result) {
        return result;
      }
    }
    return true;
  }
});