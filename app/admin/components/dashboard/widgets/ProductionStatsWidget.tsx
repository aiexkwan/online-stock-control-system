/**
 * Production Stats Widget - Server Actions Version
 * 用於 Admin Dashboard 的生產統計組件
 * 使用 Server Actions 替代 GraphQL
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';

interface ProductionStatsWidgetProps extends WidgetComponentProps {
  title: string;
  metric: 'pallet_count' | 'quantity_sum';
}

export const ProductionStatsWidget: React.FC<ProductionStatsWidgetProps> = ({ 
  title, 
  metric,
  timeFrame,
  isEditMode
}) => {
  const [statValue, setStatValue] = useState(0);
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
              dataSource: 'production_stats',
              staticValue: metric, // Use staticValue for metric
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
            console.error('[ProductionStatsWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setStatValue(0);
            return;
          }

          const productionValue = widgetData.data.value || 0;
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductionStatsWidget] API returned value:', productionValue);
          console.log('[ProductionStatsWidget] Metadata:', widgetMetadata);

          setStatValue(productionValue);
          setMetadata(widgetMetadata);

        } else {
          console.warn('[ProductionStatsWidget] No widget data returned from API');
          setStatValue(0);
        }
      } catch (err) {
        console.error('[ProductionStatsWidget] Error fetching data from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, metric, isEditMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col relative"
    >
      
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <CubeIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="space-y-2 w-full">
            <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 bg-slate-700/30 rounded animate-pulse w-2/3" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center">
            Error loading data: {error}
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {statValue.toLocaleString()}
            </motion.div>
            <p className="text-xs text-slate-400">
              {metric === 'pallet_count' ? 'Pallets produced' : 'Total quantity'}
            </p>
            {metadata.rpcFunction && (
              <p className="text-xs text-green-400/70 mt-1">
                ✓ Server optimized
              </p>
            )}
          </div>
        )}
      </CardContent>
    </motion.div>
  );
};