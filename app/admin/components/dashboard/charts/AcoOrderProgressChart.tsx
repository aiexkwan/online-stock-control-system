'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Recharts components - dynamically imported to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false });
import { useGetAcoOrdersForChartQuery } from '@/lib/graphql/generated/apollo-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AcoOrderProgressChartProps {
  timeFrame?: any;
}

export default function AcoOrderProgressChart({ timeFrame }: AcoOrderProgressChartProps) {
  // Check feature flag
  const isGraphQLAnalysisEnabled = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS === 'true';

  const { data, loading, error } = useGetAcoOrdersForChartQuery({
    skip: !isGraphQLAnalysisEnabled,
    pollInterval: 300000, // 5 minutes
    fetchPolicy: 'cache-and-network',
  });

  const chartData = useMemo(() => {
    if (!data?.record_acoCollection?.edges) return [];

    return data.record_acoCollection.edges
      .map(({ node }) => {
        const completedQty = node.finished_qty || 0;
        const remainingQty = Math.max(0, node.required_qty - completedQty);
        const completionRate = node.required_qty > 0 ? (completedQty / node.required_qty) * 100 : 0;

        return {
          orderRef: `#${node.order_ref}`,
          code: node.code,
          completed: completedQty,
          remaining: remainingQty,
          total: node.required_qty,
          completionRate: Math.round(completionRate),
        };
      })
      .slice(0, 10); // Show top 10 orders
  }, [data]);

  if (!isGraphQLAnalysisEnabled) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>GraphQL analysis is disabled. Enable NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS to view this chart.</AlertDescription>
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
        <AlertDescription>Failed to load order data: {error.message}</AlertDescription>
      </Alert>
    );
  }

  const getBarColor = (completionRate: number) => {
    if (completionRate >= 80) return '#10b981'; // green
    if (completionRate >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4'>
        <p className='text-sm text-white/60'>
          Showing completion progress for the latest 10 ACO orders
        </p>
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
            <XAxis
              dataKey='orderRef'
              angle={-45}
              textAnchor='end'
              height={80}
              className='text-xs'
            />
            <YAxis
              label={{
                value: 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                      <p className='font-medium'>{data.orderRef}</p>
                      <p className='text-sm text-white/60'>Product: {data.code}</p>
                      <p className='text-sm'>
                        Completed: {data.completed}/{data.total}
                      </p>
                      <p className='text-sm font-medium text-primary'>
                        Completion Rate: {data.completionRate}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              content={() => (
                <div className='mt-4 flex justify-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-green-500' />
                    <span className='text-xs'>≥80%</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-amber-500' />
                    <span className='text-xs'>50-79%</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-red-500' />
                    <span className='text-xs'>&lt;50%</span>
                  </div>
                </div>
              )}
            />
            <Bar dataKey='completionRate' radius={[8, 8, 0, 0]}>
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
