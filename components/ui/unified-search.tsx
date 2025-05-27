import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, QrCode, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent } from './card';
import { QrScanner } from '../qr-scanner/qr-scanner';

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
  data: any;
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
}

export const UnifiedSearch = React.forwardRef<HTMLInputElement, UnifiedSearchProps>(({
  searchType,
  placeholder = "Search...",
  onSelect,
  onSearch,
  products = [],
  isLoading = false,
  enableQrScanner = true,
  disabled = false,
  value = "",
  onChange
}, ref) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [showResults, setShowResults] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Sync external value - but prevent infinite loops
  useEffect(() => {
    // Only update if the external value is different from current searchQuery
    if (value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value, searchQuery]);

  // Handle search logic with useMemo to prevent infinite loops
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const query = searchQuery; // 保持原始大小寫，避免搜尋失敗
    const queryLower = searchQuery.toLowerCase(); // 僅用於產品搜尋的大小寫不敏感比較

    // Product search
    if ((searchType === 'product' || searchType === 'both') && products.length > 0) {
      const productResults = products
        .filter(product => 
          product.name.toLowerCase().includes(queryLower) ||
          product.sku.toLowerCase().includes(queryLower)
        )
        .slice(0, 10) // Limit results
        .map(product => ({
          id: `product-${product.id}`,
          title: product.name,
          subtitle: `SKU: ${product.sku}`,
          metadata: `Stock: ${product.quantity} | Location: ${product.location}`,
          data: { type: 'product', ...product }
        }));
      
      results.push(...productResults);
    }

    // Pallet search (can be extended for actual pallet search logic)
    if (searchType === 'pallet' || searchType === 'both') {
      // If input looks like pallet number (with /) or series (with -)
      if (/^[A-Z0-9\/-]+$/i.test(query)) {
        results.push({
          id: `pallet-${query}`,
          title: `Search Pallet: ${query}`,
          subtitle: 'Click to search pallet information',
          metadata: 'Pallet Search',
          data: { type: 'pallet', value: query }
        });
      }
    }

    return results;
  }, [searchQuery, searchType, products]);

  // Update show results when filtered results change
  useEffect(() => {
    setShowResults(filteredResults.length > 0);
    setSelectedIndex(-1);
  }, [filteredResults]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
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
    onSelect(result);
    onChange?.(actualValue);
  }, [onSelect, onChange, searchQuery]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange?.(newValue);
    onSearch?.(newValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
  }, [showResults, filteredResults, selectedIndex, handleSelect]);

  // Handle QR scan
  const handleQrScan = useCallback((scannedValue: string) => {
    setShowQrScanner(false);
    setSearchQuery(scannedValue);
    onChange?.(scannedValue);
    onSearch?.(scannedValue);
    
    // Auto trigger search
    if (searchType === 'pallet' || searchType === 'both') {
      const palletResult: SearchResult = {
        id: `pallet-${scannedValue}`,
        title: scannedValue,
        subtitle: 'QR Scan Result',
        metadata: 'Pallet Search',
        data: { type: 'pallet', value: scannedValue }
      };
      onSelect(palletResult);
    }
  }, [searchType, onChange, onSearch, onSelect]);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <Input
          ref={(node) => {
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
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => filteredResults.length > 0 && setShowResults(true)}
          placeholder={isMobile && enableQrScanner ? "Tap to scan or enter search" : placeholder}
          className="pl-10 pr-20 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
          disabled={disabled}
          onClick={() => {
            if (isMobile && enableQrScanner && !disabled) {
              setShowQrScanner(true);
            }
          }}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-600 text-gray-400"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {enableQrScanner && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQrScanner(true)}
              className="h-6 w-6 p-0 hover:bg-gray-600 text-blue-400"
              disabled={disabled}
            >
              <QrCode className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && filteredResults.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border border-gray-600 bg-gray-800">
          <CardContent className="p-0">
            {filteredResults.map((result, index) => (
              <div
                key={result.id}
                ref={index === selectedIndex ? resultsRef : undefined}
                className={`px-4 py-3 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-700 ${
                  index === selectedIndex ? 'bg-gray-700 border-blue-400' : ''
                }`}
                onClick={() => handleSelect(result)}
              >
                <div className="font-medium text-white">{result.title}</div>
                <div className="text-sm text-gray-300">{result.subtitle}</div>
                {result.metadata && (
                  <div className="text-xs text-gray-400 mt-1">{result.metadata}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* QR Scanner */}
      {showQrScanner && (
        <QrScanner
          open={showQrScanner}
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
          title="Scan QR Code"
          hint="Align QR code within the frame"
        />
      )}

      {/* Click outside to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
});

UnifiedSearch.displayName = 'UnifiedSearch'; 