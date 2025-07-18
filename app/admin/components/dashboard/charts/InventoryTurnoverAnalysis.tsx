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
  ResponsiveContainer
} from '@/lib/recharts-dynamic';

// Note: Migrated to REST API - GraphQL hooks removed
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { componentSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface InventoryTurnoverAnalysisProps {
  timeFrame?: any;
}

export default function InventoryTurnoverAnalysis({ timeFrame }: InventoryTurnoverAnalysisProps) {
  // Check feature flag
  const isGraphQLAnalysisEnabled = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS === 'true';

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
      <div className="flex h-full w-full flex-col space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load turnover data: {(error as { message: string }).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className={cn(spacingUtilities.margin.bottom.medium)}>
        <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
          Inventory Turnover = Order Demand ÷ Current Inventory (higher ratio indicates higher
          demand)
        </p>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="code" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className={cn(
                      'rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur-sm',
                      'border-border'
                    )}>
                      <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>{data.code}</p>
                      <div className={cn('mt-2 space-y-1')}>
                        <p className={cn(textClasses['label-small'])} style={{ color: widgetColors.charts.text }}>Inventory: {data.inventory}</p>
                        <p className={cn(textClasses['label-small'])} style={{ color: semanticColors.warning.DEFAULT }}>Demand: {data.demand}</p>
                        <p className={cn(textClasses['label-small'], 'font-medium text-foreground')}>Turnover Rate: {data.turnoverRatio}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                          Status:{' '}
                          {(data as { status: string }).status === 'high-demand'
                            ? 'High Demand'
                            : (data as { status: string }).status === 'overstocked'
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
              type="monotone"
              dataKey="turnoverRatio"
              stroke={brandColors.primary[500]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={cn(
        'mt-4 grid grid-cols-3 gap-4'
      )}>
        <div className="text-center">
          <div className={cn(textClasses['label-small'], 'font-medium')} style={{ color: semanticColors.error.DEFAULT }}>High Demand Products</div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>{chartData.filter((d: any) => (d as { status: string }).status === 'high-demand').length} items</div>
        </div>
        <div className="text-center">
          <div className={cn(textClasses['label-small'], 'font-medium')} style={{ color: semanticColors.success.DEFAULT }}>Balanced Supply</div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>{chartData.filter((d: any) => (d as { status: string }).status === 'balanced').length} items</div>
        </div>
        <div className="text-center">
          <div className={cn(textClasses['label-small'], 'font-medium')} style={{ color: semanticColors.warning.DEFAULT }}>Overstocked</div>
          <div className={cn(textClasses['label-small'], 'text-foreground')}>{chartData.filter((d: any) => (d as { status: string }).status === 'overstocked').length} items</div>
        </div>
      </div>
    </div>
  );
}