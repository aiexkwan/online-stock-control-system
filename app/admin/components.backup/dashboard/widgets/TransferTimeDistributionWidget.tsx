/**
 * Transfer Time Distribution Widget
 * 以線形圖顯示 transfer done 的時間分布
 * REST API 版本，已移除所有 GraphQL 相關代碼
 */

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfHour, addHours } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetStyles } from '@/app/utils/widgetStyles';
// GraphQL imports removed - using REST API only
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { ChartContainer, LineChartSkeleton } from './common';

// GraphQL query removed - using REST API only

interface TimeDistributionData {
  timeSlots: Array<{
    time: string;
    value: number;
    fullTime: string;
  }>;
  totalTransfers: number;
  optimized?: boolean;
  calculationTime?: string;
  peakHour?: string;
}

export const TransferTimeDistributionWidget = React.memo(function TransferTimeDistributionWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  // Progressive Loading
  const [ref, isInViewport] = useInViewport<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      const range = getYesterdayRange();
      return {
        start: new Date(range.start),
        end: new Date(range.end),
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  // 使用 REST API 獲取數據
  const [apiData, setApiData] = useState<{ timeSlots: any[]; totalTransfers: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (isEditMode || !isInViewport) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dashboardAPI = createDashboardAPI();
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: ['transfer_time_distribution'],
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
        },
        {
          strategy: 'client',
          cache: { ttl: 300 }, // 5-minute cache
        }
      );

      const widgetData = dashboardResult.widgets?.find(
        w => w.widgetId === 'transfer_time_distribution'
      );

      if (widgetData && !widgetData.data.error) {
        const timeSlots = widgetData.data.value || [];
        const totalTransfers = timeSlots.reduce((sum: number, slot: any) => sum + (slot.value || 0), 0);
        
        setApiData({
          timeSlots,
          totalTransfers,
        });
      } else {
        throw new Error(widgetData?.data.error || 'No data received');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, isEditMode, isInViewport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 處理數據 - 使用 REST API 的結果
  const data = useMemo<TimeDistributionData>(() => {
    if (!apiData) {
      return { timeSlots: [], totalTransfers: 0 };
    }

    const { timeSlots, totalTransfers } = apiData;
    
    // 找出高峰時段
    let peakHour = '';
    let maxValue = 0;
    timeSlots.forEach((slot: any) => {
      if (slot.value > maxValue) {
        maxValue = slot.value;
        peakHour = slot.time;
      }
    });

    return {
      timeSlots,
      totalTransfers,
      peakHour,
      optimized: true,
    };
  }, [apiData]);

  // 當不在視窗中時顯示 skeleton
  if (!isInViewport && !isEditMode) {
    return (
      <div ref={ref}>
        <LineChartSkeleton
          title="Transfer Time Distribution"
          icon={ChartBarIcon}
        />
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div ref={ref}>
        <LineChartSkeleton
          title="Transfer Time Distribution"
          icon={ChartBarIcon}
        />
      </div>
    );
  }

  const chartContent = (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={data.timeSlots} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
        <XAxis
          dataKey='time'
          stroke='#94a3b8'
          fontSize={10}
          angle={-45}
          textAnchor='end'
          height={60}
        />
        <YAxis stroke='#94a3b8' fontSize={11} width={30} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelFormatter={label => `Time: ${label}`}
          formatter={(value: any) => [value, 'Transfers']}
        />
        <Line
          type='monotone'
          dataKey='value'
          stroke='#3b82f6'
          strokeWidth={2}
          dot={false} // No dots as requested
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div ref={ref}>
      <ChartContainer
        title="Transfer Time Distribution"
        icon={ChartBarIcon}
        loading={loading}
        error={error}
        isEmpty={data.timeSlots.length === 0}
        emptyMessage="No transfers found in this time period"
        dateRange={`${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`}
        performanceMetrics={{
          source: 'REST API',
          optimized: data.optimized,
        }}
        metadata={{
          totalTransfers: data.totalTransfers,
          peakHour: data.peakHour,
        }}
        onRefresh={() => {
          fetchData();
        }}
      >
        {chartContent}
      </ChartContainer>
    </div>
  );
});

export default TransferTimeDistributionWidget;
