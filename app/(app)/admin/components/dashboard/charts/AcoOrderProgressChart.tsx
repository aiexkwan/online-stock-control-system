'use client';

import React, { useMemo } from 'react';

// 定義 Recharts Tooltip Payload 類型
interface TooltipPayloadItem {
  dataKey?: string;
  value?: unknown;
  payload?: {
    orderRef: string;
    code: string;
    completed: number;
    total: number;
    percentage: number;
  };
  color?: string;
}
import useSWR from 'swr';

// Recharts components - using unified dynamic import module
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';

interface AcoOrderProgressChartProps {
  timeFrame?: TimeFrame;
}

interface ChartDataPoint {
  date: string;
  value: number;
  previousValue?: number;
  metadata?: {
    orderCount: number;
    completedCount: number;
  };
}

interface ChartConfig {
  type: string;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  colors: string[];
  height: number;
}

interface AcoOrderProgressChartResponse {
  data: ChartDataPoint[];
  config: ChartConfig;
  totalDataPoints: number;
  dateRange: string;
  summary: {
    average: number;
    minimum: number;
    maximum: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  lastUpdated: string;
  queryParams: {
    timeframe: string;
    metric: string;
    warehouse: string;
    status: string;
    customerRef: string;
  };
}

export default function AcoOrderProgressChart({ timeFrame }: AcoOrderProgressChartProps) {
  // Fetcher function for SWR
  const fetcher = async (url: string) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  // Use SWR for ACO order progress chart data
  const {
    data: chartApiData,
    error,
    isLoading,
  } = useSWR<AcoOrderProgressChartResponse>(
    '/api/v1/analysis/aco-order-progress-chart?timeframe=daily&metric=completion_rate&limit=10',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  );

  const chartData = useMemo(() => {
    if (!chartApiData?.data) return [];

    return chartApiData.data.map((point, index) => ({
      orderRef: `Day ${index + 1}`,
      date: point.date,
      completed: point.metadata?.completedCount || 0,
      remaining: (point.metadata?.orderCount || 0) - (point.metadata?.completedCount || 0),
      total: point.metadata?.orderCount || 0,
      completionRate: Math.round(point.value),
    }));
  }, [chartApiData]);

  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col gap-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='flex-1' />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Failed to load order data: {(error as { message: string }).message}
        </AlertDescription>
      </Alert>
    );
  }

  const getBarColor = (completionRate: number) => {
    if (completionRate >= 80) return semanticColors.success.DEFAULT;
    if (completionRate >= 50) return semanticColors.warning.DEFAULT;
    return semanticColors.error.DEFAULT;
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <div className={cn(spacingUtilities.margin.bottom.medium)}>
        <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
          {chartApiData?.config?.title || 'ACO Order Completion Progress'}
        </p>
        {chartApiData?.summary && (
          <p className={cn(textClasses['label-small'], 'mt-1 text-muted-foreground')}>
            Average: {chartApiData.summary.average.toFixed(1)}% • Trend:{' '}
            {chartApiData.summary.trend} • {chartApiData.dateRange}
          </p>
        )}
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
            <XAxis dataKey='orderRef' angle={-45} textAnchor='end' height={80} fontSize={12} />
            <YAxis
              label={{
                value: chartApiData?.config?.yAxisLabel || 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px' },
              }}
              domain={[0, 100]}
            />
            <Tooltip
              content={(props: any) => {
                const { active, payload } = props;
                const typedPayload = payload as TooltipPayloadItem[];
                if (active && Array.isArray(typedPayload) && typedPayload.length > 0 && typedPayload[0]?.payload) {
                  const payloadData = typedPayload[0].payload;
                  const data = payloadData as {
                    orderRef: string;
                    code: string;
                    completed: number;
                    total: number;
                    completionRate: number;
                  };
                  return (
                    <div
                      className={cn(
                        'rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur-sm',
                        'border-border'
                      )}
                    >
                      <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>
                        {String(data.orderRef)}
                      </p>
                      <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                        Product: {String(data.code)}
                      </p>
                      <p className={cn(textClasses['label-small'], 'text-foreground')}>
                        Completed: {Number(data.completed)}/{Number(data.total)}
                      </p>
                      <p className={cn(textClasses['label-small'], 'font-medium text-primary')}>
                        Completion Rate: {Number(data.completionRate)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              content={() => (
                <div className={cn('mt-4 flex justify-center gap-4')}>
                  <div className={cn('flex items-center gap-2')}>
                    <div
                      className={cn('h-3 w-3 rounded')}
                      style={{ backgroundColor: semanticColors.success.DEFAULT }}
                    />
                    <span className={cn(textClasses['label-small'], 'text-foreground')}>≥80%</span>
                  </div>
                  <div className={cn('flex items-center gap-2')}>
                    <div
                      className={cn('h-3 w-3 rounded')}
                      style={{ backgroundColor: semanticColors.warning.DEFAULT }}
                    />
                    <span className={cn(textClasses['label-small'], 'text-foreground')}>
                      50-79%
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-2')}>
                    <div
                      className={cn('h-3 w-3 rounded')}
                      style={{ backgroundColor: semanticColors.error.DEFAULT }}
                    />
                    <span className={cn(textClasses['label-small'], 'text-foreground')}>
                      &lt;50%
                    </span>
                  </div>
                </div>
              )}
            />
            <Bar dataKey='completionRate' radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.completionRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
