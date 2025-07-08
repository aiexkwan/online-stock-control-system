/**
 * Top Products Chart Widget - Server Actions Version
 * 顯示產品數量排名條形圖
 * 使用 Server Actions 替代 GraphQL
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';

interface TopProductsChartWidgetProps extends WidgetComponentProps {
  title: string;
  limit?: number;
}

export const TopProductsChartWidget: React.FC<TopProductsChartWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  limit = 10
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用今天
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return {
        start: today,
        end: tomorrow,
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

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
              dataSource: 'top_products',
              limit: limit,
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
            console.error('[TopProductsChartWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setChartData([]);
            return;
          }

          const topProductsData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[TopProductsChartWidget] API returned data:', topProductsData);
          console.log('[TopProductsChartWidget] Metadata:', widgetMetadata);

          setChartData(topProductsData);
          setMetadata(widgetMetadata);

        } else {
          console.warn('[TopProductsChartWidget] No widget data returned from API');
          setChartData([]);
        }
      } catch (err) {
        console.error('[TopProductsChartWidget] Error fetching data from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400">
            Quantity: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
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
          From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
        </p>
      </CardHeader>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="space-y-2 h-full">
            <div className="h-6 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 bg-slate-700/30 rounded animate-pulse" />
            <div className="h-8 bg-slate-700/40 rounded animate-pulse" />
            <div className="h-6 bg-slate-700/30 rounded animate-pulse" />
            <div className="h-4 bg-slate-700/20 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center h-full flex items-center justify-center">
            Error loading data: {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center">
            No data available for the selected period
          </div>
        ) : (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
                  dataKey="name" 
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
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {metadata.rpcFunction && (
              <p className="text-xs text-green-400/70 mt-2 text-center">
                ✓ Server optimized ({metadata.rpcFunction})
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};