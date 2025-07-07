/**
 * Warehouse Work Level Area Chart Widget
 * Area Chart 形式顯示 work_level 內容
 * 只顯示 operator department = "Warehouse"
 * 顯示 move 數據
 * 
 * OPTIMIZED VERSION (Phase 2.2)
 * - 解決 N+1 查詢問題
 * - 服務器端 JOIN 和過濾
 * - 移除客戶端數據處理邏輯
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

interface WorkLevelData {
  date: string;
  value: number;
  fullDate?: string;
}

interface WorkLevelStats {
  dailyStats: WorkLevelData[];
  totalMoves: number;
  uniqueOperators: number;
  avgMovesPerDay: number;
  peakDay?: string;
  optimized?: boolean;
  calculationTime?: string;
}

export const WarehouseWorkLevelAreaChart = React.memo(function WarehouseWorkLevelAreaChart({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [data, setData] = useState<WorkLevelStats>({
    dailyStats: [],
    totalMoves: 0,
    uniqueOperators: 0,
    avgMovesPerDay: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fetchTime: number;
    cacheHit: boolean;
  } | null>(null);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      const range = getYesterdayRange();
      return {
        start: new Date(range.start),
        end: new Date(range.end)
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end
    };
  }, [timeFrame]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const fetchStartTime = performance.now();
      
      try {
        // Use optimized DashboardAPI with server-side JOIN and filtering
        const dashboardAPI = createDashboardAPI();
        const dashboardResult = await dashboardAPI.fetch({
          widgetIds: ['warehouse_work_level'],
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        }, { 
          strategy: 'client', // Force client strategy for client components
          cache: { ttl: 180 } // 3-minute cache for work level analysis
        });
        
        const fetchTime = performance.now() - fetchStartTime;
        
        // Extract widget data
        const widgetData = dashboardResult.widgets?.find(
          w => w.widgetId === 'warehouse_work_level'
        );
        
        if (widgetData && !widgetData.data.error) {
          const dailyStats = widgetData.data.value || [];
          
          setData({
            dailyStats,
            totalMoves: widgetData.data.metadata?.totalMoves || 0,
            uniqueOperators: widgetData.data.metadata?.uniqueOperators || 0,
            avgMovesPerDay: widgetData.data.metadata?.avgMovesPerDay || 0,
            peakDay: widgetData.data.metadata?.peakDay,
            optimized: widgetData.data.metadata?.optimized,
            calculationTime: widgetData.data.metadata?.calculationTime
          });
          
          setPerformanceMetrics({
            fetchTime,
            cacheHit: dashboardResult.metadata?.cacheHit || false
          });
        } else {
          throw new Error(widgetData?.data.error || 'No data received');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching warehouse work level:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 font-medium">Warehouse Work Level Chart</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Warehouse Work Level
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse h-32 w-full bg-slate-700/50 rounded" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading data</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : data.dailyStats.length === 0 ? (
            <div className="text-center text-slate-400 font-medium py-8">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No work level data found</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.dailyStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} moves`,
                        'Total Moves'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Performance and metadata indicators */}
                {data.optimized && (
                  <div className="absolute top-2 right-2 text-xs text-blue-400 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Optimized</span>
                    {performanceMetrics && (
                      <span className="ml-1">({performanceMetrics.fetchTime.toFixed(0)}ms)</span>
                    )}
                  </div>
                )}
                
                {/* Summary stats */}
                <div className="absolute bottom-2 left-2 text-xs text-slate-400 space-y-0.5">
                  <div>Total: {data.totalMoves.toLocaleString()} moves</div>
                  <div>{data.uniqueOperators} operators</div>
                  {data.peakDay && <div>Peak: {data.peakDay}</div>}
                </div>
                
                {data.avgMovesPerDay > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                    Avg: {data.avgMovesPerDay.toFixed(0)} moves/day
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
    </WidgetCard>
  );
});

export default WarehouseWorkLevelAreaChart;

/**
 * @deprecated Legacy implementation with N+1 query problem
 * Migrated to DashboardAPI hybrid architecture on 2025-07-07 (Phase 2.2)
 * 
 * Performance improvements achieved:
 * - Query optimization: 2 separate queries → 1 optimized JOIN query
 * - Server-side filtering: Department filter moved to SQL WHERE clause
 * - Data transfer: All work_level records → Only Warehouse department records
 * - Client processing: Complex Map operations + filtering → None
 * - Network requests: 2 → 1 (50% reduction)
 * - Caching: None → 3-minute TTL with automatic revalidation
 * 
 * N+1 Query Problem Solved:
 * 1. Before: Query work_level → Extract IDs → Query data_id → Client-side JOIN
 * 2. After: Single RPC with SQL JOIN and WHERE department = 'Warehouse'
 * 3. Result: Eliminated unnecessary data transfer and client-side processing
 * 
 * New Features Added:
 * - Peak day detection
 * - Average moves per day calculation
 * - Unique operators count
 * - Performance metrics display
 */