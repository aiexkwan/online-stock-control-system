'use client';

import React from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';
import ProductCodeInput from './ProductCodeInput';
import RemarkFormatter from './RemarkFormatter';
import { MAX_PALLET_COUNT } from './constants';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

interface GridBasicProductFormProps {
  productCode: string;
  onProductCodeChange: (value: string) => void;
  onProductCodeBlur?: () => void;
  productInfo: ProductInfo | null;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  count: string;
  onCountChange: (value: string) => void;
  operator: string;
  onOperatorChange: (value: string) => void;
  onPrintLabel: () => void;
  isPrintDisabled: boolean;
  isPrintLoading: boolean;
  printButtonText: string;
  errors: Record<string, string>;
  disabled?: boolean;
}

export const GridBasicProductForm: React.FC<GridBasicProductFormProps> = React.memo(
  ({
    productCode,
    onProductCodeChange,
    onProductCodeBlur,
    productInfo,
    onProductInfoChange,
    quantity,
    onQuantityChange,
    count,
    onCountChange,
    operator,
    onOperatorChange,
    onPrintLabel,
    isPrintDisabled,
    isPrintLoading,
    printButtonText,
    errors,
    disabled = false,
  }) => {
    const isSlateProduct = productInfo?.type === 'Slate';
    const countValue = parseInt(count) || 0;
    const isCountExceeded = countValue > MAX_PALLET_COUNT;

    // Check if remark should be displayed
    const shouldShowNotice =
      productInfo?.remark &&
      productInfo.remark !== 'Null' &&
      productInfo.remark !== '-' &&
      productInfo.remark.trim() !== '';

    return (
      <div className='flex h-full flex-col'>
        {/* First Row - Product Code and Quantity */}
        <div className='mb-4 grid grid-cols-2 gap-4'>
          {/* Product Code */}
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Product Code <span className='text-red-500'>*</span>
            </label>
            <ProductCodeInput
              value={productCode}
              onChange={onProductCodeChange}
              onBlur={onProductCodeBlur}
              onProductInfoChange={onProductInfoChange}
              onQuantityChange={onQuantityChange}
              disabled={disabled}
              required={true}
              showLabel={false}
            />
            {errors.productCode && (
              <p className='mt-1 text-xs text-red-500'>{errors.productCode}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Quantity of Pallet <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              className={`h-10 w-full rounded-md border bg-gray-900 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.quantity
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-blue-500'
              }`}
              value={quantity}
              onChange={e => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                onQuantityChange(numericValue);
              }}
              disabled={disabled}
              required
              placeholder='Numbers only'
            />
            {errors.quantity && <p className='mt-1 text-xs text-red-500'>{errors.quantity}</p>}
          </div>
        </div>

        {/* Product Info Display - 在兩列輸入格之間 */}
        {productInfo && (
          <div className='mb-4 rounded-lg border border-yellow-600/30 bg-yellow-900/30 p-3'>
            <div className='text-sm text-yellow-200/80'>{productInfo.code}</div>
            <div className='font-medium text-yellow-100'>{productInfo.description}</div>
            <div className='mt-1 text-xs text-yellow-200/60'>
              Standard Qty: {productInfo.standard_qty} | Type: {productInfo.type}
            </div>
          </div>
        )}

        {/* Second Row - Count and Operator */}
        <div className='mb-4 grid grid-cols-2 gap-4'>
          {/* Count */}
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Count of Pallet <span className='text-red-500'>*</span>
              {isSlateProduct && (
                <span className='ml-2 text-xs text-slate-400'>(Auto-set to 1)</span>
              )}
            </label>
            <input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              className={`h-10 w-full rounded-md border bg-gray-900 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                isCountExceeded
                  ? 'border-red-500 focus:ring-red-500'
                  : errors.count
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-700 focus:ring-blue-500'
              } ${isSlateProduct ? 'cursor-not-allowed opacity-50' : ''}`}
              value={isSlateProduct ? '1' : count}
              onChange={e => {
                if (!isSlateProduct) {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  onCountChange(numericValue);
                }
              }}
              disabled={disabled || isSlateProduct}
              required
              placeholder={isSlateProduct ? 'Auto-set to 1' : `Max ${MAX_PALLET_COUNT} pallets`}
            />
            {(isCountExceeded || errors.count) && (
              <p className='mt-1 text-xs text-red-500'>
                {isCountExceeded ? `Maximum ${MAX_PALLET_COUNT} pallets allowed` : errors.count}
              </p>
            )}
          </div>

          {/* Operator */}
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Operator Clock Number
              <span className='ml-2 text-xs text-slate-400'>(Optional)</span>
            </label>
            <input
              type='text'
              className={`h-10 w-full rounded-md border bg-gray-900 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.operator
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-blue-500'
              }`}
              value={operator}
              onChange={e => onOperatorChange(e.target.value)}
              disabled={disabled}
              placeholder='Optional'
            />
            {errors.operator && <p className='mt-1 text-xs text-red-500'>{errors.operator}</p>}
          </div>
        </div>

        {/* Print Button - 獨立一行 */}
        <div className='mb-4 flex justify-end'>
          <button
            type='button'
            onClick={onPrintLabel}
            disabled={isPrintDisabled}
            className={`relative flex items-center justify-center space-x-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
              !isPrintDisabled
                ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] hover:from-blue-500 hover:via-blue-400 hover:to-cyan-400 hover:shadow-blue-400/40 active:scale-[0.98]'
                : 'cursor-not-allowed bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 shadow-lg shadow-slate-900/20'
            } `}
          >
            <PrinterIcon className={`h-5 w-5 ${isPrintLoading ? 'animate-pulse' : ''}`} />
            <span>{printButtonText}</span>
            {isPrintLoading && (
              <div className='absolute right-2 top-1/2 -translate-y-1/2 transform'>
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
              </div>
            )}
          </button>
        </div>

        {/* Special Notice/Remark - 放喺底部但仍喺 card 內 */}
        {shouldShowNotice && (
          <div className='mt-auto animate-pulse rounded-md border-2 border-red-500 bg-black p-4'>
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
      </div>
    );
  }
);

GridBasicProductForm.displayName = 'GridBasicProductForm';

export default GridBasicProductForm;
