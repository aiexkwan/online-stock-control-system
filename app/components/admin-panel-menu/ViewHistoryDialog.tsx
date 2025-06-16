'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ClockIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CubeIcon,
  CalendarIcon,
  HashtagIcon,
  DocumentTextIcon,
  MapPinIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { getPalletHistoryAndStockInfo, ViewHistoryResult } from '../../actions/viewHistoryActions';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

interface ViewHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewHistoryDialog({ isOpen, onClose }: ViewHistoryDialogProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<ViewHistoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 重置狀態
  const resetState = useCallback(() => {
    setSearchValue('');
    setSearchResult(null);
    setStatusMessage(null);
    setIsLoading(false);
  }, []);

  // 關閉 dialog
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // 搜尋處理
  const handleSearch = useCallback(async (result: any) => {
    if (result.data.type === 'pallet') {
      const searchValue = result.data.value;
      const detectedSearchType = result.data.searchType;
      
      if (!searchValue.trim()) {
        setStatusMessage({
          type: 'error',
          message: 'Please enter a pallet number or series'
        });
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);
      
      // Map detected type to ViewHistory search type
      let searchType: 'series' | 'palletNum';
      
      if (detectedSearchType === 'series') {
        searchType = 'series';
      } else if (detectedSearchType === 'pallet_num') {
        searchType = 'palletNum';
      } else {
        // Fallback detection
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
      }
      
      try {
        const result = await getPalletHistoryAndStockInfo({ type: searchType, value: searchValue.trim() });
        setSearchResult(result);
        
        if (result.error) {
          setStatusMessage({
            type: 'error',
            message: result.error
          });
        } else if (!result.palletInfo) {
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

  // 新搜尋
  const handleNewSearch = useCallback(() => {
    setSearchResult(null);
    setStatusMessage(null);
  }, []);

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
        onClick={handleClose}
        style={{ zIndex: 60 }}
      />
      
      {/* Dialog */}
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ zIndex: 70 }}
      >
        <div className={`${dialogStyles.content} max-w-6xl w-full overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className={dialogStyles.title}>
                  View History
                </h2>
                <p className="text-sm text-slate-400">Search pallet history and stock information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-900/50 via-blue-900/20 to-slate-800/50">
            {/* Search Section */}
            {!searchResult && (
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                      Pallet Search
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="search" className="text-slate-200 font-medium">
                          Pallet Number / Series
                        </Label>
                        <div className="mt-2">
                          <UnifiedSearch
                            searchType="pallet"
                            placeholder="Enter pallet number"
                            onSelect={handleSearch}
                            value={searchValue}
                            onChange={setSearchValue}
                            isLoading={isLoading}
                            disabled={isLoading}
                            enableAutoDetection={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* New Search Button */}
            {searchResult && (
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                  Search Results
                </h3>
                <Button
                  onClick={handleNewSearch}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400/70 bg-slate-800/50 backdrop-blur-sm"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  New Search
                </Button>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-4 rounded-xl mb-6 backdrop-blur-sm border ${
                statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                statusMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-blue-500/10 border-blue-500/30'
              }`}>
                <p className={`text-sm ${
                  statusMessage.type === 'success' ? 'text-green-400' :
                  statusMessage.type === 'error' ? 'text-red-400' :
                  statusMessage.type === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {statusMessage.message}
                </p>
              </div>
            )}

            {/* Results */}
            {searchResult && searchResult.palletInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Pallet Info */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <CubeIcon className="h-5 w-5 text-blue-400 mr-2" />
                        <h4 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                          Pallet Information
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <InfoRow 
                          icon={<HashtagIcon className="w-4 h-4" />}
                          label="Pallet Number" 
                          value={searchResult.palletInfo.palletNum || searchResult.palletInfo.plt_num} 
                        />
                        <InfoRow 
                          icon={<CubeIcon className="w-4 h-4" />}
                          label="Product Code" 
                          value={searchResult.palletInfo.productCode || searchResult.palletInfo.product_code} 
                        />
                        <InfoRow 
                          icon={<DocumentTextIcon className="w-4 h-4" />}
                          label="Quantity" 
                          value={searchResult.palletInfo.product_qty} 
                        />
                        <InfoRow 
                          icon={<CalendarIcon className="w-4 h-4" />}
                          label="Generated Time" 
                          value={formatDate(searchResult.palletInfo.generate_time)} 
                        />
                        {searchResult.palletInfo.plt_remark && (
                          <InfoRow 
                            icon={<DocumentTextIcon className="w-4 h-4" />}
                            label="Remarks" 
                            value={searchResult.palletInfo.plt_remark} 
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      {searchResult.palletInfo.productDetails && (
                        <div className="mt-6 pt-4 border-t border-slate-600/50">
                          <h5 className="text-sm font-medium text-blue-400 mb-3">Product Details</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Description:</span>
                              <span className="text-slate-200">{searchResult.palletInfo.productDetails.description || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Colour:</span>
                              <span className="text-slate-200">{searchResult.palletInfo.productDetails.colour || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Standard Qty:</span>
                              <span className="text-slate-200">{searchResult.palletInfo.productDetails.standard_qty || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Type:</span>
                              <span className="text-slate-200">{searchResult.palletInfo.productDetails.type || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* History Timeline */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <ClockIcon className="h-5 w-5 text-green-400 mr-2" />
                        <h4 className="text-lg font-medium bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                          Operation History
                        </h4>
                      </div>
                      {searchResult.palletHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <ClockIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No history records found</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {[...searchResult.palletHistory].sort((a, b) => {
                            if (!a.time || !b.time) return 0;
                            return new Date(a.time).getTime() - new Date(b.time).getTime();
                          }).map((event, index) => (
                            <div key={index} className="relative">
                              {index < searchResult.palletHistory.length - 1 && (
                                <div className="absolute left-2 top-8 w-0.5 h-full bg-slate-600/50" />
                              )}
                              
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full mt-2 relative z-10" />
                                
                                <div className="flex-1 bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="font-medium text-green-400">
                                      {event.action || 'Unknown Action'}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center">
                                      <ClockIcon className="w-3 h-3 mr-1" />
                                      {formatDate(event.time)}
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm text-slate-300 space-y-2">
                                    <div className="flex items-center">
                                      <MapPinIcon className="w-3 h-3 mr-2 text-slate-400" />
                                      <span><strong>Location:</strong> {event.loc || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <UserIcon className="w-3 h-3 mr-2 text-slate-400" />
                                      <span><strong>Operator:</strong> {event.id || 'N/A'}</span>
                                    </div>
                                    {event.remark && (
                                      <div className="flex items-start">
                                        <DocumentTextIcon className="w-3 h-3 mr-2 mt-0.5 text-slate-400" />
                                        <span><strong>Remark:</strong> {event.remark}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <CubeIcon className="h-5 w-5 text-orange-400 mr-2" />
                        <h4 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                          Stock Information
                        </h4>
                      </div>
                      {!searchResult.stockInfo ? (
                        <div className="text-center py-8">
                          <CubeIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No stock information available</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Total Stock */}
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-200 flex items-center">
                                <ChartBarIcon className="w-4 h-4 mr-2" />
                                Total Stock:
                              </span>
                              <span className="text-xl font-bold text-orange-400">
                                {[
                                  searchResult.stockInfo.injection,
                                  searchResult.stockInfo.pipeline,
                                  searchResult.stockInfo.prebook,
                                  searchResult.stockInfo.await,
                                  searchResult.stockInfo.fold,
                                  searchResult.stockInfo.bulk,
                                  searchResult.stockInfo.backcarpark
                                ].reduce((sum, val) => (sum || 0) + (val || 0), 0)}
                              </span>
                            </div>
                          </div>

                          {/* Stock Distribution */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-orange-400 mb-3">Stock Distribution</h5>
                            {[
                              { label: 'Injection', value: searchResult.stockInfo.injection, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                              { label: 'Pipeline', value: searchResult.stockInfo.pipeline, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
                              { label: 'Pre-Booking', value: searchResult.stockInfo.prebook, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
                              { label: 'Awaiting', value: searchResult.stockInfo.await, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                              { label: 'Fold Mill', value: searchResult.stockInfo.fold, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
                              { label: 'Bulk Room', value: searchResult.stockInfo.bulk, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
                              { label: 'Back Car Park', value: searchResult.stockInfo.backcarpark, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
                            ].map((location, index) => (
                              <div key={index} className={`flex justify-between items-center py-2 px-3 ${location.bg} border ${location.border} rounded-lg`}>
                                <span className="text-slate-300 font-medium">{location.label}:</span>
                                <span className={`font-bold ${location.color}`}>
                                  {location.value || '--'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Last Update */}
                          {searchResult.stockInfo.latest_update && (
                            <div className="pt-3 border-t border-slate-600/50">
                              <div className="flex items-center text-xs text-slate-400">
                                <CalendarIcon className="w-3 h-3 mr-2" />
                                <span>Last updated: {formatDate(searchResult.stockInfo.latest_update)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !searchResult && !statusMessage && (
              <div className="text-center py-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 shadow-xl shadow-blue-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-100 rounded-2xl"></div>
                    <div className="relative z-10">
                      <CubeIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-xl text-slate-300 mb-2">Ready to Search</p>
                      <p className="text-slate-400">Please enter pallet number or series</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-slate-600/50 bg-slate-800/50">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value: any;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start space-x-3">
      {icon && (
        <div className="flex-shrink-0 text-slate-400 mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <span className="font-medium text-slate-300 block">
          {label}:
        </span>
        <span className="text-slate-200 block mt-1">
          {value || 'N/A'}
        </span>
      </div>
    </div>
  );
} 