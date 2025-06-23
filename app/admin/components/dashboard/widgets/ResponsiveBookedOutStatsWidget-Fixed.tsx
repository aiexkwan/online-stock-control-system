/**
 * Responsive Booked Out Stats Widget - Fixed Version
 * 根據大小顯示不同內容的轉移統計 Widget
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { Truck, TrendingUp, TrendingDown, Package, ArrowRight, ClockIcon, ChevronDownIcon, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/app/utils/supabase/client';
import { getTodayRange, getYesterdayRange, getDateRange } from '@/app/utils/timezone';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';

type TimeRange = 'Today' | 'Yesterday' | 'Past 3 days' | 'Past 7 days';
const TIME_RANGE_OPTIONS: TimeRange[] = ['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'];

interface TransferData {
  transferCount: number;
  trend: number;
  yesterdayCount: number;
  destinations: Array<{
    location: string;
    count: number;
  }>;
  hourlyData: Array<{
    hour: string;
    count: number;
  }>;
}

const ResponsiveBookedOutStatsWidgetFixed = memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [data, setData] = useState<TransferData>({
    transferCount: 0,
    trend: 0,
    yesterdayCount: 0,
    destinations: [],
    hourlyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { refreshTrigger } = useAdminRefresh();

  // 獲取時間範圍
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

  // 載入數據
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const dateRange = getDateRangeForTimeRange(timeRange);
      
      // 查詢轉移總數
      const { count: transferCount, data: transferData } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact' })
        .gte('tran_date', dateRange.start)
        .lt('tran_date', dateRange.end);

      // 獲取昨天的數據來計算趨勢
      const yesterdayRange = getYesterdayRange();
      const { count: yesterdayCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', yesterdayRange.start)
        .lt('tran_date', yesterdayRange.end);

      // 計算趨勢
      let trend = 0;
      if (yesterdayCount && yesterdayCount > 0) {
        trend = ((transferCount || 0) - yesterdayCount) / yesterdayCount * 100;
      }

      // 處理目的地分布和每小時數據
      let destinations: Array<{ location: string; count: number }> = [];
      let hourlyData: Array<{ hour: string; count: number }> = [];

      if (transferData && transferData.length > 0) {
        // 統計目的地分布
        const destMap = new Map<string, number>();
        
        for (const transfer of transferData) {
          const dest = transfer.t_loc || 'Unknown';
          destMap.set(dest, (destMap.get(dest) || 0) + 1);
        }
        
        destinations = Array.from(destMap.entries())
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // 生成每小時數據（只有今天和昨天）
        if (timeRange === 'Today' || timeRange === 'Yesterday') {
          const hourlyMap = new Map<number, number>();
          
          // 初始化 24 小時
          for (let i = 0; i < 24; i++) {
            hourlyMap.set(i, 0);
          }
          
          // 統計每小時的數據
          for (const transfer of transferData) {
            const date = new Date(transfer.tran_date);
            const hour = date.getHours();
            hourlyMap.set(hour, hourlyMap.get(hour)! + 1);
          }
          
          hourlyData = Array.from(hourlyMap.entries())
            .map(([hour, count]) => ({
              hour: `${hour.toString().padStart(2, '0')}:00`,
              count
            }));
        }
      }

      setData({
        transferCount: transferCount || 0,
        trend,
        yesterdayCount: yesterdayCount || 0,
        destinations,
        hourlyData
      });

    } catch (err: any) {
      console.error('Error loading transfer data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // 初始載入和刷新觸發
  useEffect(() => {
    if (!isEditMode) {
      loadData();
    }
  }, [isEditMode, loadData, refreshTrigger, timeRange]);

  // 處理點擊外部關閉下拉菜單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIX: 增強按鈕點擊處理
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  }, [isDropdownOpen]);

  // FIX: 處理選項點擊
  const handleOptionClick = useCallback((range: TimeRange) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeRange(range);
    setIsDropdownOpen(false);
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
                  <Truck className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">
                    {data.transferCount.toLocaleString()}
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
                <Truck className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm text-gray-400">Transfer Stats</h3>
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
                    {data.transferCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    transfers today
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

        // STANDARD - 數字 + 標題 + 趨勢 + 圖表
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-6 h-6 text-orange-500" />
                  <h3 className="text-base text-gray-400">Transfer Stats</h3>
                </div>
                
                {/* Time Range Selector */}
                <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                  <button
                    onClick={handleButtonClick}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors",
                      "relative z-10", // FIX: 確保按鈕在上層
                      loading || isEditMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    disabled={loading || isEditMode}
                    type="button"
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
                        className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl"
                        style={{ 
                          zIndex: 9999, // FIX: 確保下拉菜單在最上層
                          minWidth: '120px'
                        }}
                      >
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <button
                            key={range}
                            onClick={handleOptionClick(range)}
                            className={cn(
                              "w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors",
                              "block", // FIX: 確保按鈕是塊級元素
                              timeRange === range && "bg-slate-800 text-orange-400"
                            )}
                            type="button"
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
                      {data.transferCount.toLocaleString()}
                      <span className="text-lg text-gray-400 ml-2">transfers</span>
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
                        <BarChart data={data.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                          <Bar 
                            dataKey="count" 
                            fill="#f97316" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    vs yesterday: {data.yesterdayCount.toLocaleString()} transfers
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
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Transfer Statistics</h3>
                  <p className="text-sm text-gray-400">Real-time tracking</p>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                <button
                  onClick={handleButtonClick}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm",
                    "relative z-10", // FIX: 確保按鈕在上層
                    loading || isEditMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                  disabled={loading || isEditMode}
                  type="button"
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
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[150px]"
                      style={{ 
                        zIndex: 9999 // FIX: 確保下拉菜單在最上層
                      }}
                    >
                      {TIME_RANGE_OPTIONS.map((range) => (
                        <button
                          key={range}
                          onClick={handleOptionClick(range)}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                            "block", // FIX: 確保按鈕是塊級元素
                            timeRange === range && "bg-slate-800 text-orange-400"
                          )}
                          type="button"
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
                    <div className="text-xs text-gray-400 mb-1">Total Transfers</div>
                    <div className="text-2xl font-bold text-white">{data.transferCount.toLocaleString()}</div>
                    <div className={cn(
                      "text-xs mt-1",
                      isPositive ? "text-green-500" : isNeutral ? "text-gray-500" : "text-red-500"
                    )}>
                      {isPositive ? '+' : ''}{data.trend.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Yesterday</div>
                    <div className="text-2xl font-bold text-white">{data.yesterdayCount.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Locations</div>
                    <div className="text-2xl font-bold text-white">{data.destinations.length}</div>
                  </div>
                </div>

                {/* Chart */}
                {data.hourlyData.length > 0 && (
                  <div className="flex-1 bg-slate-800 rounded-lg p-4 mb-4">
                    <h4 className="text-sm text-gray-400 mb-3">Hourly Distribution</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                        <Bar 
                          dataKey="count" 
                          fill="#f97316" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Destinations */}
                {data.destinations.length > 0 && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Top Destinations</h4>
                    <div className="space-y-2">
                      {data.destinations.map((dest, index) => (
                        <div key={dest.location} className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center text-xs font-bold text-orange-400">
                              {index + 1}
                            </div>
                            <span className="text-sm text-white">{dest.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${(dest.count / data.transferCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-orange-400 w-12 text-right">{dest.count}</span>
                          </div>
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

ResponsiveBookedOutStatsWidgetFixed.displayName = 'ResponsiveBookedOutStatsWidgetFixed';

export default ResponsiveBookedOutStatsWidgetFixed;