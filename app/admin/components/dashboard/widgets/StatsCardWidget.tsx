/**
 * 統計卡片小部件
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createDashboardAPI } from '@/lib/api';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { systemLogger } from '@/lib/logger';

interface StatsData {
  value: number | string;
  trend?: number;
  label?: string;
}

const StatsCardWidget = React.memo(function StatsCardWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const [data, setData] = useState<StatsData>({ value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Use new hybrid API for data fetching
      const dashboardAPI = createDashboardAPI();
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: [(widget.config.dataSource as string) || 'statsCard'],
          params: {
            dataSource: widget.config.dataSource as string | undefined,
            staticValue: widget.config.staticValue as string | number | undefined,
            label: widget.config.label as string | undefined,
          },
        },
        {
          strategy: 'client', // Force client strategy for client components (per Re-Structure-5.md)
          cache: { ttl: 60 }, // 1-minute cache for stats
        }
      );

      // Extract data for this widget
      const widgetData = dashboardResult.widgets?.find(
        w => w.widgetId === widget.config.dataSource || w.widgetId === 'statsCard'
      );

      if (widgetData) {
        setData({
          value: widgetData.data.value || 0,
          label: widgetData.data.label || widget.config.label || 'Stats',
          trend: widgetData.data.trend,
        });
      } else {
        // Fallback for static values
        setData({
          value: (widget.config.staticValue as string | number) || 0,
          label: (widget.config.label as string) || 'Stats',
        });
      }

      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      systemLogger.error(error, 'Error loading stats with hybrid API');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [widget.config]);

  useWidgetData({ loadFunction: loadData, isEditMode });

  const getIcon = () => {
    switch (widget.config.icon) {
      case 'package':
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
      case 'trending-up':
        return <TrendingUp className={`h-4 w-4 ${iconColors.green}`} />;
      case 'trending-down':
        return <TrendingDown className={`h-4 w-4 ${iconColors.red}`} />;
      case 'alert':
        return <AlertCircle className={`h-4 w-4 ${iconColors.yellow}`} />;
      default:
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
    }
  };

  return (
    <Card
      className={`h-full border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl ${isEditMode ? 'border-2 border-dashed border-blue-500/50' : ''}`}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-sm font-medium text-transparent'>
          {'title' in widget ? widget.title : 'Stats'}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='animate-pulse'>
            <div className='h-8 w-24 rounded bg-slate-700'></div>
            <div className='mt-2 h-4 w-16 rounded bg-slate-700'></div>
          </div>
        ) : error ? (
          <div className='text-sm text-red-400'>{error}</div>
        ) : (
          <>
            <div className='text-2xl font-bold text-white'>{data.value}</div>
            {data.label && <p className='text-xs text-slate-400'>{data.label}</p>}
            {data.trend !== undefined && (
              <p className={`text-xs ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.trend > 0 ? '+' : ''}
                {data.trend}% from last period
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default StatsCardWidget;

/**
 * @deprecated
 * Legacy direct Supabase access has been replaced with hybrid architecture.
 * This component now uses the DashboardAPI for optimal performance.
 * Migration completed on 2025-07-07.
 */
