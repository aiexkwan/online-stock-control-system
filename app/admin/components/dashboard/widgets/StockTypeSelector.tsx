'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TraditionalWidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// GraphQL imports removed - using REST API only
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockTypeSelectorProps extends TraditionalWidgetComponentProps {
}

// GraphQL queries removed - using REST API only

export const StockTypeSelector: React.FC<StockTypeSelectorProps> = ({ widget, isEditMode }) => {
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [filteredStockData, setFilteredStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { refreshTrigger } = useAdminRefresh();

  // REST API data fetching
  const fetchStockData = useCallback(async () => {
    if (isEditMode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dashboardAPI = createDashboardAPI();
      const result = await dashboardAPI.fetch(
        {
          widgetIds: ['stock_distribution', 'product_types'],
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            end: new Date().toISOString(),
          },
        },
        {
          strategy: 'client',
          cache: { ttl: 300 }, // 5-minute cache
        }
      );

      if (result.widgets && result.widgets.length > 0) {
        // Process stock distribution data
        const stockWidget = result.widgets.find(w => w.widgetId === 'stock_distribution');
        if (stockWidget && !stockWidget.data.error) {
          const stockItems = stockWidget.data.value || [];
          setStockData(stockItems.filter((item: Record<string, unknown>) => item.stock_level > 0));
        }

        // Process product types data
        const typesWidget = result.widgets.find(w => w.widgetId === 'product_types');
        if (typesWidget && !typesWidget.data.error) {
          const types = typesWidget.data.value || [];
          setProductTypes(types.length > 0 ? types : ['EasyLiner', 'EcoPlus', 'Slate', 'SupaStack', 'Manhole', 'ACO']);
        } else {
          // Use default types if API fails
          setProductTypes(['EasyLiner', 'EcoPlus', 'Slate', 'SupaStack', 'Manhole', 'ACO']);
        }
      }
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load stock data');
      // Use default types on error
      setProductTypes(['EasyLiner', 'EcoPlus', 'Slate', 'SupaStack', 'Manhole', 'ACO']);
    } finally {
      setLoading(false);
    }
  }, [isEditMode]);

  // Initial data load
  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // Refresh on trigger
  useEffect(() => {
    if (refreshTrigger) {
      fetchStockData();
    }
  }, [refreshTrigger, fetchStockData]);

  // Filter stock data based on selected type
  useEffect(() => {
    let filtered: StockData[];
    
    if (selectedType === 'all') {
      filtered = stockData;
    } else if (selectedType === 'non-material') {
      filtered = stockData.filter(item => 
        item.type && item.type.toLowerCase() !== 'material'
      );
    } else {
      filtered = stockData.filter(item => item.type === selectedType);
    }
    
    setFilteredStockData(filtered);

    // 通知圖表組件更新
    window.dispatchEvent(
      new CustomEvent('stockTypeChanged', {
        detail: { type: selectedType, data: filtered },
      })
    );
  }, [stockData, selectedType]);

  // 當選擇類型改變時
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchStockData(); // Refresh data
  };

  // Loading states
  const isLoading = loading && !productTypes.length;
  const isLoadingStock = loading;

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col p-6'>
      {/* Header with type selector */}
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='text-xl font-semibold text-white'>
          Stock Inventory
          <span className='ml-2 text-xs text-green-400'>⚡ REST API</span>
        </h3>
        <select
          value={selectedType}
          onChange={e => handleTypeChange(e.target.value)}
          className='w-[200px] rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none'
        >
          <option value='all'>All Types</option>
          <option value='non-material'>Non-Material</option>
          {productTypes.map((type: any) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Stock table */}
      <div className='flex-1 overflow-auto'>
        {isLoadingStock ? (
          <div className='flex h-32 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
          </div>
        ) : (
          <table className='w-full'>
            <thead className='sticky top-0 bg-slate-800/50 backdrop-blur-sm'>
              <tr className='border-b border-slate-700'>
                <th className='px-4 py-3 text-left text-xs font-medium uppercase text-gray-400'>
                  Product Code
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium uppercase text-gray-400'>
                  Description
                </th>
                <th className='px-4 py-3 text-center text-xs font-medium uppercase text-gray-400'>
                  Type
                </th>
                <th className='px-4 py-3 text-right text-xs font-medium uppercase text-gray-400'>
                  Current Inventory
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStockData.length === 0 ? (
                <tr>
                  <td colSpan={4} className='py-8 text-center text-gray-400'>
                    No stock data available {selectedType !== 'all' && `for type "${selectedType}"`}
                  </td>
                </tr>
              ) : (
                filteredStockData.map((item, index) => (
                  <tr
                    key={`${item.stock}-${index}`}
                    className='border-b border-slate-700/50 hover:bg-slate-700/30'
                  >
                    <td className='px-4 py-3 text-sm font-medium text-white'>{item.stock}</td>
                    <td className='px-4 py-3 text-sm text-gray-300'>{item.description}</td>
                    <td className='px-4 py-3 text-center text-sm text-gray-300'>{item.type}</td>
                    <td className='px-4 py-3 text-right text-sm font-medium text-white'>
                      {(item.stock_level || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!isLoadingStock && filteredStockData.length > 0 && (
        <div className='mt-4 flex justify-between border-t border-slate-700 pt-4 text-sm'>
          <span className='text-gray-400'>
            Showing {filteredStockData.length} products{' '}
            {selectedType !== 'all' && `of type "${selectedType}"`}
          </span>
          <span className='text-gray-300'>
            Total Stock:{' '}
            <span className='font-semibold text-white'>
              {filteredStockData.reduce((sum, item) => sum + (item.stock_level || 0), 0).toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default StockTypeSelector;
