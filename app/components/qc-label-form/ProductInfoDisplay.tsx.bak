'use client';

import React from 'react';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
}

interface ProductInfoDisplayProps {
  productInfo: ProductInfo | null;
  error?: string | null;
}

export const ProductInfoDisplay: React.FC<ProductInfoDisplayProps> = React.memo(
  ({ productInfo, error }) => {
    if (error) {
      return (
        <div className='mb-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-500'>
          {error}
        </div>
      );
    }

    if (!productInfo) {
      return null;
    }

    return (
      <div className='mb-2 space-y-1 rounded-md border border-gray-600 bg-gray-700 p-3 text-sm font-semibold text-white'>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Product Description:</span>
          <span className='text-white'>{productInfo.description}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Standard Qty:</span>
          <span className='text-white'>{productInfo.standard_qty}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Product Type:</span>
          <span
            className={`font-bold ${
              productInfo.type === 'ACO'
                ? 'text-blue-400'
                : productInfo.type === 'Slate'
                  ? 'text-green-400'
                  : 'text-yellow-400'
            }`}
          >
            {productInfo.type}
          </span>
        </div>
      </div>
    );
  }
);

// Set display name for debugging
ProductInfoDisplay.displayName = 'ProductInfoDisplay';

export default ProductInfoDisplay;
