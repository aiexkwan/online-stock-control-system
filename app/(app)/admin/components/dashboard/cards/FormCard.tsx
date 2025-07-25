/**
 * FormCard Component
 * 統一的表單卡片組件，取代原有的獨立表單組件
 * 使用 GraphQL 動態配置，支援22種字段類型和多種表單類型
 *
 * 支援的Form類型：
 * - PRODUCT_EDIT: 產品編輯表單
 * - USER_REGISTRATION: 用戶註冊表單
 * - ORDER_CREATE: 訂單創建表單
 * - WAREHOUSE_TRANSFER: 倉庫轉移表單
 * - 其他擴展類型...
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CubeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as SaveIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

// 表單值類型定義
type FormValue = string | number | boolean | Date | File | FileList | string[] | null | undefined;

// 元數據值類型定義
type MetadataValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

// 依賴值類型定義
type DependencyValue = string | number | boolean | string[];

// 表單數據記錄類型
export type FormDataRecord = Record<string, FormValue>;

// 提交成功數據類型
interface SubmitSuccessData {
  id?: string;
  message?: string;
  [key: string]: unknown;
}

// 表單字段錯誤類型
interface FormFieldError {
  field: string;
  message: string;
}

// 表單提交錯誤類型
type FormSubmitError = FormFieldError[] | Error | string;

// 臨時類型定義 - 將來會移到 GraphQL Schema
export enum FormType {
  PRODUCT_EDIT = 'PRODUCT_EDIT',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  USER_REGISTRATION = 'USER_REGISTRATION',
  ORDER_CREATE = 'ORDER_CREATE',
  WAREHOUSE_TRANSFER = 'WAREHOUSE_TRANSFER',
  QUALITY_CHECK = 'QUALITY_CHECK',
  INVENTORY_ADJUST = 'INVENTORY_ADJUST',
  REPRINT_LABEL = 'REPRINT_LABEL',
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TEXTAREA = 'TEXTAREA',
  FILE_UPLOAD = 'FILE_UPLOAD',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  RANGE = 'RANGE',
  COLOR = 'COLOR',
  URL = 'URL',
  PHONE = 'PHONE',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  JSON_EDITOR = 'JSON_EDITOR',
  RICH_TEXT = 'RICH_TEXT',
  CODE_EDITOR = 'CODE_EDITOR',
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

export interface FieldDependency {
  fieldName: string;
  value: DependencyValue;
  operation: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: FormValue;
  validation?: FieldValidation;
  options?: SelectOption[];
  dependencies?: FieldDependency[];
  metadata?: Record<string, MetadataValue>;
  gridColumn?: number; // 1-12 for responsive grid
  helpText?: string;
}

export interface FormLayout {
  columns: number;
  spacing: 'tight' | 'normal' | 'wide';
  sections?: {
    title: string;
    fields: string[];
    collapsible?: boolean;
  }[];
}

export interface FormCardData {
  id: string;
  formType: FormType;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  submitEndpoint: string;
  validationRules?: Record<string, MetadataValue>;
  layout?: FormLayout;
  metadata?: Record<string, MetadataValue>;
}

// 臨時 GraphQL 查詢 - 將來會替換為真實的 schema
const FORM_CARD_QUERY = gql`
  query FormCardQuery($input: FormCardInput!) {
    formCardData(input: $input) {
      id
      formType
      title
      description
      fields {
        id
        name
        label
        type
        required
        placeholder
        defaultValue
        validation {
          required
          minLength
          maxLength
          min
          max
          pattern
          customMessage
        }
        options {
          value
          label
          disabled
        }
        dependencies {
          fieldName
          value
          operation
        }
        metadata
        gridColumn
        helpText
      }
      submitEndpoint
      validationRules
      layout {
        columns
        spacing
        sections {
          title
          fields
          collapsible
        }
      }
      metadata
    }
  }
`;

const FORM_SUBMIT_MUTATION = gql`
  mutation SubmitForm($input: FormSubmitInput!) {
    submitForm(input: $input) {
      success
      message
      data
      errors {
        field
        message
      }
    }
  }
`;

// FormCard 組件 Props
export interface FormCardProps {
  // Form 類型配置
  formType: FormType;

  // 實體 ID (用於編輯表單)
  entityId?: string;

  // 預填數據
  prefilledData?: FormDataRecord;

  // 顯示選項
  showHeader?: boolean;
  showProgress?: boolean;
  showValidationSummary?: boolean;

  // 樣式
  className?: string;
  height?: number | string;

  // 編輯模式
  isEditMode?: boolean;

  // 回調
  onSubmitSuccess?: (data: SubmitSuccessData) => void;
  onSubmitError?: (error: FormSubmitError) => void;
  onCancel?: () => void;
  onFieldChange?: (fieldName: string, value: FormValue) => void;
  
  // 自定義提交處理器（用於業務邏輯遷移）
  customSubmitHandler?: (formData: FormDataRecord) => Promise<SubmitSuccessData>;
}

export const FormCard: React.FC<FormCardProps> = ({
  formType,
  entityId,
  prefilledData = {},
  showHeader = true,
  showProgress = true,
  showValidationSummary = false,
  className,
  height = 'auto',
  isEditMode = false,
  onSubmitSuccess,
  onSubmitError,
  onCancel,
  onFieldChange,
  customSubmitHandler,
}) => {
  // 狀態管理
  const [formData, setFormData] = useState<FormDataRecord>(prefilledData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // 準備查詢輸入
  const queryInput = useMemo(
    () => ({
      formType,
      entityId,
      prefilledData,
    }),
    [formType, entityId, prefilledData]
  );

  // 執行 GraphQL 查詢 - 使用模擬數據
  const { data, loading, error, refetch } = useQuery<{ formCardData: FormCardData }>(
    FORM_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
      // 暫時使用模擬數據
      errorPolicy: 'ignore',
    }
  );

  // 表單提交 mutation
  const [submitForm, { loading: submitting }] = useMutation(FORM_SUBMIT_MUTATION, {
    onCompleted: data => {
      if (data.submitForm.success) {
        onSubmitSuccess?.(data.submitForm.data);
      } else {
        onSubmitError?.(data.submitForm.errors);
      }
    },
    onError: error => {
      onSubmitError?.(error);
    },
  });

  // 模擬數據 - 表單配置
  const mockFormData: FormCardData = useMemo(() => {
    if (formType === FormType.REPRINT_LABEL) {
      return {
        id: 'reprint-label-form',
        formType: FormType.REPRINT_LABEL,
        title: 'Reprint Label',
        description: 'Enter pallet number to reprint label',
        fields: [
          {
            id: 'palletNumber',
            name: 'palletNumber',
            label: 'Pallet Number',
            type: FieldType.TEXT,
            required: true,
            placeholder: 'Enter pallet number...',
            validation: {
              required: true,
              customMessage: 'Please enter a pallet number',
            },
            gridColumn: 12,
            helpText: 'Enter the pallet number to reprint its label',
          },
        ],
        submitEndpoint: '/api/reprint-label',
        layout: {
          columns: 12,
          spacing: 'normal',
        },
      };
    }

    if (formType === FormType.PRODUCT_UPDATE) {
      return {
        id: 'product-update-form',
        formType: FormType.PRODUCT_UPDATE,
        title: 'Product Management',
        description: 'Search, edit, or create product information',
        fields: [
          {
            id: 'searchCode',
            name: 'searchCode',
            label: 'Product Code (Search)',
            type: FieldType.TEXT,
            required: false,
            placeholder: 'Enter product code to search...',
            gridColumn: 12,
            helpText: 'Search for existing product by code',
            metadata: { isSearchField: true },
          },
        ],
        submitEndpoint: '/api/products/search',
        layout: {
          columns: 12,
          spacing: 'normal',
        },
        metadata: {
          mode: 'search', // search, edit, create
          allowCreate: true,
          allowEdit: true,
        },
      };
    }
    
    if (formType === FormType.PRODUCT_EDIT) {
      return {
        id: 'product-edit-form',
        formType: FormType.PRODUCT_EDIT,
        title: 'Product Information',
        description: 'Edit product details and specifications',
        fields: [
          {
            id: 'code',
            name: 'code',
            label: 'Product Code',
            type: FieldType.TEXT,
            required: true,
            placeholder: 'Enter product code...',
            validation: {
              required: true,
              maxLength: 50,
              pattern: '^[A-Z0-9-_]+$',
              customMessage:
                'Product code must contain only uppercase letters, numbers, hyphens, and underscores',
            },
            gridColumn: 6,
            helpText: 'Unique identifier for the product',
          },
          {
            id: 'description',
            name: 'description',
            label: 'Product Description',
            type: FieldType.TEXT,
            required: true,
            placeholder: 'Enter product description...',
            validation: {
              required: true,
              maxLength: 200,
            },
            gridColumn: 6,
          },
          {
            id: 'colour',
            name: 'colour',
            label: 'Product Colour',
            type: FieldType.SELECT,
            required: false,
            options: [
              { value: '', label: 'Select colour...' },
              { value: 'RED', label: 'Red' },
              { value: 'BLUE', label: 'Blue' },
              { value: 'GREEN', label: 'Green' },
              { value: 'YELLOW', label: 'Yellow' },
              { value: 'BLACK', label: 'Black' },
              { value: 'WHITE', label: 'White' },
            ],
            gridColumn: 6,
          },
          {
            id: 'standard_qty',
            name: 'standard_qty',
            label: 'Standard Quantity',
            type: FieldType.NUMBER,
            required: false,
            placeholder: 'Enter standard quantity...',
            validation: {
              min: 0,
            },
            gridColumn: 6,
          },
          {
            id: 'type',
            name: 'type',
            label: 'Product Type',
            type: FieldType.SELECT,
            required: false,
            options: [
              { value: '', label: 'Select type...' },
              { value: 'FINISHED_GOODS', label: 'Finished Goods' },
              { value: 'RAW_MATERIALS', label: 'Raw Materials' },
              { value: 'WORK_IN_PROGRESS', label: 'Work in Progress' },
              { value: 'PACKAGING', label: 'Packaging' },
            ],
            gridColumn: 12,
          },
        ],
        submitEndpoint: '/api/products',
        layout: {
          columns: 12,
          spacing: 'normal',
        },
      };
    }

    // 其他表單類型的默認配置
    return {
      id: 'default-form',
      formType,
      title: 'Form',
      fields: [],
      submitEndpoint: '/api/form',
    };
  }, [formType]);

  // 獲取表單配置 - 使用模擬數據或真實數據
  const formConfig = data?.formCardData || mockFormData;

  // 根據formType獲取適當的圖標和顏色
  const getFormConfig = useCallback((type: FormType) => {
    switch (type) {
      case FormType.PRODUCT_EDIT:
        return {
          icon: DocumentTextIcon,
          color: 'from-blue-500 to-cyan-500',
          title: 'Product Form',
        };
      case FormType.PRODUCT_UPDATE:
        return {
          icon: CubeIcon,
          color: 'from-orange-500 to-amber-500',
          title: 'Product Management',
        };
      case FormType.USER_REGISTRATION:
        return {
          icon: UserPlusIcon,
          color: 'from-green-500 to-emerald-500',
          title: 'User Registration',
        };
      case FormType.ORDER_CREATE:
        return {
          icon: ClipboardDocumentListIcon,
          color: 'from-orange-500 to-amber-500',
          title: 'Create Order',
        };
      case FormType.WAREHOUSE_TRANSFER:
        return {
          icon: TruckIcon,
          color: 'from-purple-500 to-violet-500',
          title: 'Warehouse Transfer',
        };
      case FormType.REPRINT_LABEL:
        return {
          icon: DocumentTextIcon,
          color: 'from-emerald-500 to-teal-500',
          title: 'Reprint Label',
        };
      default:
        return {
          icon: Cog6ToothIcon,
          color: 'from-gray-500 to-slate-500',
          title: 'Form',
        };
    }
  }, []);

  const visualConfig = getFormConfig(formType);

  // 驗證單個字段
  const validateField = useCallback((field: FormFieldConfig, value: FormValue): string | null => {
    const validation = field.validation;
    if (!validation) return null;

    // 必填驗證
    if (validation.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return validation.customMessage || `${field.label} is required`;
    }

    // 跳過空值的其他驗證
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // 字符串長度驗證
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return `${field.label} must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return `${field.label} must be no more than ${validation.maxLength} characters`;
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return validation.customMessage || `${field.label} format is invalid`;
      }
    }

    // 數字範圍驗證
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return `${field.label} must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && value > validation.max) {
        return `${field.label} must be no more than ${validation.max}`;
      }
    }

    return null;
  }, []);

  // 驗證整個表單
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    formConfig.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formConfig.fields, formData, validateField]);

  // 處理字段變更
  const handleFieldChange = useCallback(
    (fieldName: string, value: FormValue) => {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      setTouched(prev => ({ ...prev, [fieldName]: true }));

      // 清除該字段的錯誤
      if (errors[fieldName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }

      onFieldChange?.(fieldName, value);
    },
    [errors, onFieldChange]
  );

  // 處理字段失焦驗證
  const handleFieldBlur = useCallback(
    (field: FormFieldConfig) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        setErrors(prev => ({ ...prev, [field.name]: error }));
      }
    },
    [formData, validateField]
  );

  // 處理表單提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitAttempted(true);

      if (!validateForm()) {
        return;
      }

      try {
        if (customSubmitHandler) {
          // 使用自定義提交處理器
          const result = await customSubmitHandler(formData);
          onSubmitSuccess?.(result);
          
          // 清空表單（如果成功）
          setFormData({});
          setTouched({});
          setSubmitAttempted(false);
        } else {
          // 使用默認的 GraphQL mutation
          await submitForm({
            variables: {
              input: {
                formType,
                entityId,
                data: formData,
              },
            },
          });
        }
      } catch (error) {
        console.error('Form submission error:', error);
        if (customSubmitHandler) {
          onSubmitError?.(error instanceof Error ? error : new Error('Submission failed'));
        }
      }
    },
    [formType, entityId, formData, validateForm, submitForm, customSubmitHandler, onSubmitSuccess, onSubmitError]
  );

  // 渲染字段組件
  const renderField = useCallback(
    (field: FormFieldConfig) => {
      const value = formData[field.name] || field.defaultValue || '';
      const hasError = errors[field.name];
      const isTouched = touched[field.name] || submitAttempted;

      const commonProps = {
        id: field.id,
        name: field.name,
        disabled: submitting,
        className: cn(
          'transition-colors',
          hasError && isTouched && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        ),
      };

      switch (field.type) {
        case FieldType.TEXT:
        case FieldType.EMAIL:
        case FieldType.URL:
        case FieldType.PHONE:
          const stringValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : Array.isArray(value)
                  ? value
                  : value === null || value === undefined
                    ? ''
                    : String(value);
          return (
            <Input
              {...commonProps}
              type={
                field.type === FieldType.EMAIL
                  ? 'email'
                  : field.type === FieldType.URL
                    ? 'url'
                    : field.type === FieldType.PHONE
                      ? 'tel'
                      : 'text'
              }
              value={stringValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
            />
          );

        case FieldType.PASSWORD:
          const passwordValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Input
              {...commonProps}
              type='password'
              value={passwordValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
            />
          );

        case FieldType.NUMBER:
        case FieldType.CURRENCY:
        case FieldType.PERCENTAGE:
          const numberValue =
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? value
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Input
              {...commonProps}
              type='number'
              value={numberValue}
              onChange={e => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          );

        case FieldType.TEXTAREA:
          const textareaValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Textarea
              {...commonProps}
              value={textareaValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
              rows={4}
            />
          );

        case FieldType.SELECT:
          const selectValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Select
              value={selectValue}
              onValueChange={(val: string) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger className={commonProps.className}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case FieldType.CHECKBOX:
          return (
            <div className='flex items-center space-x-2'>
              <Checkbox
                {...commonProps}
                checked={Boolean(value)}
                onCheckedChange={checked => handleFieldChange(field.name, checked)}
              />
              <Label htmlFor={field.id} className='text-sm font-medium'>
                {field.label}
              </Label>
            </div>
          );

        case FieldType.RADIO:
          const radioValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <RadioGroup
              value={radioValue}
              onValueChange={val => handleFieldChange(field.name, val)}
            >
              {field.options?.map(option => (
                <div key={option.value} className='flex items-center space-x-2'>
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          );

        case FieldType.DATE:
          const dateValue =
            value instanceof Date
              ? value.toISOString().split('T')[0]
              : typeof value === 'string'
                ? value
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Input
              {...commonProps}
              type='date'
              value={dateValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
            />
          );

        case FieldType.DATETIME:
          const datetimeValue =
            value instanceof Date
              ? value.toISOString().slice(0, 16)
              : typeof value === 'string'
                ? value
                : value === null || value === undefined
                  ? ''
                  : String(value);
          return (
            <Input
              {...commonProps}
              type='datetime-local'
              value={datetimeValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
            />
          );

        default:
          const defaultValue =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? String(value)
                : Array.isArray(value)
                  ? value
                  : value === null || value === undefined
                    ? ''
                    : String(value);
          return (
            <Input
              {...commonProps}
              value={defaultValue}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.placeholder}
            />
          );
      }
    },
    [formData, errors, touched, submitAttempted, submitting, handleFieldChange, handleFieldBlur]
  );

  // 計算表單完成進度
  const formProgress = useMemo(() => {
    const requiredFields = formConfig.fields.filter(f => f.required);
    const completedFields = requiredFields.filter(f => {
      const value = formData[f.name];
      return value !== undefined && value !== null && value !== '';
    });
    return requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 100;
  }, [formConfig.fields, formData]);

  // 初始化表單數據
  useEffect(() => {
    if (formConfig.fields.length > 0 && Object.keys(formData).length === 0) {
      const initialData: FormDataRecord = { ...prefilledData };
      formConfig.fields.forEach(field => {
        if (initialData[field.name] === undefined && field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      });
      setFormData(initialData);
    }
  }, [formConfig.fields, formData, prefilledData]);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div className={cn('w-full', className)}>
        <Card className='border-blue-400 bg-gray-800 text-white'>
          <CardHeader>
            <CardTitle className='flex items-center text-blue-400'>
              <visualConfig.icon className='mr-2 h-5 w-5' />
              {formConfig.title} - Edit Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='py-8 text-center text-gray-400'>Form configuration in edit mode</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 錯誤狀態
  if (error && !data && formType !== FormType.PRODUCT_EDIT) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-red-50 p-8 dark:bg-red-950/20',
          className
        )}
      >
        <ExclamationTriangleIcon className='mr-2 h-6 w-6 text-red-500' />
        <span className='text-red-700 dark:text-red-300'>Failed to load form: {error.message}</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Card className='flex h-full flex-col border-blue-400 bg-gray-800 text-white'>
        {showHeader && (
          <CardHeader className='flex-shrink-0'>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center text-blue-400'>
                <div className={cn('mr-3 rounded-lg bg-gradient-to-r p-2', visualConfig.color)}>
                  <visualConfig.icon className='h-5 w-5 text-white' />
                </div>
                <div>
                  <div>{formConfig.title}</div>
                  {formConfig.description && (
                    <div className='mt-1 text-sm font-normal text-gray-400'>
                      {formConfig.description}
                    </div>
                  )}
                </div>
              </CardTitle>

              {loading && <ArrowPathIcon className='h-5 w-5 animate-spin text-blue-400' />}
            </div>

            {showProgress && (
              <div className='mt-4'>
                <div className='mb-2 flex justify-between text-xs'>
                  <span className='text-slate-400'>Form Completion</span>
                  <span className='font-medium text-white'>{Math.round(formProgress)}%</span>
                </div>
                <Progress value={formProgress} className='h-2' />
              </div>
            )}
          </CardHeader>
        )}

        <CardContent className='flex-1 overflow-auto'>
          <AnimatePresence mode='wait'>
            {loading && formType !== FormType.PRODUCT_EDIT ? (
              <motion.div
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex items-center justify-center py-8'
              >
                <ArrowPathIcon className='mr-3 h-8 w-8 animate-spin text-blue-400' />
                <span className='text-gray-300'>Loading form configuration...</span>
              </motion.div>
            ) : (
              <motion.form
                key='form'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className='space-y-6'
              >
                <div
                  className={cn(
                    'grid gap-4',
                    formConfig.layout?.columns === 12
                      ? 'grid-cols-12'
                      : 'grid-cols-1 md:grid-cols-2'
                  )}
                >
                  {formConfig.fields.map(field => (
                    <div
                      key={field.id}
                      className={cn(
                        'space-y-2',
                        field.gridColumn && formConfig.layout?.columns === 12
                          ? `col-span-${field.gridColumn}`
                          : ''
                      )}
                    >
                      {field.type !== FieldType.CHECKBOX && (
                        <Label htmlFor={field.id} className='text-sm font-medium text-gray-300'>
                          {field.label}
                          {field.required && <span className='ml-1 text-red-400'>*</span>}
                        </Label>
                      )}

                      {renderField(field)}

                      {field.helpText && <p className='text-xs text-gray-500'>{field.helpText}</p>}

                      {errors[field.name] && (touched[field.name] || submitAttempted) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className='text-sm text-red-400'
                        >
                          {errors[field.name]}
                        </motion.p>
                      )}
                    </div>
                  ))}
                </div>

                {showValidationSummary && Object.keys(errors).length > 0 && submitAttempted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='rounded-lg border border-red-500/20 bg-red-950/20 p-4'
                  >
                    <div className='mb-2 flex items-center'>
                      <ExclamationTriangleIcon className='mr-2 h-5 w-5 text-red-400' />
                      <span className='font-medium text-red-400'>
                        Please fix the following errors:
                      </span>
                    </div>
                    <ul className='ml-7 space-y-1 text-sm text-red-300'>
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>• {error}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <div className='flex space-x-3 border-t border-gray-600 pt-6'>
                  <Button
                    type='submit'
                    disabled={submitting}
                    className='flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  >
                    {submitting ? (
                      <>
                        <ArrowPathIcon className='mr-2 h-4 w-4 animate-spin' />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <SaveIcon className='mr-2 h-4 w-4' />
                        {entityId ? 'Update' : 'Create'}
                      </>
                    )}
                  </Button>

                  {onCancel && (
                    <Button
                      type='button'
                      onClick={onCancel}
                      disabled={submitting}
                      variant='outline'
                      className='flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                    >
                      <XMarkIcon className='mr-2 h-4 w-4' />
                      Cancel
                    </Button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// 導出類型，方便其他組件使用
// FormType 和 FieldType 已在上面導出

// 導出類型供其他組件使用
export type { SubmitSuccessData, FormSubmitError, FormValue };
