/**
 * Responsive Inventory Search Widget
 * 根據大小顯示不同內容的產品代碼搜索 Widget
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { MagnifyingGlassIcon, CubeIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/utils/supabase/client';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

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

const LOCATION_CONFIG = [
  { key: 'injection', label: 'Production', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { key: 'pipeline', label: 'Pipeline', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { key: 'prebook', label: 'Prebook', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { key: 'await', label: 'Awaiting', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { key: 'fold', label: 'Fold Mill', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { key: 'bulk', label: 'Bulk Room', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { key: 'backcarpark', label: 'Back Car Park', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
];

const ResponsiveInventorySearchWidget = React.memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<InventoryLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Search inventory
  const searchInventory = useCallback(async (productCode: string) => {
    if (!productCode.trim()) {
      setSearchResults(null);
      setChartData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setChartData([]);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_inventory')
        .select('*')
        .eq('product_code', productCode.toUpperCase());

      if (error) throw error;

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
          await: aggregated.await + aggregated.await_grn,
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chart data
  const fetchChartData = useCallback(async (productCode: string) => {
    try {
      setLoadingChart(true);
      const supabase = createClient();
      
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      const inventoryPromises = [];
      const dateMap = new Map<string, { inventory: number; orders: number }>();
      
      for (let i = 0; i <= 7; i++) {
        const currentDate = subDays(endDate, 7 - i);
        const dateStr = format(currentDate, 'MMM dd');
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        dateMap.set(dateStr, { inventory: 0, orders: 0 });
        
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
      
      const inventoryResults = await Promise.all(inventoryPromises);
      
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
        }
      });

      const { data: orderData } = await supabase
        .from('data_order')
        .select('created_at, product_qty')
        .eq('product_code', productCode)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      orderData?.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const current = dateMap.get(date);
        if (current) {
          current.orders += item.product_qty || 0;
        }
      });

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

  // Load chart data when search results change
  useEffect(() => {
    if (searchResults && searchResults.total > 0 && !isEditMode) {
      fetchChartData(searchResults.product_code);
    }
  }, [searchResults, isEditMode, fetchChartData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchInventory(searchQuery);
  };

  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // MINIMAL (1格) - 搜索圖標
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="widget-content flex flex-col items-center justify-center h-full">
              <MagnifyingGlassIcon className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-xs text-gray-400">Search</span>
            </div>
          );
        }

        // COMPACT (3格) - 簡單搜索框
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="widget-content flex flex-col h-full p-3">
              <div className="flex items-center gap-2 mb-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-medium text-white">Inventory Search</h3>
              </div>
              
              <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Product Code"
                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  disabled={isEditMode}
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim() || isEditMode}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded text-xs transition-colors"
                >
                  {loading ? '...' : 'Go'}
                </button>
              </form>

              {error && (
                <div className="text-red-400 text-xs mb-2">{error}</div>
              )}

              {searchResults && (
                <div className="flex-1 overflow-hidden">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-blue-400">{searchResults.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Total Inventory</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {LOCATION_CONFIG.slice(0, 4).map((location) => (
                      <div key={location.key} className="bg-slate-800 rounded p-1">
                        <div className="text-gray-400 truncate">{location.label}</div>
                        <div className={cn("font-medium", location.color)}>
                          {searchResults[location.key as keyof InventoryLocation].toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Enter product code</span>
                </div>
              )}
            </div>
          );
        }

        // STANDARD (5格) - 完整搜索結果
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="widget-content flex flex-col h-full p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-base font-semibold text-white">Inventory Search</h3>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Product Code"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={isEditMode}
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim() || isEditMode}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  )}
                </button>
              </form>

              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg mb-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {searchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-gray-400">Total Inventory</div>
                    <div className="text-2xl font-bold text-blue-400">{searchResults.total.toLocaleString()}</div>
                  </div>

                  <div className="space-y-2">
                    {LOCATION_CONFIG.map((location) => (
                      <div 
                        key={location.key} 
                        className={cn(
                          "flex justify-between items-center p-2 rounded-lg",
                          location.bgColor,
                          "border",
                          location.borderColor
                        )}
                      >
                        <span className="text-sm text-gray-300">{location.label}</span>
                        <span className={cn("text-sm font-bold", location.color)}>
                          {searchResults[location.key as keyof InventoryLocation].toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!searchResults && !loading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <CubeIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-400">Enter a product code to search</p>
                </div>
              )}
            </div>
          );
        }

        // DETAILED & FULL (7格+) - 搜索結果 + 圖表
        return (
          <div className="widget-content flex flex-col h-full p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Inventory Search</h3>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Product Code To Search"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isEditMode}
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim() || isEditMode}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Search'
                )}
              </button>
            </form>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {searchResults ? (
              <div className="flex-1 grid grid-rows-2 gap-4">
                {/* Inventory Details */}
                <div className="overflow-y-auto">
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">Product Code</div>
                        <div className="text-lg font-semibold text-white">{searchResults.product_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Total Stock</div>
                        <div className="text-2xl font-bold text-blue-400">{searchResults.total.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {LOCATION_CONFIG.map((location) => (
                      <div 
                        key={location.key} 
                        className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                      >
                        <div className="text-xs text-gray-400">{location.label}</div>
                        <div className={cn("text-lg font-bold mt-1", location.color)}>
                          {searchResults[location.key as keyof InventoryLocation].toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-3">Past 7 Days: Inventory vs Orders</h4>
                    {loadingChart ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#64748b" 
                            fontSize={10}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '4px'
                            }}
                            labelStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="line"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="inventory" 
                            name="Total Inventory"
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="orders" 
                            name="Orders"
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>
            ) : (
              !loading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <CubeIcon className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-center">Enter a product code and click search</p>
                  <p className="text-gray-500 text-sm mt-2">View inventory across all locations</p>
                </div>
              )
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveInventorySearchWidget.displayName = 'ResponsiveInventorySearchWidget';

export default ResponsiveInventorySearchWidget;