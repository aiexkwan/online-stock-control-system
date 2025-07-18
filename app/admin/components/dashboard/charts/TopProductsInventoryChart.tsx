'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-dynamic';
// Note: Migrated to REST API - GraphQL hooks removed
// Type removed with GraphQL migration
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
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface TopProductsInventoryChartProps {
  timeFrame?: any;
}

export default function TopProductsInventoryChart({ timeFrame }: TopProductsInventoryChartProps) {
  // Check feature flag
  const isGraphQLAnalysisEnabled = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS === 'true';

  // Temporary disabled - migrated to REST API
  const data = null;
  const loading = false;
  const error = null;

  const chartData = useMemo(() => {
// TODO: Replace GraphQL -     // TODO: Replace GraphQL - if (!data?.record_inventoryCollection?.edges) return [];

    // Group by product code and sum up inventories
    const productMap = new Map();

    // TODO: Replace GraphQL
// TODO: Replace GraphQL -     // data.record_inventoryCollection.edges.forEach(({ node }: { node: NonNullable<GetTopProductsInventoryQuery['record_inventoryCollection']>['edges'][0]['node'] }) => {
    //   const code = node.product_code;
    //
    //   if (productMap.has(code)) {
    //     // Sum existing values
    //     const existing = productMap.get(code);
    //     existing.await += node.await || 0;
    //     existing.await_grn += node.await_grn || 0;
    //     existing.backcarpark += node.backcarpark || 0;
    //     existing.bulk += node.bulk || 0;
    //     existing.fold += node.fold || 0;
    //     existing.injection += node.injection || 0;
    //     existing.pipeline += node.pipeline || 0;
    //     existing.prebook += node.prebook || 0;
    //     existing.damage += node.damage || 0;
    //   } else {
    //     // Create new entry
    //     productMap.set(code, {
    //       code: node.product_code,
    //       description: node.data_code?.description || node.product_code,
    //       colour: node.data_code?.colour || 'N/A',
    //       await: node.await || 0,
    //       await_grn: node.await_grn || 0,
    //       backcarpark: node.backcarpark || 0,
    //       bulk: node.bulk || 0,
    //       fold: node.fold || 0,
    //       injection: node.injection || 0,
    //       pipeline: node.pipeline || 0,
    //       prebook: node.prebook || 0,
    //       damage: node.damage || 0,
    //     });
    //   }
    // });

    // Calculate totals and prepare chart data
    const productTotals = Array.from(productMap.values()).map((item: any) => {
      const total =
        item.await +
        item.await_grn +
        item.backcarpark +
        item.bulk +
        item.fold +
        item.injection +
        item.pipeline +
        item.prebook +
        item.damage;

      return {
        code: item.code,
        description: item.description,
        colour: item.colour,
        total,
        await: item.await,
        bulk: item.bulk,
        fold: item.fold,
        damage: item.damage,
        other: item.await_grn + item.backcarpark + item.injection + item.pipeline + item.prebook,
      };
    });

    // Sort by total and take top 10
    return productTotals.sort((a, b) => b.total - a.total).slice(0, 10);
  }, []);

  // If feature flag is disabled, show disabled state
  if (!isGraphQLAnalysisEnabled) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>GraphQL analysis is currently disabled.</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
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
        <AlertDescription>Failed to load inventory data: {(error as { message: string }).message}</AlertDescription>
      </Alert>
    );
  }

  // Generate colors for bars using design system
  const colors = [
    widgetColors.charts.primary,
    widgetColors.charts.secondary,
    widgetColors.charts.accent,
    semanticColors.warning.DEFAULT,
    semanticColors.success.DEFAULT,
    semanticColors.info.DEFAULT,
    semanticColors.destructive.DEFAULT,
    brandColors.primary[500],
    brandColors.secondary[500],
    widgetColors.charts.accent,
  ];

  return (
    <div className='flex h-full w-full flex-col'>
      <div className={spacingUtilities.margin.bottom.medium}>
        <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>Showing top 10 products by inventory quantity</p>
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout='horizontal'
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
            <XAxis
              type='number'
              label={{
                value: 'Inventory Quantity',
                position: 'insideBottom',
              }}
            />
            <YAxis dataKey='code' type='category' width={90} tick={{ fontSize: '12px' }} />
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
                      <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>{data.description}</p>
                      <p className={cn(textClasses['label-small'], 'text-foreground')}>Color: {data.colour}</p>
                      <div className={cn('mt-2', 'space-y-1')}>
                        <p className={cn(textClasses['label-small'], 'font-medium text-foreground')}>Total Stock: {data.total}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Await: {data.await}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Bulk: {data.bulk}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Fold: {data.fold}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Damage: {data.damage}</p>
                        <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Other: {data.other}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey='total' radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={cn(
        'mt-4 grid grid-cols-2 gap-2'
      )}>
        {chartData.slice(0, 4).map((item, index) => (
          <div key={`legend-${item.code}-${index}`} className={cn('flex items-center gap-2')}>
            <div
              className='h-3 w-3 rounded'
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className={cn(textClasses['label-small'], 'truncate text-foreground')}>
              {item.code}: {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
