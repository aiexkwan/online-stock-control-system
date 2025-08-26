/**
 * useGraphQLDataUpdate Hook
 *
 * GraphQL-based replacement for useDataUpdate hook
 * Provides unified state management for data update operations using GraphQL mutations
 * instead of direct Supabase calls.
 *
 * Features:
 * - Product and Supplier CRUD operations via GraphQL
 * - Search functionality using GraphQL queries
 * - Form validation and state management
 * - Error handling for GraphQL errors
 * - UI feedback and confirmation dialogs
 * - Type safety with generated GraphQL types
 */

import { useState, useCallback, useRef } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  useCreateProduct,
  useUpdateProduct,
  useSearchProductByCode,
} from '@/lib/graphql/hooks/useProduct';
import {
  useCreateSupplier,
  useUpdateSupplier,
  useSearchSuppliers,
  useSearchSupplierByCode,
} from '@/lib/graphql/hooks/useSupplier';
// Import types from the original hook
export type FormMode = 'initial' | 'searching' | 'display' | 'edit' | 'add' | 'loading' | 'error';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'email';
  required?: boolean;
  validation?: (value: unknown) => string | null;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface FormConfig {
  fields: FormField[];
  entityType: 'product' | 'supplier' | 'qc' | 'grn' | 'custom';
  tableName?: string; // Keep for compatibility but not used
  primaryKey?: string;
  validateForm?: (data: Record<string, unknown>) => Record<string, string>;
}

export interface FormState {
  mode: FormMode;
  data: Record<string, unknown>;
  originalData: Record<string, unknown> | null;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  isLoading: boolean;
  isSearching: boolean;
  isUpdating: boolean;
  searchTerm: string;
  searchResults: Record<string, unknown>[];
}

export interface FormActions {
  // Data management
  setFieldValue: (field: string, value: unknown) => void;
  setMultipleFields: (fields: Record<string, unknown>) => void;
  resetForm: () => void;
  setFormData: (data: Record<string, unknown>) => void;

  // Mode management
  setMode: (mode: FormMode) => void;
  switchToEdit: () => void;
  switchToAdd: () => void;
  switchToDisplay: () => void;
  switchToInitial: () => void;

  // Validation
  validateField: (field: string) => string | null;
  validateForm: () => boolean;
  markFieldTouched: (field: string) => void;
  markAllFieldsTouched: () => void;
  clearErrors: () => void;
  setError: (field: string, error: string) => void;

  // Search operations
  search: (searchTerm: string) => Promise<void>;
  setSearchTerm: (term: string) => void;

  // CRUD operations
  create: () => Promise<boolean>;
  update: () => Promise<boolean>;
  delete?: (id: string) => Promise<boolean>;

  // UI helpers
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirmation: (message: string, onConfirm: () => void) => void;
}

export interface UseGraphQLDataUpdateOptions {
  config: FormConfig;
  initialData?: Record<string, unknown>;
  onSuccess?: (action: 'create' | 'update' | 'delete', data: Record<string, unknown>) => void;
  onError?: (error: Error, action: string) => void;
  enableSearch?: boolean;
  enableConfirmation?: boolean;
  customValidation?: (data: Record<string, unknown>) => Record<string, string>;
}

export interface UseGraphQLDataUpdateReturn {
  state: FormState;
  actions: FormActions;
  config: FormConfig;
}

