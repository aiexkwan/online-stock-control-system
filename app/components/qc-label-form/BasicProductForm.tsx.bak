'use client';

import React from 'react';
import ProductCodeInput from './ProductCodeInput';
import ProductInfoDisplay from './ProductInfoDisplay';
import FormField from './FormField';
import { getFieldError } from './hooks/useFormValidation';
import { FormValidation } from './types';
import RemarkFormatter from './RemarkFormatter';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

interface BasicProductFormProps {
  productCode: string;
  onProductCodeChange: (value: string) => void;
  productInfo: ProductInfo | null;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  count: string;
  onCountChange: (value: string) => void;
  operator: string;
  onOperatorChange: (value: string) => void;
  validation?: FormValidation;
  disabled?: boolean;
}

export const BasicProductForm: React.FC<BasicProductFormProps> = React.memo(
  ({
    productCode,
    onProductCodeChange,
    productInfo,
    onProductInfoChange,
    quantity,
    onQuantityChange,
    count,
    onCountChange,
    operator,
    onOperatorChange,
    validation,
    disabled = false,
  }) => {
    const isSlateProduct = productInfo?.type === 'Slate';
    const countValue = parseInt(count) || 0;
    const isCountExceeded = countValue > 5;

    // Check if remark should be displayed
    const shouldShowNotice =
      productInfo?.remark &&
      productInfo.remark !== 'Null' &&
      productInfo.remark !== '-' &&
      productInfo.remark.trim() !== '';

    return (
      <div className='space-y-4'>
        {/* Product Code Input */}
        <ProductCodeInput
          value={productCode}
          onChange={onProductCodeChange}
          onProductInfoChange={onProductInfoChange}
          onQuantityChange={onQuantityChange}
          disabled={disabled}
          required={true}
        />

        {/* Product Info Display */}
        <ProductInfoDisplay productInfo={productInfo} />

        {/* Notice/Remark Information */}
        {shouldShowNotice && (
          <div className='animate-pulse rounded-md border-2 border-red-500 bg-black p-4'>
            <div className='flex items-start space-x-3'>
              <div className='mt-1 flex-shrink-0'>
                <svg
                  className='h-5 w-5 animate-bounce text-red-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='flex-1'>
                <h4 className='mb-3 text-sm font-semibold text-red-500'>Reminder</h4>
                <div className='text-sm font-medium leading-relaxed text-red-400'>
                  <RemarkFormatter remarkText={productInfo?.remark || ''} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <FormField
          label='Quantity of Pallet'
          required={true}
          error={validation ? getFieldError(validation, 'quantity') : undefined}
        >
          <input
            type='text'
            inputMode='numeric'
            pattern='[0-9]*'
            className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 ${
              validation && getFieldError(validation, 'quantity')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:ring-blue-500'
            }`}
            value={quantity}
            onChange={e => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              onQuantityChange(numericValue);
            }}
            disabled={disabled}
            required
            placeholder='Numbers only'
          />
        </FormField>

        {/* Count Input with Maximum Limit */}
        <FormField
          label='Count of Pallet'
          required={true}
          hint={isSlateProduct ? 'Auto-set to 1 for Slate' : 'Maximum 5 pallets allowed'}
          error={
            isCountExceeded
              ? 'Maximum 5 pallets allowed for printing'
              : validation
                ? getFieldError(validation, 'count')
                : undefined
          }
        >
          <input
            type='text'
            inputMode='numeric'
            pattern='[0-9]*'
            className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 ${
              isCountExceeded
                ? 'border-red-500 focus:ring-red-500'
                : validation && getFieldError(validation, 'count')
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-blue-500'
            } ${isSlateProduct ? 'cursor-not-allowed opacity-50' : ''}`}
            value={isSlateProduct ? '1' : count}
            onChange={e => {
              if (!isSlateProduct) {
                // Only allow numeric input and enforce maximum of 5
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                const numValue = parseInt(numericValue) || 0;
                if (numValue <= 5) {
                  onCountChange(numericValue);
                }
              }
            }}
            disabled={disabled || isSlateProduct}
            required
            placeholder={isSlateProduct ? 'Auto-set to 1' : 'Max 5 pallets'}
            max='5'
          />
          {isCountExceeded && (
            <div className='mt-1 animate-pulse text-xs font-semibold text-red-500'>
              ⚠️ Printing limit exceeded! Maximum 5 pages allowed
            </div>
          )}
        </FormField>

        {/* Operator Input */}
        <FormField
          label='Operator Clock Number'
          hint='Optional'
          error={validation ? getFieldError(validation, 'operator') : undefined}
        >
          <input
            type='text'
            className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 ${
              validation && getFieldError(validation, 'operator')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:ring-blue-500'
            }`}
            value={operator}
            onChange={e => onOperatorChange(e.target.value)}
            disabled={disabled}
            placeholder='Optional'
          />
        </FormField>
      </div>
    );
  }
);

// Set display name for debugging
BasicProductForm.displayName = 'BasicProductForm';

export default BasicProductForm;
