import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DatabaseRecord } from '@/lib/types/database';
import { Search, QrCode, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent } from './card';
import { SimpleQRScanner } from '../qr-scanner/simple-qr-scanner';

interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
  data: DatabaseRecord[];
}

interface UnifiedSearchProps {
  searchType: 'product' | 'pallet' | 'both';
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  onSearch?: (query: string) => void;
  products?: Product[];
  isLoading?: boolean;
  enableQrScanner?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  enableAutoDetection?: boolean;
}

// Auto detection function for search type
const detectSearchType = (input: string): 'series' | 'pallet_num' | 'unknown' => {
  const trimmedInput = input.trim();

  if (!trimmedInput) return 'unknown';

  // Pallet number pattern: typically contains "/" (e.g., "250525/13", "260525/1")
  if (trimmedInput.includes('/')) {
    return 'pallet_num';
  }

  // Series pattern: typically contains "-" (e.g., "260525-5UNXGE", "250525-ABC123")
  if (trimmedInput.includes('-')) {
    return 'series';
  }

  // If no clear pattern, try to guess based on length and format
  // Series are usually longer and may contain letters
  // Pallet numbers are usually shorter and numeric with date prefix

  // Check if it's all numeric (could be incomplete pallet number)
  if (/^\d+$/.test(trimmedInput)) {
    // If it's 6 digits, likely a date prefix for pallet (DDMMYY)
    if (trimmedInput.length === 6) {
      return 'pallet_num'; // Incomplete pallet number
    }
    return 'unknown';
  }

  // If it contains letters and is longer, likely a series
  if (/[A-Za-z]/.test(trimmedInput) && trimmedInput.length > 6) {
    return 'series';
  }

  return 'unknown';
};