export const useGraphQLDataUpdate = (
  options: UseGraphQLDataUpdateOptions
): UseGraphQLDataUpdateReturn => {
  const {
    config,
    initialData = {},
    onSuccess,
    onError,
    enableSearch = true,
    enableConfirmation = true,
    customValidation,
  } = options;

  // State management
  const [state, setState] = useState<FormState>({
    mode: 'initial',
    data: { ...initialData },
    originalData: null,
    touched: {},
    errors: {},
    isLoading: false,
    isSearching: false,
    isUpdating: false,
    searchTerm: '',
    searchResults: [],
  });

  // Reference for stable callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // GraphQL hooks based on entity type
  const [createProduct] = useCreateProduct();
  const [updateProduct] = useUpdateProduct();
  const [searchProductByCode] = useSearchProductByCode();

  const [createSupplier] = useCreateSupplier();
  const [updateSupplier] = useUpdateSupplier();
  const [searchSuppliers] = useSearchSuppliers();
  const [getSupplierByCode] = useSearchSupplierByCode();

  // Helper to show overlays (same as original)
  const showOverlay = useCallback(
    (type: 'success' | 'error' | 'warning', message: string, duration = 3000) => {
      const overlay = document.createElement('div');
      overlay.className =
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';

      const colorClass =
        type === 'success'
          ? 'border-green-500/30 text-green-400'
          : type === 'error'
            ? 'border-red-500/30 text-red-400'
            : 'border-yellow-500/30 text-yellow-400';

      overlay.innerHTML = `
      <div class="bg-slate-800/90 backdrop-blur-md border ${colorClass} rounded-lg p-8 text-center">
        <div class="text-xl font-bold mb-2">${message}</div>
      </div>
    `;

      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), duration);
    },
    []
  );

  // Field validation (same as original)
  const validateField = useCallback(
    (field: string): string | null => {
      const fieldConfig = config.fields.find(f => f.name === field);
      const value = stateRef.current.data[field];

      if (!fieldConfig) return null;

      // Required field validation
      if (fieldConfig.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return `${fieldConfig.label} is required`;
      }

      // Custom validation
      if (fieldConfig.validation) {
        return fieldConfig.validation(value);
      }

      // Type-specific validation
      if (fieldConfig.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return `${fieldConfig.label} must be a valid email`;
        }
      }

      if (fieldConfig.type === 'number' && value !== '' && value !== null && value !== undefined) {
        if (isNaN(Number(value))) {
          return `${fieldConfig.label} must be a number`;
        }
      }

      return null;
    },
    [config]
  );

  // Form validation (same as original)
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validate each field
    config.fields.forEach(field => {
      const error = validateField(field.name);
      if (error) {
        errors[field.name] = error;
      }
    });

    // Custom form-level validation
    if (customValidation) {
      const customErrors = customValidation(stateRef.current.data);
      Object.assign(errors, customErrors);
    }

    // Config-level validation
    if (config.validateForm) {
      const configErrors = config.validateForm(stateRef.current.data);
      Object.assign(errors, configErrors);
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [config, customValidation, validateField]);

  // GraphQL Search Operations
  const search = useCallback(
    async (searchTerm: string) => {
      if (!enableSearch || !searchTerm.trim()) {
        return;
      }

      setState(prev => ({ ...prev, isSearching: true, searchTerm }));

      try {
        const primaryKey = config.primaryKey || 'id';

        if (config.entityType === 'product') {
          // Search for product
          const result = await searchProductByCode({
            variables: { code: searchTerm.trim() },
          });

          if (result.error || !result.data?.product) {
            // Not found - switch to add mode
            setState(prev => ({
              ...prev,
              mode: 'add',
              data: { ...initialData, [primaryKey]: searchTerm.trim() },
              originalData: null,
              isSearching: false,
              errors: {},
            }));
          } else {
            // Found - switch to display mode
            const productData = result.data.product;
            const mappedData = {
              code: productData.code,
              description: productData.description,
              type: productData.type,
              colour: productData.colour,
              standard_qty: productData.standardQty,
              remark: productData.remark,
            };

            setState(prev => ({
              ...prev,
              mode: 'display',
              data: { ...mappedData },
              originalData: { ...mappedData },
              isSearching: false,
              errors: {},
            }));
          }
        } else if (config.entityType === 'supplier') {
          // Search for supplier
          const result = await getSupplierByCode({
            variables: { code: searchTerm.trim() },
          });

          if (result.error || !result.data?.supplier) {
            // Not found - switch to add mode
            setState(prev => ({
              ...prev,
              mode: 'add',
              data: { ...initialData, [primaryKey]: searchTerm.trim() },
              originalData: null,
              isSearching: false,
              errors: {},
            }));
          } else {
            // Found - switch to display mode
            const supplierData = result.data.supplier;
            const mappedData = {
              supplier_code: supplierData.code,
              supplier_name: supplierData.name,
            };

            setState(prev => ({
              ...prev,
              mode: 'display',
              data: { ...mappedData },
              originalData: { ...mappedData },
              isSearching: false,
              errors: {},
            }));
          }
        }
      } catch (error) {
        console.error('GraphQL Search error:', error);
        setState(prev => ({
          ...prev,
          isSearching: false,
          mode: 'error',
          errors: { search: 'Failed to search. Please try again.' },
        }));
        onError?.(error as Error, 'search');
      }
    },
    [config, enableSearch, initialData, onError, searchProductByCode, getSupplierByCode]
  );

  // GraphQL Create Operations
  const create = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      if (config.entityType === 'product') {
        const result = await createProduct({
          variables: {
            input: {
              code: stateRef.current.data.code as string,
              description: stateRef.current.data.description as string,
              type: stateRef.current.data.type as string,
              colour: stateRef.current.data.colour as string,
              standardQty: stateRef.current.data.standard_qty as number,
              remark: (stateRef.current.data.remark as string) || null,
            },
          },
        });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to create product');
        }

        showOverlay('success', 'Product created successfully!');
        onSuccess?.('create', stateRef.current.data);
      } else if (config.entityType === 'supplier') {
        const result = await createSupplier({
          variables: {
            input: {
              code: stateRef.current.data.supplier_code as string,
              name: stateRef.current.data.supplier_name as string,
            },
          },
        });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to create supplier');
        }

        showOverlay('success', 'Supplier created successfully!');
        onSuccess?.('create', stateRef.current.data);
      }

      // Reset form
      setState(prev => ({
        ...prev,
        mode: 'initial',
        data: { ...initialData },
        originalData: null,
        touched: {},
        errors: {},
        isUpdating: false,
        searchTerm: '',
      }));

      return true;
    } catch (error) {
      console.error('GraphQL Create error:', error);
      showOverlay('error', 'Failed to create record');
      setState(prev => ({ ...prev, isUpdating: false }));
      onError?.(error as Error, 'create');
      return false;
    }
  }, [
    config,
    validateForm,
    showOverlay,
    onSuccess,
    onError,
    createProduct,
    createSupplier,
    initialData,
  ]);

  // GraphQL Update Operations
  const update = useCallback(async (): Promise<boolean> => {
    if (!config.primaryKey) {
      console.error('No primary key configured for update operation');
      return false;
    }

    if (!validateForm()) {
      return false;
    }

    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      const primaryKey = config.primaryKey;
      const primaryKeyValue = stateRef.current.data[primaryKey];

      if (!primaryKeyValue) {
        throw new Error(`No ${primaryKey} found for update`);
      }

      if (config.entityType === 'product') {
        const result = await updateProduct({
          variables: {
            code: primaryKeyValue as string,
            input: {
              description: stateRef.current.data.description as string,
              type: stateRef.current.data.type as string,
              colour: stateRef.current.data.colour as string,
              standardQty: stateRef.current.data.standard_qty as number,
              remark: (stateRef.current.data.remark as string) || null,
            },
          },
        });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to update product');
        }

        showOverlay('success', 'Product updated successfully!');
        onSuccess?.('update', stateRef.current.data);
      } else if (config.entityType === 'supplier') {
        const result = await updateSupplier({
          variables: {
            code: primaryKeyValue as string,
            input: {
              name: stateRef.current.data.supplier_name as string,
            },
          },
        });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to update supplier');
        }

        showOverlay('success', 'Supplier updated successfully!');
        onSuccess?.('update', stateRef.current.data);
      }

      // Switch back to display mode with updated data
      setState(prev => ({
        ...prev,
        mode: 'display',
        originalData: { ...stateRef.current.data },
        isUpdating: false,
      }));

      return true;
    } catch (error) {
      console.error('GraphQL Update error:', error);
      showOverlay('error', 'Failed to update record');
      setState(prev => ({ ...prev, isUpdating: false }));
      onError?.(error as Error, 'update');
      return false;
    }
  }, [config, validateForm, showOverlay, onSuccess, onError, updateProduct, updateSupplier]);

  // Action handlers (same as original with GraphQL operations)
  const actions: FormActions = {
    // Data management
    setFieldValue: useCallback((field: string, value: unknown) => {
      setState(prev => ({
        ...prev,
        data: { ...prev.data, [field]: value },
        touched: { ...prev.touched, [field]: true },
        errors: { ...prev.errors, [field]: '' }, // Clear field error on change
      }));
    }, []),

    setMultipleFields: useCallback((fields: Record<string, unknown>) => {
      setState(prev => ({
        ...prev,
        data: { ...prev.data, ...fields },
        touched: {
          ...prev.touched,
          ...Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        },
      }));
    }, []),

    resetForm: useCallback(() => {
      setState(prev => ({
        ...prev,
        mode: 'initial',
        data: { ...initialData },
        originalData: null,
        touched: {},
        errors: {},
        searchTerm: '',
      }));
    }, [initialData]),

    setFormData: useCallback((data: Record<string, unknown>) => {
      setState(prev => ({ ...prev, data: { ...data } }));
    }, []),

    // Mode management
    setMode: useCallback((mode: FormMode) => {
      setState(prev => ({ ...prev, mode }));
    }, []),

    switchToEdit: useCallback(() => {
      setState(prev => ({ ...prev, mode: 'edit' }));
    }, []),

    switchToAdd: useCallback(() => {
      setState(prev => ({ ...prev, mode: 'add' }));
    }, []),

    switchToDisplay: useCallback(() => {
      setState(prev => ({ ...prev, mode: 'display' }));
    }, []),

    switchToInitial: useCallback(() => {
      setState(prev => ({ ...prev, mode: 'initial' }));
    }, []),

    // Validation
    validateField,
    validateForm,

    markFieldTouched: useCallback((field: string) => {
      setState(prev => ({ ...prev, touched: { ...prev.touched, [field]: true } }));
    }, []),

    markAllFieldsTouched: useCallback(() => {
      const touched = config.fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {});
      setState(prev => ({ ...prev, touched }));
    }, [config]),

    clearErrors: useCallback(() => {
      setState(prev => ({ ...prev, errors: {} }));
    }, []),

    setError: useCallback((field: string, error: string) => {
      setState(prev => ({ ...prev, errors: { ...prev.errors, [field]: error } }));
    }, []),

    // Search operations
    search,

    setSearchTerm: useCallback((term: string) => {
      setState(prev => ({ ...prev, searchTerm: term }));
    }, []),

    // CRUD operations
    create,
    update,

    // UI helpers
    showSuccess: useCallback(
      (message: string) => {
        showOverlay('success', message);
      },
      [showOverlay]
    ),

    showError: useCallback(
      (message: string) => {
        showOverlay('error', message);
      },
      [showOverlay]
    ),

    showConfirmation: useCallback(
      (message: string, onConfirm: () => void) => {
        if (!enableConfirmation) {
          onConfirm();
          return;
        }

        const overlay = document.createElement('div');
        overlay.className =
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        overlay.innerHTML = `
        <div class="bg-slate-800/90 backdrop-blur-md border border-yellow-500/30 rounded-lg p-8 text-center">
          <div class="text-yellow-400 text-xl font-bold mb-4">${message}</div>
          <div class="flex gap-4 justify-center">
            <button id="confirm-btn" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Confirm</button>
            <button id="cancel-btn" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      `;
        document.body.appendChild(overlay);

        const confirmBtn = overlay.querySelector('#confirm-btn');
        const cancelBtn = overlay.querySelector('#cancel-btn');

        confirmBtn?.addEventListener('click', () => {
          overlay.remove();
          onConfirm();
        });

        cancelBtn?.addEventListener('click', () => {
          overlay.remove();
        });
      },
      [enableConfirmation]
    ),
  };

  return {
    state,
    actions,
    config,
  };
};

export default useGraphQLDataUpdate;
