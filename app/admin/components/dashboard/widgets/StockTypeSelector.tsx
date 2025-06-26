'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
// 暫時唔用 shadcn/ui 嘅 Select 組件，因為有 hydration 問題
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockTypeSelectorProps extends WidgetComponentProps {}

export const StockTypeSelector: React.FC<StockTypeSelectorProps> = ({ widget, isEditMode }) => {
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 獲取所有產品類型
  // 前置聲明 fetchTypesFromStockData
  const fetchTypesFromStockData = useCallback(async () => {
    try {
      // 獲取有庫存嘅產品
      const { data: stockData, error: stockError } = await supabase
        .from('stock_level')
        .select('stock')
        .gt('stock_level', 0)
        .limit(100);

      if (stockError) throw stockError;

      if (!stockData || stockData.length === 0) return;

      // 獲取產品代碼
      const productCodes = stockData.map(item => item.stock);
      
      // 查詢產品詳情
      const { data: productData, error: productError } = await supabase
        .from('data_code')
        .select('type')
        .in('code', productCodes)
        .not('type', 'is', null)
        .neq('type', '')
        .neq('type', '-');
      
      if (productError) throw productError;
      
      const uniqueTypes = [...new Set(productData?.map(item => item.type) || [])].filter(Boolean);
      console.log('[StockTypeSelector] Types from stock data:', uniqueTypes);
      
      if (uniqueTypes.length > 0) {
        setProductTypes(uniqueTypes);
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
        .neq('type', '')  // 過濾空字串
        .order('type');

      if (error) throw error;

      // 獲取唯一值，但排除 "-" 同空值
      const allTypes = data?.map(item => item.type) || [];
      const uniqueTypes = [...new Set(allTypes)]
        .filter(type => type && type !== '-' && type !== '');
      
      console.log('[StockTypeSelector] Product types raw data:', data?.length, 'items');
      console.log('[StockTypeSelector] All types (first 10):', allTypes.slice(0, 10));
      console.log('[StockTypeSelector] Unique types found:', uniqueTypes);
      
      // 如果冇有效嘅 type，嘗試從現有庫存數據獲取
      if (uniqueTypes.length === 0) {
        console.log('[StockTypeSelector] No valid types found in data_code, fetching from stock data');
        // 從實際庫存數據獲取類型
        await fetchTypesFromStockData();
      } else {
        setProductTypes(uniqueTypes);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to load product types');
    }
  }, [supabase, fetchTypesFromStockData]);

  // 獲取庫存數據
  const fetchStockData = useCallback(async (type: string) => {
    setLoadingStock(true);
    try {
      // 首先獲取庫存數據
      const { data: stockData, error: stockError } = await supabase
        .from('stock_level')
        .select('stock, stock_level')
        .gt('stock_level', 0)
        .order('stock_level', { ascending: false })
        .limit(100);

      if (stockError) throw stockError;

      if (!stockData || stockData.length === 0) {
        setStockData([]);
        return;
      }

      // 獲取產品代碼列表
      const productCodes = stockData.map(item => item.stock);
      
      // 查詢產品詳情
      let productQuery = supabase
        .from('data_code')
        .select('code, description, type')
        .in('code', productCodes);
      
      // 如果選擇了特定類型，添加過濾
      if (type !== 'all') {
        productQuery = productQuery.eq('type', type);
      }
      
      const { data: productData, error: productError } = await productQuery;
      
      if (productError) throw productError;
      
      // 創建產品映射
      const productMap = new Map();
      (productData || []).forEach(product => {
        productMap.set(product.code, product);
      });
      
      // 合併數據
      const formattedData: StockData[] = stockData
        .filter(item => productMap.has(item.stock))
        .map(item => {
          const product = productMap.get(item.stock);
          return {
            stock: item.stock,
            stock_level: item.stock_level,
            description: product?.description || '-',
            type: product?.type || '-'
          };
        });

      console.log('[StockTypeSelector] Stock data loaded:', formattedData.length, 'items');
      setStockData(formattedData);

      // 通知圖表組件更新
      window.dispatchEvent(new CustomEvent('stockTypeChanged', { 
        detail: { type, data: formattedData } 
      }));
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoadingStock(false);
    }
  }, [supabase]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProductTypes();
      await fetchStockData('all');
      setLoading(false);
    };
    init();
  }, [fetchProductTypes, fetchStockData, refreshTrigger]);

  // 當選擇類型改變時
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchStockData(type);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header with type selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Stock Inventory</h3>
        <select 
          value={selectedType} 
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-[200px] px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Types</option>
          {productTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Stock table */}
      <div className="flex-1 overflow-auto">
        {loadingStock ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800/50 backdrop-blur-sm">
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Product Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Stock Level</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No stock data available {selectedType !== 'all' && `for type "${selectedType}"`}
                  </td>
                </tr>
              ) : (
                stockData.map((item, index) => {
                  const isLowStock = item.stock_level < 100;
                  return (
                    <tr key={`${item.stock}-${index}`} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-sm text-white font-medium">{item.stock}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-center">{item.type}</td>
                      <td className="py-3 px-4 text-sm text-white text-right font-medium">
                        {item.stock_level.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isLowStock ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
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
      {!loadingStock && stockData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
          <span className="text-gray-400">
            Showing {stockData.length} products {selectedType !== 'all' && `of type "${selectedType}"`}
          </span>
          <span className="text-gray-300">
            Total Stock: <span className="font-semibold text-white">
              {stockData.reduce((sum, item) => sum + item.stock_level, 0).toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};