/**
 * 表單組件類型定義
 */

// 基礎表單類型
export interface FormConfig<T = Record<string, unknown>> {
  fields: FormField[];
  validation?: ValidationConfig<T>;
  layout?: FormLayout;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: SelectOption[];
  validation?: FieldValidation;
  props?: Record<string, unknown>;
  dependencies?: string[];
  conditional?: ConditionalConfig;
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  DATE_TIME = 'datetime',
  TIME = 'time',
  FILE = 'file',
  IMAGE = 'image',
  SWITCH = 'switch',
  SLIDER = 'slider',
  COLOR = 'color',
  CUSTOM = 'custom',
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  group?: string;
  icon?: string;
  description?: string;
}

// 表單驗證
export interface ValidationConfig<T> {
  schema?: unknown; // Zod schema
  rules?: ValidationRule<T>[];
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: unknown, data: T) => string | null;
  message?: string;
  trigger?: 'change' | 'blur' | 'submit';
}

export interface FieldValidation {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: unknown) => string | boolean;
}

// 表單佈局
export interface FormLayout {
  type: 'vertical' | 'horizontal' | 'inline' | 'grid';
  columns?: number;
  spacing?: 'small' | 'medium' | 'large';
  labelPosition?: 'top' | 'left' | 'right';
  labelWidth?: string | number;
  sections?: FormSection[];
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  columns?: number;
}

// 條件顯示
export interface ConditionalConfig {
  when: string; // 依賴字段名
  is?: unknown; // 當依賴字段等於此值時顯示
  isNot?: unknown; // 當依賴字段不等於此值時顯示
  in?: unknown[]; // 當依賴字段在此數組中時顯示
  notIn?: unknown[]; // 當依賴字段不在此數組中時顯示
  custom?: (value: unknown, allValues: Record<string, unknown>) => boolean;
}

// 表單狀態
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  submitCount: number;
}

// 表單事件
export interface FormEvents<T = Record<string, unknown>> {
  onChange?: (name: string, value: unknown, allValues: T) => void;
  onBlur?: (name: string, value: unknown) => void;
  onFocus?: (name: string) => void;
  onValidate?: (errors: Record<string, string>) => void;
  onSubmit?: (data: T) => Promise<void> | void;
  onReset?: () => void;
}

// 特定表單類型
export interface ProductFormData {
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  weight?: number;
  price?: number;
  status: 'active' | 'inactive';
}

export interface OrderFormData {
  customerRef: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  items: OrderItemFormData[];
  notes?: string;
}

export interface OrderItemFormData {
  productCode: string;
  quantity: number;
  unitPrice?: number;
}

export interface StockTransferFormData {
  productCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface UserFormData {
  email: string;
  name?: string;
  department?: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
}
