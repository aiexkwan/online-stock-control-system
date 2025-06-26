/**
 * Warehouse Work Level Area Chart Widget
 * Area Chart 形式顯示 work_level 內容
 * 只顯示 operator department = "Warehouse"
 * 顯示 move 數據
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';

interface WorkLevelData {
  date: string;
  totalMoves: number;
  operators: { name: string; moves: number }[];
}

export const WarehouseWorkLevelAreaChart = React.memo(function WarehouseWorkLevelAreaChart({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      try {
        const supabase = createClient();
        
        // 先查詢 work_level 記錄
        const { data: workData, error: workError } = await supabase
          .from('work_level')
          .select('id, move, latest_update')
          .gte('latest_update', dateRange.start.toISOString())
          .lte('latest_update', dateRange.end.toISOString())
          .order('latest_update', { ascending: true });

        if (workError) throw workError;
        if (!workData || workData.length === 0) {
          setChartData([]);
          return;
        }

        // 獲取唯一的 operator IDs
        const operatorIds = [...new Set(workData.map(w => w.id).filter(id => id != null))];
        
        // 查詢 operator 資料 - 注意 select 語法唔使有空格
        const { data: operatorData, error: operatorError } = await supabase
          .from('data_id')
          .select('id,name,department')
          .in('id', operatorIds);
          
        if (operatorError) throw operatorError;
        
        // 建立 operator ID 到資料的映射
        const operatorMap = new Map(
          (operatorData || []).map(op => [op.id, op])
        );
        
        // 過濾只顯示倉庫部門的記錄
        const warehouseWork = workData
          .filter(work => {
            const operator = operatorMap.get(work.id);
            return operator?.department === 'Warehouse';
          });

        // 按日期分組數據
        const dateMap = new Map<string, WorkLevelData>();
        
        // 獲取日期範圍內的所有日期
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        
        // 初始化每個日期
        days.forEach(day => {
          const dateStr = format(day, 'MMM d');
          dateMap.set(dateStr, {
            date: dateStr,
            totalMoves: 0,
            operators: []
          });
        });

        // 處理實際數據
        warehouseWork.forEach((work: any) => {
          const workDate = format(parseISO(work.latest_update), 'MMM d');
          
          if (!dateMap.has(workDate)) {
            dateMap.set(workDate, {
              date: workDate,
              totalMoves: 0,
              operators: []
            });
          }
          
          const dayData = dateMap.get(workDate)!;
          dayData.totalMoves += work.move || 0;
          
          // 添加操作員數據
          const operator = operatorMap.get(work.id);
          dayData.operators.push({
            name: operator?.name || 'Unknown',
            moves: work.move || 0
          });
        });

        // 轉換為圖表數據格式
        const chartDataArray = Array.from(dateMap.values()).map(dayData => ({
          date: dayData.date,
          value: dayData.totalMoves,
          operators: dayData.operators.length,
          details: dayData.operators
        }));

        setChartData(chartDataArray);
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
          <p className="text-gray-400">Warehouse Work Level Chart</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Warehouse Work Level
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            Move activities by day
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
          ) : chartData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
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
            </motion.div>
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});