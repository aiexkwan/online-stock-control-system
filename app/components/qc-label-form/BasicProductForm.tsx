'use client';

import React from 'react';
import ProductCodeInput from './ProductCodeInput';
import ProductInfoDisplay from './ProductInfoDisplay';
import FormField from './FormField';
import { getFieldError } from './hooks/useFormValidation';
import { FormValidation } from './types';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
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

export const BasicProductForm: React.FC<BasicProductFormProps> = React.memo(({
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
  disabled = false
}) => {
  const isSlateProduct = productInfo?.type === 'Slate';

  return (
    <div className="space-y-4">
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

      {/* Quantity Input */}
      <FormField
        label="Quantity of Pallet"
        required={true}
        error={validation ? getFieldError(validation, 'quantity') : undefined}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 ${
            validation && getFieldError(validation, 'quantity')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-blue-500'
          }`}
          value={quantity}
          onChange={(e) => {
            // Only allow numeric input
            const numericValue = e.target.value.replace(/[^0-9]/g, '');
            onQuantityChange(numericValue);
          }}
          disabled={disabled}
          required
          placeholder="Numbers only"
        />
      </FormField>

      {/* Count Input */}
      <FormField
        label="Count of Pallet"
        required={true}
        hint={isSlateProduct ? "Auto-set to 1 for Slate" : undefined}
        error={validation ? getFieldError(validation, 'count') : undefined}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 ${
            validation && getFieldError(validation, 'count')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-blue-500'
          } ${isSlateProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={isSlateProduct ? '1' : count}
          onChange={(e) => {
            if (!isSlateProduct) {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              onCountChange(numericValue);
            }
          }}
          disabled={disabled || isSlateProduct}
          required
          placeholder={isSlateProduct ? "Auto-set to 1" : "Numbers only"}
        />
      </FormField>

      {/* Operator Input */}
      <FormField
        label="Operator Clock Number"
        hint="Optional"
        error={validation ? getFieldError(validation, 'operator') : undefined}
      >
        <input
          type="text"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 ${
            validation && getFieldError(validation, 'operator')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-blue-500'
          }`}
          value={operator}
          onChange={(e) => onOperatorChange(e.target.value)}
          disabled={disabled}
          placeholder="Optional"
        />
      </FormField>
    </div>
  );
});

BasicProductForm.displayName = 'BasicProductForm';

export default BasicProductForm; 