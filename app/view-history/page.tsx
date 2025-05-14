'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPalletHistoryAndStockInfo, ViewHistoryResult } from '../actions/viewHistoryActions';

// Debounce GĀA (ms)
const DEBOUNCE_DELAY = 1000;

export default function ViewHistoryPage() {
  const [seriesInput, setSeriesInput] = useState('');
  const [palletNumInput, setPalletNumInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ViewHistoryResult | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [activeInput, setActiveInput] = useState<'series' | 'palletNum' | null>(null);

  const triggerSearch = useCallback(async (queryType: 'series' | 'palletNum', queryValue: string) => {
    if (!queryValue.trim()) {
      setSearchResult(null);
      setSearchPerformed(false); // Reset if query is empty
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSearchPerformed(true);
    setSearchResult(null); // Clear previous results before new search

    try {
      const result = await getPalletHistoryAndStockInfo({ type: queryType, value: queryValue });
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({
        palletInfo: null,
        palletHistory: [],
        stockInfo: null,
        error: 'An unexpected error occurred during the search.',
        queryType,
        queryValue,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeInput === 'series' && seriesInput.trim()) {
      timer = setTimeout(() => {
        triggerSearch('series', seriesInput);
      }, DEBOUNCE_DELAY);
    } else if (activeInput === 'palletNum' && palletNumInput.trim()) {
      timer = setTimeout(() => {
        triggerSearch('palletNum', palletNumInput);
      }, DEBOUNCE_DELAY);
    } else if (!seriesInput.trim() && !palletNumInput.trim()) {
      // Clear results if both inputs are empty
      setSearchResult(null);
      setSearchPerformed(false);
      setIsLoading(false); // Ensure loading is also reset
    }
    return () => clearTimeout(timer);
  }, [seriesInput, palletNumInput, activeInput, triggerSearch]);

  const handleSeriesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSeriesInput(value);
    if (value.trim()) {
      setPalletNumInput(''); // Clear other input
      setActiveInput('series');
    } else if (!palletNumInput.trim()) {
      setActiveInput(null);
      setSearchPerformed(false); // Reset if this input is cleared and other is also empty
      setSearchResult(null);
    }
  };

  const handlePalletNumInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPalletNumInput(value);
    if (value.trim()) {
      setSeriesInput(''); // Clear other input
      setActiveInput('palletNum');
    } else if (!seriesInput.trim()) {
      setActiveInput(null);
      setSearchPerformed(false); // Reset if this input is cleared and other is also empty
      setSearchResult(null);
    }
  };
  
  // Helper function to format date (basic example)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">View History</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="series" className="block text-sm font-medium">Series</label>
            <input
              id="series"
              type="text"
              placeholder="Scan QR Code or Enter Series"
              value={seriesInput}
              onChange={handleSeriesInputChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNum" className="block text-sm font-medium">Pallet Number</label>
            <input
              id="palletNum"
              type="text"
              placeholder="Enter Pallet Number"
              value={palletNumInput}
              onChange={handlePalletNumInputChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-10">
            <p className="text-xl text-orange-400">Loading history...</p>
            {/* You can add a spinner icon here */}
          </div>
        )}

        {!isLoading && searchPerformed && (
          <div className="mt-8 w-full">
            {searchResult?.error && (
              <div className="bg-red-800 border border-red-600 text-white p-4 rounded-md mb-6">
                <h3 className="font-bold text-lg">Search Error</h3>
                <p>{searchResult.error}</p>
              </div>
            )}

            {!searchResult?.error && !searchResult?.palletInfo && (
              <div className="text-center py-10 bg-gray-800 shadow-xl rounded-lg p-6">
                <p className="text-xl text-gray-400">
                  No records found for {searchResult?.queryType === 'series' ? 'Series' : 'Pallet Number'}: 
                  <strong>{searchResult?.queryValue || 'the entered criteria'}</strong>.
                </p>
              </div>
            )}
            
            {searchResult?.palletInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Pallet History */}
                <div className="bg-gray-800 shadow-xl rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-orange-400">Pallet History</h2>
                  {searchResult.palletHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {searchResult.palletHistory.map((event, index) => (
                        <li key={index} className="p-3 bg-gray-700 rounded-md shadow">
                          <p><strong>History Location : </strong> {event.loc || 'N/A'}</p>
                          <p><strong>Action : </strong> {event.action || 'N/A'}</p>
                          <p><strong>Operation Time : </strong> {formatDate(event.time)}</p>
                          <p><strong>Operator : </strong> {event.id || 'N/A'}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No History Found.</p>
                  )}
                </div>

                {/* Right Card: Stock & Pallet Info */}
                <div className="bg-gray-800 shadow-xl rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-orange-400">Stock Detail</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-medium mb-1 text-gray-300">Product Information</h3>
                      <p><strong>Code  :  </strong> {searchResult.palletInfo.productDetails?.code || 'N/A'}</p>
                      <p><strong>Description  :  </strong> {searchResult.palletInfo.productDetails?.description || 'N/A'}</p>
                      <p><strong>Colour  :  </strong> {searchResult.palletInfo.productDetails?.colour || 'N/A'}</p>
                      <p><strong>Standard Qty  :  </strong> {searchResult.palletInfo.productDetails?.standard_qty ?? 'N/A'}</p>
                      <p><strong>Product Type  :  </strong> {searchResult.palletInfo.productDetails?.type || 'N/A'}</p>
                    </div>
                    {searchResult.stockInfo && (
                      <div>
                        <h3 className="text-xl font-medium mt-4 mb-1 text-gray-300">Stock Location</h3>
                        <p><strong>Injection  :  </strong> {searchResult.stockInfo.injection || '--'}</p>
                        <p><strong>Pipeline  :  </strong> {searchResult.stockInfo.pipeline || '--'}</p>
                        <p><strong>Pre-Booking  :  </strong> {searchResult.stockInfo.prebook || '--'}</p>
                        <p><strong>Awaiting  :  </strong> {searchResult.stockInfo.await || '--'}</p>
                        <p><strong>Fold Mill  :  </strong> {searchResult.stockInfo.fold || '--'}</p>
                        <p><strong>Bulk Room  :  </strong> {searchResult.stockInfo.bulk || '--'}</p>
                        <p><strong>Back Car Park  :  </strong> {searchResult.stockInfo.backcarpark || '--'}</p>
                      </div>
                    )}
                    {!searchResult.stockInfo && (
                         <p className="text-gray-400 mt-4">No associated stock information found for product code: {searchResult.palletInfo.productCode || 'N/A'}.</p>
                    )
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !searchPerformed && (
           <div className="text-center py-10 bg-gray-800 shadow-xl rounded-lg p-6">
             <p className="text-xl text-gray-400">Scan QR Code or Type In Pallet Number To Start.</p>
           </div>
        )}
      </div>
    </div>
  );
} 