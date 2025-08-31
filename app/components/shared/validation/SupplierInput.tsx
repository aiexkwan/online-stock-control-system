'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/app/utils/supabase/client';
import { cn } from '@/lib/utils';

export interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

export interface SupplierInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** Current supplier code value */
  value?: string;
  /** Callback when supplier code changes */
  onChange?: (value: string) => void;
  /** Callback when supplier is validated */
  onSupplierValidated?: (supplier: SupplierInfo | null) => void;
  /** Label for the input */
  label?: string;
  /** Required field */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Show supplier name when validated */
  showSupplierName?: boolean;
  /** Enable autocomplete suggestions */
  enableSuggestions?: boolean;
  /** Auto-select on single match */
  autoSelectSingleMatch?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Theme customization */
  theme?: {
    label?: string;
    input?: string;
    error?: string;
    success?: string;
    dropdown?: string;
    dropdownItem?: string;
  };
}

/**
 * Supplier input component with validation and autocomplete
 * 具有驗證和自動完成功能的供應商輸入組件
 *
 * @example
 * ```tsx
 * <SupplierInput
 *   label="Supplier Code"
 *   required
 *   enableSuggestions
 *   onSupplierValidated={(supplier) => {
 *     if (supplier) {
 *       process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('Valid supplier:', supplier.supplier_name);
 *     }
 *   }}
 * />
 * ```
 */
export function SupplierInput({
  value = '',
  onChange,
  onSupplierValidated,
  label,
  required,
  helperText,
  showSupplierName = true,
  enableSuggestions = true,
  autoSelectSingleMatch = true,
  errorMessage = 'Supplier Code Not Found',
  className,
  disabled,
  ...props
}: SupplierInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SupplierInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Validate supplier code
  const validateSupplier = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setSupplierInfo(null);
        setError(null);
        onSupplierValidated?.(null);
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('data_supplier')
          .select('supplier_code, supplier_name')
          .eq('supplier_code', code.toUpperCase())
          .single();

        if (queryError || !data) {
          setSupplierInfo(null);
          setError(errorMessage);
          onSupplierValidated?.(null);
        } else {
          const supplierInfo: SupplierInfo = {
            supplier_code: data.supplier_code,
            supplier_name: data.supplier_name || '',
          };
          setSupplierInfo(supplierInfo);
          setError(null);
          onSupplierValidated?.(supplierInfo);
        }
      } catch (_err) {
        console.error('[SupplierInput] Error validating supplier:', _err);
        setSupplierInfo(null);
        setError('Error validating supplier');
        onSupplierValidated?.(null);
      } finally {
        setIsValidating(false);
      }
    },
    [errorMessage, onSupplierValidated, supabase]
  );

  // Select supplier from suggestions (defined before searchSuppliers to avoid hoisting issues)
  const selectSupplier = useCallback(
    (supplier: SupplierInfo) => {
      setLocalValue(supplier.supplier_code);
      setSupplierInfo(supplier);
      setError(null);
      setSuggestions([]);
      setShowSuggestions(false);
      onChange?.(supplier.supplier_code);
      onSupplierValidated?.(supplier);
    },
    [onChange, onSupplierValidated]
  );

  // Search for supplier suggestions
  const searchSuppliers = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || !enableSuggestions) {
        setSuggestions([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('data_supplier')
          .select('supplier_code, supplier_name')
          .or(`supplier_code.ilike.%${searchTerm}%,supplier_name.ilike.%${searchTerm}%`)
          .limit(10)
          .order('supplier_code');

        if (!error && data) {
          const transformedData: SupplierInfo[] = data.map(item => ({
            supplier_code: item.supplier_code,
            supplier_name: item.supplier_name || '',
          }));
          setSuggestions(transformedData);

          // Auto-select if only one match
          if (transformedData.length === 1 && autoSelectSingleMatch) {
            selectSupplier(transformedData[0]);
          }
        }
      } catch (_err) {
        console.error('[SupplierInput] Error searching suppliers:', _err);
        setSuggestions([]);
      }
    },
    [enableSuggestions, autoSelectSingleMatch, selectSupplier, supabase]
  );

  // Track debounce timeout
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setLocalValue(newValue);
    onChange?.(newValue);

    // Clear validation if value changed
    if (supplierInfo && supplierInfo.supplier_code !== newValue) {
      setSupplierInfo(null);
      setError(null);
      onSupplierValidated?.(null);
    }

    // Trigger search
    if (enableSuggestions) {
      setShowSuggestions(true);

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        searchSuppliers(newValue);
      }, 300);
    }
  };

  // Handle blur to validate
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    props.onBlur?.(e);

    // Hide suggestions after a delay
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);

    // Validate if not already validated
    if (!supplierInfo && localValue) {
      validateSupplier(localValue);
    }
  };

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Clear validation when value is cleared
  useEffect(() => {
    if (!localValue) {
      setSupplierInfo(null);
      setError(null);
      setSuggestions([]);
    }
  }, [localValue]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const hasError = !!error && !isValidating;
  const isValid = !!supplierInfo && !error;

  return (
    <div className='space-y-1'>
      {label && (
        <label className='text-sm font-medium'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}

      <div className='relative'>
        <div className='relative'>
          <Input
            ref={inputRef}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => enableSuggestions && setShowSuggestions(true)}
            disabled={disabled}
            className={cn(
              'pr-10',
              hasError && 'border-red-500 focus:ring-red-500',
              isValid && 'border-green-500 focus:ring-green-500',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'error-message' : isValid ? 'success-message' : undefined}
            {...props}
          />

          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
            {isValidating && <Loader2 className='h-4 w-4 animate-spin text-gray-400' />}
            {!isValidating && isValid && <Check className='h-4 w-4 text-green-500' />}
            {!isValidating && hasError && <X className='h-4 w-4 text-red-500' />}
            {!isValidating && !isValid && !hasError && <Search className='h-4 w-4 text-gray-400' />}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg'
          >
            {suggestions.map((supplier, index) => (
              <button
                key={supplier.supplier_code}
                type='button'
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                  selectedIndex === index && 'bg-gray-100'
                )}
                onClick={() => selectSupplier(supplier)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className='font-medium'>{supplier.supplier_code}</div>
                <div className='text-sm text-gray-600'>{supplier.supplier_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {helperText && !hasError && !isValid && <p className='text-sm text-gray-500'>{helperText}</p>}

      {hasError && (
        <p id='error-message' className='text-sm text-red-600'>
          {error}
        </p>
      )}

      {isValid && showSupplierName && (
        <p id='success-message' className='text-sm text-green-600'>
          {supplierInfo.supplier_name}
        </p>
      )}
    </div>
  );
}
