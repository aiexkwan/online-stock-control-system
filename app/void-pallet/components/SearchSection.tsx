'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrScanner } from '@/components/qr-scanner/qr-scanner';
import { QrCodeIcon, NumberedListIcon } from '@heroicons/react/24/outline';

interface SearchSectionProps {
  searchInput: string;
  searchType: 'qr' | 'pallet_num';
  isSearching: boolean;
  isDisabled: boolean;
  showScanner: boolean;
  onSearchInputChange: (value: string) => void;
  onSearchTypeChange: (type: 'qr' | 'pallet_num') => void;
  onSearch: () => void;
  onQRScan: (value: string) => void;
  onShowScanner: (show: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function SearchSection({
  searchInput,
  searchType,
  isSearching,
  isDisabled,
  showScanner,
  onSearchInputChange,
  onSearchTypeChange,
  onSearch,
  onQRScan,
  onShowScanner,
  onKeyDown,
}: SearchSectionProps) {
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-2">Void Pallet</h1>
        <p className="text-gray-400">Search for pallet to void</p>
      </div>

      {/* Search type selection */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={searchType === 'qr' ? 'default' : 'outline'}
          onClick={() => onSearchTypeChange('qr')}
          disabled={isDisabled}
          className="flex items-center space-x-2"
        >
          <QrCodeIcon className="h-4 w-4" />
          <span>QR Code</span>
        </Button>
        <Button
          variant={searchType === 'pallet_num' ? 'default' : 'outline'}
          onClick={() => onSearchTypeChange('pallet_num')}
          disabled={isDisabled}
          className="flex items-center space-x-2"
        >
          <NumberedListIcon className="h-4 w-4" />
          <span>Pallet Number</span>
        </Button>
      </div>

      {/* Search input area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onClick={() => {
              if (isMobile && searchType === 'qr' && !isDisabled) {
                onShowScanner(true);
              }
            }}
            placeholder={
              searchType === 'qr' 
                ? (isMobile ? "Tap to scan QR Code" : "Scan or enter QR Code")
                : "Enter pallet number"
            }
            className="w-full bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500 text-lg p-4"
            disabled={isSearching || isDisabled}
          />
        </div>
        <div>
          <Button
            onClick={onSearch}
            disabled={isSearching || isDisabled || !searchInput.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 text-lg"
          >
            {isSearching ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Search Pallet'
            )}
          </Button>
        </div>
      </div>

      {/* QR Scanner */}
      <QrScanner
        open={showScanner}
        onClose={() => onShowScanner(false)}
        onScan={onQRScan}
        title="Scan Pallet QR Code"
        hint="Align QR Code within the frame to scan"
      />

      {/* Search hints */}
      <div className="text-center text-sm text-gray-400">
        {searchType === 'qr' ? (
          <p>
            {isMobile ? 'Tap input field to open camera scanner' : 'Use scanner to scan QR Code on pallet'}
          </p>
        ) : (
          <p>Enter complete pallet number to search</p>
        )}
      </div>
    </div>
  );
} 