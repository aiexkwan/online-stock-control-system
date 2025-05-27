'use client';

import React, { useState, useCallback } from 'react';
import { StockMovementLayout, StatusMessage } from '../../../components/ui/stock-movement-layout';
import { UnifiedSearch } from '../../../components/ui/unified-search';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Package, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { getPalletHistoryAndStockInfo, ViewHistoryResult } from '../../actions/viewHistoryActions';
import PalletInfoCard from './PalletInfoCard';
import HistoryTimeline from './HistoryTimeline';
import StockInfoCard from './StockInfoCard';

export default function ViewHistoryForm() {
  // 狀態管理
  const [searchResult, setSearchResult] = useState<ViewHistoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 搜尋處理
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      setIsLoading(true);
      setStatusMessage(null);
      
      const searchValue = result.data.value;
      let searchType: 'series' | 'palletNum';
      
      // 判斷搜尋類型
      if (searchValue.includes('/')) {
        searchType = 'palletNum';
      } else if (searchValue.includes('-')) {
        searchType = 'series';
      } else {
        setStatusMessage({
          type: 'error',
          message: 'Please enter complete pallet number (e.g., 250525/13) or series number (e.g., 260525-5UNXGE)'
        });
        setIsLoading(false);
        return;
      }
      
      try {
        const searchResult = await getPalletHistoryAndStockInfo({ type: searchType, value: searchValue });
        setSearchResult(searchResult);
        
        if (searchResult.error) {
          setStatusMessage({
            type: 'error',
            message: searchResult.error
          });
        } else if (!searchResult.palletInfo) {
          setStatusMessage({
            type: 'warning',
            message: `No records found for ${searchType === 'series' ? 'Series' : 'Pallet Number'}: ${searchValue}`
          });
        } else {
          setStatusMessage({
            type: 'success',
            message: `Found records for ${searchType === 'series' ? 'Series' : 'Pallet Number'}: ${searchValue}`
          });
        }
      } catch (error) {
        setStatusMessage({
          type: 'error',
          message: 'An unexpected error occurred during the search.'
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // 重置搜尋
  const handleReset = useCallback(() => {
    setSearchResult(null);
    setSearchValue('');
    setStatusMessage(null);
  }, []);

  return (
    <StockMovementLayout
      title="View History"
      description="Search pallet history and stock information"
      isLoading={isLoading}
      loadingText="Searching records..."
    >
      <div className="space-y-6">
        {/* 搜尋區域 - 只在沒有搜尋結果時顯示 */}
        {!searchResult && (
          <Card className="border-gray-600 bg-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400">Pallet Search</CardTitle>
            </CardHeader>
            <CardContent>
              <UnifiedSearch
                searchType="pallet"
                placeholder="Scan QR code or enter pallet number/series"
                onSelect={handleSearchSelect}
                value={searchValue}
                onChange={setSearchValue}
                isLoading={isLoading}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* 重新搜尋按鈕 - 只在有搜尋結果時顯示 */}
        {searchResult && (
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Search Results</h2>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Search
            </Button>
          </div>
        )}

        {/* 狀態消息 */}
        {statusMessage && (
          <StatusMessage
            type={statusMessage.type}
            message={statusMessage.message}
            onDismiss={() => setStatusMessage(null)}
          />
        )}

        {/* 結果展示 - 響應式佈局 */}
        {searchResult && searchResult.palletInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 托盤信息 */}
            <div className="lg:col-span-1">
              <PalletInfoCard palletInfo={searchResult.palletInfo} />
            </div>
            
            {/* 歷史記錄 */}
            <div className="lg:col-span-1 xl:col-span-1">
              <HistoryTimeline history={searchResult.palletHistory} />
            </div>
            
            {/* 庫存信息 */}
            <div className="lg:col-span-2 xl:col-span-1">
              <StockInfoCard stockInfo={searchResult.stockInfo} />
            </div>
          </div>
        )}

        {/* 空狀態 */}
        {!isLoading && !searchResult && (
          <Card className="border-gray-600 bg-gray-800 text-white">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-2">Ready to Search</p>
              <p className="text-gray-500">Scan QR code or enter pallet number/series to start</p>
            </CardContent>
          </Card>
        )}
      </div>
    </StockMovementLayout>
  );
} 