/**
 * Responsive Output Stats Widget
 * 根據大小顯示不同內容的統計 Widget
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { TrendingUp, TrendingDown, Minus, Package, ChevronDownIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/app/utils/supabase/client';
import { getTodayRange, getYesterdayRange, getDateRange } from '@/app/utils/timezone';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';

type TimeRange = 'Today' | 'Yesterday' | 'Past 3 days' | 'Past 7 days';
const TIME_RANGE_OPTIONS: TimeRange[] = ['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'];

interface OutputData {
  palletCount: number;
  productCodeCount: number;
  totalQuantity: number;
  trend: number; // 與昨天比較的趨勢
  yesterdayCount: number;
  hourlyData: { hour: string; count: number }[];
  productDetails?: Array<{ 
    product_code: string; 
    quantity: number; 
  }>;
}

const ResponsiveOutputStatsWidget = React.memo(({ widget, isEditMode }: WidgetComponentProps) => {
  const [data, setData] = useState<OutputData>({
    palletCount: 0,
    productCodeCount: 0,
    totalQuantity: 0,
    trend: 0,
    yesterdayCount: 0,
    hourlyData: [],
    productDetails: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { refreshTrigger } = useAdminRefresh();

  // Get date range based on selected time range
  const getDateRangeForTimeRange = useCallback((range: TimeRange) => {
    switch (range) {
      case 'Today':
        return getTodayRange();
      case 'Yesterday':
        return getYesterdayRange();
      case 'Past 3 days':
        return getDateRange(3);
      case 'Past 7 days':
        return getDateRange(7);
      default:
        return getTodayRange();
    }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const dateRange = getDateRangeForTimeRange(timeRange);
      
      // 查詢 pallet 總數
      const { count: palletCount, data: palletData } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact' })
        .gte('generate_time', dateRange.start)
        .lt('generate_time', dateRange.end)
        .eq('plt_remark', 'Finished In Production');

      // 獲取昨天的數據來計算趨勢
      const yesterdayRange = getYesterdayRange();
      const { count: yesterdayCount } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('generate_time', yesterdayRange.start)
        .lt('generate_time', yesterdayRange.end)
        .eq('plt_remark', 'Finished In Production');

      // 計算趨勢
      let trend = 0;
      if (yesterdayCount && yesterdayCount > 0) {
        trend = ((palletCount || 0) - yesterdayCount) / yesterdayCount * 100;
      }

      // 處理產品詳情
      let productCodeCount = 0;
      let totalQuantity = 0;
      let productDetails: Array<{ product_code: string; quantity: number }> = [];

      if (palletData && palletData.length > 0) {
        // 統計產品代碼和數量
        const productMap = new Map<string, number>();
        
        for (const pallet of palletData) {
          const code = pallet.product_code;
          const qty = pallet.product_qty || 0;
          
          if (!productMap.has(code)) {
            productMap.set(code, 0);
          }
          productMap.set(code, productMap.get(code)! + qty);
          totalQuantity += qty;
        }
        
        productCodeCount = productMap.size;
        productDetails = Array.from(productMap.entries())
          .map(([product_code, quantity]) => ({ product_code, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        // 生成每小時數據（只有今天和昨天）
        if (timeRange === 'Today' || timeRange === 'Yesterday') {
          const hourlyMap = new Map<number, number>();
          
          // 初始化 24 小時
          for (let i = 0; i < 24; i++) {
            hourlyMap.set(i, 0);
          }
          
          // 統計每小時的數據
          for (const pallet of palletData) {
            const date = new Date(pallet.generate_time);
            const hour = date.getHours();
            hourlyMap.set(hour, hourlyMap.get(hour)! + 1);
          }
          
          const hourlyData = Array.from(hourlyMap.entries())
            .map(([hour, count]) => ({
              hour: `${hour.toString().padStart(2, '0')}:00`,
              count
            }));
          
          setData({
            palletCount: palletCount || 0,
            productCodeCount,
            totalQuantity,
            trend,
            yesterdayCount: yesterdayCount || 0,
            hourlyData,
            productDetails
          });
          
          return;
        }
      }

      setData({
        palletCount: palletCount || 0,
        productCodeCount,
        totalQuantity,
        trend,
        yesterdayCount: yesterdayCount || 0,
        hourlyData: [],
        productDetails
      });

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, getDateRangeForTimeRange]);

  // Initial load and refresh trigger
  useEffect(() => {
    if (!isEditMode) {
      loadData();
    }
  }, [isEditMode, loadData, refreshTrigger, timeRange]);

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
        const isPositive = data.trend > 0;
        const isNeutral = data.trend === 0;

        // MINIMAL - 只顯示數字
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="flex items-center justify-center h-full w-full">
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <div className="text-center">
                  <Package className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">
                    {data.palletCount.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // COMPACT - 數字 + 標題
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="flex flex-col justify-center h-full w-full p-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm text-gray-400">Production Output</h3>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <span className="text-red-400 text-xs">{error}</span>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    {data.palletCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    pallets today
                  </div>
                  {data.trend !== 0 && (
                    <div className={cn(
                      "text-xs mt-1",
                      isPositive ? "text-green-500" : "text-red-500"
                    )}>
                      {isPositive ? '+' : ''}{data.trend.toFixed(1)}% vs yesterday
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }

        // STANDARD - 數字 + 標題 + 趨勢 + 迷你圖表
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <h3 className="text-base text-gray-400">Production Output</h3>
                </div>
                
                {/* Time Range Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors"
                    disabled={loading}
                  >
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-white">{timeRange}</span>
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
                        className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl z-50"
                        style={{ pointerEvents: 'auto', zIndex: 9999 }}
                      >
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <button
                            key={range}
                            onClick={() => {
                              setTimeRange(range);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors",
                              timeRange === range && "bg-slate-800 text-blue-400"
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
                <div className="space-y-3">
                  <div className="h-10 w-24 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-16 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <span className="text-red-400 text-sm">{error}</span>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="text-4xl font-bold text-white mb-1">
                      {data.palletCount.toLocaleString()}
                      <span className="text-lg text-gray-400 ml-2">pallets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPositive && <TrendingUp className="w-5 h-5 text-green-500" />}
                      {!isPositive && !isNeutral && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {isNeutral && <Minus className="w-5 h-5 text-gray-500" />}
                      <span className={cn(
                        "text-base font-medium",
                        isPositive && "text-green-500",
                        !isPositive && !isNeutral && "text-red-500",
                        isNeutral && "text-gray-500"
                      )}>
                        {isPositive ? '+' : ''}{data.trend.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  {data.hourlyData.length > 0 && (
                    <div className="flex-1 min-h-[80px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="hour" 
                            stroke="#64748b" 
                            fontSize={9}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={9}
                            width={20}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    vs yesterday: {data.yesterdayCount.toLocaleString()} pallets
                  </div>
                </>
              )}
            </div>
          );
        }

        // DETAILED & FULL - 完整儀表板
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Production Output</h3>
                  <p className="text-sm text-gray-400">Real-time tracking</p>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                  disabled={loading || isEditMode}
                >
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{timeRange}</span>
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
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[150px]"
                    >
                      {TIME_RANGE_OPTIONS.map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                            timeRange === range && "bg-slate-800 text-blue-400"
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
                <div className="h-20 bg-white/10 rounded animate-pulse"></div>
                <div className="h-32 bg-white/10 rounded animate-pulse"></div>
                <div className="h-20 bg-white/10 rounded animate-pulse"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <>
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Total Pallets</div>
                    <div className="text-2xl font-bold text-white">{data.palletCount.toLocaleString()}</div>
                    <div className={cn(
                      "text-xs mt-1",
                      isPositive ? "text-green-500" : isNeutral ? "text-gray-500" : "text-red-500"
                    )}>
                      {isPositive ? '+' : ''}{data.trend.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Products</div>
                    <div className="text-2xl font-bold text-white">{data.productCodeCount}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Total Qty</div>
                    <div className="text-2xl font-bold text-white">{data.totalQuantity.toLocaleString()}</div>
                  </div>
                </div>

                {/* Chart */}
                {data.hourlyData.length > 0 && (
                  <div className="flex-1 bg-slate-800 rounded-lg p-4 mb-4">
                    <h4 className="text-sm text-gray-400 mb-3">Hourly Production</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#64748b" 
                          fontSize={10}
                          interval={2}
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
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Products */}
                {data.productDetails && data.productDetails.length > 0 && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Top Products</h4>
                    <div className="space-y-2">
                      {data.productDetails.map((product, index) => (
                        <div key={product.product_code} className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-xs font-bold text-blue-400">
                              {index + 1}
                            </div>
                            <span className="text-sm text-white">{product.product_code}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-400">{product.quantity.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveOutputStatsWidget.displayName = 'ResponsiveOutputStatsWidget';

export default ResponsiveOutputStatsWidget;