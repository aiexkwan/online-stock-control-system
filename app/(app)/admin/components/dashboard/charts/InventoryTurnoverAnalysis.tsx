'use client';

import React, { useMemo } from 'react';

// Recharts components - using unified dynamic import module
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/lib/recharts-dynamic';

// Note: Migrated to REST API - GraphQL hooks removed
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
import { componentSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface InventoryTurnoverAnalysisProps {
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

export default function InventoryTurnoverAnalysis({ timeFrame }: InventoryTurnoverAnalysisProps) {
  // Feature flag removed - using REST API only

  // Temporary disabled - migrated to REST API
  const data = null;
  const loading = false;
  const error = null;

  const chartData = useMemo(() => {
    // TODO: Replace GraphQL - migrated to REST API
    return [];
  }, []);

  if (loading) {
    return (
      <div className='flex h-full w-full flex-col space-y-4'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-[300px] w-full' />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Failed to load turnover data: {(error as { message: string }).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <div className={cn(spacingUtilities.margin.bottom.medium)}>
        <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
          Inventory Turnover = Order Demand ÷ Current Inventory (higher ratio indicates higher
          demand)
        </p>
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='code' />
            <YAxis />
            <Tooltip
              // @types-migration:todo(phase3) [P2] 使用 recharts TooltipProps 完整接口 - Target: 2025-08 - Owner: @frontend-team
              content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                if (active && Array.isArray(payload) && payload.length > 0 && payload[0]?.payload) {
                  const payloadData = payload[0].payload;
                  const data = payloadData as {
                    code: string;
                    inventory: number;
                    demand: number;
                    turnoverRatio: number;
                    status: string;
                  };
                  return (
                    <div
                      className={cn(
                        'rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur-sm',
                        'border-border'
                      )}
                    >
                      <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>
                        {String(data.code)}
                      </p>
                      <div className={cn('mt-2 space-y-1')}>
                        <p
                          className={cn(textClasses['label-small'])}
                          style={{ color: widgetColors.charts.text }}
                        >
                          Inventory: {Number(data.inventory)}
                        </p>
                        <p
                          className={cn(textClasses['label-small'])}
                          style={{ color: semanticColors.warning.DEFAULT }}
                        >
                          Demand: {Number(data.demand)}
                        </p>
                        <p
                          className={cn(textClasses['label-small'], 'font-medium text-foreground')}
                        >
                          Turnover Rate: {Number(data.turnoverRatio)}
                        </p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                          Status:{' '}
                          {data.status === 'high-demand'
                            ? 'High Demand'
                            : data.status === 'overstocked'
                              ? 'Overstocked'
                              : 'Balanced'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type='monotone'
              dataKey='turnoverRatio'
              stroke={brandColors.primary[500]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={cn('mt-4 grid grid-cols-3 gap-4')}>
        <div className='text-center'>
          <div
            className={cn(textClasses['label-small'], 'font-medium')}
            style={{ color: semanticColors.error.DEFAULT }}
          >
            High Demand Products
          </div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>
            {
              chartData.filter(
                (d: Record<string, unknown>) => (d as { status: string }).status === 'high-demand'
              ).length
            }{' '}
            items
          </div>
        </div>
        <div className='text-center'>
          <div
            className={cn(textClasses['label-small'], 'font-medium')}
            style={{ color: semanticColors.success.DEFAULT }}
          >
            Balanced Supply
          </div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>
            {
              chartData.filter(
                (d: Record<string, unknown>) => (d as { status: string }).status === 'balanced'
              ).length
            }{' '}
            items
          </div>
        </div>
        <div className='text-center'>
          <div
            className={cn(textClasses['label-small'], 'font-medium')}
            style={{ color: semanticColors.warning.DEFAULT }}
          >
            Overstocked
          </div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>
            {
              chartData.filter(
                (d: Record<string, unknown>) => (d as { status: string }).status === 'overstocked'
              ).length
            }{' '}
            items
          </div>
        </div>
      </div>
    </div>
  );
}
