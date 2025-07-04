/**
 * Inventory Search 小部件
 * 支援三種尺寸：
 * - Small (1x1): 不支援
 * - Medium (3x3): 套用現時 5x5 模式的顯示內容及形式
 * - Large (5x5): 上半部維持現有顯示，下半部加入折線圖
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { MagnifyingGlassIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';

interface InventoryLocation {
  product_code: string;
  injection: number;
  pipeline: number;
  prebook: number;
  await: number;
  await_grn: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  total: number;
}

interface ChartData {
  date: string;
  inventory: number;
  orders: number;
}

export const InventorySearchWidget = React.memo(function InventorySearchWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<InventoryLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const { refreshTrigger } = useAdminRefresh();
  
  // Get widget size (assuming medium as default since WidgetSize is removed)
  const size = widget.size || 'MEDIUM';


  const fetchChartData = useCallback(async (productCode: string) => {
    try {
      setLoadingChart(true);
      const supabase = createClient();
      
      // 獲取過去 7 天的日期範圍
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      // 查詢過去 7 天的庫存數據快照
      // 每天取最後一筆記錄的總和
      const inventoryPromises = [];
      const dateMap = new Map<string, { inventory: number; orders: number }>();
      
      // 初始化每一天的數據
      for (let i = 0; i <= 7; i++) {
        const currentDate = subDays(endDate, 7 - i);
        const dateStr = format(currentDate, 'MMM dd');
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        dateMap.set(dateStr, { inventory: 0, orders: 0 });
        
        // 查詢每天的庫存總和
        const inventoryQuery = supabase
          .from('record_inventory')
          .select('injection, pipeline, prebook, await, await_grn, fold, bulk, backcarpark, latest_update')
          .eq('product_code', productCode)
          .gte('latest_update', dayStart.toISOString())
          .lte('latest_update', dayEnd.toISOString())
          .order('latest_update', { ascending: false })
          .limit(1);
          
        inventoryPromises.push(inventoryQuery);
      }
      
      // 執行所有庫存查詢
      const inventoryResults = await Promise.all(inventoryPromises);
      
      // 處理庫存數據
      inventoryResults.forEach((result, index) => {
        const date = format(subDays(endDate, 7 - index), 'MMM dd');
        if (result.data && result.data.length > 0) {
          const record = result.data[0];
          const total = (record.injection || 0) + (record.pipeline || 0) + 
                       (record.prebook || 0) + (record.await || 0) + 
                       (record.await_grn || 0) + (record.fold || 0) + 
                       (record.bulk || 0) + (record.backcarpark || 0);
          const current = dateMap.get(date)!;
          current.inventory = total;
          dateMap.set(date, current);
        }
      });
      
      // 如果某些天沒有數據，嘗試獲取最近的庫存記錄
      const { data: latestInventory } = await supabase
        .from('record_inventory')
        .select('injection, pipeline, prebook, await, await_grn, fold, bulk, backcarpark')
        .eq('product_code', productCode)
        .order('latest_update', { ascending: false })
        .limit(1);
        
      if (latestInventory && latestInventory.length > 0) {
        const record = latestInventory[0];
        const total = (record.injection || 0) + (record.pipeline || 0) + 
                     (record.prebook || 0) + (record.await || 0) + 
                     (record.await_grn || 0) + (record.fold || 0) + 
                     (record.bulk || 0) + (record.backcarpark || 0);
        
        // 填充沒有數據的天數
        dateMap.forEach((value, key) => {
          if (value.inventory === 0) {
            value.inventory = total;
          }
        });
      }

      // 查詢過去 7 天的訂單數據
      const { data: orderData, error: orderError } = await supabase
        .from('data_order')
        .select('created_at, product_qty')
        .eq('product_code', productCode)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (orderError) throw orderError;

      // 統計訂單數據
      orderData?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const current = dateMap.get(date);
        if (current) {
          current.orders += item.product_qty || 0;
        }
      });

      // 轉換為圖表數據格式
      const chartDataArray: ChartData[] = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        inventory: data.inventory,
        orders: data.orders
      }));
      
      setChartData(chartDataArray);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // 載入圖表數據 (用於 5x5 模式)
  useEffect(() => {
    if (size === 'LARGE' && searchResults && !isEditMode) {
      fetchChartData(searchResults.product_code);
    }
  }, [size, searchResults, isEditMode, fetchChartData]);

  const searchInventory = useCallback(async (productCode: string) => {
    if (!productCode.trim()) {
      setSearchResults(null);
      setChartData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setChartData([]); // Clear previous chart data
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_inventory')
        .select('*')
        .eq('product_code', productCode.toUpperCase());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: 0,
          pipeline: 0,
          prebook: 0,
          await: 0,
          await_grn: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          total: 0
        });
      } else {
        const aggregated = data.reduce((sum, record) => ({
          injection: sum.injection + (record.injection || 0),
          pipeline: sum.pipeline + (record.pipeline || 0),
          prebook: sum.prebook + (record.prebook || 0),
          await: sum.await + (record.await || 0),
          await_grn: sum.await_grn + (record.await_grn || 0),
          fold: sum.fold + (record.fold || 0),
          bulk: sum.bulk + (record.bulk || 0),
          backcarpark: sum.backcarpark + (record.backcarpark || 0)
        }), {
          injection: 0,
          pipeline: 0,
          prebook: 0,
          await: 0,
          await_grn: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0
        });

        const total = aggregated.injection + aggregated.pipeline + aggregated.prebook + 
                     aggregated.await + aggregated.await_grn + aggregated.fold + 
                     aggregated.bulk + aggregated.backcarpark;
        
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: aggregated.injection,
          pipeline: aggregated.pipeline,
          prebook: aggregated.prebook,
          await: aggregated.await + aggregated.await_grn,  // 合併 await 和 await_grn
          await_grn: aggregated.await_grn,
          fold: aggregated.fold,
          bulk: aggregated.bulk,
          backcarpark: aggregated.backcarpark,
          total: total
        });
      }
    } catch (err: any) {
      console.error('Error searching inventory:', err);
      setError(err.message);
      setSearchResults(null);
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-search when refresh is triggered
  useEffect(() => {
    if (searchQuery && refreshTrigger > 0) {
      searchInventory(searchQuery);
    }
  }, [refreshTrigger, searchQuery, searchInventory]);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchInventory(searchQuery);
  };

  // Small size (1x1) - 不支援

  // Medium size (3x3) - 套用現時 5x5 模式的顯示內容

  return (
    <WidgetCard widgetType="INVENTORY_SEARCH" isEditMode={isEditMode} className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <MagnifyingGlassIcon className="w-5 h-5" />
          Inventory Search
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 min-h-0">
        {/* 上半部分 - 搜尋和結果 (2/3) */}
        <div className="flex-[2] overflow-auto pb-2">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Product Code To Search"
                className="flex-1 px-3 py-2 bg-white/5 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:bg-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 text-sm"
                disabled={isEditMode}
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim() || isEditMode}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {searchResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              {/* Column Headers */}
              <div className="flex items-center justify-between px-3 py-2 bg-black/20 rounded-t-lg mb-1">
                <span className="text-xs font-semibold text-purple-400 flex-1">Location</span>
                <span className="text-xs font-semibold text-purple-400 text-right w-24">Quantity</span>
              </div>
              
              {/* Data List */}
              <div className="space-y-1">
                {[
                  { label: 'Production', value: searchResults.injection, color: 'text-blue-400' },
                  { label: 'Pipeline', value: searchResults.pipeline, color: 'text-green-400' },
                  { label: 'Prebook', value: searchResults.prebook, color: 'text-indigo-400' },
                  { label: 'Awaiting', value: searchResults.await, color: 'text-yellow-400' },
                  { label: 'Fold Mill', value: searchResults.fold, color: 'text-purple-400' },
                  { label: 'Bulk Room', value: searchResults.bulk, color: 'text-orange-400' },
                  { label: 'Back Car Park', value: searchResults.backcarpark, color: 'text-cyan-400' },
                ].map((location) => (
                  <div key={location.label} className="flex justify-between items-center py-1.5 px-3 bg-black/20 hover:bg-white/10 rounded transition-colors">
                    <span className="text-sm text-purple-200 flex-1">{location.label}</span>
                    <span className="text-sm font-semibold text-purple-200 text-right w-24">
                      {location.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-sm font-bold text-slate-200">Total:</span>
                <span className="text-xl font-bold text-blue-400">
                  {searchResults.total.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          {!searchResults && !loading && !error && (
            <div className="mt-4 text-center py-6">
              <MagnifyingGlassIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Enter a product code and click search</p>
            </div>
          )}
        </div>

        {/* 下半部分 - 折線圖 (只在有搜尋結果時顯示) (1/3) */}
        {searchResults && (
          <div className="flex-1 flex flex-col mt-2 pt-2 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              Past 7 Days: Inventory Quantity vs Orders
            </h4>
            <div style={{ flex: 1, minHeight: 0 }}>
              {loadingChart ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inventory" 
                      name="Total Inventory"
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      name="Order Quantity"
                      stroke="#34d399" 
                      strokeWidth={2}
                      dot={{ fill: '#34d399', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-400 text-sm">No inventory data available for past 7 days</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});