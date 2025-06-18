/**
 * Void Statistics Widget
 * 支援三種尺寸：
 * - Small (1x1): 只顯示細文字及當天損毀總數
 * - Medium (3x3): 顯示損毀統計資料列表
 * - Large (5x5): 完整統計包括圖表
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { format, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VoidData {
  id: string;
  created_at: string;
  plt_num: string;
  product_code?: string;
  damage_qty: number;
  reason?: string;
}

interface ChartData {
  date: string;
  count: number;
}

export function VoidStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;
  const [loading, setLoading] = useState(true);
  const [voidData, setVoidData] = useState<VoidData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const timeRangeOptions = size === WidgetSize.LARGE 
    ? ['Today', 'Yesterday', 'Last Week', 'Last Month']
    : ['Today'];

  useEffect(() => {
    fetchVoidData();
  }, [timeRange, size]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDateRange = () => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (timeRange) {
      case 'Today':
        return { start: today, end: endOfDay(now) };
      case 'Yesterday':
        const yesterday = subDays(today, 1);
        return { start: yesterday, end: endOfDay(yesterday) };
      case 'Last Week':
        return { start: subDays(today, 7), end: now };
      case 'Last Month':
        return { start: subMonths(today, 1), end: now };
      default:
        return { start: today, end: endOfDay(now) };
    }
  };

  const fetchVoidData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { start, end } = getDateRange();
      
      // 獲取 void 記錄
      const { data: voidRecords, error: voidError } = await supabase
        .from('report_void')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (voidError) throw voidError;

      if (voidRecords && voidRecords.length > 0) {
        // 獲取對應的 product codes
        const pltNums = voidRecords.map(v => v.plt_num);
        const { data: palletInfo, error: palletError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code')
          .in('plt_num', pltNums);

        if (palletError) throw palletError;

        // 合併數據
        const palletMap = new Map(palletInfo?.map(p => [p.plt_num, p.product_code]) || []);
        const enrichedData = voidRecords.map(v => ({
          ...v,
          product_code: palletMap.get(v.plt_num) || 'Unknown',
          damage_qty: v.damage_qty || 1
        }));

        setVoidData(enrichedData);
        setTotalCount(enrichedData.reduce((sum, item) => sum + item.damage_qty, 0));

        // 準備圖表數據 (for Large size)
        if (size === WidgetSize.LARGE && (timeRange === 'Last Week' || timeRange === 'Last Month')) {
          prepareChartData(enrichedData);
        }
      } else {
        setVoidData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching void data:', error);
      setVoidData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (data: VoidData[]) => {
    const chartMap = new Map<string, number>();
    
    if (timeRange === 'Last Week') {
      // 按天分組
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        chartMap.set(date, 0);
      }
      
      data.forEach(item => {
        const date = format(new Date(item.created_at), 'MMM dd');
        chartMap.set(date, (chartMap.get(date) || 0) + item.damage_qty);
      });
    } else if (timeRange === 'Last Month') {
      // 按每4天分組
      const today = new Date();
      for (let i = 7; i >= 0; i--) {
        const startDate = subDays(today, (i + 1) * 4 - 1);
        const label = format(startDate, 'MMM dd');
        chartMap.set(label, 0);
      }
      
      data.forEach(item => {
        const itemDate = new Date(item.created_at);
        const daysDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        const groupIndex = Math.floor(daysDiff / 4);
        const startDate = subDays(today, (groupIndex + 1) * 4 - 1);
        const label = format(startDate, 'MMM dd');
        chartMap.set(label, (chartMap.get(label) || 0) + item.damage_qty);
      });
    }
    
    setChartData(Array.from(chartMap.entries()).map(([date, count]) => ({ date, count })));
  };

  // Small size (1x1) - 只顯示文字和數據
  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType="VOID_STATS" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Voids</h3>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold text-red-400">{totalCount}</div>
              <p className="text-xs text-slate-500">Today</p>
            </>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Medium size (3x3) - 顯示損毀統計資料列表
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType="VOID_STATS" isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Void Statistics</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-white/10 rounded animate-pulse"></div>
              ))}
            </div>
          ) : voidData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No void records today</p>
          ) : (
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {voidData.slice(0, 10).map((item) => (
                <div key={item.id} className="text-xs text-purple-300 py-1">
                  {format(new Date(item.created_at), 'HH:mm')} - {item.product_code} - {item.damage_qty}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size (5x5) - 完整功能包括圖表
  return (
    <WidgetCard size={widget.config.size} widgetType="VOID_STATS" isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-200">Void Statistics</CardTitle>
          
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
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTimeRange(option);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        timeRange === option ? 'bg-white/10 text-white' : 'text-slate-300'
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
      
      <CardContent className="flex-1 flex flex-col pt-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-white/10 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* 數據表 (1/3) */}
            <div className="flex-1 mb-2">
              {/* Column Headers */}
              <div className="flex items-center justify-between px-2 py-1 bg-black/20 rounded-t text-xs font-semibold text-purple-400 mb-1">
                <span className="flex-1">Time</span>
                <span className="w-24 text-center">Product</span>
                {timeRange !== 'Today' && timeRange !== 'Yesterday' && <span className="w-20 text-center">Reason</span>}
                <span className="w-16 text-right">Qty</span>
              </div>
              
              {/* Data Rows */}
              <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                {voidData.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No void records</p>
                ) : (
                  voidData.slice(0, 20).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-purple-200 py-0.5 px-2 hover:bg-white/5 rounded">
                      <span className="flex-1">{format(new Date(item.created_at), 'HH:mm')}</span>
                      <span className="w-24 text-center truncate">{item.product_code}</span>
                      {timeRange !== 'Today' && timeRange !== 'Yesterday' && <span className="w-20 text-center truncate">{item.reason || '-'}</span>}
                      <span className="w-16 text-right">{item.damage_qty}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 圖表 (2/3) - 只在 Last Week 或 Last Month 時顯示 */}
            {(timeRange === 'Last Week' || timeRange === 'Last Month') && (
              <div className="flex-[2] min-h-0">
                <div className="h-full border-t border-slate-700 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </WidgetCard>
  );
}