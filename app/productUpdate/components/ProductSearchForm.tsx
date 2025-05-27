'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface ProductSearchFormProps {
  onSearch: (code: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ProductSearchForm({ 
  onSearch, 
  isLoading, 
  disabled = false 
}: ProductSearchFormProps) {
  const [productCode, setProductCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleBlur = async () => {
    const trimmedCode = productCode.trim();
    if (trimmedCode && !hasSearched) {
      setHasSearched(true);
      await onSearch(trimmedCode);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductCode(e.target.value);
    setHasSearched(false);
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedCode = productCode.trim();
      if (trimmedCode) {
        setHasSearched(true);
        await onSearch(trimmedCode);
      }
    }
  };

  return (
    <Card className="border-gray-600 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Product Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Input
            value={productCode}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder="Enter product code and press Tab or Enter..."
            disabled={isLoading || disabled}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter a product code and press Tab or Enter to search (case-insensitive)
        </p>
      </CardContent>
    </Card>
  );
} 