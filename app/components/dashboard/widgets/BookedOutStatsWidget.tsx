/**
 * 出貨統計小部件
 * 支援三種尺寸：
 * - Small: 只顯示數值
 * - Medium: 添加時間範圍選擇
 * - Large: 包含圖表視覺化
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

interface BookedOutData {
  today: number;
  yesterday: number;
  past3Days: number;
  pastWeek: number;
  dailyData?: Array<{ date: string; count: number }>;
}

export function BookedOutStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<BookedOutData>({
    today: 0,
    yesterday: 0,
    past3Days: 0,
    pastWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(widget.config.timeRange || 'Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const size = widget.config.size || WidgetSize.SMALL;

  useEffect(() => {
    loadData();
    
    if (widget.config.refreshInterval) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config]);

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
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get today's count
      const { count: todayCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', today.toISOString());

      // Get yesterday's count
      const { count: yesterdayCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', yesterday.toISOString())
        .lt('tran_date', today.toISOString());

      // Get past 3 days count
      const { count: past3DaysCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', threeDaysAgo.toISOString());

      // Get past week count
      const { count: pastWeekCount } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .gte('tran_date', weekAgo.toISOString());

      // Get daily data for large size
      let dailyData = [];
      if (size === WidgetSize.LARGE && timeRange === 'This week') {
        const { data: weekRecords } = await supabase
          .from('record_transfer')
          .select('tran_date')
          .gte('tran_date', weekAgo.toISOString());

        if (weekRecords) {
          const dayCounts = new Map<string, number>();
          
          // Initialize all days
          for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            dayCounts.set(dateStr, 0);
          }

          // Count transfers per day
          weekRecords.forEach(record => {
            const date = new Date(record.tran_date);
            const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
          });

          dailyData = Array.from(dayCounts.entries()).reverse().map(([date, count]) => ({
            date,
            count
          }));
        }
      }

      setData({
        today: todayCount || 0,
        yesterday: yesterdayCount || 0,
        past3Days: past3DaysCount || 0,
        pastWeek: pastWeekCount || 0,
        dailyData
      });
      setError(null);
    } catch (err: any) {
      console.error('Error loading booked out data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = () => {
    switch (timeRange) {
      case 'Today': return data.today;
      case 'Yesterday': return data.yesterday;
      case 'Past 3 days': return data.past3Days;
      case 'This week': return data.pastWeek;
      default: return data.today;
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
    loadData(); // Reload data for new time range
  };

  // Small size - only show number
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-2">
            <TruckIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Booked Out</h3>
          {loading ? (
            <div className="h-12 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error</div>
          ) : (
            <div className="text-4xl font-bold text-white">{getCurrentValue()}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium size - add time selector
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-200">Booked Out</CardTitle>
            </div>
            
            {/* Time Range Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
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
            <div className="h-16 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{getCurrentValue()}</div>
              <p className="text-xs text-slate-400">
                {timeRange === 'Today' && `Yesterday: ${data.yesterday}`}
                {timeRange === 'Yesterday' && `Today: ${data.today}`}
                {timeRange === 'Past 3 days' && `Average: ${Math.round(data.past3Days / 3)}/day`}
                {timeRange === 'This week' && `Average: ${Math.round(data.pastWeek / 7)}/day`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - add chart
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-green-300 via-emerald-300 to-green-200 bg-clip-text text-transparent">
              Booked Out Pallets
            </CardTitle>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
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
      <CardContent>
        {loading ? (
          <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-white">{getCurrentValue()}</div>
              <p className="text-sm text-slate-400 mt-1">Pallets Transferred</p>
            </div>
            
            {timeRange === 'This week' && data.dailyData && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
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
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Today</p>
                <p className="text-lg font-semibold text-white">{data.today}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Yesterday</p>
                <p className="text-lg font-semibold text-white">{data.yesterday}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}