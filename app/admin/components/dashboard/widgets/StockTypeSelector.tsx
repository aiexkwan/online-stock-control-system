'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
// 暫時唔用 shadcn/ui 嘅 Select 組件，因為有 hydration 問題
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useGraphQL?: boolean;
}

// GraphQL query for stock types and latest stock levels
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

// GraphQL query for latest stock levels with type filter
const GET_LATEST_STOCK_LEVELS = gql`
  query GetLatestStockLevels($type: String) {
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

export const StockTypeSelector: React.FC<StockTypeSelectorProps> = ({ widget, isEditMode, useGraphQL }) => {
  // 決定是否使用 GraphQL - 可以通過 widget config 或 props 控制
  const shouldUseGraphQL = useGraphQL ?? (widget as any)?.useGraphQL ?? false;
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // GraphQL queries
  const {
    data: typesData,
    loading: typesLoading,
    error: typesError,
  } = useGraphQLQuery(
    print(GET_STOCK_TYPES),
    {},
    {
      enabled: shouldUseGraphQL && !isEditMode,
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
    { type: selectedType === 'all' ? null : selectedType },
    {
      enabled: shouldUseGraphQL && !isEditMode,
      cacheTime: 300000, // 5分鐘快取
      refetchInterval: 300000, // 5分鐘自動刷新
    }
  );

  // 獲取所有產品類型
  // 前置聲明 fetchTypesFromStockData
  const fetchTypesFromStockData = useCallback(async () => {
    try {
      // 獲取所有唯一嘅產品代碼（唔限制日期）
      const { data: stockData, error: stockError } = await supabase
        .from('stock_level')
        .select('stock')
        .gt('stock_level', 0);

      if (stockError) throw stockError;

      if (!stockData || stockData.length === 0) return;

      // 獲取唯一產品代碼
      const uniqueProductCodes = [...new Set(stockData.map(item => item.stock))];
      console.log('[StockTypeSelector] Unique product codes found:', uniqueProductCodes.length);

      // 查詢產品詳情
      const { data: productData, error: productError } = await supabase
        .from('data_code')
        .select('type')
        .in('code', uniqueProductCodes)
        .not('type', 'is', null)
        .neq('type', '')
        .neq('type', '-');

      if (productError) throw productError;

      const uniqueTypes = [...new Set(productData?.map(item => item.type) || [])].filter(Boolean);
      console.log('[StockTypeSelector] Types from all stock data:', uniqueTypes);

      if (uniqueTypes.length > 0) {
        setProductTypes(uniqueTypes as string[]);
      } else {
        // 使用預設值
        const defaultTypes = ['EasyLiner', 'EcoPlus', 'Slate', 'SupaStack', 'Manhole', 'ACO'];
        setProductTypes(defaultTypes);
      }
    } catch (error) {
      console.error('Error fetching types from stock data:', error);
    }
  }, [supabase]);

  const fetchProductTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('data_code')
        .select('type')
        .not('type', 'is', null)
        .neq('type', '') // 過濾空字串
        .order('type');

      if (error) throw error;

      // 獲取唯一值，但排除 "-" 同空值
      const allTypes = data?.map(item => item.type) || [];
      const uniqueTypes = [...new Set(allTypes)].filter(
        type => type && type !== '-' && type !== ''
      );

      console.log('[StockTypeSelector] Product types raw data:', data?.length, 'items');
      console.log('[StockTypeSelector] All types (first 10):', allTypes.slice(0, 10));
      console.log('[StockTypeSelector] Unique types found:', uniqueTypes);

      // 如果冇有效嘅 type，嘗試從現有庫存數據獲取
      if (uniqueTypes.length === 0) {
        console.log(
          '[StockTypeSelector] No valid types found in data_code, fetching from stock data'
        );
        // 從實際庫存數據獲取類型
        await fetchTypesFromStockData();
      } else {
        setProductTypes(uniqueTypes as string[]);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to load product types');
    }
  }, [supabase, fetchTypesFromStockData]);

  // 獲取庫存數據
  const fetchStockData = useCallback(
    async (type: string) => {
      setLoadingStock(true);
      try {
        // 先獲取每個產品的最新更新時間
        const { data: latestDates, error: dateError } = await supabase
          .from('stock_level')
          .select('stock, update_time')
          .order('update_time', { ascending: false });

        if (dateError) throw dateError;

        if (!latestDates || latestDates.length === 0) {
          console.log('[StockTypeSelector] No stock data found');
          setStockData([]);
          return;
        }

        // 為每個產品找出最新日期
        const latestByProduct = new Map<string, string>();
        latestDates.forEach(item => {
          if (!latestByProduct.has(item.stock)) {
            latestByProduct.set(item.stock, item.update_time);
          }
        });

        console.log('[StockTypeSelector] Products with latest dates:', latestByProduct.size);

        // 構建查詢條件
        const conditions = Array.from(latestByProduct.entries()).map(([stock, date]) => ({
          stock,
          update_time: date,
        }));

        // 批量查詢每個產品的最新庫存
        const stockPromises = conditions.map(async condition => {
          const { data, error } = await supabase
            .from('stock_level')
            .select('stock, stock_level, update_time')
            .eq('stock', condition.stock)
            .eq('update_time', condition.update_time)
            .single();

          if (error) {
            console.error(`Error fetching stock for ${condition.stock}:`, error);
            return null;
          }
          return data;
        });

        const stockResults = await Promise.all(stockPromises);
        const stockData = stockResults.filter(item => item !== null && item.stock_level > 0);

        console.log(
          '[StockTypeSelector] Latest stock data for all products:',
          stockData.length,
          'items'
        );

        if (!stockData || stockData.length === 0) {
          setStockData([]);
          return;
        }

        // 獲取產品代碼列表
        const productCodes = stockData.map(item => item?.stock).filter(Boolean);

        // 查詢所有產品詳情（不在查詢階段過濾）
        const { data: productData, error: productError } = await supabase
          .from('data_code')
          .select('code, description, type')
          .in('code', productCodes);

        if (productError) throw productError;

        // 創建產品映射
        const productMap = new Map();
        (productData || []).forEach(product => {
          productMap.set(product.code, product);
        });

        // 合併數據
        let formattedData: StockData[];

        if (type === 'all') {
          // 如果選擇 all，顯示所有庫存數據，包括沒有在 data_code 表的產品
          formattedData = stockData.map(item => {
            if (!item) return null;
            const product = productMap.get(item.stock);
            return {
              stock: item.stock,
              stock_level: item.stock_level,
              description: product?.description || '-',
              type: product?.type || '-',
            };
          }).filter(Boolean) as StockData[];
        } else if (type === 'non-material') {
          // 如果選擇 non-material，顯示所有非 material 類型的產品
          formattedData = stockData
            .filter(item => {
              if (!item) return false;
              const product = productMap.get(item.stock);
              // 如果有產品資訊，檢查是否為 material
              if (product && product.type) {
                const productType = product.type.toLowerCase();
                return productType !== 'material';
              }
              // 如果沒有產品資訊，包含它（假設不是 material）
              return true;
            })
            .map(item => {
              if (!item) return null;
              const product = productMap.get(item.stock);
              return {
                stock: item.stock,
                stock_level: item.stock_level,
                description: product?.description || '-',
                type: product?.type || '-',
              };
            }).filter(Boolean) as StockData[];
        } else {
          // 如果選擇特定類型，只顯示匹配的產品
          formattedData = stockData
            .filter(item => {
              if (!item) return false;
              const product = productMap.get(item.stock);
              // 只顯示有該類型的產品
              return product && product.type === type;
            })
            .map(item => {
              if (!item) return null;
              const product = productMap.get(item.stock);
              return {
                stock: item.stock,
                stock_level: item.stock_level,
                description: product?.description || '-',
                type: product?.type || '-',
              };
            }).filter(Boolean) as StockData[];
        }

        console.log('[StockTypeSelector] Stock data loaded:', formattedData.length, 'items');
        setStockData(formattedData);

        // 通知圖表組件更新
        window.dispatchEvent(
          new CustomEvent('stockTypeChanged', {
            detail: { type, data: formattedData },
          })
        );
      } catch (error) {
        console.error('Error fetching stock data:', error);
        toast.error('Failed to load stock data');
      } finally {
        setLoadingStock(false);
      }
    },
    [supabase]
  );

  // Process GraphQL types data
  useEffect(() => {
    if (shouldUseGraphQL && typesData?.data_codeCollection) {
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
  }, [shouldUseGraphQL, typesData]);

  // Process GraphQL stock levels data
  useEffect(() => {
    if (shouldUseGraphQL && stockLevelsData?.stock_levelCollection) {
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

      // Convert to array and filter based on selected type
      let formattedData = Array.from(latestByProduct.values())
        .filter(item => item.stock_level > 0);

      if (selectedType !== 'all') {
        if (selectedType === 'non-material') {
          formattedData = formattedData.filter(item => 
            item.type && item.type.toLowerCase() !== 'material'
          );
        } else {
          formattedData = formattedData.filter(item => 
            item.type === selectedType
          );
        }
      }

      setStockData(formattedData);
      setLoadingStock(false);

      // 通知圖表組件更新
      window.dispatchEvent(
        new CustomEvent('stockTypeChanged', {
          detail: { type: selectedType, data: formattedData },
        })
      );
    }
  }, [shouldUseGraphQL, stockLevelsData, selectedType]);

  // 初始化
  useEffect(() => {
    if (shouldUseGraphQL) {
      setLoading(typesLoading);
      setLoadingStock(stockLevelsLoading);
    } else {
      const init = async () => {
        setLoading(true);
        await fetchProductTypes();
        await fetchStockData('all');
        setLoading(false);
      };
      init();
    }
  }, [shouldUseGraphQL, typesLoading, stockLevelsLoading, fetchProductTypes, fetchStockData, refreshTrigger]);

  // 當選擇類型改變時
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (shouldUseGraphQL) {
      setLoadingStock(true);
      refetchStockLevels();
    } else {
      fetchStockData(type);
    }
  };

  // Unified loading state
  const isLoading = shouldUseGraphQL ? (typesLoading && !productTypes.length) : loading;
  const isLoadingStock = shouldUseGraphQL ? stockLevelsLoading : loadingStock;

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
          {shouldUseGraphQL && (
            <span className='ml-2 text-xs text-blue-400'>⚡ GraphQL</span>
          )}
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
              {stockData.length === 0 ? (
                <tr>
                  <td colSpan={4} className='py-8 text-center text-gray-400'>
                    No stock data available {selectedType !== 'all' && `for type "${selectedType}"`}
                  </td>
                </tr>
              ) : (
                stockData.map((item, index) => {
                  const isLowStock = item.stock_level < 100;
                  return (
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
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!isLoadingStock && stockData.length > 0 && (
        <div className='mt-4 flex justify-between border-t border-slate-700 pt-4 text-sm'>
          <span className='text-gray-400'>
            Showing {stockData.length} products{' '}
            {selectedType !== 'all' && `of type "${selectedType}"`}
          </span>
          <span className='text-gray-300'>
            Total Stock:{' '}
            <span className='font-semibold text-white'>
              {stockData.reduce((sum, item) => sum + (item.stock_level || 0), 0).toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default StockTypeSelector;
