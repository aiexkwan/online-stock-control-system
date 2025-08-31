/**
 * Zod 表單驗證 Hook
 *
 * 統一的表單狀態管理和驗證系統，整合 Zod schema
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import {
  loginFormSchema,
  registerFormSchema,
  stockTransferFormSchema,
  grnFormSchema,
} from '@/lib/schemas/form-validation';

interface UseZodFormOptions<T> {
  schema: z.ZodType<T, z.ZodTypeDef, any>;
  initialValues?: Partial<T>;
  onSubmit?: (data: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
}

interface UseZodFormReturn<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  hasErrors: boolean;

  // Field operations
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;

  // Field handlers
  getFieldProps: <K extends keyof T>(
    field: K
  ) => {
    value: T[K] | '';
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error?: string;
    name: string;
  };

  // Form operations
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  validateForm: () => Promise<boolean>;
  validateField: <K extends keyof T>(field: K) => boolean;

  // Form state
  formState: {
    isSubmitting: boolean;
    isValid: boolean;
    hasErrors: boolean;
    isDirty: boolean;
  };
}

export function useZodForm<T extends Record<string, unknown>>({
  schema,
  initialValues = {} as Partial<T>,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseZodFormOptions<T>): UseZodFormReturn<T> {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 計算衍生狀態
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // 驗證單個欄位
  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      try {
        // 安全檢查 schema 類型並提取 shape
        if ('shape' in schema && schema.shape) {
          const fieldSchema = (schema.shape as Record<string, z.ZodTypeAny>)[field as string];
          if (fieldSchema) {
            fieldSchema.parse(values[field]);
            setErrors(prev => {
              const { [field as string]: _removed, ...rest } = prev;
              return rest;
            });
            return true;
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors[0]?.message || '驗證失敗';
          setErrors(prev => ({ ...prev, [field as string]: fieldError }));
        }
        return false;
      }
      return true;
    },
    [schema, values]
  );

  // 驗證整個表單
  const validateForm = useCallback(async (): Promise<boolean> => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (path) {
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  // 計算是否有效
  const isValid = useMemo(() => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [schema, values]);

  // 設置欄位值
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [field]: value }));

      if (validateOnChange) {
        // 延遲驗證以避免頻繁重新渲染
        setTimeout(() => validateField(field), 0);
      }
    },
    [validateOnChange, validateField]
  );

  // 設置錯誤
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  // 清除錯誤
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const { [field as string]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // 清除所有錯誤
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // 獲取欄位屬性
  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: (values[field] ?? '') as T[K],
      onChange: (value: T[K]) => setValue(field, value),
      onBlur: () => {
        setTouched(prev => ({ ...prev, [field as string]: true }));
        if (validateOnBlur) {
          validateField(field);
        }
      },
      error: errors[field as string],
      name: field as string,
    }),
    [values, setValue, validateField, validateOnBlur, errors]
  );

  // 處理表單提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);
      try {
        const isFormValid = await validateForm();
        if (isFormValid && onSubmit) {
          const validatedData = schema.parse(values);
          await onSubmit(validatedData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, schema, values, validateForm]
  );

  // 重置表單
  const reset = useCallback(
    (newValues?: Partial<T>) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  // 表單狀態
  const formState = useMemo(
    () => ({
      isSubmitting,
      isValid,
      hasErrors,
      isDirty,
    }),
    [isSubmitting, isValid, hasErrors, isDirty]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,

    setValue,
    setError,
    clearError,
    clearAllErrors,

    getFieldProps,

    handleSubmit,
    reset,
    validateForm,
    validateField,

    formState,
  };
}

// 預建的表單 Hook
export function useLoginForm(onSubmit?: (data: z.infer<typeof loginFormSchema>) => Promise<void>) {
  return useZodForm<z.infer<typeof loginFormSchema>>({
    schema: loginFormSchema,
    onSubmit,
  });
}

export function useRegisterForm(
  onSubmit?: (data: z.infer<typeof registerFormSchema>) => Promise<void>
) {
  return useZodForm<z.infer<typeof registerFormSchema>>({
    schema: registerFormSchema,
    onSubmit,
  });
}

export function useStockTransferForm(
  onSubmit?: (data: z.infer<typeof stockTransferFormSchema>) => Promise<void>
) {
  return useZodForm<z.infer<typeof stockTransferFormSchema>>({
    schema: stockTransferFormSchema,
    onSubmit,
  });
}

export function useGrnForm(onSubmit?: (data: z.infer<typeof grnFormSchema>) => Promise<void>) {
  return useZodForm<z.infer<typeof grnFormSchema>>({
    schema: grnFormSchema,
    onSubmit,
  });
}
