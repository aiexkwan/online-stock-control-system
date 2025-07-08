/**
 * Product Distribution Chart Widget - Server Actions Version
 * 顯示產品分佈圓餅圖
 * 使用 Server Actions 替代 GraphQL
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';

interface ProductDistributionChartWidgetProps extends WidgetComponentProps {
  title: string;
  limit?: number;
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

export const ProductDistributionChartWidget: React.FC<ProductDistributionChartWidgetProps> = ({ 
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
              dataSource: 'product_distribution',
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
            console.error('[ProductDistributionChartWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setChartData([]);
            return;
          }

          const distributionData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductDistributionChartWidget] API returned data:', distributionData);
          console.log('[ProductDistributionChartWidget] Metadata:', widgetMetadata);

          setChartData(distributionData);
          setMetadata(widgetMetadata);

        } else {
          console.warn('[ProductDistributionChartWidget] No widget data returned from API');
          setChartData([]);
        }
      } catch (err) {
        console.error('[ProductDistributionChartWidget] Error fetching data from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode]);

  // 計算總數
  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.payload.name}</p>
          <p className="text-blue-400">
            Quantity: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-green-400">
            Percentage: <span className="font-semibold">{percentage}%</span>
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
          <ChartPieIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
        </p>
      </CardHeader>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="space-y-2 h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-slate-700/50 rounded-full animate-pulse" />
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
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-xs text-slate-300">
                      {value} ({((entry.payload.value / total) * 100).toFixed(1)}%)
                    </span>
                  )}
                />
              </PieChart>
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