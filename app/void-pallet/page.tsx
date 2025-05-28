'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { useVoidPallet } from './hooks/useVoidPallet';
import { SearchSection } from './components/SearchSection';
import { PalletInfoCard } from './components/PalletInfoCard';
import { VoidForm } from './components/VoidForm';
import { ErrorHandler } from './components/ErrorHandler';

export default function VoidPalletPage() {
  const {
    state,
    updateState,
    searchPallet,
    handleQRScan,
    executeVoid,
    handleDamageQuantityChange,
    handleVoidReasonChange,
    clearError,
    canExecuteVoid,
    showDamageQuantityInput,
    isACOPallet,
  } = useVoidPallet();

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    updateState({ searchInput: value });
  };

  // Handle search type change
  const handleSearchTypeChange = (type: 'qr' | 'pallet_num') => {
    updateState({ searchType: type, searchInput: '' });
  };

  // Handle search operation
  const handleSearch = () => {
    if (state.searchInput.trim()) {
      searchPallet(state.searchInput, state.searchType);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isSearching && !state.isInputDisabled) {
      handleSearch();
    }
  };

  // Handle password change
  const handlePasswordChange = (password: string) => {
    updateState({ password });
  };

  // Handle show scanner
  const handleShowScanner = (show: boolean) => {
    updateState({ showScanner: show });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Search section */}
          <SearchSection
            searchInput={state.searchInput}
            searchType={state.searchType}
            isSearching={state.isSearching}
            isDisabled={state.isInputDisabled}
            showScanner={state.showScanner}
            onSearchInputChange={handleSearchInputChange}
            onSearchTypeChange={handleSearchTypeChange}
            onSearch={handleSearch}
            onQRScan={handleQRScan}
            onShowScanner={handleShowScanner}
            onKeyDown={handleKeyDown}
          />

          {/* Error handling */}
          {state.error && (
            <ErrorHandler
              error={state.error}
              onConfirm={clearError}
              className="mx-auto max-w-2xl"
            />
          )}

          {/* Pallet information and void form */}
          {state.foundPallet && !state.error?.isBlocking && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Pallet information card */}
              <PalletInfoCard pallet={state.foundPallet} />

              {/* Void operation form */}
              <VoidForm
                voidReason={state.voidReason}
                password={state.password}
                damageQuantity={state.damageQuantity}
                showDamageQuantityInput={showDamageQuantityInput}
                isACOPallet={isACOPallet}
                isProcessing={state.isProcessing}
                isDisabled={state.isInputDisabled}
                canExecuteVoid={canExecuteVoid}
                maxQuantity={state.foundPallet.product_qty}
                onVoidReasonChange={handleVoidReasonChange}
                onPasswordChange={handlePasswordChange}
                onDamageQuantityChange={handleDamageQuantityChange}
                onExecuteVoid={executeVoid}
              />
            </div>
          )}

          {/* Loading state */}
          {(state.isSearching || state.isProcessing) && !state.error && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-400">
                  {state.isSearching ? 'Searching pallet...' : 'Processing void operation...'}
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!state.foundPallet && !state.isSearching && !state.error && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Start searching for pallet</h3>
                <p className="text-sm">
                  Use the search function above to find the pallet to void
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
} 