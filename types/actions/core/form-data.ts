/**
 * @fileoverview Server Actions FormData 處理類型定義
 * @module types/actions/core/form-data
 * 
 * 提供 FormData 的類型安全處理工具
 */

import { z } from 'zod';

/**
 * FormData 字段值類型
 */
export type FormDataValue = string | File | null;

/**
 * 解析後的 FormData 對象類型
 */
export type ParsedFormData = Record<string, FormDataValue | FormDataValue[]>;

/**
 * FormData 解析選項
 */
export interface FormDataParseOptions {
  /** 是否將單個值的數組展開為單值 */
  flattenSingleValueArrays?: boolean;
  /** 是否將 'true'/'false' 字符串轉換為布爾值 */
  parseBooleans?: boolean;
  /** 是否將數字字符串轉換為數字 */
  parseNumbers?: boolean;
  /** 空字符串處理：保留、轉為 null 或 undefined */
  emptyStringHandling?: 'keep' | 'null' | 'undefined';
}

/**
 * 類型安全的 FormData 解析器配置
 */
export interface TypedFormDataParser<T> {
  /** Zod schema 用於驗證 */
  schema: z.ZodSchema<T>;
  /** 解析選項 */
  options?: FormDataParseOptions;
  /** 自定義轉換器 */
  transformers?: Record<string, (value: FormDataValue) => unknown>;
}

/**
 * FormData 字段定義
 */
export interface FormField {
  /** 字段名稱 */
  name: string;
  /** 字段類型 */
  type: 'text' | 'number' | 'boolean' | 'file' | 'array' | 'object';
  /** 是否必填 */
  required?: boolean;
  /** 驗證規則 */
  validation?: z.ZodSchema;
  /** 默認值 */
  defaultValue?: unknown;
  /** 轉換函數 */
  transform?: (value: FormDataValue) => unknown;
}

/**
 * FormData 處理結果
 */
export interface FormDataParseResult<T> {
  /** 是否解析成功 */
  success: boolean;
  /** 解析後的數據 */
  data?: T;
  /** 解析錯誤 */
  errors?: Array<{
    field: string;
    message: string;
    type: string;
  }>;
  /** 原始 FormData 值（用於調試） */
  raw?: ParsedFormData;
}

// ============= 工具函數 =============

/**
 * 將 FormData 轉換為普通對象
 */
export function formDataToObject(
  formData: FormData,
  options?: FormDataParseOptions
): ParsedFormData {
  const result: ParsedFormData = {};
  const { 
    flattenSingleValueArrays = true,
    emptyStringHandling = 'keep'
  } = options || {};

  // 收集所有值
  for (const [key, value] of formData.entries()) {
    // 處理空字符串
    let processedValue: FormDataValue = value;
    if (typeof value === 'string' && value === '') {
      switch (emptyStringHandling) {
        case 'null':
          processedValue = null;
          break;
        case 'undefined':
          continue; // 跳過該字段
        default:
          processedValue = value;
      }
    }

    if (key in result) {
      // 如果鍵已存在，轉換為數組
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(processedValue);
      } else {
        result[key] = [existing, processedValue];
      }
    } else {
      result[key] = processedValue;
    }
  }

  // 展開單值數組
  if (flattenSingleValueArrays) {
    for (const key in result) {
      const value = result[key];
      if (Array.isArray(value) && value.length === 1) {
        result[key] = value[0];
      }
    }
  }

  return result;
}

/**
 * 智能類型轉換
 */
export function smartConvert(
  value: FormDataValue,
  options?: FormDataParseOptions
): unknown {
  if (value === null || value instanceof File) {
    return value;
  }

  const { parseBooleans = true, parseNumbers = true } = options || {};

  // 布爾值轉換
  if (parseBooleans) {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  // 數字轉換
  if (parseNumbers && value !== '') {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }

  return value;
}

/**
 * 解析 FormData 並進行類型驗證
 */
export function parseFormData<T>(
  formData: FormData,
  parser: TypedFormDataParser<T>
): FormDataParseResult<T> {
  try {
    // 轉換為對象
    const rawData = formDataToObject(formData, parser.options);

    // 應用自定義轉換器
    const transformedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (parser.transformers?.[key]) {
        transformedData[key] = Array.isArray(value) 
          ? value.map(v => parser.transformers![key](v))
          : parser.transformers[key](value);
      } else {
        transformedData[key] = Array.isArray(value)
          ? value.map(v => smartConvert(v, parser.options))
          : smartConvert(value, parser.options);
      }
    }

    // 驗證數據
    const result = parser.schema.safeParse(transformedData);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        raw: rawData,
      };
    }

    // 格式化錯誤
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      type: err.code,
    }));

    return {
      success: false,
      errors,
      raw: rawData,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'form',
        message: error instanceof Error ? error.message : 'Form parsing failed',
        type: 'PARSE_ERROR',
      }],
    };
  }
}

/**
 * 創建類型安全的 FormData 解析器
 */
export function createFormDataParser<T>(
  schema: z.ZodSchema<T>,
  options?: FormDataParseOptions,
  transformers?: Record<string, (value: FormDataValue) => unknown>
): (formData: FormData) => FormDataParseResult<T> {
  return (formData: FormData) => parseFormData(formData, {
    schema,
    options,
    transformers,
  });
}

/**
 * FormData 欄位提取工具
 */
export function extractFormField(
  formData: FormData,
  field: FormField
): unknown {
  const rawValue = formData.get(field.name);

  if (rawValue === null && field.required) {
    throw new Error(`Required field '${field.name}' is missing`);
  }

  if (rawValue === null) {
    return field.defaultValue;
  }

  // 應用轉換
  if (field.transform) {
    return field.transform(rawValue);
  }

  // 根據類型進行基本轉換
  switch (field.type) {
    case 'number':
      return Number(rawValue);
    case 'boolean':
      return rawValue === 'true';
    case 'file':
      return rawValue instanceof File ? rawValue : null;
    default:
      return rawValue;
  }
}

/**
 * 批量提取 FormData 欄位
 */
export function extractFormFields(
  formData: FormData,
  fields: FormField[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    try {
      result[field.name] = extractFormField(formData, field);
    } catch (error) {
      // 如果是必填欄位缺失，重新拋出錯誤
      if (field.required) {
        throw error;
      }
      // 否則使用默認值
      result[field.name] = field.defaultValue;
    }
  }

  return result;
}