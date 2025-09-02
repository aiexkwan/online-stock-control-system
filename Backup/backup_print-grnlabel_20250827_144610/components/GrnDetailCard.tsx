'use client';

import React from 'react';
import { UniversalGrid } from '@/components/templates/universal';
import { ProductCodeInput } from '@/app/components/qc-label-form/ProductCodeInput';
import { MaterialSupplierInput } from './MaterialSupplierInput';
import {
  LABEL_MODES,
  type LabelMode,
  type PalletTypeKey,
  type PackageTypeKey,
} from '@/app/constants/grnConstants';
import { PalletTypeSelector } from './PalletTypeSelector';
import { PackageTypeSelector } from './PackageTypeSelector';
import { SupplierInfo } from '@/lib/types/supplier-types';
import {
  EnhancedGrnDetailCardProps,
  DEFAULT_GRN_THEME,
  mergeGrnConfig,
} from '@/lib/types/grn-props';

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
}

interface ProductInfo {
  code: string;
  description: string;
  standard_qty?: string;
  type?: string;
}

interface PalletTypeData {
  whiteDry: string;
  whiteWet: string;
  chepDry: string;
  chepWet: string;
  euro: string;
  notIncluded: string;
}

interface PackageTypeData {
  still: string;
  bag: string;
  tote: string;
  octo: string;
  notIncluded: string;
}

// Legacy interface for backward compatibility
interface GrnDetailCardProps {
  formData: FormData;
  labelMode: LabelMode;
  productInfo: ProductInfo | null;
  supplierInfo: SupplierInfo | null;
  supplierError: string | null;
  currentUserId: string;
  palletType: PalletTypeData;
  packageType: PackageTypeData;
  onFormChange: (field: keyof FormData, value: string) => void;
  onSupplierInfoChange: (supplierInfo: SupplierInfo | null) => void;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  onLabelModeChange: (mode: LabelMode) => void;
  onPalletTypeChange: (key: PalletTypeKey, value: string) => void;
  onPackageTypeChange: (key: PackageTypeKey, value: string) => void;
  disabled?: boolean;
}

// Union type for backward compatibility
type GrnDetailCardPropsUnion = GrnDetailCardProps | EnhancedGrnDetailCardProps;

