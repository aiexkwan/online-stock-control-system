/**
 * Responsive Finished Product Widget
 * 根據大小顯示不同內容的生產歷史 Widget
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { CubeIcon, ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductSummary {
  product_code: string;
  total_qty: number;
  total_pallets: number;
}

interface ChartData {
  date: string;
  pallets: number;
}

type TimeRange = 'Today' | 'Yesterday' | 'Past 3 days' | 'Past 7 days';
const TIME_RANGE_OPTIONS: TimeRange[] = ['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'];

const ResponsiveFinishedProductWidget = React.memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('Today');
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [totalPallets, setTotalPallets] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Get date range based on selected time range
  const getDateRange = (timeRange: TimeRange) => {
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    switch (timeRange) {
      case 'Today': {
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
      }
      case 'Yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        return { start: startOfYesterday.toISOString(), end: endOfYesterday.toISOString() };
      }
      case 'Past 3 days': {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);
        return { start: threeDaysAgo.toISOString(), end: endOfDay.toISOString() };
      }
      case 'Past 7 days': {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return { start: sevenDaysAgo.toISOString(), end: endOfDay.toISOString() };
      }
      default:
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
    }
  };

  // Fetch product summary
  const fetchProductSummary = useCallback(async (timeRange: TimeRange) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { start, end } = getDateRange(timeRange);
      
      const { data, error: fetchError } = await supabase
        .from('record_palletinfo')
        .select('product_code, product_qty, plt_num, plt_remark, generate_time')
        .gte('generate_time', start)
        .lte('generate_time', end)
        .ilike('plt_remark', '%Finished In Production%')
        .not('plt_remark', 'ilike', '%Material GRN-%')
        .order('generate_time', { ascending: true });
      
      if (fetchError) throw new Error(fetchError.message);
      
      if (data) {
        setTotalPallets(data.length);
        
        // Group by product_code
        const productMap = new Map<string, ProductSummary>();
        const dateMap = new Map<string, number>();
        
        for (const record of data) {
          const { product_code, product_qty, generate_time } = record;
          
          if (!productMap.has(product_code)) {
            productMap.set(product_code, {
              product_code,
              total_qty: 0,
              total_pallets: 0
            });
          }
          
          const productSummary = productMap.get(product_code)!;
          productSummary.total_qty += product_qty;
          productSummary.total_pallets += 1;
          
          // Chart data
          const date = new Date(generate_time);
          let dateKey: string;
          
          if (timeRange === 'Today' || timeRange === 'Yesterday') {
            dateKey = format(date, 'HH:00');
          } else {
            dateKey = format(date, 'MMM dd');
          }
          
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
        
        const productSummaries = Array.from(productMap.values())
          .sort((a, b) => b.total_pallets - a.total_pallets);
        
        setProducts(productSummaries);
        
        // Prepare chart data
        const chartDataArray: ChartData[] = [];
        
        if (timeRange === 'Today' || timeRange === 'Yesterday') {
          for (let hour = 0; hour < 24; hour++) {
            const hourKey = `${hour.toString().padStart(2, '0')}:00`;
            chartDataArray.push({
              date: hourKey,
              pallets: dateMap.get(hourKey) || 0
            });
          }
        } else {
          const sortedDates = Array.from(dateMap.keys()).sort();
          sortedDates.forEach(date => {
            chartDataArray.push({
              date,
              pallets: dateMap.get(date) || 0
            });
          });
        }
        
        setChartData(chartDataArray);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isEditMode) {
      fetchProductSummary(selectedTimeRange);
    }
  }, [selectedTimeRange, isEditMode, fetchProductSummary]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // MINIMAL (1格) - 只顯示總板數
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <CubeIcon className="w-6 h-6 text-blue-500 mb-1" />
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{totalPallets}</div>
                  <span className="text-xs text-gray-400">Pallets</span>
                </>
              )}
            </div>
          );
        }

        // COMPACT (3格) - 顯示前 3 個產品
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="flex flex-col h-full p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CubeIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-medium text-white">Production</h3>
                </div>
                <span className="text-xs text-blue-400 font-medium">{selectedTimeRange}</span>
              </div>
              
              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-xs">{error}</div>
              ) : products.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No production today</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-hidden">
                  {products.slice(0, 3).map((product, index) => (
                    <div key={product.product_code} className="flex justify-between items-center bg-slate-800 rounded p-2">
                      <div>
                        <span className="text-xs text-white font-medium block">{product.product_code}</span>
                        <span className="text-xs text-gray-400">{product.total_qty} pcs</span>
                      </div>
                      <span className="text-sm text-blue-400 font-bold">{product.total_pallets}</span>
                    </div>
                  ))}
                  {totalPallets > 0 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      Total: {totalPallets} pallets
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // STANDARD (5格) - 顯示前 5 個產品 + 時間選擇器
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CubeIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Production History</h3>
                    <p className="text-xs text-gray-400">{totalPallets} pallets total</p>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors",
                      isEditMode && "cursor-not-allowed opacity-50"
                    )}
                    disabled={loading || isEditMode}
                  >
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-white">{selectedTimeRange}</span>
                    <ChevronDownIcon className={cn(
                      "w-3 h-3 text-gray-400 transition-transform",
                      isDropdownOpen && "rotate-180"
                    )} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl"
                        style={{ zIndex: 1000 }}
                      >
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <button
                            type="button"
                            key={range}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedTimeRange(range);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors",
                              selectedTimeRange === range && "bg-slate-800 text-blue-400"
                            )}
                          >
                            {range}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <CubeIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <span className="text-gray-400">No production in this period</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {products.slice(0, 5).map((product, index) => (
                    <div key={product.product_code} className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-sm text-white font-medium">{product.product_code}</span>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-400">Qty: {product.total_qty.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">Avg: {Math.round(product.total_qty / product.total_pallets)}/plt</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">{product.total_pallets}</div>
                          <div className="text-xs text-gray-500">pallets</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{products.length - 5} more products
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // DETAILED & FULL (7格+) - 顯示產品列表 + 圖表
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Production History</h3>
                  <p className="text-sm text-gray-400">{totalPallets} pallets produced</p>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm",
                    isEditMode && "cursor-not-allowed opacity-50"
                  )}
                  disabled={loading || isEditMode}
                >
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{selectedTimeRange}</span>
                  <ChevronDownIcon className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[150px]"
                      style={{ zIndex: 1000 }}
                    >
                      {TIME_RANGE_OPTIONS.map((range) => (
                        <button
                          type="button"
                          key={range}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTimeRange(range);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "block w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                            selectedTimeRange === range && "bg-slate-800 text-blue-400"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 flex-1">
                <div className="h-32 bg-white/10 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <div className="flex-1 grid grid-rows-2 gap-4">
                {/* Chart */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-gray-400 mb-3">Production Timeline</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={10}
                        interval="preserveStartEnd"
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
                      <Line 
                        type="monotone" 
                        dataKey="pallets" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Product List */}
                <div className="overflow-y-auto">
                  <h4 className="text-sm text-gray-400 mb-2">Top Products</h4>
                  <div className="space-y-2">
                    {products.slice(0, 10).map((product, index) => (
                      <div key={product.product_code} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-xs font-bold text-blue-400">
                            {index + 1}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">{product.product_code}</span>
                            <div className="text-xs text-gray-400">
                              {product.total_qty.toLocaleString()} pcs • {Math.round(product.total_qty / product.total_pallets)} pcs/plt
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">{product.total_pallets}</div>
                          <div className="text-xs text-gray-500">pallets</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveFinishedProductWidget.displayName = 'ResponsiveFinishedProductWidget';

export default ResponsiveFinishedProductWidget;