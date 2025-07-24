'use client';

import React, { useState } from 'react';
import { SearchCard } from '../components/dashboard/cards/SearchCard';
import { SearchMode, SearchableEntity } from '@/types/generated/search-types';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/apollo-client';

export default function TestSearchCardPage() {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  const handleResultSelect = (result: any) => {
    setSelectedResult(result);
    setSearchHistory(prev => [...prev, { 
      timestamp: new Date().toISOString(), 
      result 
    }]);
  };

  const handleSearch = (query: string, results: any) => {
    console.log('Search performed:', { query, results });
  };

  return (
    <ApolloProvider client={apolloClient}>
      <div className="container mx-auto p-8 bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-white mb-8">SearchCard Test Page</h1>
        
        <div className="grid gap-8">
          {/* Global Search */}
          <div>
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Global Search</h2>
            <SearchCard
              placeholder="Search products, pallets, orders..."
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className="max-w-2xl"
            />
          </div>

          {/* Product Search */}
          <div>
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Product Search</h2>
            <SearchCard
              placeholder="Search products..."
              defaultMode={SearchMode.Entity}
              defaultEntities={[SearchableEntity.Product]}
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className="max-w-2xl"
            />
          </div>

          {/* Order and GRN Search */}
          <div>
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Order & GRN Search</h2>
            <SearchCard
              placeholder="Search orders and GRNs..."
              defaultMode={SearchMode.Entity}
              defaultEntities={[SearchableEntity.Order, SearchableEntity.Grn]}
              onResultSelect={handleResultSelect}
              onSearch={handleSearch}
              className="max-w-2xl"
            />
          </div>

          {/* Recent Search Result */}
          {selectedResult && (
            <div className="mt-8 p-6 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Selected Result:</h3>
              <pre className="text-sm text-gray-400 overflow-auto">
                {JSON.stringify(selectedResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-8 p-6 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Search History:</h3>
              <div className="space-y-2">
                {searchHistory.slice(-5).reverse().map((item, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded">
                    <div className="text-sm text-gray-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
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