'use client';

import React from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';
import ProductCodeInputGraphQL from '@/app/components/qc-label-form/ProductCodeInputGraphQL';
import RemarkFormatter from '@/app/components/qc-label-form/RemarkFormatter';
import { MAX_PALLET_COUNT } from './qc-label-constants';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

interface GridBasicProductFormGraphQLProps {
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

export const GridBasicProductFormGraphQL: React.FC<GridBasicProductFormGraphQLProps> = React.memo(
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
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onPrintLabel();
    };

    return (
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Product Code Input - GraphQL Version */}
        <ProductCodeInputGraphQL
          value={productCode}
          onChange={onProductCodeChange}
          onBlur={onProductCodeBlur}
          onProductInfoChange={onProductInfoChange}
          onQuantityChange={onQuantityChange}
          disabled={disabled}
          required={true}
          showLabel={true}
          className=''
        />

        {errors.productCode && <p className='text-sm text-red-400'>{errors.productCode}</p>}

        {/* Product Information Display */}
        {productInfo && (
          <div className='rounded-md border border-slate-700 bg-slate-800/50 p-3'>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>
                <span className='text-slate-400'>Code:</span>
                <span className='ml-2 font-mono text-white'>{productInfo.code}</span>
              </div>
              <div>
                <span className='text-slate-400'>Type:</span>
                <span className='ml-2 text-white'>{productInfo.type}</span>
              </div>
              <div className='col-span-2'>
                <span className='text-slate-400'>Description:</span>
                <span className='ml-2 text-white'>{productInfo.description}</span>
              </div>
              {productInfo.remark && productInfo.remark !== '-' && (
                <div className='col-span-2'>
                  <span className='text-slate-400'>Remark:</span>
                  <div className='ml-2 text-white'>
                    <RemarkFormatter remarkText={productInfo.remark} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div className='space-y-1'>
          <label className='block text-sm font-medium text-slate-300'>
            Quantity <span className='text-red-400'>*</span>
          </label>
          <input
            type='number'
            value={quantity}
            onChange={e => onQuantityChange(e.target.value)}
            placeholder='Enter quantity per pallet'
            className={`w-full rounded-md border px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
              errors.quantity
                ? 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400'
                : 'border-slate-600 bg-slate-800 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={disabled}
            min='1'
            step='1'
          />
          {errors.quantity && <p className='text-sm text-red-400'>{errors.quantity}</p>}
        </div>

        {/* Pallet Count Input */}
        <div className='space-y-1'>
          <label className='block text-sm font-medium text-slate-300'>
            Pallet Count <span className='text-red-400'>*</span>
            {parseInt(count) > MAX_PALLET_COUNT && (
              <span className='ml-2 text-sm text-yellow-400'>(Max: {MAX_PALLET_COUNT})</span>
            )}
          </label>
          <input
            type='number'
            value={count}
            onChange={e => onCountChange(e.target.value)}
            placeholder='Enter number of pallets'
            className={`w-full rounded-md border px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
              errors.count || parseInt(count) > MAX_PALLET_COUNT
                ? 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400'
                : 'border-slate-600 bg-slate-800 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={disabled}
            min='1'
            max={MAX_PALLET_COUNT}
            step='1'
          />
          {errors.count && <p className='text-sm text-red-400'>{errors.count}</p>}
          {parseInt(count) > MAX_PALLET_COUNT && !errors.count && (
            <p className='text-sm text-yellow-400'>
              Maximum {MAX_PALLET_COUNT} pallets allowed per batch
            </p>
          )}
        </div>

        {/* Operator Input */}
        <div className='space-y-1'>
          <label className='block text-sm font-medium text-slate-300'>Operator</label>
          <input
            type='text'
            value={operator}
            onChange={e => onOperatorChange(e.target.value)}
            placeholder='Enter operator name (optional)'
            className={`w-full rounded-md border px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
              errors.operator
                ? 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400'
                : 'border-slate-600 bg-slate-800 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={disabled}
          />
          {errors.operator && <p className='text-sm text-red-400'>{errors.operator}</p>}
        </div>

        {/* Print Button */}
        <button
          type='submit'
          disabled={isPrintDisabled || disabled}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
            isPrintDisabled || disabled
              ? 'cursor-not-allowed bg-slate-700 text-slate-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900'
          }`}
        >
          {isPrintLoading ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Processing...
            </>
          ) : (
            <>
              <PrinterIcon className='h-4 w-4' />
              {printButtonText}
            </>
          )}
        </button>
      </form>
    );
  }
);

GridBasicProductFormGraphQL.displayName = 'GridBasicProductFormGraphQL';

export default GridBasicProductFormGraphQL;
