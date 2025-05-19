'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPalletHistoryAndStockInfo, ViewHistoryResult } from '../actions/viewHistoryActions';
import { QrScanner } from '@/components/qr-scanner/qr-scanner';
import { Button } from '@/components/ui/button';

// Debounce DELAY (ms)
const DEBOUNCE_DELAY = 1000;
const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export default function ViewHistoryPage() {
  const [seriesInput, setSeriesInput] = useState('');
  const [palletNumInput, setPalletNumInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ViewHistoryResult | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [activeInput, setActiveInput] = useState<'series' | 'palletNum' | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const triggerSearch = useCallback(async (queryType: 'series' | 'palletNum', queryValue: string) => {
    if (!queryValue.trim()) {
      setSearchResult(null);
      setSearchPerformed(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSearchPerformed(true);
    setSearchResult(null);
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
      setSearchResult(null);
      setSearchPerformed(false);
      setIsLoading(false);
    }
    return () => clearTimeout(timer);
  }, [seriesInput, palletNumInput, activeInput, triggerSearch]);

  const handleSeriesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSeriesInput(value);
    if (value.trim()) {
      setPalletNumInput('');
      setActiveInput('series');
    } else if (!palletNumInput.trim()) {
      setActiveInput(null);
      setSearchPerformed(false);
      setSearchResult(null);
    }
  };

  const handlePalletNumInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPalletNumInput(value);
    if (value.trim()) {
      setSeriesInput(''); 
      setActiveInput('palletNum');
    } else if (!seriesInput.trim()) {
      setActiveInput(null);
      setSearchPerformed(false);
      setSearchResult(null);
    }
  };

  const handleScanSuccess = (scannedSeries: string) => {
    setSeriesInput(scannedSeries);
    setPalletNumInput('');
    setActiveInput('series');
    setIsScannerOpen(false);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const seriesInputClassName = "w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition";

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-900 text-white">
      {isMobile && isScannerOpen && (
        <QrScanner
          open={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleScanSuccess}
          title="Scan Series QR Code"
          hint="Align QR code within the frame"
        />
      )}
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">View History</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2 flex flex-col">
            <label htmlFor={isMobile ? "seriesScanButton" : "seriesInput"} className="block text-sm font-medium">
              Series {isMobile ? "(via QR Scan)" : ""}
            </label>
            {isMobile ? (
              <Button 
                id="seriesScanButton"
                onClick={() => setIsScannerOpen(true)}
                className={`${seriesInputClassName} text-left h-[46px]`}
              >
                <span className={`truncate ${seriesInput ? 'text-white' : 'text-gray-400'}`}>
                  {seriesInput || "Tap to Scan Series QR Code"}
                </span>
              </Button>
            ) : (
              <input
                id="seriesInput"
                type="text"
                placeholder="Scan QR Code"
                value={seriesInput}
                onChange={handleSeriesInputChange}
                className={seriesInputClassName}
              />
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNum" className="block text-sm font-medium">Pallet Number</label>
            <input
              id="palletNum"
              type="text"
              placeholder="Enter Pallet Number"
              value={palletNumInput}
              onChange={handlePalletNumInputChange}
              className={seriesInputClassName} // Use the same class for consistency
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-10">
            <p className="text-xl text-orange-400">Loading history...</p>
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
                <div className="bg-gray-800 shadow-xl rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-orange-400">Pallet History</h2>
                  {searchResult.palletHistory.length > 0 ? (
                    <ul className="space-y-5">
                      {searchResult.palletHistory.map((event, index) => (
                        <li key={index} className="p-3 bg-gray-700 rounded-md shadow">
                          <p><strong>History Location : </strong> {event.loc || 'N/A'}</p>
                          <p><strong>Operation Time : </strong> {formatDate(event.time)}</p>
                          <p><strong>Operator : </strong> {event.id || 'N/A'}</p>
                          <p><strong>Remark : </strong> {event.remark || 'N/A'}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No History Found.</p>
                  )}
                </div>

                <div className="bg-gray-800 shadow-xl rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-orange-400">Stock Detail</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-medium mb-1 text-gray-300">Product Information</h3>
                      <p><strong>Code  :  </strong> {searchResult.palletInfo.productDetails?.code || 'N/A'}</p>
                      <p><strong>Description  :  </strong> {searchResult.palletInfo.productDetails?.description || 'N/A'}</p>
                      <p><strong>Colour  :  </strong> {searchResult.palletInfo.productDetails?.colour || 'N/A'}</p>
                      <p><strong>Standard Qty  :  </strong> {searchResult.palletInfo.productDetails?.standard_qty ?? 'N/A'}</p>
                      <p><strong>Type  :  </strong> {searchResult.palletInfo.productDetails?.type || 'N/A'}</p>
                      <p><strong>Pallet Generated Time : </strong> {formatDate(searchResult.palletInfo.generate_time)}</p>
                      <p><strong>Qty on Pallet : </strong> {searchResult.palletInfo.product_qty ?? 'N/A'}</p>
                      <p><strong>Pallet Remark : </strong> {searchResult.palletInfo.plt_remark || 'N/A'}</p>
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