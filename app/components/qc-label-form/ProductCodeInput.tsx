'use client';

import React, { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { errorHandler } from './services/ErrorHandler';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
}

interface ProductCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  onQuantityChange?: (quantity: string) => void;
  disabled?: boolean;
  required?: boolean;
  userId?: string;
}

export const ProductCodeInput: React.FC<ProductCodeInputProps> = React.memo(({
  value,
  onChange,
  onProductInfoChange,
  onQuantityChange,
  disabled = false,
  required = true,
  userId
}) => {
  const [productError, setProductError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProductCodeBlur = useCallback(async () => {
    if (!value.trim()) {
      onProductInfoChange(null);
      setProductError(null);
      return;
    }

    setIsLoading(true);
    
    try {
      const client = createClient();
      const { data, error } = await client.rpc('get_product_details_by_code', { 
        p_code: value.trim() 
      });

      if (error) {
        console.error('[ProductCodeInput] Error calling RPC get_product_details_by_code:', error);
        onProductInfoChange(null);
        setProductError('Error fetching product info via RPC.');
        
        errorHandler.handleApiError(error, {
          component: 'ProductCodeInput',
          action: 'product_search',
          userId,
          additionalData: { productCode: value.trim() }
        }, 'Error fetching product info.');
      } else if (data && data.length > 0) {
        const productData = data[0] as ProductInfo;
        
        onProductInfoChange(productData);
        onChange(productData.code); // Standardize to the code from DB
        setProductError(null);
        
        // Auto-fill quantity if available and callback provided
        if (productData.standard_qty && onQuantityChange) {
          onQuantityChange(productData.standard_qty);
        }
      } else {
        onProductInfoChange(null);
        setProductError(`Product Code ${value.trim()} Not Found. Please Check Again.`);
        
        errorHandler.handleWarning(`Product code ${value.trim()} not found.`, {
          component: 'ProductCodeInput',
          action: 'product_search',
          userId,
          additionalData: { productCode: value.trim() }
        }, false); // Don't show toast as we have field-level error
      }
    } catch (e: any) {
      console.error('[ProductCodeInput] Exception during product info fetch via RPC:', e);
      onProductInfoChange(null);
      setProductError('An unexpected error occurred while fetching product data.');
      
      errorHandler.handleApiError(e, {
        component: 'ProductCodeInput',
        action: 'product_search',
        userId,
        additionalData: { productCode: value.trim() }
      }, 'An unexpected error occurred while fetching product data.');
    } finally {
      setIsLoading(false);
    }
  }, [value, onChange, onProductInfoChange, onQuantityChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear related states on input change to avoid showing stale data
    if (newValue !== value) {
      onProductInfoChange(null);
      setProductError(null);
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">
        Product Code
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md bg-gray-900 border text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            productError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={value}
          onChange={handleInputChange}
          onBlur={handleProductCodeBlur}
          disabled={disabled || isLoading}
          required={required}
          placeholder={required ? "Required" : "Optional"}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {productError && (
        <div className="text-red-500 text-sm font-semibold mt-1">
          {productError}
        </div>
      )}
    </div>
  );
});

ProductCodeInput.displayName = 'ProductCodeInput';

export default ProductCodeInput; 