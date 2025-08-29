/**
 * SearchInput Component
 * Unified search input component with auto-detection and multiple search types
 * Extracted from existing card components (VoidPalletCard, StockTransferCard, StockHistoryCard)
 */

'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, Loader2, QrCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type SearchType = 'pallet' | 'product' | 'supplier' | 'order' | 'auto';

export interface SearchInputProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string, type?: SearchType) => void;
  onClear?: () => void;

  // Search configuration
  searchType?: SearchType;
  autoDetect?: boolean;
  placeholder?: string;
  searchOnEnter?: boolean;
  searchOnChange?: boolean;
  debounceMs?: number;

  // UI configuration
  showSearchButton?: boolean;
  showClearButton?: boolean;
  showQrButton?: boolean;
  showTypeIndicator?: boolean;
  size?: 'sm' | 'default' | 'lg';

  // State props
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;

  // Additional features
  onQrScan?: () => void;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export interface SearchInputRef {
  focus: () => void;
  clear: () => void;
  search: () => void;
}

// Helper function to detect search type from value
const detectSearchType = (value: string): SearchType => {
  if (!value) return 'auto';

  // Pallet patterns
  if (value.startsWith('PLT') || value.match(/^PLT\d{6}$/)) {
    return 'pallet';
  }

  // QR code series pattern (from VoidPalletCard)
  if (value.match(/^\d{10,}$/)) {
    return 'pallet'; // Series can be treated as pallet search
  }

  // Product code patterns
  if (value.match(/^[A-Z0-9]{3,10}$/)) {
    return 'product';
  }

  // Order reference pattern
  if (value.match(/^ORD\d+$/) || value.match(/^\d{6,8}$/)) {
    return 'order';
  }

  // Supplier patterns (usually contains text)
  if (value.match(/^[A-Za-z\s]+$/)) {
    return 'supplier';
  }

  return 'auto';
};

export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  (
    {
      value,
      onChange,
      onSearch,
      onClear,
      searchType = 'auto',
      autoDetect = true,
      placeholder = 'Search...',
      searchOnEnter = true,
      searchOnChange = false,
      debounceMs = 300,
      showSearchButton = true,
      showClearButton = true,
      showQrButton = false,
      showTypeIndicator = false,
      size = 'default',
      isLoading = false,
      disabled = false,
      error,
      onQrScan,
      suggestions = [],
      recentSearches = [],
      className,
      inputClassName,
      buttonClassName,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout>();

    // Detect type if auto-detect is enabled
    const detectedType = autoDetect ? detectSearchType(value) : searchType;

    // Imperative handle for parent components
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      clear: () => {
        onChange('');
        onClear?.();
        inputRef.current?.focus();
      },
      search: () => {
        handleSearch();
      },
    }));

    // Handle search
    const handleSearch = () => {
      if (!value.trim() || isLoading || disabled) return;
      onSearch?.(value, detectedType);
    };

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Search on change with debounce
      if (searchOnChange && newValue.trim()) {
        debounceTimerRef.current = setTimeout(() => {
          const type = autoDetect ? detectSearchType(newValue) : searchType;
          onSearch?.(newValue, type);
        }, debounceMs);
      }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchOnEnter) {
        e.preventDefault();
        handleSearch();
      }
    };

    // Handle clear
    const handleClear = () => {
      onChange('');
      onClear?.();
      inputRef.current?.focus();
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm',
      default: 'h-10',
      lg: 'h-12 text-lg',
    };

    const buttonSizeClasses = {
      sm: 'h-8 w-8',
      default: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    // Type indicator colors
    const typeColors = {
      pallet: 'bg-blue-500',
      product: 'bg-green-500',
      supplier: 'bg-purple-500',
      order: 'bg-orange-500',
      auto: 'bg-gray-500',
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div className='flex gap-2'>
          {/* Type indicator */}
          {showTypeIndicator && detectedType !== 'auto' && (
            <Badge
              variant='secondary'
              className={cn(
                'flex items-center justify-center px-2',
                typeColors[detectedType],
                'text-white'
              )}
            >
              {detectedType}
            </Badge>
          )}

          {/* Input field */}
          <div className='relative flex-1'>
            <Input
              ref={inputRef}
              type='text'
              value={value}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(sizeClasses[size], error && 'border-red-500', inputClassName)}
            />

            {/* Clear button inside input */}
            {showClearButton && value && !isLoading && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0'
                onClick={handleClear}
                disabled={disabled}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>

          {/* Search button */}
          {showSearchButton && (
            <Button
              type='button'
              variant='default'
              size='icon'
              onClick={handleSearch}
              disabled={disabled || isLoading || !value.trim()}
              className={cn(buttonSizeClasses[size], buttonClassName)}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Search className='h-4 w-4' />
              )}
            </Button>
          )}

          {/* QR Scanner button */}
          {showQrButton && onQrScan && (
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={onQrScan}
              disabled={disabled || isLoading}
              className={cn(buttonSizeClasses[size], buttonClassName)}
            >
              <QrCode className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && <p className='text-sm text-red-500'>{error}</p>}

        {/* Suggestions or recent searches */}
        {(suggestions.length > 0 || recentSearches.length > 0) && !value && (
          <div className='rounded-lg border bg-muted/30 p-2'>
            {recentSearches.length > 0 && (
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>Recent searches</p>
                <div className='flex flex-wrap gap-1'>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='cursor-pointer text-xs'
                      onClick={() => {
                        onChange(search);
                        handleSearch();
                      }}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className='mt-2 space-y-1'>
                <p className='text-xs text-muted-foreground'>Suggestions</p>
                <div className='flex flex-wrap gap-1'>
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='cursor-pointer text-xs'
                      onClick={() => {
                        onChange(suggestion);
                        handleSearch();
                      }}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