export const GrnDetailCard: React.FC<GrnDetailCardPropsUnion> = props => {
  // Handle both legacy and enhanced props
  const {
    formData,
    labelMode,
    productInfo,
    supplierInfo,
    supplierError,
    currentUserId,
    palletType,
    packageType,
    onFormChange,
    onSupplierInfoChange,
    onProductInfoChange,
    onLabelModeChange,
    onPalletTypeChange,
    onPackageTypeChange,
    disabled = false,
    className = '',
    theme,
    validation,
    features,
    onValidationError,
    onFieldFocus,
    onFieldBlur,
  } = props as EnhancedGrnDetailCardProps;

  // Merge configurations with defaults
  const config = React.useMemo(
    () => ({
      theme: {
        accentColor: (theme?.accentColor || 'orange') as
          | 'orange'
          | 'blue'
          | 'green'
          | 'purple'
          | 'red',
        customClasses: {
          container: theme?.customClasses?.container || '',
          header: theme?.customClasses?.header || '',
          content: theme?.customClasses?.content || '',
          button: theme?.customClasses?.button || '',
          input: theme?.customClasses?.input || '',
        },
      },
      validation: {
        enableRealTimeValidation: validation?.enableRealTimeValidation ?? true,
        customValidators: validation?.customValidators || {},
      },
      features: {
        enableSupplierLookup: features?.enableSupplierLookup ?? true,
        enableProductLookup: features?.enableProductLookup ?? true,
      },
    }),
    [theme, validation, features]
  );

  // Enhanced form change handler with validation
  const handleEnhancedFormChange = React.useCallback(
    (field: keyof typeof formData, value: string) => {
      // Apply custom validation if available
      const validatorKey = field as 'productCode' | 'supplierCode' | 'grnNumber' | 'clockNumber';
      if (config.validation.customValidators?.[validatorKey]) {
        const validator = config.validation.customValidators[validatorKey];
        const validationResult = validator!(value);
        if (validationResult !== true) {
          const errorMessage =
            typeof validationResult === 'string' ? validationResult : 'Invalid value';
          if (onValidationError) {
            onValidationError(field, errorMessage);
          }
          return;
        }
      }

      onFormChange(field, value);
    },
    [onFormChange, config.validation, onValidationError]
  );

  // Enhanced field handlers
  const handleFieldFocus = React.useCallback(
    (field: keyof typeof formData) => {
      if (onFieldFocus) {
        onFieldFocus(field);
      }
    },
    [onFieldFocus]
  );

  const handleFieldBlur = React.useCallback(
    (field: keyof typeof formData, value: string) => {
      if (onFieldBlur) {
        onFieldBlur(field, value);
      }
    },
    [onFieldBlur]
  );
  // Apply theme-based styling
  const containerClasses = React.useMemo(() => {
    const base = 'flex flex-col space-y-3';
    const themeColor = config.theme.accentColor;
    const customContainer = config.theme.customClasses?.container || '';

    return `${base} ${className} ${customContainer}`;
  }, [className, config.theme]);

  return (
    <div className={containerClasses}>
      <UniversalGrid columns={{ sm: 1, md: 2 }} gap='sm'>
        {/* GRN Number */}
        <div className='group'>
          <label className='mb-1 block text-sm font-medium text-slate-300 transition-colors duration-200 group-focus-within:text-orange-400'>
            GRN Number <span className='text-red-400'>*</span>
          </label>
          <div className='relative'>
            <input
              type='text'
              value={formData.grnNumber}
              onChange={e => handleEnhancedFormChange('grnNumber', e.target.value)}
              onFocus={() => handleFieldFocus('grnNumber')}
              onBlur={e => handleFieldBlur('grnNumber', e.target.value)}
              className={`w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 ease-out ${
                config.theme.accentColor === 'orange'
                  ? 'hover:border-orange-500/50 focus:border-orange-400/70 focus:ring-orange-400/30'
                  : config.theme.accentColor === 'blue'
                    ? 'hover:border-blue-500/50 focus:border-blue-400/70 focus:ring-blue-400/30'
                    : config.theme.accentColor === 'green'
                      ? 'hover:border-green-500/50 focus:border-green-400/70 focus:ring-green-400/30'
                      : config.theme.accentColor === 'purple'
                        ? 'hover:border-purple-500/50 focus:border-purple-400/70 focus:ring-purple-400/30'
                        : config.theme.accentColor === 'red'
                          ? 'hover:border-red-500/50 focus:border-red-400/70 focus:ring-red-400/30'
                          : 'hover:border-orange-500/50 focus:border-orange-400/70 focus:ring-orange-400/30'
              } hover:bg-slate-800/60 focus:bg-slate-800/70 focus:outline-none focus:ring-2 ${config.theme.customClasses?.input || ''}`}
              placeholder='Please Enter...'
              required
              disabled={disabled}
            />
            <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100'></div>
          </div>
        </div>

        {/* Material Supplier - 使用新的 MaterialSupplierInput 組件 */}
        <div className='group'>
          <MaterialSupplierInput
            value={formData.materialSupplier}
            onChange={value => handleEnhancedFormChange('materialSupplier', value)}
            onSupplierInfoChange={onSupplierInfoChange}
            disabled={disabled || !config.features.enableSupplierLookup}
            className='mb-0'
          />
          {supplierError && (
            <div className='mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2'>
              <p className='flex items-center text-xs text-red-400'>
                <svg className='mr-1 h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                {supplierError}
              </p>
            </div>
          )}
          {supplierInfo && (
            <div className='mt-2 rounded-lg border border-green-500/20 bg-green-500/10 p-2'>
              <p className='flex items-center text-xs text-green-400'>
                <svg className='mr-1 h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                {supplierInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Product Code */}
        <div className='md:col-span-2'>
          <ProductCodeInput
            value={formData.productCode}
            onChange={value => handleEnhancedFormChange('productCode', value)}
            onProductInfoChange={onProductInfoChange}
            required
            userId={currentUserId}
            disabled={disabled || !config.features.enableProductLookup}
          />
          {productInfo && (
            <div className='mt-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3'>
              <p className='flex items-center text-sm text-green-400'>
                <svg className='mr-2 h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='font-mono text-green-300'>{productInfo.code}</span>
                <span className='mx-2 text-green-500'>-</span>
                <span>{productInfo.description}</span>
              </p>
            </div>
          )}
        </div>

        {/* Label Mode Selection */}
        <div className='md:col-span-2'>
          <label className='mb-3 block text-sm font-medium text-slate-300'>
            Count Method<span className='text-red-400'>*</span>
          </label>
          <div className='flex space-x-4'>
            <label className='group flex cursor-pointer items-center space-x-3'>
              <div className='relative'>
                <input
                  type='radio'
                  name='labelMode'
                  value={LABEL_MODES.QUANTITY}
                  checked={labelMode === LABEL_MODES.QUANTITY}
                  onChange={() => onLabelModeChange(LABEL_MODES.QUANTITY)}
                  className='sr-only'
                  disabled={disabled}
                />
                <div
                  className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                    labelMode === LABEL_MODES.QUANTITY
                      ? config.theme.accentColor === 'orange'
                        ? 'border-orange-500 bg-orange-500'
                        : config.theme.accentColor === 'blue'
                          ? 'border-blue-500 bg-blue-500'
                          : config.theme.accentColor === 'green'
                            ? 'border-green-500 bg-green-500'
                            : config.theme.accentColor === 'purple'
                              ? 'border-purple-500 bg-purple-500'
                              : config.theme.accentColor === 'red'
                                ? 'border-red-500 bg-red-500'
                                : 'border-orange-500 bg-orange-500'
                      : `border-slate-500 bg-transparent group-hover:${
                          config.theme.accentColor === 'orange'
                            ? 'border-orange-400'
                            : config.theme.accentColor === 'blue'
                              ? 'border-blue-400'
                              : config.theme.accentColor === 'green'
                                ? 'border-green-400'
                                : config.theme.accentColor === 'purple'
                                  ? 'border-purple-400'
                                  : config.theme.accentColor === 'red'
                                    ? 'border-red-400'
                                    : 'border-orange-400'
                        }`
                  }`}
                >
                  {labelMode === LABEL_MODES.QUANTITY && (
                    <div className='absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white'></div>
                  )}
                </div>
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  labelMode === LABEL_MODES.QUANTITY
                    ? config.theme.accentColor === 'orange'
                      ? 'text-orange-400'
                      : config.theme.accentColor === 'blue'
                        ? 'text-blue-400'
                        : config.theme.accentColor === 'green'
                          ? 'text-green-400'
                          : config.theme.accentColor === 'purple'
                            ? 'text-purple-400'
                            : config.theme.accentColor === 'red'
                              ? 'text-red-400'
                              : 'text-orange-400'
                    : `text-slate-300 group-hover:${
                        config.theme.accentColor === 'orange'
                          ? 'text-orange-300'
                          : config.theme.accentColor === 'blue'
                            ? 'text-blue-300'
                            : config.theme.accentColor === 'green'
                              ? 'text-green-300'
                              : config.theme.accentColor === 'purple'
                                ? 'text-purple-300'
                                : config.theme.accentColor === 'red'
                                  ? 'text-red-300'
                                  : 'text-orange-300'
                      }`
                }`}
              >
                Quantity
              </span>
            </label>

            <label className='group flex cursor-pointer items-center space-x-3'>
              <div className='relative'>
                <input
                  type='radio'
                  name='labelMode'
                  value={LABEL_MODES.WEIGHT}
                  checked={labelMode === LABEL_MODES.WEIGHT}
                  onChange={() => onLabelModeChange(LABEL_MODES.WEIGHT)}
                  className='sr-only'
                  disabled={disabled}
                />
                <div
                  className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                    labelMode === LABEL_MODES.WEIGHT
                      ? config.theme.accentColor === 'orange'
                        ? 'border-orange-500 bg-orange-500'
                        : config.theme.accentColor === 'blue'
                          ? 'border-blue-500 bg-blue-500'
                          : config.theme.accentColor === 'green'
                            ? 'border-green-500 bg-green-500'
                            : config.theme.accentColor === 'purple'
                              ? 'border-purple-500 bg-purple-500'
                              : config.theme.accentColor === 'red'
                                ? 'border-red-500 bg-red-500'
                                : 'border-orange-500 bg-orange-500'
                      : `border-slate-500 bg-transparent group-hover:${
                          config.theme.accentColor === 'orange'
                            ? 'border-orange-400'
                            : config.theme.accentColor === 'blue'
                              ? 'border-blue-400'
                              : config.theme.accentColor === 'green'
                                ? 'border-green-400'
                                : config.theme.accentColor === 'purple'
                                  ? 'border-purple-400'
                                  : config.theme.accentColor === 'red'
                                    ? 'border-red-400'
                                    : 'border-orange-400'
                        }`
                  }`}
                >
                  {labelMode === LABEL_MODES.WEIGHT && (
                    <div className='absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white'></div>
                  )}
                </div>
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  labelMode === LABEL_MODES.WEIGHT
                    ? config.theme.accentColor === 'orange'
                      ? 'text-orange-400'
                      : config.theme.accentColor === 'blue'
                        ? 'text-blue-400'
                        : config.theme.accentColor === 'green'
                          ? 'text-green-400'
                          : config.theme.accentColor === 'purple'
                            ? 'text-purple-400'
                            : config.theme.accentColor === 'red'
                              ? 'text-red-400'
                              : 'text-orange-400'
                    : `text-slate-300 group-hover:${
                        config.theme.accentColor === 'orange'
                          ? 'text-orange-300'
                          : config.theme.accentColor === 'blue'
                            ? 'text-blue-300'
                            : config.theme.accentColor === 'green'
                              ? 'text-green-300'
                              : config.theme.accentColor === 'purple'
                                ? 'text-purple-300'
                                : config.theme.accentColor === 'red'
                                  ? 'text-red-300'
                                  : 'text-orange-300'
                      }`
                }`}
              >
                Weight
              </span>
            </label>
          </div>
        </div>
      </UniversalGrid>

      {/* Pallet & Package Type Section - Only show in Weight mode */}
      {labelMode === 'weight' && (
        <div className='grid grid-cols-2 gap-3'>
          <PalletTypeSelector
            palletType={palletType as any}
            onChange={onPalletTypeChange}
            disabled={disabled}
          />
          <PackageTypeSelector
            packageType={packageType as any}
            onChange={onPackageTypeChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default GrnDetailCard;
