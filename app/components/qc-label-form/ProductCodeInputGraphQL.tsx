'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getErrorMessage } from '@/types/core/error';
import { useSearchProductByCode } from '@/lib/graphql/hooks/useProduct';
import type { Product } from '@/types/generated/graphql';
import type { ApolloError } from '@apollo/client';

// GraphQL query result type - matching the hook response type
interface SearchProductQueryResult {
  product?: {
    code: string;
    description: string;
    type: string;
    standardQty?: number;
    inventory?: {
      totalQuantity: number;
      availableQuantity: number;
      reservedQuantity: number;
    };
  };
}

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

interface ProductCodeInputGraphQLProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onProductInfoChange: (productInfo: ProductInfo | null) => void;
  onQuantityChange?: (quantity: string) => void;
  disabled?: boolean;
  required?: boolean;
  userId?: string; // Keep for backward compatibility
  showLabel?: boolean; // Add prop to control label visibility
  className?: string; // Add className prop
}

export const ProductCodeInputGraphQL: React.FC<ProductCodeInputGraphQLProps> = ({
  value,
  onChange,
  onBlur,
  onProductInfoChange,
  onQuantityChange,
  disabled = false,
  required = true,
  userId, // Keep for backward compatibility but not used
  showLabel = true, // Default to true for backward compatibility
  className = '',
}) => {
  const [productError, setProductError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GraphQL hook for searching product
  const [searchProductByCode, { loading: graphqlLoading, error: graphqlError }] = useSearchProductByCode({
    onCompleted: (data) => {
      if (data?.product) {
        const product = data.product;
        const productData: ProductInfo = {
          code: product.code,
          description: product.description,
          standard_qty: product.standardQty?.toString() || '1',
          type: product.type || 'Unknown',
          remark: '-' // GraphQL schema doesn't have remark field, set default
        };
        
        onProductInfoChange(productData);
        onChange(productData.code); // Use database standardized code
        setProductError(null);
        setIsLoading(false);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ProductCodeInputGraphQL] Product found:', productData);
        }

        // Auto-fill quantity if available
        if (productData.standard_qty && onQuantityChange) {
          onQuantityChange(productData.standard_qty);
        }
      } else {
        // Product not found
        onProductInfoChange(null);
        setProductError(`Product Code ${value.trim()} Not Found`);
        setIsLoading(false);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ProductCodeInputGraphQL] Product not found:', value.trim());
        }
      }
    },
    onError: (error) => {
      console.error('[ProductCodeInputGraphQL] Search error:', error);
      onProductInfoChange(null);
      setProductError('Search failed. Please try again.');
      setIsLoading(false);
    },
  });

  // Update loading state when GraphQL loading changes
  useEffect(() => {
    setIsLoading(graphqlLoading);
  }, [graphqlLoading]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search function with GraphQL
  const searchProductCode = useCallback(async (searchValue: string) => {
    const trimmedValue = searchValue.trim();

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Empty value handling
    if (!trimmedValue) {
      onProductInfoChange(null);
      setProductError(null);
      setIsLoading(false);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[ProductCodeInputGraphQL] Starting search for:', trimmedValue);
    }

    setIsLoading(true);
    setProductError(null);

    try {
      // Execute GraphQL query
      await searchProductByCode({
        variables: { code: trimmedValue }
      });
    } catch (error: unknown) {
      console.error('[ProductCodeInputGraphQL] Search error:', error);
      onProductInfoChange(null);
      setProductError('Search failed. Please try again.');
      setIsLoading(false);
    }
  }, [searchProductByCode, onProductInfoChange]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    // Only search when input has value
    if (value.trim()) {
      searchProductCode(value);
    } else {
      // Clear all states when input is empty
      setIsLoading(false);
      setProductError(null);
      onProductInfoChange(null);
    }
    
    // Call parent's onBlur if provided
    if (onBlur) {
      onBlur();
    }
  }, [value, searchProductCode, onProductInfoChange, onBlur]);

  // Handle Enter key submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        searchProductCode(value);
      }
    }
  }, [value, searchProductCode]);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-slate-300">
          Product Code {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Enter product code"
          className={`w-full rounded-md border px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
            productError
              ? 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400'
              : 'border-slate-600 bg-slate-800 focus:border-blue-500 focus:ring-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled || isLoading}
          autoComplete="off"
          autoCapitalize="off"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {productError && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {productError}
        </p>
      )}
      
      {/* GraphQL Error message */}
      {graphqlError && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          GraphQL Error: {getErrorMessage(graphqlError)}
        </p>
      )}
    </div>
  );
};

export default ProductCodeInputGraphQL;