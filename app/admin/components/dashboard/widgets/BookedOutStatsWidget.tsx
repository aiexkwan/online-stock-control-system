/**
 * Stock Transfer 小部件
 * 支援三種尺寸：
 * - Small (1x1): 顯示當天 transfer 的總數量
 * - Medium (3x3): 顯示各員工 transfer 的總數量，支援日期範圍選擇
 * - Large (5x5): 包括 3x3 功能 + 折線圖視覺化（上下比例 1:1.5）
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { TruckIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getTodayRange, getYesterdayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';
import { UnifiedWidgetLayout, TableRow, ChartContainer } from '../UnifiedWidgetLayout';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';

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

export const BookedOutStatsWidget = React.memo(function BookedOutStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
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

  const loadData = useCallback(async () => {
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
      let operatorData: Array<{
        operator_id: string;
        count: number;
        percentage: number;
      }> = [];
      let dailyData: Array<{ 
        date: string; 
        count: number;
      }> = [];
      let hourlyData: Array<{
        hour: string;
        count: number;
      }> = [];
      
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
  }, [timeRange, size]);

  useWidgetData({ loadFunction: loadData, isEditMode, dependencies: [timeRange] });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
  };

  // Small size (1x1) - 只顯示文字和數據，無 icon
  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType="BOOKED_OUT_STATS" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Transfer</h3>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-xs">Error</div>
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{data.totalCount}</div>
              <p className="text-xs text-slate-500">Today</p>
            </>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Medium size - 顯示操作員統計
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType="BOOKED_OUT_STATS" isEditMode={isEditMode}>
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
                className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
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
                    className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[120px]"
                  >
                    {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleTimeRangeChange(option)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          timeRange === option ? 'bg-white/10 text-green-400' : 'text-slate-300'
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
          <UnifiedWidgetLayout
            size={size}
            singleContent={
              loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold text-white">{data.totalCount}</div>
                  </div>
                  
                  {/* 操作員列表 */}
                  <div>
                    <p className="text-xs text-purple-400 mb-2">By Operator</p>
                    {data.operatorData && data.operatorData.length > 0 ? (
                      <div className="space-y-1">
                        {data.operatorData.map((operator) => (
                          <TableRow key={operator.operator_id}>
                            <span className="text-xs text-purple-200">{operator.operator_id}</span>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-purple-200">{operator.count}</span>
                              <span className="text-xs text-purple-300 ml-1">({operator.percentage}%)</span>
                            </div>
                          </TableRow>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 text-center py-2">No data</div>
                    )}
                  </div>
                </div>
              )
            }
          />
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size - 包括圖表
  return (
    <WidgetCard size={widget.config.size} widgetType="BOOKED_OUT_STATS" isEditMode={isEditMode}>
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
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
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
                  className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[140px]"
                >
                  {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeRangeChange(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                        timeRange === option ? 'bg-white/10 text-green-400' : 'text-slate-300'
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
            <div className="h-32 bg-white/10 rounded animate-pulse"></div>
            <div className="h-48 bg-white/10 rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            {/* 上半部分 - 統計數據 (40%) */}
            <div className="h-[40%] mb-2">
              {/* 操作員列表 */}
              <div className="bg-black/20 rounded-lg p-2 h-full overflow-hidden">
                <p className="text-xs text-purple-400 mb-1">Operator Workload</p>
                {data.operatorData && data.operatorData.length > 0 ? (
                  <div className="h-[calc(100%-1.5rem)] overflow-y-auto pr-1 space-y-0.5">
                    {data.operatorData.slice(0, 4).map((operator) => (
                      <div key={operator.operator_id} className="flex justify-between items-center py-0.5 px-2 hover:bg-white/10 rounded transition-colors">
                        <span className="text-xs text-purple-200">{operator.operator_id}</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-purple-200">{operator.count}</span>
                          <span className="text-[10px] text-purple-300 ml-1">({operator.percentage}%)</span>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={timeRange === 'Today' || timeRange === 'Yesterday' ? data.hourlyData : data.dailyData}
                  margin={{ top: 0, right: 0, left: -15, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey={timeRange === 'Today' || timeRange === 'Yesterday' ? 'hour' : 'date'}
                    stroke="#9CA3AF"
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    width={30}
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
    </WidgetCard>
  );
});