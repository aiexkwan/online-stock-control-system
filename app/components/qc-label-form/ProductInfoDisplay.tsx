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

export const ProductInfoDisplay: React.FC<ProductInfoDisplayProps> = React.memo(({
  productInfo,
  error
}) => {
  if (error) {
    return (
      <div className="text-red-500 text-sm font-semibold mb-2 p-3 bg-red-50 border border-red-200 rounded-md">
        {error}
      </div>
    );
  }

  if (!productInfo) {
    return null;
  }

  return (
    <div className="text-white text-sm font-semibold mb-2 space-y-1 p-3 bg-gray-700 rounded-md border border-gray-600">
      <div className="flex justify-between">
        <span className="text-gray-300">Product Description:</span>
        <span className="text-white">{productInfo.description}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-300">Standard Qty:</span>
        <span className="text-white">{productInfo.standard_qty}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-300">Product Type:</span>
        <span className={`font-bold ${
          productInfo.type === 'ACO' ? 'text-blue-400' :
          productInfo.type === 'Slate' ? 'text-green-400' :
          'text-yellow-400'
        }`}>
          {productInfo.type}
        </span>
      </div>
    </div>
  );
});

ProductInfoDisplay.displayName = 'ProductInfoDisplay';

export default ProductInfoDisplay; 