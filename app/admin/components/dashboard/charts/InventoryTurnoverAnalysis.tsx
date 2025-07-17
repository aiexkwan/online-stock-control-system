'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Recharts components - dynamically imported to avoid SSR issues
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

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
  }, [data]);

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
      <div className={theme.spacing.margin.base}>
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
                      <div className={cn('mt-2', theme.spacing.gap.sm, 'space-y-1')}>
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
              stroke={brandColors.primary}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={cn(
        'mt-4 grid grid-cols-3',
        theme.spacing.gap.md
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