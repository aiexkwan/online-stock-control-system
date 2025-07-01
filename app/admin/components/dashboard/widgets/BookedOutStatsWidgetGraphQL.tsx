/**
 * Stock Transfer Widget - GraphQL Version
 * 支援三種尺寸：
 * - Small (1x1): 顯示當天 transfer 的總數量
 * - Medium (3x3): 顯示各員工 transfer 的總數量，支援日期範圍選擇
 * - Large (5x5): 包括 3x3 功能 + 折線圖視覺化（上下比例 1:1.5）
 */

'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { TruckIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_TRANSFER_STATS_DETAILED } from '@/lib/graphql/queries';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getTodayRange, getYesterdayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';
import { UnifiedWidgetLayout, TableRow, ChartContainer } from '../UnifiedWidgetLayout';

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

export const BookedOutStatsWidgetGraphQL = React.memo(function BookedOutStatsWidgetGraphQL({ widget, isEditMode }: WidgetComponentProps) {
  const [timeRange, setTimeRange] = useState('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 根據時間範圍設定查詢範圍
  const dateRange = useMemo(() => {
    switch (timeRange) {
      case 'Yesterday':
        return getYesterdayRange();
      case 'Past 3 days':
        return getDateRange(3);
      case 'This week':
        return getDateRange(7);
      default:
        return getTodayRange();
    }
  }, [timeRange]);

  // 使用 GraphQL 查詢 - 使用新的 stable client
  const { data: graphqlData, loading, error, isRefetching } = useGraphQLQuery(
    GET_TRANSFER_STATS_DETAILED,
    {
      startDate: dateRange.start,
      endDate: dateRange.end
    }
  );

  // 處理 GraphQL 數據
  const processedData = useMemo<TransferData>(() => {
    if (!graphqlData) {
      return {
        totalCount: 0,
        operatorData: [],
        dailyData: [],
        hourlyData: []
      };
    }

    const totalCount = graphqlData.transferStats?.edges?.length || 0;
    const transfers = graphqlData.transferRecords?.edges?.map((edge: any) => edge.node) || [];
    
    let operatorData: TransferData['operatorData'] = [];
    let dailyData: TransferData['dailyData'] = [];
    let hourlyData: TransferData['hourlyData'] = [];

    // 統計各操作員的 transfer 數量
    const operatorMap = new Map<string, number>();
    
    transfers.forEach((transfer: any) => {
      const operator = transfer.operator_id || 'Unknown';
      operatorMap.set(operator, (operatorMap.get(operator) || 0) + 1);
    });
    
    operatorData = Array.from(operatorMap.entries())
      .map(([operator_id, count]) => ({
        operator_id,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
      
    // 生成圖表數據
    const isHourlyView = timeRange === 'Today' || timeRange === 'Yesterday';
    
    if (isHourlyView) {
      // 生成小時數據
      const hourMap = new Map<string, number>();
      
      // 初始化所有小時
      for (let i = 0; i < 24; i++) {
        hourMap.set(i.toString().padStart(2, '0'), 0);
      }
      
      transfers.forEach((transfer: any) => {
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
      
      transfers.forEach((transfer: any) => {
        const date = formatDbTime(transfer.tran_date).split(' ')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + 1);
      });
      
      dailyData = Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return {
      totalCount,
      operatorData,
      dailyData,
      hourlyData
    };
  }, [graphqlData, timeRange]);

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


  return (
    <WidgetCard widgetType="TRANSFER_STATS" isEditMode={isEditMode}>
      <div className="relative h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="widget-title bg-gradient-to-r from-green-300 via-emerald-300 to-green-200 bg-clip-text text-transparent">
                Stock Transfer
              </CardTitle>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
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
          {isRefetching && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute top-2 left-2"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {loading && !graphqlData ? (
            <div className="h-64 bg-white/10 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error: {error.message}</div>
          ) : (
            <UnifiedWidgetLayout
              topContent={
                <div className="text-center mb-2">
                  <p className="text-3xl font-bold text-green-300">{processedData.totalCount}</p>
                  <p className="widget-text-sm text-green-400">Total Transfers</p>
                </div>
              }
              tableData={processedData.operatorData}
              renderTableRow={(operator) => (
                <TableRow key={operator.operator_id}>
                  <span className="text-green-200 text-xs">{operator.operator_id}</span>
                  <span className="text-green-200 font-medium text-xs">{operator.count} ({operator.percentage}%)</span>
                </TableRow>
              )}
              tableContent={
                <div className="bg-black/20 rounded-lg p-2 h-full overflow-hidden flex flex-col">
                  <p className="widget-text-sm text-green-400 mb-1 flex-shrink-0">Operator Stats</p>
                  {processedData.operatorData && processedData.operatorData.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1">
                      <div className="space-y-0.5">
                        {processedData.operatorData.slice(0, 5).map((operator) => (
                          <TableRow key={operator.operator_id}>
                            <span className="text-green-200 widget-text-sm">{operator.operator_id}</span>
                            <span className="text-green-200 font-medium widget-text-sm">{operator.count} ({operator.percentage}%)</span>
                          </TableRow>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="widget-text-sm text-slate-500 text-center py-2">No data</div>
                  )}
                </div>
              }
              chartContent={
                <ChartContainer title={timeRange === 'Today' || timeRange === 'Yesterday' ? 'Hourly Distribution' : 'Daily Distribution'}>
                  {(processedData.hourlyData && processedData.hourlyData.length > 0) || (processedData.dailyData && processedData.dailyData.length > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={timeRange === 'Today' || timeRange === 'Yesterday' ? processedData.hourlyData : processedData.dailyData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey={timeRange === 'Today' || timeRange === 'Yesterday' ? 'hour' : 'date'}
                          stroke="#9CA3AF"
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          stroke="#9CA3AF" 
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#E5E7EB'
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
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-slate-500">No chart data available</p>
                    </div>
                  )}
                </ChartContainer>
              }
            />
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});