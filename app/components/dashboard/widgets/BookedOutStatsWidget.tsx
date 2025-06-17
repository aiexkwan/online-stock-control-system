/**
 * Stock Transfer 小部件
 * 支援三種尺寸：
 * - Small (2x2): 顯示當天 transfer 的總數量
 * - Medium (4x4): 顯示各員工 transfer 的總數量，支援日期範圍選擇
 * - Large (6x6): 包括 4x4 功能 + 折線圖視覺化（上下比例 1:1.5）
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getTodayRange, getYesterdayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';

interface TransferData {
  totalCount: number;
  operatorData?: Array<{
    operator_id: string;
    count: number;
    percentage: number;
  }>;
  dailyData?: Array<{ 
    date: string; 
    count: number;
  }>;
  hourlyData?: Array<{
    hour: string;
    count: number;
  }>;
}

export function BookedOutStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<TransferData>({
    totalCount: 0,
    operatorData: [],
    dailyData: [],
    hourlyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const size = widget.config.size || WidgetSize.SMALL;

  useEffect(() => {
    loadData();
    
    if (widget.config.refreshInterval && !isEditMode) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config, timeRange, isEditMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 根據時間範圍設定查詢範圍
      let dateRange;
      const isHourlyView = timeRange === 'Today' || timeRange === 'Yesterday';
      
      switch (timeRange) {
        case 'Yesterday':
          dateRange = getYesterdayRange();
          break;
        case 'Past 3 days':
          dateRange = getDateRange(3);
          break;
        case 'This week':
          dateRange = getDateRange(7);
          break;
        default:
          dateRange = getTodayRange();
      }

      // 獲取總數
      const { count: totalCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', dateRange.start)
        .lt('tran_date', dateRange.end);

      // 如果是 Medium 或 Large size，獲取操作員統計
      let operatorData = [];
      let dailyData = [];
      let hourlyData = [];
      
      if (size === WidgetSize.MEDIUM || size === WidgetSize.LARGE) {
        // 獲取所有 transfer 記錄
        const { data: transfers } = await supabase
          .from('record_transfer')
          .select('operator_id, tran_date')
          .gte('tran_date', dateRange.start)
          .lt('tran_date', dateRange.end);

        if (transfers) {
          // 統計各操作員的 transfer 數量
          const operatorMap = new Map<string, number>();
          
          transfers.forEach(transfer => {
            const operator = transfer.operator_id || 'Unknown';
            operatorMap.set(operator, (operatorMap.get(operator) || 0) + 1);
          });
          
          const total = totalCount || 0;
          operatorData = Array.from(operatorMap.entries())
            .map(([operator_id, count]) => ({
              operator_id,
              count,
              percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
            
          // 如果是 Large size，生成圖表數據
          if (size === WidgetSize.LARGE) {
            if (isHourlyView) {
              // 生成小時數據
              const hourMap = new Map<string, number>();
              
              // 初始化所有小時
              for (let i = 0; i < 24; i++) {
                hourMap.set(i.toString().padStart(2, '0'), 0);
              }
              
              transfers.forEach(transfer => {
                const hour = new Date(transfer.tran_date).getHours().toString().padStart(2, '0');
                hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
              });
              
              hourlyData = Array.from(hourMap.entries())
                .map(([hour, count]) => ({
                  hour: `${hour}:00`,
                  count
                }));
            } else {
              // 生成日期數據
              const dayMap = new Map<string, number>();
              
              transfers.forEach(transfer => {
                const date = formatDbTime(transfer.tran_date).split(' ')[0];
                dayMap.set(date, (dayMap.get(date) || 0) + 1);
              });
              
              dailyData = Array.from(dayMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
            }
          }
        }
      }

      setData({
        totalCount: totalCount || 0,
        operatorData,
        dailyData,
        hourlyData
      });
      setError(null);
    } catch (err: any) {
      console.error('Error loading transfer data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
  };

  // Small size - 只顯示當天數量
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-2">
            <TruckIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Stock Transfer</h3>
          {loading ? (
            <div className="h-12 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-white">{data.totalCount}</div>
              <p className="text-xs text-slate-500 mt-1">Today</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium size - 顯示操作員統計
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-200">Stock Transfer</CardTitle>
            </div>
            
            {/* Time Range Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
                disabled={isEditMode}
              >
                <ClockIcon className="w-3 h-3" />
                {timeRange}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[120px]"
                  >
                    {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleTimeRangeChange(option)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          timeRange === option ? 'bg-slate-700/50 text-green-400' : 'text-slate-300'
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
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-white">{data.totalCount}</div>
                <p className="text-xs text-slate-400">
                  Total Transfers ({timeRange === 'Today' || timeRange === 'Yesterday' ? 'By Hour' : 'By Date'})
                </p>
              </div>
              
              {/* 操作員列表 */}
              <div className="bg-slate-800/50 rounded-lg p-2 max-h-[160px] overflow-y-auto">
                <p className="text-xs text-slate-400 mb-2">By Operator</p>
                {data.operatorData && data.operatorData.length > 0 ? (
                  <div className="space-y-1">
                    {data.operatorData.map((operator) => (
                      <div key={operator.operator_id} className="flex justify-between items-center py-1 px-2 hover:bg-slate-700/50 rounded transition-colors">
                        <span className="text-xs text-slate-300">{operator.operator_id}</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-white">{operator.count}</span>
                          <span className="text-xs text-slate-400 ml-1">({operator.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2">No data</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - 包括圖表
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-green-300 via-emerald-300 to-green-200 bg-clip-text text-transparent">
              Stock Transfer Analysis
            </CardTitle>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
              disabled={isEditMode}
            >
              <ClockIcon className="w-4 h-4" />
              {timeRange}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[140px]"
                >
                  {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeRangeChange(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                        timeRange === option ? 'bg-slate-700/50 text-green-400' : 'text-slate-300'
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
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">
        {loading ? (
          <div className="space-y-3">
            <div className="h-32 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-48 bg-slate-700 rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            {/* 上半部分 - 統計數據 (40%) */}
            <div className="h-[40%] mb-3">
              <div className="text-center mb-3">
                <div className="text-4xl font-bold text-white">{data.totalCount}</div>
                <p className="text-sm text-slate-400">
                  Total Transfers ({timeRange === 'Today' || timeRange === 'Yesterday' ? 'Hourly' : 'Daily'})
                </p>
              </div>
              
              {/* 操作員列表 */}
              <div className="bg-slate-800/50 rounded-lg p-3 h-[calc(100%-4rem)] overflow-hidden">
                <p className="text-sm text-slate-400 mb-2">Operator Performance</p>
                {data.operatorData && data.operatorData.length > 0 ? (
                  <div className="h-[calc(100%-2rem)] overflow-y-auto pr-2 space-y-1">
                    {data.operatorData.slice(0, 10).map((operator) => (
                      <div key={operator.operator_id} className="flex justify-between items-center py-1 px-2 hover:bg-slate-700/50 rounded transition-colors">
                        <span className="text-sm text-slate-300">{operator.operator_id}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-white">{operator.count}</span>
                          <span className="text-xs text-slate-400 ml-2">({operator.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">No data</div>
                )}
              </div>
            </div>
            
            {/* 下半部分 - 折線圖 (60%) */}
            <div className="h-[60%]">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Transfer Trend ({timeRange === 'Today' || timeRange === 'Yesterday' ? 'Hourly' : 'Daily'})
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={timeRange === 'Today' || timeRange === 'Yesterday' ? data.hourlyData : data.dailyData}
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey={timeRange === 'Today' || timeRange === 'Yesterday' ? 'hour' : 'date'}
                    stroke="#9CA3AF"
                    tick={false}
                    axisLine={{ stroke: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}