'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ClockIcon, 
  DocumentIcon, 
  ExclamationTriangleIcon,
  InboxIcon,
  ChevronDownIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';
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

import { WidgetSize } from '@/app/types/dashboard';

interface FinishedProductProps {
  widgetSize?: WidgetSize;
}

export default function FinishedProduct({ widgetSize }: FinishedProductProps) {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const fetchProductSummary = useCallback(async (timeRange: TimeRange, reset = false) => {
    try {
    setLoading(true);
      setError(null);
      
      const { start, end } = getDateRange(timeRange);
      
      const { data, error: fetchError } = await supabase
      .from('record_palletinfo')
        .select('product_code, product_qty, plt_num, plt_remark, generate_time')
        .gte('generate_time', start)
        .lte('generate_time', end)
        .ilike('plt_remark', '%Finished In Production%')
        .not('plt_remark', 'ilike', '%Material GRN-%')
        .order('generate_time', { ascending: true });
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (data) {
        // 計算總板數
        setTotalPallets(data.length);
        
        // Group by product_code and calculate totals
        const productMap = new Map<string, ProductSummary>();
        
        // Group by date for chart data
        const dateMap = new Map<string, number>();
        
        for (const record of data) {
          const { product_code, product_qty, generate_time } = record;
          
          // Product summary
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
          
          // Chart data - group by date/hour based on time range
          const date = new Date(generate_time);
          let dateKey: string;
          
          if (timeRange === 'Today' || timeRange === 'Yesterday') {
            // For today and yesterday, group by hour
            dateKey = format(date, 'HH:00');
          } else {
            // For other ranges, group by date
            dateKey = format(date, 'MMM dd');
          }
          
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
        
        // Convert to array and sort by total_pallets descending (for top 5)
        const productSummaries = Array.from(productMap.values())
          .sort((a, b) => b.total_pallets - a.total_pallets);
        
        setProducts(productSummaries);
        
        // Prepare chart data
        const chartDataArray: ChartData[] = [];
        
        if (timeRange === 'Today' || timeRange === 'Yesterday') {
          // For today and yesterday, create hourly data points
          for (let hour = 0; hour < 24; hour++) {
            const hourKey = `${hour.toString().padStart(2, '0')}:00`;
            chartDataArray.push({
              date: hourKey,
              pallets: dateMap.get(hourKey) || 0
            });
          }
        } else {
          // For other ranges, use actual dates
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
      console.error('[FinishedProduct] Error fetching data:', err);
      setError(err.message || 'Failed to load finished product data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [supabase, getDateRange]);

  // Initial load
  useEffect(() => {
    fetchProductSummary(selectedTimeRange, true);
  }, [selectedTimeRange, fetchProductSummary]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Retry function
  const handleRetry = () => {
    setError(null);
    setProducts([]);
    setInitialLoading(true);
    fetchProductSummary(selectedTimeRange, true);
  };

  // Handle time range change
  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
    setIsDropdownOpen(false);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-4 w-16 bg-white/10" />
          <Skeleton className="h-4 w-16 bg-white/10" />
        </div>
      ))}
    </div>
  );

  // 強制 Small size 使用 Today 時間範圍
  useEffect(() => {
    if (widgetSize === WidgetSize.SMALL && selectedTimeRange !== 'Today') {
      setSelectedTimeRange('Today');
    }
  }, [widgetSize, selectedTimeRange]);

  // Small size (1x1) - 只顯示當天總板數
  if (widgetSize === WidgetSize.SMALL) {
    // 使用 Today 的數據
    const todayData = products.reduce((sum, p) => sum + p.total_pallets, 0);
    
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <h3 className="text-xs text-slate-400 mb-1">Today&apos;s Finished</h3>
        {loading || initialLoading ? (
          <Skeleton className="h-8 w-16 bg-white/10" />
        ) : (
          <motion.div
            key={totalPallets}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-medium text-green-400"
          >
            {totalPallets}
          </motion.div>
        )}
        <p className="text-xs text-slate-500 mt-0.5">Pallets</p>
      </div>
    );
  }

  // Medium or Large size - 顯示折線圖和產品明細 (2:1 比例)
  if (widgetSize === WidgetSize.MEDIUM || widgetSize === WidgetSize.LARGE) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with time range dropdown */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <DocumentIcon className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-slate-300">Finished Product</span>
          </div>
          
          {/* Time Range Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-xs"
            >
              <ClockIcon className="w-3 h-3" />
              {selectedTimeRange}
              <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-xl border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]"
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeRangeChange(option)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        selectedTimeRange === option ? 'bg-white/10 text-green-400' : 'text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 上半部分 - 頭5產品明細 (佔 1/3) */}
        <div className="flex-1 min-h-0 mb-2">
          <div className="h-full flex flex-col">
            {/* Column Headers */}
            <div className="flex items-center justify-between px-2 py-1 bg-black/20 rounded-t-lg mb-1">
              <span className="text-[10px] font-semibold text-purple-400 flex-1">Product Code</span>
              <span className="text-[10px] font-semibold text-purple-400 text-right w-20">Pallets</span>
              {widgetSize === WidgetSize.LARGE && (
                <span className="text-[10px] font-semibold text-purple-400 text-right w-24 ml-2">Quantity</span>
              )}
            </div>
            {loading ? (
              <div className="space-y-1 flex-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full bg-white/10" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-slate-500">No products found</p>
            ) : (
              <div className="space-y-1 flex-1 overflow-auto">
                {products.slice(0, 5).map((product, index) => (
                  <motion.div
                    key={product.product_code}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between px-2 py-1 rounded bg-black/20 hover:bg-white/10 transition-colors"
                  >
                    <span className={`${widgetSize === WidgetSize.LARGE ? 'text-xs' : 'text-[10px]'} font-medium text-purple-200 flex-1`}>
                      {product.product_code}
                    </span>
                    <span className={`${widgetSize === WidgetSize.LARGE ? 'text-xs' : 'text-[10px]'} text-purple-200 text-right w-20`}>
                      {product.total_pallets.toLocaleString()}
                    </span>
                    {widgetSize === WidgetSize.LARGE && (
                      <span className="text-xs text-purple-200 text-right w-24 ml-2">
                        {product.total_qty.toLocaleString()}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 下半部分 - 折線圖 (佔 2/3) */}
        <div className="flex-[2] min-h-0">
          <div className="border-t border-slate-700 pt-1 h-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full bg-white/10" />
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-slate-400">Failed to load data</p>
                <button onClick={handleRetry} className="mt-2 text-xs text-green-400 hover:text-green-300">
                  Retry
                </button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <InboxIcon className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-sm text-slate-400">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pallets" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default return for original table view
  return (
    <div className="space-y-4">
      {/* Header with time range dropdown - Always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-slate-300">Finished Product</span>
        </div>
        
        {/* Time Range Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs"
          >
            <ClockIcon className="w-3 h-3" />
            {selectedTimeRange}
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-xl border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]"
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleTimeRangeChange(option)}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedTimeRange === option ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary stats */}
      {/*products.length > 0 && (
        <div className="flex gap-4 text-xs">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.length} products
          </Badge>
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.reduce((sum, p) => sum + p.total_pallets, 0)} pallets
          </Badge>
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.reduce((sum, p) => sum + p.total_qty, 0)} total qty
          </Badge>
        </div>
      )}

      {/* Content Area */}
      {/* Error state */}
      {error && products.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-slate-400 mb-4">Failed to load finished product data</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Try Again
          </button>
        </motion.div>
      ) : !initialLoading && products.length === 0 && !error ? (
        /* Empty state */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <InboxIcon className="w-12 h-12 text-slate-500 mb-3" />
          <p className="text-slate-400 mb-2">No finished products found</p>
          <p className="text-sm text-slate-500">Products will appear here once pallets are generated in the selected time range</p>
        </motion.div>
      ) : (
        /* Table container */
        <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-black/20" style={{ maxHeight: '320px' }}>
          {initialLoading ? (
            <div className="p-4">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: '320px' }}>
              <table className="min-w-full">
                <thead className="sticky top-0 bg-black/60 backdrop-blur-sm border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      TTL Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      TTL Pallet
                    </th>
          </tr>
        </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.tr 
                        key={product.product_code}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                            <span className="font-medium text-slate-300">{product.product_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <Badge variant="outline" className="border-slate-600 text-green-300 text-xs">
                            {product.total_qty.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <Badge variant="outline" className="border-slate-600 text-blue-300 text-xs">
                            {product.total_pallets}
                          </Badge>
              </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Loading more indicator */}
              {loading && products.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-4 border-t border-slate-700"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                    Loading...
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error banner for partial failures */}
      {error && products.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg"
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-300">Failed to load data</span>
          <button
            onClick={handleRetry}
            className="ml-auto text-xs text-red-300 hover:text-red-200 underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Medium/Large size - 顯示頭5產品明細 */}
      {(widgetSize === WidgetSize.MEDIUM || widgetSize === WidgetSize.LARGE) && products.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-sm font-semibold text-green-400 mb-3">
            Top 5 Products - {selectedTimeRange}
          </h4>
          <div className="space-y-2">
            {products.slice(0, 5).map((product, index) => (
              <motion.div
                key={product.product_code}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex justify-between items-center ${
                  widgetSize === WidgetSize.LARGE ? 'p-2 rounded-lg bg-black/20 hover:bg-white/10 transition-colors' : ''
                }`}
              >
                <span className={`${widgetSize === WidgetSize.LARGE ? 'text-sm' : 'text-xs'} font-medium text-slate-300`}>
                  {product.product_code}
                </span>
                <div className={`flex gap-4 ${widgetSize === WidgetSize.LARGE ? 'text-sm' : 'text-xs'}`}>
                  <span className="text-green-400">
                    <span className="text-slate-500">Pallets:</span> {product.total_pallets}
                  </span>
                  {widgetSize === WidgetSize.LARGE && (
                    <span className="text-emerald-400">
                      <span className="text-slate-500">Qty:</span> {product.total_qty.toLocaleString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 