export const UnifiedSearch = React.forwardRef<HTMLInputElement, UnifiedSearchProps>(
  (
    {
      searchType,
      placeholder = 'Search...',
      onSelect,
      onSearch,
      products = [],
      isLoading = false,
      enableQrScanner = true,
      disabled = false,
      value = '',
      onChange,
      enableAutoDetection = false,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = useState(value);
    const [showResults, setShowResults] = useState(false);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [detectedType, setDetectedType] = useState<'series' | 'pallet_num' | 'unknown'>(
      'unknown'
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const isMobile =
      typeof window !== 'undefined' &&
      /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    // Sync external value - but prevent infinite loops
    useEffect(() => {
      // Only update if the external value is different from current searchQuery
      if (value !== searchQuery) {
        setSearchQuery(value);
      }
    }, [value, searchQuery]);

    // Auto detect search type when input changes
    useEffect(() => {
      if (enableAutoDetection && searchQuery) {
        const detected = detectSearchType(searchQuery);
        setDetectedType(detected);
      }
    }, [searchQuery, enableAutoDetection]);

    // Handle search logic with useMemo to prevent infinite loops
    const filteredResults = React.useMemo(() => {
      if (!searchQuery.trim()) {
        return [];
      }

      const results: SearchResult[] = [];
      const query = searchQuery; // 保持原始大小寫，避免搜尋失敗
      const queryLower = searchQuery.toLowerCase(); // 僅用於產品搜尋的大小寫不敏感比較

      // Product search - only show dropdown for product search
      if ((searchType === 'product' || searchType === 'both') && products.length > 0) {
        const productResults = products
          .filter(
            product =>
              product.name.toLowerCase().includes(queryLower) ||
              product.sku.toLowerCase().includes(queryLower)
          )
          .slice(0, 10) // Limit results
          .map(product => ({
            id: `product-${product.id}`,
            title: product.name,
            subtitle: `SKU: ${product.sku}`,
            metadata: `Stock: ${product.quantity} | Location: ${product.location}`,
            data: { type: 'product', ...product },
          }));

        results.push(...productResults);
      }

      // For pallet search, don't show dropdown results - handle via onBlur instead
      // This removes the "Search pallet: xxxxxx" popup interface

      return results;
    }, [searchQuery, searchType, products]);

    // Update show results when filtered results change
    useEffect(() => {
      // Only show results for product search, not for pallet search
      if (searchType === 'pallet') {
        setShowResults(false);
      } else {
        setShowResults(filteredResults.length > 0);
      }
      setSelectedIndex(-1);
    }, [filteredResults, searchType]);

    // Handle selection
    const handleSelect = useCallback(
      (result: SearchResult) => {
        // For pallet search results, use the actual value instead of the display title
        const actualValue = result.data.type === 'pallet' ? result.data.value : result.title;

        // Close results first to prevent re-rendering issues
        setShowResults(false);
        setSelectedIndex(-1);

        // Only update searchQuery if it's different to prevent loops
        if (actualValue !== searchQuery) {
          setSearchQuery(actualValue);
        }

        // Call parent callbacks
        onSelect?.(result);
        onChange?.(actualValue);
      },
      [onSelect, onChange, searchQuery]
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchQuery(newValue);
      onChange?.(newValue);
      onSearch?.(newValue);
    };

    // Handle blur event for pallet search - trigger search when user leaves the input field
    const handleBlur = useCallback(() => {
      if (searchType === 'pallet' && searchQuery.trim()) {
        // Auto detect search type if enabled
        let finalSearchType: 'series' | 'pallet_num' = 'pallet_num';

        if (enableAutoDetection) {
          const detected = detectSearchType(searchQuery);
          if (detected === 'series') {
            finalSearchType = 'series';
          } else if (detected === 'pallet_num') {
            finalSearchType = 'pallet_num';
          } else {
            // If unknown, try to make a best guess or show error
            if (searchQuery.includes('/')) {
              finalSearchType = 'pallet_num';
            } else if (searchQuery.includes('-')) {
              finalSearchType = 'series';
            } else {
              // For unclear format, default to pallet_num but let the backend handle validation
              finalSearchType = 'pallet_num';
            }
          }
        }

        // Auto trigger pallet search on blur
        const palletResult: SearchResult = {
          id: `pallet-${searchQuery}`,
          title: searchQuery,
          subtitle: 'Pallet Search',
          metadata: `Auto Search on Blur (${finalSearchType})`,
          data: {
            type: 'pallet',
            value: searchQuery,
            searchType: finalSearchType, // Pass detected search type
          },
        };
        onSelect?.(palletResult);
      }
      // Hide results when losing focus
      setShowResults(false);
      setSelectedIndex(-1);
    }, [searchType, searchQuery, onSelect, enableAutoDetection]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!showResults) {
          // For pallet search, allow Enter key to trigger search even without dropdown
          if (e.key === 'Enter' && searchType === 'pallet' && searchQuery.trim()) {
            e.preventDefault();

            // Auto detect search type if enabled
            let finalSearchType: 'series' | 'pallet_num' = 'pallet_num';

            if (enableAutoDetection) {
              const detected = detectSearchType(searchQuery);
              if (detected === 'series') {
                finalSearchType = 'series';
              } else if (detected === 'pallet_num') {
                finalSearchType = 'pallet_num';
              } else {
                // If unknown, try to make a best guess
                if (searchQuery.includes('/')) {
                  finalSearchType = 'pallet_num';
                } else if (searchQuery.includes('-')) {
                  finalSearchType = 'series';
                } else {
                  finalSearchType = 'pallet_num';
                }
              }
            }

            const palletResult: SearchResult = {
              id: `pallet-${searchQuery}`,
              title: searchQuery,
              subtitle: 'Pallet Search',
              metadata: `Enter Key Search (${finalSearchType})`,
              data: {
                type: 'pallet',
                value: searchQuery,
                searchType: finalSearchType, // Pass detected search type
              },
            };
            onSelect?.(palletResult);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
              handleSelect(filteredResults[selectedIndex]);
            } else if (filteredResults.length === 1) {
              handleSelect(filteredResults[0]);
            }
            break;
          case 'Escape':
            setShowResults(false);
            setSelectedIndex(-1);
            inputRef.current?.blur();
            break;
        }
      },
      [
        showResults,
        filteredResults,
        selectedIndex,
        handleSelect,
        searchType,
        searchQuery,
        onSelect,
        enableAutoDetection,
      ]
    );

    // Handle QR scan
    const handleQrScan = useCallback(
      (scannedValue: string) => {
        setShowQrScanner(false);
        setSearchQuery(scannedValue);
        onChange?.(scannedValue);
        onSearch?.(scannedValue);

        // Auto trigger search
        if (searchType === 'pallet' || searchType === 'both') {
          // Auto detect search type for QR scanned value
          let finalSearchType: 'series' | 'pallet_num' = 'series'; // QR codes are usually series

          if (enableAutoDetection) {
            const detected = detectSearchType(scannedValue);
            if (detected === 'series') {
              finalSearchType = 'series';
            } else if (detected === 'pallet_num') {
              finalSearchType = 'pallet_num';
            } else {
              // For QR codes, default to series
              finalSearchType = 'series';
            }
          }

          const palletResult: SearchResult = {
            id: `pallet-${scannedValue}`,
            title: scannedValue,
            subtitle: 'QR Scan Result',
            metadata: `Pallet Search (${finalSearchType})`,
            data: {
              type: 'pallet',
              value: scannedValue,
              searchType: finalSearchType, // Pass detected search type
            },
          };
          onSelect?.(palletResult);
        }
      },
      [searchType, onChange, onSearch, onSelect, enableAutoDetection]
    );

    // Clear search
    const handleClear = useCallback(() => {
      setSearchQuery('');
      setShowResults(false);
      setSelectedIndex(-1);
      setDetectedType('unknown');
      onChange?.('');
      onSearch?.('');
      inputRef.current?.focus();
    }, [onChange, onSearch]);

    // Generate dynamic placeholder with detection info
    const getDynamicPlaceholder = useCallback(() => {
      if (!enableAutoDetection || !searchQuery) {
        return placeholder;
      }

      const baseText = placeholder.split(' - ')[0] || placeholder;

      if (detectedType === 'series') {
        return `${baseText} - detected: Series Number`;
      } else if (detectedType === 'pallet_num') {
        return `${baseText} - detected: Pallet Number`;
      } else if (searchQuery.trim()) {
        return `${baseText} - type unclear, will auto-detect`;
      }

      return placeholder;
    }, [placeholder, enableAutoDetection, searchQuery, detectedType]);

    return (
      <div className='relative w-full'>
        {/* Search Input */}
        <div className='relative'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
            ) : (
              <Search className='h-4 w-4 text-gray-400' />
            )}
          </div>

          <Input
            ref={node => {
              // 合併內部 ref 和外部 ref
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref && 'current' in ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
              if (inputRef && inputRef.current !== node) {
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            type='text'
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              // Only show results for product search, not pallet search
              if (searchType !== 'pallet' && filteredResults.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder={getDynamicPlaceholder()}
            className='border-gray-600 bg-gray-700 pl-10 pr-20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400'
            disabled={disabled}
            // Remove automatic camera activation on mobile click for search field
          />

          <div className='absolute inset-y-0 right-0 flex items-center space-x-1 pr-2'>
            {searchQuery && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleClear}
                className='h-6 w-6 p-0 text-gray-400 hover:bg-gray-600'
                disabled={disabled}
              >
                <X className='h-3 w-3' />
              </Button>
            )}

            {enableQrScanner && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setShowQrScanner(true)}
                className='h-6 w-6 p-0 text-blue-400 hover:bg-gray-600'
                disabled={disabled}
              >
                <QrCode className='h-3 w-3' />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown - Only for product search */}
        {showResults && filteredResults.length > 0 && searchType !== 'pallet' && (
          <Card className='absolute z-50 mt-1 max-h-60 w-full overflow-y-auto border border-gray-600 bg-gray-800 shadow-lg'>
            <CardContent className='p-0'>
              {filteredResults.map((result, index) => (
                <div
                  key={result.id}
                  ref={index === selectedIndex ? resultsRef : undefined}
                  className={`cursor-pointer border-b border-gray-700 px-4 py-3 last:border-b-0 hover:bg-gray-700 ${
                    index === selectedIndex ? 'border-blue-400 bg-gray-700' : ''
                  }`}
                  onClick={() => handleSelect(result)}
                >
                  <div className='font-medium text-white'>{result.title}</div>
                  <div className='text-sm text-gray-300'>{result.subtitle}</div>
                  {result.metadata && (
                    <div className='mt-1 text-xs text-gray-400'>{result.metadata}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* QR Scanner */}
        {showQrScanner && (
          <SimpleQRScanner
            open={showQrScanner}
            onScan={handleQrScan}
            onClose={() => setShowQrScanner(false)}
            title='Scan QR Code'
          />
        )}

        {/* Click outside to close results */}
        {showResults && (
          <div className='fixed inset-0 z-40' onClick={() => setShowResults(false)} />
        )}
      </div>
    );
  }
);

UnifiedSearch.displayName = 'UnifiedSearch';
