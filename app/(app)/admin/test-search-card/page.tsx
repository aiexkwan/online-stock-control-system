'use client';

import React, { useState } from 'react';
import { SearchCard } from '../components/dashboard/cards/SearchCard';
import {
  SearchMode,
  SearchableEntity,
  SearchResultItem,
  SearchCardData,
} from '@/types/generated/search-types';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/apollo-client';

export default function TestSearchCardPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [searchHistory, setSearchHistory] = useState<
    { timestamp: string; result: SearchResultItem }[]
  >([]);

  const handleResultSelect = (result: SearchResultItem) => {
    setSelectedResult(result);
    setSearchHistory(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        result,
      },
    ]);
  };

  const handleSearch = (query: string, results: SearchCardData) => {
    console.log('Search performed:', { query, results });
  };

  return (
    <ApolloProvider client={apolloClient}>
      <div className='container mx-auto min-h-screen bg-gray-900 p-8'>
        <h1 className='mb-8 text-3xl font-bold text-white'>SearchCard Test Page</h1>

        <div className='grid gap-8'>
          {/* Global Search */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Global Search</h2>
            <SearchCard
              placeholder='Search products, pallets, orders...'
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className='max-w-2xl'
            />
          </div>

          {/* Product Search */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Product Search</h2>
            <SearchCard
              placeholder='Search products...'
              defaultMode={SearchMode.Entity}
              defaultEntities={[SearchableEntity.Product]}
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className='max-w-2xl'
            />
          </div>

          {/* Order and GRN Search */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Order & GRN Search</h2>
            <SearchCard
              placeholder='Search orders and GRNs...'
              defaultMode={SearchMode.Entity}
              defaultEntities={[SearchableEntity.Order, SearchableEntity.Grn]}
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className='max-w-2xl'
            />
          </div>

          {/* Recent Search Result */}
          {selectedResult && (
            <div className='mt-8 rounded-lg bg-gray-800 p-6'>
              <h3 className='mb-4 text-lg font-semibold text-gray-300'>Selected Result:</h3>
              <pre className='overflow-auto text-sm text-gray-400'>
                {JSON.stringify(selectedResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className='mt-8 rounded-lg bg-gray-800 p-6'>
              <h3 className='mb-4 text-lg font-semibold text-gray-300'>Search History:</h3>
              <div className='space-y-2'>
                {searchHistory
                  .slice(-5)
                  .reverse()
                  .map((item, index) => (
                    <div key={index} className='rounded bg-gray-700 p-3'>
                      <div className='text-sm text-gray-400'>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                      <div className='mt-1 text-sm text-gray-300'>
                        {item.result.title} - {item.result.entity}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ApolloProvider>
  );
}
