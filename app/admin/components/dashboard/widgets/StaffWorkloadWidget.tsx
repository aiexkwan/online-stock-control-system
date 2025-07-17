/**
 * Staff Workload Widget - REST API Version
 * 顯示員工工作量折線圖
 * 
 * v1.4 GraphQL Cleanup:
 * - 完全移除 GraphQL 代碼
 * - 使用純 REST API 調用
 * - 簡化代碼結構
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { WidgetSkeleton } from './common/WidgetStates';

interface StaffWorkloadWidgetProps extends WidgetComponentProps {
  title: string;
  department?: string;
}

// 顏色配置
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green  
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#64748B', // gray
  '#EC4899', // pink
  '#6366F1'  // indigo
];

export const StaffWorkloadWidget: React.FC<StaffWorkloadWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  department = 'Injection',
  widget
}) => {
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用過去7天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      return {
        start: startDate,
        end: endDate,
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame as string]);

  // API 狀態管理
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    if (isEditMode) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            params: {
              dataSource: 'staff_workload',
              staticValue: department,
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 }, // 5分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[StaffWorkloadWidget as string] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setChartData([]);
            return;
          }

          const workloadData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[StaffWorkloadWidget as string] API returned data:', workloadData);
          console.log('[StaffWorkloadWidget as string] Metadata:', widgetMetadata);

          // 處理數據格式 - 轉換為 Recharts 需要的格式
          const processedData = processWorkloadData(workloadData);
          setChartData(processedData);
          setMetadata({ ...widgetMetadata, useGraphQL: false });

        } else {
          console.warn('[StaffWorkloadWidget as string] No widget data returned from API');
          setChartData([]);
        }
      } catch (err) {
        console.error('[StaffWorkloadWidget as string] Error fetching data from API:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, department, isEditMode]);

  // 處理工作量數據
  const processWorkloadData = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return [];

    // 按日期分組
    const dateGroups = new Map<string, any>();
    const staffNames = new Set<string>();

    rawData.forEach(item => {
      const dateKey = format(new Date(item.work_date), 'MMM d');
      staffNames.add(item.staff_name);
      
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, { date: dateKey });
      }
      
      dateGroups.get(dateKey)![item.staff_name] = item.action_count;
    });

    // 轉換為數組並補充缺失的員工數據
    const processedData = Array.from(dateGroups.values()).map((dayData: any) => {
      const completeData = { ...dayData };
      staffNames.forEach(name => {
        if (!(name in completeData)) {
          completeData[name as string] = 0;
        }
      });
      return completeData;
    });

    // 按日期排序
    return processedData.sort((a, b) => {
      const dateA = new Date(a.date + ', 2025');
      const dateB = new Date(b.date + ', 2025');
      return dateA.getTime() - dateB.getTime();
    });
  };

  // 獲取員工名單
  const staffNames = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const names = new Set<string>();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          names.add(key);
        }
      });
    });
    
    return Array.from(names).sort();
  }, [chartData as string]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.dataKey}: <span className="font-semibold">{item.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col relative"
    >
      
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          {department} Department - From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
          <span className="text-green-400/70 ml-2">
            ✓ REST API
          </span>
        </p>
      </CardHeader>
      
      <div className="flex-1 p-4">
        {loading ? (
          <WidgetSkeleton type="chart-bar" height={150} />
        ) : error ? (
          <div className="text-red-400 text-sm text-center h-full flex items-center justify-center">
            Error loading data: {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center">
            No workload data available for {department} department
          </div>
        ) : (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {staffNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            {metadata?.rpcFunction && (
              <p className="text-xs text-green-400/70 mt-2 text-center">
                ✓ REST API optimized ({metadata.rpcFunction})
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StaffWorkloadWidget;