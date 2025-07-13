'use client';

import React, { useState, useEffect } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from 'graphql-tag';
import { print } from 'graphql';

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockTypeSelectorProps extends WidgetComponentProps {
}

// GraphQL query for stock types
const GET_STOCK_TYPES = gql`
  query GetStockTypes {
    data_codeCollection(
      filter: {
        type: { neq: "-" }
      }
      orderBy: [{ type: AscNullsLast }]
    ) {
      edges {
        node {
          type
        }
      }
    }
  }
`;

// GraphQL query for latest stock levels
const GET_LATEST_STOCK_LEVELS = gql`
  query GetLatestStockLevels {
    stock_levelCollection(
      orderBy: [{ stock: AscNullsLast }, { update_time: DescNullsLast }]
    ) {
      edges {
        node {
          stock
          stock_level
          update_time
          data_code {
            description
            type
          }
        }
      }
    }
  }
`;

export const StockTypeSelector: React.FC<StockTypeSelectorProps> = ({ widget, isEditMode }) => {
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [filteredStockData, setFilteredStockData] = useState<StockData[]>([]);
  const { refreshTrigger } = useAdminRefresh();

  // GraphQL queries
  const {
    data: typesData,
    loading: typesLoading,
    error: typesError,
  } = useGraphQLQuery(
    print(GET_STOCK_TYPES),
    {},
    {
      enabled: !isEditMode,
      cacheTime: 600000, // 10分鐘快取 - types 很少變化
    }
  );

  const {
    data: stockLevelsData,
    loading: stockLevelsLoading,
    error: stockLevelsError,
    refetch: refetchStockLevels,
  } = useGraphQLQuery(
    print(GET_LATEST_STOCK_LEVELS),
    {},
    {
      enabled: !isEditMode,
      cacheTime: 300000, // 5分鐘快取
      refetchInterval: 300000, // 5分鐘自動刷新
    }
  );

  // Process GraphQL types data
  useEffect(() => {
    if (typesData?.data_codeCollection) {
      const edges = typesData.data_codeCollection.edges || [];
      const types = edges
        .map((edge: any) => edge.node.type)
        .filter((type: string) => type && type !== '-' && type !== '');
      const uniqueTypes = [...new Set(types)];
      
      if (uniqueTypes.length > 0) {
        setProductTypes(uniqueTypes as string[]);
      } else {
        // 使用預設值
        const defaultTypes = ['EasyLiner', 'EcoPlus', 'Slate', 'SupaStack', 'Manhole', 'ACO'];
        setProductTypes(defaultTypes);
      }
    }
  }, [typesData]);

  // Process GraphQL stock levels data
  useEffect(() => {
    if (stockLevelsData?.stock_levelCollection) {
      const edges = stockLevelsData.stock_levelCollection.edges || [];
      
      // Group by product to get latest stock level
      const latestByProduct = new Map<string, any>();
      edges.forEach((edge: any) => {
        const { stock, stock_level, update_time, data_code } = edge.node;
        if (!latestByProduct.has(stock) || latestByProduct.get(stock).update_time < update_time) {
          latestByProduct.set(stock, {
            stock,
            stock_level,
            update_time,
            description: data_code?.description || '-',
            type: data_code?.type || '-',
          });
        }
      });

      // Convert to array and filter stock level > 0
      const allStockData = Array.from(latestByProduct.values())
        .filter(item => item.stock_level > 0);
      
      setStockData(allStockData);
    }
  }, [stockLevelsData]);

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
    refetchStockLevels();
  };

  // Unified loading state
  const isLoading = typesLoading && !productTypes.length;
  const isLoadingStock = stockLevelsLoading;

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
          <span className='ml-2 text-xs text-blue-400'>⚡ GraphQL</span>
        </h3>
        <select
          value={selectedType}
          onChange={e => handleTypeChange(e.target.value)}
          className='w-[200px] rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none'
        >
          <option value='all'>All Types</option>
          <option value='non-material'>Non-Material</option>
          {productTypes.map(type => (
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
